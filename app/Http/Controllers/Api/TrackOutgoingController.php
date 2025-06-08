<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrackOutgoingRequest;
use App\Http\Resources\TrackOutgoingResource;
use App\Models\TrackOutgoing;
use App\Models\TrackIncoming;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class TrackOutgoingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']);

        // Apply role-based filtering
        $user = Auth::user();
        if ($user->role->role_name === 'technician') {
            // Technicians can only see records from their assigned incoming requests
            $query->whereHas('trackIncoming', function($q) use ($user) {
                $q->where('technician_id', $user->employee_id)
                  ->orWhere('received_by_id', $user->employee_id);
            });
        } elseif ($user->role->role_name === 'employee') {
            // Employees can only see outgoing records from their department
            $query->whereHas('trackIncoming.employeeIn', function($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        }
        // Admin users can see all records (no additional filtering)

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->whereHas('trackIncoming', function($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%");
            });
        }

        if ($request->has('employee_id_out')) {
            $query->where('employee_id_out', $request->get('employee_id_out'));
        }

        if ($request->has('date_from')) {
            $query->where('date_out', '>=', $request->get('date_from'));
        }

        if ($request->has('date_to')) {
            $query->where('date_out', '<=', $request->get('date_to'));
        }

        $records = $query->orderBy('date_out', 'desc')->paginate($request->get('per_page', 15));

        return TrackOutgoingResource::collection($records);
    }

    public function store(TrackOutgoingRequest $request): TrackOutgoingResource
    {
        $incoming = TrackIncoming::find($request->incoming_id);
        if ($incoming) {
            // Update both status and recall number in the incoming record
            $incoming->update([
                'status' => 'completed',
                'recall_number' => $request->recall_number
            ]);
            
            // Also update the recall number in the related equipment if it exists
            if ($incoming->equipment) {
                $incoming->equipment->update([
                    'recall_number' => $request->recall_number
                ]);
            }
        }

        $validatedData = $request->validated();
        $validatedData['status'] = 'for_pickup'; // Set status to for_pickup instead of requiring confirmation
        
        // Set employee_id_out to null since it will be filled when pickup is confirmed
        $validatedData['employee_id_out'] = null;
        
        // Set released_by_id to current authenticated user (admin/operator releasing the equipment)
        $validatedData['released_by_id'] = auth()->user()->employee_id;

        // Auto-calculate overdue based on CT Required vs Cycle Time
        // Only auto-calculate if overdue is not explicitly provided (manual override)
        if (!isset($validatedData['overdue']) && isset($validatedData['ct_reqd']) && isset($validatedData['cycle_time'])) {
            $ctReqd = (int) $validatedData['ct_reqd'];
            $cycleTime = (int) $validatedData['cycle_time'];
            $validatedData['overdue'] = ($ctReqd < $cycleTime) ? 1 : 0;
        } elseif (isset($validatedData['overdue'])) {
            // Convert yes/no to 1/0 if coming from frontend
            if (is_string($validatedData['overdue'])) {
                $validatedData['overdue'] = ($validatedData['overdue'] === 'yes') ? 1 : 0;
            }
        }
        
        // Auto-calculate queuing days (incoming date to cal date)
        // if ($incoming && isset($validatedData['cal_date'])) {
            // $incomingDate = new \DateTime($incoming->date_in);
            // $calDate = new \DateTime($validatedData['cal_date']);
            
            // $interval = $incomingDate->diff($calDate);
            // $validatedData['cycle_time'] = $interval->days;
        // }
        $record = TrackOutgoing::create($validatedData);
        $record->load(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']);

        return new TrackOutgoingResource($record);
    }

    public function show(TrackOutgoing $trackOutgoing): TrackOutgoingResource
    {
        $trackOutgoing->load(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']);
        return new TrackOutgoingResource($trackOutgoing);
    }

    public function update(TrackOutgoingRequest $request, TrackOutgoing $trackOutgoing): TrackOutgoingResource
    {
        // Check if user is trying to edit a completed record and is not an admin
        if ($trackOutgoing->status === 'completed' && auth()->user()->role->role_name !== 'admin') {
            abort(403, 'Only administrators can edit completed records.');
        }

        $validatedData = $request->validated();
        
        // Auto-calculate overdue based on CT Required vs Cycle Time
        // Only auto-calculate if overdue is not explicitly provided (manual override)
        if (!isset($validatedData['overdue']) && isset($validatedData['ct_reqd']) && isset($validatedData['cycle_time'])) {
            $ctReqd = (int) $validatedData['ct_reqd'];
            $cycleTime = (int) $validatedData['cycle_time'];
            $validatedData['overdue'] = ($ctReqd < $cycleTime) ? 1 : 0;
        } elseif (isset($validatedData['overdue'])) {
            // Convert yes/no to 1/0 if coming from frontend
            if (is_string($validatedData['overdue'])) {
                $validatedData['overdue'] = ($validatedData['overdue'] === 'yes') ? 1 : 0;
            }
        }
        
        // Auto-calculate queuing days (incoming date to cal date)
        // if (isset($validatedData['cal_date']) && $trackOutgoing->trackIncoming) {
        //     $incomingDate = new \DateTime($trackOutgoing->trackIncoming->date_in);
        //     $calDate = new \DateTime($validatedData['cal_date']);
            
        //     $interval = $incomingDate->diff($calDate);
        //     $validatedData['cycle_time'] = $interval->days;
        // }
        
        $trackOutgoing->update($validatedData);
        $trackOutgoing->load(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']);

        return new TrackOutgoingResource($trackOutgoing);
    }

    public function destroy(TrackOutgoing $trackOutgoing): JsonResponse
    {
        $trackOutgoing->delete();
        return response()->json(['message' => 'Track outgoing record deleted successfully']);
    }
    
    public function dueSoon(Request $request): AnonymousResourceCollection
    {
        $daysAhead = $request->get('days', 7);
        
        $query = TrackOutgoing::whereBetween('cal_due_date', [
                now(),
                now()->addDays($daysAhead)
            ])
            ->with(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']);
            
        $records = $query->orderBy('cal_due_date', 'asc')->paginate($request->get('per_page', 15));
        
        return TrackOutgoingResource::collection($records);
    }

    /**
     * Confirm equipment pickup by employee
     * 
     * @param \Illuminate\Http\Request $request
     * @param \App\Models\TrackOutgoing $trackOutgoing
     * @return \Illuminate\Http\JsonResponse
     */
    public function confirmPickup(Request $request, TrackOutgoing $trackOutgoing): JsonResponse
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
                'employee_id' => 'required|exists:users,employee_id',
            ]);
        } else {
            // Regular users need both employee_id and confirmation_pin
            $request->validate([
                'employee_id' => 'required|exists:users,employee_id',
                'confirmation_pin' => 'required|string'
            ]);
        }

        try {
            // Verify the employee and PIN
            $employee = User::where('employee_id', $request->employee_id)->first();
            
            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found.'
                ], 404);
            }

            // Skip PIN validation for Admin/Technician roles
            if (!$canBypassPin) {
                if (!Hash::check($request->confirmation_pin, $employee->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid PIN. Please try again.'
                    ], 401);
                }
            }

            // Validate department match - employees from same department can pick up equipment
            if ($trackOutgoing->trackIncoming && $trackOutgoing->trackIncoming->employeeIn) {
                $employeeIn = $trackOutgoing->trackIncoming->employeeIn;
                
                // Load department relationship1 $employee->load('department');
                $employeeIn->load('department');
                
                $employeeOutDeptId = $employee->department_id ?? $employee->department?->id;
                $employeeInDeptId = $employeeIn->department_id ?? $employeeIn->department?->id;
                
                if (!$employeeOutDeptId || !$employeeInDeptId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Department information is missing. Please ensure both employees have department assignments.'
                    ], 422);
                }
                
                if ($employeeOutDeptId !== $employeeInDeptId) {
                    $employeeOutDeptName = $employee->department?->department_name ?? 'Unknown Department';
                    $employeeInDeptName = $employeeIn->department?->department_name ?? 'Unknown Department';
                    
                    return response()->json([
                        'success' => false,
                        'message' => "Department mismatch: You are from {$employeeOutDeptName} department but equipment was received by {$employeeInDeptName} department. Only employees from the same department can pick up equipment."
                    ], 403);
                }
            }

            // Only allow pickup if status is for_pickup
            if ($trackOutgoing->status !== 'for_pickup') {
                return response()->json([
                    'success' => false,
                    'message' => 'This equipment is not ready for pickup.'
                ], 400);
            }

            // Update status to completed and set the employee who picked it up
            // Note: released_by_id should remain as the admin/operator who released it, not the pickup employee
            $trackOutgoing->update([
                'status' => 'completed',
                'employee_id_out' => $employee->employee_id,
                'picked_up_at' => now(),
                'picked_up_by' => $employee->employee_id
            ]);

            $message = $canBypassPin 
                ? 'Equipment pickup confirmed successfully (PIN bypassed for ' . ucfirst($currentUser->role->role_name) . ').'
                : 'Equipment pickup confirmed successfully.';

            return response()->json([
                'success' => true,
                'message' => $message,
                'bypassed_pin' => $canBypassPin,
                'data' => $trackOutgoing->fresh(['trackIncoming', 'employeeOut', 'releasedBy'])
            ]);

        } catch (\Exception $e) {
            \Log::error('Error confirming equipment pickup: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while confirming pickup. Please try again.'
            ], 500);
        }
    }
}
