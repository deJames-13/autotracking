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
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with(['role', 'department'])
            ->orderBy('first_name')
            ->get();

        $plants = Plant::orderBy('plant_name')->get();
        $departments = Department::orderBy('department_name')->get();
        $locations = Location::with('department')->orderBy('location_name')->get();

        return Inertia::render('admin/equipment/index', [
            'users' => $users,
            'plants' => $plants,
            'departments' => $departments,
            'locations' => $locations,
        ]);
    }

    public function tableData(Request $request): JsonResponse
    {
        $filters = ['search', 'employee_id', 'manufacturer', 'status', 'plant_id', 'department_id'];
        
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
                } elseif ($request->employee_id !== '' && $request->employee_id !== 'all') {
                    $query->where('employee_id', $request->employee_id);
                }
            })
            ->when($request->status && $request->status !== 'all', function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->plant_id && $request->plant_id !== 'all', function ($query, $plantId) {
                $query->where('plant_id', $plantId);
            })
            ->when($request->department_id && $request->department_id !== 'all', function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->when($request->manufacturer, function ($query, $manufacturer) {
                $query->where('manufacturer', 'like', "%{$manufacturer}%");
            })
            ->when($request->sort_by, function ($query, $sortBy) {
                $direction = $request->sort_direction === 'desc' ? 'desc' : 'asc';
                
                if (in_array($sortBy, ['equipment_id', 'recall_number', 'serial_number', 'description', 'manufacturer', 'status', 'created_at'])) {
                    $query->orderBy($sortBy, $direction);
                } elseif ($sortBy === 'user_name') {
                    $query->leftJoin('users', 'equipment.employee_id', '=', 'users.employee_id')
                          ->orderBy('users.first_name', $direction)
                          ->orderBy('users.last_name', $direction)
                          ->select('equipment.*');
                } elseif ($sortBy === 'plant_name') {
                    $query->leftJoin('plants', 'equipment.plant_id', '=', 'plants.plant_id')
                          ->orderBy('plants.plant_name', $direction)
                          ->select('equipment.*');
                } elseif ($sortBy === 'department_name') {
                    $query->leftJoin('departments', 'equipment.department_id', '=', 'departments.department_id')
                          ->orderBy('departments.department_name', $direction)
                          ->select('equipment.*');
                }
            }, function ($query) {
                $query->orderBy('created_at', 'desc');
            })
            ->paginate($request->per_page ?? 15)
            ->withQueryString();

        return response()->json([
            'data' => $equipments->items(),
            'meta' => [
                'current_page' => $equipments->currentPage(),
                'last_page' => $equipments->lastPage(),
                'per_page' => $equipments->perPage(),
                'total' => $equipments->total(),
                'from' => $equipments->firstItem(),
                'to' => $equipments->lastItem(),
            ],
            'filters' => $request->only($filters),
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

    public function destroy(Equipment $equipment, Request $request): RedirectResponse|JsonResponse
    {
        // Check for foreign key constraints before deletion
        $trackIncomingCount = $equipment->trackIncoming()->count();

        if ($trackIncomingCount > 0) {
            $errorMessage = "Cannot archive equipment. It has {$trackIncomingCount} tracking record(s) associated with it.";

            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'equipment' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 422);
            }

            return redirect()->route('admin.equipment.index')
                ->with('error', $errorMessage);
        }

        $equipment->delete(); // This is now a soft delete due to SoftDeletes trait

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Equipment archived successfully.'
            ]);
        }

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Equipment archived successfully.');
    }

    /**
     * Restore a soft deleted equipment
     */
    public function restore($id, Request $request): RedirectResponse|JsonResponse
    {
        $equipment = Equipment::onlyTrashed()->where('equipment_id', $id)->first();
        
        if (!$equipment) {
            $errorMessage = 'Archived equipment not found.';
            
            // For Inertia requests, throw validation exception
            if ($request->header('X-Inertia')) {
                throw ValidationException::withMessages([
                    'equipment' => $errorMessage
                ]);
            }

            // Return JSON only for non-Inertia AJAX requests
            if ($request->ajax()) {
                return response()->json([
                    'message' => $errorMessage
                ], 404);
            }

            return redirect()->route('admin.equipment.index')
                ->with('error', $errorMessage);
        }

        $equipment->restore();

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'message' => 'Equipment restored successfully.'
            ]);
        }

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Equipment restored successfully.');
    }

    /**
     * Get archived equipment for display
     */
    public function archived(Request $request): Response|JsonResponse
    {
        $equipment = Equipment::onlyTrashed()
            ->with(['department', 'location', 'user'])
            ->orderBy('deleted_at', 'desc')
            ->paginate(10);

        // Return JSON only for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'data' => $equipment
            ]);
        }

        return Inertia::render('admin/equipment/archived', [
            'equipment' => $equipment,
        ]);
    }
}
