<?php

namespace App\Imports;

use App\Models\Department;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class DepartmentImport implements ToModel, WithHeadingRow, WithValidation, WithBatchInserts, WithChunkReading
{
    /**
     * @param array $row
     *
     * @return Department|null
     */
    public function model(array $row)
    {
        // Skip empty rows
        if (empty(array_filter($row))) {
            return null;
        }

        return new Department([
            'department_name' => $row['department_name'] ?? $row['name'] ?? '',
        ]);
    }

    /**
     * Validation rules for each row
     */
    public function rules(): array
    {
        return [
            'department_name' => 'required|string|max:255|unique:departments,department_name',
        ];
    }

    /**
     * Custom validation messages
     */
    public function customValidationMessages()
    {
        return [
            'department_name.required' => 'Department name is required',
            'department_name.unique' => 'Department name already exists',
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
