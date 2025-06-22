<?php

namespace App\Imports;

use App\Models\Location;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class LocationImport implements ToModel, WithHeadingRow, WithValidation, WithBatchInserts, WithChunkReading
{
    /**
     * @param array $row
     *
     * @return Location|null
     */
    public function model(array $row)
    {
        // Skip empty rows
        if (empty(array_filter($row))) {
            return null;
        }

        // Resolve department_id from department_name
        $departmentId = null;
        if (!empty($row['department_name'])) {
            $department = \App\Models\Department::where('department_name', $row['department_name'])->first();
            $departmentId = $department ? $department->department_id : null;
        } elseif (!empty($row['department_id'])) {
            $departmentId = $row['department_id'];
        }

        return new Location([
            'location_name' => $row['location_name'] ?? $row['name'] ?? '',
            'department_id' => $departmentId,
        ]);
    }

    /**
     * Validation rules for each row
     */
    public function rules(): array
    {
        return [
            'location_name' => 'required|string|max:255',
            'department_name' => 'nullable|exists:departments,department_name',
            'department_id' => 'nullable|exists:departments,department_id',
        ];
    }

    /**
     * Custom validation messages
     */
    public function customValidationMessages()
    {
        return [
            'location_name.required' => 'Location name is required',
            'department_name.exists' => 'Department name does not exist',
            'department_id.exists' => 'Department ID does not exist',
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
