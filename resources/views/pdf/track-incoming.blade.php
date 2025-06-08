<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Track Incoming Record - {{ $trackIncoming->recall_number ?: 'Pending Assignment' }}</title>
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
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-in-progress {
            background-color: #cce5ff;
            color: #004085;
        }
        .status-ready {
            background-color: #d4edda;
            color: #155724;
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
        <div class="title">Equipment Calibration Request</div>
        <div class="subtitle">Recall Number: {{ $trackIncoming->recall_number }}</div>
    </div>

    <div class="section">
        <div class="section-title">Equipment Information</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Serial Number</div>
                <div class="info-value">{{ $trackIncoming->equipment->serial_number }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Description</div>
                <div class="info-value">{{ $trackIncoming->equipment->description }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Manufacturer</div>
                <div class="info-value">{{ $trackIncoming->equipment->manufacturer }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Model</div>
                <div class="info-value">{{ $trackIncoming->equipment->model }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Assigned User</div>
                <div class="info-value">
                    @if($trackIncoming->equipment->user)
                        {{ $trackIncoming->equipment->user->first_name }} {{ $trackIncoming->equipment->user->last_name }}
                    @else
                        Unassigned
                    @endif
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Calibration Request Details</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Status</div>
                <div class="info-value">
                    @if($trackIncoming->status === 'pending_calibration')
                        <span class="status-badge status-pending">Pending Calibration</span>
                    @endif
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Requested By</div>
                <div class="info-value">
                    {{ $trackIncoming->employeeIn->first_name }} {{ $trackIncoming->employeeIn->last_name }}
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Request Date</div>
                <div class="info-value">{{ $trackIncoming->date_in->format('M d, Y g:i A') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Technician</div>
                <div class="info-value">
                    @if($trackIncoming->technician)
                        {{ $trackIncoming->technician->first_name }} {{ $trackIncoming->technician->last_name }}
                    @else
                        Not assigned
                    @endif
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Location</div>
                <div class="info-value">
                    {{ $trackIncoming->location->location_name }}
                    @if($trackIncoming->location->department)
                        ({{ $trackIncoming->location->department->department_name }})
                    @endif
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Calibration Due Date</div>
                <div class="info-value">
                    @if($trackIncoming->cal_due_date)
                        {{ $trackIncoming->cal_due_date->format('M d, Y') }}
                    @else
                        Not specified
                    @endif
                </div>
            </div>
        </div>
    </div>

    @if($trackIncoming->description)
    <div class="section">
        <div class="section-title">Description/Notes</div>
        <div style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">
            {{ $trackIncoming->description }}
        </div>
    </div>
    @endif

    @if($trackIncoming->trackOutgoing)
    <div class="section">
        <div class="section-title">Calibration Completion</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Completed By</div>
                <div class="info-value">
                    {{ $trackIncoming->trackOutgoing->employeeOut->first_name }} {{ $trackIncoming->trackOutgoing->employeeOut->last_name }}
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Completion Date</div>
                <div class="info-value">{{ $trackIncoming->trackOutgoing->date_out->format('M d, Y g:i A') }}</div>
            </div>
            @if($trackIncoming->trackOutgoing->cal_due_date)
            <div class="info-row">
                <div class="info-label">Next Calibration Due</div>
                <div class="info-value">{{ $trackIncoming->trackOutgoing->cal_due_date->format('M d, Y') }}</div>
            </div>
            @endif
            @if($trackIncoming->trackOutgoing->description)
            <div class="info-row">
                <div class="info-label">Completion Notes</div>
                <div class="info-value">{{ $trackIncoming->trackOutgoing->description }}</div>
            </div>
            @endif
        </div>
    </div>
    @endif

    <div class="footer">
        Generated on {{ now()->format('M d, Y g:i A') }} | AutoTracking System
    </div>
</body>
</html>
