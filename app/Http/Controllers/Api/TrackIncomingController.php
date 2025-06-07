<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrackIncomingRequest;

use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use App\Models\Equipment;
use App\Models\User;
use App\Models\Department;

use App\Http\Resources\TrackIncomingResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;


class TrackIncomingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);

        // Apply role-based filtering
        $user = Auth::user();
        if ($user->role->role_name === 'technician') {
            // Technicians can only see records they are assigned to
            $query->where(function($q) use ($user) {
                $q->where('technician_id', $user->employee_id)
                  ->orWhere('received_by_id', $user->employee_id);
            });
        } elseif ($user->role->role_name === 'employee') {
            // Employees can only see their own submitted records
            $query->where('employee_id_in', $user->employee_id);
        }
        // Admin users can see all records (no additional filtering)

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('description', 'like', "%{$search}%")
                  ->orWhere('recall_number', 'like', "%{$search}%");
        }

        if ($request->has('equipment_id')) {
            $query->where('equipment_id', $request->get('equipment_id'));
        }

        if ($request->has('technician_id')) {
            $query->where('technician_id', $request->get('technician_id'));
        }

        if ($request->has('location_id')) {
            $query->where('location_id', $request->get('location_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('date_from')) {
            $query->where('date_in', '>=', $request->get('date_from'));
        }

        if ($request->has('date_to')) {
            $query->where('date_in', '<=', $request->get('date_to'));
        }

        $records = $query->orderBy('date_in', 'desc')->paginate($request->get('per_page', 15));

        return TrackIncomingResource::collection($records);
    }


    /**
     * Store a new tracking request
     *
     * @param \App\Http\Requests\TrackIncomingRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(TrackIncomingRequest $request): JsonResponse
    {
        try {
            $data = $request->validated()['data'];
            $editId = $request->input('edit_id'); 
            $type = $request->input('type');
            
            // If we're in edit mode, update existing record
            if ($editId) {
                $trackIncoming = TrackIncoming::find($editId);
                
                if (!$trackIncoming) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tracking request not found for editing.'
                    ], 404);
                }

                // Check if this is a confirm mode edit (for for_confirmation status)
                $isConfirmMode = $request->input('confirm_mode', false);
                
                // Allow editing if status is pending_calibration OR if in confirm mode with for_confirmation status
                if ($trackIncoming->status !== 'pending_calibration' && !($isConfirmMode && $trackIncoming->status === 'for_confirmation')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Only pending calibration requests or confirmation mode requests can be edited.'
                    ], 400);
                }

                // Update the equipment if needed
                $equipment = $trackIncoming->equipment;
                if ($equipment) {
                    $equipment->update([
                        'serial_number' => $data['equipment']['serialNumber'],
                        'description' => $data['equipment']['description'],
                        'model' => $data['equipment']['model'],
                        'manufacturer' => $data['equipment']['manufacturer'],
                        'plant_id' => $data['equipment']['plant'],
                        'department_id' => $data['equipment']['department'],
                        'location_id' => $data['equipment']['location'],
                        'next_calibration_due' => $data['equipment']['dueDate'],
                    ]);
                }

            // Auto-assign technician and received_by if user is a technician
            $user = Auth::user();
            $technicianId = $data['technician']['employee_id'];
            $receivedById = $data['receivedBy']['employee_id'];
            
            if ($user->role->role_name === 'technician') {
                $technicianId = $user->employee_id;
                $receivedById = $user->employee_id;
            }

            // Update the tracking record
            $trackIncoming->update([
                'technician_id' => $technicianId,
                'description' => $data['equipment']['description'],
                'location_id' => $data['equipment']['location'],
                'received_by_id' => $receivedById,
                    'serial_number' => $data['equipment']['serialNumber'],
                    'model' => $data['equipment']['model'],
                    'manufacturer' => $data['equipment']['manufacturer'],
                    'due_date' => $data['equipment']['dueDate'],
                    'employee_id_in' => $data['scannedEmployee']['employee_id'],
                    'status' => $isConfirmMode && $trackIncoming->status === 'for_confirmation' ? 'pending_calibration' : $trackIncoming->status,
                    'notes' => $isConfirmMode ? 'Updated and confirmed via tracking request system' : 'Updated via tracking request system',
                ]);

                return response()->json([
                    'success' => true,
                    'message' => $isConfirmMode ? 'Employee request confirmed and updated successfully.' : 'Tracking request updated successfully.',
                    'data' => [
                        'track_incoming' => $trackIncoming,
                        'equipment' => $equipment,
                        'recall_number' => $trackIncoming->recall_number
                    ]
                ], 200);
            }
            
            // Create mode - existing logic
            $requestType = $data['requestType'] ?? 'new';
            
            // Handle recall number based on request type
            $recallNumber = null;
            if ($requestType === 'routine') {
                // For routine requests, recall number must be provided and validated
                $recallNumber = $data['equipment']['recallNumber'];
                if (!$recallNumber) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Recall number is required for routine calibration requests.'
                    ], 400);
                }
            } else {
                // For new requests, recall number is optional
                // If not provided, it will be generated during calibration
                $recallNumber = $data['equipment']['recallNumber'] ?? null;
            }
            
            // Check if equipment with this recall number already exists (for routine)
            $equipment = null;
            if ($recallNumber) {
                $equipment = Equipment::where('recall_number', $recallNumber)->first();
                
                if ($requestType === 'routine' && !$equipment) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Equipment with recall number ' . $recallNumber . ' not found.'
                    ], 404);
                }
            }
            
            if (!$equipment) {
                // Create new equipment record (for new requests)
                $equipment = Equipment::create([
                    'employee_id' => $data['technician']['employee_id'],
                    'recall_number' => $recallNumber, // This can be null for new requests
                    'serial_number' => $data['equipment']['serialNumber'],
                    'description' => $data['equipment']['description'],
                    'model' => $data['equipment']['model'],
                    'manufacturer' => $data['equipment']['manufacturer'],
                    'plant_id' => $data['equipment']['plant'],
                    'department_id' => $data['equipment']['department'],
                    'location_id' => $data['equipment']['location'],
                    'status' => 'active',
                    'next_calibration_due' => $data['equipment']['dueDate'],
                ]);
            } else {
                // Update existing equipment with new calibration due date if needed
                $equipment->update([
                    'next_calibration_due' => $data['equipment']['dueDate'],
                ]);
            }
            
            // Auto-assign technician and received_by if user is a technician
            $user = Auth::user();
            $technicianId = $data['technician']['employee_id'];
            $receivedById = $data['receivedBy']['employee_id'];
            
            if ($user->role->role_name === 'technician') {
                $technicianId = $user->employee_id;
                $receivedById = $user->employee_id;
            }

            // Create track incoming record
            $trackIncoming = TrackIncoming::create([
                'recall_number' => $recallNumber, // This can be null for new requests
                'technician_id' => $technicianId,
                'description' => $data['equipment']['description'],
                'equipment_id' => $equipment->equipment_id,
                'location_id' => $data['equipment']['location'],
                'received_by_id' => $receivedById,
                'serial_number' => $data['equipment']['serialNumber'],
                'model' => $data['equipment']['model'],
                'manufacturer' => $data['equipment']['manufacturer'],
                'due_date' => $data['equipment']['dueDate'],
                'date_in' => now(),
                'employee_id_in' => $data['scannedEmployee']['employee_id'],
                'status' => 'pending_calibration',
                'notes' => 'Created via tracking request system',
            ]);
            
            $message = $recallNumber 
                ? 'Tracking request created successfully with recall number: ' . $recallNumber
                : 'Tracking request created successfully. Recall number will be assigned during calibration.';
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'track_incoming' => $trackIncoming,
                    'equipment' => $equipment,
                    'recall_number' => $recallNumber
                ]
            ], 201);
                
        } catch (\Exception $e) {
            \Log::error('Error creating/updating tracking request: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to process tracking request. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Generate a unique recall number for tracking requests
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateUniqueRecall(Request $request): JsonResponse
    {
        $isRoutine = $request->input('routine'); 
        $editId = $request->input('edit'); 
        if ($editId) {
            $trackIncoming = TrackIncoming::find($editId);
            if ($trackIncoming) {
                return response()->json([
                    'success' => true,
                    'edit' => true,
                    'recall_number' => $trackIncoming->recall_number
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Tracking request not found.'
            ], 404);
        }

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
        // Get current authenticated user to check role
        $currentUser = Auth::user();
        $currentUser->load('role');
        
        // Check if current user is Admin or Technician - they can bypass PIN validation
        $canBypassPin = in_array($currentUser->role?->role_name, ['admin', 'technician']);
        
        // Validate request based on role
        if ($canBypassPin) {
            // Admin/Technician only needs employee_id
            $request->validate([
                'employee_id' => 'required|numeric',
            ]);
        } else {
            // Regular users need both employee_id and pin
            $request->validate([
                'employee_id' => 'required|numeric',
                'pin' => 'required|string|min:4',
            ]);
        }

        try {
            // Find the employee by employee_id
            $employee = User::where('employee_id', $request->employee_id)->first();

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found.'
                ], 404);
            }

            // Skip PIN validation for Admin/Technician roles
            if (!$canBypassPin) {
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
            }

            // PIN is correct or bypassed for Admin/Technician
            $message = $canBypassPin 
                ? 'Employee validated successfully (PIN bypassed for ' . ucfirst($currentUser->role->role_name) . ').'
                : 'PIN confirmed successfully.';

            return response()->json([
                'success' => true,
                'message' => $message,
                'bypassed_pin' => $canBypassPin,
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


    public function show(TrackIncoming $trackIncoming): TrackIncomingResource
    {
        $trackIncoming->load(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);
        return new TrackIncomingResource($trackIncoming);
    }

    public function update(TrackIncomingRequest $request, TrackIncoming $trackIncoming): TrackIncomingResource
    {
        $trackIncoming->update($request->validated());
        $trackIncoming->load(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);

        return new TrackIncomingResource($trackIncoming);
    }

    public function destroy(TrackIncoming $trackIncoming): JsonResponse
    {
        $trackIncoming->delete();
        return response()->json(['message' => 'Track incoming record deleted successfully']);
    }
    
    public function pending(Request $request): AnonymousResourceCollection
    {
        $query = TrackIncoming::where('status', 'pending_calibration')
            ->with(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);
            
        $records = $query->orderBy('due_date', 'asc')->paginate($request->get('per_page', 15));
        
        return TrackIncomingResource::collection($records);
    }
    
    public function overdue(Request $request): AnonymousResourceCollection
    {
        $query = TrackIncoming::where('due_date', '<', now())
            ->where('status', '!=', 'completed')
            ->with(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);
            
        $records = $query->orderBy('due_date', 'asc')->paginate($request->get('per_page', 15));
        
        return TrackIncomingResource::collection($records);
    }
    
    /**
     * Search track incoming records for employee requests
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
     * Confirm employee request - change status from for_confirmation to pending_calibration
     * 
     * @param \Illuminate\Http\Request $request
     * @param \App\Models\TrackIncoming $trackIncoming
     * @return \Illuminate\Http\JsonResponse
     */
    public function confirmEmployeeRequest(Request $request, TrackIncoming $trackIncoming): JsonResponse
    {
        try {
            // Apply role-based access control
            $user = Auth::user();
            
            // Only allow admins and technicians to confirm employee requests
            if ($user->role->role_name === 'employee') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only administrators and technicians can confirm employee requests.'
                ], 403);
            }
            
            // For technicians, ensure they can only confirm requests assigned to them
            if ($user->role->role_name === 'technician') {
                if ($trackIncoming->technician_id !== $user->employee_id && 
                    $trackIncoming->received_by_id !== $user->employee_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized. You can only confirm requests assigned to you.'
                    ], 403);
                }
            }

            // Only allow confirmation if status is for_confirmation
            if ($trackIncoming->status !== 'for_confirmation') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request cannot be confirmed as it is not in for_confirmation status.'
                ], 400);
            }

            // If received_by_id is provided, update it
            if ($request->filled('received_by_id')) {
                $trackIncoming->received_by_id = $request->input('received_by_id');
            }

            // Update status to pending_calibration
            $trackIncoming->update(['status' => 'pending_calibration']);
            
            $trackIncoming->load(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy', 'trackOutgoing']);

            return response()->json([
                'success' => true,
                'message' => 'Employee request confirmed successfully. Equipment handover verified.',
                'data' => new TrackIncomingResource($trackIncoming)
            ]);

        } catch (\Exception $e) {
            \Log::error('Error confirming employee request: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while confirming the request. Please try again.'
            ], 500);
        }
    }

    /**
     * Search equipment by recall number (for routine calibration)
     */
    public function searchByRecall(Request $request)
    {
        $recallNumber = $request->input('recall_number');
        if (!$recallNumber) {
            return response()->json(['success' => false, 'message' => 'Recall number required']);
        }
        $equipment = Equipment::where('recall_number', $recallNumber)->first();
        if ($equipment) {
            return response()->json(['success' => true, 'equipment' => $equipment]);
        }
        return response()->json(['success' => false, 'equipment' => null]);
    }
}
