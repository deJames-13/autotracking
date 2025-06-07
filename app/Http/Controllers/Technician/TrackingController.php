<?php

namespace App\Http\Controllers\Technician;

use App\Http\Controllers\Controller;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TrackingController extends Controller
{
    /**
     * Display the tracking index page for technicians.
     */
    public function index(): Response
    {
        return Inertia::render('technician/tracking/index');
    }

    /**
     * Display the track incoming index page for technicians.
     * Technicians can only see records assigned to them.
     */
    public function trackIncomingIndex(Request $request): Response
    {
        $filters = $request->only(['search', 'status']);
        
        // Query incoming tracking records assigned to the current technician
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy'])
            ->where('technician_id', Auth::user()->employee_id);
        
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
        
        return Inertia::render('technician/tracking/incoming/index', [
            'filters' => $filters,
            'requests' => $requests
        ]);
    }

    /**
     * Display a specific incoming tracking record for technicians.
     * Technicians can only view records assigned to them.
     */
    public function trackIncomingShow(TrackIncoming $trackIncoming): Response
    {
        // Ensure technician can only view their own assigned records
        if ($trackIncoming->technician_id !== Auth::user()->employee_id) {
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

        return Inertia::render('technician/tracking/incoming/show', [
            'record' => $trackIncoming
        ]);
    }

    /**
     * Display the track outgoing index page for technicians.
     * Technicians can only see records they processed.
     */
    public function trackOutgoingIndex(Request $request): Response
    {
        $filters = $request->only(['search', 'status']);
        
        // Query outgoing tracking records where the technician handled the incoming
        $query = TrackOutgoing::with(['trackIncoming', 'equipment', 'technician', 'employeeOut', 'releasedBy'])
            ->whereHas('trackIncoming', function($q) {
                $q->where('technician_id', Auth::user()->employee_id);
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
        
        return Inertia::render('technician/tracking/outgoing/index', [
            'filters' => $filters,
            'requests' => $outgoingRequests
        ]);
    }

    /**
     * Display a specific outgoing tracking record for technicians.
     * Technicians can only view records they processed.
     */
    public function trackOutgoingShow(TrackOutgoing $trackOutgoing): Response
    {
        $trackOutgoing->load([
            'trackIncoming.technician',
            'trackIncoming.employeeIn.department',
            'employeeOut.department',
            'releasedBy',
            'equipment',
            'technician'
        ]);

        // Ensure technician can only view records they processed
        if ($trackOutgoing->trackIncoming->technician_id !== Auth::user()->employee_id) {
            abort(403, 'Unauthorized access to this record.');
        }

        return Inertia::render('technician/tracking/outgoing/show', [
            'record' => $trackOutgoing
        ]);
    }

    /**
     * Display the tracking request page for technicians.
     * This should auto-select the logged-in technician.
     */
    public function requestIndex(Request $request): Response
    {
        $editData = null;
        $edit = null;
        
        // Check if we're in edit mode
        if ($request->filled('edit')) {
            $editId = $request->get('edit');
            $edit = $editId;
            
            $trackIncoming = TrackIncoming::with([
                'equipment',
                'technician',
                'location',
                'employeeIn.department',
                'employeeIn.plant',
                'employeeIn.role',
                'receivedBy'
            ])->where('id', $editId)
              ->where('technician_id', Auth::user()->employee_id)
              ->first();
            
            if ($trackIncoming) {
                $editData = $trackIncoming;
            }
        }

        // Load current user with relationships for auto-filling
        $currentUser = User::with(['department', 'plant', 'role', 'department.locations'])
            ->find(Auth::user()->employee_id);

        return Inertia::render('technician/tracking/request/index', [
            'edit' => $edit,
            'editData' => $editData,
            'currentUserWithRelations' => $currentUser
        ]);
    }
}
