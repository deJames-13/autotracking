<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'role_id' => $this->role_id,
            'role_name' => $this->role_name,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'users' => UserResource::collection($this->whenLoaded('users')),
        ];
    }
}
