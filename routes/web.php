<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\DepartmentController as AdminDepartmentController;
use App\Http\Controllers\Admin\LocationController as AdminLocationController;
use App\Http\Controllers\Admin\EquipmentController as AdminEquipmentController;
use App\Http\Controllers\Admin\PlantController as AdminPlantController;
use App\Http\Controllers\Admin\Auth\AdminLoginController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\TrackingController as AdminTrackingController;

use App\Http\Controllers\Api\TrackIncomingController as ApiTrackingController;
use App\Models\User;
use App\Models\Location;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware('auth')->group(function () {
    Route::post('logout', [\App\Http\Controllers\Auth\EmployeeLoginController::class, 'destroy'])
        ->name('logout');
});

// Employee Routes (authenticated)
Route::prefix('employee')->name('employee.')->middleware('auth')->group(function () {
    // Employee Tracking Routes
    Route::get('tracking', [\App\Http\Controllers\Employee\TrackingController::class, 'index'])
        ->name('tracking.index');
    Route::get('tracking/equipment/{equipment}', [\App\Http\Controllers\Employee\TrackingController::class, 'show'])
        ->name('tracking.equipment.show');
    Route::post('tracking/equipment/{equipment}/check-in', [\App\Http\Controllers\Employee\TrackingController::class, 'checkIn'])
        ->name('tracking.equipment.check-in');
    Route::post('tracking/equipment/{equipment}/check-out', [\App\Http\Controllers\Employee\TrackingController::class, 'checkOut'])
        ->name('tracking.equipment.check-out');
    
    // Employee Tracking Request Routes
    Route::get('tracking/request', [\App\Http\Controllers\Employee\TrackingController::class, 'requestIndex'])
        ->name('tracking.request.index');
    Route::post('tracking/request', [\App\Http\Controllers\Employee\TrackingController::class, 'requestStore'])
        ->name('tracking.request.store');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Main dashboard - redirects based on role
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

        
    // Tracking management - API routes (AJAX)
    Route::prefix('api')->group(function () {
        Route::get('tracking/request/generate-recall', [ApiTrackingController::class, 'generateUniqueRecall'])->name('api.tracking.request.generate-recall');
        Route::post('tracking/request', [ApiTrackingController::class, 'store'])->name('api.tracking.request.store');
        Route::post('tracking/request/confirm-pin', [ApiTrackingController::class, 'confirmRequestPin'])->name('api.tracking.request.confirm-pin');
        Route::get('track-outgoing/search', [ApiTrackingController::class, 'searchTrackOutgoing'])->name('api.track-outgoing.search');
        Route::get('track-incoming/search', [ApiTrackingController::class, 'searchTrackIncoming'])->name('api.track-incoming.search');
    });
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
        
        // Users management - specific routes before resource
        Route::get('search-by-barcode/users', [AdminUserController::class, 'searchByBarcode'])->name('users.search-by-barcode');
        
        Route::resource('users', AdminUserController::class)->parameters([
            'users' => 'user:employee_id'
        ]);
        
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
        
        Route::resource('plants', AdminPlantController::class)->parameters([
            'plants' => 'plant:plant_id'
        ]);
        
        // Tracking management - Web routes (rendering)
        Route::get('tracking', [AdminTrackingController::class, 'index'])->name('tracking.index');
        Route::get('tracking/request', [AdminTrackingController::class, 'requestIndex'])->name('tracking.request.index');
        Route::get('tracking/request/{id}', [AdminTrackingController::class, 'requestShow'])->name('tracking.request.show');
        Route::get('tracking/incoming', [AdminTrackingController::class, 'trackIncomingIndex'])->name('tracking.incoming.index');
        Route::get('tracking/incoming/{trackIncoming}', [AdminTrackingController::class, 'trackIncomingShow'])->name('tracking.incoming.show');
        Route::get('tracking/outgoing', [AdminTrackingController::class, 'trackOutgoingIndex'])->name('tracking.outgoing.index');
        Route::get('tracking/outgoing/{trackOutgoing}', [AdminTrackingController::class, 'trackOutgoingShow'])->name('tracking.outgoing.show');
        Route::get('tracking/outgoing/{trackOutgoing}/certificate', [AdminTrackingController::class, 'viewCertificate'])->name('tracking.outgoing.certificate');
    
        // Additional routes for searching departments, plants, and locations
        Route::get('search/departments/', [AdminDepartmentController::class, 'searchDepartments'])->name('departments.search-departments');
        Route::post('departments/create', [AdminDepartmentController::class, 'createDepartment'])->name('departments.create-department');
        Route::get('search/plants', [AdminPlantController::class, 'searchPlants'])->name('plants.search-plants');
        Route::post('plants/create', [AdminPlantController::class, 'createPlant'])->name('plants.create-plant');
        Route::get('search/locations', [AdminLocationController::class, 'searchLocations'])->name('locations.search-locations');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
