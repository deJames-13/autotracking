<?php

use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\PlantController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\TrackIncomingController;
use App\Http\Controllers\Api\TrackOutgoingController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Sanctum user route
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public API routes (if needed)
Route::prefix('v1')->group(function () {
    // Roles (read-only for public)
    Route::get('roles', [RoleController::class, 'index']);
    Route::get('roles/{role}', [RoleController::class, 'show']);
});

// Protected API routes - Remove auth:sanctum for now and use web middleware
Route::middleware(['auth', 'web'])->prefix('v1')->group(function () {
    
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
    
    // Additional specific endpoints
    Route::prefix('users')->group(function () {
        Route::get('{user}/equipment', [UserController::class, 'equipment'])->name('users.equipment');
        Route::get('{user}/track-incoming', [UserController::class, 'trackIncoming'])->name('users.track-incoming');
    });
    
    Route::prefix('equipment')->group(function () {
        Route::get('{equipment}/track-incoming', [EquipmentController::class, 'trackIncoming'])->name('equipment.track-incoming');
        Route::post('{equipment}/assign-user', [EquipmentController::class, 'assignUser'])->name('equipment.assign-user');
        Route::delete('{equipment}/unassign-user', [EquipmentController::class, 'unassignUser'])->name('equipment.unassign-user');
    });
    
    Route::prefix('departments')->group(function () {
        Route::get('{department}/users', [DepartmentController::class, 'users'])->name('departments.users');
        Route::get('{department}/locations', [DepartmentController::class, 'locations'])->name('departments.locations');
    });
    
    // New tracking system routes - Custom routes must come BEFORE apiResource
    Route::prefix('track-incoming')->group(function () {
        Route::get('pending', [\App\Http\Controllers\Api\TrackIncomingController::class, 'pending'])->name('track-incoming.pending');
        Route::get('overdue', [\App\Http\Controllers\Api\TrackIncomingController::class, 'overdue'])->name('track-incoming.overdue');
        Route::get('archived', [\App\Http\Controllers\Api\TrackIncomingController::class, 'archived'])->name('track-incoming.archived');
        Route::post('{id}/restore', [\App\Http\Controllers\Api\TrackIncomingController::class, 'restore'])->name('track-incoming.restore');
    });
    
    Route::prefix('track-outgoing')->group(function () {
        Route::get('due-soon', [\App\Http\Controllers\Api\TrackOutgoingController::class, 'dueSoon'])->name('track-outgoing.due-soon');
        Route::get('archived', [\App\Http\Controllers\Api\TrackOutgoingController::class, 'archived'])->name('track-outgoing.archived');
        Route::post('{id}/restore', [\App\Http\Controllers\Api\TrackOutgoingController::class, 'restore'])->name('track-outgoing.restore');
    });
    
    // API Resource routes come after custom routes to avoid conflicts
    Route::apiResource('track-incoming', \App\Http\Controllers\Api\TrackIncomingController::class);
    Route::apiResource('track-outgoing', \App\Http\Controllers\Api\TrackOutgoingController::class);
});

// Add this at the top for testing
Route::middleware(['auth', 'web'])->get('/v1/test', function() {
    return response()->json(['message' => 'API is working', 'user' => auth()->user()]);
});
