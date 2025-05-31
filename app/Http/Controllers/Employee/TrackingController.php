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
     * Display the track outgoing index page for employees.
     */
    public function trackOutgoingIndex(Request $request)
    {
        // Get search filters
        $filters = $request->only(['search', 'status']);
        
        // Query outgoing tracking records related to the current employee's incoming records
        $query = TrackOutgoing::with(['trackIncoming', 'equipment', 'technician', 'employeeOut'])
            ->whereHas('trackIncoming', function($q) {
                $q->where('employee_id_in', Auth::user()->employee_id);
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
     * Display a specific outgoing tracking record for employees.
     */
    public function trackOutgoingShow(TrackOutgoing $trackOutgoing)
    {
        $trackOutgoing->load([
            'trackIncoming',
            'employeeOut',
            'equipment',
            'technician'
        ]);

        // Ensure employee can only view their own records
        if ($trackOutgoing->trackIncoming->employee_id_in !== Auth::user()->employee_id) {
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

        // Ensure the employee is picking up their own equipment
        if ($trackOutgoing->trackIncoming->employee_id_in !== $employee->employee_id) {
            throw ValidationException::withMessages([
                'employee_id' => 'You can only pick up your own equipment.'
            ]);
        }

        // Update status to completed
        $trackOutgoing->update(['status' => 'completed']);

        return response()->json([
            'message' => 'Equipment pickup confirmed successfully.',
            'data' => $trackOutgoing->fresh(['trackIncoming', 'employeeOut'])
        ]);
    }
}
