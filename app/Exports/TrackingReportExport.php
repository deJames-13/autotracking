<?php

namespace App\Exports;

use App\Models\TrackIncoming;
use App\Models\TrackOutgoing;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeSheet;
use Maatwebsite\Excel\Events\AfterSheet;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Auth;

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

        // Apply role-based filtering first
        $this->applyRoleBasedFiltering($query);

        // Only apply additional filters if not in "print all" mode
        if (!$this->printAll) {
            $this->applyFilters($query);
        }

        $incomingRecords = $query->orderBy('date_in', 'desc')->get();
        
        \Log::info('TrackingReportExport - Data retrieved:', [
            'count' => $incomingRecords->count(),
            'mode' => $this->printAll ? 'print_all' : 'filtered',
            'user_role' => Auth::user()->role->role_name ?? 'unknown',
            'sample_data' => $incomingRecords->take(2)->toArray()
        ]);

        // Use the Excel-specific template for Excel exports only
        return view('exports.report-template-xlsx', [
            'reports' => $incomingRecords
        ]);
    }

    /**
     * Apply role-based filtering to the query based on current user's role
     */
    private function applyRoleBasedFiltering($query)
    {
        $user = Auth::user();
        
        if (!$user || !$user->role) {
            \Log::warning('TrackingReportExport - User or role not found, restricting access');
            // If no user or role, restrict to empty results for security
            $query->whereRaw('1 = 0');
            return;
        }

        $roleName = $user->role->role_name;
        
        \Log::info('TrackingReportExport - Applying role-based filtering', [
            'user_id' => $user->id,
            'employee_id' => $user->employee_id,
            'role' => $roleName
        ]);
        
        switch ($roleName) {
            case 'technician':
                // Technicians can only see records they are assigned to (as technician or received_by)
                $query->where(function($q) use ($user) {
                    $q->where('technician_id', $user->employee_id)
                      ->orWhere('received_by_id', $user->employee_id);
                });
                \Log::info('TrackingReportExport - Applied technician filtering for employee_id: ' . $user->employee_id);
                break;
                
            case 'employee':
                // Employees can only see their own submitted records
                $query->where('employee_id_in', $user->employee_id);
                \Log::info('TrackingReportExport - Applied employee filtering for employee_id: ' . $user->employee_id);
                break;
                
            case 'admin':
                // Admins can see all records (no additional filtering)
                \Log::info('TrackingReportExport - No additional filtering applied for role: ' . $roleName);
                break;
                
            default:
                // Unknown roles get no access for security
                \Log::warning('TrackingReportExport - Unknown role detected, restricting access: ' . $roleName);
                $query->whereRaw('1 = 0');
                break;
        }
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
                $sheet = $event->sheet->getDelegate();
                
                // Set page setup
                $sheet->getPageSetup()
                    ->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE)
                    ->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_LEGAL)
                    ->setFitToPage(true)
                    ->setFitToWidth(1)
                    ->setFitToHeight(0);

                // Set Arial font as default for the workbook
                $sheet->getParent()->getDefaultStyle()->getFont()->setName('Arial')->setSize(8);
            },
            
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Get the highest row and column with data
                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();
                
                // Apply Arial font to all cells with data
                $sheet->getStyle('A1:' . $highestColumn . $highestRow)
                    ->getFont()
                    ->setName('Arial')
                    ->setSize(8);
                    
                // Make headers bold (assuming first 4 rows are headers)
                $sheet->getStyle('A1:' . $highestColumn . '4')
                    ->getFont()
                    ->setBold(true);
            },
        ];
    }
}