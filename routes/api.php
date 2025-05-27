<?php

use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\PlantController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\TrackingRecordController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public API routes (if needed)
Route::prefix('v1')->group(function () {
    // Roles (read-only for public)
    Route::get('roles', [RoleController::class, 'index']);
    Route::get('roles/{role}', [RoleController::class, 'show']);
});

// Protected API routes
Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    
    // Users
    Route::apiResource('users', UserController::class)->parameters([
        'users' => 'user:employee_id'
    ]);
    
    // Departments
    Route::apiResource('departments', DepartmentController::class)->parameters([
        'departments' => 'department:department_id'
    ]);
    
    // Plants
    Route::apiResource('plants', PlantController::class)->parameters([
        'plants' => 'plant:plant_id'
    ]);
    
    // Locations
    Route::apiResource('locations', LocationController::class)->parameters([
        'locations' => 'location:location_id'
    ]);
    
    // Equipment
    Route::apiResource('equipment', EquipmentController::class)->parameters([
        'equipment' => 'equipment:equipment_id'
    ]);
    
    // Tracking Records
    Route::apiResource('tracking-records', TrackingRecordController::class)->parameters([
        'tracking-records' => 'trackingRecord:tracking_id'
    ]);
    
    // Additional specific endpoints
    Route::prefix('users')->group(function () {
        Route::get('{user}/equipment', [UserController::class, 'equipment'])->name('users.equipment');
        Route::get('{user}/tracking-records', [UserController::class, 'trackingRecords'])->name('users.tracking-records');
    });
    
    Route::prefix('equipment')->group(function () {
        Route::get('{equipment}/tracking-records', [EquipmentController::class, 'trackingRecords'])->name('equipment.tracking-records');
        Route::post('{equipment}/assign-user', [EquipmentController::class, 'assignUser'])->name('equipment.assign-user');
        Route::delete('{equipment}/unassign-user', [EquipmentController::class, 'unassignUser'])->name('equipment.unassign-user');
    });
    
    Route::prefix('departments')->group(function () {
        Route::get('{department}/users', [DepartmentController::class, 'users'])->name('departments.users');
        Route::get('{department}/locations', [DepartmentController::class, 'locations'])->name('departments.locations');
    });
    
    Route::prefix('tracking-records')->group(function () {
        Route::post('{trackingRecord}/check-out', [TrackingRecordController::class, 'checkOut'])->name('tracking-records.check-out');
        Route::post('{trackingRecord}/recall', [TrackingRecordController::class, 'recall'])->name('tracking-records.recall');
        Route::get('overdue', [TrackingRecordController::class, 'overdue'])->name('tracking-records.overdue');
        Route::get('due-soon', [TrackingRecordController::class, 'dueSoon'])->name('tracking-records.due-soon');
    });
});
