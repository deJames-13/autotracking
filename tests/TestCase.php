<?php

namespace Tests;

use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Models\Plant;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * Set up the test environment.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Enable foreign key constraints for SQLite
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys=ON');
        }

        // Run migrations
        $this->artisan('migrate:fresh');

        // Seed essential data for tests
        $this->seedEssentialData();
    }

    /**
     * Seed essential data needed for tests
     */
    protected function seedEssentialData(): void
    {
        // Seed roles, departments, and plants
        Artisan::call('db:seed', ['--class' => 'RoleSeeder']);
        Artisan::call('db:seed', ['--class' => 'DepartmentSeeder']);
        Artisan::call('db:seed', ['--class' => 'PlantSeeder']);
    }

    /**
     * Create a user for testing with existing seeded data
     */
    protected function createUserWithSeededData(string $role = 'employee'): User
    {
        $roleId = match ($role) {
            'admin' => 1,
            'employee' => 2,
            'technician' => 3,
            default => 2,
        };

        $departmentId = match ($role) {
            'admin' => 1, // Admin department
            'technician' => 2, // Calibrations department
            default => 1, // Default to Admin department
        };

        return User::factory()->withExistingRelations($roleId, $departmentId, 1)->create();
    }

    /**
     * Create admin user for testing
     */
    protected function createAdminUser(): User
    {
        return $this->createUserWithSeededData('admin');
    }

    /**
     * Create employee user for testing
     */
    protected function createEmployeeUser(): User
    {
        return $this->createUserWithSeededData('employee');
    }

    /**
     * Create technician user for testing
     */
    protected function createTechnicianUser(): User
    {
        return $this->createUserWithSeededData('technician');
    }
}
