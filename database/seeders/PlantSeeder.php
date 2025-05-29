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
                'plant_name' => 'Main Manufacturing Plant',
                'address' => '123 Industrial Ave, Metro City, 12345',
                'telephone' => '555-123-4567'
            ],
            [
                'plant_name' => 'East Production Facility',
                'address' => '456 Factory Blvd, East District, 23456',
                'telephone' => '555-234-5678'
            ],
            [
                'plant_name' => 'West Assembly Center',
                'address' => '789 Assembly Road, West County, 34567',
                'telephone' => '555-345-6789'
            ],
            [
                'plant_name' => 'North Distribution Hub',
                'address' => '101 Logistics Way, North Town, 45678',
                'telephone' => '555-456-7890'
            ],
            [
                'plant_name' => 'South Research Facility',
                'address' => '202 Innovation Parkway, South City, 56789',
                'telephone' => '555-567-8901'
            ],
        ];

        foreach ($plants as $plant) {
            Plant::create($plant);
        }
    }
}
