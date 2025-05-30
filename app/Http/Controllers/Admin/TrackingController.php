<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
     * @return \Inertia\Response
     */
    public function requestIndex()
    {
        return Inertia::render('admin/tracking/request/index');
    }

    /**
     * Display a specific tracking request.
     *
     * @param int $id
     * @return \Inertia\Response
     */
    public function requestShow($id)
    {
        return Inertia::render('admin/tracking/request/detail-tab');
    }

    /**
     * Search tracking records for employee requests
     */
    public function searchTrackingRecords(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = TrackIncoming::with(['equipment', 'technician', 'employeeIn'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('recall_number', 'like', "%{$search}%")
                          ->orWhere('description', 'like', "%{$search}%")
                          ->orWhereHas('equipment', function ($eq) use ($search) {
                              $eq->where('recall_number', 'like', "%{$search}%")
                                ->orWhere('description', 'like', "%{$search}%")
                                ->orWhere('serial_number', 'like', "%{$search}%");
                          });
                });
            });

        // Filter by department if user has department restriction
        if ($request->department_id) {
            $query->whereHas('equipment', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        } elseif ($user->department_id) {
            // If no specific department requested, default to user's department
            $query->whereHas('equipment', function ($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        }

        $trackingRecords = $query->latest()
            ->limit($request->limit ?? 10)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'recall_number' => $record->recall_number,
                    'description' => $record->description,
                    'status' => $record->status,
                    'created_at' => $record->created_at,
                    'equipment' => $record->equipment ? [
                        'equipment_id' => $record->equipment->equipment_id,
                        'recall_number' => $record->equipment->recall_number,
                        'description' => $record->equipment->description,
                        'serial_number' => $record->equipment->serial_number,
                        'model' => $record->equipment->model,
                        'manufacturer' => $record->equipment->manufacturer,
                    ] : null,
                    'technician' => $record->technician ? [
                        'employee_id' => $record->technician->employee_id,
                        'first_name' => $record->technician->first_name,
                        'last_name' => $record->technician->last_name,
                    ] : null,
                ];
            });

        return response()->json([
            'data' => $trackingRecords,
            'total' => $trackingRecords->count(),
        ]);
    }

    /**
     * Store a new tracking request.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        // TODO: Implement the store method for tracking requests
        // This will be implemented in a future update
    }

    /**
     * Generate a unique recall number for tracking requests
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateUniqueRecall(): JsonResponse
    {
        try {
            $recallNumber = TrackIncoming::generateUniqueRecallNumber();
            
            return response()->json([
                'success' => true,
                'recall_number' => $recallNumber
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error generating unique recall number: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate recall number. Please try again.'
            ], 500);
        }
    }

    /**
     * Confirm employee PIN for tracking request
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function confirmRequestPin(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|numeric',
            'pin' => 'required|string|min:4',
        ]);

        try {
            // Find the employee by employee_id
            $employee = User::where('employee_id', $request->employee_id)->first();

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found.'
                ], 404);
            }

            // Check if employee has a PIN set - using password field as PIN
            if (!$employee->password) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee PIN is not set. Please contact administrator.'
                ], 400);
            }

            // Verify the PIN - assuming PIN is stored in password field
            if (!Hash::check($request->pin, $employee->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid PIN. Please try again.'
                ], 401);
            }

            // PIN is correct
            return response()->json([
                'success' => true,
                'message' => 'PIN confirmed successfully.',
                'employee' => [
                    'employee_id' => $employee->employee_id,
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'department' => $employee->department ? [
                        'department_id' => $employee->department->department_id,
                        'department_name' => $employee->department->department_name,
                    ] : null,
                    'plant' => $employee->plant ? [
                        'plant_id' => $employee->plant->plant_id,
                        'plant_name' => $employee->plant->plant_name,
                    ] : null,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error confirming request PIN: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while confirming PIN. Please try again.'
            ], 500);
        }
    }

    /**
     * Search track incoming records for admin interface
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchTrackIncoming(Request $request): JsonResponse
    {
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);

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

        if ($request->filled('technician_id')) {
            $query->where('technician_id', $request->get('technician_id'));
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->get('location_id'));
        }

        if ($request->filled('date_from')) {
            $query->where('date_in', '>=', $request->get('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('date_in', '<=', $request->get('date_to'));
        }

        $trackIncomingRecords = $query->latest()
            ->paginate($request->get('per_page', 15))
            ->through(function ($record) {
                return [
                    'id' => $record->id,
                    'recall_number' => $record->recall_number,
                    'status' => $record->status,
                    'date_in' => $record->date_in?->format('Y-m-d H:i:s'),
                    'due_date' => $record->due_date?->format('Y-m-d'),
                    'description' => $record->description,
                    'equipment' => $record->equipment ? [
                        'equipment_id' => $record->equipment->equipment_id,
                        'serial_number' => $record->equipment->serial_number,
                        'description' => $record->equipment->description,
                    ] : null,
                    'location' => $record->location ? [
                        'location_id' => $record->location->location_id,
                        'location_name' => $record->location->location_name,
                    ] : null,
                    'technician' => $record->technician ? [
                        'employee_id' => $record->technician->employee_id,
                        'first_name' => $record->technician->first_name,
                        'last_name' => $record->technician->last_name,
                    ] : null,
                    'employee_in' => $record->employeeIn ? [
                        'employee_id' => $record->employeeIn->employee_id,
                        'first_name' => $record->employeeIn->first_name,
                        'last_name' => $record->employeeIn->last_name,
                    ] : null,
                    'track_outgoing' => $record->trackOutgoing ? [
                        'id' => $record->trackOutgoing->id,
                        'date_out' => $record->trackOutgoing->date_out?->format('Y-m-d H:i:s'),
                        'cal_due_date' => $record->trackOutgoing->cal_due_date?->format('Y-m-d'),
                    ] : null,
                ];
            });

        return response()->json([
            'data' => $trackIncomingRecords->items(),
            'meta' => [
                'current_page' => $trackIncomingRecords->currentPage(),
                'last_page' => $trackIncomingRecords->lastPage(),
                'per_page' => $trackIncomingRecords->perPage(),
                'total' => $trackIncomingRecords->total(),
            ],
        ]);
    }

    /**
     * Search track outgoing records for admin interface
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchTrackOutgoing(Request $request): JsonResponse
    {
        $query = TrackOutgoing::with(['equipment', 'technician', 'location', 'employeeOut', 'trackIncoming']);

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

        if ($request->filled('technician_id')) {
            $query->where('technician_id', $request->get('technician_id'));
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->get('location_id'));
        }

        if ($request->filled('date_from')) {
            $query->where('date_out', '>=', $request->get('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('date_out', '<=', $request->get('date_to'));
        }

        if ($request->filled('cal_due_from')) {
            $query->where('cal_due_date', '>=', $request->get('cal_due_from'));
        }

        if ($request->filled('cal_due_to')) {
            $query->where('cal_due_date', '<=', $request->get('cal_due_to'));
        }

        $trackOutgoingRecords = $query->latest('date_out')
            ->paginate($request->get('per_page', 15))
            ->through(function ($record) {
                return [
                    'id' => $record->id,
                    'recall_number' => $record->recall_number,
                    'date_out' => $record->date_out?->format('Y-m-d H:i:s'),
                    'cal_date' => $record->cal_date?->format('Y-m-d'),
                    'cal_due_date' => $record->cal_due_date?->format('Y-m-d'),
                    'cycle_time' => $record->cycle_time,
                    'equipment' => $record->equipment ? [
                        'equipment_id' => $record->equipment->equipment_id,
                        'serial_number' => $record->equipment->serial_number,
                        'description' => $record->equipment->description,
                    ] : null,
                    'location' => $record->location ? [
                        'location_id' => $record->location->location_id,
                        'location_name' => $record->location->location_name,
                    ] : null,
                    'technician' => $record->technician ? [
                        'employee_id' => $record->technician->employee_id,
                        'first_name' => $record->technician->first_name,
                        'last_name' => $record->technician->last_name,
                    ] : null,
                    'employee_out' => $record->employeeOut ? [
                        'employee_id' => $record->employeeOut->employee_id,
                        'first_name' => $record->employeeOut->first_name,
                        'last_name' => $record->employeeOut->last_name,
                    ] : null,
                    'track_incoming' => $record->trackIncoming ? [
                        'id' => $record->trackIncoming->id,
                        'status' => $record->trackIncoming->status,
                        'date_in' => $record->trackIncoming->date_in?->format('Y-m-d H:i:s'),
                        'description' => $record->trackIncoming->description,
                    ] : null,
                ];
            });

        return response()->json([
            'data' => $trackOutgoingRecords->items(),
            'meta' => [
                'current_page' => $trackOutgoingRecords->currentPage(),
                'last_page' => $trackOutgoingRecords->lastPage(),
                'per_page' => $trackOutgoingRecords->perPage(),
                'total' => $trackOutgoingRecords->total(),
            ],
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
     * Display the track outgoing index page for admin.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Inertia\Response
     */
    public function trackOutgoingIndex(Request $request)
    {
        $query = TrackOutgoing::with(['equipment', 'technician', 'employeeOut', 'trackIncoming']);

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
     * Display a specific track incoming record.
     *
     * @param \App\Models\TrackIncoming $trackIncoming
     * @return \Inertia\Response
     */
    public function trackIncomingShow(TrackIncoming $trackIncoming)
    {
        $trackIncoming->load(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing.employeeOut']);
        
        return Inertia::render('admin/tracking/incoming/show', [
            'trackIncoming' => $trackIncoming
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
        $trackOutgoing->load(['equipment', 'technician', 'location', 'employeeOut', 'trackIncoming.employeeIn']);
        
        return Inertia::render('admin/tracking/outgoing/show', [
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
        $trackOutgoing->load(['equipment', 'technician', 'location', 'employeeOut', 'trackIncoming.employeeIn']);
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.calibration-certificate', [
            'trackOutgoing' => $trackOutgoing
        ]);
        
        return $pdf->stream("calibration-certificate-{$trackOutgoing->recall_number}.pdf");
    }
}
