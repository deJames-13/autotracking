<table style="font-family: 'Arial';"> 
    <thead>
        <!-- Main title row -->
        <tr>
            <th colspan="18" align="center" style="font-weight: bold; font-size: 8px; text-transform: uppercase;">INCOMING/OUTGOING LOGSHEET</th>
        </tr>
        <tr>
            <th colspan="18" align="center" style="font-weight: bold; font-size: 8px; text-transform: uppercase;">
                {{ now()->format('F j, Y g:i A') }}
            </th>
        </tr>
        <tr>
            <th colspan="4" align="center" style="font-weight: bold; font-size: 8px; text-transform: uppercase;">TECHNICIAN</th>
            <th colspan="3" align="center" style="font-weight: bold; font-size: 8px; text-transform: uppercase;">INCOMING</th>
            <th colspan="5" align="center" style="font-weight: bold; font-size: 8px; text-transform: uppercase;">OUTGOING</th>
            <th colspan="6" align="center" style="font-weight: bold; font-size: 8px; text-transform: uppercase;">CYCLE TIME</th>
        </tr>
        <!-- Sub-header row -->
        <tr>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Recall #</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Description</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Location</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Due Date</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Date In</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Name</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Employee #</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Recall #</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Cal Date</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Due Date</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Date Out</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Employee #</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Queuing Time<br>(1 Day) Date</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">CT Reqd<br>(Days)</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Commit ETC</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Actual ETC</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Actual # of<br>CT (Days)</th>
            <th align="center" style="vertical-align: center; text-align: center; font-weight: bold; font-size: 8px;">Overdue ETC</th>
        </tr>
    </thead>
    <tbody>
        @forelse($reports ?? [] as $report)
            <tr>
                <!-- TECHNICIAN Section -->
                <td style="vertical-align: center; text-align: center; width: 90px; font-size: 8px">{{ $report->recall_number }}</td>
                <td style="vertical-align: center; text-align: center; width: 90px">{{ $report->equipment ? $report->equipment->description : $report->description }}</td>
                <td style="vertical-align: center; text-align: center; width: 90px">
                    @if($report->location)
                        {{ $report->location->location_name }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 90px; font-size: 8px">{{ $report->due_date?->format('m/d/Y') }}</td>
                
                <!-- INCOMING Section -->
                <td style="vertical-align: center; text-align: center; width: 90px; font-size: 8px">{{ $report->date_in?->format('m/d/Y') }}</td>
                <td style="vertical-align: center; text-align: center; width: 90px">
                    @if($report->employeeIn)
                        {{ $report->employeeIn->first_name }} {{ $report->employeeIn->last_name }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 60px">
                    @if($report->employeeIn)
                        {{ $report->employeeIn->employee_id }}
                    @endif
                </td>
                
                <!-- OUTGOING Section -->
                <td style="vertical-align: center; text-align: center; width: 90px; font-size: 8px">
                    @if($report->trackOutgoing)
                        {{ $report->recall_number }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 90px; font-size: 8px">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->cal_date?->format('m/d/Y') }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 90px; font-size: 8px">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->cal_due_date?->format('m/d/Y') }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 90px; font-size: 8px">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->date_out?->format('m/d/Y') }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 60px">
                    @if($report->trackOutgoing && $report->trackOutgoing->employeeOut)
                        {{ $report->trackOutgoing->employeeOut->employee_id }}
                    @endif
                </td>
                
                <!-- CYCLE TIME Section -->
                <td style="vertical-align: center; text-align: center; width: 30px">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->cycle_time }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 30px">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->ct_reqd }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 30px">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->commit_etc }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 30px">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->actual_etc }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 30px">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->cycle_time }}
                    @endif
                </td>
                <td style="vertical-align: center; text-align: center; width: 30px">
                    @if($report->trackOutgoing)
                        {{ $report->trackOutgoing->overdue }}
                    @endif
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="18" style="text-align: center;">No data available</td>
            </tr>
        @endforelse
    </tbody>
</table>