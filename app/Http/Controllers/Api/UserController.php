<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::with(['role', 'department', 'plant']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role_id')) {
            $query->where('role_id', $request->get('role_id'));
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->get('department_id'));
        }

        $users = $query->paginate($request->get('per_page', 15));

        return UserResource::collection($users);
    }

    public function store(UserRequest $request): UserResource
    {
        $data = $request->validated();
        
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user = User::create($data);
        $user->load(['role', 'department', 'plant']);

        return new UserResource($user);
    }

    public function show(User $user): UserResource
    {
        $user->load(['role', 'department', 'plant', 'equipments']);
        return new UserResource($user);
    }

    public function update(UserRequest $request, User $user): UserResource
    {
        $data = $request->validated();
        
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);
        $user->load(['role', 'department', 'plant']);

        return new UserResource($user);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }
    
    public function equipment(User $user): AnonymousResourceCollection
    {
        return EquipmentResource::collection($user->equipments()->paginate(15));
    }
    
    public function trackingRecords(User $user): AnonymousResourceCollection
    {
        $records = TrackingRecord::where('technician_id', $user->employee_id)
            ->orWhere('employee_id_in', $user->employee_id)
            ->orWhere('employee_id_out', $user->employee_id)
            ->with(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut'])
            ->paginate(15);
            
        return TrackingRecordResource::collection($records);
    }
}
