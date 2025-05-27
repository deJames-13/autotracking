<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(Request $request): Response
    {
        // Get initial data for the page
        $departments = Department::with(['users', 'locations'])
            ->when($request->search, function ($query, $search) {
                $query->where('department_name', 'like', "%{$search}%");
            })
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/departments/index', [
            'departments' => $departments,
            'filters' => $request->only(['search']),
        ]);
    }
}
