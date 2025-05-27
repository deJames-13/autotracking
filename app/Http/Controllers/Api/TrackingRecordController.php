<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrackingRecordRequest;
use App\Http\Resources\TrackingRecordResource;
use App\Models\TrackingRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TrackingRecordController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TrackingRecord::with(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('description', 'like', "%{$search}%");
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

        if ($request->has('recall')) {
            $query->where('recall', $request->get('recall') === 'true');
        }

        if ($request->has('date_from')) {
            $query->where('date_in', '>=', $request->get('date_from'));
        }

        if ($request->has('date_to')) {
            $query->where('date_in', '<=', $request->get('date_to'));
        }

        $records = $query->orderBy('date_in', 'desc')->paginate($request->get('per_page', 15));

        return TrackingRecordResource::collection($records);
    }

    public function store(TrackingRecordRequest $request): TrackingRecordResource
    {
        $record = TrackingRecord::create($request->validated());
        $record->load(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut']);

        return new TrackingRecordResource($record);
    }

    public function show(TrackingRecord $trackingRecord): TrackingRecordResource
    {
        $trackingRecord->load(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut']);
        return new TrackingRecordResource($trackingRecord);
    }

    public function update(TrackingRecordRequest $request, TrackingRecord $trackingRecord): TrackingRecordResource
    {
        $trackingRecord->update($request->validated());
        $trackingRecord->load(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut']);

        return new TrackingRecordResource($trackingRecord);
    }

    public function destroy(TrackingRecord $trackingRecord): JsonResponse
    {
        $trackingRecord->delete();
        return response()->json(['message' => 'Tracking record deleted successfully']);
    }
    
    public function checkOut(Request $request, TrackingRecord $trackingRecord): TrackingRecordResource
    {
        $request->validate([
            'employee_id_out' => 'required|exists:users,employee_id',
            'date_out' => 'required|date|after_or_equal:' . $trackingRecord->date_in
        ]);
        
        $trackingRecord->update([
            'employee_id_out' => $request->employee_id_out,
            'date_out' => $request->date_out
        ]);
        
        $trackingRecord->load(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut']);
        
        return new TrackingRecordResource($trackingRecord);
    }
    
    public function recall(TrackingRecord $trackingRecord): TrackingRecordResource
    {
        $trackingRecord->update(['recall' => true]);
        $trackingRecord->load(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut']);
        
        return new TrackingRecordResource($trackingRecord);
    }
    
    public function overdue(Request $request): AnonymousResourceCollection
    {
        $query = TrackingRecord::where('cal_due_date', '<', now())
            ->whereNull('date_out')
            ->with(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut']);
            
        $records = $query->orderBy('cal_due_date', 'asc')->paginate($request->get('per_page', 15));
        
        return TrackingRecordResource::collection($records);
    }
    
    public function dueSoon(Request $request): AnonymousResourceCollection
    {
        $daysAhead = $request->get('days', 7);
        
        $query = TrackingRecord::whereBetween('cal_due_date', [
                now(),
                now()->addDays($daysAhead)
            ])
            ->whereNull('date_out')
            ->with(['equipment', 'technician', 'location', 'employeeIn', 'employeeOut']);
            
        $records = $query->orderBy('cal_due_date', 'asc')->paginate($request->get('per_page', 15));
        
        return TrackingRecordResource::collection($records);
    }
}
