<?php

namespace App\Http\Controllers\Api\Technician;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrackOutgoingRequest;
use App\Http\Resources\TrackOutgoingResource;
use App\Models\TrackOutgoing;
use App\Models\TrackIncoming;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;

class TrackOutgoingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician'])
            ->where('technician_id', Auth::user()->employee_id);

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
        $validatedData['status'] = 'for_pickup';
        
        // Set employee_id_out to null since it will be filled when pickup is confirmed
        $validatedData['employee_id_out'] = null;
        
        // Auto-assign current technician
        $validatedData['technician_id'] = Auth::user()->employee_id;
        $validatedData['released_by_id'] = Auth::user()->employee_id;

        // Auto-calculate overdue (due date vs cal date)
        if ($incoming && isset($validatedData['cal_date'])) {
            $dueDate = new \DateTime($incoming->due_date);
            $calDate = new \DateTime($validatedData['cal_date']);
            
            if ($calDate > $dueDate) {
                $interval = $dueDate->diff($calDate);
                $validatedData['overdue'] = $interval->days;
            } else {
                $validatedData['overdue'] = 0;
            }
        }
        
        // Auto-calculate queuing days (incoming date to cal date)
        if ($incoming && isset($validatedData['cal_date'])) {
            $incomingDate = new \DateTime($incoming->date_in);
            $calDate = new \DateTime($validatedData['cal_date']);
            
            $interval = $incomingDate->diff($calDate);
            $validatedData['cycle_time'] = $interval->days;
        }
        
        $record = TrackOutgoing::create($validatedData);
        $record->load(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']);

        return new TrackOutgoingResource($record);
    }

    public function show(TrackOutgoing $trackOutgoing): TrackOutgoingResource
    {
        // Ensure technician can only view their own records
        if ($trackOutgoing->technician_id !== Auth::user()->employee_id) {
            abort(403, 'Access denied. You can only view records you handled.');
        }

        $trackOutgoing->load(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']);
        return new TrackOutgoingResource($trackOutgoing);
    }

    public function update(TrackOutgoingRequest $request, TrackOutgoing $trackOutgoing): TrackOutgoingResource
    {
        // Ensure technician can only edit their own records
        if ($trackOutgoing->technician_id !== Auth::user()->employee_id) {
            abort(403, 'Access denied. You can only edit records you handled.');
        }

        $validatedData = $request->validated();
        
        // Technicians cannot change technician assignment (it should remain themselves)
        $validatedData['technician_id'] = Auth::user()->employee_id;
        
        // Auto-calculate overdue (due date vs cal date)
        if (isset($validatedData['cal_date']) && $trackOutgoing->trackIncoming) {
            $dueDate = new \DateTime($trackOutgoing->trackIncoming->due_date);
            $calDate = new \DateTime($validatedData['cal_date']);
            
            if ($calDate > $dueDate) {
                $interval = $dueDate->diff($calDate);
                $validatedData['overdue'] = $interval->days;
            } else {
                $validatedData['overdue'] = 0;
            }
        }
        
        // Auto-calculate queuing days (incoming date to cal date)
        if (isset($validatedData['cal_date']) && $trackOutgoing->trackIncoming) {
            $incomingDate = new \DateTime($trackOutgoing->trackIncoming->date_in);
            $calDate = new \DateTime($validatedData['cal_date']);
            
            $interval = $incomingDate->diff($calDate);
            $validatedData['cycle_time'] = $interval->days;
        }
        
        $trackOutgoing->update($validatedData);
        $trackOutgoing->load(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']);

        return new TrackOutgoingResource($trackOutgoing);
    }

    public function destroy(TrackOutgoing $trackOutgoing): JsonResponse
    {
        // Ensure technician can only delete their own records
        if ($trackOutgoing->technician_id !== Auth::user()->employee_id) {
            abort(403, 'Access denied. You can only delete records you handled.');
        }

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
            ->where('technician_id', Auth::user()->employee_id)
            ->with(['trackIncoming', 'employeeOut', 'releasedBy', 'equipment', 'technician']);
            
        $records = $query->orderBy('cal_due_date', 'asc')->paginate($request->get('per_page', 15));
        
        return TrackOutgoingResource::collection($records);
    }
}
