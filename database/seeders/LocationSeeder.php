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
                'location_name' => 'Annex A',
                'department_id' => 1, // Calibrations
            ],
            [
                'location_name' => 'Annex B',
                'department_id' => 2, // Tracking
            ],
            [
                'location_name' => 'Building B',
                'department_id' => 3, // Constructions
            ],
            [
                'location_name' => 'Building A Floor 2',
                'department_id' => 4, // HR
            ],
            [
                'location_name' => 'Building B Basement',
                'department_id' => 5, // Electrical
            ],
        ];

        foreach ($locations as $location) {
            Location::create($location);
        }
    }
}
