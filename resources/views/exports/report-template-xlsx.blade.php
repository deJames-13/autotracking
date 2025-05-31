<table style="font-family: 'Arial';"> 
    <thead>
        <!-- Main title row -->
        <tr>
            <th colspan="18" align="center" style="text-transform: uppercase;">INCOMING/OUTGOING LOGSHEET</th>
        </tr>
        <tr>
            <th colspan="18" align="center" style="text-transform: uppercase;">
                {{ now()->format('F j, Y g:i A') }}
            </th>
        </tr>
        <tr>
            <th colspan="4" align="center" style="text-transform: uppercase;">TECHNICIAN</th>
            <th colspan="3" align="center" style="text-transform: uppercase;">INCOMING</th>
            <th colspan="5" align="center" style="text-transform: uppercase;">OUTGOING</th>
            <th colspan="6" align="center" style="text-transform: uppercase;">CYCLE TIME</th>
        </tr>
        <!-- Sub-header row -->
        <tr>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Recall #</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Description</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Location</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Due Date</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Date In</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Name</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Employee #</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Recall #</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Cal Date</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Due Date</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Date Out</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Employee #</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Queuing Time<br>(1 Day) Date</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">CT Reqd<br>(Days)</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Commit ETC</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Actual ETC</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Actual # of<br>CT (Days)</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold;">Overdue ETC</th>
        </tr>
    </thead>
    <tbody>
        @forelse($reports ?? [] as $report)
            <tr>
                <!-- TECHNICIAN Section -->
                <td style="vertical-align: center; text-align: center;">{{ $report->recall_number }}</td>
                <td style="vertical-align: center; text-align: center;">{{ $report->equipment ? $report->equipment->description : $report->description }}</td>
                <td style="vertical-align: center; text-align: center;">
                    @if($report->location)
                        {{ $report->location->location_name }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center;">{{ $report->due_date?->format('m/d/Y') }}</td>
                
                <!-- INCOMING Section -->
                <td style="vertical-align: center; text-align: center;">{{ $report->date_in?->format('m/d/Y') }}</td>
                <td style="vertical-align: center; text-align: center;">
                    @if($report->employeeIn)
                        {{ $report->employeeIn->first_name }} {{ $report->employeeIn->last_name }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center;">
                    @if($report->employeeIn)
                        {{ $report->employeeIn->employee_id }}
                    @endif
                </td>
                
                <!-- OUTGOING Section -->
                <td style="vertical-align: center; text-align: center;">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->recall_number }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center;">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->cal_date?->format('m/d/Y') }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center;">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->cal_due_date?->format('m/d/Y') }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center;">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->date_out?->format('m/d/Y') }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center;">
                    @if($report->trackOutgoing && $report->trackOutgoing->employeeOut)
                        {{ $report->trackOutgoing->employeeOut->employee_id }}
                    @endif
                </td>
                
                <!-- CYCLE TIME Section (all empty for now) -->
                <td style="vertical-align: center; text-align: center;"></td> <!-- Queuing Time -->
                <td style="vertical-align: center; text-align: center;"></td> <!-- CT Required -->
                <td style="vertical-align: center; text-align: center;"></td> <!-- Commit ETC -->
                <td style="vertical-align: center; text-align: center;"></td> <!-- Actual ETC -->
                <td style="vertical-align: center; text-align: center;"></td> <!-- Actual # of CT -->
                <td style="vertical-align: center; text-align: center;"></td> <!-- Overdue ETC -->
            </tr>
        @empty
            <tr>
                <td colspan="18" style="text-align: center;">No data available</td>
            </tr>
        @endforelse
    </tbody>
</table>