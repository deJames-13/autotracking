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

        User::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'role_id' => 1,
            'plant_id' => 1  
        ]);

        // Creating 5 technician users
        User::factory()->count(5)->create([
            'role_id' => 4, 
            'plant_id' => 1,
            'department_id' => 1,
        ]);
    }
}
