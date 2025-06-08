<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'plant_id' => $this->plant_id,
            'plant_name' => $this->plant_name,
            'address' => $this->address,
            'telephone' => $this->telephone,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'users' => UserResource::collection($this->whenLoaded('users')),
        ];
    }
}
