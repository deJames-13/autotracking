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
}
