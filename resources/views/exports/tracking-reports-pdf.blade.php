<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tracking Reports - {{ date('Y-m-d') }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 11px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .subtitle {
            font-size: 14px;
            color: #666;
        }
        .filters {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
        }
        .filters h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
        }
        .filters p {
            margin: 2px 0;
            font-size: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
            font-size: 9px;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
        }
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-in-progress {
            background-color: #d1ecf1;
            color: #0c5460;
        }
        .status-completed {
            background-color: #d4edda;
            color: #155724;
        }
        .footer {
            position: fixed;
            bottom: 20px;
            width: 100%;
            text-align: center;
            font-size: 8px;
            color: #666;
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Equipment Tracking Reports</div>
        <div class="subtitle">Generated on {{ now()->format('F j, Y \a\t g:i A') }}</div>
    </div>

    @if(!empty($filters))
    <div class="filters">
        <h3>Applied Filters:</h3>
        @if(!empty($filters['search']))
            <p><strong>Search:</strong> {{ $filters['search'] }}</p>
        @endif
        @if(!empty($filters['equipment_name']))
            <p><strong>Equipment Name:</strong> {{ $filters['equipment_name'] }}</p>
        @endif
        @if(!empty($filters['recall_number']))
            <p><strong>Recall Number:</strong> {{ $filters['recall_number'] }}</p>
        @endif
        @if(!empty($filters['status']))
            <p><strong>Status:</strong> {{ ucfirst(str_replace('_', ' ', $filters['status'])) }}</p>
        @endif
        @if(!empty($filters['date_from']) || !empty($filters['date_to']))
            <p><strong>Date Range:</strong> 
                {{ !empty($filters['date_from']) ? \Carbon\Carbon::parse($filters['date_from'])->format('M j, Y') : 'Start' }}
                - 
                {{ !empty($filters['date_to']) ? \Carbon\Carbon::parse($filters['date_to'])->format('M j, Y') : 'End' }}
            </p>
        @endif
    </div>
    @endif

    <table>
        <thead>
            <tr>
                <th>Recall #</th>
                <th>Equipment</th>
                <th>Serial #</th>
                <th>Status</th>
                <th>Date In</th>
                <th>Due Date</th>
                <th>Technician</th>
                <th>Location</th>
                <th>Cal Date</th>
                <th>Date Out</th>
                <th>Cycle Time</th>
            </tr>
        </thead>
        <tbody>
            @forelse($reports as $report)
                <tr>
                    <td>{{ $report->recall_number }}</td>
                    <td>{{ $report->equipment ? $report->equipment->description : $report->description }}</td>
                    <td>{{ $report->equipment ? $report->equipment->serial_number : $report->serial_number }}</td>
                    <td>
                        @php
                            $statusClass = 'status-pending';
                            if ($report->status === 'calibration_in_progress') $statusClass = 'status-in-progress';
                            if ($report->status === 'completed') $statusClass = 'status-completed';
                        @endphp
                        <span class="status-badge {{ $statusClass }}">
                            {{ ucfirst(str_replace('_', ' ', $report->status)) }}
                        </span>
                    </td>
                    <td>{{ $report->date_in?->format('M j, Y') }}</td>
                    <td>{{ $report->due_date?->format('M j, Y') }}</td>
                    <td>
                        @if($report->technician)
                            {{ $report->technician->first_name }} {{ $report->technician->last_name }}
                        @endif
                    </td>
                    <td>
                        @if($report->location)
                            {{ $report->location->location_name }}
                        @endif
                    </td>
                    <td>
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->cal_date?->format('M j, Y') }}
                        @endif
                    </td>
                    <td>
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->date_out?->format('M j, Y') }}
                        @endif
                    </td>
                    <td>
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->cycle_time }}h
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="11" style="text-align: center; color: #666;">No records found</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        AutoTracking System - Equipment Tracking Reports - Page {PAGENO} of {nb}
    </div>
</body>
</html>
