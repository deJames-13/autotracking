import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type PaginationData, type TrackOutgoing } from '@/types';
import { MoreHorizontal, RotateCcw } from 'lucide-react';
import { useCallback } from 'react';

interface ArchivedOutgoingTableProps {
    archivedOutgoing: PaginationData<TrackOutgoing>;
    loading?: boolean;
    onRestore: (id: number) => void;
    onSearch?: (search: string) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    onRefresh?: () => void;
}

export function ArchivedOutgoingTable({
    archivedOutgoing,
    loading = false,
    onRestore,
    onSearch,
    onPageChange,
    onPerPageChange,
    onRefresh,
}: ArchivedOutgoingTableProps) {
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: 'secondary' as const, label: 'Pending' },
            in_progress: { variant: 'default' as const, label: 'In Progress' },
            calibrated: { variant: 'success' as const, label: 'Calibrated' },
            ready_for_pickup: { variant: 'outline' as const, label: 'Ready for Pickup' },
            completed: { variant: 'success' as const, label: 'Completed' },
            overdue: { variant: 'destructive' as const, label: 'Overdue' },
            picked_up: { variant: 'success' as const, label: 'Picked Up' },
            for_pickup: { variant: 'outline' as const, label: 'For Pickup' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, label: status };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const columns: DataTableColumn<TrackOutgoing>[] = [
        {
            key: 'track_incoming',
            label: 'Recall #',
            render: (value, row) => (
                <div className="font-medium">
                    {row.track_incoming?.recall_number || <span className="text-muted-foreground italic">Not assigned</span>}
                </div>
            ),
            sortable: false,
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
            sortable: false,
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
            key: 'cal_date',
            label: 'Cal Date',
            render: (value, row) => (
                <div className="text-sm">
                    {row.cal_date ? new Date(row.cal_date).toLocaleDateString() : <span className="text-muted-foreground">Not set</span>}
                </div>
            ),
            sortable: true,
            width: 'w-[100px]',
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
                    <div className={`text-sm ${isOverdue ? 'font-medium text-red-600' : ''}`}>
                        {dueDate.toLocaleDateString()}
                        {isOverdue && <div className="text-xs text-red-500">Overdue</div>}
                    </div>
                );
            },
            sortable: true,
            width: 'w-[120px]',
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
            key: 'employee_out',
            label: 'Released To',
            render: (value, row) => (
                <div className="text-sm">
                    {row.employee_out ? (
                        `${row.employee_out.first_name} ${row.employee_out.last_name}`
                    ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                    )}
                </div>
            ),
            sortable: false,
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
                            <p>These are archived outgoing records that have been soft-deleted. You can restore them to make them active again.</p>
                        </div>
                    </div>
                </div>
            </div>

            <DataTable
                data={archivedOutgoing.data}
                columns={columns}
                loading={loading}
                pagination={{
                    current_page: archivedOutgoing.current_page,
                    last_page: archivedOutgoing.last_page,
                    per_page: archivedOutgoing.per_page,
                    total: archivedOutgoing.total,
                }}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchPlaceholder="Search archived records by recall number, equipment..."
            />
        </div>
    );
}
