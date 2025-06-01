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
     * Get outgoing tracking records for the authenticated employee's department.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $currentUser = Auth::user();
        $currentUser->load('department');
        
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician'])
            ->whereHas('trackIncoming.employeeIn', function ($q) use ($currentUser) {
                $q->where('department_id', $currentUser->department_id);
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
     * Show a specific outgoing record for employees in the same department.
     */
    public function show(TrackOutgoing $trackOutgoing): TrackOutgoingResource
    {
        $trackOutgoing->load(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']);
        
        $currentUser = Auth::user();
        $currentUser->load('department');
        
        // Ensure employee can only view records from their department
        if ($trackOutgoing->trackIncoming->employeeIn->department_id !== $currentUser->department_id) {
            abort(403, 'Unauthorized access to this record.');
        }

        return new TrackOutgoingResource($trackOutgoing);
    }

    /**
     * Get records ready for pickup by employees in the same department.
     */
    public function readyForPickup(Request $request): AnonymousResourceCollection
    {
        $currentUser = Auth::user();
        $currentUser->load('department');
        
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician'])
            ->where('status', 'for_pickup')
            ->whereHas('trackIncoming.employeeIn', function ($q) use ($currentUser) {
                $q->where('department_id', $currentUser->department_id);
            });

        $records = $query->orderBy('date_out', 'desc')->paginate($request->get('per_page', 15));

        return TrackOutgoingResource::collection($records);
    }

    /**
     * Get completed records for employees in the same department.
     */
    public function completed(Request $request): AnonymousResourceCollection
    {
        $currentUser = Auth::user();
        $currentUser->load('department');
        
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician'])
            ->where('status', 'completed')
            ->whereHas('trackIncoming.employeeIn', function ($q) use ($currentUser) {
                $q->where('department_id', $currentUser->department_id);
            });

        $records = $query->orderBy('date_out', 'desc')->paginate($request->get('per_page', 15));

        return TrackOutgoingResource::collection($records);
    }

    /**
     * Get records due for recalibration for employees in the same department.
     */
    public function dueForRecalibration(Request $request): AnonymousResourceCollection
    {
        $today = Carbon::today();
        $currentUser = Auth::user();
        $currentUser->load('department');
        
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician'])
            ->where('status', 'completed')
            ->where('cal_due_date', '<=', $today)
            ->whereHas('trackIncoming.employeeIn', function ($q) use ($currentUser) {
                $q->where('department_id', $currentUser->department_id);
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

        // Validate department match - employees from same department can pick up equipment
        if ($trackOutgoing->trackIncoming && $trackOutgoing->trackIncoming->employeeIn) {
            $employeeIn = $trackOutgoing->trackIncoming->employeeIn;
            
            // Load department relationships if not already loaded
            $employee->load('department');
            $employeeIn->load('department');
            
            $employeeOutDeptId = $employee->department_id ?? $employee->department?->id;
            $employeeInDeptId = $employeeIn->department_id ?? $employeeIn->department?->id;
            
            if (!$employeeOutDeptId || !$employeeInDeptId) {
                throw ValidationException::withMessages([
                    'employee_id' => 'Department information is missing. Please ensure both employees have department assignments.'
                ]);
            }
            
            if ($employeeOutDeptId !== $employeeInDeptId) {
                $employeeOutDeptName = $employee->department?->department_name ?? 'Unknown Department';
                $employeeInDeptName = $employeeIn->department?->department_name ?? 'Unknown Department';
                
                throw ValidationException::withMessages([
                    'employee_id' => "Department mismatch: You are from {$employeeOutDeptName} department but equipment was received by {$employeeInDeptName} department. Only employees from the same department can pick up equipment."
                ]);
            }
        }

        // Ensure status is for_pickup
        if ($trackOutgoing->status !== 'for_pickup') {
            throw ValidationException::withMessages([
                'status' => 'This equipment is not ready for pickup.'
            ]);
        }

        // Update status to completed
        // Note: released_by_id should remain as the admin/operator who released it, not the pickup employee
        $trackOutgoing->update([
            'status' => 'completed',
            'employee_id_out' => $employee->employee_id
        ]);

        return response()->json([
            'message' => 'Equipment pickup confirmed successfully.',
            'data' => new TrackOutgoingResource($trackOutgoing->fresh(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']))
        ]);
    }
}
