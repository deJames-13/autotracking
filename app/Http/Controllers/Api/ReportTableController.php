<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\TrackingReportExport;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportTableController extends Controller
{
    /**
     * Get paginated tracking reports with combined incoming and outgoing data
     */
    public function index(Request $request): JsonResponse
    {
        $query = TrackIncoming::with([
            'equipment', 
            'technician', 
            'location', 
            'employeeIn', 
            'trackOutgoing.employeeOut'
        ]);

        // Apply search filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function($eq) use ($search) {
                      $eq->where('serial_number', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('manufacturer', 'like', "%{$search}%");
                  });
            });
        }

        // Apply filters - handle both old and new parameter names
        if ($request->filled('equipment_name') || $request->filled('equipment_filter')) {
            $equipmentName = $request->get('equipment_name') ?: $request->get('equipment_filter');
            $query->whereHas('equipment', function($eq) use ($equipmentName) {
                $eq->where('description', 'like', '%' . $equipmentName . '%');
            });
        }

        if ($request->filled('recall_number') || $request->filled('recall_filter')) {
            $recallNumber = $request->get('recall_number') ?: $request->get('recall_filter');
            $query->where('recall_number', 'like', '%' . $recallNumber . '%');
        }

        if ($request->filled('status') || $request->filled('status_filter')) {
            $status = $request->get('status') ?: $request->get('status_filter');
            $query->where('status', $status);
        }

        if ($request->filled('technician_id') || $request->filled('technician_filter')) {
            $technicianId = $request->get('technician_id') ?: $request->get('technician_filter');
            $query->where('technician_id', $technicianId);
        }

        if ($request->filled('location_id') || $request->filled('location_filter')) {
            $locationId = $request->get('location_id') ?: $request->get('location_filter');
            $query->where('location_id', $locationId);
        }

        // Date range filters
        if ($request->filled('date_from')) {
            $query->where('date_in', '>=', $request->get('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('date_in', '<=', $request->get('date_to') . ' 23:59:59');
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'date_in');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortBy, $sortDirection);

        $perPage = $request->get('per_page', 15);
        $reports = $query->paginate($perPage);

        // Transform the data for the frontend
        $transformedData = $reports->through(function ($record) {
            return [
                'id' => $record->id,
                'recall_number' => $record->recall_number,
                'equipment_description' => $record->equipment ? $record->equipment->description : $record->description,
                'equipment_serial' => $record->equipment ? $record->equipment->serial_number : $record->serial_number,
                'equipment_model' => $record->equipment ? $record->equipment->model : $record->model,
                'equipment_manufacturer' => $record->equipment ? $record->equipment->manufacturer : $record->manufacturer,
                'status' => $record->status,
                'date_in' => $record->date_in?->format('Y-m-d H:i:s'),
                'due_date' => $record->due_date?->format('Y-m-d'),
                'technician' => $record->technician ? [
                    'employee_id' => $record->technician->employee_id,
                    'name' => $record->technician->first_name . ' ' . $record->technician->last_name,
                ] : null,
                'location' => $record->location ? [
                    'location_id' => $record->location->location_id,
                    'name' => $record->location->location_name,
                ] : null,
                'employee_in' => $record->employeeIn ? [
                    'employee_id' => $record->employeeIn->employee_id,
                    'name' => $record->employeeIn->first_name . ' ' . $record->employeeIn->last_name,
                ] : null,
                'outgoing' => $record->trackOutgoing ? [
                    'id' => $record->trackOutgoing->id,
                    'date_out' => $record->trackOutgoing->date_out?->format('Y-m-d H:i:s'),
                    'cal_date' => $record->trackOutgoing->cal_date?->format('Y-m-d'),
                    'cal_due_date' => $record->trackOutgoing->cal_due_date?->format('Y-m-d'),
                    'cycle_time' => $record->trackOutgoing->cycle_time,
                    'employee_out' => $record->trackOutgoing->employeeOut ? [
                        'employee_id' => $record->trackOutgoing->employeeOut->employee_id,
                        'name' => $record->trackOutgoing->employeeOut->first_name . ' ' . $record->trackOutgoing->employeeOut->last_name,
                    ] : null,
                ] : null,
                'tracking_record' => $record, // Full record for detailed views
            ];
        });

        return response()->json([
            'data' => $transformedData->items(),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
                'from' => $reports->firstItem(),
                'to' => $reports->lastItem(),
            ],
        ]);
    }

    /**
     * Get filter options for dropdowns
     */
    public function filterOptions(): JsonResponse
    {
        $technicians = \App\Models\User::whereHas('trackIncomingAsTechnician')
            ->select('employee_id', 'first_name', 'last_name')
            ->get()
            ->map(function($user) {
                return [
                    'value' => $user->employee_id,
                    'label' => $user->first_name . ' ' . $user->last_name
                ];
            });

        $locations = \App\Models\Location::whereHas('trackIncoming')
            ->select('location_id', 'location_name')
            ->get()
            ->map(function($location) {
                return [
                    'value' => $location->location_id,
                    'label' => $location->location_name
                ];
            });

        $statuses = [
            ['value' => 'pending_calibration', 'label' => 'Pending Calibration'],
            ['value' => 'completed', 'label' => 'Completed'],
        ];

        return response()->json([
            'technicians' => $technicians,
            'locations' => $locations,
            'statuses' => $statuses,
        ]);
    }

    /**
     * Export tracking reports
     */
    public function export(Request $request, string $format)
    {
        $filters = $request->all();
        
        switch ($format) {
            case 'xlsx':
                return $this->exportExcel($filters);
            case 'csv':
                return $this->exportCsv($filters);
            case 'pdf':
                return $this->exportPdf($filters);
            default:
                return response()->json(['error' => 'Invalid export format'], 400);
        }
    }

    /**
     * Export to Excel
     */
    private function exportExcel(array $filters)
    {
        return Excel::download(new TrackingReportExport($filters), 'tracking_reports_' . date('Y_m_d') . '.xlsx');
    }

    /**
     * Export to CSV
     */
    private function exportCsv(array $filters)
    {
        return Excel::download(new TrackingReportExport($filters), 'tracking_reports_' . date('Y_m_d') . '.csv', \Maatwebsite\Excel\Excel::CSV);
    }

    /**
     * Export to PDF
     */
    private function exportPdf(array $filters)
    {
        // Use Laravel Excel with DOMPDF for PDF generation
        $export = new TrackingReportExport($filters, 'pdf');
        
        // Generate the PDF content
        $pdf = Excel::raw($export, \Maatwebsite\Excel\Excel::DOMPDF);
        
        // Stream the PDF for inline viewing (preview mode)
        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="tracking_reports_' . date('Y_m_d') . '.pdf"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0'
        ]);
    }

    /**
     * Apply filters to query (reusable method)
     */
    private function applyFilters($query, array $filters)
    {
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('recall_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function($eq) use ($search) {
                      $eq->where('serial_number', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('manufacturer', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['equipment_name']) || !empty($filters['equipment_filter'])) {
            $equipmentName = $filters['equipment_name'] ?? $filters['equipment_filter'];
            $query->whereHas('equipment', function($eq) use ($equipmentName) {
                $eq->where('description', 'like', '%' . $equipmentName . '%');
            });
        }

        if (!empty($filters['recall_number']) || !empty($filters['recall_filter'])) {
            $recallNumber = $filters['recall_number'] ?? $filters['recall_filter'];
            $query->where('recall_number', 'like', '%' . $recallNumber . '%');
        }

        if (!empty($filters['status']) || !empty($filters['status_filter'])) {
            $status = $filters['status'] ?? $filters['status_filter'];
            $query->where('status', $status);
        }

        if (!empty($filters['technician_id']) || !empty($filters['technician_filter'])) {
            $technicianId = $filters['technician_id'] ?? $filters['technician_filter'];
            $query->where('technician_id', $technicianId);
        }

        if (!empty($filters['location_id']) || !empty($filters['location_filter'])) {
            $locationId = $filters['location_id'] ?? $filters['location_filter'];
            $query->where('location_id', $locationId);
        }

        if (!empty($filters['date_from'])) {
            $query->where('date_in', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('date_in', '<=', $filters['date_to'] . ' 23:59:59');
        }
    }

    /**
     * Get detailed view of a tracking record for modals
     */
    public function show(TrackIncoming $trackIncoming): JsonResponse
    {
        $trackIncoming->load([
            'equipment', 
            'technician', 
            'location', 
            'employeeIn', 
            'trackOutgoing.employeeOut'
        ]);

        return response()->json(['data' => $trackIncoming]);
    }

    /**
     * Download individual tracking record report
     */
    public function downloadRecord(TrackIncoming $trackIncoming)
    {
        $trackIncoming->load([
            'equipment', 
            'technician', 
            'location', 
            'employeeIn', 
            'trackOutgoing.employeeOut'
        ]);

        $pdf = Pdf::loadView('pdf.tracking-record', ['trackingRecord' => $trackIncoming]);
        
        return $pdf->download("tracking-record-{$trackIncoming->recall_number}.pdf");
    }
}
