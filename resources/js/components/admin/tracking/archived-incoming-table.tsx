import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type PaginationData, type TrackIncoming } from '@/types';
import { MoreHorizontal, RotateCcw, Eye } from 'lucide-react';
import { useCallback } from 'react';

interface ArchivedIncomingTableProps {
    archivedIncoming: PaginationData<TrackIncoming>;
    loading?: boolean;
    onRestore: (id: number) => void;
    onSearch?: (search: string) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    onRefresh?: () => void;
}

export function ArchivedIncomingTable({
    archivedIncoming,
    loading = false,
    onRestore,
    onSearch,
    onPageChange,
    onPerPageChange,
    onRefresh,
}: ArchivedIncomingTableProps) {
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: 'secondary' as const, label: 'Pending' },
            in_progress: { variant: 'default' as const, label: 'In Progress' },
            calibrated: { variant: 'success' as const, label: 'Calibrated' },
            ready_for_pickup: { variant: 'outline' as const, label: 'Ready for Pickup' },
            completed: { variant: 'success' as const, label: 'Completed' },
            overdue: { variant: 'destructive' as const, label: 'Overdue' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, label: status };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const columns: DataTableColumn<TrackIncoming>[] = [
        {
            key: 'recall_number',
            label: 'Recall #',
            render: (value, row) => (
                <div className="font-medium">
                    {value || <span className="text-muted-foreground italic">Not assigned</span>}
                </div>
            ),
            sortable: true,
            width: 'w-[120px]',
        },
        {
            key: 'equipment',
            label: 'Equipment',
            render: (value, row) => (
                <div className="text-sm">
                    <div className="font-medium">{row.equipment?.description || 'N/A'}</div>
                    {row.equipment?.manufacturer && (
                        <div className="text-muted-foreground text-xs">
                            {row.equipment.manufacturer} {row.equipment.model}
                        </div>
                    )}
                </div>
            ),
            sortable: false,
            width: 'w-[200px]',
        },
        {
            key: 'technician',
            label: 'Technician',
            render: (value, row) => (
                <div className="text-sm">
                    {row.technician ? (
                        `${row.technician.first_name} ${row.technician.last_name}`
                    ) : (
                        <span className="text-muted-foreground italic">Not assigned</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[130px]',
        },
        {
            key: 'status',
            label: 'Status',
            render: (value, row) => getStatusBadge(value),
            sortable: true,
            width: 'w-[120px]',
        },
        {
            key: 'date_in',
            label: 'Date In',
            render: (value, row) => (
                <div className="text-sm">
                    {row.date_in ? new Date(row.date_in).toLocaleDateString() : <span className="text-muted-foreground">Not set</span>}
                </div>
            ),
            sortable: true,
            width: 'w-[100px]',
        },
        {
            key: 'deleted_at',
            label: 'Archived Date',
            render: (value, row) => (
                <div className="text-sm">
                    {row.deleted_at ? new Date(row.deleted_at).toLocaleDateString() : <span className="text-muted-foreground">Unknown</span>}
                </div>
            ),
            sortable: true,
            width: 'w-[120px]',
        },
        {
            key: 'employee_in',
            label: 'Received By',
            render: (value, row) => (
                <div className="text-sm">
                    {row.employee_in ? (
                        `${row.employee_in.first_name} ${row.employee_in.last_name}`
                    ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[130px]',
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
                        <DropdownMenuItem onClick={() => onRestore(row.id)} className="text-green-600 focus:text-green-600">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore Record
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            width: 'w-[70px]',
        },
    ];

    // Handle DataTable events
    const handleSearch = useCallback(
        (search: string) => {
            if (onSearch) {
                onSearch(search);
            }
        },
        [onSearch],
    );

    const handlePageChange = useCallback(
        (page: number) => {
            if (onPageChange) {
                onPageChange(page);
            }
        },
        [onPageChange],
    );

    const handlePerPageChange = useCallback(
        (perPage: number) => {
            if (onPerPageChange) {
                onPerPageChange(perPage);
            }
        },
        [onPerPageChange],
    );

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <RotateCcw className="h-5 w-5 text-orange-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-orange-800">Archived Records</h3>
                        <div className="mt-2 text-sm text-orange-700">
                            <p>These are archived incoming records that have been soft-deleted. You can restore them to make them active again.</p>
                        </div>
                    </div>
                </div>
            </div>

            <DataTable
                data={archivedIncoming.data}
                columns={columns}
                loading={loading}
                pagination={{
                    current_page: archivedIncoming.current_page,
                    last_page: archivedIncoming.last_page,
                    per_page: archivedIncoming.per_page,
                    total: archivedIncoming.total,
                }}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchPlaceholder="Search archived records by recall number, equipment..."
            />
        </div>
    );
}
