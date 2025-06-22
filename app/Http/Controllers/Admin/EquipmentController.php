<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EquipmentRequest;
use App\Imports\EquipmentImport;
use App\Models\Equipment;
use App\Models\User;
use App\Models\Plant;
use App\Models\Department;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException as ExcelValidationException;

class EquipmentController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with(['role', 'department'])
            ->orderBy('first_name')
            ->get();

        $plants = Plant::orderBy('plant_name')->get();
        $departments = Department::orderBy('department_name')->get();
        $locations = Location::with('department')->orderBy('location_name')->get();

        return Inertia::render('admin/equipment/index', [
            'users' => $users,
            'plants' => $plants,
            'departments' => $departments,
            'locations' => $locations,
        ]);
    }

    public function tableData(Request $request): JsonResponse
    {
        $filters = ['search', 'employee_id', 'manufacturer', 'status', 'plant_id', 'department_id'];
        
        $equipments = Equipment::with(['user.role', 'user.department', 'plant', 'department', 'location'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('recall_number', 'like', "%{$search}%")
                      ->orWhere('serial_number', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('manufacturer', 'like', "%{$search}%");
                });
            })
            ->when($request->employee_id !== null, function ($query) use ($request) {
                if ($request->employee_id === 'unassigned') {
                    $query->whereNull('employee_id');
                } elseif ($request->employee_id !== '' && $request->employee_id !== 'all') {
                    $query->where('employee_id', $request->employee_id);
                }
            })
            ->when($request->status && $request->status !== 'all', function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->plant_id && $request->plant_id !== 'all', function ($query, $plantId) {
                $query->where('plant_id', $plantId);
            })
            ->when($request->department_id && $request->department_id !== 'all', function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->when($request->manufacturer, function ($query, $manufacturer) {
                $query->where('manufacturer', 'like', "%{$manufacturer}%");
            })
            ->when($request->sort_by, function ($query, $sortBy) {
                $direction = $request->sort_direction === 'desc' ? 'desc' : 'asc';
                
                if (in_array($sortBy, ['equipment_id', 'recall_number', 'serial_number', 'description', 'manufacturer', 'status', 'created_at'])) {
                    $query->orderBy($sortBy, $direction);
                } elseif ($sortBy === 'user_name') {
                    $query->leftJoin('users', 'equipment.employee_id', '=', 'users.employee_id')
                          ->orderBy('users.first_name', $direction)
                          ->orderBy('users.last_name', $direction)
                          ->select('equipment.*');
                } elseif ($sortBy === 'plant_name') {
                    $query->leftJoin('plants', 'equipment.plant_id', '=', 'plants.plant_id')
                          ->orderBy('plants.plant_name', $direction)
                          ->select('equipment.*');
                } elseif ($sortBy === 'department_name') {
                    $query->leftJoin('departments', 'equipment.department_id', '=', 'departments.department_id')
                          ->orderBy('departments.department_name', $direction)
                          ->select('equipment.*');
                }
            }, function ($query) {
                $query->orderBy('created_at', 'desc');
            })
            ->paginate($request->per_page ?? 15)
            ->withQueryString();

        return response()->json([
            'data' => $equipments->items(),
            'meta' => [
                'current_page' => $equipments->currentPage(),
                'last_page' => $equipments->lastPage(),
                'per_page' => $equipments->perPage(),
                'total' => $equipments->total(),
                'from' => $equipments->firstItem(),
                'to' => $equipments->lastItem(),
            ],
            'filters' => $request->only($filters),
        ]);
    }

    public function create(): JsonResponse
    {
        $users = User::with(['role', 'department'])
            ->orderBy('first_name')
            ->get();

        $plants = Plant::orderBy('plant_name')->get();
        $departments = Department::orderBy('department_name')->get();
        $locations = Location::with('department')->orderBy('location_name')->get();

        return response()->json([
            'users' => $users,
            'plants' => $plants,
            'departments' => $departments,
            'locations' => $locations,
        ]);
    }

    public function store(EquipmentRequest $request): RedirectResponse
    {
        Equipment::create($request->validated());

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Equipment created successfully.');
    }

    public function show(Equipment $equipment, Request $request): JsonResponse
    {
        $equipment->load(['user.role', 'user.department', 'plant', 'department', 'location', 'trackIncoming']);
        
        return response()->json([
            'data' => $equipment
        ]);
    }

    public function edit(Equipment $equipment): JsonResponse
    {
        $users = User::with(['role', 'department'])
            ->orderBy('first_name')
            ->get();

        $plants = Plant::orderBy('plant_name')->get();
        $departments = Department::orderBy('department_name')->get();
        $locations = Location::with('department')->orderBy('location_name')->get();

        return response()->json([
            'equipment' => $equipment,
            'users' => $users,
            'plants' => $plants,
            'departments' => $departments,
            'locations' => $locations,
        ]);
    }

    public function update(EquipmentRequest $request, Equipment $equipment): RedirectResponse
    {
        $equipment->update($request->validated());

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Equipment updated successfully.');
    }

    public function destroy(Equipment $equipment, Request $request): RedirectResponse|JsonResponse
    {
        $forceDelete = $request->boolean('force', false);
        
        // Check for foreign key constraints before deletion
        $trackIncomingCount = $equipment->trackIncoming()->count();

        if ($trackIncomingCount > 0 && !$forceDelete) {
            $errorMessage = "Cannot archive equipment. It has {$trackIncomingCount} tracking record(s) associated with it.";

            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'equipment' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 422);
            }

            return redirect()->route('admin.equipment.index')
                ->with('error', $errorMessage);
        }

        // If force delete is enabled, delete equipment and all related tracking records
        if ($forceDelete) {
            $this->forceDeleteEquipmentWithRelations($equipment);
            $message = 'Equipment and all related tracking records permanently deleted.';
        } else {
            $equipment->delete(); // This is now a soft delete due to SoftDeletes trait
            $message = 'Equipment archived successfully.';
        }

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => $message
            ]);
        }

        return redirect()->route('admin.equipment.index')
            ->with('success', $message);
    }

    /**
     * Restore a soft deleted equipment
     */
    public function restore($id, Request $request): RedirectResponse|JsonResponse
    {
        $equipment = Equipment::onlyTrashed()->where('equipment_id', $id)->first();
        
        if (!$equipment) {
            $errorMessage = 'Archived equipment not found.';
            
            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'equipment' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 404);
            }

            return redirect()->route('admin.equipment.index')
                ->with('error', $errorMessage);
        }

        $equipment->restore();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Equipment restored successfully.'
            ]);
        }

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Equipment restored successfully.');
    }

    /**
     * Search plants for smart select
     */
    public function searchPlants(Request $request): JsonResponse
    {
        $search = $request->get('search', '');
        $limit = $request->get('limit', 10);

        $plants = Plant::when($search, function ($query, $search) {
                return $query->where('plant_name', 'like', "%{$search}%");
            })
            ->orderBy('plant_name')
            ->limit($limit)
            ->get(['plant_id', 'plant_name']);

        return response()->json([
            'data' => $plants
        ]);
    }

    /**
     * Search departments for smart select
     */
    public function searchDepartments(Request $request): JsonResponse
    {
        $search = $request->get('search', '');
        $limit = $request->get('limit', 10);

        $departments = Department::when($search, function ($query, $search) {
                return $query->where('department_name', 'like', "%{$search}%");
            })
            ->orderBy('department_name')
            ->limit($limit)
            ->get(['department_id', 'department_name']);

        return response()->json([
            'data' => $departments
        ]);
    }

    /**
     * Search locations for smart select
     */
    public function searchLocations(Request $request): JsonResponse
    {
        $search = $request->get('search', '');
        $departmentId = $request->get('department_id');
        $limit = $request->get('limit', 10);

        $locations = Location::with('department')
            ->when($search, function ($query, $search) {
                return $query->where('location_name', 'like', "%{$search}%");
            })
            ->when($departmentId, function ($query, $departmentId) {
                return $query->where('department_id', $departmentId);
            })
            ->orderBy('location_name')
            ->limit($limit)
            ->get(['location_id', 'location_name', 'department_id']);

        return response()->json([
            'data' => $locations
        ]);
    }

    /**
     * Get archived equipment for display
     */
    public function archived(Request $request): Response|JsonResponse
    {
        $query = Equipment::onlyTrashed()
            ->with(['department', 'location', 'user']);

        // Add search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }

        $equipment = $query->orderBy('deleted_at', 'desc')
                          ->paginate($request->get('per_page', 10));

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => [
                    'data' => $equipment->items(),
                    'current_page' => $equipment->currentPage(),
                    'last_page' => $equipment->lastPage(),
                    'per_page' => $equipment->perPage(),
                    'total' => $equipment->total(),
                    'from' => $equipment->firstItem(),
                    'to' => $equipment->lastItem(),
                ]
            ]);
        }

        return Inertia::render('admin/equipment/archived', [
            'equipment' => $equipment,
        ]);
    }

    /**
     * Force delete equipment and delete all related tracking records
     */
    private function forceDeleteEquipmentWithRelations(Equipment $equipment)
    {
        \DB::transaction(function () use ($equipment) {
            // 1. Get all track_incoming records for this equipment
            $trackIncomingIds = \DB::table('track_incoming')
                ->where('equipment_id', $equipment->equipment_id)
                ->pluck('id');

            // 2. Delete track_outgoing records that reference these track_incoming records
            if ($trackIncomingIds->isNotEmpty()) {
                \DB::table('track_outgoing')
                    ->whereIn('incoming_id', $trackIncomingIds)
                    ->delete();
            }

            // 3. Delete track_incoming records for this equipment
            \DB::table('track_incoming')
                ->where('equipment_id', $equipment->equipment_id)
                ->delete();

            // 4. Finally, force delete the equipment itself
            $equipment->forceDelete();
        });

        return response()->json([
            'message' => 'Equipment permanently deleted successfully',
            'equipment' => $equipment
        ]);
    }

    /**
     * Import equipment from Excel file
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
        ]);

        try {
            $import = new EquipmentImport();
            Excel::import($import, $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'Equipment imported successfully!'
            ]);
        } catch (ExcelValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors occurred during import.',
                'errors' => $e->failures()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Equipment import failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download sample Excel template for equipment import
     */
    public function downloadTemplate(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $headers = [
            'recall_number',
            'serial_number',
            'description',
            'model',
            'manufacturer',
            'employee_name',
            'plant_name',
            'department_name',
            'location_name',
            'status',
            'last_calibration_date',
            'next_calibration_due',
            'process_req_range'
        ];

        $sampleData = [
            [
                'RN001',
                'CAL-2024-001',
                'Digital Multimeter',
                'Fluke 87V',
                'Fluke Corporation',
                'Derick Espinosa',
                'P1',
                'Calibrations',
                'Annex A',
                'active',
                '2024-01-15',
                '2025-01-15',
                '0-1000V DC/AC'
            ],
            [
                'RN002',
                'TRK-2024-002',
                'Temperature Logger',
                'TempTracker Pro',
                'DataLogger Inc',
                'Maria Santos',
                'P2',
                'Tracking',
                'Annex B',
                'pending_calibration',
                '2023-12-20',
                '2024-12-20',
                '-40°C to 85°C'
            ],
            [
                'RN003',
                'ELE-2024-003',
                'Oscilloscope',
                'DSO5034A',
                'Keysight Technologies',
                'John Rodriguez',
                'P3',
                'Electrical',
                'Building B Basement',
                'in_calibration',
                '2024-03-10',
                '2025-03-10',
                '350MHz, 4 Channels'
            ]
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
        
        $fileName = 'equipment_import_template.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), $fileName);
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }
}
