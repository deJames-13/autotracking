<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\DepartmentRequest;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

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
        // Check for foreign key constraints before deletion
        $usersCount = $department->users()->count();
        $equipmentCount = $department->equipment()->count();
        $locationsCount = $department->locations()->count();

        if ($usersCount > 0 || $equipmentCount > 0 || $locationsCount > 0) {
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

        $department->delete(); // This is now a soft delete due to SoftDeletes trait

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Department archived successfully.'
            ]);
        }

        return redirect()->route('admin.departments.index')
            ->with('success', 'Department archived successfully.');
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
        $departments = Department::onlyTrashed()
            ->orderBy('deleted_at', 'desc')
            ->paginate(10);

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $departments
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
}
