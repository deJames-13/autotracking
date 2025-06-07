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
        if ($request->filled('recall_number') || $request->filled('recall_filter')) {
            $recallNumber = $request->get('recall_number') ?: $request->get('recall_filter');
            $query->where('recall_number', 'like', '%' . $recallNumber . '%');
        }

        if ($request->filled('status') || $request->filled('status_filter')) {
            $status = $request->get('status') ?: $request->get('status_filter');
            
            // Check if it's an incoming or outgoing status
            $incomingOnlyStatuses = ['for_confirmation', 'pending_calibration'];
            $outgoingStatuses = ['for_pickup', 'completed'];
            
            if (in_array($status, $incomingOnlyStatuses)) {
                // Filter by track_incoming status only
                $query->where('status', $status);
            } elseif (in_array($status, $outgoingStatuses)) {
                // Filter by track_outgoing status only
                $query->whereHas('trackOutgoing', function($outgoing) use ($status) {
                    $outgoing->where('status', $status);
                });
            }
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
            // Incoming-only statuses
            ['value' => 'for_confirmation', 'label' => 'For Confirmation'],
            ['value' => 'pending_calibration', 'label' => 'Pending Calibration'],
            // Outgoing-only statuses
            ['value' => 'for_pickup', 'label' => 'For Pickup'],
            ['value' => 'completed', 'label' => 'Completed'],
        ];

        return response()->json([
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
        $printAll = $request->boolean('print_all', false);
        
        // Log the export request details
        \Log::info('Export Request:', [
            'format' => $format,
            'filters' => $filters,
            'print_all' => $printAll,
            'request_url' => $request->fullUrl(),
            'request_method' => $request->method()
        ]);
        
        switch ($format) {
            case 'xlsx':
                return $this->exportExcel($filters, $printAll);
            case 'csv':
                return $this->exportCsv($filters, $printAll);
            case 'pdf':
                return $this->exportPdf($filters, $printAll);
            default:
                \Log::error('Invalid export format requested:', ['format' => $format]);
                return response()->json(['error' => 'Invalid export format'], 400);
        }
    }

    /**
     * Export to Excel
     */
    private function exportExcel(array $filters, bool $printAll = false)
    {
        // Log the filters being applied
        \Log::info('Excel Export - Filters applied:', [
            'filters' => $filters,
            'print_all' => $printAll
        ]);
        
        // Create export instance and test data retrieval
        $export = new TrackingReportExport($filters, null, $printAll);
        
        // Get the data to verify it's not empty
        $query = TrackIncoming::with([
            'equipment', 
            'technician', 
            'location', 
            'employeeIn',
            'trackOutgoing.employeeOut'
        ]);
        
        // Apply same filters as in export (unless print all mode)
        if (!$printAll) {
            $this->applyFilters($query, $filters);
        }
        $testData = $query->get();
        
        \Log::info('Excel Export - Data count before export:', [
            'count' => $testData->count(),
            'mode' => $printAll ? 'print_all' : 'filtered'
        ]);
        
        $filename = $printAll ? 'tracking_reports_all_' . date('Y_m_d') . '.xlsx' : 'tracking_reports_' . date('Y_m_d') . '.xlsx';
        return Excel::download($export, $filename);
    }

    /**
     * Export to CSV
     */
    private function exportCsv(array $filters, bool $printAll = false)
    {
        // Log the filters being applied
        \Log::info('CSV Export - Filters applied:', [
            'filters' => $filters,
            'print_all' => $printAll
        ]);
        
        // Create export instance and test data retrieval
        $export = new TrackingReportExport($filters, null, $printAll);
        
        // Get the data to verify it's not empty
        $query = TrackIncoming::with([
            'equipment', 
            'technician', 
            'location', 
            'employeeIn',
            'trackOutgoing.employeeOut'
        ]);
        
        // Apply same filters as in export (unless print all mode)
        if (!$printAll) {
            $this->applyFilters($query, $filters);
        }
        $testData = $query->get();
        
        \Log::info('CSV Export - Data count before export:', [
            'count' => $testData->count(),
            'mode' => $printAll ? 'print_all' : 'filtered'
        ]);
        
        $filename = $printAll ? 'tracking_reports_all_' . date('Y_m_d') . '.csv' : 'tracking_reports_' . date('Y_m_d') . '.csv';
        return Excel::download($export, $filename, \Maatwebsite\Excel\Excel::CSV);
    }

    /**
     * Export to PDF
     */
    private function exportPdf(array $filters, bool $printAll = false)
    {
        // Log the filters being applied
        \Log::info('PDF Export - Filters applied:', [
            'filters' => $filters,
            'print_all' => $printAll
        ]);
        
        // Get the data to verify it's not empty before creating export
        $query = TrackIncoming::with([
            'equipment', 
            'technician', 
            'location', 
            'employeeIn',
            'trackOutgoing.employeeOut'
        ]);
        
        // Apply same filters as in export (unless print all mode)
        if (!$printAll) {
            $this->applyFilters($query, $filters);
        }
        $testData = $query->get();
        
        \Log::info('PDF Export - Data count before export:', [
            'count' => $testData->count(),
            'mode' => $printAll ? 'print_all' : 'filtered'
        ]);
        
        // Use Laravel Excel with DOMPDF for PDF generation
        $export = new TrackingReportExport($filters, 'pdf', $printAll);
        
        // Generate the PDF content
        $pdf = Excel::raw($export, \Maatwebsite\Excel\Excel::DOMPDF);
        
        $filename = $printAll ? 'tracking_reports_all_' . date('Y_m_d') . '.pdf' : 'tracking_reports_' . date('Y_m_d') . '.pdf';
        
        // Stream the PDF for inline viewing (preview mode)
        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
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

        if (!empty($filters['recall_number']) || !empty($filters['recall_filter'])) {
            $recallNumber = $filters['recall_number'] ?? $filters['recall_filter'];
            $query->where('recall_number', 'like', '%' . $recallNumber . '%');
        }

        if (!empty($filters['status']) || !empty($filters['status_filter'])) {
            $status = $filters['status'] ?? $filters['status_filter'];
            
            // Check if it's an incoming or outgoing status
            $incomingStatuses = ['for_confirmation', 'pending_calibration', 'completed'];
            $outgoingStatuses = ['for_pickup'];
            
            if (in_array($status, $incomingStatuses)) {
                // Filter by track_incoming status
                $query->where('status', $status);
            } elseif (in_array($status, $outgoingStatuses)) {
                // Filter by track_outgoing status
                $query->whereHas('trackOutgoing', function($outgoing) use ($status) {
                    $outgoing->where('status', $status);
                });
            }
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
