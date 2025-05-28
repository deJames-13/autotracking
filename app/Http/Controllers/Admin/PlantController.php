<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PlantRequest;
use App\Models\Plant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class PlantController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        // Get initial data for the page
        $plants = Plant::with(['users'])
            ->when($request->search, function ($query, $search) {
                $query->where('plant_name', 'like', "%{$search}%");
            })
            ->paginate(15)
            ->withQueryString();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $plants
            ]);
        }

        return Inertia::render('admin/plants/index', [
            'plants' => $plants,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/plants/create');
    }

    public function store(PlantRequest $request): RedirectResponse|JsonResponse
    {
        $plant = Plant::create($request->validated());
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Plant created successfully.',
                'data' => $plant
            ]);
        }

        return redirect()->route('admin.plants.index')
            ->with('success', 'Plant created successfully.');
    }

    public function show(Plant $plant, Request $request): Response|JsonResponse
    {
        $plant->load(['users']);
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $plant
            ]);
        }
        
        return Inertia::render('admin/plants/show', [
            'plant' => $plant,
        ]);
    }

    public function edit(Plant $plant): Response
    {
        return Inertia::render('admin/plants/edit', [
            'plant' => $plant,
        ]);
    }

    public function update(PlantRequest $request, Plant $plant): RedirectResponse|JsonResponse
    {
        $plant->update($request->validated());
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Plant updated successfully.',
                'data' => $plant
            ]);
        }

        return redirect()->route('admin.plants.index')
            ->with('success', 'Plant updated successfully.');
    }

    public function destroy(Plant $plant, Request $request): RedirectResponse|JsonResponse
    {
        $plant->delete();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Plant deleted successfully.'
            ]);
        }

        return redirect()->route('admin.plants.index')
            ->with('success', 'Plant deleted successfully.');
    }
}
