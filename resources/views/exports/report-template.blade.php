<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tracking Reports Export</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #4F46E5;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .date {
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Equipment Tracking Reports</div>
        <div class="date">Generated on {{ date('F j, Y \a\t g:i A') }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Recall Number</th>
                <th>Equipment Description</th>
                <th>Serial Number</th>
                <th>Model</th>
                <th>Manufacturer</th>
                <th>Status</th>
                <th>Date In</th>
                <th>Due Date</th>
                <th>Technician</th>
                <th>Location</th>
                <th>Received By</th>
                <th>Calibration Date</th>
                <th>Calibration Due Date</th>
                <th>Date Out</th>
                <th>Completed By</th>
                <th>Cycle Time (hrs)</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            @forelse($reports ?? [] as $report)
                <tr>
                    <td>{{ $report->recall_number }}</td>
                    <td>{{ $report->equipment ? $report->equipment->description : $report->description }}</td>
                    <td>{{ $report->equipment ? $report->equipment->serial_number : $report->serial_number }}</td>
                    <td>{{ $report->equipment ? $report->equipment->model : $report->model }}</td>
                    <td>{{ $report->equipment ? $report->equipment->manufacturer : $report->manufacturer }}</td>
                    <td>{{ ucfirst(str_replace('_', ' ', $report->status)) }}</td>
                    <td>{{ $report->date_in?->format('Y-m-d H:i') }}</td>
                    <td>{{ $report->due_date?->format('Y-m-d') }}</td>
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
                        @if($report->employeeIn)
                            {{ $report->employeeIn->first_name }} {{ $report->employeeIn->last_name }}
                        @endif
                    </td>
                    <td>
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->cal_date?->format('Y-m-d') }}
                        @endif
                    </td>
                    <td>
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->cal_due_date?->format('Y-m-d') }}
                        @endif
                    </td>
                    <td>
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->date_out?->format('Y-m-d H:i') }}
                        @endif
                    </td>
                    <td>
                        @if($report->trackOutgoing && $report->trackOutgoing->employeeOut)
                            {{ $report->trackOutgoing->employeeOut->first_name }} {{ $report->trackOutgoing->employeeOut->last_name }}
                        @endif
                    </td>
                    <td>
                        @if($report->trackOutgoing)
                            {{ $report->trackOutgoing->cycle_time }}
                        @endif
                    </td>
                    <td>{{ $report->notes ?: '' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="17" style="text-align: center;">No data available</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>