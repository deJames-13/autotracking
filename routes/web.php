<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\DepartmentController as AdminDepartmentController;
use App\Http\Controllers\Admin\LocationController as AdminLocationController;
use App\Http\Controllers\Admin\EquipmentController as AdminEquipmentController;
use App\Http\Controllers\Admin\PlantController as AdminPlantController;
use App\Http\Controllers\Admin\TrackingController as AdminTrackingController;
use App\Models\User;
use App\Models\Location;
use App\Models\TrackingRecord;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // Admin CRUD routes with proper server-side handling
    Route::prefix('admin')->name('admin.')->group(function () {
        
        // Users management
        Route::resource('users', AdminUserController::class)->parameters([
            'users' => 'user:employee_id'
        ]);
        
        // Departments management  
        Route::resource('departments', AdminDepartmentController::class)->parameters([
            'departments' => 'department:department_id'
        ]);
        
        // Locations management - Better organization of routes
        // API routes first (not using resource route naming patterns)
        Route::get('locations/api/search-departments', [AdminLocationController::class, 'searchDepartments'])
            ->name('locations.search-departments');
        Route::post('locations/api/create-department', [AdminLocationController::class, 'createDepartment'])
            ->name('locations.create-department');
        
        // Standard resource routes
        Route::resource('locations', AdminLocationController::class)->parameters([
            'locations' => 'location:location_id'
        ]);
        
        // Equipment management
        Route::resource('equipment', AdminEquipmentController::class)->parameters([
            'equipment' => 'equipment:equipment_id'
        ]);
        
        // Plants management
        Route::resource('plants', AdminPlantController::class)->parameters([
            'plants' => 'plant:plant_id'
        ]);
        
        // Tracking management
        Route::get('tracking', [AdminTrackingController::class, 'index'])->name('tracking.index');
        Route::get('tracking/request', [AdminTrackingController::class, 'requestIndex'])->name('tracking.request.index');
    });

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
