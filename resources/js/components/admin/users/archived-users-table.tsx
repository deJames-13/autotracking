import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type PaginationData, type User } from '@/types';
import { MoreHorizontal, RotateCcw } from 'lucide-react';
import { useCallback, useState } from 'react';

interface ArchivedUsersTableProps {
    archivedUsers: PaginationData<User>;
    loading?: boolean;
    onRestore: (id: string) => void;
    onSearch?: (search: string) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    onRefresh?: () => void;
}

export function ArchivedUsersTable({
    archivedUsers,
    loading = false,
    onRestore,
    onSearch,
    onPageChange,
    onPerPageChange,
    onRefresh,
}: ArchivedUsersTableProps) {
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const getRoleBadge = (role: any) => {
        if (!role) return <Badge variant="secondary">No Role</Badge>;
        
        const roleConfig = {
            admin: { variant: 'destructive' as const, label: 'Admin' },
            technician: { variant: 'default' as const, label: 'Technician' },
            employee: { variant: 'secondary' as const, label: 'Employee' },
        };

        const config = roleConfig[role.role_name as keyof typeof roleConfig] || { variant: 'secondary' as const, label: role.role_name };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const columns: DataTableColumn<User>[] = [
        {
            key: 'employee_id',
            label: 'Employee ID',
            render: (value) => (
                <div className="font-medium">
                    {value}
                </div>
            ),
            sortable: true,
        },
        {
            key: 'first_name',
            label: 'Name',
            render: (value, row) => (
                <div>
                    <div className="font-medium">
                        {row.first_name} {row.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {row.email}
                    </div>
                </div>
            ),
            sortable: true,
        },
        {
            key: 'role',
            label: 'Role',
            render: (value) => getRoleBadge(value),
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
            key: 'plant',
            label: 'Plant',
            render: (value, row) => (
                <div>
                    {row.plant?.plant_name || <span className="text-muted-foreground italic">N/A</span>}
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
                <DropdownMenu
                    open={openDropdownId === row.employee_id}
                    onOpenChange={(open) => {
                        if (open) {
                            setOpenDropdownId(row.employee_id);
                        } else {
                            // Close dropdown with delay to prevent recursion
                            setTimeout(() => setOpenDropdownId(null), 100);
                        }
                    }}
                >
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onFocus={(e) => e.stopPropagation()}
                            onBlur={(e) => e.stopPropagation()}
                        >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => {
                            e.preventDefault();
                            setOpenDropdownId(null);
                        }}
                        onPointerDownOutside={(e) => {
                            e.preventDefault();
                            setOpenDropdownId(null);
                        }}
                        onInteractOutside={(e) => {
                            e.preventDefault();
                            setOpenDropdownId(null);
                        }}
                    >
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                // Longer timeout to prevent recursion
                                setTimeout(() => onRestore(row.employee_id), 150);
                            }}
                            onSelect={(e) => {
                                e.preventDefault();
                            }}
                        >
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
                data={archivedUsers.data}
                loading={loading}
                pagination={{
                    current_page: archivedUsers.current_page,
                    last_page: archivedUsers.last_page,
                    per_page: archivedUsers.per_page,
                    total: archivedUsers.total,
                }}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchPlaceholder="Search archived users..."
                emptyStateMessage="No archived users found"
                emptyStateDescription="There are no archived user records to display."
            />
        </div>
    );
}
