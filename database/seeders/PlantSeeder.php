<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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
                'address' => 'Km 22 East Service Road, Cupang, Muntinlupa City',
                'telephone' => '(632) 8850-7000',
                'created_at' => now(),
                'updated_at' => now()
            ],
        ];

        DB::table('plants')->insert($plants);
    }
}
