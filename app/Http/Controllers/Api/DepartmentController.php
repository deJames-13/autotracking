<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\LocationResource;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DepartmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $query = Department::with(['users', 'locations']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('department_name', 'like', "%{$search}%");
        }

        // For SmartSelect component format
        if ($request->has('format') && $request->get('format') === 'select') {
            $departments = $query->get()->map(function ($department) {
                return [
                    'label' => $department->department_name,
                    'value' => $department->department_id
                ];
            });
            return response()->json($departments);
        }

        $departments = $query->paginate($request->get('per_page', 15));

        return DepartmentResource::collection($departments);
    }

    public function store(DepartmentRequest $request): DepartmentResource
    {
        $department = Department::create($request->validated());
        $department->load(['users', 'locations']);

        return new DepartmentResource($department);
    }

    public function show(Department $department): DepartmentResource
    {
        $department->load(['users', 'locations']);
        return new DepartmentResource($department);
    }

    public function update(DepartmentRequest $request, Department $department): DepartmentResource
    {
        $department->update($request->validated());
        $department->load(['users', 'locations']);

        return new DepartmentResource($department);
    }

    public function destroy(Department $department): JsonResponse
    {
        $department->delete();
        return response()->json(['message' => 'Department deleted successfully']);
    }
    
    public function users(Department $department): AnonymousResourceCollection
    {
        return UserResource::collection(
            $department->users()->with(['role', 'plant'])->paginate(15)
        );
    }
    
    public function locations(Department $department): AnonymousResourceCollection
    {
        return LocationResource::collection(
            $department->locations()->paginate(15)
        );
    }
    
    /**
     * Create a department quickly via API for SmartSelect
     */
    public function quickCreate(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:departments,department_name'
        ]);
        
        $department = Department::create([
            'department_name' => $request->input('name')
        ]);
        
        return response()->json([
            'label' => $department->department_name,
            'value' => $department->department_id
        ]);
    }
}
