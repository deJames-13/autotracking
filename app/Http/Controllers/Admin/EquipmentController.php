<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EquipmentRequest;
use App\Models\Equipment;
use App\Models\User;
use App\Models\Plant;
use App\Models\Department;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        // Get initial data for the page
        $equipments = Equipment::with(['user.role', 'user.department', 'plant', 'department', 'location'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('recall_number', 'like', "%{$search}%")
                      ->orWhere('serial_number', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('manufacturer', 'like', "%{$search}%");
                });
            })
            ->when($request->employee_id !== null, function ($query) use ($request) {
                if ($request->employee_id === 'unassigned') {
                    $query->whereNull('employee_id');
                } elseif ($request->employee_id !== '') {
                    $query->where('employee_id', $request->employee_id);
                }
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->plant_id, function ($query, $plantId) {
                $query->where('plant_id', $plantId);
            })
            ->when($request->department_id, function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->when($request->manufacturer, function ($query, $manufacturer) {
                $query->where('manufacturer', 'like', "%{$manufacturer}%");
            })
            ->when($request->limit, function ($query, $limit) {
                $query->limit($limit);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->limit ?? 15)
            ->withQueryString();

        $users = User::with(['role', 'department'])
            ->orderBy('first_name')
            ->get();

        $plants = Plant::orderBy('plant_name')->get();
        $departments = Department::orderBy('department_name')->get();
        $locations = Location::with('department')->orderBy('location_name')->get();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $equipments,
                'users' => $users,
                'plants' => $plants,
                'departments' => $departments,
                'locations' => $locations,
            ]);
        }

        return Inertia::render('admin/equipment/index', [
            'equipment' => $equipments,
            'users' => $users,
            'plants' => $plants,
            'departments' => $departments,
            'locations' => $locations,
            'filters' => $request->only(['search', 'employee_id', 'manufacturer', 'status', 'plant_id', 'department_id']),
        ]);
    }

    public function create(): Response
    {
        $users = User::with(['role', 'department'])
            ->orderBy('first_name')
            ->get();

        $plants = Plant::orderBy('plant_name')->get();
        $departments = Department::orderBy('department_name')->get();
        $locations = Location::with('department')->orderBy('location_name')->get();

        return Inertia::render('admin/equipment/create', [
            'users' => $users,
            'plants' => $plants,
            'departments' => $departments,
            'locations' => $locations,
        ]);
    }

    public function store(EquipmentRequest $request): RedirectResponse
    {
        Equipment::create($request->validated());

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Equipment created successfully.');
    }

    public function show(Equipment $equipment, Request $request): Response|JsonResponse
    {
        $equipment->load(['user.role', 'user.department', 'plant', 'department', 'location', 'trackIncoming']);
        
        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $equipment
            ]);
        }
        
        return Inertia::render('admin/equipment/show', [
            'equipment' => $equipment,
        ]);
    }

    public function edit(Equipment $equipment): Response
    {
        $users = User::with(['role', 'department'])
            ->orderBy('first_name')
            ->get();

        $plants = Plant::orderBy('plant_name')->get();
        $departments = Department::orderBy('department_name')->get();
        $locations = Location::with('department')->orderBy('location_name')->get();

        return Inertia::render('admin/equipment/edit', [
            'equipment' => $equipment,
            'users' => $users,
            'plants' => $plants,
            'departments' => $departments,
            'locations' => $locations,
        ]);
    }

    public function update(EquipmentRequest $request, Equipment $equipment): RedirectResponse
    {
        $equipment->update($request->validated());

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Equipment updated successfully.');
    }

    public function destroy(Equipment $equipment): RedirectResponse
    {
        $equipment->delete();

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Equipment deleted successfully.');
    }
}
