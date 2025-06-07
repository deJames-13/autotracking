<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PlantSeeder::class,
            RoleSeeder::class,
            DepartmentSeeder::class,
            LocationSeeder::class,
        ]);

        // Admins with specific emails and 6-digit employee IDs
        User::factory()->create([
            'employee_id' => 100001,
            'first_name' => 'Derick',
            'last_name' => 'Espinosa',
            'email' => 'dev@amkor.ph',
            'department_id' => 1, // Admin
            'role_id' => 1, // admin
            'plant_id' => 1  // P1
        ]);


        // Technicians with specified names and 6-digit employee IDs
        User::factory()->create([
            'employee_id' => 200001,
            'first_name' => 'Chariss',
            'last_name' => 'Co',
            'email' => 'chariss.co@amkor.ph',
            'department_id' => 2, // Calibrations
            'role_id' => 3, // technician
            'plant_id' => 1  // P1
        ]);

        User::factory()->create([
            'employee_id' => 200002,
            'first_name' => 'Gilbert',
            'last_name' => 'Pagdilao',
            'email' => 'gilbert.pagdilao@amkor.ph',
            'department_id' => 2, // Calibrations
            'role_id' => 3, // technician
            'plant_id' => 1  // P1
        ]);

        User::factory()->create([
            'employee_id' => 200003,
            'first_name' => 'Marlo',
            'last_name' => 'Manalac',
            'email' => 'marlo.manalac@amkor.ph',
            'department_id' => 2, // Calibrations
            'role_id' => 3, // technician
            'plant_id' => 1  // P1
        ]);

        // Additional sample users for testing
        User::factory()->create([
            'employee_id' => 300001,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'employee@example.com',
            'department_id' => 4, // Constructions
            'role_id' => 2, // employee
            'plant_id' => 1  // P1
        ]);
        User::factory()->create([
            'employee_id' => 300002,
            'first_name' => 'Angelo',
            'last_name' => 'Batumbakal',
            'email' => 'angelo.batumbakal@example.com',
            'department_id' => 4, // Constructions
            'role_id' => 2, // employee
            'plant_id' => 2  // P1
        ]);



        // Create additional technicians with auto-generated info (6-digit employee IDs starting from 200004)
        // for ($i = 4; $i <= 8; $i++) { // Creates 5 more technicians (200004-200008)
        //     User::factory()->create([
        //         'employee_id' => 200000 + $i,
        //         'role_id' => 3, // technician
        //         'plant_id' => 1, // P1
        //         'department_id' => 2, // Calibrations
        //     ]);
        // }
        // for ($i = 3; $i <= 7; $i++) { // Creates 5 more employee (300003-300007)
        //     User::factory()->create([
        //         'employee_id' => 300000 + $i,
        //         'role_id' => 2, // technician
        //         'plant_id' => 1, // P1
        //         'department_id' => 6, // Electrical
        //     ]);
        // }
    }
}