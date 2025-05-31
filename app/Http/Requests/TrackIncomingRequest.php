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
            // Main data structure
            'data' => ['required', 'array'],
            
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
            'data.equipment.recallNumber' => ['nullable', 'string', 'max:100'],
            'data.equipment.model' => ['nullable', 'string', 'max:100'],
            'data.equipment.manufacturer' => ['nullable', 'string', 'max:100'],
            'data.equipment.dueDate' => ['required', 'date'],
            
            // Received by validation
            'data.receivedBy' => ['required', 'array'],
            'data.receivedBy.employee_id' => ['required', 'exists:users,employee_id'],
            
            // Confirmation pin
            'data.confirmation_pin' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'data.required' => 'Request data is required.',
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
