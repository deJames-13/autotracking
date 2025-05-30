<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'equipment_id' => $this->equipment_id,
            'employee_id' => $this->employee_id,
            'recall_number' => $this->recall_number,
            'serial_number' => $this->serial_number,
            'description' => $this->description,
            'model' => $this->model,
            'manufacturer' => $this->manufacturer,
            'plant_id' => $this->plant_id,
            'department_id' => $this->department_id,
            'location_id' => $this->location_id,
            'status' => $this->status,
            'last_calibration_date' => $this->last_calibration_date,
            'next_calibration_due' => $this->next_calibration_due,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => new UserResource($this->whenLoaded('user')),
            'plant' => $this->whenLoaded('plant', function () {
                return [
                    'plant_id' => $this->plant->plant_id,
                    'plant_name' => $this->plant->plant_name,
                ];
            }),
            'department' => $this->whenLoaded('department', function () {
                return [
                    'department_id' => $this->department->department_id,
                    'department_name' => $this->department->department_name,
                ];
            }),
            'location' => $this->whenLoaded('location', function () {
                return [
                    'location_id' => $this->location->location_id,
                    'location_name' => $this->location->location_name,
                ];
            }),
            'tracking_records' => TrackIncomingResource::collection($this->whenLoaded('trackIncoming')),
        ];
    }
}
