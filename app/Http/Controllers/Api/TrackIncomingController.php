<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrackIncomingRequest;
use App\Http\Resources\TrackIncomingResource;
use App\Models\TrackIncoming;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TrackIncomingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);

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

    public function store(TrackIncomingRequest $request): TrackIncomingResource
    {
        $record = TrackIncoming::create($request->validated());
        $record->load(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);

        return new TrackIncomingResource($record);
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
            ->where('status', '!=', 'ready_for_pickup')
            ->with(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);
            
        $records = $query->orderBy('due_date', 'asc')->paginate($request->get('per_page', 15));
        
        return TrackIncomingResource::collection($records);
    }
}
