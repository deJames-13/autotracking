<?php

namespace App\Imports;

use App\Models\Equipment;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class EquipmentImport implements ToModel, WithHeadingRow, WithValidation, WithBatchInserts, WithChunkReading
{
    /**
     * @param array $row
     *
     * @return Equipment|null
     */
    public function model(array $row)
    {
        // Skip empty rows
        if (empty(array_filter($row))) {
            return null;
        }

        // Resolve employee_id from employee name
        $employeeId = null;
        if (!empty($row['employee_name'])) {
            // Try to find by concatenated full name or separate names
            $user = \App\Models\User::whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$row['employee_name']}%"])
                ->orWhereRaw("CONCAT(first_name, ' ', IFNULL(middle_name, ''), ' ', last_name) LIKE ?", ["%{$row['employee_name']}%"])
                ->first();
            $employeeId = $user ? $user->employee_id : null;
        } elseif (!empty($row['employee_id'])) {
            $employeeId = $row['employee_id'];
        }

        // Resolve plant_id from plant_name
        $plantId = null;
        if (!empty($row['plant_name'])) {
            $plant = \App\Models\Plant::where('plant_name', $row['plant_name'])->first();
            $plantId = $plant ? $plant->plant_id : null;
        } elseif (!empty($row['plant_id'])) {
            $plantId = $row['plant_id'];
        }

        // Resolve department_id from department_name
        $departmentId = null;
        if (!empty($row['department_name'])) {
            $department = \App\Models\Department::where('department_name', $row['department_name'])->first();
            $departmentId = $department ? $department->department_id : null;
        } elseif (!empty($row['department_id'])) {
            $departmentId = $row['department_id'];
        }

        // Resolve location_id from location_name
        $locationId = null;
        if (!empty($row['location_name'])) {
            $location = \App\Models\Location::where('location_name', $row['location_name'])->first();
            $locationId = $location ? $location->location_id : null;
        } elseif (!empty($row['location_id'])) {
            $locationId = $row['location_id'];
        }

        return new Equipment([
            'recall_number' => $row['recall_number'] ?? null,
            'serial_number' => $row['serial_number'] ?? null,
            'description' => $row['description'] ?? '',
            'model' => $row['model'] ?? null,
            'manufacturer' => $row['manufacturer'] ?? null,
            'employee_id' => $employeeId,
            'plant_id' => $plantId,
            'department_id' => $departmentId,
            'location_id' => $locationId,
            'status' => $row['status'] ?? 'active',
            'last_calibration_date' => $row['last_calibration_date'] ?? null,
            'next_calibration_due' => $row['next_calibration_due'] ?? null,
            'process_req_range' => $row['process_req_range'] ?? null,
        ]);
    }

    /**
     * Validation rules for each row
     */
    public function rules(): array
    {
        return [
            'description' => 'required|string',
            'recall_number' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'manufacturer' => 'nullable|string|max:255',
            'employee_name' => 'nullable|string|max:255',
            'employee_id' => 'nullable|exists:users,employee_id',
            'plant_name' => 'nullable|exists:plants,plant_name',
            'plant_id' => 'nullable|exists:plants,plant_id',
            'department_name' => 'nullable|exists:departments,department_name',
            'department_id' => 'nullable|exists:departments,department_id',
            'location_name' => 'nullable|exists:locations,location_name',
            'location_id' => 'nullable|exists:locations,location_id',
            'status' => 'nullable|in:active,inactive,pending_calibration,in_calibration,retired',
            'last_calibration_date' => 'nullable|date',
            'next_calibration_due' => 'nullable|date',
        ];
    }

    /**
     * Custom validation messages
     */
    public function customValidationMessages()
    {
        return [
            'description.required' => 'Equipment description is required',
            'employee_name.string' => 'Employee name must be a valid string',
            'employee_id.exists' => 'Employee ID does not exist',
            'plant_name.exists' => 'Plant name does not exist',
            'plant_id.exists' => 'Plant ID does not exist',
            'department_name.exists' => 'Department name does not exist',
            'department_id.exists' => 'Department ID does not exist',
            'location_name.exists' => 'Location name does not exist',
            'location_id.exists' => 'Location ID does not exist',
            'status.in' => 'Status must be one of: active, inactive, pending_calibration, in_calibration, retired',
            'last_calibration_date.date' => 'Last calibration date must be a valid date',
            'next_calibration_due.date' => 'Next calibration due must be a valid date',
        ];
    }

    /**
     * Batch size for processing
     */
    public function batchSize(): int
    {
        return 100;
    }

    /**
     * Chunk size for reading
     */
    public function chunkSize(): int
    {
        return 100;
    }
}
