<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Incoming/Outgoing Logsheet</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        .main-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .generation-date {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-bottom: 20px;
        }
        .filters {
            margin-bottom: 15px;
            padding: 8px;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            font-size: 9px;
        }
        .filters h3 {
            margin: 0 0 8px 0;
            font-size: 11px;
        }
        .filters p {
            margin: 1px 0;
            font-size: 8px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
        }
        th, td {
            border: 1px solid #000;
            padding: 3px;
            text-align: center;
            vertical-align: middle;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .main-header {
            background-color: #e0e0e0;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 7px;
        }
        .sub-header {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 6px;
        }
        .data-cell {
            font-size: 7px;
            text-align: left;
            padding: 2px;
        }
        .number-cell {
            text-align: center;
            font-size: 7px;
        }
        .footer {
            position: fixed;
            bottom: 10px;
            width: 100%;
            text-align: center;
            font-size: 6px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="main-title">INCOMING/OUTGOING LOGSHEET</div>
    <div class="generation-date">Generated on {{ now()->format('F j, Y \a\t g:i A') }}</div>

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
            <!-- Main title row -->
            <tr>
                <th colspan="4" class="main-header">TECHNICIAN</th>
                <th colspan="3" class="main-header">INCOMING</th>
                <th colspan="5" class="main-header">OUTGOING</th>
                <th colspan="6" class="main-header">CYCLE TIME</th>
            </tr>
            <!-- Sub-header row -->
            <tr>
                <th class="sub-header">RECALL #</th>
                <th class="sub-header">DESCRIPTION</th>
                <th class="sub-header">LOCATION</th>
                <th class="sub-header">DUE DATE</th>
                <th class="sub-header">DATE IN</th>
                <th class="sub-header">NAME</th>
                <th class="sub-header">EMPLOYEE #</th>
                <th class="sub-header">RECALL #</th>
                <th class="sub-header">CAL DATE</th>
                <th class="sub-header">DUE DATE</th>
                <th class="sub-header">DATE OUT</th>
                <th class="sub-header">EMPLOYEE #</th>
                <th class="sub-header">QUEUING TIME<br>(1 DAY) DATE</th>
                <th class="sub-header">CT REQD<br>(DAYS)</th>
                <th class="sub-header">COMMIT ETC</th>
                <th class="sub-header">ACTUAL ETC</th>
                <th class="sub-header">ACTUAL # OF<br>CT (DAYS)</th>
                <th class="sub-header">OVERDUE ETC</th>
            </tr>
        </thead>
        <tbody>
            @forelse($reports ?? [] as $report)
                <tr>
                    <!-- TECHNICIAN Section -->
                    <td class="data-cell">{{ $report->recall_number }}</td>
                    <td class="data-cell">{{ $report->equipment ? $report->equipment->description : $report->description }}</td>
                    <td class="data-cell">
                        @if($report->location)
                            {{ $report->location->location_name }}
                        @endif
                    </td>
                    <td class="data-cell">{{ $report->due_date?->format('m/d/Y') }}</td>
                    
                    <!-- INCOMING Section -->
                    <td class="data-cell">{{ $report->date_in?->format('m/d/Y') }}</td>
                    <td class="data-cell">
                        @if($report->employeeIn)
                            {{ $report->employeeIn->first_name }} {{ $report->employeeIn->last_name }}
                        @endif
                    </td>
                    <td class="number-cell">
                        @if($report->employeeIn)
                            {{ $report->employeeIn->employee_id }}
                        @endif
                    </td>
                    
                    <!-- OUTGOING Section -->
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->recall_number }}
                        @endif
                    </td>
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->cal_date?->format('m/d/Y') }}
                        @endif
                    </td>
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->cal_due_date?->format('m/d/Y') }}
                        @endif
                    </td>
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->date_out?->format('m/d/Y') }}
                        @endif
                    </td>
                    <td class="number-cell">
                        @if($report->trackOutgoing && $report->trackOutgoing->employeeOut)
                            {{ $report->trackOutgoing->employeeOut->employee_id }}
                        @endif
                    </td>
                    
                    <!-- CYCLE TIME Section -->
                    <td class="data-cell"></td> <!-- Queuing Time -->
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->ct_reqd }}
                        @endif
                    </td> <!-- CT Required -->
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->commit_etc?->format('m/d/Y') }}
                        @endif
                    </td> <!-- Commit ETC -->
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->actual_etc?->format('m/d/Y') }}
                        @endif
                    </td> <!-- Actual ETC -->
                    <td class="data-cell"></td> <!-- Actual # of CT -->
                    <td class="data-cell"></td> <!-- Overdue ETC -->
                </tr>
            @empty
                <tr>
                    <td colspan="18" style="text-align: center;">No data available</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        AutoTracking System - Incoming/Outgoing Logsheet - Page {PAGENO} of {nb}
    </div>
</body>
</html>
