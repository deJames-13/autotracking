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

class TrackOutgoingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = TrackOutgoing::with(['trackIncoming', 'employeeOut', 'equipment', 'technician']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('recall_number', 'like', "%{$search}%");
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
        // Update the corresponding incoming record status
        $incoming = TrackIncoming::where('recall_number', $request->recall_number)->first();
        if ($incoming) {
            $incoming->update(['status' => 'completed']);
        }

        $record = TrackOutgoing::create($request->validated());
        $record->load(['trackIncoming', 'employeeOut', 'equipment', 'technician']);

        return new TrackOutgoingResource($record);
    }

    public function show(TrackOutgoing $trackOutgoing): TrackOutgoingResource
    {
        $trackOutgoing->load(['trackIncoming', 'employeeOut', 'equipment', 'technician']);
        return new TrackOutgoingResource($trackOutgoing);
    }

    public function update(TrackOutgoingRequest $request, TrackOutgoing $trackOutgoing): TrackOutgoingResource
    {
        $trackOutgoing->update($request->validated());
        $trackOutgoing->load(['trackIncoming', 'employeeOut', 'equipment', 'technician']);

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
            ->with(['trackIncoming', 'employeeOut', 'equipment', 'technician']);
            
        $records = $query->orderBy('cal_due_date', 'asc')->paginate($request->get('per_page', 15));
        
        return TrackOutgoingResource::collection($records);
    }
}
