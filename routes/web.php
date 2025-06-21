<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ADMIN
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\DepartmentController as AdminDepartmentController;
use App\Http\Controllers\Admin\LocationController as AdminLocationController;
use App\Http\Controllers\Admin\EquipmentController as AdminEquipmentController;
use App\Http\Controllers\Admin\PlantController as AdminPlantController;
use App\Http\Controllers\Admin\Auth\AdminLoginController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\TrackingController as AdminTrackingController;


//EMPLOYEE
use App\Http\Controllers\Employee\TrackingController as EmployeeTrackingController;



// API
use App\Http\Controllers\Api\TrackIncomingController as ApiTrackingController;
use App\Http\Controllers\Api\ReportTableController;

// MODELS
use App\Models\User;
use App\Models\Location;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware('auth')->group(function () {
    Route::post('logout', [\App\Http\Controllers\Auth\EmployeeLoginController::class, 'destroy'])
        ->name('logout');
});

// Employee Routes (authenticated)
Route::prefix('employee')->name('employee.')->middleware('auth')->group(function () {
    // Employee tracking routes
    Route::prefix('tracking')->name('tracking.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Employee\TrackingController::class, 'index'])->name('index');
        
        // Request routes
        Route::get('request', [\App\Http\Controllers\Employee\TrackingController::class, 'requestIndex'])->name('request.index');
        
        // Incoming routes
        Route::get('incoming', [\App\Http\Controllers\Employee\TrackingController::class, 'trackIncomingIndex'])->name('incoming.index');
        Route::get('incoming/{trackIncoming}', [\App\Http\Controllers\Employee\TrackingController::class, 'trackIncomingShow'])->name('incoming.show');
        
        // Outgoing routes
        Route::get('outgoing', [\App\Http\Controllers\Employee\TrackingController::class, 'trackOutgoingIndex'])->name('outgoing.index');
        Route::get('outgoing/{trackOutgoing}', [\App\Http\Controllers\Employee\TrackingController::class, 'trackOutgoingShow'])->name('outgoing.show');
        
        // API routes for employee tracking
        Route::prefix('api')->name('api.')->group(function () {
            // Incoming API routes
            Route::get('incoming', [\App\Http\Controllers\Api\Employee\TrackIncomingController::class, 'index'])->name('incoming.index');
            Route::post('incoming', [\App\Http\Controllers\Api\Employee\TrackIncomingController::class, 'store'])->name('incoming.store');
            Route::get('incoming/{trackIncoming}', [\App\Http\Controllers\Api\Employee\TrackIncomingController::class, 'show'])->name('incoming.show');
            Route::put('incoming/{trackIncoming}', [\App\Http\Controllers\Api\Employee\TrackIncomingController::class, 'update'])->name('incoming.update');
            Route::get('incoming/pending/confirmation', [\App\Http\Controllers\Api\Employee\TrackIncomingController::class, 'pendingConfirmation'])->name('incoming.pending-confirmation');
            
            // Outgoing API routes
            Route::get('outgoing', [\App\Http\Controllers\Api\Employee\TrackOutgoingController::class, 'index'])->name('outgoing.index');
            Route::get('outgoing/{trackOutgoing}', [\App\Http\Controllers\Api\Employee\TrackOutgoingController::class, 'show'])->name('outgoing.show');
            Route::get('outgoing/ready/pickup', [\App\Http\Controllers\Api\Employee\TrackOutgoingController::class, 'readyForPickup'])->name('outgoing.ready-pickup');
            Route::get('outgoing/completed', [\App\Http\Controllers\Api\Employee\TrackOutgoingController::class, 'completed'])->name('outgoing.completed');
            Route::get('outgoing/due/recalibration', [\App\Http\Controllers\Api\Employee\TrackOutgoingController::class, 'dueForRecalibration'])->name('outgoing.due-recalibration');
            Route::post('outgoing/{trackOutgoing}/confirm-pickup', [\App\Http\Controllers\Api\Employee\TrackOutgoingController::class, 'confirmPickup'])->name('outgoing.confirm-pickup');
        });
    });
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Main dashboard - redirects based on role
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

        
    // Tracking management - API routes (AJAX)
    // TODO: because it is in web, meaning it is accessible in web
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('tracking/request/generate-recall', [ApiTrackingController::class, 'generateUniqueRecall'])->name('tracking.request.generate-recall');
        Route::post('tracking/request', [ApiTrackingController::class, 'store'])->name('tracking.request.store');
        Route::post('tracking/request/confirm-pin', [ApiTrackingController::class, 'confirmRequestPin'])->name('tracking.request.confirm-pin');
        Route::post('tracking/incoming/{trackIncoming}/confirm', [ApiTrackingController::class, 'confirmEmployeeRequest'])->name('tracking.incoming.confirm');
        Route::get('track-outgoing/search', [ApiTrackingController::class, 'searchTrackOutgoing'])->name('track-outgoing.search');
        Route::get('track-incoming/search', [ApiTrackingController::class, 'searchTrackIncoming'])->name('track-incoming.search');
        Route::post('track-outgoing', [\App\Http\Controllers\Api\TrackOutgoingController::class, 'store'])->name('track-outgoing.store');
        Route::post('track-outgoing/confirm-pickup/{trackOutgoing}', [\App\Http\Controllers\Api\TrackOutgoingController::class, 'confirmPickup'])->name('track-outgoing.confirm-pickup');

        // Report Table API Routes
        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('table', [ReportTableController::class, 'index'])->name('table.index');
            Route::get('table/filter-options', [ReportTableController::class, 'filterOptions'])->name('table.filter-options');
            Route::get('table/export/{format}', [ReportTableController::class, 'export'])->name('table.export');
        });

        Route::get('users/search', [AdminUserController::class, 'searchUsers'])->name('users.search');
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
        Route::get('users/table-data', [AdminUserController::class, 'tableData'])->name('users.table-data');
        Route::post('users/generate-employee-id', [AdminUserController::class, 'generateNewEmployeeId'])->name('users.generate-employee-id');
        Route::post('users/{user:employee_id}/reset-password', [AdminUserController::class, 'resetPassword'])->name('users.reset-password');
        Route::post('users/validate-email', [AdminUserController::class, 'validateEmail'])->name('users.validate-email');
        Route::get('email/health', [AdminUserController::class, 'checkEmailHealth'])->name('email.health');
        Route::post('email/test', [AdminUserController::class, 'testEmailSystem'])->name('email.test');
        
        // Tracking table data routes
        Route::get('tracking/incoming/table-data', [AdminTrackingController::class, 'trackIncomingTableData'])->name('tracking.incoming.table-data');
        Route::get('tracking/incoming/filter-options', [AdminTrackingController::class, 'trackIncomingFilterOptions'])->name('tracking.incoming.filter-options');
        Route::get('tracking/outgoing/table-data', [AdminTrackingController::class, 'trackOutgoingTableData'])->name('tracking.outgoing.table-data');
        Route::get('tracking/outgoing/filter-options', [AdminTrackingController::class, 'trackOutgoingFilterOptions'])->name('tracking.outgoing.filter-options');
        
        // Restore routes for soft deleted records
        Route::post('users/{id}/restore', [AdminUserController::class, 'restore'])->name('users.restore');
        Route::post('departments/{id}/restore', [AdminDepartmentController::class, 'restore'])->name('departments.restore');
        Route::post('locations/{id}/restore', [AdminLocationController::class, 'restore'])->name('locations.restore');
        Route::post('equipment/{id}/restore', [AdminEquipmentController::class, 'restore'])->name('equipment.restore');
        Route::post('plants/{id}/restore', [AdminPlantController::class, 'restore'])->name('plants.restore');
        
        // Force delete routes for permanent deletion
        Route::delete('users/{id}/force-delete', [AdminUserController::class, 'forceDelete'])->name('users.force-delete');
        Route::delete('plants/{id}/force-delete', [AdminPlantController::class, 'forceDelete'])->name('plants.force-delete');
        
        // Archived records routes
        Route::get('users/archived', [AdminUserController::class, 'archived'])->name('users.archived');
        Route::get('departments/archived', [AdminDepartmentController::class, 'archived'])->name('departments.archived');
        Route::get('locations/archived', [AdminLocationController::class, 'archived'])->name('locations.archived');
        Route::get('equipment/archived', [AdminEquipmentController::class, 'archived'])->name('equipment.archived');
        Route::get('plants/archived', [AdminPlantController::class, 'archived'])->name('plants.archived');
        
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
        Route::get('equipment/table-data', [AdminEquipmentController::class, 'tableData'])->name('equipment.table-data');
        Route::get('equipment/plants/search', [AdminEquipmentController::class, 'searchPlants'])->name('equipment.plants.search');
        Route::get('equipment/departments/search', [AdminEquipmentController::class, 'searchDepartments'])->name('equipment.departments.search');
        Route::get('equipment/locations/search', [AdminEquipmentController::class, 'searchLocations'])->name('equipment.locations.search');
        Route::post('equipment/plants/create', [AdminPlantController::class, 'createPlant'])->name('equipment.plants.create');
        Route::post('equipment/departments/create', [AdminDepartmentController::class, 'createDepartment'])->name('equipment.departments.create');
        Route::post('equipment/locations/create', [AdminLocationController::class, 'createLocation'])->name('equipment.locations.create');
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
        Route::get('tracking/outgoing/{trackOutgoing}/edit', [AdminTrackingController::class, 'trackOutgoingEdit'])->name('tracking.outgoing.edit');
        Route::get('tracking/outgoing/{trackOutgoing}/certificate', [AdminTrackingController::class, 'viewCertificate'])->name('tracking.outgoing.certificate');
    
        // Additional routes for searching departments, plants, and locations
        Route::get('search/departments/', [AdminDepartmentController::class, 'searchDepartments'])->name('departments.search-departments');
        Route::post('departments/create', [AdminDepartmentController::class, 'createDepartment'])->name('departments.create-department');
        Route::get('search/plants', [AdminPlantController::class, 'searchPlants'])->name('plants.search-plants');
        Route::post('plants/create', [AdminPlantController::class, 'createPlant'])->name('plants.create-plant');
        Route::get('search/locations', [AdminLocationController::class, 'searchLocations'])->name('locations.search-locations');
        Route::post('locations/create', [AdminLocationController::class, 'createLocation'])->name('locations.create-location');
    });
});

// Equipment API route for searching by recall number
Route::get('equipment/search-by-recall', [\App\Http\Controllers\Api\EquipmentController::class, 'searchByRecall'])->name('api.equipment.search-by-recall');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// Test route for reports table (remove in production)
Route::get('/test/reports-table', function () {
    return Inertia::render('test/reports-table');
})->name('test.reports-table');
