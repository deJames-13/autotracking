import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn, DataTableFilter } from '@/components/ui/data-table';
import { type TrackIncoming, type PaginationData, type User, type Location } from '@/types';
import { router } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil } from 'lucide-react';
import { useCallback } from 'react';

interface TrackIncomingTableProps {
    trackIncoming: PaginationData<TrackIncoming>;
    loading?: boolean;
    filterOptions?: {
        statuses: Array<{ value: string; label: string }>;
        technicians: User[];
        locations: Location[];
        employees: User[];
    };
    onRefresh?: () => void;
    onSearch?: (search: string) => void;
    onFilter?: (filters: Record<string, any>) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

export function TrackIncomingTable({
    trackIncoming,
    loading = false,
    filterOptions,
    onRefresh,
    onSearch,
    onFilter,
    onPageChange,
    onPerPageChange
}: TrackIncomingTableProps) {

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'pending': { variant: 'secondary' as const, label: 'Pending' },
            'in_progress': { variant: 'default' as const, label: 'In Progress' },
            'calibrated': { variant: 'success' as const, label: 'Calibrated' },
            'ready_for_pickup': { variant: 'outline' as const, label: 'Ready for Pickup' },
            'completed': { variant: 'success' as const, label: 'Completed' },
            'overdue': { variant: 'destructive' as const, label: 'Overdue' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, label: status };

        return (
            <Badge variant={config.variant}>
                {config.label}
            </Badge>
        );
    };

    const columns: DataTableColumn<TrackIncoming>[] = [
        {
            key: 'recall_number',
            label: 'Recall Number',
            render: (value, row) => (
                <div className="font-medium text-sm">
                    {row.recall_number}
                </div>
            ),
            sortable: true,
            width: 'w-[140px]'
        },
        {
            key: 'equipment',
            label: 'Equipment',
            render: (value, row) => (
                <div className="space-y-1">
                    <div className="font-medium text-sm">
                        {row.equipment?.description || row.model || 'N/A'}
                    </div>
                    {row.serial_number && (
                        <div className="text-xs text-muted-foreground">
                            S/N: {row.serial_number}
                        </div>
                    )}
                    {row.manufacturer && (
                        <div className="text-xs text-muted-foreground">
                            {row.manufacturer}
                        </div>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[200px]'
        },
        {
            key: 'technician',
            label: 'Technician',
            render: (value, row) => (
                <div className="text-sm">
                    {row.technician ? `${row.technician.first_name} ${row.technician.last_name}` : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[150px]'
        },
        {
            key: 'location',
            label: 'Location',
            render: (value, row) => (
                <div className="text-sm">
                    {row.location?.location_name || (
                        <span className="text-muted-foreground italic">No location</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[120px]'
        },
        {
            key: 'status',
            label: 'Status',
            render: (value, row) => getStatusBadge(row.status),
            sortable: true,
            width: 'w-[120px]'
        },
        {
            key: 'date_in',
            label: 'Date In',
            render: (value, row) => (
                <div className="text-sm">
                    {row.date_in ? new Date(row.date_in).toLocaleDateString() : (
                        <span className="text-muted-foreground">Not set</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[100px]'
        },
        {
            key: 'due_date',
            label: 'Due Date',
            render: (value, row) => {
                if (!row.due_date) {
                    return <span className="text-muted-foreground text-sm">Not set</span>;
                }

                const dueDate = new Date(row.due_date);
                const today = new Date();
                const isOverdue = dueDate < today;

                return (
                    <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                        {dueDate.toLocaleDateString()}
                        {isOverdue && (
                            <div className="text-xs text-red-500">Overdue</div>
                        )}
                    </div>
                );
            },
            sortable: true,
            width: 'w-[100px]'
        },
        {
            key: 'employee_in',
            label: 'Received By',
            render: (value, row) => (
                <div className="text-sm">
                    {row.employee_in ? `${row.employee_in.first_name} ${row.employee_in.last_name}` : (
                        <span className="text-muted-foreground italic">N/A</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[130px]'
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (value, row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.visit(route('admin.tracking.incoming.show', row.id))}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem onClick={() => console.log('Edit', row.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem> */}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            width: 'w-[70px]'
        }
    ];

    // Define filters based on available filter options
    const filters: DataTableFilter[] = [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'all', label: 'All Statuses' },
                ...(filterOptions?.statuses || [])
            ]
        },
        {
            key: 'technician_id',
            label: 'Technician',
            type: 'select',
            options: [
                { value: 'all', label: 'All Technicians' },
                ...(filterOptions?.technicians || [])
            ]
        },
        {
            key: 'location_id',
            label: 'Location',
            type: 'select',
            options: [
                { value: 'all', label: 'All Locations' },
                ...(filterOptions?.locations?.map(location => ({
                    value: location.value.toString(),
                    label: location.label
                })) || [])
            ]
        },
        {
            key: 'employee_id_in',
            label: 'Received By',
            type: 'select',
            options: [
                { value: 'all', label: 'All Employees' },
                ...(filterOptions?.employees_in || [])
            ]
        },
        {
            key: 'date_range',
            label: 'Date Range',
            type: 'date-range'
        }
    ];

    // Handle DataTable events
    const handleSearch = useCallback((search: string) => {
        if (onSearch) {
            onSearch(search);
        }
    }, [onSearch]);

    const handleFilter = useCallback((filters: Record<string, any>) => {
        if (onFilter) {
            onFilter(filters);
        }
    }, [onFilter]);

    const handlePageChange = useCallback((page: number) => {
        if (onPageChange) {
            onPageChange(page);
        }
    }, [onPageChange]);

    const handlePerPageChange = useCallback((perPage: number) => {
        if (onPerPageChange) {
            onPerPageChange(perPage);
        }
    }, [onPerPageChange]);

    return (
        <DataTable
            data={trackIncoming.data}
            columns={columns}
            filters={filters}
            loading={loading}
            pagination={{
                current_page: trackIncoming.current_page,
                last_page: trackIncoming.last_page,
                per_page: trackIncoming.per_page,
                total: trackIncoming.total
            }}
            onSearch={handleSearch}
            onFilter={handleFilter}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            searchPlaceholder="Search by recall number, equipment, serial number..."
        />
    );
}
