<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LocationRequest;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LocationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Location::with(['department', 'trackIncoming', 'trackOutgoing']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('location_name', 'like', "%{$search}%");
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->get('department_id'));
        }

        $locations = $query->paginate($request->get('per_page', 15));

        return LocationResource::collection($locations);
    }

    public function store(LocationRequest $request): LocationResource
    {
        $location = Location::create($request->validated());
        $location->load(['department', 'trackIncoming', 'trackOutgoing']);

        return new LocationResource($location);
    }

    public function show(Location $location): LocationResource
    {
        $location->load(['department', 'trackIncoming', 'trackOutgoing']);
        return new LocationResource($location);
    }

    public function update(LocationRequest $request, Location $location): LocationResource
    {
        $location->update($request->validated());
        $location->load(['department', 'trackIncoming', 'trackOutgoing']);

        return new LocationResource($location);
    }

    public function destroy(Location $location): JsonResponse
    {
        $location->delete();
        return response()->json(['message' => 'Location deleted successfully']);
    }
}
