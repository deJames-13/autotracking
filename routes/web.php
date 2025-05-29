<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\DepartmentController as AdminDepartmentController;
use App\Http\Controllers\Admin\LocationController as AdminLocationController;
use App\Http\Controllers\Admin\EquipmentController as AdminEquipmentController;
use App\Http\Controllers\Admin\PlantController as AdminPlantController;
use App\Http\Controllers\TrackingController;
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
        
        // Tracking Records management
        Route::get('tracking-records', function () {
            return Inertia::render('admin/tracking-records/index');
        })->name('tracking-records.index');
    });

    // Tracking workflow routes
    Route::middleware(['auth'])->prefix('tracking')->name('tracking.')->group(function () {
        Route::post('/incoming', [TrackingController::class, 'incoming'])->name('incoming');
        Route::post('/outgoing/{trackingRecord}', [TrackingController::class, 'outgoing'])->name('outgoing');
        Route::get('/pdf/{trackingRecord}', [TrackingController::class, 'generatePdf'])->name('pdf');
        Route::post('/scan-equipment', [TrackingController::class, 'scanEquipment'])->name('scan.equipment');
        Route::post('/scan-employee', [TrackingController::class, 'scanEmployee'])->name('scan.employee');
        Route::get('/overdue', [TrackingController::class, 'getOverdueItems'])->name('overdue');
        Route::get('/due-soon', [TrackingController::class, 'getItemsDueSoon'])->name('due-soon');
    });

    // Tracking pages
    Route::middleware(['auth'])->group(function () {
        Route::get('/tracking/incoming', function () {
            $users = User::with(['role', 'department'])->get();
            $locations = Location::with('department')->get();
            
            return Inertia::render('tracking/incoming', [
                'users' => $users,
                'locations' => $locations,
            ]);
        })->name('tracking.incoming.page');

        Route::get('/tracking/outgoing', function () {
            $trackingRecords = TrackingRecord::with(['equipment', 'technician', 'location'])
                ->whereNull('date_out')
                ->orderBy('date_in', 'asc')
                ->paginate(15);
                
            return Inertia::render('tracking/outgoing', [
                'trackingRecords' => $trackingRecords,
            ]);
        })->name('tracking.outgoing.page');

        // Additional tracking pages
        Route::get('/tracking/active', function () {
            $trackingRecords = TrackingRecord::with(['equipment', 'technician', 'location', 'employeeIn'])
                ->whereNull('date_out')
                ->orderBy('date_in', 'desc')
                ->paginate(15);
                
            return Inertia::render('tracking/active', [
                'trackingRecords' => $trackingRecords,
            ]);
        })->name('tracking.active.page');

        Route::get('/tracking/overdue', function () {
            $trackingRecords = TrackingRecord::with(['equipment', 'technician', 'location'])
                ->where('cal_due_date', '<', now())
                ->whereNull('date_out')
                ->orderBy('cal_due_date', 'asc')
                ->paginate(15);
                
            return Inertia::render('tracking/overdue', [
                'trackingRecords' => $trackingRecords,
            ]);
        })->name('tracking.overdue.page');

        Route::get('/tracking/due-soon', function () {
            $trackingRecords = TrackingRecord::with(['equipment', 'technician', 'location'])
                ->whereBetween('cal_due_date', [now(), now()->addDays(7)])
                ->whereNull('date_out')
                ->orderBy('cal_due_date', 'asc')
                ->paginate(15);
                
            return Inertia::render('tracking/due-soon', [
                'trackingRecords' => $trackingRecords,
            ]);
        })->name('tracking.due-soon.page');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
