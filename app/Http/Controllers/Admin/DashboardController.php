<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\TrackingRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the admin dashboard.
     */
    public function index(Request $request): Response
    {
        // Check if user has admin access
        $user = $request->user();
        if (!$user || !in_array($user->role?->role_name, ['admin', 'personnel_in_charge'])) {
            abort(403, 'Access denied. Admin privileges required.');
        }

        // Get dashboard statistics
        $stats = [
            'total_users' => User::count(),
            'total_equipment' => Equipment::count(),
            'active_tracking' => TrackingRecord::whereNull('date_out')->count(),
            'overdue_tracking' => TrackingRecord::where('cal_due_date', '<', now())
                ->whereNull('date_out')
                ->count(),
        ];

        // Get recent activities
        $recentTracking = TrackingRecord::with(['equipment', 'technician', 'location'])
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recentTracking' => $recentTracking,
        ]);
    }
}
