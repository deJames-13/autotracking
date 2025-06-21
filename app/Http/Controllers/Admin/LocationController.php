<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\LocationRequest;
use App\Models\Department;
use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

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

    public function create(): Response
    {
        $departments = Department::all();

        return Inertia::render('admin/locations/create', [
            'departments' => $departments,
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

    public function show(Location $location, Request $request): Response|JsonResponse
    {
        $location->load(['department']);
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $location
            ]);
        }
        
        return Inertia::render('admin/locations/show', [
            'location' => $location,
        ]);
    }

    public function edit(Location $location): Response
    {
        $departments = Department::all();

        return Inertia::render('admin/locations/edit', [
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
        $locations = Location::onlyTrashed()
            ->with(['department'])
            ->orderBy('deleted_at', 'desc')
            ->paginate(10);

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $locations
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
    private function forceDeleteLocationWithRelations(Location $location): void
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
    }
}
