<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrackingRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'tracking_id' => $this->tracking_id,
            'recall' => $this->recall,
            'description' => $this->description,
            'equipment_id' => $this->equipment_id,
            'technician_id' => $this->technician_id,
            'location_id' => $this->location_id,
            'due_date' => $this->due_date,
            'date_in' => $this->date_in,
            'employee_id_in' => $this->employee_id_in,
            'cal_date' => $this->cal_date,
            'cal_due_date' => $this->cal_due_date,
            'date_out' => $this->date_out,
            'employee_id_out' => $this->employee_id_out,
            'cycle_time' => $this->cycle_time,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'equipment' => new EquipmentResource($this->whenLoaded('equipment')),
            'technician' => new UserResource($this->whenLoaded('technician')),
            'location' => new LocationResource($this->whenLoaded('location')),
            'employee_in' => new UserResource($this->whenLoaded('employeeIn')),
            'employee_out' => new UserResource($this->whenLoaded('employeeOut')),
        ];
    }
}
