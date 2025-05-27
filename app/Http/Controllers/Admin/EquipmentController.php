<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentController extends Controller
{
    public function index(Request $request): Response
    {
        // Get initial data for the page
        $equipments = Equipment::with(['user.role', 'user.department'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('serial_number', 'like', "%{$search}%")
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
            ->when($request->manufacturer, function ($query, $manufacturer) {
                $query->where('manufacturer', 'like', "%{$manufacturer}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $users = User::with(['role', 'department'])
            ->orderBy('first_name')
            ->get();

        return Inertia::render('admin/equipment/index', [
            'equipment' => $equipments,
            'users' => $users,
            'filters' => $request->only(['search', 'employee_id', 'manufacturer']),
        ]);
    }
}
