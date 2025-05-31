<?php

namespace App\Exports;

use App\Models\TrackIncoming;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class TrackingReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        $query = TrackIncoming::with([
            'equipment', 
            'technician', 
            'location', 
            'employeeIn', 
            'trackOutgoing.employeeOut'
        ]);

        // Apply filters
        $this->applyFilters($query);

        return $query->orderBy('date_in', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'Recall Number',
            'Equipment Description',
            'Serial Number',
            'Model',
            'Manufacturer',
            'Status',
            'Date In',
            'Due Date',
            'Technician',
            'Location',
            'Received By',
            'Calibration Date',
            'Calibration Due Date',
            'Date Out',
            'Completed By',
            'Cycle Time (hrs)',
            'Notes'
        ];
    }

    public function map($record): array
    {
        return [
            $record->recall_number,
            $record->equipment ? $record->equipment->description : $record->description,
            $record->equipment ? $record->equipment->serial_number : $record->serial_number,
            $record->equipment ? $record->equipment->model : $record->model,
            $record->equipment ? $record->equipment->manufacturer : $record->manufacturer,
            ucfirst(str_replace('_', ' ', $record->status)),
            $record->date_in?->format('Y-m-d H:i'),
            $record->due_date?->format('Y-m-d'),
            $record->technician ? $record->technician->first_name . ' ' . $record->technician->last_name : '',
            $record->location ? $record->location->location_name : '',
            $record->employeeIn ? $record->employeeIn->first_name . ' ' . $record->employeeIn->last_name : '',
            $record->trackOutgoing ? $record->trackOutgoing->cal_date?->format('Y-m-d') : '',
            $record->trackOutgoing ? $record->trackOutgoing->cal_due_date?->format('Y-m-d') : '',
            $record->trackOutgoing ? $record->trackOutgoing->date_out?->format('Y-m-d H:i') : '',
            $record->trackOutgoing && $record->trackOutgoing->employeeOut ? 
                $record->trackOutgoing->employeeOut->first_name . ' ' . $record->trackOutgoing->employeeOut->last_name : '',
            $record->trackOutgoing ? $record->trackOutgoing->cycle_time : '',
            $record->notes ?: '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the header row
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ],
            // Style all cells
            'A:Q' => [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CCCCCC'],
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_TOP,
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Tracking Reports';
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
}
