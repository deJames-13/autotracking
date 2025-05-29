<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            ['department_name' => 'Engineering'],
            ['department_name' => 'Production'],
            ['department_name' => 'Quality Assurance'],
            ['department_name' => 'Maintenance'],
            ['department_name' => 'Logistics'],
        ];

        foreach ($departments as $department) {
            Department::create($department);
        }
    }
}
