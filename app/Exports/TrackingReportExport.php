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

    public function __construct(array $filters = [], $type = NULL)
    {
        $this->filters = $filters;
        $this->type = $type;
    }

    public function view(): View
    {
        // Load TrackIncoming with basic relationships first
        $query = TrackIncoming::with([
            'equipment', 
            'technician', 
            'location', 
            'employeeIn'
        ]);

        // Apply filters
        $this->applyFilters($query);

        $incomingRecords = $query->orderBy('date_in', 'desc')->get();
        
        // Get recall numbers to fetch outgoing records separately
        $recallNumbers = $incomingRecords->pluck('recall_number')->filter();
        
        // Load outgoing records separately to avoid circular reference
        $outgoingRecords = TrackOutgoing::whereIn('recall_number', $recallNumbers)
            ->with(['employeeOut' => function($query) {
                $query->select(['employee_id', 'first_name', 'last_name']);
            }])
            ->get()
            ->keyBy('recall_number');
        
        // Manually attach outgoing records to incoming records
        $incomingRecords->each(function($record) use ($outgoingRecords) {
            if (isset($outgoingRecords[$record->recall_number])) {
                $record->setRelation('trackOutgoing', $outgoingRecords[$record->recall_number]);
            }
        });

        switch ($this->type) {
            case 'pdf':
                return view('exports.report-template', [
                    'reports' => $incomingRecords
                ]);
            
            default:
                return view('exports.report-template-xlsx', [
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

        if (!empty($this->filters['equipment_name'])) {
            $query->whereHas('equipment', function($eq) {
                $eq->where('description', 'like', '%' . $this->filters['equipment_name'] . '%');
            });
        }

        if (!empty($this->filters['recall_number'])) {
            $query->where('recall_number', 'like', '%' . $this->filters['recall_number'] . '%');
        }

        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (!empty($this->filters['technician_id'])) {
            $query->where('technician_id', $this->filters['technician_id']);
        }

        if (!empty($this->filters['location_id'])) {
            $query->where('location_id', $this->filters['location_id']);
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
