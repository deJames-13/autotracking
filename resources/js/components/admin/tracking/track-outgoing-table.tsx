import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn, DataTableFilter } from '@/components/ui/data-table';
import { type TrackOutgoing, type PaginationData, type User } from '@/types';
import { router } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil, FileText } from 'lucide-react';
import { useCallback } from 'react';
import { useRole } from '@/hooks/use-role';

interface TrackOutgoingTableProps {
    trackOutgoing: PaginationData<TrackOutgoing>;
    loading?: boolean;
    filterOptions?: {
        statuses: Array<{ value: string; label: string }>;
        technicians: Array<{ value: string; label: string }>;
        employees_out: Array<{ value: string; label: string }>;
        released_by: Array<{ value: string; label: string }>;
    };
    onRefresh?: () => void;
    onSearch?: (search: string) => void;
    onFilter?: (filters: Record<string, any>) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

export function TrackOutgoingTable({
    trackOutgoing,
    loading = false,
    filterOptions,
    onRefresh,
    onSearch,
    onFilter,
    onPageChange,
    onPerPageChange
}: TrackOutgoingTableProps) {
    const { isAdmin } = useRole();

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'pending': { variant: 'secondary' as const, label: 'Pending' },
            'in_progress': { variant: 'default' as const, label: 'In Progress' },
            'calibrated': { variant: 'success' as const, label: 'Calibrated' },
            'ready_for_pickup': { variant: 'outline' as const, label: 'Ready for Pickup' },
            'completed': { variant: 'success' as const, label: 'Completed' },
            'overdue': { variant: 'destructive' as const, label: 'Overdue' },
            'picked_up': { variant: 'success' as const, label: 'Picked Up' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, label: status };

        return (
            <Badge variant={config.variant}>
                {config.label}
            </Badge>
        );
    };

    const columns: DataTableColumn<TrackOutgoing>[] = [
        {
            key: 'recall_number',
            label: 'Recall Number',
            render: (value, row) => (
                <div className="font-medium text-sm">
                    {row.track_incoming?.recall_number || 'N/A'}
                </div>
            ),
            sortable: true,
            width: 'w-[140px]'
        },
        {
            key: 'equipment',
            label: 'Equipment',
            render: (value, row) => {
                const equipment = row?.equipment;
                return (
                    <div className="space-y-1">
                        <div className="font-medium text-sm">
                            {equipment?.description || row.track_incoming?.model || 'N/A'}
                        </div>
                        {row.track_incoming?.serial_number && (
                            <div className="text-xs text-muted-foreground">
                                S/N: {row.track_incoming.serial_number}
                            </div>
                        )}
                        {row.track_incoming?.manufacturer && (
                            <div className="text-xs text-muted-foreground">
                                {row.track_incoming.manufacturer}
                            </div>
                        )}
                    </div>
                );
            },
            sortable: true,
            width: 'w-[200px]'
        },
        {
            key: 'technician',
            label: 'Technician',
            render: (value, row) => {
                const technician = row?.technician;
                return (
                    <div className="text-sm">
                        {technician ? `${technician.first_name} ${technician.last_name}` : (
                            <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                    </div>
                );
            },
            sortable: true,
            width: 'w-[150px]'
        },
        {
            key: 'status',
            label: 'Status',
            render: (value, row) => getStatusBadge(row.status),
            sortable: true,
            width: 'w-[120px]'
        },
        {
            key: 'cal_date',
            label: 'Cal Date',
            render: (value, row) => (
                <div className="text-sm">
                    {row.cal_date ? new Date(row.cal_date).toLocaleDateString() : (
                        <span className="text-muted-foreground">Not set</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[100px]'
        },
        {
            key: 'cal_due_date',
            label: 'Cal Due Date',
            render: (value, row) => {
                if (!row.cal_due_date) {
                    return <span className="text-muted-foreground text-sm">Not set</span>;
                }

                const dueDate = new Date(row.cal_due_date);
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
            width: 'w-[110px]'
        },
        {
            key: 'date_out',
            label: 'Date Out',
            render: (value, row) => (
                <div className="text-sm">
                    {row.date_out ? new Date(row.date_out).toLocaleDateString() : (
                        <span className="text-muted-foreground">Not set</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[100px]'
        },
        {
            key: 'employee_out',
            label: 'Employee Out',
            render: (value, row) => (
                <div className="text-sm">
                    {row.employee_out ? `${row.employee_out.first_name} ${row.employee_out.last_name}` : (
                        <span className="text-muted-foreground italic">N/A</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[130px]'
        },
        {
            key: 'released_by',
            label: 'Released By',
            render: (value, row) => (
                <div className="text-sm">
                    {row.released_by ? `${row.released_by.first_name} ${row.released_by.last_name}` : (
                        <span className="text-muted-foreground italic">N/A</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[130px]'
        },
        {
            key: 'cycle_time',
            label: 'Cycle Time',
            render: (value, row) => (
                <div className="text-sm">
                    {row.cycle_time != undefined ? row.cycle_time : (
                        <span className="text-muted-foreground">N/A</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[100px]'
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
                        <DropdownMenuItem onClick={() => router.visit(route('admin.tracking.outgoing.show', row.id))}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        {(row.status === 'for_pickup' || (row.status === 'completed' && isAdmin())) && (
                            <DropdownMenuItem onClick={() => router.visit(route('admin.tracking.outgoing.edit', row.id))}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                        )}
                        {/* {row.track_incoming?.recall_number && (
                            <DropdownMenuItem onClick={() => router.visit(route('admin.tracking.outgoing.certificate', row.id))}>
                                <FileText className="mr-2 h-4 w-4" />
                                View Certificate
                            </DropdownMenuItem>
                        )} */}
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
            key: 'employee_id_out',
            label: 'Employee Out',
            type: 'select',
            options: [
                { value: 'all', label: 'All Employees' },
                ...(filterOptions?.employees_out || [])
            ]
        },
        {
            key: 'released_by_id',
            label: 'Released By',
            type: 'select',
            options: [
                { value: 'all', label: 'All Users' },
                ...(filterOptions?.released_by || [])
            ]
        },
        {
            key: 'cal_date_range',
            label: 'Cal Date Range',
            type: 'date-range'
        },
        {
            key: 'cal_due_date_range',
            label: 'Cal Due Date Range',
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
            data={trackOutgoing.data}
            columns={columns}
            filters={filters}
            loading={loading}
            pagination={{
                current_page: trackOutgoing.current_page,
                last_page: trackOutgoing.last_page,
                per_page: trackOutgoing.per_page,
                total: trackOutgoing.total
            }}
            onSearch={handleSearch}
            onFilter={handleFilter}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            searchPlaceholder="Search by recall number, equipment, serial number..."
        />
    );
}
