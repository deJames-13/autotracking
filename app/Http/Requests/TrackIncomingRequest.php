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
            'data.equipment.processReqRangeStart' => ['nullable', 'string', 'max:255'],
            'data.equipment.processReqRangeEnd' => ['nullable', 'string', 'max:255'],
            'data.equipment.processReqRange' => ['nullable', 'string', 'max:500'], // New combined field
            
            // Received by validation
            'data.receivedBy' => ['required', 'array'],
            'data.receivedBy.employee_id' => ['required', 'exists:users,employee_id'],
            
            // Confirmation pin - conditional based on user role
            'data.confirmation_pin' => $this->getPinValidationRule(),
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
            'data.equipment.processReqRangeStart.string' => 'Process requirement range start must be text.',
            'data.equipment.processReqRangeStart.max' => 'Process requirement range start must be less than 255 characters.',
            'data.equipment.processReqRangeEnd.string' => 'Process requirement range end must be text.',
            'data.equipment.processReqRangeEnd.max' => 'Process requirement range end must be less than 255 characters.',
            'data.equipment.processReqRange.string' => 'Process requirement range must be text.',
            'data.equipment.processReqRange.max' => 'Process requirement range must be less than 500 characters.',
            'data.receivedBy.required' => 'Received by information is required.',
            'data.receivedBy.employee_id.required' => 'Received by employee ID is required.',
            'data.receivedBy.employee_id.exists' => 'Selected employee does not exist.',
            'data.confirmation_pin.required' => 'Confirmation PIN is required (Admin and Technician users bypass this requirement).',
        ];
    }

    /**
     * Get PIN validation rule based on user role.
     * Admin and Technician users can bypass PIN requirement.
     */
    private function getPinValidationRule(): array
    {
        $currentUser = auth()->user();
        
        // Check if current user is Admin or Technician - they can bypass PIN validation
        $canBypassPin = $currentUser && 
                       $currentUser->role && 
                       in_array($currentUser->role->role_name, ['admin', 'technician']);
        
        return $canBypassPin 
            ? ['nullable', 'string'] 
            : ['required', 'string'];
    }
}
