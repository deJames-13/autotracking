<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tracking Record - {{ $record->recall_number ?? $record->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 12px;
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
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .info-row {
            display: table-row;
        }
        .info-label {
            display: table-cell;
            width: 30%;
            font-weight: bold;
            padding: 5px;
            border: 1px solid #ddd;
            background-color: #f5f5f5;
        }
        .info-value {
            display: table-cell;
            padding: 5px;
            border: 1px solid #ddd;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
        }
        .status-completed {
            background-color: #d4edda;
            color: #155724;
        }
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-progress {
            background-color: #d1ecf1;
            color: #0c5460;
        }
        .status-ready {
            background-color: #d4edda;
            color: #155724;
        }
        .status-overdue {
            background-color: #f8d7da;
            color: #721c24;
        }
        .status-recall {
            background-color: #fff3cd;
            color: #856404;
        }
        .footer {
            position: fixed;
            bottom: 20px;
            width: 100%;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Equipment Tracking Record</div>
        <div class="subtitle">Record ID: {{ $record->recall_number ?? $record->id }}</div>
    </div>

    <div class="section">
        <div class="section-title">Equipment Information</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Recall Number</div>
                <div class="info-value">{{ $record->recall_number }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Serial Number</div>
                <div class="info-value">{{ $record->equipment->serial_number ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Description</div>
                <div class="info-value">{{ $record->equipment->description ?? $record->description }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Model</div>
                <div class="info-value">{{ $record->equipment->model ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Manufacturer</div>
                <div class="info-value">{{ $record->equipment->manufacturer ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Assigned User</div>
                <div class="info-value">
                    @if($record->equipment->user)
                        {{ $record->equipment->user->first_name }} {{ $record->equipment->user->last_name }}
                    @else
                        Unassigned
                    @endif
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Tracking Details</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Status</div>
                <div class="info-value">
                    @php
                        $status = $record->status ?? 'unknown';
                        $badgeClass = match($status) {
                            'completed' => 'status-completed',
                            'pending_calibration' => 'status-pending',
                            'calibration_in_progress' => 'status-progress',
                            'ready_for_pickup' => 'status-ready',
                            default => 'status-pending'
                        };
                    @endphp
                    <span class="status-badge {{ $badgeClass }}">
                        {{ ucwords(str_replace('_', ' ', $status)) }}
                    </span>
                </div>
            </div>
            @if($record->date_in)
            <div class="info-row">
                <div class="info-label">Date In</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($record->date_in)->format('M d, Y H:i') }}</div>
            </div>
            @endif
            @if($record->date_out)
            <div class="info-row">
                <div class="info-label">Date Out</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($record->date_out)->format('M d, Y H:i') }}</div>
            </div>
            @endif
            @if($record->cal_date)
            <div class="info-row">
                <div class="info-label">Calibration Date</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($record->cal_date)->format('M d, Y') }}</div>
            </div>
            @endif
            @if($record->cal_due_date)
            <div class="info-row">
                <div class="info-label">Next Calibration Due</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($record->cal_due_date)->format('M d, Y') }}</div>
            </div>
            @endif
            @if($record->cycle_time)
            <div class="info-row">
                <div class="info-label">Cycle Time</div>
                <div class="info-value">{{ $record->cycle_time }} hours</div>
            </div>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">Personnel Information</div>
        <div class="info-grid">
            @if($record->technician)
            <div class="info-row">
                <div class="info-label">Assigned Technician</div>
                <div class="info-value">{{ $record->technician->first_name }} {{ $record->technician->last_name }}</div>
            </div>
            @endif
            @if($record->employee_in)
            <div class="info-row">
                <div class="info-label">Received By</div>
                <div class="info-value">{{ $record->employee_in->first_name }} {{ $record->employee_in->last_name }}</div>
            </div>
            @endif
            @if($record->employee_out)
            <div class="info-row">
                <div class="info-label">Released By</div>
                <div class="info-value">{{ $record->employee_out->first_name }} {{ $record->employee_out->last_name }}</div>
            </div>
            @endif
            @if($record->location)
            <div class="info-row">
                <div class="info-label">Location</div>
                <div class="info-value">{{ $record->location->location_name }}</div>
            </div>
            @endif
        </div>
    </div>

    @if($record->track_incoming && $record->track_outgoing)
    <div class="section">
        <div class="section-title">Workflow Summary</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Request Status</div>
                <div class="info-value">{{ ucwords(str_replace('_', ' ', $record->track_incoming->status)) }}</div>
            </div>
            @if($record->track_incoming->date_in)
            <div class="info-row">
                <div class="info-label">Request Date</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($record->track_incoming->date_in)->format('M d, Y H:i') }}</div>
            </div>
            @endif
            @if($record->track_outgoing->date_out)
            <div class="info-row">
                <div class="info-label">Completion Date</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($record->track_outgoing->date_out)->format('M d, Y H:i') }}</div>
            </div>
            @endif
        </div>
    </div>
    @endif
                        <span class="status-badge">In Progress</span>
                    @endif
                    
                    @if($trackingRecord->recall)
                        <span class="status-badge status-recall">Recall</span>
                    @endif
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Technician</div>
                <div class="info-value">
                    {{ $trackingRecord->technician->first_name }} {{ $trackingRecord->technician->last_name }}
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Location</div>
                <div class="info-value">
                    {{ $trackingRecord->location->location_name }}
                    @if($trackingRecord->location->department)
                        ({{ $trackingRecord->location->department->department_name }})
                    @endif
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Description</div>
                <div class="info-value">{{ $trackingRecord->description }}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Timeline</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Date In</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($trackingRecord->date_in)->format('Y-m-d H:i:s') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Received By</div>
                <div class="info-value">
                    {{ $trackingRecord->employeeIn->first_name }} {{ $trackingRecord->employeeIn->last_name }}
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Calibration Date</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($trackingRecord->cal_date)->format('Y-m-d') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Calibration Due Date</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($trackingRecord->cal_due_date)->format('Y-m-d') }}</div>
            </div>
            @if($trackingRecord->date_out)
            <div class="info-row">
                <div class="info-label">Date Out</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($trackingRecord->date_out)->format('Y-m-d H:i:s') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Released By</div>
                <div class="info-value">
                    {{ $trackingRecord->employeeOut->first_name }} {{ $trackingRecord->employeeOut->last_name }}
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Cycle Time</div>
                <div class="info-value">{{ $trackingRecord->cycle_time }} hours</div>
            </div>
            @endif
        </div>
    </div>

    <div class="footer">
        Generated on {{ now()->format('Y-m-d H:i:s') }} | AutoTracking System
    </div>
</body>
</html>
