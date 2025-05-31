<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmployeeTrackIncomingRequest extends FormRequest
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
            
            // Received by validation - automatically filled for employees
            'data.receivedBy' => ['nullable', 'array'],
            'data.receivedBy.employee_id' => ['nullable', 'exists:users,employee_id'],
            
            // PIN is not required for employee requests (auto-filled employee data)
            'data.confirmation_pin' => ['nullable', 'string'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Keep original data format for validation
    }

    /**
     * Get validated data including derived fields.
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);
        
        // For store and update operations, we need to transform the data
        // from nested structure to flat database fields
        $data = $this->input('data', []);
        
        $result = [];
        
        // Basic fields
        if (isset($data['equipment'])) {
            $equipment = $data['equipment'];
            $result['description'] = $equipment['description'] ?? null;
            $result['serial_number'] = $equipment['serialNumber'] ?? null;
            $result['model'] = $equipment['model'] ?? null;
            $result['manufacturer'] = $equipment['manufacturer'] ?? null;
            $result['due_date'] = $equipment['dueDate'] ?? null;
            $result['plant_id'] = $equipment['plant'] ?? null;
            $result['department_id'] = $equipment['department'] ?? null;
            $result['location_id'] = $equipment['location'] ?? null;
            $result['equipment_id'] = $equipment['equipment_id'] ?? null;
        }
        
        // Technician ID
        if (isset($data['technician']) && isset($data['technician']['employee_id'])) {
            $result['technician_id'] = $data['technician']['employee_id'];
        }
        
        // Date handling
        if (isset($data['calibration'])) {
            $calibration = $data['calibration'];
            $result['calibration_date'] = !empty($calibration['calibrationDate']) ? $calibration['calibrationDate'] : null;
            $result['expected_due_date'] = !empty($calibration['expectedDueDate']) ? $calibration['expectedDueDate'] : null;
            $result['date_out'] = !empty($calibration['dateOut']) ? $calibration['dateOut'] : null;
        }
        
        $result['date_in'] = now()->toDateTimeString();
        
        return $result;
    }
}
