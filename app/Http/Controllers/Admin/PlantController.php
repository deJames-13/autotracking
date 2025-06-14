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
        // Check for foreign key constraints before deletion
        $userCount = $plant->users()->count();
        
        if ($userCount > 0) {
            $errorMessage = "Cannot archive plant. It has {$userCount} user(s) assigned to it.";

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

        $plant->delete(); // This is now a soft delete due to SoftDeletes trait

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Plant archived successfully.'
            ]);
        }

        return redirect()->route('admin.plants.index')
            ->with('success', 'Plant archived successfully.');
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
        $plants = Plant::onlyTrashed()
            ->orderBy('deleted_at', 'desc')
            ->paginate(10);

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $plants
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
}
