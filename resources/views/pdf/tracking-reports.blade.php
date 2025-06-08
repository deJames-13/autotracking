<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Incoming/Outgoing Logsheet</title>
    <style>
        @page {
            margin: 0.5in;
            size: legal landscape;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 8px;
            margin: 0;
            padding: 0;
            line-height: 1.2;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Arial', sans-serif;
            font-size: 8px;
        }
        
        th, td {
            border: 1px solid #000;
            padding: 2px;
            text-align: center;
            vertical-align: middle;
            font-family: 'Arial', sans-serif;
            font-size: 8px;
        }
        
        th {
            font-weight: bold;
            background-color: #f0f0f0;
        }
        
        .main-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .section-header {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .column-header {
            font-size: 7px;
            font-weight: bold;
        }
        
        .data-cell {
            font-size: 7px;
        }
        
        .no-data {
            font-size: 8px;
            font-style: italic;
            text-align: center;
        }
    </style>
</head>
<body>
    <table>
        <thead>
            <!-- Main title row -->
            <tr>
                <th colspan="18" class="main-title">INCOMING/OUTGOING LOGSHEET</th>
            </tr>
            <tr>
                <th colspan="18" class="main-title">
                    {{ now()->setTimezone('Asia/Manila')->format('F j, Y g:i A') }}
                </th>
            </tr>
            <tr>
                <th colspan="4" class="section-header">TECHNICIAN</th>
                <th colspan="3" class="section-header">INCOMING</th>
                <th colspan="5" class="section-header">OUTGOING</th>
                <th colspan="6" class="section-header">CYCLE TIME</th>
            </tr>
            <!-- Sub-header row -->
            <tr>
                <th class="column-header">Recall #</th>
                <th class="column-header">Description</th>
                <th class="column-header">Location</th>
                <th class="column-header">Due Date</th>
                <th class="column-header">Date In</th>
                <th class="column-header">Name</th>
                <th class="column-header">Employee #</th>
                <th class="column-header">Recall #</th>
                <th class="column-header">Cal Date</th>
                <th class="column-header">Due Date</th>
                <th class="column-header">Date Out</th>
                <th class="column-header">Employee #</th>
                <th class="column-header">Queuing Time<br>(1 Day) Date in</th>
                <th class="column-header">CT Reqd<br>(Days)</th>
                <th class="column-header">Commit ETC</th>
                <th class="column-header">Actual ETC</th>
                <th class="column-header">Actual # of<br>CT (Days)</th>
                <th class="column-header">Overdue ETC</th>
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
                    <td class="data-cell">
                        @if($report->employeeIn)
                            {{ $report->employeeIn->employee_id }}
                        @endif
                    </td>
                    
                    <!-- OUTGOING Section -->
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->recall_number }}
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
                    <td class="data-cell">
                        @if($report->trackOutgoing && $report->trackOutgoing->employeeOut)
                            {{ $report->trackOutgoing->employeeOut->employee_id }}
                        @endif
                    </td>
                    
                    <!-- CYCLE TIME Section -->
                    <td class="data-cell">
                        @if($report->trackOutgoing && $report->date_in && $report->trackOutgoing->date_out)
                            @php
                                $dateIn = \Carbon\Carbon::parse($report->date_in);
                                $dateOut = \Carbon\Carbon::parse($report->trackOutgoing->date_out);
                                $queueingTime = (int) $dateIn->diffInDays($dateOut);
                            @endphp
                            {{ $queueingTime }}
                        @endif
                    </td>
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->ct_reqd }}
                        @endif
                    </td>
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->commit_etc }}
                        @endif
                    </td>
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->actual_etc }}
                        @endif
                    </td>
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->cycle_time }}
                        @endif
                    </td>
                    <td class="data-cell">
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->overdue == 1 ? 'Yes' : 'No' }}
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="18" class="no-data">No data available</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
