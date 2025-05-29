<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\LocationRequest;
use App\Models\Department;
use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $locations = Location::with(['department'])
            ->when($request->search, function ($query, $search) {
                $query->where('location_name', 'like', "%{$search}%");
            })
            ->when($request->department_id, function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->paginate(15)
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
        $location = Location::create($request->validated());

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
        $location->load(['department', 'trackingRecords']);
        
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
        $location->delete();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Location deleted successfully.'
            ]);
        }

        return redirect()->route('admin.locations.index')
            ->with('success', 'Location deleted successfully.');
    }

    /**
     * Search departments for smart select
     */
    public function searchDepartments(Request $request): JsonResponse
    {
        $search = $request->input('search', '');
        
        $departments = Department::where('department_name', 'like', "%{$search}%")
            ->limit(10)
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
}
