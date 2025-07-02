<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\LocationRequest;
use App\Imports\LocationImport;
use App\Models\Department;
use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException as ExcelValidationException;

class LocationController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $limit = $request->input('limit', 15); // Default to 15 if not provided
        
        $locations = Location::with(['department'])
            ->when($request->search, function ($query, $search) {
                $query->where('location_name', 'like', "%{$search}%");
            })
            ->when($request->department_id, function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->paginate($limit)
            ->withQueryString();

        $departments = Department::all();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $locations,
                'departments' => $departments
            ]);
        }

        return Inertia::render('admin/locations/index', [
            'locations' => $locations,
            'departments' => $departments,
            'filters' => $request->only(['search', 'department_id']),
        ]);
    }

    public function create(): JsonResponse
    {
        $departments = Department::all();

        return response()->json([
            'departments' => $departments,
        ]);
    }

    /**
     * Get paginated locations data for DataTable
     */
    public function tableData(Request $request): JsonResponse
    {
        $query = Location::with(['department']);

        // Apply search filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('location_name', 'like', '%' . $search . '%')
                  ->orWhereHas('department', function($dq) use ($search) {
                      $dq->where('department_name', 'like', '%' . $search . '%');
                  });
            });
        }

        // Apply other filters
        if ($request->filled('location_name') && $request->get('location_name') !== 'all') {
            $query->where('location_name', 'like', '%' . $request->get('location_name') . '%');
        }

        if ($request->filled('department_id') && $request->get('department_id') !== 'all') {
            $query->where('department_id', $request->get('department_id'));
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'updated_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        // Map frontend sort keys to database columns
        $sortMapping = [
            'location_id' => 'location_id',
            'location_name' => 'location_name',
            'department_name' => 'department_id', // Will be handled by join
            'equipment' => 'location_id', // Will be handled by relationship count
            'created_at' => 'updated_at'
        ];
        
        $dbSortBy = $sortMapping[$sortBy] ?? 'updated_at';
        
        // Special handling for relationship counts and joins
        if ($sortBy === 'equipment') {
            $query->withCount('equipment')->orderBy('equipment_count', $sortDirection);
        } elseif ($sortBy === 'department_name') {
            $query->leftJoin('departments', 'locations.department_id', '=', 'departments.department_id')
                  ->orderBy('departments.department_name', $sortDirection)
                  ->select('locations.*');
        } else {
            $query->orderBy($dbSortBy, $sortDirection);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $locations = $query->paginate($perPage);

        return response()->json([
            'data' => $locations->items(),
            'meta' => [
                'current_page' => $locations->currentPage(),
                'last_page' => $locations->lastPage(),
                'per_page' => $locations->perPage(),
                'total' => $locations->total(),
                'from' => $locations->firstItem(),
                'to' => $locations->lastItem(),
            ],
        ]);
    }

    public function store(LocationRequest $request): RedirectResponse|JsonResponse
    {
        // Make department_id optional in the request
        $data = $request->validated();
        
        // If department_id is empty string, set it to null
        if (isset($data['department_id']) && $data['department_id'] === '') {
            $data['department_id'] = null;
        }
        
        $location = Location::create($data);

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Location created successfully.',
                'data' => $location
            ]);
        }

        return redirect()->route('admin.locations.index')
            ->with('success', 'Location created successfully.');
    }

    public function show(Location $location, Request $request): JsonResponse
    {
        $location->load(['department']);
        
        return response()->json([
            'data' => $location
        ]);
    }

    public function edit(Location $location): JsonResponse
    {
        $departments = Department::all();

        return response()->json([
            'location' => $location,
            'departments' => $departments,
        ]);
    }

    public function update(LocationRequest $request, Location $location): RedirectResponse|JsonResponse
    {
        $location->update($request->validated());

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Location updated successfully.',
                'data' => $location
            ]);
        }

        return redirect()->route('admin.locations.index')
            ->with('success', 'Location updated successfully.');
    }

    public function destroy(Location $location, Request $request): RedirectResponse|JsonResponse
    {
        $forceDelete = $request->boolean('force', false);
        
        // Check if location has related tracking records
        $trackIncomingCount = $location->trackIncoming()->count();
        $trackOutgoingCount = $location->trackOutgoing()->count();
        
        if (($trackIncomingCount > 0 || $trackOutgoingCount > 0) && !$forceDelete) {
            $errorMessage = "Cannot archive location '{$location->location_name}' because it has {$trackIncomingCount} incoming tracking record(s) and {$trackOutgoingCount} outgoing tracking record(s). Please reassign or remove these records first.";
            
            // For Inertia requests, we need to throw a validation exception
            if ($request->header('X-Inertia')) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'location' => $errorMessage
                ]);
            }
            
            // Return JSON error for AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 422);
            }

            return redirect()->route('admin.locations.index')
                ->with('error', $errorMessage);
        }

        // If force delete is enabled, nullify related records
        if ($forceDelete) {
            $this->forceDeleteLocationWithRelations($location);
            $message = 'Location deleted and all references set to null successfully.';
        } else {
            $location->delete(); // This is now a soft delete due to SoftDeletes trait
            $message = 'Location archived successfully.';
        }

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => $message
            ]);
        }

        return redirect()->route('admin.locations.index')
            ->with('success', $message);
    }

    /**
     * Restore a soft deleted location
     */
    public function restore($id, Request $request): RedirectResponse|JsonResponse
    {
        $location = Location::onlyTrashed()->where('location_id', $id)->first();
        
        if (!$location) {
            $errorMessage = 'Archived location not found.';
            
            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'location' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 404);
            }

            return redirect()->route('admin.locations.index')
                ->with('error', $errorMessage);
        }

        $location->restore();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Location restored successfully.'
            ]);
        }

        return redirect()->route('admin.locations.index')
            ->with('success', 'Location restored successfully.');
    }

    /**
     * Get archived locations for display
     */
    public function archived(Request $request): Response|JsonResponse
    {
        $query = Location::onlyTrashed()
            ->with(['department']);

        // Add search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('location_name', 'like', "%{$search}%")
                  ->orWhere('location_id', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($dq) use ($search) {
                      $dq->where('department_name', 'like', "%{$search}%");
                  });
            });
        }

        $locations = $query->orderBy('deleted_at', 'desc')
                          ->paginate($request->get('per_page', 10));

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => [
                    'data' => $locations->items(),
                    'current_page' => $locations->currentPage(),
                    'last_page' => $locations->lastPage(),
                    'per_page' => $locations->perPage(),
                    'total' => $locations->total(),
                    'from' => $locations->firstItem(),
                    'to' => $locations->lastItem(),
                ]
            ]);
        }

        return Inertia::render('admin/locations/archived', [
            'locations' => $locations,
        ]);
    }

    /**
     * Search locations for smart select
     */
    public function searchLocations(Request $request): JsonResponse
    {
        $search = $request->input('search', '');
        $departmentId = $request->input('department_id');
        $limit = $request->input('limit', 10); // Default to 10 if not provided
        
        $query = Location::query();
        
        // Filter by search term if provided
        if (!empty($search)) {
            $query->where('location_name', 'like', "%{$search}%");
        }
        
        // Filter by department if provided
        if (!empty($departmentId)) {
            $query->where('department_id', $departmentId);
        }
        
        $locations = $query->limit($limit)
            ->get()
            ->map(function ($location) {
                return [
                    'label' => $location->location_name,
                    'value' => (int)$location->location_id // Cast to integer to ensure numeric value
                ];
            });
            
        return response()->json($locations);
    }

    /**
     * Create a new location on-the-fly
     */
    public function createLocation(Request $request): JsonResponse
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
                            $fail('Location name can only contain letters, numbers, spaces, hyphens, and underscores.');
                        }
                    }
                ],
                'department_id' => 'nullable|exists:departments,department_id'
            ]);
            
            // Check if location already exists (optionally within the same department)
            $query = Location::where('location_name', $validated['name']);
            if (isset($validated['department_id'])) {
                $query->where('department_id', $validated['department_id']);
            }
            $existingLocation = $query->first();
            
            if ($existingLocation) {
                // Load the department relationship for display
                $existingLocation->load('department');
                
                // Return existing location with correct label and numeric ID
                return response()->json([
                    'label' => $existingLocation->location_name . 
                        ($existingLocation->department ? " ({$existingLocation->department->department_name})" : ''),
                    'value' => (int)$existingLocation->location_id // Numeric ID for backend
                ]);
            }
            
            // Create new location
            $location = Location::create([
                'location_name' => $validated['name'],
                'department_id' => $validated['department_id'] ?? null
            ]);
            
            // Load the department relationship for display
            $location->load('department');
            
            // Return the new location with correct label and numeric ID
            return response()->json([
                'label' => $location->location_name . 
                    ($location->department ? " ({$location->department->department_name})" : ''),
                'value' => (int)$location->location_id // Numeric ID for backend
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return validation errors in a standardized format
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create location: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Force delete location and set related foreign keys to null
     */
    private function forceDeleteLocationWithRelations(Location $location)
    {
        \DB::transaction(function () use ($location) {
            // 1. Set location_id to null in track_incoming records
            \DB::table('track_incoming')
                ->where('location_id', $location->location_id)
                ->update(['location_id' => null]);

            // 2. Set location_id to null in equipments table
            \DB::table('equipments')
                ->where('location_id', $location->location_id)
                ->update(['location_id' => null]);

            // 3. Finally, force delete the location itself
            $location->forceDelete();
        });

        return response()->json([
            'message' => 'Location permanently deleted successfully',
            'location' => $location
        ]);
    }

    /**
     * Import locations from Excel file
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
        ]);

        try {
            $import = new LocationImport();
            Excel::import($import, $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'Locations imported successfully!'
            ]);
        } catch (ExcelValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors occurred during import.',
                'errors' => $e->failures()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Location import failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download sample Excel template for location import
     */
    public function downloadTemplate(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $headers = ['location_name', 'department_name'];

        $sampleData = [
            ['Annex A', 'Calibrations'],
            ['Annex B', 'Tracking'],
            ['Building B', 'Constructions'],
            ['Building A Floor 2', 'HR'],
            ['Building B Basement', 'Electrical']
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
        
        $fileName = 'location_import_template.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), $fileName);
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }

    /**
     * Batch delete multiple locations
     */
    public function batchDestroy(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:locations,location_id',
            'force' => 'boolean'
        ]);

        $locationIds = $request->input('ids');
        $forceDelete = $request->boolean('force', false);

        $locations = Location::whereIn('location_id', $locationIds)->get();
        
        $errors = [];
        $deleted = [];
        $failed = [];

        foreach ($locations as $location) {
            try {
                // Check for foreign key constraints
                $trackIncomingCount = $location->trackIncoming()->count();
                $trackOutgoingCount = $location->trackOutgoing()->count();
                $equipmentCount = $location->equipment()->count();

                if (($trackIncomingCount > 0 || $trackOutgoingCount > 0 || $equipmentCount > 0) && !$forceDelete) {
                    $dependencies = [];
                    if ($trackIncomingCount > 0) {
                        $dependencies[] = "{$trackIncomingCount} incoming tracking record(s)";
                    }
                    if ($trackOutgoingCount > 0) {
                        $dependencies[] = "{$trackOutgoingCount} outgoing tracking record(s)";
                    }
                    if ($equipmentCount > 0) {
                        $dependencies[] = "{$equipmentCount} equipment item(s)";
                    }
                    
                    $failed[] = [
                        'id' => $location->location_id,
                        'name' => $location->location_name,
                        'reason' => 'Has ' . implode(', ', $dependencies)
                    ];
                    continue;
                }

                // Perform deletion
                if ($forceDelete) {
                    $this->forceDeleteLocationWithRelations($location);
                } else {
                    $location->delete(); // Soft delete
                }

                $deleted[] = [
                    'id' => $location->location_id,
                    'name' => $location->location_name
                ];

            } catch (\Exception $e) {
                $failed[] = [
                    'id' => $location->location_id,
                    'name' => $location->location_name,
                    'reason' => 'Deletion failed: ' . $e->getMessage()
                ];
            }
        }

        $message = sprintf(
            'Batch operation completed. %d location(s) %s successfully.',
            count($deleted),
            $forceDelete ? 'deleted' : 'archived'
        );

        if (count($failed) > 0) {
            $message .= sprintf(' %d location(s) could not be processed.', count($failed));
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'deleted_count' => count($deleted),
            'failed_count' => count($failed),
            'deleted' => $deleted,
            'failed' => $failed,
            'force_delete' => $forceDelete
        ]);
    }
}
