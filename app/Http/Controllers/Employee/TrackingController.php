<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\TrackingRecord;
use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TrackingController extends Controller
{
    /**
     * Display the employee tracking index page.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        // Get equipment assigned to this employee
        $assignedEquipment = Equipment::where('employee_id', $user->employee_id)
            ->with(['trackingRecords' => function($query) {
                $query->latest()->limit(5);
            }])
            ->get();

        // Get recent tracking activities for this employee
        $recentActivities = TrackingRecord::where(function($query) use ($user) {
                $query->where('employee_id_in', $user->employee_id)
                      ->orWhere('employee_id_out', $user->employee_id);
            })
            ->with(['equipment', 'location'])
            ->latest()
            ->limit(10)
            ->get();

        // Get overdue equipment assigned to this employee
        $overdueEquipment = Equipment::where('employee_id', $user->employee_id)
            ->whereHas('trackingRecords', function($query) {
                $query->where('cal_due_date', '<', now())
                      ->whereNull('date_in');
            })
            ->with(['trackingRecords' => function($query) {
                $query->whereNull('date_in')->latest();
            }])
            ->get();

        return Inertia::render('employee/tracking/index', [
            'assignedEquipment' => $assignedEquipment,
            'recentActivities' => $recentActivities,
            'overdueEquipment' => $overdueEquipment,
            'stats' => [
                'total_assigned' => $assignedEquipment->count(),
                'overdue_count' => $overdueEquipment->count(),
                'recent_activities' => $recentActivities->count(),
            ]
        ]);
    }

    /**
     * Show specific equipment details.
     */
    public function show(Equipment $equipment, Request $request): Response
    {
        $user = Auth::user();
        
        // Check if equipment is assigned to this employee
        if ($equipment->employee_id !== $user->employee_id) {
            abort(403, 'You do not have access to this equipment.');
        }

        $equipment->load([
            'trackingRecords' => function($query) {
                $query->with(['location', 'employeeIn', 'employeeOut', 'technician'])
                      ->latest();
            }
        ]);

        $locations = Location::all();

        return Inertia::render('employee/tracking/equipment-detail', [
            'equipment' => $equipment,
            'locations' => $locations
        ]);
    }

    /**
     * Check in equipment.
     */
    public function checkIn(Equipment $equipment, Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        // Verify equipment belongs to this employee
        if ($equipment->employee_id !== $user->employee_id) {
            abort(403, 'You do not have access to this equipment.');
        }

        $request->validate([
            'location_id' => 'required|exists:locations,location_id',
            'pin' => 'required|string|min:4',
        ]);

        // Verify employee PIN
        if (!Hash::check($request->pin, $user->pin)) {
            throw ValidationException::withMessages([
                'pin' => 'Invalid PIN provided.',
            ]);
        }

        // Find the latest tracking record for this equipment
        $latestRecord = TrackingRecord::where('equipment_id', $equipment->equipment_id)
            ->whereNull('date_in')
            ->latest()
            ->first();

        if (!$latestRecord) {
            throw ValidationException::withMessages([
                'equipment' => 'No active tracking record found for this equipment.',
            ]);
        }

        // Update the tracking record with check-in information
        $latestRecord->update([
            'date_in' => now(),
            'location_id_in' => $request->location_id,
            'employee_id_in' => $user->employee_id,
        ]);

        return redirect()->back()->with('success', 'Equipment checked in successfully.');
    }

    /**
     * Check out equipment.
     */
    public function checkOut(Equipment $equipment, Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        // Verify equipment belongs to this employee
        if ($equipment->employee_id !== $user->employee_id) {
            abort(403, 'You do not have access to this equipment.');
        }

        $request->validate([
            'location_id' => 'required|exists:locations,location_id',
            'pin' => 'required|string|min:4',
            'notes' => 'nullable|string|max:500',
        ]);

        // Verify employee PIN
        if (!Hash::check($request->pin, $user->pin)) {
            throw ValidationException::withMessages([
                'pin' => 'Invalid PIN provided.',
            ]);
        }

        // Create new tracking record for check-out
        TrackingRecord::create([
            'equipment_id' => $equipment->equipment_id,
            'employee_id_out' => $user->employee_id,
            'location_id_out' => $request->location_id,
            'date_out' => now(),
            'notes' => $request->notes,
        ]);

        return redirect()->back()->with('success', 'Equipment checked out successfully.');
    }
}
