<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PlantRequest;
use App\Models\Plant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

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

    public function create(): Response
    {
        return Inertia::render('admin/plants/create');
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

    public function show(Plant $plant, Request $request): Response|JsonResponse
    {
        $plant->load(['users']);
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $plant
            ]);
        }
        
        return Inertia::render('admin/plants/show', [
            'plant' => $plant,
        ]);
    }

    public function edit(Plant $plant): Response
    {
        return Inertia::render('admin/plants/edit', [
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
}
