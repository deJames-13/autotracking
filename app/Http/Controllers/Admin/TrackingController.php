<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TrackingRecord;
use App\Models\Equipment;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TrackingController extends Controller
{
    /**
     * Display the tracking index page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        return Inertia::render('admin/tracking/index');
    }

    /**
     * Display the tracking request index page.
     *
     * @return \Inertia\Response
     */
    public function requestIndex()
    {
        return Inertia::render('admin/tracking/request/index');
    }

    /**
     * Display a specific tracking request.
     *
     * @param int $id
     * @return \Inertia\Response
     */
    public function requestShow($id)
    {
        return Inertia::render('admin/tracking/request/detail-tab');
    }

    /**
     * Search tracking records for employee requests
     */
    public function searchTrackingRecords(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = TrackingRecord::with(['equipment', 'technician', 'employeeOut'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('recall', 'like', "%{$search}%")
                          ->orWhere('description', 'like', "%{$search}%")
                          ->orWhereHas('equipment', function ($eq) use ($search) {
                              $eq->where('recall_number', 'like', "%{$search}%")
                                ->orWhere('description', 'like', "%{$search}%")
                                ->orWhere('serial_number', 'like', "%{$search}%");
                          });
                });
            });

        // Filter by department if user has department restriction
        if ($request->department_id) {
            $query->whereHas('equipment', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        } elseif ($user->department_id) {
            // If no specific department requested, default to user's department
            $query->whereHas('equipment', function ($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        }

        $trackingRecords = $query->latest()
            ->limit($request->limit ?? 10)
            ->get()
            ->map(function ($record) {
                return [
                    'tracking_id' => $record->tracking_id,
                    'recall' => $record->recall,
                    'description' => $record->description,
                    'created_at' => $record->created_at,
                    'equipment' => $record->equipment ? [
                        'equipment_id' => $record->equipment->equipment_id,
                        'recall_number' => $record->equipment->recall_number,
                        'description' => $record->equipment->description,
                        'serial_number' => $record->equipment->serial_number,
                        'model' => $record->equipment->model,
                        'manufacturer' => $record->equipment->manufacturer,
                    ] : null,
                    'technician' => $record->technician ? [
                        'employee_id' => $record->technician->employee_id,
                        'first_name' => $record->technician->first_name,
                        'last_name' => $record->technician->last_name,
                    ] : null,
                ];
            });

        return response()->json([
            'data' => $trackingRecords,
            'total' => $trackingRecords->count(),
        ]);
    }

    /**
     * Store a new tracking request.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        // TODO: Implement the store method for tracking requests
        // This will be implemented in a future update
    }

    /**
     * Generate a unique recall number for tracking requests
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateUniqueRecall(): JsonResponse
    {
        try {
            $recallNumber = TrackingRecord::generateUniqueRecallNumber();
            
            return response()->json([
                'success' => true,
                'recall_number' => $recallNumber
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error generating unique recall number: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate recall number. Please try again.'
            ], 500);
        }
    }

    /**
     * Confirm employee PIN for tracking request
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function confirmRequestPin(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|numeric',
            'pin' => 'required|string|min:4',
        ]);

        try {
            // Find the employee by employee_id
            $employee = User::where('employee_id', $request->employee_id)->first();

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found.'
                ], 404);
            }

            // Check if employee has a PIN set - using password field as PIN
            if (!$employee->password) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee PIN is not set. Please contact administrator.'
                ], 400);
            }

            // Verify the PIN - assuming PIN is stored in password field
            if (!Hash::check($request->pin, $employee->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid PIN. Please try again.'
                ], 401);
            }

            // PIN is correct
            return response()->json([
                'success' => true,
                'message' => 'PIN confirmed successfully.',
                'employee' => [
                    'employee_id' => $employee->employee_id,
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'department' => $employee->department ? [
                        'department_id' => $employee->department->department_id,
                        'department_name' => $employee->department->department_name,
                    ] : null,
                    'plant' => $employee->plant ? [
                        'plant_id' => $employee->plant->plant_id,
                        'plant_name' => $employee->plant->plant_name,
                    ] : null,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error confirming request PIN: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while confirming PIN. Please try again.'
            ], 500);
        }
    }
}
