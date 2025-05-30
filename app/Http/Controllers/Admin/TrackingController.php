<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrackIncomingRequest;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
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
     * Display the track incoming index page for admin.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Inertia\Response
     */
    public function trackIncomingIndex(Request $request)
    {
        $query = TrackIncoming::with(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing']);

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function($eq) use ($search) {
                      $eq->where('serial_number', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $requests = $query->latest('created_at')->paginate(15);

        return Inertia::render('admin/tracking/incoming/index', [
            'requests' => $requests,
            'filters' => [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
            ]
        ]);
    }

    /**
     * Display a specific track incoming record.
     *
     * @param \App\Models\TrackIncoming $trackIncoming
     * @return \Inertia\Response
     */
    public function trackIncomingShow(TrackIncoming $trackIncoming)
    {
        $trackIncoming->load(['equipment', 'technician', 'location', 'employeeIn', 'trackOutgoing.employeeOut']);
        
        return Inertia::render('admin/tracking/incoming/show', [
            'trackIncoming' => $trackIncoming
        ]);
    }

    /**
     * Display the track outgoing index page for admin.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Inertia\Response
     */
    public function trackOutgoingIndex(Request $request)
    {
        $query = TrackOutgoing::with(['equipment', 'technician', 'employeeOut', 'trackIncoming']);

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function($eq) use ($search) {
                      $eq->where('serial_number', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $completions = $query->latest('created_at')->paginate(15);

        return Inertia::render('admin/tracking/outgoing/index', [
            'completions' => $completions,
            'filters' => [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
            ]
        ]);
    }

    /**
     * Display a specific track outgoing record.
     *
     * @param \App\Models\TrackOutgoing $trackOutgoing
     * @return \Inertia\Response
     */
    public function trackOutgoingShow(TrackOutgoing $trackOutgoing)
    {
        $trackOutgoing->load(['equipment', 'technician', 'location', 'employeeOut', 'trackIncoming.employeeIn']);
        
        return Inertia::render('admin/tracking/outgoing/show', [
            'trackOutgoing' => $trackOutgoing
        ]);
    }

    /**
     * View calibration certificate for a track outgoing record.
     *
     * @param \App\Models\TrackOutgoing $trackOutgoing
     * @return \Illuminate\Http\Response
     */
    public function viewCertificate(TrackOutgoing $trackOutgoing)
    {
        $trackOutgoing->load(['equipment', 'technician', 'location', 'employeeOut', 'trackIncoming.employeeIn']);
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.calibration-certificate', [
            'trackOutgoing' => $trackOutgoing
        ]);
        
        return $pdf->stream("calibration-certificate-{$trackOutgoing->recall_number}.pdf");
    }
}
