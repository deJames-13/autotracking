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

    public function __construct(array $filters = [], $type = null)
    {
        $this->filters = $filters;
        $this->type = $type;
    }

    public function view(): View
    {
        $query = TrackIncoming::with([
            'equipment', 
            'technician', 
            'location', 
            'employeeIn',
            'trackOutgoing.employeeOut',
        ]);

        $this->applyFilters($query);

        $incomingRecords = $query->orderBy('date_in', 'desc')->get();

        switch ($this->type) {
            case 'pdf':
                return view('exports.report-template', [
                    'reports' => $incomingRecords
                ]);
            default:
                return view('exports.report-template', [
                    'reports' => $incomingRecords
                ]);
        }
    }

    private function applyFilters($query)
    {
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

        // Handle both old and new parameter names for compatibility
        if (!empty($this->filters['equipment_name']) || !empty($this->filters['equipment_filter'])) {
            $equipmentName = $this->filters['equipment_name'] ?? $this->filters['equipment_filter'];
            $query->whereHas('equipment', function($eq) use ($equipmentName) {
                $eq->where('description', 'like', '%' . $equipmentName . '%');
            });
        }

        if (!empty($this->filters['recall_number']) || !empty($this->filters['recall_filter'])) {
            $recallNumber = $this->filters['recall_number'] ?? $this->filters['recall_filter'];
            $query->where('recall_number', 'like', '%' . $recallNumber . '%');
        }

        if (!empty($this->filters['status']) || !empty($this->filters['status_filter'])) {
            $status = $this->filters['status'] ?? $this->filters['status_filter'];
            $query->where('status', $status);
        }

        if (!empty($this->filters['technician_id']) || !empty($this->filters['technician_filter'])) {
            $technicianId = $this->filters['technician_id'] ?? $this->filters['technician_filter'];
            $query->where('technician_id', $technicianId);
        }

        if (!empty($this->filters['location_id']) || !empty($this->filters['location_filter'])) {
            $locationId = $this->filters['location_id'] ?? $this->filters['location_filter'];
            $query->where('location_id', $locationId);
        }

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
