<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrackIncomingRequest;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use App\Models\Equipment;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TrackingController extends Controller
{
    /**
     * Display the tracking index page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        return Inertia::render('admin/tracking/index');
    }

    /**
     * Display the tracking request index page.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Inertia\Response
     */
    public function requestIndex(Request $request)
    {
        $editData = null;
        $editId = null;
        $confirm = null;

        // Check if we're in edit mode
        if ($request->filled('edit')) {
            $editId = $request->get('edit');
            $trackIncoming = TrackIncoming::with([
                'equipment', 
                'equipment.location', 
                'equipment.department', 
                'equipment.plant', 
                'technician', 
                'location', 
                'employeeIn', 
                'employeeIn.department',
                'employeeIn.department.locations',
                'employeeIn.plant'
            ])->find($editId);

            if ($trackIncoming) {
                // Only allow editing if status is pending_calibration
                if (($request->filled('edit') && $trackIncoming->status === 'for_confirmation') || $trackIncoming->status === 'pending_calibration') {
                    $editData = [
                        'id' => $trackIncoming->id,
                        'request_type' => $trackIncoming->request_type,
                        'technician' => $trackIncoming->technician,
                        'equipment' => $trackIncoming->equipment,
                        'scannedEmployee' => $trackIncoming->employeeIn,
                        'receivedBy' => $trackIncoming->receivedBy,
                        'request_date' => $trackIncoming->created_at->format('Y-m-d'),
                        'description' => $trackIncoming->description,
                        'location' => $trackIncoming->location,
                        'recall_number' => $trackIncoming->recall_number,
                        'status' => $trackIncoming->status
                    ];
                } else {
                    return redirect()->route('admin.tracking.incoming.show', $trackIncoming)
                        ->with('error', 'Only pending calibration requests can be edited.');
                }
            }
        }

        return Inertia::render('admin/tracking/request/index', [
            'edit' => $editId,
            'editData' => $editData,
            'confirm' => $confirm
        ]);
    }

    /**
     * Display the track incoming index page for admin.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Inertia\Response
     */
    public function trackIncomingIndex(Request $request)
    {
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);

        // Role-based filtering for technicians
        $user = Auth::user();
        if ($user->role->role_name === 'technician') {
            $query->where(function($q) use ($user) {
                $q->where('technician_id', $user->employee_id)
                  ->orWhere('received_by_id', $user->employee_id);
            });
        }

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function($eq) use ($search) {
                      $eq->where('serial_number', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $requests = $query->latest('created_at')->paginate(15);

        return Inertia::render('admin/tracking/incoming/index', [
            'requests' => $requests,
            'filters' => [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
            ]
        ]);
    }

    /**
     * Display a specific track incoming record.
     *
     * @param \App\Models\TrackIncoming $trackIncoming
     * @return \Inertia\Response
     */
    public function trackIncomingShow(TrackIncoming $trackIncoming)
    {
        $trackIncoming->load([
            'equipment', 
            'technician', 
            'receivedBy', 
            'location', 
            'employeeIn', 
            'employeeIn.department', 
            'trackOutgoing.employeeOut'
        ]);
        
        return Inertia::render('admin/tracking/incoming/show', [
            'trackIncoming' => $trackIncoming
        ]);
    }

    /**
     * Display the track outgoing index page for admin.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Inertia\Response
     */
    public function trackOutgoingIndex(Request $request)
    {
        $query = TrackOutgoing::with(['equipment', 'technician', 'employeeOut', 'releasedBy', 'trackIncoming']);

        // Role-based filtering for technicians
        $user = Auth::user();
        if ($user->role->role_name === 'technician') {
            $query->whereHas('trackIncoming', function($q) use ($user) {
                $q->where('technician_id', $user->employee_id)
                  ->orWhere('received_by_id', $user->employee_id);
            });
        }

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function($eq) use ($search) {
                      $eq->where('serial_number', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $completions = $query->latest('created_at')->paginate(15);

        return Inertia::render('admin/tracking/outgoing/index', [
            'completions' => $completions,
            'filters' => [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
            ]
        ]);
    }

    /**
     * Display a specific track outgoing record.
     *
     * @param \App\Models\TrackOutgoing $trackOutgoing
     * @return \Inertia\Response
     */
    public function trackOutgoingShow(TrackOutgoing $trackOutgoing)
    {
        $trackOutgoing->load([
            'equipment', 
            'technician', 
            'location', 
            'employeeOut', 
            'releasedBy',
            'trackIncoming.employeeIn',
            'trackIncoming.employeeIn.department',
            'trackIncoming.receivedBy',
        ]);
        
        return Inertia::render('admin/tracking/outgoing/show', [
            'trackOutgoing' => $trackOutgoing
        ]);
    }

    /**
     * Show the edit form for a track outgoing record.
     *
     * @param \App\Models\TrackOutgoing $trackOutgoing
     * @return \Inertia\Response
     */
    public function trackOutgoingEdit(TrackOutgoing $trackOutgoing)
    {
        $trackOutgoing->load([
            'equipment', 
            'technician', 
            'location', 
            'employeeOut', 
            'releasedBy',
            'trackIncoming.employeeIn',
        ]);
        
        return Inertia::render('admin/tracking/outgoing/edit', [
            'trackOutgoing' => $trackOutgoing
        ]);
    }

    /**
     * View calibration certificate for a track outgoing record.
     *
     * @param \App\Models\TrackOutgoing $trackOutgoing
     * @return \Illuminate\Http\Response
     */
    public function viewCertificate(TrackOutgoing $trackOutgoing)
    {
        $trackOutgoing->load(['equipment', 'technician', 'location', 'employeeOut', 'releasedBy', 'trackIncoming.employeeIn']);
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.calibration-certificate', [
            'trackOutgoing' => $trackOutgoing
        ]);
        
        return $pdf->stream("calibration-certificate-{$trackOutgoing->recall_number}.pdf");
    }

    /**
     * Get paginated track incoming data for DataTable
     */
    public function trackIncomingTableData(Request $request): JsonResponse
    {
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy', 'trackOutgoing']);

        // Role-based filtering for technicians
        $user = Auth::user();
        if ($user->role->role_name === 'technician') {
            $query->where(function($q) use ($user) {
                $q->where('technician_id', $user->employee_id)
                  ->orWhere('received_by_id', $user->employee_id);
            });
        }

        // Apply search filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('recall_number', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%')
                  ->orWhere('serial_number', 'like', '%' . $search . '%')
                  ->orWhere('model', 'like', '%' . $search . '%')
                  ->orWhere('manufacturer', 'like', '%' . $search . '%')
                  ->orWhere('notes', 'like', '%' . $search . '%')
                  ->orWhereHas('equipment', function($eq) use ($search) {
                      $eq->where('description', 'like', '%' . $search . '%')
                        ->orWhere('serial_number', 'like', '%' . $search . '%');
                  })
                  ->orWhereHas('employeeIn', function($emp) use ($search) {
                      $emp->where('first_name', 'like', '%' . $search . '%')
                          ->orWhere('last_name', 'like', '%' . $search . '%')
                          ->orWhere('employee_id', 'like', '%' . $search . '%');
                  })
                  ->orWhereHas('technician', function($tech) use ($search) {
                      $tech->where('first_name', 'like', '%' . $search . '%')
                           ->orWhere('last_name', 'like', '%' . $search . '%')
                           ->orWhere('employee_id', 'like', '%' . $search . '%');
                  });
            });
        }

        // Apply filters
        if ($request->filled('status') && $request->get('status') !== 'all') {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('technician_id') && $request->get('technician_id') !== 'all') {
            $query->where('technician_id', $request->get('technician_id'));
        }

        if ($request->filled('location_id') && $request->get('location_id') !== 'all') {
            $query->where('location_id', $request->get('location_id'));
        }

        if ($request->filled('employee_in') && $request->get('employee_in') !== 'all') {
            $query->where('employee_id_in', $request->get('employee_in'));
        }

        // Date range filters
        if ($request->filled('date_from')) {
            $query->where('date_in', '>=', $request->get('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('date_in', '<=', $request->get('date_to') . ' 23:59:59');
        }

        if ($request->filled('due_date_from')) {
            $query->where('due_date', '>=', $request->get('due_date_from'));
        }

        if ($request->filled('due_date_to')) {
            $query->where('due_date', '<=', $request->get('due_date_to') . ' 23:59:59');
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        // Map frontend sort keys to database columns
        $sortMapping = [
            'recall_number' => 'recall_number',
            'description' => 'description',
            'status' => 'status',
            'date_in' => 'date_in',
            'due_date' => 'due_date',
            'technician' => 'technician_id',
            'employee_in' => 'employee_id_in',
            'location' => 'location_id',
            'created_at' => 'created_at'
        ];

        $dbSortBy = $sortMapping[$sortBy] ?? 'created_at';
        $query->orderBy($dbSortBy, $sortDirection);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $trackIncoming = $query->paginate($perPage);

        return response()->json([
            'data' => $trackIncoming->items(),
            'meta' => [
                'current_page' => $trackIncoming->currentPage(),
                'last_page' => $trackIncoming->lastPage(),
                'per_page' => $trackIncoming->perPage(),
                'total' => $trackIncoming->total(),
                'from' => $trackIncoming->firstItem(),
                'to' => $trackIncoming->lastItem(),
            ],
        ]);
    }

    /**
     * Get paginated track outgoing data for DataTable
     */
    public function trackOutgoingTableData(Request $request): JsonResponse
    {
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician', 'location']);

        // Role-based filtering for technicians
        $user = Auth::user();
        if ($user->role->role_name === 'technician') {
            $query->whereHas('trackIncoming', function($q) use ($user) {
                $q->where('technician_id', $user->employee_id)
                  ->orWhere('received_by_id', $user->employee_id);
            });
        }

        // Apply search filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->whereHas('trackIncoming', function($incoming) use ($search) {
                    $incoming->where('recall_number', 'like', '%' . $search . '%')
                            ->orWhere('description', 'like', '%' . $search . '%')
                            ->orWhere('serial_number', 'like', '%' . $search . '%');
                })
                ->orWhereHas('equipment', function($eq) use ($search) {
                    $eq->where('description', 'like', '%' . $search . '%')
                      ->orWhere('serial_number', 'like', '%' . $search . '%');
                })
                ->orWhereHas('employeeOut', function($emp) use ($search) {
                    $emp->where('first_name', 'like', '%' . $search . '%')
                        ->orWhere('last_name', 'like', '%' . $search . '%')
                        ->orWhere('employee_id', 'like', '%' . $search . '%');
                })
                ->orWhereHas('technician', function($tech) use ($search) {
                    $tech->where('first_name', 'like', '%' . $search . '%')
                         ->orWhere('last_name', 'like', '%' . $search . '%')
                         ->orWhere('employee_id', 'like', '%' . $search . '%');
                });
            });
        }

        // Apply filters
        if ($request->filled('status') && $request->get('status') !== 'all') {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('employee_out') && $request->get('employee_out') !== 'all') {
            $query->where('employee_id_out', $request->get('employee_out'));
        }

        if ($request->filled('released_by') && $request->get('released_by') !== 'all') {
            $query->where('released_by_id', $request->get('released_by'));
        }

        if ($request->filled('technician_id') && $request->get('technician_id') !== 'all') {
            $query->whereHas('trackIncoming', function($incoming) use ($request) {
                $incoming->where('technician_id', $request->get('technician_id'));
            });
        }

        // Date range filters
        if ($request->filled('date_from')) {
            $query->where('date_out', '>=', $request->get('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('date_out', '<=', $request->get('date_to') . ' 23:59:59');
        }

        if ($request->filled('cal_date_from')) {
            $query->where('cal_date', '>=', $request->get('cal_date_from'));
        }

        if ($request->filled('cal_date_to')) {
            $query->where('cal_date', '<=', $request->get('cal_date_to'));
        }

        if ($request->filled('cal_due_date_from')) {
            $query->where('cal_due_date', '>=', $request->get('cal_due_date_from'));
        }

        if ($request->filled('cal_due_date_to')) {
            $query->where('cal_due_date', '<=', $request->get('cal_due_date_to'));
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        
        // Map frontend sort keys to database columns
        $sortMapping = [
            'recall_number' => 'incoming_id', // Sort by relation
            'status' => 'status',
            'date_out' => 'date_out',
            'cal_date' => 'cal_date',
            'cal_due_date' => 'cal_due_date',
            'cycle_time' => 'cycle_time',
            'employee_out' => 'employee_id_out',
            'released_by' => 'released_by_id',
            'created_at' => 'created_at'
        ];

        $dbSortBy = $sortMapping[$sortBy] ?? 'created_at';
        $query->orderBy($dbSortBy, $sortDirection);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $trackOutgoing = $query->paginate($perPage);

        return response()->json([
            'data' => $trackOutgoing->items(),
            'meta' => [
                'current_page' => $trackOutgoing->currentPage(),
                'last_page' => $trackOutgoing->lastPage(),
                'per_page' => $trackOutgoing->perPage(),
                'total' => $trackOutgoing->total(),
                'from' => $trackOutgoing->firstItem(),
                'to' => $trackOutgoing->lastItem(),
            ],
        ]);
    }

    /**
     * Get filter options for track incoming DataTable
     */
    public function trackIncomingFilterOptions(): JsonResponse
    {
        $statuses = TrackIncoming::select('status')
            ->distinct()
            ->whereNotNull('status')
            ->orderBy('status')
            ->pluck('status')
            ->map(function($status) {
                return [
                    'value' => $status,
                    'label' => ucwords(str_replace('_', ' ', $status))
                ];
            });

        $technicians = User::whereHas('trackIncomingAsTechnician')
            ->select('employee_id', 'first_name', 'last_name')
            ->orderBy('first_name')
            ->get()
            ->map(function($user) {
                return [
                    'value' => $user->employee_id,
                    'label' => $user->first_name . ' ' . $user->last_name
                ];
            });

        $locations = \App\Models\Location::select('location_id', 'location_name')
            ->orderBy('location_name')
            ->get()
            ->map(function($location) {
                return [
                    'value' => $location->location_id,
                    'label' => $location->location_name
                ];
            });

        $employeesIn = User::whereHas('trackIncomingAsEmployeeIn')
            ->select('employee_id', 'first_name', 'last_name')
            ->orderBy('first_name')
            ->get()
            ->map(function($user) {
                return [
                    'value' => $user->employee_id,
                    'label' => $user->first_name . ' ' . $user->last_name
                ];
            });

        return response()->json([
            'statuses' => $statuses,
            'technicians' => $technicians,
            'locations' => $locations,
            'employees_in' => $employeesIn,
        ]);
    }

    /**
     * Get filter options for track outgoing DataTable
     */
    public function trackOutgoingFilterOptions(): JsonResponse
    {
        $statuses = TrackOutgoing::select('status')
            ->distinct()
            ->whereNotNull('status')
            ->orderBy('status')
            ->pluck('status')
            ->map(function($status) {
                return [
                    'value' => $status,
                    'label' => ucwords(str_replace('_', ' ', $status))
                ];
            });

        $technicians = User::whereHas('trackIncomingAsTechnician')
            ->select('employee_id', 'first_name', 'last_name')
            ->orderBy('first_name')
            ->get()
            ->map(function($user) {
                return [
                    'value' => $user->employee_id,
                    'label' => $user->first_name . ' ' . $user->last_name
                ];
            });

        $employeesOut = User::whereHas('trackOutgoingAsEmployeeOut')
            ->select('employee_id', 'first_name', 'last_name')
            ->orderBy('first_name')
            ->get()
            ->map(function($user) {
                return [
                    'value' => $user->employee_id,
                    'label' => $user->first_name . ' ' . $user->last_name
                ];
            });

        $releasedBy = User::whereExists(function($query) {
                $query->select(\DB::raw(1))
                      ->from('track_outgoing')
                      ->whereRaw('track_outgoing.released_by_id = users.employee_id');
            })
            ->select('employee_id', 'first_name', 'last_name')
            ->orderBy('first_name')
            ->get()
            ->map(function($user) {
                return [
                    'value' => $user->employee_id,
                    'label' => $user->first_name . ' ' . $user->last_name
                ];
            });

        return response()->json([
            'statuses' => $statuses,
            'technicians' => $technicians,
            'employees_out' => $employeesOut,
            'released_by' => $releasedBy,
        ]);
    }
}
