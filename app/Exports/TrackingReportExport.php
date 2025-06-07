<?php

namespace App\Exports;

use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeSheet;
use Illuminate\Contracts\View\View;

class TrackingReportExport implements FromView, ShouldAutoSize, WithEvents
{
    protected $filters;
    protected $type;
    protected $printAll;

    public function __construct(array $filters = [], $type = null, $printAll = false)
    {
        $this->filters = $filters;
        $this->type = $type;
        $this->printAll = $printAll;
    }

    public function view(): View
    {
        \Log::info('TrackingReportExport - Starting data retrieval with filters:', [
            'filters' => $this->filters,
            'printAll' => $this->printAll
        ]);
        
        $query = TrackIncoming::with([
            'equipment', 
            'technician', 
            'location', 
            'employeeIn',
            'trackOutgoing.employeeOut'
        ]);

        // Only apply filters if not in "print all" mode
        if (!$this->printAll) {
            $this->applyFilters($query);
        }

        $incomingRecords = $query->orderBy('date_in', 'desc')->get();
        
        \Log::info('TrackingReportExport - Data retrieved:', [
            'count' => $incomingRecords->count(),
            'mode' => $this->printAll ? 'print_all' : 'filtered',
            'sample_data' => $incomingRecords->take(2)->toArray()
        ]);

        return view('exports.report-template', [
            'reports' => $incomingRecords
        ]);
    }

    private function applyFilters($query)
    {
        // Apply search filters with proper syntax
        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
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

        // Handle both old and new parameter names for recall number filter
        if (!empty($this->filters['recall_number']) || !empty($this->filters['recall_filter'])) {
            $recallNumber = $this->filters['recall_number'] ?? $this->filters['recall_filter'];
            $query->where('recall_number', 'like', '%' . $recallNumber . '%');
        }

        // Handle both old and new parameter names for status filter
        if (!empty($this->filters['status']) || !empty($this->filters['status_filter'])) {
            $status = $this->filters['status'] ?? $this->filters['status_filter'];
            $query->where('status', $status);
        }

        // Handle both old and new parameter names for location filter
        if (!empty($this->filters['location_id']) || !empty($this->filters['location_filter'])) {
            $locationId = $this->filters['location_id'] ?? $this->filters['location_filter'];
            $query->where('location_id', $locationId);
        }

        // Date range filters
        if (!empty($this->filters['date_from'])) {
            $query->where('date_in', '>=', $this->filters['date_from']);
        }

        if (!empty($this->filters['date_to'])) {
            $query->where('date_in', '<=', $this->filters['date_to'] . ' 23:59:59');
        }
    }

    public function registerEvents(): array
    {
        return [
            BeforeSheet::class => function (BeforeSheet $event) {
                $event->sheet
                    ->getPageSetup()
                    ->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE)
                    ->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_LEGAL)
                    ->setFitToPage(true)
                    ->setFitToWidth(1)
                    ->setFitToHeight(0); 
            },
        ];
    }
}