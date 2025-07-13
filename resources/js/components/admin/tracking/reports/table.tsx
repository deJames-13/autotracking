import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/simple-modal';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, Eye, FileDown, MapPin, User } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface Equipment {
    equipment_id: string;
    recall_number: string;
    serial_number: string;
    description: string;
    model?: string;
    manufacturer?: string;
}

interface User {
    employee_id: string;
    first_name: string;
    last_name: string;
}

interface Location {
    location_id: string;
    location_name: string;
}

interface TrackingRecord {
    id: string;
    recall_number: string;
    status: string;
    date_in?: string;
    date_out?: string;
    cal_date?: string;
    cal_due_date?: string;
    cycle_time?: number;
    description?: string;
    equipment: Equipment;
    technician?: User;
    location?: Location;
    employee_in?: User;
    employee_out?: User;
    track_incoming?: {
        id: string;
        status: string;
        date_in?: string;
        description?: string;
    };
    track_outgoing?: {
        id: string;
        date_out?: string;
        cal_due_date?: string;
    };
}

interface FilterOptions {
    locations: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
}

interface StatusOption {
    value: string;
    label: string;
    type: 'incoming' | 'outgoing';
}

interface ReportsTableProps {
    className?: string;
}

const RequestInfoModal: React.FC<{ record: TrackingRecord }> = ({ record }) => {
    return (
        <div className="space-y-6">
            {/* Equipment Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertCircle className="h-5 w-5" />
                        Equipment Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-muted-foreground text-sm font-medium">Recall Number</label>
                            <p className="font-mono">{record.recall_number}</p>
                        </div>
                        <div>
                            <label className="text-muted-foreground text-sm font-medium">Serial Number</label>
                            <p className="font-mono">{record.equipment?.serial_number}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-muted-foreground text-sm font-medium">Description</label>
                            <p>{record.equipment?.description}</p>
                        </div>
                        {record.equipment?.model && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Model</label>
                                <p>{record.equipment.model}</p>
                            </div>
                        )}
                        {record.equipment?.manufacturer && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Manufacturer</label>
                                <p>{record.equipment.manufacturer}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Request Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5" />
                        Request Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-muted-foreground text-sm font-medium">Status</label>
                            <div>
                                <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                                    {record.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                        {record.date_in && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Date In</label>
                                <p>{format(new Date(record.date_in), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                        )}
                        {record.technician && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Assigned Technician</label>
                                <p>
                                    {record.technician.first_name} {record.technician.last_name}
                                </p>
                            </div>
                        )}
                        {record.location && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Location</label>
                                <p className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {record.location.location_name}
                                </p>
                            </div>
                        )}
                        {record.employee_in && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Received By</label>
                                <p className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {record.employee_in.first_name} {record.employee_in.last_name}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const CompletionModal: React.FC<{ record: TrackingRecord }> = ({ record }) => {
    return (
        <div className="space-y-6">
            {/* Completion Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle2 className="h-5 w-5" />
                        Completion Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        {record.date_out && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Date Out</label>
                                <p>{format(new Date(record.date_out), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                        )}
                        {record.cal_date && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Calibration Date</label>
                                <p>{format(new Date(record.cal_date), 'MMM dd, yyyy')}</p>
                            </div>
                        )}
                        {record.cal_due_date && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Next Calibration Due</label>
                                <p>{format(new Date(record.cal_due_date), 'MMM dd, yyyy')}</p>
                            </div>
                        )}
                        {record.cycle_time && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Cycle Time (hours)</label>
                                <p>{record.cycle_time}</p>
                            </div>
                        )}
                        {record.employee_out && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Released By</label>
                                <p className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {record.employee_out.first_name} {record.employee_out.last_name}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Equipment Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Equipment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-muted-foreground text-sm font-medium">Recall Number</label>
                            <p className="font-mono">{record.recall_number}</p>
                        </div>
                        <div>
                            <label className="text-muted-foreground text-sm font-medium">Serial Number</label>
                            <p className="font-mono">{record.equipment?.serial_number}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-muted-foreground text-sm font-medium">Description</label>
                            <p>{record.equipment?.description}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export const ReportsTable: React.FC<ReportsTableProps> = ({ className }) => {
    const [data, setData] = useState<TrackingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [exportAllData, setExportAllData] = useState(false);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        locations: [],
        statuses: [],
    });

    // Fetch filter options
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const response = await fetch('/api/reports/table/filter-options');
                if (response.ok) {
                    const options = await response.json();
                    setFilterOptions(options);
                }
            } catch (error) {
                console.error('Failed to fetch filter options:', error);
            }
        };

        fetchFilterOptions();
    }, []);

    // Fetch data function with useCallback
    const fetchData = useCallback(async (params: Record<string, any> = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: params.page?.toString() || '1',
                per_page: params.per_page?.toString() || '15',
                ...params.filters,
                ...(params.search && { search: params.search }),
                ...(params.sort_by && { sort_by: params.sort_by }),
                ...(params.sort_direction && { sort_direction: params.sort_direction }),
            });

            const response = await fetch(`/api/reports/table?${queryParams}`);
            if (response.ok) {
                const result = await response.json();

                // Validate the response structure
                if (result && typeof result === 'object') {
                    setData(Array.isArray(result.data) ? result.data : []);

                    // Handle pagination data from meta object
                    const meta = result.meta || {};
                    setPagination({
                        current_page: Number(meta.current_page || result.current_page) || 1,
                        last_page: Number(meta.last_page || result.last_page) || 1,
                        per_page: Number(meta.per_page || result.per_page) || 15,
                        total: Number(meta.total || result.total) || 0,
                    });
                } else {
                    console.error('Invalid API response structure:', result);
                    setData([]);
                    setPagination({
                        current_page: 1,
                        last_page: 1,
                        per_page: 15,
                        total: 0,
                    });
                }
            } else {
                console.error('API request failed:', response.status, response.statusText);
                setData([]);
                setPagination({
                    current_page: 1,
                    last_page: 1,
                    per_page: 15,
                    total: 0,
                });
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setData([]);
            setPagination({
                current_page: 1,
                last_page: 1,
                per_page: 15,
                total: 0,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, []);

    // Define columns for the DataTable
    const columns = useMemo(
        () => [
            {
                key: 'recall_number',
                label: 'Recall #',
                sortable: true,
                render: (value: string) => <span className="font-mono text-sm">{value}</span>,
            },
            {
                key: 'equipment_description',
                label: 'Equipment Description',
                sortable: true,
                render: (value: string, row: any) => (
                    <div className="max-w-[200px]">
                        <p className="truncate font-medium">{row.equipment_description || value}</p>
                        <p className="text-muted-foreground truncate text-xs">{row.equipment_model && `Model: ${row.equipment_model}`}</p>
                    </div>
                ),
            },
            {
                key: 'status',
                label: 'Status',
                sortable: true,
                filterable: true,
                render: (value: string) => {
                    // Define status configurations based on database schema
                    const statusConfig = {
                        // Incoming statuses
                        for_confirmation: { variant: 'secondary' as const, label: 'For Confirmation' },
                        pending_calibration: { variant: 'default' as const, label: 'Pending Calibration' },
                        // Shared status
                        completed: { variant: 'default' as const, label: 'Completed' },
                        // Outgoing statuses
                        for_pickup: { variant: 'outline' as const, label: 'For Pickup' },
                    };

                    const config = statusConfig[value as keyof typeof statusConfig] || {
                        variant: 'secondary' as const,
                        label: value.replace('_', ' ').toUpperCase(),
                    };

                    return <Badge variant={config.variant}>{config.label}</Badge>;
                },
            },
            {
                key: 'date_in',
                label: 'Date In',
                sortable: true,
                render: (value: string) =>
                    value ? (
                        <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(value), 'MMM dd, yyyy')}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    ),
            },
            {
                key: 'technician',
                label: 'Technician',
                sortable: true,
                filterable: true,
                render: (value: any, row: any) =>
                    row.technician ? (
                        <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{row.technician.name}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    ),
            },
            {
                key: 'actions',
                label: 'Actions',
                render: (value: any, row: any) => (
                    <div className="flex items-center gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-1 h-4 w-4" />
                                    View Request
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Request Information - {row.recall_number}</DialogTitle>
                                </DialogHeader>
                                <RequestInfoModal record={row.tracking_record || row} />
                            </DialogContent>
                        </Dialog>

                        {row.outgoing && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <CheckCircle2 className="mr-1 h-4 w-4" />
                                        View Completion
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Completion Information - {row.recall_number}</DialogTitle>
                                    </DialogHeader>
                                    <CompletionModal record={row.tracking_record || row} />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                ),
            },
        ],
        [],
    );

    // Define filters for the DataTable
    const tableFilters = useMemo(() => {
        // Create status options with proper incoming/outgoing labels
        const statusOptions = [
            // { value: 'all', label: 'All Statuses' },
            // Map backend status options to include type labels
            ...filterOptions.statuses.map((status) => {
                // Determine if it's incoming-only or outgoing-only
                const incomingOnlyStatuses = ['for_confirmation', 'pending_calibration'];
                const outgoingStatuses = ['for_pickup', 'completed'];

                let typeLabel = '';
                if (incomingOnlyStatuses.includes(status.value)) {
                    typeLabel = ' (Incoming)';
                } else if (outgoingStatuses.includes(status.value)) {
                    typeLabel = ' (Outgoing)';
                }

                return {
                    value: status.value,
                    label: status.label + typeLabel,
                };
            }),
        ];

        return [
            {
                key: 'status_filter',
                label: 'Status',
                type: 'select' as const,
                placeholder: 'Filter by status...',
                options: statusOptions,
            },
            {
                key: 'location_filter',
                label: 'Location',
                type: 'select' as const,
                placeholder: 'Filter by location...',
                options: [{ value: 'all', label: 'All Locations' }, ...filterOptions.locations],
            },
        ];
    }, [filterOptions]);

    // Define export options (removed Print All options)
    const exportOptions = useMemo(
        () => [
            {
                label: 'Export Excel',
                format: 'xlsx' as const,
            },
            {
                label: 'Export CSV',
                format: 'csv' as const,
            },
            {
                label: 'Export PDF',
                format: 'pdf' as const,
            },
        ],
        [],
    );

    // Handlers for DataTable events using useCallback to prevent infinite loops
    const handleSearch = useCallback(
        (search: string) => {
            fetchData({ ...filters, search, page: 1 });
        },
        [filters],
    );

    const handleFilter = useCallback((newFilters: Record<string, any>) => {
        console.log(newFilters);    
        setFilters(newFilters);
        fetchData({ filters: newFilters, page: 1 });
    }, []);

    const handleSort = useCallback(
        (column: string, direction: 'asc' | 'desc') => {
            fetchData({ ...filters, sort_by: column, sort_direction: direction, page: 1 });
        },
        [filters],
    );

    const handlePageChange = useCallback(
        (page: number) => {
            fetchData({ ...filters, page });
        },
        [filters],
    );

    const handlePerPageChange = useCallback(
        (perPage: number) => {
            fetchData({ ...filters, per_page: perPage, page: 1 });
        },
        [filters],
    );

    const handleExport = useCallback(
        async (exportFormat: string, exportFilters: Record<string, any>) => {
            try {
                // Build query parameters from filters
                const queryParams = new URLSearchParams();

                // Check if "Export All Data" is enabled
                const isPrintAll = exportAllData;

                // Use the parent component's filters state instead of exportFilters from DataTable
                // This ensures we're using the current filters that are actually applied to the data
                const currentFilters = isPrintAll ? {} : filters;

                console.log('Current filters for export:', currentFilters);
                console.log('Export filters from DataTable:', exportFilters);

                // Add current filters as query parameters (except print_all which goes in the URL path)
                Object.keys(currentFilters).forEach((key) => {
                    if (key !== 'print_all' && currentFilters[key] !== null && currentFilters[key] !== undefined && currentFilters[key] !== '') {
                        queryParams.append(key, String(currentFilters[key]));
                    }
                });

                // Also include search term from exportFilters if it exists
                if (exportFilters.search && !isPrintAll) {
                    queryParams.append('search', String(exportFilters.search));
                }

                // Add date range filters from exportFilters if they exist
                if (exportFilters.date_from && !isPrintAll) {
                    queryParams.append('date_from', String(exportFilters.date_from));
                }
                if (exportFilters.date_to && !isPrintAll) {
                    queryParams.append('date_to', String(exportFilters.date_to));
                }

                // Add print_all parameter if needed
                if (isPrintAll) {
                    queryParams.append('print_all', 'true');
                }

                // Build the URL with format in path and filters as query params
                const url = `/api/reports/table/export/${exportFormat}?${queryParams.toString()}`;

                console.log('Export URL:', url);

                // For PDF format, open in new window for preview
                if (exportFormat === 'pdf') {
                    window.open(url, '_blank');
                    return;
                }

                // For other formats (Excel, CSV), download the file
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/octet-stream',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    credentials: 'same-origin',
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = downloadUrl;
                    // Use different filename for print all exports
                    const filePrefix = isPrintAll ? 'tracking-reports-all' : 'tracking-reports';
                    a.download = `${filePrefix}-${format(new Date(), 'MMM_dd_yyyy_HH_mm')}.${exportFormat}`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(downloadUrl);
                    document.body.removeChild(a);
                } else {
                    console.error('Export failed:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Export failed:', error);
            }
        },
        [exportAllData, filters],
    );

    return (
        <div className={cn('space-y-4', className)}>
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5" />
                        Equipment Tracking Reports
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-full">
                    {/* Custom Export All Data Toggle */}
                    <div className="bg-muted/20 mb-4 rounded-lg border p-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="export-all-data" checked={exportAllData} onCheckedChange={(checked) => setExportAllData(!!checked)} />
                            <Label
                                htmlFor="export-all-data"
                                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Export All Data (ignore current filters)
                            </Label>
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                            When enabled, exports will include all records regardless of current filters and search terms.
                        </p>
                    </div>

                    <DataTable
                        data={data}
                        columns={columns}
                        loading={loading}
                        pagination={pagination}
                        filters={tableFilters}
                        exports={exportOptions}
                        exportable={true}
                        searchable={true}
                        filterable={true}
                        rowKey="id"
                        onSearch={handleSearch}
                        onFilter={handleFilter}
                        onSort={handleSort}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                        onExport={handleExport}
                        searchDebounceMs={500}
                        emptyMessage="No tracking records found."
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportsTable;
