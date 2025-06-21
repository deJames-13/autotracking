<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $equipmentId = $this->route('equipment') ? $this->route('equipment')->equipment_id : null;
        
        return [
            'employee_id' => [
                'nullable', 
                'exists:users,employee_id'
            ],
            'recall_number' => [
                'nullable', 
                'string', 
                'max:255', 
            ],
            'serial_number' => [
                'nullable', 
                'string', 
                'max:255'
            ],
            'description' => [
                'required', 
                'string'
            ],
            'model' => [
                'nullable', 
                'string', 
                'max:255'
            ],
            'manufacturer' => [
                'nullable', 
                'string', 
                'max:255'
            ],
            'plant_id' => [
                'nullable', 
                'exists:plants,plant_id'
            ],
            'department_id' => [
                'nullable', 
                'exists:departments,department_id'
            ],
            'location_id' => [
                'nullable', 
                'exists:locations,location_id'
            ],
            'status' => [
                'nullable', 
                Rule::in(['active', 'inactive', 'pending_calibration', 'in_calibration', 'retired'])
            ],
            'last_calibration_date' => [
                'nullable', 
                'date',
                'before_or_equal:today'
            ],
            'next_calibration_due' => [
                'nullable', 
                'date',
                'after:last_calibration_date'
            ],
            'process_req_range_start' => [
                'nullable',
                'string',
                'max:255'
            ],
            'process_req_range_end' => [
                'nullable',
                'string',
                'max:255'
            ],
            'process_req_range' => [
                'nullable',
                'string',
                'max:500'
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.exists' => 'The selected employee does not exist.',
            'recall_number.string' => 'Recall number must be text.',
            'recall_number.max' => 'Recall number must be less than 255 characters.',
            'description.required' => 'Equipment description is required.',
            'plant_id.exists' => 'The selected plant does not exist.',
            'department_id.exists' => 'The selected department does not exist.',
            'location_id.exists' => 'The selected location does not exist.',
            'status.in' => 'Invalid status selected.',
            'last_calibration_date.date' => 'Last calibration date must be a valid date.',
            'last_calibration_date.before_or_equal' => 'Last calibration date cannot be in the future.',
            'next_calibration_due.date' => 'Next calibration due date must be a valid date.',
            'next_calibration_due.after' => 'Next calibration due date must be after the last calibration date.',
            'process_req_range_start.string' => 'Process requirement range start must be text.',
            'process_req_range_start.max' => 'Process requirement range start must be less than 255 characters.',
            'process_req_range_end.string' => 'Process requirement range end must be text.',
            'process_req_range_end.max' => 'Process requirement range end must be less than 255 characters.',
        ];
    }

    public function attributes(): array
    {
        return [
            'employee_id' => 'assigned employee',
            'recall_number' => 'recall number',
            'serial_number' => 'serial number',
            'description' => 'description',
            'model' => 'model',
            'manufacturer' => 'manufacturer',
            'plant_id' => 'plant',
            'department_id' => 'department',
            'location_id' => 'location',
            'status' => 'status',
            'last_calibration_date' => 'last calibration date',
            'next_calibration_due' => 'next calibration due date',
            'process_req_range_start' => 'process requirement range start',
            'process_req_range_end' => 'process requirement range end',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Convert empty strings to null for nullable fields
        $this->merge([
            'employee_id' => $this->employee_id ?: null,
            'serial_number' => $this->serial_number ?: null,
            'model' => $this->model ?: null,
            'manufacturer' => $this->manufacturer ?: null,
            'plant_id' => $this->plant_id ?: null,
            'department_id' => $this->department_id ?: null,
            'location_id' => $this->location_id ?: null,
            'last_calibration_date' => $this->last_calibration_date ?: null,
            'next_calibration_due' => $this->next_calibration_due ?: null,
            'process_req_range_start' => $this->process_req_range_start ?: null,
            'process_req_range_end' => $this->process_req_range_end ?: null,
        ]);
    }
}
