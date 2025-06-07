<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics for employees.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = Auth::user();
        $user->load('role', 'department');
        
        // Check if user is employee
        if ($user->role->role_name !== 'employee') {
            abort(403, 'Access denied. Employee access only.');
        }

        // Get current user's submitted requests
        $mySubmittedRequests = TrackIncoming::where('employee_id_in', $user->employee_id)->count();
        
        // Get pending requests (awaiting confirmation or calibration)
        $myPendingRequests = TrackIncoming::where('employee_id_in', $user->employee_id)
            ->whereIn('status', ['for_confirmation', 'pending_calibration'])
            ->count();
        
        // Get completed requests (ready for pickup or already picked up)
        $myCompletedRequests = TrackIncoming::where('employee_id_in', $user->employee_id)
            ->whereHas('trackOutgoing', function($q) {
                $q->whereIn('status', ['for_pickup', 'completed']);
            })
            ->count();
        
        // Get equipment ready for pickup (from same department)
        $equipmentReadyForPickup = TrackOutgoing::where('status', 'for_pickup')
            ->whereHas('trackIncoming.employeeIn', function($q) use ($user) {
                $q->where('department_id', $user->department_id);
            })
            ->count();
        
        // Get overdue equipment (my requests that are overdue)
        $myOverdueEquipment = TrackIncoming::where('employee_id_in', $user->employee_id)
            ->where('due_date', '<', now())
            ->where('status', '!=', 'completed')
            ->count();
        
        // Get recent activity (last 7 days of my requests)
        $recentActivity = TrackIncoming::where('employee_id_in', $user->employee_id)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $stats = [
            'submitted_requests' => $mySubmittedRequests,
            'pending_requests' => $myPendingRequests,
            'completed_requests' => $myCompletedRequests,
            'ready_for_pickup' => $equipmentReadyForPickup,
            'overdue_equipment' => $myOverdueEquipment,
            'recent_activity' => $recentActivity,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get recent activities for employee dashboard.
     */
    public function recentActivities(Request $request): JsonResponse
    {
        $user = Auth::user();
        $user->load('role', 'department');
        
        // Check if user is employee
        if ($user->role->role_name !== 'employee') {
            abort(403, 'Access denied. Employee access only.');
        }

        $limit = $request->get('limit', 10);

        // Get recent activities for the employee
        $activities = TrackIncoming::with(['equipment', 'technician', 'trackOutgoing'])
            ->where('employee_id_in', $user->employee_id)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($record) {
                $equipment = $record->equipment ? $record->equipment->recall_number : ($record->recall_number ?? 'Unknown Equipment');
                $status = $record->status;
                
                if ($record->trackOutgoing) {
                    $status = $record->trackOutgoing->status;
                }
                
                $description = match($status) {
                    'for_confirmation' => "Equipment {$equipment} awaiting confirmation",
                    'pending_calibration' => "Equipment {$equipment} sent for calibration",
                    'for_pickup' => "Equipment {$equipment} ready for pickup",
                    'completed' => "Equipment {$equipment} pickup completed",
                    default => "Equipment {$equipment} status: {$status}"
                };
                
                return [
                    'id' => $record->id,
                    'type' => 'tracking',
                    'description' => $description,
                    'status' => $status,
                    'technician' => $record->technician ? 
                        "{$record->technician->first_name} {$record->technician->last_name}" : 
                        'Not assigned',
                    'created_at' => $record->created_at,
                    'updated_at' => $record->updated_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $activities
        ]);
    }

    /**
     * Get calendar data for employee dashboard.
     */
    public function calendarData(Request $request): JsonResponse
    {
        $user = Auth::user();
        $user->load('role', 'department');
        
        // Check if user is employee
        if ($user->role->role_name !== 'employee') {
            abort(403, 'Access denied. Employee access only.');
        }

        $startDate = $request->get('start', now()->startOfMonth());
        $endDate = $request->get('end', now()->endOfMonth());

        // Get calendar events for the employee
        $events = [];

        // Due dates for my equipment
        $dueDates = TrackIncoming::where('employee_id_in', $user->employee_id)
            ->whereBetween('due_date', [$startDate, $endDate])
            ->get()
            ->map(function ($record) {
                $equipment = $record->equipment ? $record->equipment->recall_number : ($record->recall_number ?? 'Equipment');
                return [
                    'id' => $record->id,
                    'title' => "Due: {$equipment}",
                    'date' => $record->due_date->format('Y-m-d'),
                    'type' => 'due_date',
                    'status' => $record->status,
                ];
            });

        // Ready for pickup dates
        $pickupDates = TrackOutgoing::where('status', 'for_pickup')
            ->whereHas('trackIncoming.employeeIn', function($q) use ($user) {
                $q->where('department_id', $user->department_id);
            })
            ->whereBetween('date_out', [$startDate, $endDate])
            ->with(['trackIncoming.equipment'])
            ->get()
            ->map(function ($record) {
                $equipment = $record->trackIncoming->equipment ? 
                    $record->trackIncoming->equipment->recall_number : 
                    ($record->trackIncoming->recall_number ?? 'Equipment');
                return [
                    'id' => $record->id,
                    'title' => "Ready: {$equipment}",
                    'date' => $record->date_out->format('Y-m-d'),
                    'type' => 'ready_pickup',
                    'status' => $record->status,
                ];
            });

        $events = array_merge($dueDates->toArray(), $pickupDates->toArray());

        return response()->json([
            'success' => true,
            'data' => $events
        ]);
    }

    /**
     * Get equipment status breakdown for employee.
     */
    public function equipmentStatus(Request $request): JsonResponse
    {
        $user = Auth::user();
        $user->load('role', 'department');
        
        // Check if user is employee
        if ($user->role->role_name !== 'employee') {
            abort(403, 'Access denied. Employee access only.');
        }

        // Get status breakdown for employee's equipment
        $statusBreakdown = TrackIncoming::where('employee_id_in', $user->employee_id)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Add outgoing status breakdown
        $outgoingBreakdown = TrackOutgoing::whereHas('trackIncoming', function($q) use ($user) {
                $q->where('employee_id_in', $user->employee_id);
            })
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Merge and format status data
        $statusData = [
            'for_confirmation' => $statusBreakdown['for_confirmation'] ?? 0,
            'pending_calibration' => $statusBreakdown['pending_calibration'] ?? 0,
            'for_pickup' => $outgoingBreakdown['for_pickup'] ?? 0,
            'completed' => $outgoingBreakdown['completed'] ?? 0,
        ];

        return response()->json([
            'success' => true,
            'data' => $statusData
        ]);
    }
}
