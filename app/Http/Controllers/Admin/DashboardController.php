<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\TrackingRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the admin dashboard.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user is admin or personnel_in_charge
        if (!in_array($user->role?->role_name, ['admin', 'personnel_in_charge'])) {
            abort(403, 'Access denied.');
        }

        // Get dashboard statistics
        $stats = [
            'total_equipment' => Equipment::count(),
            'active_requests' => TrackingRecord::whereNull('date_in')->count(),
            'equipment_tracked' => TrackingRecord::whereNull('date_in')->count(),
            'total_users' => User::count(),
            'overdue_equipment' => Equipment::where('next_calibration_due', '<', now())
                ->where('status', '!=', 'retired')
                ->count(),
            'recent_updates' => TrackingRecord::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        // Get recent activities
        $recentActivities = TrackingRecord::with(['equipment', 'employeeOut', 'technician'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($record) {
                $activityType = $record->date_in ? 'checked in' : 'checked out';
                $equipment = $record->equipment ? $record->equipment->recall_number : 'Unknown Equipment';
                
                return [
                    'id' => $record->tracking_id,
                    'type' => 'tracking',
                    'description' => "Equipment {$equipment} {$activityType}",
                    'user' => $record->employeeOut ? 
                        "{$record->employeeOut->first_name} {$record->employeeOut->last_name}" : 
                        ($record->employeeIn ? 
                            "{$record->employeeIn->first_name} {$record->employeeIn->last_name}" : 
                            'Unknown'),
                    'created_at' => $record->created_at,
                ];
            });

        // Get pending tracking requests (equipment checked out but not checked in)
        $pendingRequests = TrackingRecord::with(['equipment', 'employeeOut', 'technician'])
            ->whereNull('date_in')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->tracking_id,
                    'equipment' => [
                        'recall_number' => $record->equipment?->recall_number ?? 'Unknown'
                    ],
                    'requested_by' => [
                        'first_name' => $record->employeeOut?->first_name ?? 'Unknown',
                        'last_name' => $record->employeeOut?->last_name ?? ''
                    ],
                    'technician' => [
                        'first_name' => $record->technician?->first_name ?? 'Unknown',
                        'last_name' => $record->technician?->last_name ?? ''
                    ],
                    'status' => 'pending',
                    'created_at' => $record->created_at,
                ];
            });

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recentActivities' => $recentActivities,
            'pendingRequests' => $pendingRequests,
        ]);
    }
}
