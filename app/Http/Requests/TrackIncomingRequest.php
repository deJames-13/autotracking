<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TrackIncomingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recall_number' => ['required', 'string', 'unique:track_incoming,recall_number,' . $this->id],
            'technician_id' => ['required', 'exists:users,employee_id'],
            'description' => ['required', 'string'],
            'equipment_id' => ['required', 'exists:equipments,equipment_id'],
            'location_id' => ['required', 'exists:locations,location_id'],
            'due_date' => ['required', 'date'],
            'date_in' => ['required', 'date'],
            'employee_id_in' => ['required', 'exists:users,employee_id'],
            'status' => ['required', 'in:pending_calibration,calibration_in_progress,ready_for_pickup'],
        ];
    }
}
