<?php

namespace Database\Seeders;

use App\Models\Plant;
use Illuminate\Database\Seeder;

class PlantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plants = [
            [
                'plant_name' => 'P1',
                'address' => '123 Industrial Ave, Plant 1 District, 12345',
                'telephone' => '555-001-0001'
            ],
            [
                'plant_name' => 'P2',
                'address' => '456 Manufacturing Blvd, Plant 2 District, 23456',
                'telephone' => '555-002-0002'
            ],
            [
                'plant_name' => 'P3',
                'address' => '789 Production Road, Plant 3 District, 34567',
                'telephone' => '555-003-0003'
            ],
        ];

        foreach ($plants as $plant) {
            Plant::create($plant);
        }
    }
}
