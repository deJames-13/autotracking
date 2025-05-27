<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // Add web-based CRUD routes for Inertia.js pages
    Route::prefix('admin')->name('admin.')->group(function () {
        // Users management
        Route::get('users', function () {
            return Inertia::render('admin/users/index');
        })->name('users.index');
        
        Route::get('users/create', function () {
            return Inertia::render('admin/users/create');
        })->name('users.create');
        
        Route::get('users/{user}/edit', function () {
            return Inertia::render('admin/users/edit');
        })->name('users.edit');
        
        // Equipment management
        Route::get('equipment', function () {
            return Inertia::render('admin/equipment/index');
        })->name('equipment.index');
        
        Route::get('equipment/create', function () {
            return Inertia::render('admin/equipment/create');
        })->name('equipment.create');
        
        Route::get('equipment/{equipment}/edit', function () {
            return Inertia::render('admin/equipment/edit');
        })->name('equipment.edit');
        
        // Tracking Records management
        Route::get('tracking-records', function () {
            return Inertia::render('admin/tracking-records/index');
        })->name('tracking-records.index');
        
        Route::get('tracking-records/create', function () {
            return Inertia::render('admin/tracking-records/create');
        })->name('tracking-records.create');
        
        Route::get('tracking-records/{trackingRecord}/edit', function () {
            return Inertia::render('admin/tracking-records/edit');
        })->name('tracking-records.edit');
        
        // Departments management
        Route::get('departments', function () {
            return Inertia::render('admin/departments/index');
        })->name('departments.index');
        
        Route::get('departments/create', function () {
            return Inertia::render('admin/departments/create');
        })->name('departments.create');
        
        Route::get('departments/{department}/edit', function () {
            return Inertia::render('admin/departments/edit');
        })->name('departments.edit');
        
        // Plants management
        Route::get('plants', function () {
            return Inertia::render('admin/plants/index');
        })->name('plants.index');
        
        Route::get('plants/create', function () {
            return Inertia::render('admin/plants/create');
        })->name('plants.create');
        
        Route::get('plants/{plant}/edit', function () {
            return Inertia::render('admin/plants/edit');
        })->name('plants.edit');
        
        // Locations management
        Route::get('locations', function () {
            return Inertia::render('admin/locations/index');
        })->name('locations.index');
        
        Route::get('locations/create', function () {
            return Inertia::render('admin/locations/create');
        })->name('locations.create');
        
        Route::get('locations/{location}/edit', function () {
            return Inertia::render('admin/locations/edit');
        })->name('locations.edit');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
