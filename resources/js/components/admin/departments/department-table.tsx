import { Button } from '@/components/ui/button';
import { BatchDataTable, DataTableColumn, DataTableFilter } from '@/components/ui/batch-data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Department, type PaginationData } from '@/types';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { DepartmentDeleteDialog } from './department-delete-dialog';
import { DepartmentEditDialog } from './department-edit-dialog';
import { DepartmentViewDialog } from './department-view-dialog';

interface DepartmentTableProps {
    departments: PaginationData<Department>;
    loading?: boolean;
    onRefresh?: () => void;
    onSearch?: (search: string) => void;
    onFilter?: (filters: Record<string, unknown>) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

export function DepartmentTable({
    departments,
    loading = false,
    onRefresh,
    onSearch,
    onFilter,
    onPageChange,
    onPerPageChange,
}: DepartmentTableProps) {
    const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

    const handleRefresh = () => {
        console.log('DepartmentTable: Refresh triggered');
        if (onRefresh) {
            onRefresh();
        } else {
            // Fallback to Inertia reload if no onRefresh provided
            router.reload({
                only: ['departments'],
                preserveState: true,
                preserveScroll: true
            });
        }
    };

    const handleEditSuccess = () => {
        console.log('DepartmentTable: Edit success triggered');
        // Clear editing state first
        setEditingDepartment(null);

        // Delay refresh to prevent race conditions
        setTimeout(() => {
            handleRefresh();
        }, 100);
    };

    const handleDeleteSuccess = () => {
        console.log('DepartmentTable: Delete success triggered');
        // Clear deleting state first
        setDeletingDepartment(null);

        // Delay refresh to prevent race conditions
        setTimeout(() => {
            handleRefresh();
        }, 100);
    };

    const handleBatchDelete = async (ids: any[], force: boolean = false): Promise<void> => {
        try {
            const response = await axios.delete(route('admin.departments.batch-destroy'), {
                data: {
                    ids,
                    force: force ? 1 : 0
                }
            });

            if (response.data.success) {
                toast.success(`Successfully deleted ${response.data.deleted_count} department(s)`);

                // Show warnings for failed deletions if any
                if (response.data.failed_count > 0) {
                    toast.error(`Failed to delete ${response.data.failed_count} department(s) due to dependencies. Use force delete if needed.`);
                }

                // Use the same refresh logic as single delete
                handleRefresh();
            } else {
                toast.error(response.data.message || 'Failed to delete departments');
            }
        } catch (error: any) {
            console.error('Error in batch delete:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to delete departments. Please try again.');
            }
        }
    };

    // Define DataTable columns
    const columns: DataTableColumn<Department>[] = [
        {
            key: 'department_id',
            label: 'ID',
            sortable: true,
            width: 'w-[100px]',
        },
        {
            key: 'department_name',
            label: 'Department Name',
            sortable: true,
            filterable: true,
            width: 'w-[300px]',
            render: (value: string) => (
                <div className="font-medium">{value}</div>
            ),
        },
        {
            key: 'users',
            label: 'Users',
            width: 'w-[120px]',
            render: (_, department: Department) => (
                <div className="text-muted-foreground text-sm">
                    {department.users?.length || 0} users
                </div>
            ),
        },
        {
            key: 'locations',
            label: 'Locations',
            width: 'w-[120px]',
            render: (_, department: Department) => (
                <div className="text-muted-foreground text-sm">
                    {department.locations?.length || 0} locations
                </div>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            sortable: true,
            width: 'w-[150px]',
            render: (value: string) => (
                <div className="text-muted-foreground text-sm">
                    {new Date(value).toLocaleDateString()}
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            width: 'w-[70px]',
            render: (_, department: Department) => (
                <DropdownMenu>
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
                    <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTimeout(() => setViewingDepartment(department), 0);
                            }}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTimeout(() => setEditingDepartment(department), 0);
                            }}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTimeout(() => setDeletingDepartment(department), 0);
                            }}
                            className="text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    // Define DataTable filters
    const filters: DataTableFilter[] = [
        {
            key: 'department_name',
            label: 'Department Name',
            type: 'text',
            placeholder: 'Search by department name...',
        },
    ];

    // Handle DataTable events
    const handleSearch = useCallback((search: string) => {
        if (onSearch) {
            onSearch(search);
        }
    }, [onSearch]);

    const handleFilter = useCallback((filterData: Record<string, any>) => {
        if (onFilter) {
            onFilter(filterData);
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
        <>
            <BatchDataTable
                data={departments.data}
                columns={columns}
                filters={filters}
                loading={loading}
                batchDelete={true}
                entityName="departments"
                pagination={{
                    current_page: departments.current_page,
                    last_page: departments.last_page,
                    per_page: departments.per_page,
                    total: departments.total,
                }}
                onSearch={handleSearch}
                onFilter={handleFilter}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                onBatchDelete={handleBatchDelete}
                searchable={true}
                filterable={true}
                emptyMessage="No departments found."
                rowKey="department_id"
            />

            {/* Department Dialogs - Conditional rendering to prevent focus conflicts */}
            {viewingDepartment && (
                <DepartmentViewDialog
                    department={viewingDepartment}
                    open={!!viewingDepartment}
                    onOpenChange={(open) => {
                        if (!open) {
                            setTimeout(() => setViewingDepartment(null), 200);
                        }
                    }}
                />
            )}

            {editingDepartment && (
                <DepartmentEditDialog
                    department={editingDepartment}
                    open={!!editingDepartment}
                    onOpenChange={(open) => {
                        if (!open) {
                            setTimeout(() => setEditingDepartment(null), 200);
                        }
                    }}
                    onSuccess={handleEditSuccess}
                />
            )}

            {deletingDepartment && (
                <DepartmentDeleteDialog
                    department={deletingDepartment}
                    open={!!deletingDepartment}
                    onOpenChange={(open) => {
                        if (!open) {
                            setTimeout(() => setDeletingDepartment(null), 200);
                        }
                    }}
                    onSuccess={handleDeleteSuccess}
                />
            )}
        </>
    );
}
