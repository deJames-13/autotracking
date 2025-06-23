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

        $email = $row['email'] ?? null;
        
        // Skip if user with email already exists
        if ($email && User::where('email', $email)->exists()) {
            return null;
        }

        // Handle employee_id - use provided value or generate automatically
        $employeeId = null;
        if (!empty($row['employee_id'])) {
            // Convert to string first (in case it's numeric from Excel)
            $stringValue = (string)$row['employee_id'];
            // Clean up the employee_id (remove leading apostrophes, trim whitespace)
            $employeeId = trim($stringValue, "'\" \t\n\r\0\x0B");
            
            // Skip if employee_id already exists
            if (User::where('employee_id', $employeeId)->exists()) {
                return null;
            }
        }

        // Resolve role_id from role_name (create if doesn't exist)
        $roleId = null;
        if (!empty($row['role_name'])) {
            $role = \App\Models\Role::where('role_name', $row['role_name'])->first();
            if (!$role) {
                // Create the role if it doesn't exist
                $role = \App\Models\Role::create([
                    'role_name' => $row['role_name']
                ]);
            }
            $roleId = $role->role_id;
        } elseif (!empty($row['role_id'])) {
            $roleId = $row['role_id'];
        }

        // If no employee_id provided, generate it using the role_id
        if (!$employeeId && $roleId) {
            $employeeId = $this->generateEmployeeId($roleId);
        }

        // Resolve department_id from department_name (create if doesn't exist)
        $departmentId = null;
        if (!empty($row['department_name'])) {
            $department = \App\Models\Department::where('department_name', $row['department_name'])->first();
            if (!$department) {
                // Create the department if it doesn't exist
                $department = \App\Models\Department::create([
                    'department_name' => $row['department_name']
                ]);
            }
            $departmentId = $department->department_id;
        } elseif (!empty($row['department_id'])) {
            $departmentId = $row['department_id'];
        }

        // Resolve plant_id from plant_name (create if doesn't exist)
        $plantId = null;
        if (!empty($row['plant_name'])) {
            $plant = \App\Models\Plant::where('plant_name', $row['plant_name'])->first();
            if (!$plant) {
                // Create the plant if it doesn't exist
                $plant = \App\Models\Plant::create([
                    'plant_name' => $row['plant_name']
                ]);
            }
            $plantId = $plant->plant_id;
        } elseif (!empty($row['plant_id'])) {
            $plantId = $row['plant_id'];
        }

        return new User([
            'employee_id' => $employeeId,
            'first_name' => $row['first_name'] ?? $row['firstname'] ?? null,
            'last_name' => $row['last_name'] ?? $row['lastname'] ?? null,
            'middle_name' => $row['middle_name'] ?? $row['middlename'] ?? null,
            'email' => $email,
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
            'employee_id' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if ($value) {
                        // Convert to string if it's numeric
                        $stringValue = (string)$value;
                        
                        // Clean the value (remove quotes, trim whitespace)
                        $cleanedId = trim($stringValue, "'\" \t\n\r\0\x0B");
                        
                        // Check if it's numeric (with or without quotes)
                        if (!preg_match('/^[0-9]+$/', $cleanedId)) {
                            $fail('Employee ID must contain only numeric characters');
                            return;
                        }
                        
                        // Check length
                        if (strlen($cleanedId) > 20) {
                            $fail('Employee ID must not exceed 20 characters');
                            return;
                        }
                        
                        // Check uniqueness on cleaned value
                        if (\App\Models\User::where('employee_id', $cleanedId)->exists()) {
                            $fail('The employee_id has already been taken.');
                        }
                    }
                }
            ],
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'role_name' => 'nullable|string|max:255',
            'role_id' => 'nullable|exists:roles,role_id',
            'department_name' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,department_id',
            'plant_name' => 'nullable|string|max:255',
            'plant_id' => 'nullable|exists:plants,plant_id',
        ];
    }

    /**
     * Custom validation messages
     */
    public function customValidationMessages()
    {
        return [
            'employee_id.unique' => 'Employee ID already exists',
            'first_name.required' => 'First name is required',
            'last_name.required' => 'Last name is required',
            'email.email' => 'Email must be a valid email address',
            'email.unique' => 'Email address already exists',
            'role_name.string' => 'Role name must be text',
            'role_id.exists' => 'Role ID does not exist',
            'department_name.string' => 'Department name must be text',
            'department_id.exists' => 'Department ID does not exist',
            'plant_name.string' => 'Plant name must be text',
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

    /**
     * Generate employee ID based on role
     */
    private function generateEmployeeId(int $roleId): string
    {
        // Get role name to determine prefix
        $role = \App\Models\Role::where('role_id', $roleId)->first();
        if (!$role) {
            throw new \Exception('Invalid role ID');
        }

        // Determine prefix based on role
        $prefix = match(strtolower($role->role_name)) {
            'admin' => '100',
            'technician' => '200', 
            'employee' => '300',
            default => '300' // Default to employee prefix
        };

        // Find the highest existing employee ID with this prefix
        $maxId = User::where('employee_id', 'like', $prefix . '%')
            ->orderBy('employee_id', 'desc')
            ->value('employee_id');

        if ($maxId && is_numeric($maxId)) {
            // Increment the highest existing ID
            $nextId = (int)$maxId + 1;
        } else {
            // Start with prefix + 001
            $nextId = (int)($prefix . '001');
        }

        // Ensure uniqueness (in case of race conditions)
        while (User::where('employee_id', (string)$nextId)->exists()) {
            $nextId++;
        }

        return (string)$nextId;
    }
}
