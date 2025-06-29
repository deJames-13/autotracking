import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Location, type PaginationData } from '@/types';
import { MoreHorizontal, RotateCcw } from 'lucide-react';
import { useCallback } from 'react';

interface ArchivedLocationsTableProps {
    archivedLocations: PaginationData<Location>;
    loading?: boolean;
    onRestore: (id: string) => void;
    onSearch?: (search: string) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    onRefresh?: () => void;
}

export function ArchivedLocationsTable({
    archivedLocations,
    loading = false,
    onRestore,
    onSearch,
    onPageChange,
    onPerPageChange,
    onRefresh,
}: ArchivedLocationsTableProps) {
    const columns: DataTableColumn<Location>[] = [
        {
            key: 'location_id',
            label: 'Location ID',
            render: (value) => (
                <div className="font-medium">
                    {value}
                </div>
            ),
            sortable: true,
        },
        {
            key: 'location_name',
            label: 'Location Name',
            render: (value) => (
                <div className="font-medium">
                    {value}
                </div>
            ),
            sortable: true,
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
                        <DropdownMenuItem onClick={() => onRestore(row.location_id)}>
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
                data={archivedLocations.data}
                loading={loading}
                pagination={{
                    current_page: archivedLocations.current_page,
                    last_page: archivedLocations.last_page,
                    per_page: archivedLocations.per_page,
                    total: archivedLocations.total,
                }}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchPlaceholder="Search archived locations..."
                emptyStateMessage="No archived locations found"
                emptyStateDescription="There are no archived location records to display."
            />
        </div>
    );
}
