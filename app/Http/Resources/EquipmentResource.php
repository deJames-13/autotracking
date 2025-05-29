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
            'serial_number' => $this->serial_number,
            'description' => $this->description,
            'model' => $this->model,
            'manufacturer' => $this->manufacturer,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => new UserResource($this->whenLoaded('user')),
            'tracking_records' => TrackingRecordResource::collection($this->whenLoaded('trackingRecords')),
        ];
    }
}
