<?php

namespace App\Http\Controllers\Api\Technician;

use App\Http\Controllers\Controller;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics for the authenticated technician.
     */
    public function getStats(): JsonResponse
    {
        $technicianId = Auth::user()->employee_id;
        
        // Get incoming equipment stats
        $incomingStats = TrackIncoming::where('technician_id', $technicianId)
            ->select([
                DB::raw('COUNT(CASE WHEN status = "pending_calibration" THEN 1 END) as pending_calibration'),
                DB::raw('COUNT(CASE WHEN status = "in_calibration" THEN 1 END) as in_calibration'),
                DB::raw('COUNT(CASE WHEN status = "for_release" THEN 1 END) as for_release'),
                DB::raw('COUNT(CASE WHEN status = "for_confirmation" THEN 1 END) as for_confirmation'),
                DB::raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed'),
                DB::raw('COUNT(*) as total')
            ])
            ->first();

        // Get outgoing equipment stats
        $outgoingStats = TrackOutgoing::where('technician_id', $technicianId)
            ->select([
                DB::raw('COUNT(CASE WHEN status = "for_pickup" THEN 1 END) as for_pickup'),
                DB::raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed'),
                DB::raw('COUNT(*) as total')
            ])
            ->first();

        // Get today's completed equipment
        $todayCompleted = TrackOutgoing::where('technician_id', $technicianId)
            ->where('status', 'completed')
            ->whereDate('updated_at', today())
            ->count();

        // Get yesterday's completed equipment for comparison
        $yesterdayCompleted = TrackOutgoing::where('technician_id', $technicianId)
            ->where('status', 'completed')
            ->whereDate('updated_at', today()->subDay())
            ->count();

        // Get overdue equipment
        $overdueEquipment = TrackIncoming::where('technician_id', $technicianId)
            ->where('due_date', '<', now())
            ->whereIn('status', ['pending_calibration', 'in_calibration'])
            ->count();

        // Get equipment due soon (within 7 days)
        $dueSoonEquipment = TrackIncoming::where('technician_id', $technicianId)
            ->whereBetween('due_date', [now(), now()->addDays(7)])
            ->whereIn('status', ['pending_calibration', 'in_calibration'])
            ->count();

        // Calculate percentage changes
        $completedChange = $yesterdayCompleted > 0 
            ? (($todayCompleted - $yesterdayCompleted) / $yesterdayCompleted) * 100 
            : ($todayCompleted > 0 ? 100 : 0);

        // Get recent activity (last 5 records)
        $recentActivity = TrackIncoming::where('technician_id', $technicianId)
            ->with(['equipment', 'employeeIn'])
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'recall_number' => $item->recall_number,
                    'description' => $item->description,
                    'status' => $item->status,
                    'updated_at' => $item->updated_at,
                    'employee_name' => $item->employeeIn->name ?? 'Unknown'
                ];
            });

        return response()->json([
            'incoming' => [
                'pending_calibration' => (int) $incomingStats->pending_calibration,
                'in_calibration' => (int) $incomingStats->in_calibration,
                'for_release' => (int) $incomingStats->for_release,
                'for_confirmation' => (int) $incomingStats->for_confirmation,
                'completed' => (int) $incomingStats->completed,
                'total' => (int) $incomingStats->total
            ],
            'outgoing' => [
                'for_pickup' => (int) $outgoingStats->for_pickup,
                'completed' => (int) $outgoingStats->completed,
                'total' => (int) $outgoingStats->total
            ],
            'overview' => [
                'today_completed' => $todayCompleted,
                'yesterday_completed' => $yesterdayCompleted,
                'completed_change' => round($completedChange, 1),
                'overdue_equipment' => $overdueEquipment,
                'due_soon_equipment' => $dueSoonEquipment
            ],
            'recent_activity' => $recentActivity
        ]);
    }

    /**
     * Get calendar data for upcoming due dates.
     */
    public function getCalendarData(Request $request): JsonResponse
    {
        $technicianId = Auth::user()->employee_id;
        $startDate = $request->get('start_date', now()->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());

        $calendarData = TrackIncoming::where('technician_id', $technicianId)
            ->whereBetween('due_date', [$startDate, $endDate])
            ->whereIn('status', ['pending_calibration', 'in_calibration', 'for_release'])
            ->with(['equipment', 'employeeIn'])
            ->get()
            ->map(function ($item) {
                $isOverdue = $item->due_date < now();
                $daysUntilDue = now()->diffInDays($item->due_date, false);
                
                return [
                    'id' => $item->id,
                    'title' => $item->description,
                    'recall_number' => $item->recall_number,
                    'due_date' => $item->due_date,
                    'status' => $item->status,
                    'is_overdue' => $isOverdue,
                    'days_until_due' => $daysUntilDue,
                    'employee_name' => $item->employeeIn->name ?? 'Unknown',
                    'priority' => $isOverdue ? 'high' : ($daysUntilDue <= 3 ? 'medium' : 'low')
                ];
            });

        return response()->json([
            'calendar_data' => $calendarData
        ]);
    }
}
