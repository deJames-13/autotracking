<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tracking Record - {{ $trackingRecord->tracking_id }}</title>
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
        <div class="subtitle">Record ID: {{ $trackingRecord->tracking_id }}</div>
    </div>

    <div class="section">
        <div class="section-title">Equipment Information</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Serial Number</div>
                <div class="info-value">{{ $trackingRecord->equipment->serial_number }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Description</div>
                <div class="info-value">{{ $trackingRecord->equipment->description }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Manufacturer</div>
                <div class="info-value">{{ $trackingRecord->equipment->manufacturer }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Assigned User</div>
                <div class="info-value">
                    @if($trackingRecord->equipment->user)
                        {{ $trackingRecord->equipment->user->first_name }} {{ $trackingRecord->equipment->user->last_name }}
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
                    @if($trackingRecord->date_out)
                        <span class="status-badge status-completed">Completed</span>
                    @elseif($trackingRecord->cal_due_date < now())
                        <span class="status-badge status-overdue">Overdue</span>
                    @else
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
