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
        $rules = [
            // Main data structure
            'data' => ['required', 'array'],
            
            // Request type validation
            'data.requestType' => ['required', 'string', 'in:new,routine'],
            
            // Technician validation
            'data.technician' => ['required', 'array'],
            'data.technician.employee_id' => ['required', 'exists:users,employee_id'],

            // Employee validation
            'data.scannedEmployee' => ['required', 'array'],
            'data.scannedEmployee.employee_id' => ['required', 'exists:users,employee_id'],
            
            // Equipment validation
            'data.equipment' => ['required', 'array'],
            'data.equipment.plant' => ['required', 'exists:plants,plant_id'],
            'data.equipment.department' => ['required', 'exists:departments,department_id'],
            'data.equipment.location' => ['required', 'exists:locations,location_id'],
            'data.equipment.description' => ['required', 'string', 'max:255'],
            'data.equipment.serialNumber' => ['required', 'string', 'max:100'],
            'data.equipment.model' => ['nullable', 'string', 'max:100'],
            'data.equipment.manufacturer' => ['nullable', 'string', 'max:100'],
            'data.equipment.dueDate' => ['required', 'date'],
            
            // Received by validation
            'data.receivedBy' => ['required', 'array'],
            'data.receivedBy.employee_id' => ['required', 'exists:users,employee_id'],
            
            // Confirmation pin
            'data.confirmation_pin' => ['required', 'string'],
        ];

        // Dynamic recall number validation based on request type
        $requestType = $this->input('data.requestType');
        if ($requestType === 'routine') {
            // For routine requests, recall number is required and must exist
            $rules['data.equipment.recallNumber'] = ['required', 'string', 'max:100', 'exists:equipments,recall_number'];
        } else {
            // For new requests, recall number is optional
            $rules['data.equipment.recallNumber'] = ['nullable', 'string', 'max:100'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'data.required' => 'Request data is required.',
            'data.requestType.required' => 'Request type is required.',
            'data.requestType.in' => 'Request type must be either new or routine.',
            'data.technician.required' => 'Technician information is required.',
            'data.technician.employee_id.required' => 'Technician employee ID is required.',
            'data.technician.employee_id.exists' => 'Selected technician does not exist.',
            'data.equipment.required' => 'Equipment information is required.',
            'data.equipment.plant.required' => 'Plant selection is required.',
            'data.equipment.plant.exists' => 'Selected plant does not exist.',
            'data.equipment.department.required' => 'Department selection is required.',
            'data.equipment.department.exists' => 'Selected department does not exist.',
            'data.equipment.location.required' => 'Location selection is required.',
            'data.equipment.location.exists' => 'Selected location does not exist.',
            'data.equipment.description.required' => 'Equipment description is required.',
            'data.equipment.serialNumber.required' => 'Serial number is required.',
            'data.equipment.recallNumber.required' => 'Recall number is required for routine calibration requests.',
            'data.equipment.recallNumber.exists' => 'The selected recall number does not exist in the equipment records.',
            'data.equipment.model.required' => 'Equipment model is required.',
            'data.equipment.manufacturer.required' => 'Manufacturer is required.',
            'data.equipment.dueDate.required' => 'Due date is required.',
            'data.equipment.dueDate.date' => 'Due date must be a valid date.',
            'data.receivedBy.required' => 'Received by information is required.',
            'data.receivedBy.employee_id.required' => 'Received by employee ID is required.',
            'data.receivedBy.employee_id.exists' => 'Selected employee does not exist.',
            'data.confirmation_pin.required' => 'Confirmation PIN is required.',
        ];
    }
}
