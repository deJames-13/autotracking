<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $locations = [
            [
                'location_name' => 'Assembly Line A',
                'department_id' => 2, // Production
            ],
            [
                'location_name' => 'Testing Lab',
                'department_id' => 3, // Quality Assurance
            ],
            [
                'location_name' => 'Design Office',
                'department_id' => 1, // Engineering
            ],
            [
                'location_name' => 'Equipment Room',
                'department_id' => 4, // Maintenance
            ],
            [
                'location_name' => 'Shipping Dock',
                'department_id' => 5, // Logistics
            ],
        ];

        foreach ($locations as $location) {
            Location::create($location);
        }
    }
}
