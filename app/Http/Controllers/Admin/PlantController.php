<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PlantRequest;
use App\Imports\PlantImport;
use App\Models\Plant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException as ExcelValidationException;

class PlantController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        // Get initial data for the page
        $plants = Plant::with(['users'])
            ->when($request->search, function ($query, $search) {
                $query->where('plant_name', 'like', "%{$search}%");
            })
            ->paginate(15)
            ->withQueryString();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $plants
            ]);
        }

        return Inertia::render('admin/plants/index', [
            'plants' => $plants,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): JsonResponse
    {
        return response()->json([]);
    }

    /**
     * Get paginated plants data for DataTable
     */
    public function tableData(Request $request): JsonResponse
    {
        $query = Plant::with(['users']);

        // Apply search filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('plant_name', 'like', '%' . $search . '%')
                  ->orWhere('address', 'like', '%' . $search . '%')
                  ->orWhere('telephone', 'like', '%' . $search . '%');
            });
        }

        // Apply other filters
        if ($request->filled('plant_name') && $request->get('plant_name') !== 'all') {
            $query->where('plant_name', 'like', '%' . $request->get('plant_name') . '%');
        }

        if ($request->filled('address') && $request->get('address') !== 'all') {
            $query->where('address', 'like', '%' . $request->get('address') . '%');
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        // Map frontend sort keys to database columns
        $sortMapping = [
            'plant_id' => 'plant_id',
            'plant_name' => 'plant_name',
            'address' => 'address',
            'telephone' => 'telephone',
            'users' => 'plant_id', // Will be handled by relationship count
            'created_at' => 'created_at'
        ];
        
        $dbSortBy = $sortMapping[$sortBy] ?? 'created_at';
        
        // Special handling for relationship counts
        if ($sortBy === 'users') {
            $query->withCount('users')->orderBy('users_count', $sortDirection);
        } else {
            $query->orderBy($dbSortBy, $sortDirection);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $plants = $query->paginate($perPage);

        return response()->json([
            'data' => $plants->items(),
            'meta' => [
                'current_page' => $plants->currentPage(),
                'last_page' => $plants->lastPage(),
                'per_page' => $plants->perPage(),
                'total' => $plants->total(),
                'from' => $plants->firstItem(),
                'to' => $plants->lastItem(),
            ],
        ]);
    }

    public function store(PlantRequest $request): RedirectResponse|JsonResponse
    {
        $plant = Plant::create($request->validated());
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Plant created successfully.',
                'data' => $plant
            ]);
        }

        return redirect()->route('admin.plants.index')
            ->with('success', 'Plant created successfully.');
    }

    public function show(Plant $plant, Request $request): JsonResponse
    {
        $plant->load(['users']);
        
        return response()->json([
            'data' => $plant
        ]);
    }

    public function edit(Plant $plant): JsonResponse
    {
        return response()->json([
            'plant' => $plant,
        ]);
    }

    public function update(PlantRequest $request, Plant $plant): RedirectResponse|JsonResponse
    {
        $plant->update($request->validated());
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Plant updated successfully.',
                'data' => $plant
            ]);
        }

        return redirect()->route('admin.plants.index')
            ->with('success', 'Plant updated successfully.');
    }

    public function destroy(Plant $plant, Request $request): RedirectResponse|JsonResponse
    {
        $forceDelete = $request->boolean('force', false);
        
        // Check for foreign key constraints before deletion
        $userCount = $plant->users()->count();
        $equipmentCount = $plant->equipments()->count();
        
        if (($userCount > 0 || $equipmentCount > 0) && !$forceDelete) {
            $errorMessage = 'Cannot archive plant. It has ';
            $dependencies = [];
            
            if ($userCount > 0) {
                $dependencies[] = "{$userCount} user(s)";
            }
            if ($equipmentCount > 0) {
                $dependencies[] = "{$equipmentCount} equipment item(s)";
            }
            
            $errorMessage .= implode(' and ', $dependencies) . ' assigned to it.';

            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'plant' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 422);
            }

            return redirect()->route('admin.plants.index')
                ->with('error', $errorMessage);
        }

        // If force delete is enabled, nullify related records
        if ($forceDelete) {
            $this->forceDeletePlantWithRelations($plant);
            $message = 'Plant deleted and all references set to null successfully.';
        } else {
            $plant->delete(); // This is now a soft delete due to SoftDeletes trait
            $message = 'Plant archived successfully.';
        }

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => $message
            ]);
        }

        return redirect()->route('admin.plants.index')
            ->with('success', $message);
    }

    /**
     * Restore a soft deleted plant
     */
    public function restore($id, Request $request): RedirectResponse|JsonResponse
    {
        $plant = Plant::onlyTrashed()->where('plant_id', $id)->first();
        
        if (!$plant) {
            $errorMessage = 'Archived plant not found.';
            
            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'plant' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 404);
            }

            return redirect()->route('admin.plants.index')
                ->with('error', $errorMessage);
        }

        $plant->restore();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Plant restored successfully.'
            ]);
        }

        return redirect()->route('admin.plants.index')
            ->with('success', 'Plant restored successfully.');
    }

    /**
     * Permanently delete a plant (force delete)
     */
    public function forceDelete($id, Request $request): RedirectResponse|JsonResponse
    {
        $plant = Plant::onlyTrashed()->where('plant_id', $id)->first();
        
        if (!$plant) {
            $errorMessage = 'Archived plant not found.';
            
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'plant' => $errorMessage
                ]);
            }

            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 404);
            }

            return redirect()->route('admin.plants.archived')
                ->with('error', $errorMessage);
        }

        $plant->forceDelete();

        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Plant permanently deleted.'
            ]);
        }

        return redirect()->route('admin.plants.archived')
            ->with('success', 'Plant permanently deleted.');
    }

    /**
     * Get archived plants for display
     */
    public function archived(Request $request): Response|JsonResponse
    {
        $query = Plant::onlyTrashed();

        // Add search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('plant_name', 'like', "%{$search}%")
                  ->orWhere('plant_id', 'like', "%{$search}%");
            });
        }

        $plants = $query->orderBy('deleted_at', 'desc')
                       ->paginate($request->get('per_page', 10));

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => [
                    'data' => $plants->items(),
                    'current_page' => $plants->currentPage(),
                    'last_page' => $plants->lastPage(),
                    'per_page' => $plants->perPage(),
                    'total' => $plants->total(),
                    'from' => $plants->firstItem(),
                    'to' => $plants->lastItem(),
                ]
            ]);
        }

        return Inertia::render('admin/plants/archived', [
            'plants' => $plants,
        ]);
    }

    /**
     * Search plants for smart select
     */
    public function searchPlants(Request $request): JsonResponse
    {
        $search = $request->input('search', '');
        
        $plants = Plant::where('plant_name', 'like', "%{$search}%")
            ->limit(10)
            ->get()
            ->map(function ($plant) {
                return [
                    'label' => $plant->plant_name,
                    'value' => (int)$plant->plant_id // Cast to integer to ensure numeric value
                ];
            });
            
        return response()->json($plants);
    }
    
    /**
     * Create a new plant on-the-fly
     */
    public function createPlant(Request $request): JsonResponse
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
                            $fail('Plant name can only contain letters, numbers, spaces, hyphens, and underscores.');
                        }
                    }
                ]
            ]);
            
            // Check if plant already exists
            $existingPlant = Plant::where('plant_name', $validated['name'])->first();
            
            if ($existingPlant) {
                // Return existing plant with correct label and numeric ID
                return response()->json([
                    'label' => $existingPlant->plant_name, // Display name
                    'value' => (int)$existingPlant->plant_id // Numeric ID for backend
                ]);
            }
            
            // Create new plant
            $plant = Plant::create([
                'plant_name' => $validated['name']
            ]);
            
            // Return the new plant with correct label and numeric ID
            return response()->json([
                'label' => $plant->plant_name, // Display name
                'value' => (int)$plant->plant_id // Numeric ID for backend
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return validation errors in a standardized format
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create plant: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Force delete plant and set related foreign keys to null
     */
    private function forceDeletePlantWithRelations(Plant $plant): void
    {
        \DB::transaction(function () use ($plant) {
            // 1. Set plant_id to null in users table
            \DB::table('users')
                ->where('plant_id', $plant->plant_id)
                ->update(['plant_id' => null]);

            // 2. Set plant_id to null in equipments table
            \DB::table('equipments')
                ->where('plant_id', $plant->plant_id)
                ->update(['plant_id' => null]);

            // 3. Finally, force delete the plant itself
            $plant->forceDelete();
        });
    }

    /**
     * Import plants from Excel file
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
        ]);

        try {
            $import = new PlantImport();
            Excel::import($import, $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'Plants imported successfully!'
            ]);
        } catch (ExcelValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors occurred during import.',
                'errors' => $e->failures()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Plant import failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download sample Excel template for plant import
     */
    public function downloadTemplate(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $headers = ['plant_name', 'address', 'telephone'];

        $sampleData = [
            ['P1', '123 Industrial Ave, Plant 1 District, 12345', '555-001-0001'],
            ['P2', '456 Manufacturing Blvd, Plant 2 District, 23456', '555-002-0002'],
            ['P3', '789 Production Road, Plant 3 District, 34567', '555-003-0003']
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
        
        $fileName = 'plant_import_template.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), $fileName);
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }

    /**
     * Batch delete multiple plants
     */
    public function batchDestroy(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:plants,plant_id',
            'force' => 'boolean'
        ]);

        $plantIds = $request->input('ids');
        $forceDelete = $request->boolean('force', false);

        $plants = Plant::whereIn('plant_id', $plantIds)->get();
        
        $errors = [];
        $deleted = [];
        $failed = [];

        foreach ($plants as $plant) {
            try {
                // Check for foreign key constraints
                $userCount = $plant->users()->count();
                $equipmentCount = $plant->equipments()->count();

                if (($userCount > 0 || $equipmentCount > 0) && !$forceDelete) {
                    $dependencies = [];
                    if ($userCount > 0) {
                        $dependencies[] = "{$userCount} user(s)";
                    }
                    if ($equipmentCount > 0) {
                        $dependencies[] = "{$equipmentCount} equipment item(s)";
                    }
                    
                    $failed[] = [
                        'id' => $plant->plant_id,
                        'name' => $plant->plant_name,
                        'reason' => 'Has ' . implode(' and ', $dependencies) . ' assigned'
                    ];
                    continue;
                }

                // Perform deletion
                if ($forceDelete) {
                    $this->forceDeletePlantWithRelations($plant);
                } else {
                    $plant->delete(); // Soft delete
                }

                $deleted[] = [
                    'id' => $plant->plant_id,
                    'name' => $plant->plant_name
                ];

            } catch (\Exception $e) {
                $failed[] = [
                    'id' => $plant->plant_id,
                    'name' => $plant->plant_name,
                    'reason' => 'Deletion failed: ' . $e->getMessage()
                ];
            }
        }

        $message = sprintf(
            'Batch operation completed. %d plant(s) %s successfully.',
            count($deleted),
            $forceDelete ? 'deleted' : 'archived'
        );

        if (count($failed) > 0) {
            $message .= sprintf(' %d plant(s) could not be processed.', count($failed));
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
