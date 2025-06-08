<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RoleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Role::query();

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('role_name', 'like', "%{$search}%");
        }

        $roles = $query->paginate($request->get('per_page', 15));

        return RoleResource::collection($roles);
    }

    public function show(Role $role): RoleResource
    {
        return new RoleResource($role);
    }
}
