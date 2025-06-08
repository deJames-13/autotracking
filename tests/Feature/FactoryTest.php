<?php

use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Models\Plant;

test('user factory creates user with valid relationships', function () {
    $user = User::factory()->create();
    
    expect($user)->toBeInstanceOf(User::class)
        ->and($user->role)->toBeInstanceOf(Role::class)
        ->and($user->department)->toBeInstanceOf(Department::class)
        ->and($user->plant)->toBeInstanceOf(Plant::class);
});

test('user factory can create admin user', function () {
    $admin = User::factory()->admin()->create();
    
    expect($admin->role->role_name)->toBe('admin')
        ->and($admin->department->department_name)->toBe('Admin');
});

test('user factory can create employee user', function () {
    $employee = User::factory()->employee()->create();
    
    expect($employee->role->role_name)->toBe('employee');
});

test('user factory can create technician user', function () {
    $technician = User::factory()->technician()->create();
    
    expect($technician->role->role_name)->toBe('technician')
        ->and($technician->department->department_name)->toBe('Calibrations');
});

test('user factory can use existing relationships', function () {
    // This tests the scenario where we want to use seeded data
    $user = User::factory()->withExistingRelations(1, 1, 1)->create();
    
    expect($user->role_id)->toBe(1)
        ->and($user->department_id)->toBe(1)
        ->and($user->plant_id)->toBe(1);
});

test('role factory creates valid roles', function () {
    $role = Role::factory()->create();
    expect($role)->toBeInstanceOf(Role::class)
        ->and($role->role_name)->toBeIn(['admin', 'employee', 'technician']);
});

test('department factory creates valid departments', function () {
    $department = Department::factory()->create();
    expect($department)->toBeInstanceOf(Department::class)
        ->and($department->department_name)->not()->toBeEmpty();
});

test('plant factory creates valid plants', function () {
    $plant = Plant::factory()->create();
    expect($plant)->toBeInstanceOf(Plant::class)
        ->and($plant->plant_name)->toBeIn(['P1', 'P2', 'P3']);
});
