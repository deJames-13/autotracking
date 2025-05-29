<?php

namespace App\Http\Controllers;

use App\Http\Requests\TrackingRecordRequest;
use App\Models\Equipment;
use App\Models\Location;
use App\Models\TrackingRecord;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class TrackingController extends Controller
{
    /**
     * Show incoming equipment page
     */
    public function showIncoming()
    {
        $users = User::with(['role', 'department', 'plant'])->get();
        $locations = Location::with('department')->get();
        $departments = Department::all();

        return Inertia::render('tracking/incoming', [
            'users' => $users,
            'locations' => $locations,
            'departments' => $departments,
        ]);
    }

    /**
     * Handle incoming equipment process
     */
    public function incoming(Request $request): JsonResponse
    {
        $request->validate([
            'equipment_id' => 'required_without:is_new_registration|exists:equipments,equipment_id',
            'technician_id' => 'required|exists:users,employee_id',
            'location_id' => 'required|exists:locations,location_id',
            'department_id' => 'required|exists:departments,department_id',
            'cal_date' => 'required|date',
            'cal_due_date' => 'required|date|after_or_equal:cal_date',
            'description' => 'required|string',
            'recall_number' => 'nullable|string',
            'is_new_registration' => 'boolean',
            'serial_number' => 'required_if:is_new_registration,true|string|unique:equipments,serial_number',
            'manufacturer' => 'required_if:is_new_registration,true|string',
        ]);

        $user = Auth::user();
        $location = Location::with('department')->find($request->location_id);

        // Location validation - check if user's department matches location's department
        if ($user->department_id !== $location->department_id) {
            return response()->json([
                'error' => 'You are not allowed to claim this instrument. Department mismatch.'
            ], 403);
        }

        // Validate department matches location
        if ($request->department_id != $location->department_id) {
            return response()->json([
                'error' => 'Selected department does not match the location\'s department.'
            ], 400);
        }

        DB::beginTransaction();
        
        try {
            $equipment = null;
            
            // Handle new equipment registration
            if ($request->is_new_registration) {
                $equipment = Equipment::create([
                    'serial_number' => $request->serial_number,
                    'description' => $request->description,
                    'manufacturer' => $request->manufacturer,
                    'employee_id' => $user->employee_id,
                ]);
            } else {
                $equipment = Equipment::find($request->equipment_id);
            }

            // Create tracking record
            $tracking = TrackingRecord::create([
                'recall' => !empty($request->recall_number),
                'description' => $request->description,
                'equipment_id' => $equipment->equipment_id,
                'technician_id' => $request->technician_id,
                'location_id' => $request->location_id,
                'due_date' => $request->cal_due_date,
                'date_in' => now(),
                'employee_id_in' => $user->employee_id,
                'cal_date' => $request->cal_date,
                'cal_due_date' => $request->cal_due_date,
                'cycle_time' => 0, // Will be calculated on outgoing
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $request->is_new_registration 
                    ? 'New equipment registered and received successfully'
                    : 'Equipment received for routine calibration successfully',
                'data' => $tracking->load(['equipment', 'technician', 'location', 'employeeIn'])
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'Failed to process incoming equipment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle outgoing equipment process
     */
    public function outgoing(Request $request, TrackingRecord $trackingRecord): JsonResponse
    {
        $request->validate([
            'next_cal_due_date' => 'required|date|after:today',
            'description' => 'required|string',
            'recall_number' => 'nullable|string',
        ]);

        $user = Auth::user();
        $location = $trackingRecord->location;

        // Location validation
        if ($user->department_id !== $location->department_id) {
            return response()->json([
                'error' => 'You are not allowed to release this instrument. Department mismatch.'
            ], 403);
        }

        // Check if already released
        if ($trackingRecord->date_out) {
            return response()->json([
                'error' => 'This equipment has already been released.'
            ], 400);
        }

        DB::beginTransaction();

        try {
            $dateOut = now();
            $dateIn = $trackingRecord->date_in;
            $cycleTime = $dateOut->diffInHours($dateIn);

            // Update tracking record
            $trackingRecord->update([
                'date_out' => $dateOut,
                'employee_id_out' => $user->employee_id,
                'cycle_time' => $cycleTime,
                'description' => $request->description,
                'recall' => !empty($request->recall_number),
            ]);

            // Create new tracking record for next calibration cycle
            TrackingRecord::create([
                'recall' => false,
                'description' => $request->description,
                'equipment_id' => $trackingRecord->equipment_id,
                'technician_id' => $trackingRecord->technician_id,
                'location_id' => $trackingRecord->location_id,
                'due_date' => $request->next_cal_due_date,
                'date_in' => $dateOut, // Immediately checked in for next cycle
                'employee_id_in' => $user->employee_id,
                'cal_date' => $dateOut->toDateString(),
                'cal_due_date' => $request->next_cal_due_date,
                'cycle_time' => 0,
            ]);

            DB::commit();

            $trackingRecord->load(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut']);

            return response()->json([
                'success' => true,
                'message' => 'Equipment released successfully',
                'data' => $trackingRecord,
                'cycle_time_hours' => $cycleTime
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'Failed to process outgoing equipment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate PDF report for tracking record
     */
    public function generatePdf(TrackingRecord $trackingRecord)
    {
        $trackingRecord->load(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut']);

        $pdf = Pdf::loadView('pdf.tracking-record', compact('trackingRecord'))
            ->setPaper('a4', 'landscape');

        return $pdf->download("tracking_record_{$trackingRecord->tracking_id}.pdf");
    }

    /**
     * Get equipment by barcode/serial number
     */
    public function scanEquipment(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string'
        ]);

        $equipment = Equipment::with(['user', 'trackingRecords' => function($query) {
            $query->whereNull('date_out')->latest();
        }])
        ->where('serial_number', $request->code)
        ->first();

        if (!$equipment) {
            return response()->json([
                'error' => 'Equipment not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $equipment
        ]);
    }

    /**
     * Get user by barcode/employee ID
     */
    public function scanEmployee(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string'
        ]);

        $user = User::with(['role', 'department', 'plant'])
            ->where('employee_id', $request->code)
            ->orWhere('email', $request->code)
            ->first();

        if (!$user) {
            return response()->json([
                'error' => 'Employee not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Get overdue items
     */
    public function getOverdueItems(): JsonResponse
    {
        $overdueItems = TrackingRecord::with(['equipment', 'technician', 'location'])
            ->where('cal_due_date', '<', now())
            ->whereNull('date_out')
            ->orderBy('cal_due_date', 'asc')
            ->paginate(15);

        return response()->json($overdueItems);
    }

    /**
     * Get items due soon
     */
    public function getItemsDueSoon(Request $request): JsonResponse
    {
        $days = $request->get('days', 7);
        
        $itemsDueSoon = TrackingRecord::with(['equipment', 'technician', 'location'])
            ->whereBetween('cal_due_date', [now(), now()->addDays($days)])
            ->whereNull('date_out')
            ->orderBy('cal_due_date', 'asc')
            ->paginate(15);

        return response()->json($itemsDueSoon);
    }
}
