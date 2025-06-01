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
     * Display the tracking index page for employees.
     */
    public function index()
    {
        return Inertia::render('employee/tracking/index');
    }

    /**
     * Display the tracking request index page for employees.
     */
    public function requestIndex(Request $request)
    {
        $editData = null;
        $edit = null;
        
        // Check if we're in edit mode
        if ($request->filled('edit')) {
            $editId = $request->get('edit');
            $edit = $editId; // Pass the edit ID to the frontend
            
            $trackIncoming = TrackIncoming::with([
                'equipment',
                'technician',
                'location',
                'employeeIn.department',
                'employeeIn.plant',
                'employeeIn.role',
                'receivedBy'
            ])->where('id', $editId)
              ->where('employee_id_in', Auth::user()->employee_id)
              ->where('status', 'for_confirmation')
              ->first();
            
            if ($trackIncoming) {
                $editData = $trackIncoming;
            }
        }

        // Load current user with relationships for auto-filling
        $currentUser = User::with(['department', 'plant', 'role', 'department.locations'])
            ->find(Auth::user()->employee_id);

        return Inertia::render('employee/tracking/request/index', [
            'edit' => $edit,
            'editData' => $editData,
            'currentUserWithRelations' => $currentUser
        ]);
    }

    /**
     * Display the track incoming index page for employees.
     */
    public function trackIncomingIndex(Request $request)
    {
        // Get search filters
        $filters = $request->only(['search', 'status']);
        
        // Query incoming tracking records for the current employee
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy'])
            ->where('employee_id_in', Auth::user()->employee_id);
        
        // Apply search filter if provided
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }
        
        // Apply status filter if provided
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        
        // Paginate the results
        $requests = $query->orderBy('date_in', 'desc')
            ->paginate(10)
            ->withQueryString();
        
        // Return the Inertia view with data
        return Inertia::render('employee/tracking/incoming/index', [
            'filters' => $filters,
            'requests' => $requests
        ]);
    }

    /**
     * Display a specific incoming tracking record for employees.
     */
    public function trackIncomingShow(TrackIncoming $trackIncoming)
    {
        // Ensure employee can only view their own records
        if ($trackIncoming->employee_id_in !== Auth::user()->employee_id) {
            abort(403, 'Unauthorized access to this record.');
        }

        $trackIncoming->load([
            'equipment',
            'technician',
            'location',
            'employeeIn',
            'receivedBy',
            'trackOutgoing'
        ]);

        return Inertia::render('employee/tracking/incoming/show', [
            'record' => $trackIncoming
        ]);
    }

    /**
     * Display the track outgoing index page for employees in the same department.
     */
    public function trackOutgoingIndex(Request $request)
    {
        // Get search filters
        $filters = $request->only(['search', 'status']);
        
        $currentUser = Auth::user();
        $currentUser->load('department');
        
        // Query outgoing tracking records related to the current employee's department
        $query = TrackOutgoing::with(['trackIncoming', 'equipment', 'technician', 'employeeOut', 'releasedBy'])
            ->whereHas('trackIncoming.employeeIn', function($q) use ($currentUser) {
                $q->where('department_id', $currentUser->department_id);
            });
        
        // Apply search filter if provided
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->whereHas('trackIncoming', function($q1) use ($search) {
                    $q1->where('recall_number', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('serial_number', 'like', "%{$search}%");
                });
            });
        }
        
        // Apply status filter if provided
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        
        // Paginate the results
        $outgoingRequests = $query->orderBy('date_out', 'desc')
            ->paginate(10)
            ->withQueryString();
        
        // Return the Inertia view with data
        return Inertia::render('employee/tracking/outgoing/index', [
            'filters' => $filters,
            'requests' => $outgoingRequests
        ]);
    }

    /**
     * Display a specific outgoing tracking record for employees in the same department.
     */
    public function trackOutgoingShow(TrackOutgoing $trackOutgoing)
    {
        $trackOutgoing->load([
            'trackIncoming.employeeIn.department',
            'employeeOut.department',
            'releasedBy',
            'equipment',
            'technician'
        ]);

        $currentUser = Auth::user();
        $currentUser->load('department');

        // Ensure employee can only view records from their department
        if ($trackOutgoing->trackIncoming->employeeIn->department_id !== $currentUser->department_id) {
            abort(403, 'Unauthorized access to this record.');
        }

        return Inertia::render('employee/tracking/outgoing/show', [
            'record' => $trackOutgoing
        ]);
    }

    /**
     * Confirm pickup of calibrated equipment.
     */
    public function confirmPickup(Request $request, TrackOutgoing $trackOutgoing)
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

        // Update status to completed
        // Note: released_by_id should remain as the admin/operator who released it, not the pickup employee
        $trackOutgoing->update([
            'status' => 'completed',
            'employee_id_out' => $employee->employee_id
        ]);

        return response()->json([
            'message' => 'Equipment pickup confirmed successfully.',
            'data' => $trackOutgoing->fresh(['trackIncoming', 'employeeOut', 'releasedBy'])
        ]);
    }
}
