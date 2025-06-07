<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
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
        
        // Check if user is admin, personnel_in_charge, or technician
        if (!in_array($user->role?->role_name, ['admin', 'personnel_in_charge', 'technician'])) {
            abort(403, 'Access denied.');
        }

        // Role-based query filtering
        $baseTrackIncomingQuery = TrackIncoming::query();
        $baseEquipmentQuery = Equipment::query();
        
        if ($user->role->role_name === 'technician') {
            // Technicians can only see their own records
            $baseTrackIncomingQuery->where(function($q) use ($user) {
                $q->where('technician_id', $user->employee_id)
                  ->orWhere('received_by_id', $user->employee_id);
            });
        }

        // Get dashboard statistics
        $stats = [
            'total_equipment' => $user->role->role_name === 'technician' ? 
                $baseEquipmentQuery->count() : Equipment::count(),
            'active_requests' => (clone $baseTrackIncomingQuery)->where('status', '!=', 'completed')->count(),
            'equipment_tracked' => (clone $baseTrackIncomingQuery)->count(),
            'total_users' => $user->role->role_name === 'admin' ? User::count() : 0,
            'overdue_equipment' => (clone $baseTrackIncomingQuery)
                ->where('due_date', '<', now())
                ->where('status', '!=', 'completed')
                ->count(),
            'recent_updates' => (clone $baseTrackIncomingQuery)->where('created_at', '>=', now()->subDays(7))->count(),
        ];

        // Get recent activities (role-based filtering)
        $recentActivitiesQuery = (clone $baseTrackIncomingQuery)
            ->with(['equipment', 'employeeIn', 'technician'])
            ->latest()
            ->limit(10);

        $recentActivities = $recentActivitiesQuery->get()
            ->map(function ($record) {
                $equipment = $record->equipment ? $record->equipment->recall_number : 'Unknown Equipment';
                
                return [
                    'id' => $record->id,
                    'type' => 'tracking',
                    'description' => "Equipment {$equipment} received for calibration",
                    'user' => $record->employeeIn ? 
                        "{$record->employeeIn->first_name} {$record->employeeIn->last_name}" : 
                        'Unknown',
                    'created_at' => $record->created_at,
                ];
            });

        // Get pending tracking requests (role-based filtering)
        $pendingRequestsQuery = (clone $baseTrackIncomingQuery)
            ->with(['equipment', 'employeeIn', 'technician'])
            ->where('status', '!=', 'completed')
            ->latest()
            ->limit(5);

        $pendingRequests = $pendingRequestsQuery->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'equipment' => [
                        'recall_number' => $record->equipment?->recall_number ?? 'Unknown'
                    ],
                    'requested_by' => [
                        'first_name' => $record->employeeIn?->first_name ?? 'Unknown',
                        'last_name' => $record->employeeIn?->last_name ?? ''
                    ],
                    'technician' => [
                        'first_name' => $record->technician?->first_name ?? 'Unknown',
                        'last_name' => $record->technician?->last_name ?? ''
                    ],
                    'status' => $record->status,
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
