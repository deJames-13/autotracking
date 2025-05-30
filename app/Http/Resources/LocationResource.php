<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'location_id' => $this->location_id,
            'location_name' => $this->location_name,
            'department_id' => $this->department_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'track_incoming' => TrackIncomingResource::collection($this->whenLoaded('trackIncoming')),
            'track_outgoing' => TrackOutgoingResource::collection($this->whenLoaded('trackOutgoing')),
        ];
    }
}
