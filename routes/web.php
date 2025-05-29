<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\DepartmentController as AdminDepartmentController;
use App\Http\Controllers\Admin\LocationController as AdminLocationController;
use App\Http\Controllers\Admin\EquipmentController as AdminEquipmentController;
use App\Http\Controllers\Admin\PlantController as AdminPlantController;
use App\Http\Controllers\Admin\TrackingController as AdminTrackingController;
use App\Http\Controllers\Admin\Auth\AdminLoginController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
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
});

// Admin Authentication Routes
Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('login', [AdminLoginController::class, 'create'])
            ->name('login');
        Route::post('login', [AdminLoginController::class, 'store'])
            ->name('login.store');
    });

    Route::middleware('auth')->group(function () {
        Route::post('logout', [AdminLoginController::class, 'destroy'])
            ->name('logout');
        
        // Admin Dashboard
        Route::get('dashboard', [AdminDashboardController::class, 'index'])
            ->name('dashboard');
        
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
        
        // Additional routes for searching departments, plants, and locations
        Route::get('departments/search', [AdminDepartmentController::class, 'searchDepartments'])->name('departments.search-departments');
        Route::post('departments/create', [AdminDepartmentController::class, 'createDepartment'])->name('departments.create-department');
        Route::get('plants/search', [AdminPlantController::class, 'searchPlants'])->name('plants.search-plants');
        Route::post('plants/create', [AdminPlantController::class, 'createPlant'])->name('plants.create-plant');
        Route::get('locations/search', [AdminLocationController::class, 'searchLocations'])->name('locations.search-locations');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
