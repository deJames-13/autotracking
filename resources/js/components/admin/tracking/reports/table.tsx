import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, FileDown, AlertCircle, CheckCircle2, Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
    equipmentNames: Array<{ value: string; label: string }>;
    technicians: Array<{ value: string; label: string }>;
    locations: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
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
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Equipment Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Recall Number</label>
                            <p className="font-mono">{record.recall_number}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                            <p className="font-mono">{record.equipment?.serial_number}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Description</label>
                            <p>{record.equipment?.description}</p>
                        </div>
                        {record.equipment?.model && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Model</label>
                                <p>{record.equipment.model}</p>
                            </div>
                        )}
                        {record.equipment?.manufacturer && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                                <p>{record.equipment.manufacturer}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Request Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Request Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                                {record.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                        </div>
                        {record.date_in && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Date In</label>
                                <p>{format(new Date(record.date_in), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                        )}
                        {record.technician && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Assigned Technician</label>
                                <p>{record.technician.first_name} {record.technician.last_name}</p>
                            </div>
                        )}
                        {record.location && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Location</label>
                                <p className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {record.location.location_name}
                                </p>
                            </div>
                        )}
                        {record.employee_in && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Received By</label>
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
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Completion Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        {record.date_out && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Date Out</label>
                                <p>{format(new Date(record.date_out), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                        )}
                        {record.cal_date && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Calibration Date</label>
                                <p>{format(new Date(record.cal_date), 'MMM dd, yyyy')}</p>
                            </div>
                        )}
                        {record.cal_due_date && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Next Calibration Due</label>
                                <p>{format(new Date(record.cal_due_date), 'MMM dd, yyyy')}</p>
                            </div>
                        )}
                        {record.cycle_time && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Cycle Time (hours)</label>
                                <p>{record.cycle_time}</p>
                            </div>
                        )}
                        {record.employee_out && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Released By</label>
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
                            <label className="text-sm font-medium text-muted-foreground">Recall Number</label>
                            <p className="font-mono">{record.recall_number}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                            <p className="font-mono">{record.equipment?.serial_number}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Description</label>
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
        total: 0
    });
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        equipmentNames: [],
        technicians: [],
        locations: [],
        statuses: []
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
                        total: Number(meta.total || result.total) || 0
                    });
                } else {
                    console.error('Invalid API response structure:', result);
                    setData([]);
                    setPagination({
                        current_page: 1,
                        last_page: 1,
                        per_page: 15,
                        total: 0
                    });
                }
            } else {
                console.error('API request failed:', response.status, response.statusText);
                setData([]);
                setPagination({
                    current_page: 1,
                    last_page: 1,
                    per_page: 15,
                    total: 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setData([]);
            setPagination({
                current_page: 1,
                last_page: 1,
                per_page: 15,
                total: 0
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
    const columns = useMemo(() => [
        {
            key: 'recall_number',
            label: 'Recall #',
            sortable: true,
            render: (value: string) => (
                <span className="font-mono text-sm">{value}</span>
            ),
        },
        {
            key: 'equipment_description',
            label: 'Equipment Description',
            sortable: true,
            render: (value: string, row: any) => (
                <div className="max-w-[200px]">
                    <p className="truncate font-medium">{row.equipment_description || value}</p>
                    <p className="text-xs text-muted-foreground truncate">
                        {row.equipment_model && `Model: ${row.equipment_model}`}
                    </p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            filterable: true,
            render: (value: string) => (
                <Badge variant={value === 'completed' ? 'default' : 'secondary'}>
                    {value.replace('_', ' ').toUpperCase()}
                </Badge>
            ),
        },
        {
            key: 'date_in',
            label: 'Date In',
            sortable: true,
            render: (value: string) => (
                value ? (
                    <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(value), 'MMM dd, yyyy')}
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'technician',
            label: 'Technician',
            sortable: true,
            filterable: true,
            render: (value: any, row: any) => (
                row.technician ? (
                    <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="text-sm">
                            {row.technician.name}
                        </span>
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
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
                                <Eye className="h-4 w-4 mr-1" />
                                View Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    View Completion
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
    ], []);

    // Define filters for the DataTable
    const tableFilters = useMemo(() => [
        {
            key: 'equipment_filter',
            label: 'Equipment',
            type: 'select' as const,
            placeholder: 'Filter by equipment...',
            options: filterOptions.equipmentNames,
        },
        {
            key: 'technician_filter',
            label: 'Technician',
            type: 'select' as const,
            placeholder: 'Filter by technician...',
            options: filterOptions.technicians,
        },
        {
            key: 'status_filter',
            label: 'Status',
            type: 'select' as const,
            placeholder: 'Filter by status...',
            options: filterOptions.statuses,
        },
    ], [filterOptions]);

    // Define export options
    const exportOptions = useMemo(() => [
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
    ], []);

    // Handlers for DataTable events using useCallback to prevent infinite loops
    const handleSearch = useCallback((search: string) => {
        fetchData({ ...filters, search, page: 1 });
    }, [filters]);

    const handleFilter = useCallback((newFilters: Record<string, any>) => {
        setFilters(newFilters);
        fetchData({ filters: newFilters, page: 1 });
    }, []);

    const handleSort = useCallback((column: string, direction: 'asc' | 'desc') => {
        fetchData({ ...filters, sort_by: column, sort_direction: direction, page: 1 });
    }, [filters]);

    const handlePageChange = useCallback((page: number) => {
        fetchData({ ...filters, page });
    }, [filters]);

    const handlePerPageChange = useCallback((perPage: number) => {
        fetchData({ ...filters, per_page: perPage, page: 1 });
    }, [filters]);

    const handleExport = useCallback(async (exportFormat: string, exportFilters: Record<string, any>) => {
        try {
            // Build query parameters from filters
            const queryParams = new URLSearchParams();

            // Add filters as query parameters
            Object.keys(exportFilters).forEach(key => {
                if (exportFilters[key] !== null && exportFilters[key] !== undefined && exportFilters[key] !== '') {
                    queryParams.append(key, String(exportFilters[key]));
                }
            });

            // Build the URL with format in path and filters as query params
            const url = `/api/reports/table/export/${exportFormat}?${queryParams.toString()}`;

            // For PDF format, open in new window for preview
            if (exportFormat === 'pdf') {
                window.open(url, '_blank');
                return;
            }

            // For other formats (Excel, CSV), download the file
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/octet-stream',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = downloadUrl;
                a.download = `tracking-reports-${format(new Date(), 'MMM_dd_yyyy_HH_mm')}.${exportFormat}`;
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
    }, []);

    return (
        <div className={cn('space-y-4', className)}>
            <Card className='h-full'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5" />
                        Equipment Tracking Reports
                    </CardTitle>
                </CardHeader>
                <CardContent className='h-full'>
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