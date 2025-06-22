<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\DepartmentRequest;
use App\Imports\DepartmentImport;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException as ExcelValidationException;

class DepartmentController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $departments = Department::with(['users', 'locations'])
            ->when($request->search, function ($query, $search) {
                $query->where('department_name', 'like', "%{$search}%");
            })
            ->paginate(15)
            ->withQueryString();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $departments
            ]);
        }

        return Inertia::render('admin/departments/index', [
            'departments' => $departments,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/departments/create');
    }

    public function store(DepartmentRequest $request): RedirectResponse|JsonResponse
    {
        $department = Department::create($request->validated());

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Department created successfully.',
                'data' => $department
            ]);
        }

        return redirect()->route('admin.departments.index')
            ->with('success', 'Department created successfully.');
    }

    public function show(Department $department, Request $request): Response|JsonResponse
    {
        $department->load(['users', 'locations']);
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $department
            ]);
        }
        
        return Inertia::render('admin/departments/show', [
            'department' => $department,
        ]);
    }

    public function edit(Department $department): Response
    {
        return Inertia::render('admin/departments/edit', [
            'department' => $department,
        ]);
    }

    public function update(DepartmentRequest $request, Department $department): RedirectResponse|JsonResponse
    {
        $department->update($request->validated());

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Department updated successfully.',
                'data' => $department
            ]);
        }

        return redirect()->route('admin.departments.index')
            ->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department, Request $request): RedirectResponse|JsonResponse
    {
        $forceDelete = $request->boolean('force', false);
        
        // Check for foreign key constraints before deletion
        $usersCount = $department->users()->count();
        $equipmentCount = $department->equipment()->count();
        $locationsCount = $department->locations()->count();
        $trackingRecordsCount = $this->getTrackingRecordsCount($department);

        if (($usersCount > 0 || $equipmentCount > 0 || $locationsCount > 0 || $trackingRecordsCount > 0) && !$forceDelete) {
            $errorMessage = 'Cannot archive department. It has ';
            $dependencies = [];
            
            if ($usersCount > 0) {
                $dependencies[] = "{$usersCount} user(s)";
            }
            if ($equipmentCount > 0) {
                $dependencies[] = "{$equipmentCount} equipment item(s)";
            }
            if ($locationsCount > 0) {
                $dependencies[] = "{$locationsCount} location(s)";
            }
            if ($trackingRecordsCount > 0) {
                $dependencies[] = "{$trackingRecordsCount} tracking record(s)";
            }
            
            $errorMessage .= implode(', ', $dependencies) . ' assigned to it.';

            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'department' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 422);
            }

            return redirect()->route('admin.departments.index')
                ->with('error', $errorMessage);
        }

        // If force delete is enabled, cascade delete related records
        if ($forceDelete) {
            $this->forceDeleteDepartmentWithRelations($department);
            $message = 'Department deleted and all references set to null successfully.';
        } else {
            $department->delete(); // This is now a soft delete due to SoftDeletes trait
            $message = 'Department archived successfully.';
        }

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => $message
            ]);
        }

        return redirect()->route('admin.departments.index')
            ->with('success', $message);
    }

    /**
     * Get count of tracking records related to this department
     */
    private function getTrackingRecordsCount(Department $department): int
    {
        // Count tracking records where equipment belongs to this department
        $trackingIncomingCount = \DB::table('track_incoming')
            ->join('equipments', 'track_incoming.equipment_id', '=', 'equipments.equipment_id')
            ->where('equipments.department_id', $department->department_id)
            ->whereNull('track_incoming.deleted_at')
            ->count();

        // Count tracking records where users belong to this department
        $trackingByUsersCount = \DB::table('track_incoming')
            ->join('users', function($join) {
                $join->on('track_incoming.technician_id', '=', 'users.employee_id')
                     ->orOn('track_incoming.employee_id_in', '=', 'users.employee_id')
                     ->orOn('track_incoming.received_by_id', '=', 'users.employee_id');
            })
            ->where('users.department_id', $department->department_id)
            ->whereNull('track_incoming.deleted_at')
            ->count();

        return max($trackingIncomingCount, $trackingByUsersCount);
    }

    /**
     * Force delete department and set related foreign keys to null
     */
    private function forceDeleteDepartmentWithRelations(Department $department): void
    {
        \DB::transaction(function () use ($department) {
            // 1. Set department_id to null in users table
            \DB::table('users')
                ->where('department_id', $department->department_id)
                ->update(['department_id' => null]);

            // 2. Set department_id to null in equipments table
            \DB::table('equipments')
                ->where('department_id', $department->department_id)
                ->update(['department_id' => null]);

            // 3. Set department_id to null in locations table (soft delete them)
            \DB::table('locations')
                ->where('department_id', $department->department_id)
                ->update([
                    'department_id' => null,
                    'deleted_at' => now()
                ]);

            // 4. Set foreign keys to null in tracking records for users from this department
            // Update track_incoming where technician belongs to this department
            \DB::table('track_incoming')
                ->whereIn('technician_id', function($query) use ($department) {
                    $query->select('employee_id')
                          ->from('users')
                          ->where('department_id', $department->department_id);
                })
                ->update(['technician_id' => null]);

            // Update track_incoming where employee_id_in belongs to this department
            \DB::table('track_incoming')
                ->whereIn('employee_id_in', function($query) use ($department) {
                    $query->select('employee_id')
                          ->from('users')
                          ->where('department_id', $department->department_id);
                })
                ->update(['employee_id_in' => null]);

            // Update track_incoming where received_by_id belongs to this department
            \DB::table('track_incoming')
                ->whereIn('received_by_id', function($query) use ($department) {
                    $query->select('employee_id')
                          ->from('users')
                          ->where('department_id', $department->department_id);
                })
                ->update(['received_by_id' => null]);

            // 5. Set foreign keys to null in track_incoming for equipment from this department
            \DB::table('track_incoming')
                ->whereIn('equipment_id', function($query) use ($department) {
                    $query->select('equipment_id')
                          ->from('equipments')
                          ->where('department_id', $department->department_id);
                })
                ->update(['equipment_id' => null]);

            // 6. Set foreign keys to null in track_incoming for locations from this department
            \DB::table('track_incoming')
                ->whereIn('location_id', function($query) use ($department) {
                    $query->select('location_id')
                          ->from('locations')
                          ->where('department_id', $department->department_id);
                })
                ->update(['location_id' => null]);

            // 7. Finally, force delete the department itself
            $department->forceDelete();
        });
    }
    

    /**
     * Restore a soft deleted department
     */
    public function restore($id, Request $request): RedirectResponse|JsonResponse
    {
        $department = Department::onlyTrashed()->where('department_id', $id)->first();
        
        if (!$department) {
            $errorMessage = 'Archived department not found.';
            
            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'department' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 404);
            }

            return redirect()->route('admin.departments.index')
                ->with('error', $errorMessage);
        }

        $department->restore();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Department restored successfully.'
            ]);
        }

        return redirect()->route('admin.departments.index')
            ->with('success', 'Department restored successfully.');
    }

    /**
     * Get archived departments for display
     */
    public function archived(Request $request): Response|JsonResponse
    {
        $query = Department::onlyTrashed();

        // Add search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('department_name', 'like', "%{$search}%")
                  ->orWhere('department_id', 'like', "%{$search}%");
            });
        }

        $departments = $query->orderBy('deleted_at', 'desc')
                            ->paginate($request->get('per_page', 10));

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => [
                    'data' => $departments->items(),
                    'current_page' => $departments->currentPage(),
                    'last_page' => $departments->lastPage(),
                    'per_page' => $departments->perPage(),
                    'total' => $departments->total(),
                    'from' => $departments->firstItem(),
                    'to' => $departments->lastItem(),
                ]
            ]);
        }

        return Inertia::render('admin/departments/archived', [
            'departments' => $departments,
        ]);
    }

    /**
     * Search departments for smart select
     */
    public function searchDepartments(Request $request): JsonResponse
    {
        $search = $request->input('search', '');
        $limit = $request->input('limit', 10); // Default to 10 if not provided
        
        $departments = Department::where('department_name', 'like', "%{$search}%")
            ->limit($limit)
            ->get()
            ->map(function ($department) {
                return [
                    'label' => $department->department_name,
                    'value' => (int)$department->department_id // Cast to integer to ensure numeric value
                ];
            });
            
        return response()->json($departments);
    }
    
    /**
     * Create a new department on-the-fly
     */
    public function createDepartment(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    function ($attribute, $value, $fail) {
                        // Custom validation - check if name contains valid characters
                        if (!preg_match('/^[a-zA-Z0-9\s\-_]+$/', $value)) {
                            $fail('Department name can only contain letters, numbers, spaces, hyphens, and underscores.');
                        }
                    }
                ]
            ]);
            
            // Check if department already exists
            $existingDepartment = Department::where('department_name', $validated['name'])->first();
            
            if ($existingDepartment) {
                // Return existing department with correct label and numeric ID
                return response()->json([
                    'label' => $existingDepartment->department_name, // Display name
                    'value' => (int)$existingDepartment->department_id // Numeric ID for backend
                ]);
            }
            
            // Create new department
            $department = Department::create([
                'department_name' => $validated['name']
            ]);
            
            // Return the new department with correct label and numeric ID
            return response()->json([
                'label' => $department->department_name, // Display name
                'value' => (int)$department->department_id // Numeric ID for backend
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return validation errors in a standardized format
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create department: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Import departments from Excel file
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
        ]);

        try {
            $import = new DepartmentImport();
            Excel::import($import, $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'Departments imported successfully!'
            ]);
        } catch (ExcelValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors occurred during import.',
                'errors' => $e->failures()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Department import failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download sample Excel template for department import
     */
    public function downloadTemplate(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $headers = ['department_name'];

        $sampleData = [
            ['Admin'],
            ['Calibrations'],
            ['Tracking'],
            ['Constructions'],
            ['HR'],
            ['Electrical']
        ];

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Add headers
        foreach ($headers as $key => $header) {
            $sheet->setCellValue(chr(65 + $key) . '1', $header);
        }

        // Add sample data
        foreach ($sampleData as $rowIndex => $row) {
            foreach ($row as $colIndex => $value) {
                $sheet->setCellValue(chr(65 + $colIndex) . ($rowIndex + 2), $value);
            }
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        
        $fileName = 'department_import_template.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), $fileName);
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }
}
