<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PlantRequest;
use App\Http\Resources\PlantResource;
use App\Models\Plant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlantController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Plant::with(['users']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('plant_name', 'like', "%{$search}%");
        }

        $plants = $query->paginate($request->get('per_page', 15));

        return PlantResource::collection($plants);
    }

    public function store(PlantRequest $request): PlantResource
    {
        $plant = Plant::create($request->validated());
        $plant->load(['users']);

        return new PlantResource($plant);
    }

    public function show(Plant $plant): PlantResource
    {
        $plant->load(['users']);
        return new PlantResource($plant);
    }

    public function update(PlantRequest $request, Plant $plant): PlantResource
    {
        $plant->update($request->validated());
        $plant->load(['users']);

        return new PlantResource($plant);
    }

    public function destroy(Plant $plant): JsonResponse
    {
        $plant->delete();
        return response()->json(['message' => 'Plant deleted successfully']);
    }
}
