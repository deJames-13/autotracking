<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EquipmentRequest;
use App\Http\Resources\EquipmentResource;
use App\Http\Resources\TrackIncomingResource;
use App\Models\Equipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EquipmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Equipment::with(['user', 'trackIncoming']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('serial_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->get('employee_id'));
        }

        if ($request->has('manufacturer')) {
            $query->where('manufacturer', 'like', "%{$request->get('manufacturer')}%");
        }

        $equipment = $query->paginate($request->get('per_page', 15));

        return EquipmentResource::collection($equipment);
    }

    public function store(EquipmentRequest $request): EquipmentResource
    {
        $equipment = Equipment::create($request->validated());
        $equipment->load(['user', 'trackIncoming']);

        return new EquipmentResource($equipment);
    }

    public function show(Equipment $equipment): EquipmentResource
    {
        $equipment->load(['user', 'trackIncoming']);
        return new EquipmentResource($equipment);
    }

    public function update(EquipmentRequest $request, Equipment $equipment): EquipmentResource
    {
        $equipment->update($request->validated());
        $equipment->load(['user', 'trackIncoming']);

        return new EquipmentResource($equipment);
    }

    public function destroy(Equipment $equipment): JsonResponse
    {
        $equipment->delete();
        return response()->json(['message' => 'Equipment deleted successfully']);
    }
    
    public function trackIncoming(Equipment $equipment): AnonymousResourceCollection
    {
        return TrackIncomingResource::collection(
            $equipment->trackIncoming()
                ->with(['technician', 'location', 'employeeIn', 'trackOutgoing'])
                ->paginate(15)
        );
    }
    
    public function assignUser(Request $request, Equipment $equipment): EquipmentResource
    {
        $request->validate([
            'employee_id' => 'required|exists:users,employee_id'
        ]);
        
        $equipment->update(['employee_id' => $request->employee_id]);
        $equipment->load(['user', 'trackIncoming']);
        
        return new EquipmentResource($equipment);
    }
    
    public function unassignUser(Equipment $equipment): EquipmentResource
    {
        $equipment->update(['employee_id' => null]);
        $equipment->load(['user', 'trackIncoming']);
        
        return new EquipmentResource($equipment);
    }
}
