<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\DepartmentController as AdminDepartmentController;
use App\Http\Controllers\Admin\LocationController as AdminLocationController;
use App\Http\Controllers\Admin\EquipmentController as AdminEquipmentController;
use App\Http\Controllers\Admin\PlantController as AdminPlantController;
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
        
        // Locations management
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
        
    });

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
