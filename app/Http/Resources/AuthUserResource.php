<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'employee_id' => $this->employee_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'middle_name' => $this->middle_name,
            'full_name' => trim($this->first_name . ' ' . ($this->middle_name ? $this->middle_name . ' ' : '') . $this->last_name),
            'email' => $this->email,
            'avatar' => $this->avatar,
            'role_id' => $this->role_id,
            'department_id' => $this->department_id,
            'plant_id' => $this->plant_id,
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // TODO Check for resolves
            'role' => $this->role ? (new RoleResource($this->role))->resolve()  : null,
            'department' => $this->department ? new DepartmentResource($this->department) : null,
            'plant' => $this->plant ? new PlantResource($this->plant) : null,
        ];
    }
}
