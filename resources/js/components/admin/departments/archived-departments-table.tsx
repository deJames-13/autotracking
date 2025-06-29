import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Department, type PaginationData } from '@/types';
import { MoreHorizontal, RotateCcw } from 'lucide-react';
import { useCallback } from 'react';

interface ArchivedDepartmentsTableProps {
    archivedDepartments: PaginationData<Department>;
    loading?: boolean;
    onRestore: (id: string) => void;
    onSearch?: (search: string) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    onRefresh?: () => void;
}

export function ArchivedDepartmentsTable({
    archivedDepartments,
    loading = false,
    onRestore,
    onSearch,
    onPageChange,
    onPerPageChange,
    onRefresh,
}: ArchivedDepartmentsTableProps) {
    const columns: DataTableColumn<Department>[] = [
        {
            key: 'department_id',
            label: 'Department ID',
            render: (value) => (
                <div className="font-medium">
                    {value}
                </div>
            ),
            sortable: true,
        },
        {
            key: 'department_name',
            label: 'Department Name',
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
                        <DropdownMenuItem onClick={() => onRestore(row.department_id)}>
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
                data={archivedDepartments.data}
                loading={loading}
                pagination={{
                    current_page: archivedDepartments.current_page,
                    last_page: archivedDepartments.last_page,
                    per_page: archivedDepartments.per_page,
                    total: archivedDepartments.total,
                }}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchPlaceholder="Search archived departments..."
                emptyStateMessage="No archived departments found"
                emptyStateDescription="There are no archived department records to display."
            />
        </div>
    );
}
