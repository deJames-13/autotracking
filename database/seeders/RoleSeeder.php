<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['role_name' => 'admin', 'created_at' => now(), 'updated_at' => now()],
            ['role_name' => 'employee', 'created_at' => now(), 'updated_at' => now()],
            ['role_name' => 'technician', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('roles')->insert($roles);
    }
}