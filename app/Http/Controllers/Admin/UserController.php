<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Plant;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        // Get initial data for the page
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
            ->paginate(15)
            ->withQueryString();

        $roles = Role::all();
        $departments = Department::all();
        $plants = Plant::all();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $roles,
            'departments' => $departments,
            'plants' => $plants,
            'filters' => $request->only(['search', 'role_id', 'department_id']),
        ]);
    }
}
