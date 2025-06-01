<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrackIncomingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'recall_number' => $this->recall_number,
            'technician_id' => $this->technician_id,
            'description' => $this->description,
            'equipment_id' => $this->equipment_id,
            'location_id' => $this->location_id,
            'received_by_id' => $this->received_by_id,
            'due_date' => $this->due_date,
            'date_in' => $this->date_in,
            'employee_id_in' => $this->employee_id_in,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'equipment' => new EquipmentResource($this->whenLoaded('equipment')),
            'technician' => new UserResource($this->whenLoaded('technician')),
            'location' => new LocationResource($this->whenLoaded('location')),
            'employee_in' => new UserResource($this->whenLoaded('employeeIn')),
            'received_by' => new UserResource($this->whenLoaded('receivedBy')),
            'track_outgoing' => new TrackOutgoingResource($this->whenLoaded('trackOutgoing')),
        ];
    }
}
