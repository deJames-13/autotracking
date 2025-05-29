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
        
        // Departments management with API endpoints
        Route::get('departments/api/search-departments', [AdminDepartmentController::class, 'searchDepartments'])
            ->name('departments.search-departments');
        Route::post('departments/api/create-department', [AdminDepartmentController::class, 'createDepartment'])
            ->name('departments.create-department');  
        
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
        
        // Plants management with API endpoints
        Route::get('plants/api/search-plants', [AdminPlantController::class, 'searchPlants'])
            ->name('plants.search-plants');
        Route::post('plants/api/create-plant', [AdminPlantController::class, 'createPlant'])
            ->name('plants.create-plant');
        
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
