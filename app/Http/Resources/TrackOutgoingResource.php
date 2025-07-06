<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrackOutgoingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'incoming_id' => $this->incoming_id,
            'cal_date' => $this->cal_date?->format('Y-m-d'),
            'cal_due_date' => $this->cal_due_date?->format('Y-m-d'),
            'date_out' => $this->date_out?->toISOString(),
            'employee_id_out' => $this->employee_id_out,
            'released_by_id' => $this->released_by_id,
            'cycle_time' => $this->cycle_time,
            'ct_reqd' => $this->ct_reqd,
            'commit_etc' => $this->commit_etc?->format('Y-m-d'),
            'actual_etc' => $this->actual_etc?->format('Y-m-d'),
            'overdue' => $this->overdue,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'track_incoming' => new TrackIncomingResource($this->whenLoaded('trackIncoming')),
            'employee_out' => new UserResource($this->whenLoaded('employeeOut')),
            'released_by' => new UserResource($this->whenLoaded('releasedBy')),
            'equipment' => new EquipmentResource($this->whenLoaded('equipment')),
            'technician' => new UserResource($this->whenLoaded('technician')),
            'location' => new LocationResource($this->whenLoaded('location')),
        ];
    }
}
