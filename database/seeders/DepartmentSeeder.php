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
            ['department_name' => 'Admin'],
            ['department_name' => 'Calibrations'],
            ['department_name' => 'Tracking'],
            ['department_name' => 'Constructions'],
            ['department_name' => 'HR'],
            ['department_name' => 'Electrical'],
        ];

        foreach ($departments as $department) {
            Department::create($department);
        }
    }
}