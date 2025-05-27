<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TrackingRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recall' => ['boolean'],
            'description' => ['required', 'string'],
            'equipment_id' => ['required', 'exists:equipments,equipment_id'],
            'technician_id' => ['required', 'exists:users,employee_id'],
            'location_id' => ['required', 'exists:locations,location_id'],
            'due_date' => ['required', 'date'],
            'date_in' => ['required', 'date'],
            'employee_id_in' => ['required', 'exists:users,employee_id'],
            'cal_date' => ['required', 'date'],
            'cal_due_date' => ['required', 'date', 'after_or_equal:cal_date'],
            'date_out' => ['nullable', 'date', 'after_or_equal:date_in'],
            'employee_id_out' => ['nullable', 'exists:users,employee_id'],
            'cycle_time' => ['required', 'integer', 'min:1'],
        ];
    }
}
