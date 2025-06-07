<?php

namespace App\Http\Controllers\Api\Technician;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrackIncomingRequest;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use App\Models\Equipment;
use App\Models\User;
use App\Http\Resources\TrackIncomingResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TrackIncomingController extends Controller
{
    /**
     * Get track incoming records for technician.
     * Technicians can only see records assigned to them.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing'])
            ->where('technician_id', Auth::user()->employee_id);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('recall_number', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%");
            });
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
     * Store a new tracking request for technician.
     * Auto-assigns the logged-in technician and auto-fills received_by.
     */
    public function store(TrackIncomingRequest $request): JsonResponse
    {
        try {
            $data = $request->validated()['data'];
            $editId = $request->input('edit_id'); 
            $type = $request->input('type');
            
            // If we're in edit mode, update existing record
            if ($editId) {
                $trackIncoming = TrackIncoming::where('id', $editId)
                    ->where('technician_id', Auth::user()->employee_id)
                    ->first();
                
                if (!$trackIncoming) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tracking request not found or not assigned to you.'
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

                if (!$equipment && !empty($data['equipment']['serial_number'])) {
                    $equipment = Equipment::create([
                        'serial_number' => $data['equipment']['serial_number'],
                        'description' => $data['equipment']['description'] ?? '',
                        'model' => $data['equipment']['model'] ?? null,
                        'manufacturer' => $data['equipment']['manufacturer'] ?? null,
                        'type' => $data['equipment']['type'] ?? 'other',
                        'category' => $data['equipment']['category'] ?? 'general',
                        'status' => 'active',
                        'employee_id' => $data['employee']['employee_id'] ?? null,
                        'location_id' => $data['equipment']['location'] ?? null,
                        'department_id' => $data['equipment']['department'] ?? null,
                        'plant_id' => $data['equipment']['plant'] ?? null,
                    ]);
                    
                    $trackIncoming->equipment_id = $equipment->equipment_id;
                }

                // Update tracking record (technician stays the same for technician role)
                $trackIncoming->update([
                    'technician_id' => Auth::user()->employee_id, // Auto-assign logged-in technician
                    'description' => $data['equipment']['description'],
                    'serial_number' => $data['equipment']['serialNumber'] ?? $data['equipment']['serial_number'],
                    'model' => $data['equipment']['model'] ?? null,
                    'manufacturer' => $data['equipment']['manufacturer'] ?? null,
                    'due_date' => $data['equipment']['dueDate'] ?? null,
                    'plant_id' => $data['equipment']['plant'] ?? null,
                    'department_id' => $data['equipment']['department'] ?? null,
                    'location_id' => $data['equipment']['location'] ?? null,
                    'employee_id_in' => $data['employee']['employee_id'] ?? null,
                    'received_by_id' => Auth::user()->employee_id, // Auto-assign as received by technician
                    'date_in' => now(),
                    'status' => 'pending_calibration'
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Tracking request updated successfully.',
                    'data' => $trackIncoming->fresh(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy'])
                ]);
            }

            // For new requests, handle the creation
            $equipment = null;
            
            // Handle equipment creation or assignment
            if (!empty($data['equipment']['serial_number'])) {
                $equipment = Equipment::where('serial_number', $data['equipment']['serial_number'])->first();
                
                if (!$equipment) {
                    $equipment = Equipment::create([
                        'serial_number' => $data['equipment']['serial_number'],
                        'description' => $data['equipment']['description'] ?? '',
                        'model' => $data['equipment']['model'] ?? null,
                        'manufacturer' => $data['equipment']['manufacturer'] ?? null,
                        'type' => $data['equipment']['type'] ?? 'other',
                        'category' => $data['equipment']['category'] ?? 'general',
                        'status' => 'active',
                        'employee_id' => $data['employee']['employee_id'] ?? null,
                        'location_id' => $data['equipment']['location'] ?? null,
                        'department_id' => $data['equipment']['department'] ?? null,
                        'plant_id' => $data['equipment']['plant'] ?? null,
                    ]);
                }
            }

            // Generate recall number
            $lastRecord = TrackIncoming::latest('id')->first();
            $recallNumber = $lastRecord ? $lastRecord->id + 1 : 1;

            // Create tracking record with auto-assigned technician
            $trackIncoming = TrackIncoming::create([
                'recall_number' => str_pad($recallNumber, 6, '0', STR_PAD_LEFT),
                'equipment_id' => $equipment?->equipment_id,
                'technician_id' => Auth::user()->employee_id, // Auto-assign logged-in technician
                'description' => $data['equipment']['description'],
                'serial_number' => $data['equipment']['serialNumber'] ?? $data['equipment']['serial_number'],
                'model' => $data['equipment']['model'] ?? null,
                'manufacturer' => $data['equipment']['manufacturer'] ?? null,
                'due_date' => $data['equipment']['dueDate'] ?? null,
                'plant_id' => $data['equipment']['plant'] ?? null,
                'department_id' => $data['equipment']['department'] ?? null,
                'location_id' => $data['equipment']['location'] ?? null,
                'employee_id_in' => $data['employee']['employee_id'] ?? null,
                'received_by_id' => Auth::user()->employee_id, // Auto-assign as received by technician
                'date_in' => now(),
                'status' => 'pending_calibration'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tracking request created successfully.',
                'data' => $trackIncoming->fresh(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing the request.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific track incoming record for technician.
     */
    public function show(TrackIncoming $trackIncoming): JsonResponse
    {
        // Ensure technician can only view their own assigned records
        if ($trackIncoming->technician_id !== Auth::user()->employee_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to this record.'
            ], 403);
        }

        $trackIncoming->load(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy', 'trackOutgoing']);

        return response()->json([
            'success' => true,
            'data' => new TrackIncomingResource($trackIncoming)
        ]);
    }

    /**
     * Update a track incoming record for technician.
     */
    public function update(Request $request, TrackIncoming $trackIncoming): JsonResponse
    {
        // Ensure technician can only update their own assigned records
        if ($trackIncoming->technician_id !== Auth::user()->employee_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to this record.'
            ], 403);
        }

        $request->validate([
            'status' => 'sometimes|string|in:pending_calibration,in_calibration,for_release',
            'cal_date' => 'sometimes|nullable|date',
            'cal_due_date' => 'sometimes|nullable|date',
            'remarks' => 'sometimes|nullable|string'
        ]);

        $trackIncoming->update($request->only(['status', 'cal_date', 'cal_due_date', 'remarks']));

        return response()->json([
            'success' => true,
            'message' => 'Record updated successfully.',
            'data' => new TrackIncomingResource($trackIncoming->fresh(['equipment', 'technician', 'location', 'employeeIn', 'receivedBy']))
        ]);
    }
    
    /**
     * Generate a unique recall number
     */
    private function generateUniqueRecallNumber(): string
    {
        do {
            $recallNumber = 'RN' . date('Ymd') . rand(1000, 9999);
        } while (Equipment::where('recall_number', $recallNumber)->exists());
        
        return $recallNumber;
    }
}
