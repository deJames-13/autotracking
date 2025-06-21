import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type PaginationData, type Plant } from '@/types';
import { MoreHorizontal, RotateCcw } from 'lucide-react';
import { useCallback } from 'react';

interface ArchivedPlantsTableProps {
    archivedPlants: PaginationData<Plant>;
    loading?: boolean;
    onRestore: (id: string) => void;
    onSearch?: (search: string) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    onRefresh?: () => void;
}

export function ArchivedPlantsTable({
    archivedPlants,
    loading = false,
    onRestore,
    onSearch,
    onPageChange,
    onPerPageChange,
    onRefresh,
}: ArchivedPlantsTableProps) {
    const columns: DataTableColumn<Plant>[] = [
        {
            key: 'plant_id',
            label: 'Plant ID',
            render: (value) => (
                <div className="font-medium">
                    {value}
                </div>
            ),
            sortable: true,
        },
        {
            key: 'plant_name',
            label: 'Plant Name',
            render: (value) => (
                <div className="font-medium">
                    {value}
                </div>
            ),
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
                        <DropdownMenuItem onClick={() => onRestore(row.plant_id)}>
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
                data={archivedPlants.data}
                loading={loading}
                pagination={{
                    currentPage: archivedPlants.current_page,
                    totalPages: archivedPlants.last_page,
                    perPage: archivedPlants.per_page,
                    total: archivedPlants.total,
                    from: archivedPlants.from,
                    to: archivedPlants.to,
                }}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchPlaceholder="Search archived plants..."
                emptyStateMessage="No archived plants found"
                emptyStateDescription="There are no archived plant records to display."
            />
        </div>
    );
}
