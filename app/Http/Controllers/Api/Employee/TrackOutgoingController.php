<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Resources\TrackOutgoingResource;
use App\Models\TrackOutgoing;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class TrackOutgoingController extends Controller
{
    /**
     * Get outgoing tracking records for the authenticated employee.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'equipment', 'technician'])
            ->whereHas('trackIncoming', function ($q) {
                $q->where('employee_id_in', Auth::user()->employee_id);
            });

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function ($eq) use ($search) {
                      $eq->where('name', 'like', "%{$search}%")
                        ->orWhere('serial_number', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('cal_date_from')) {
            $query->whereDate('cal_date', '>=', $request->get('cal_date_from'));
        }

        if ($request->has('cal_date_to')) {
            $query->whereDate('cal_date', '<=', $request->get('cal_date_to'));
        }

        $records = $query->orderBy('date_out', 'desc')->paginate($request->get('per_page', 15));

        return TrackOutgoingResource::collection($records);
    }

    /**
     * Show a specific outgoing record for the employee.
     */
    public function show(TrackOutgoing $trackOutgoing): TrackOutgoingResource
    {
        $trackOutgoing->load(['trackIncoming', 'employeeOut', 'equipment', 'technician']);
        
        // Ensure employee can only view their own records
        if ($trackOutgoing->trackIncoming->employee_id_in !== Auth::user()->employee_id) {
            abort(403, 'Unauthorized access to this record.');
        }

        return new TrackOutgoingResource($trackOutgoing);
    }

    /**
     * Get records ready for pickup by the employee.
     */
    public function readyForPickup(Request $request): AnonymousResourceCollection
    {
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'equipment', 'technician'])
            ->where('status', 'for_pickup')
            ->whereHas('trackIncoming', function ($q) {
                $q->where('employee_id_in', Auth::user()->employee_id);
            });

        $records = $query->orderBy('date_out', 'desc')->paginate($request->get('per_page', 15));

        return TrackOutgoingResource::collection($records);
    }

    /**
     * Get completed records for the employee.
     */
    public function completed(Request $request): AnonymousResourceCollection
    {
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'equipment', 'technician'])
            ->where('status', 'completed')
            ->whereHas('trackIncoming', function ($q) {
                $q->where('employee_id_in', Auth::user()->employee_id);
            });

        $records = $query->orderBy('date_out', 'desc')->paginate($request->get('per_page', 15));

        return TrackOutgoingResource::collection($records);
    }

    /**
     * Get records due for recalibration.
     */
    public function dueForRecalibration(Request $request): AnonymousResourceCollection
    {
        $today = Carbon::today();
        
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'equipment', 'technician'])
            ->where('status', 'completed')
            ->where('cal_due_date', '<=', $today)
            ->whereHas('trackIncoming', function ($q) {
                $q->where('employee_id_in', Auth::user()->employee_id);
            });

        $records = $query->orderBy('cal_due_date', 'asc')->paginate($request->get('per_page', 15));

        return TrackOutgoingResource::collection($records);
    }

    /**
     * Confirm pickup of calibrated equipment.
     */
    public function confirmPickup(Request $request, TrackOutgoing $trackOutgoing): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:users,employee_id',
            'confirmation_pin' => 'required|string'
        ]);

        // Verify the employee and PIN
        $employee = User::where('employee_id', $request->employee_id)->first();
        if (!$employee || !Hash::check($request->confirmation_pin, $employee->password)) {
            throw ValidationException::withMessages([
                'confirmation_pin' => 'Invalid employee ID or PIN.'
            ]);
        }

        // Ensure the employee is picking up their own equipment
        if ($trackOutgoing->trackIncoming->employee_id_in !== $employee->employee_id) {
            throw ValidationException::withMessages([
                'employee_id' => 'You can only pick up your own equipment.'
            ]);
        }

        // Ensure status is for_pickup
        if ($trackOutgoing->status !== 'for_pickup') {
            throw ValidationException::withMessages([
                'status' => 'This equipment is not ready for pickup.'
            ]);
        }

        // Update status to completed
        $trackOutgoing->update(['status' => 'completed']);

        return response()->json([
            'message' => 'Equipment pickup confirmed successfully.',
            'data' => new TrackOutgoingResource($trackOutgoing->fresh(['trackIncoming', 'employeeOut', 'equipment', 'technician']))
        ]);
    }
}
