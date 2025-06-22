<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class UserImport implements ToModel, WithHeadingRow, WithValidation, WithBatchInserts, WithChunkReading
{
    /**
     * @param array $row
     *
     * @return User|null
     */
    public function model(array $row)
    {
        // Skip empty rows
        if (empty(array_filter($row))) {
            return null;
        }

        // Resolve role_id from role_name
        $roleId = null;
        if (!empty($row['role_name'])) {
            $role = \App\Models\Role::where('role_name', $row['role_name'])->first();
            $roleId = $role ? $role->role_id : null;
        } elseif (!empty($row['role_id'])) {
            $roleId = $row['role_id'];
        }

        // Resolve department_id from department_name
        $departmentId = null;
        if (!empty($row['department_name'])) {
            $department = \App\Models\Department::where('department_name', $row['department_name'])->first();
            $departmentId = $department ? $department->department_id : null;
        } elseif (!empty($row['department_id'])) {
            $departmentId = $row['department_id'];
        }

        // Resolve plant_id from plant_name
        $plantId = null;
        if (!empty($row['plant_name'])) {
            $plant = \App\Models\Plant::where('plant_name', $row['plant_name'])->first();
            $plantId = $plant ? $plant->plant_id : null;
        } elseif (!empty($row['plant_id'])) {
            $plantId = $row['plant_id'];
        }

        return new User([
            'first_name' => $row['first_name'] ?? $row['firstname'] ?? null,
            'last_name' => $row['last_name'] ?? $row['lastname'] ?? null,
            'middle_name' => $row['middle_name'] ?? $row['middlename'] ?? null,
            'email' => $row['email'] ?? null,
            'password' => Hash::make($row['password'] ?? $row['pin'] ?? 'default123'),
            'role_id' => $roleId ?? 1, // Default role
            'department_id' => $departmentId,
            'plant_id' => $plantId,
        ]);
    }

    /**
     * Validation rules for each row
     */
    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'role_name' => 'nullable|exists:roles,role_name',
            'role_id' => 'nullable|exists:roles,role_id',
            'department_name' => 'nullable|exists:departments,department_name',
            'department_id' => 'nullable|exists:departments,department_id',
            'plant_name' => 'nullable|exists:plants,plant_name',
            'plant_id' => 'nullable|exists:plants,plant_id',
        ];
    }

    /**
     * Custom validation messages
     */
    public function customValidationMessages()
    {
        return [
            'first_name.required' => 'First name is required',
            'last_name.required' => 'Last name is required',
            'email.email' => 'Email must be a valid email address',
            'email.unique' => 'Email already exists',
            'role_name.exists' => 'Role name does not exist',
            'role_id.exists' => 'Role ID does not exist',
            'department_name.exists' => 'Department name does not exist',
            'department_id.exists' => 'Department ID does not exist',
            'plant_name.exists' => 'Plant name does not exist',
            'plant_id.exists' => 'Plant ID does not exist',
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
