<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use App\Models\Location;
use App\Models\User;
use App\Models\CalibrationRequest;
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
            ->with(['trackIncoming' => function($query) {
                $query->latest()->limit(5);
            }])
            ->get();

        // Get recent tracking activities for this employee
        $recentActivities = TrackIncoming::where(function($query) use ($user) {
                $query->where('employee_id_in', $user->employee_id)
                      ->orWhere('technician_id', $user->employee_id);
            })
            ->with(['equipment', 'location'])
            ->latest()
            ->limit(10)
            ->get();

        // Get overdue equipment assigned to this employee
        $overdueEquipment = Equipment::where('employee_id', $user->employee_id)
            ->whereHas('trackIncoming', function($query) {
                $query->where('due_date', '<', now())
                      ->where('status', '!=', 'ready_for_pickup');
            })
            ->with(['trackIncoming' => function($query) {
                $query->where('status', '!=', 'ready_for_pickup')->latest();
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
            'trackIncoming' => function($query) {
                $query->with(['location', 'employeeIn', 'technician'])
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
        $latestRecord = TrackIncoming::where('equipment_id', $equipment->equipment_id)
            ->where('status', '!=', 'ready_for_pickup')
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
            'location_id' => $request->location_id,
            'employee_id_in' => $user->employee_id,
            'status' => 'calibration_in_progress'
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
        TrackOutgoing::create([
            'recall_number' => $equipment->recall_number,
            'cal_date' => now(),
            'cal_due_date' => now()->addDays(30), // Default 30 days calibration cycle
            'date_out' => now(),
            'employee_id_out' => $user->employee_id,
            'cycle_time' => 24, // Default 24 hours cycle time
        ]);

        return redirect()->back()->with('success', 'Equipment checked out successfully.');
    }

    /**
     * Display the employee tracking request form.
     */
    public function requestIndex(Request $request): Response
    {
        $user = Auth::user();
        
        // Get existing equipment that could be used for routine calibration
        // Check if equipment is available based on calibration status
        $existingEquipment = Equipment::with(['plant', 'department', 'location'])
            ->where(function($query) {
                // Equipment is available if:
                // 1. It has been calibrated before (has last_calibration_date)
                // 2. OR it's not currently in calibration process
                $query->whereNotNull('last_calibration_date')
                      ->orWhere('status', '!=', 'in_calibration');
            })
            ->where('status', '!=', 'retired')
            ->get()
            ->map(function ($equipment) {
                return [
                    'id' => $equipment->equipment_id,
                    'recall_number' => $equipment->recall_number ?? "RCL-{$equipment->equipment_id}",
                    'description' => $equipment->description,
                    'serial_number' => $equipment->serial_number,
                    'model' => $equipment->model,
                    'manufacturer' => $equipment->manufacturer,
                    'plant' => $equipment->plant?->plant_name,
                    'department' => $equipment->department?->department_name,
                    'location' => $equipment->location?->location_name,
                    'last_calibration' => $equipment->last_calibration_date,
                    'next_due' => $equipment->next_calibration_due,
                    'calibration_status' => $this->getCalibrationStatus($equipment),
                ];
            });

        return Inertia::render('employee/tracking/request/index', [
            'existingEquipment' => $existingEquipment,
        ]);
    }

    /**
     * Store a new tracking request from employee.
     */
    public function requestStore(Request $request): RedirectResponse
    {
        $user = Auth::user();

        // Validate the request data
        $validated = $request->validate([
            'requestType' => 'required|in:new,routine',
            'technician' => 'required|array',
            'technician.employee_id' => 'required|exists:users,employee_id',
            'equipment' => 'required|array',
            'equipment.recallNumber' => 'required|string|max:255',
            'equipment.description' => 'required|string|max:500',
            'equipment.serialNumber' => 'required|string|max:255',
            'equipment.model' => 'nullable|string|max:255',
            'equipment.manufacturer' => 'nullable|string|max:255',
            'equipment.plant' => 'required|string|max:255',
            'equipment.department' => 'required|string|max:255',
            'equipment.location' => 'required|string|max:255',
            'confirmation' => 'required|array',
            'confirmation.receivedBy' => 'required|exists:users,employee_id',
            'confirmation.employeePin' => 'required|string|min:4',
        ]);

        // Verify employee PIN
        if (!Hash::check($validated['confirmation']['employeePin'], $user->pin)) {
            throw ValidationException::withMessages([
                'confirmation.employeePin' => 'Invalid PIN provided.',
            ]);
        }

        try {
            // Find or create equipment record
            $equipment = null;
            
            if ($validated['requestType'] === 'routine') {
                // Try to find existing equipment by recall number
                $equipment = Equipment::where('recall_number', $validated['equipment']['recallNumber'])->first();
            }

            if (!$equipment) {
                // For new requests, ensure recall number is unique
                if ($validated['requestType'] === 'new') {
                    $recallNumber = $validated['equipment']['recallNumber'];
                    
                    // If recall number already exists, generate a new one
                    while (Equipment::where('recall_number', $recallNumber)->exists()) {
                        $timestamp = now()->format('ymdHis');
                        $random = str_pad(random_int(1, 999), 3, '0', STR_PAD_LEFT);
                        $recallNumber = "RCL-{$timestamp}-{$random}";
                    }
                    
                    $validated['equipment']['recallNumber'] = $recallNumber;
                }

                // Create new equipment record
                $equipment = Equipment::create([
                    'recall_number' => $validated['equipment']['recallNumber'],
                    'description' => $validated['equipment']['description'],
                    'serial_number' => $validated['equipment']['serialNumber'],
                    'model' => $validated['equipment']['model'],
                    'manufacturer' => $validated['equipment']['manufacturer'],
                    'plant_id' => $validated['equipment']['plant'],
                    'department_id' => $validated['equipment']['department'],
                    'location_id' => $validated['equipment']['location'],
                    'employee_id' => $user->employee_id,
                    'status' => 'pending_calibration',
                ]);
            } else {
                // Update existing equipment status to pending calibration
                $equipment->update([
                    'status' => 'pending_calibration'
                ]);
            }

            // Create tracking record for the calibration request
            TrackIncoming::create([
                'recall_number' => $equipment->recall_number,
                'technician_id' => $validated['technician']['employee_id'],
                'description' => "Calibration request - {$validated['requestType']}",
                'equipment_id' => $equipment->equipment_id,
                'location_id' => $equipment->location_id,
                'due_date' => now()->addDays(7), // Default 7 days for calibration
                'date_in' => now(),
                'employee_id_in' => $validated['confirmation']['receivedBy'],
                'status' => 'pending_calibration'
            ]);

            return redirect()->route('employee.tracking.index')
                ->with('success', 'Calibration request submitted successfully! Recall Number: ' . $equipment->recall_number);

        } catch (\Exception $e) {
            \Log::error('Error creating calibration request', [
                'error' => $e->getMessage(),
                'user_id' => $user->employee_id,
                'request_data' => $validated
            ]);

            return redirect()->back()
                ->withErrors(['general' => 'An error occurred while submitting your request. Please try again.'])
                ->withInput();
        }
    }

    /**
     * Determine calibration status based on equipment data.
     */
    private function getCalibrationStatus(Equipment $equipment): string
    {
        if (!$equipment->last_calibration_date) {
            return 'never_calibrated';
        }

        if ($equipment->status === 'in_calibration') {
            return 'in_calibration';
        }

        if ($equipment->next_calibration_due && $equipment->next_calibration_due < now()) {
            return 'overdue';
        }

        if ($equipment->next_calibration_due && $equipment->next_calibration_due <= now()->addDays(30)) {
            return 'due_soon';
        }

        return 'current';
    }
}
