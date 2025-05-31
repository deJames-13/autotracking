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
        
        // Check if user is admin or personnel_in_charge
        if (!in_array($user->role?->role_name, ['admin', 'personnel_in_charge'])) {
            abort(403, 'Access denied.');
        }

        // Get dashboard statistics
        $stats = [
            'total_equipment' => Equipment::count(),
            'active_requests' => TrackIncoming::where('status', '!=', 'completed')->count(),
            'equipment_tracked' => TrackIncoming::count(),
            'total_users' => User::count(),
            'overdue_equipment' => TrackIncoming::where('due_date', '<', now())
                ->where('status', '!=', 'completed')
                ->count(),
            'recent_updates' => TrackIncoming::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        // Get recent activities
        $recentActivities = TrackIncoming::with(['equipment', 'employeeIn', 'technician'])
            ->latest()
            ->limit(10)
            ->get()
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

        // Get pending tracking requests (equipment in calibration but not ready for pickup)
        $pendingRequests = TrackIncoming::with(['equipment', 'employeeIn', 'technician'])
            ->where('status', '!=', 'completed')
            ->latest()
            ->limit(5)
            ->get()
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
