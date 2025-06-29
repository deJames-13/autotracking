import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Equipment, type PaginationData } from '@/types';
import { MoreHorizontal, RotateCcw, Eye } from 'lucide-react';
import { useCallback } from 'react';

interface ArchivedEquipmentTableProps {
    archivedEquipment: PaginationData<Equipment>;
    loading?: boolean;
    onRestore: (id: number) => void;
    onSearch?: (search: string) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    onRefresh?: () => void;
}

export function ArchivedEquipmentTable({
    archivedEquipment,
    loading = false,
    onRestore,
    onSearch,
    onPageChange,
    onPerPageChange,
    onRefresh,
}: ArchivedEquipmentTableProps) {
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: { variant: 'success' as const, label: 'Active' },
            inactive: { variant: 'secondary' as const, label: 'Inactive' },
            maintenance: { variant: 'warning' as const, label: 'Maintenance' },
            calibration: { variant: 'default' as const, label: 'Calibration' },
            retired: { variant: 'destructive' as const, label: 'Retired' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, label: status };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const columns: DataTableColumn<Equipment>[] = [
        {
            key: 'recall_number',
            label: 'Recall #',
            render: (value, row) => (
                <div className="font-medium">
                    {value || <span className="text-muted-foreground italic">Not assigned</span>}
                </div>
            ),
            sortable: true,
        },
        {
            key: 'serial_number',
            label: 'Serial #',
            render: (value) => (
                <div className="font-mono text-sm">
                    {value || <span className="text-muted-foreground italic">N/A</span>}
                </div>
            ),
            sortable: true,
        },
        {
            key: 'description',
            label: 'Description',
            render: (value) => (
                <div className="max-w-xs truncate" title={value}>
                    {value}
                </div>
            ),
            sortable: true,
        },
        {
            key: 'manufacturer',
            label: 'Manufacturer',
            sortable: true,
        },
        {
            key: 'user',
            label: 'Assigned User',
            render: (value, row) => {
                if (!row.user) {
                    return <span className="text-muted-foreground italic">Unassigned</span>;
                }
                return (
                    <div>
                        <div className="font-medium">
                            {row.user.first_name} {row.user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            ID: {row.user.employee_id}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'department',
            label: 'Department',
            render: (value, row) => (
                <div>
                    {row.department?.department_name || <span className="text-muted-foreground italic">N/A</span>}
                </div>
            ),
        },
        {
            key: 'location',
            label: 'Location',
            render: (value, row) => (
                <div>
                    {row.location?.location_name || <span className="text-muted-foreground italic">N/A</span>}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value) => getStatusBadge(value),
            sortable: true,
        },
        {
            key: 'deleted_at',
            label: 'Archived At',
            render: (value) => (
                <div className="text-sm">
                    {value ? new Date(value).toLocaleDateString() : 'N/A'}
                </div>
            ),
            sortable: true,
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRestore(row.equipment_id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const handleSearch = useCallback((searchTerm: string) => {
        onSearch?.(searchTerm);
    }, [onSearch]);

    const handlePageChange = useCallback((page: number) => {
        onPageChange?.(page);
    }, [onPageChange]);

    const handlePerPageChange = useCallback((perPage: number) => {
        onPerPageChange?.(perPage);
    }, [onPerPageChange]);

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={archivedEquipment.data}
                loading={loading}
                pagination={{
                    current_page: archivedEquipment.current_page,
                    last_page: archivedEquipment.last_page,
                    per_page: archivedEquipment.per_page,
                    total: archivedEquipment.total,
                }}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchPlaceholder="Search archived equipment..."
                emptyStateMessage="No archived equipment found"
                emptyStateDescription="There are no archived equipment records to display."
            />
        </div>
    );
}
