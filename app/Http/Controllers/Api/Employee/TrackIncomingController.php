<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\EmployeeTrackIncomingRequest;
use App\Http\Resources\TrackIncomingResource;
use App\Models\TrackIncoming;
use App\Models\Equipment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TrackIncomingController extends Controller
{
    /**
     * Get incoming tracking records for the authenticated employee.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy', 'trackOutgoing'])
            ->where('employee_id_in', Auth::user()->employee_id);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('date_in', '>=', $request->get('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('date_in', '<=', $request->get('date_to'));
        }

        $records = $query->orderBy('date_in', 'desc')->paginate($request->get('per_page', 15));

        return TrackIncomingResource::collection($records);
    }

    /**
     * Store a new incoming tracking record for employee.
     */
    public function store(EmployeeTrackIncomingRequest $request): JsonResponse
    {
        try {
            $requestData = $request->input('data', []);
            $editId = $request->input('edit_id'); // Check if we're in edit mode
            
            // Validate required fields
            if (empty($requestData['technician']) || empty($requestData['technician']['employee_id'])) {
                return response()->json([
                    'message' => 'Technician information is required.',
                ], 422);
            }
            
            if (empty($requestData['equipment']) || empty($requestData['equipment']['description']) || 
                empty($requestData['equipment']['serialNumber'])) {
                return response()->json([
                    'message' => 'Equipment details are required.',
                ], 422);
            }
            
            // Handle edit mode
            if ($editId) {
                $trackIncoming = TrackIncoming::where('id', $editId)
                    ->where('employee_id_in', Auth::user()->employee_id)
                    ->where('status', 'for_confirmation')
                    ->first();
                
                if (!$trackIncoming) {
                    return response()->json([
                        'message' => 'Tracking request not found for editing.'
                    ], 404);
                }
                
                // Auto-assign technician and received_by if user is a technician
                $user = Auth::user();
                $technicianId = $requestData['technician']['employee_id'];
                $receivedById = $requestData['receivedBy']['employee_id'] ?? null;
                
                if ($user->role->role_name === 'technician') {
                    $technicianId = $user->employee_id;
                    $receivedById = $user->employee_id;
                }
                
                // Update existing record with new data
                $trackIncoming->update([
                    'technician_id' => $technicianId,
                    'description' => $requestData['equipment']['description'],
                    'serial_number' => $requestData['equipment']['serialNumber'],
                    'model' => $requestData['equipment']['model'] ?? $trackIncoming->model,
                    'manufacturer' => $requestData['equipment']['manufacturer'] ?? $trackIncoming->manufacturer,
                    'due_date' => $requestData['equipment']['dueDate'] ?? $trackIncoming->due_date,
                    'plant_id' => $requestData['equipment']['plant'] ?? $trackIncoming->plant_id,
                    'department_id' => $requestData['equipment']['department'] ?? $trackIncoming->department_id,
                    'location_id' => $requestData['equipment']['location'] ?? $trackIncoming->location_id,
                    // Keep employee and status fields unchanged
                    'employee_id_in' => $trackIncoming->employee_id_in,
                    'received_by_id' => $receivedById,
                    'status' => 'for_confirmation',
                ]);
                
                // Also update any calibration data if provided
                if (!empty($requestData['calibration'])) {
                    $calibration = $requestData['calibration'];
                    if (!empty($calibration['calibrationDate'])) {
                        $trackIncoming->calibration_date = $calibration['calibrationDate'];
                    }
                    if (!empty($calibration['expectedDueDate'])) {
                        $trackIncoming->expected_due_date = $calibration['expectedDueDate'];
                    }
                    if (!empty($calibration['dateOut'])) {
                        $trackIncoming->date_out = $calibration['dateOut'];
                    }
                    $trackIncoming->save();
                }
                
                // Update the equipment record if needed
                if ($trackIncoming->equipment_id) {
                    $equipment = Equipment::find($trackIncoming->equipment_id);
                    if ($equipment) {
                        $equipment->update([
                            'next_calibration_due' => $requestData['equipment']['dueDate'] ?? $equipment->next_calibration_due,
                            'serial_number' => $requestData['equipment']['serialNumber'] ?? $equipment->serial_number,
                            'description' => $requestData['equipment']['description'] ?? $equipment->description,
                            'model' => $requestData['equipment']['model'] ?? $equipment->model,
                            'manufacturer' => $requestData['equipment']['manufacturer'] ?? $equipment->manufacturer,
                            'process_req_range_start' => $requestData['equipment']['processReqRangeStart'] ?? $equipment->process_req_range_start,
                            'process_req_range_end' => $requestData['equipment']['processReqRangeEnd'] ?? $equipment->process_req_range_end,
                        ]);
                    }
                }
                
                $trackIncoming->load(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy']);
                return response()->json([
                    'message' => 'Tracking request updated successfully. Awaiting admin confirmation.',
                    'data' => new TrackIncomingResource($trackIncoming)
                ]);
            }
            
        
            // Create mode - existing logic
            // Generate unique recall number if not provided
            $recallNumber = $requestData['equipment']['recallNumber'] ?? TrackIncoming::generateUniqueRecallNumber();
            
            // Check if equipment with this recall number already exists
            $equipment = Equipment::where('recall_number', $recallNumber)->first();
                    
            if (!$equipment) {
                // Create new equipment record
                $equipment = Equipment::create([
                    'employee_id' => $requestData['technician']['employee_id'],
                    'recall_number' => $recallNumber,
                    'serial_number' => $requestData['equipment']['serialNumber'],
                    'description' => $requestData['equipment']['description'],
                    'model' => $requestData['equipment']['model'],
                    'manufacturer' => $requestData['equipment']['manufacturer'],
                    'plant_id' => $requestData['equipment']['plant'],
                    'department_id' => $requestData['equipment']['department'],
                    'location_id' => $requestData['equipment']['location'],
                    'status' => 'active',
                    'next_calibration_due' => $requestData['equipment']['dueDate'],
                    'process_req_range_start' => $requestData['equipment']['processReqRangeStart'] ?? null,
                    'process_req_range_end' => $requestData['equipment']['processReqRangeEnd'] ?? null,
                ]);
            } else {
                // Update existing equipment with new calibration due date if needed
                $equipment->update([
                    'next_calibration_due' => $requestData['equipment']['dueDate'],
                    'process_req_range_start' => $requestData['equipment']['processReqRangeStart'] ?? $equipment->process_req_range_start,
                    'process_req_range_end' => $requestData['equipment']['processReqRangeEnd'] ?? $equipment->process_req_range_end,
                ]);
            }
            
            
            // Auto-assign technician and received_by if user is a technician
            $user = Auth::user();
            $technicianId = $requestData['technician']['employee_id'];
            $receivedById = $requestData['receivedBy']['employee_id'] ?? null;
            
            if ($user->role->role_name === 'technician') {
                $technicianId = $user->employee_id;
                $receivedById = $user->employee_id;
            }
            
            // Create the TrackIncoming record
            // Create track incoming record
            $trackIncoming = TrackIncoming::create([
                'recall_number' => $recallNumber,
                'technician_id' => $technicianId,
                'description' => $requestData['equipment']['description'],
                'equipment_id' => $equipment->equipment_id,
                'location_id' => $requestData['equipment']['location'],
                'received_by_id' => $receivedById,
                'serial_number' => $requestData['equipment']['serialNumber'],
                'model' => $requestData['equipment']['model'],
                'manufacturer' => $requestData['equipment']['manufacturer'],
                'due_date' => $requestData['equipment']['dueDate'],
                'date_in' => now(),
                'employee_id_in' => $requestData['scannedEmployee']['employee_id'],
                'status' => 'for_confirmation',
                'notes' => 'Created via employee tracking request system',
            ]);
            
            $trackIncoming->load(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy']);

            return response()->json([
                'message' => 'Tracking request submitted successfully. Awaiting admin confirmation.',
                'data' => new TrackIncomingResource($trackIncoming)
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Error creating employee tracking request: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to process tracking request. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific incoming record for the employee.
     */
    public function show(TrackIncoming $trackIncoming): TrackIncomingResource
    {
        // Ensure employee can only view their own records
        if ($trackIncoming->employee_id_in !== Auth::user()->employee_id) {
            abort(403, 'Unauthorized access to this record.');
        }

        $trackIncoming->load(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy', 'trackOutgoing']);
        return new TrackIncomingResource($trackIncoming);
    }

    /**
     * Update an incoming record (only allowed if status is for_confirmation).
     */
    /**
     * Update an incoming record (only allowed if status is for_confirmation).
     */
    public function update(EmployeeTrackIncomingRequest $request, TrackIncoming $trackIncoming): TrackIncomingResource
    {
        try {
            // Ensure employee can only update their own records
            if ($trackIncoming->employee_id_in !== Auth::user()->employee_id) {
                abort(403, 'Unauthorized access to this record.');
            }

            // Only allow updates if status is for_confirmation
            if ($trackIncoming->status !== 'for_confirmation') {
                abort(403, 'This request can no longer be modified.');
            }

            $requestData = $request->input('data', []);
            
            // Validate required fields
            if (empty($requestData['technician']) || empty($requestData['technician']['employee_id'])) {
                abort(422, 'Technician information is required.');
            }
            
            if (empty($requestData['equipment']) || empty($requestData['equipment']['description']) || 
                empty($requestData['equipment']['serialNumber'])) {
                abort(422, 'Equipment details are required.');
            }
            
            // Update tracking record with new data
            $trackIncoming->technician_id = $requestData['technician']['employee_id'];
            $trackIncoming->description = $requestData['equipment']['description'];
            $trackIncoming->serial_number = $requestData['equipment']['serialNumber'];
            
            // Update other equipment details if provided
            if (!empty($requestData['equipment']['model'])) {
                $trackIncoming->model = $requestData['equipment']['model'];
            }
            
            if (!empty($requestData['equipment']['manufacturer'])) {
                $trackIncoming->manufacturer = $requestData['equipment']['manufacturer'];
            }
            
            if (!empty($requestData['equipment']['dueDate'])) {
                $trackIncoming->due_date = $requestData['equipment']['dueDate'];
            }
            
            if (!empty($requestData['equipment']['plant'])) {
                $trackIncoming->plant_id = $requestData['equipment']['plant'];
            }
            
            if (!empty($requestData['equipment']['department'])) {
                $trackIncoming->department_id = $requestData['equipment']['department'];
            }
            
            if (!empty($requestData['equipment']['location'])) {
                $trackIncoming->location_id = $requestData['equipment']['location'];
            }
            
            // Update calibration data if provided
            if (!empty($requestData['calibration'])) {
                $calibration = $requestData['calibration'];
                if (!empty($calibration['calibrationDate'])) {
                    $trackIncoming->calibration_date = $calibration['calibrationDate'];
                }
                if (!empty($calibration['expectedDueDate'])) {
                    $trackIncoming->expected_due_date = $calibration['expectedDueDate'];
                }
                if (!empty($calibration['dateOut'])) {
                    $trackIncoming->date_out = $calibration['dateOut'];
                }
            }
            
            // Ensure employee data remains unchanged
            $trackIncoming->employee_id_in = $trackIncoming->employee_id_in;
            $trackIncoming->received_by_id = null; // Keep as null for employee requests
            $trackIncoming->status = 'for_confirmation'; // Always keep as for_confirmation
            
            $trackIncoming->save();
            $trackIncoming->load(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy']);

            return new TrackIncomingResource($trackIncoming);
        } catch (\Exception $e) {
            \Log::error('Error updating employee tracking request: ' . $e->getMessage());
            abort(500, 'Failed to update tracking request. Please try again.');
        }
    }

    /**
     * Get pending confirmation requests for the employee.
     */
    public function pendingConfirmation(Request $request): AnonymousResourceCollection
    {
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy'])
            ->where('employee_id_in', Auth::user()->employee_id)
            ->where('status', 'for_confirmation');

        $records = $query->orderBy('date_in', 'desc')->paginate($request->get('per_page', 15));

        return TrackIncomingResource::collection($records);
    }
}
