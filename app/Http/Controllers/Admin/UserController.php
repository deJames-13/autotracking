<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\Department;
use App\Models\Plant;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $limit = $request->get('limit', 15);
        
        $users = User::with(['role', 'department', 'plant'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->role_id, function ($query, $roleId) {
                $query->where('role_id', $roleId);
            })
            ->when($request->department_id, function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->paginate($limit)
            ->withQueryString();

        $roles = Role::all();
        $departments = Department::all();
        $plants = Plant::all();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $users,
                'roles' => $roles,
                'departments' => $departments,
                'plants' => $plants
            ]);
        }

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $roles,
            'departments' => $departments,
            'plants' => $plants,
            'filters' => $request->only(['search', 'role_id', 'department_id']),
        ]);
    }

    public function create(): Response
    {
        $roles = Role::all();
        $departments = Department::all();
        $plants = Plant::all();

        return Inertia::render('admin/users/create', [
            'roles' => $roles,
            'departments' => $departments,
            'plants' => $plants,
        ]);
    }

    public function store(UserRequest $request): RedirectResponse|JsonResponse
    {
        $data = $request->validated();
        
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user = User::create($data);

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'User created successfully.',
                'data' => $user
            ]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function show(User $user, Request $request): Response|JsonResponse
    {
        $user->load(['role', 'department', 'plant', 'equipments']);
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $user
            ]);
        }
        
        return Inertia::render('admin/users/show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user): Response
    {
        $roles = Role::all();
        $departments = Department::all();
        $plants = Plant::all();

        return Inertia::render('admin/users/edit', [
            'user' => $user,
            'roles' => $roles,
            'departments' => $departments,
            'plants' => $plants,
        ]);
    }

    public function update(UserRequest $request, User $user): RedirectResponse|JsonResponse
    {
        $data = $request->validated();
        
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'User updated successfully.',
                'data' => $user
            ]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user, Request $request): RedirectResponse|JsonResponse
    {
        $user->delete();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'User deleted successfully.'
            ]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Search for employee by barcode (employee_id)
     */
    public function searchByBarcode(Request $request): JsonResponse
    {
        $barcode = $request->get('barcode');
        
        if (!$barcode) {
            return response()->json([
                'success' => false,
                'message' => 'Barcode is required'
            ], 400);
        }

        try {
            // Search for employee by employee_id (which is used as barcode)
            $employee = User::with(['role', 'department', 'plant'])
                ->where('employee_id', $barcode)
                ->first();

            if ($employee) {
                return response()->json([
                    'success' => true,
                    'employee' => [
                        'employee_id' => $employee->employee_id,
                        'first_name' => $employee->first_name,
                        'last_name' => $employee->last_name,
                        'email' => $employee->email,
                        'plant_id' => $employee->plant_id,
                        'department_id' => $employee->department_id,
                        'role' => $employee->role,
                        'department' => $employee->department,
                        'plant' => $employee->plant
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found with this ID'
                ], 404);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error searching for employee'
            ], 500);
        }
    }
}
