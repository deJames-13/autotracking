import { Button } from '@/components/ui/button';
import { BatchDataTable, DataTableColumn, DataTableFilter } from '@/components/ui/batch-data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type PaginationData, type Plant } from '@/types';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { PlantDeleteDialog } from './plant-delete-dialog';
import { PlantEditDialog } from './plant-edit-dialog';
import { PlantViewDialog } from './plant-view-dialog';

interface PlantTableProps {
    plants: PaginationData<Plant>;
    loading?: boolean;
    onRefresh?: () => void;
    onSearch?: (search: string) => void;
    onFilter?: (filters: Record<string, unknown>) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

export function PlantTable({
    plants,
    loading = false,
    onRefresh,
    onSearch,
    onFilter,
    onPageChange,
    onPerPageChange,
}: PlantTableProps) {
    const [viewingPlant, setViewingPlant] = useState<Plant | null>(null);
    const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
    const [deletingPlant, setDeletingPlant] = useState<Plant | null>(null);

    const handleRefresh = () => {
        console.log('PlantTable: Refresh triggered');
        if (onRefresh) {
            onRefresh();
        } else {
            // Fallback to Inertia reload if no onRefresh provided
            router.reload({
                only: ['plants'],
                preserveState: true,
                preserveScroll: true
            });
        }
    };

    const handleEditSuccess = () => {
        console.log('PlantTable: Edit success triggered');
        // Clear editing state first
        setEditingPlant(null);

        // Delay refresh to prevent race conditions
        setTimeout(() => {
            handleRefresh();
        }, 100);
    };

    const handleDeleteSuccess = () => {
        console.log('PlantTable: Delete success triggered');
        // Clear deleting state first
        setDeletingPlant(null);

        // Delay refresh to prevent race conditions
        setTimeout(() => {
            handleRefresh();
        }, 100);
    };

    const handleBatchDelete = async (ids: any[], force: boolean = false): Promise<void> => {
        try {
            const response = await axios.delete(route('admin.plants.batch-destroy'), {
                data: {
                    ids,
                    force: force ? 1 : 0
                }
            });

            if (response.data.success) {
                toast.success(`Successfully deleted ${response.data.deleted_count} plant(s)`);

                // Show warnings for failed deletions if any
                if (response.data.failed_count > 0) {
                    toast.error(`Failed to delete ${response.data.failed_count} plant(s) due to dependencies. Use force delete if needed.`);
                }

                // Use the same refresh logic as single delete
                handleRefresh();
            } else {
                toast.error(response.data.message || 'Failed to delete plants');
            }
        } catch (error: any) {
            console.error('Error in batch delete:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to delete plants. Please try again.');
            }
        }
    };

    // Define DataTable columns
    const columns: DataTableColumn<Plant>[] = [
        {
            key: 'plant_id',
            label: 'ID',
            sortable: true,
            width: 'w-[100px]',
        },
        {
            key: 'plant_name',
            label: 'Plant Name',
            sortable: true,
            filterable: true,
            width: 'w-[200px]',
            render: (value: string) => (
                <div className="font-medium">{value}</div>
            ),
        },
        {
            key: 'address',
            label: 'Address',
            width: 'w-[300px]',
            render: (value: string) => (
                <div className="text-sm text-muted-foreground truncate">
                    {value || 'No address provided'}
                </div>
            ),
        },
        {
            key: 'telephone',
            label: 'Telephone',
            width: 'w-[150px]',
            render: (value: string) => (
                <div className="text-sm">
                    {value || 'N/A'}
                </div>
            ),
        },
        {
            key: 'users',
            label: 'Users',
            width: 'w-[120px]',
            render: (_, plant: Plant) => (
                <div className="text-muted-foreground text-sm">
                    {plant.users?.length || 0} users
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
            render: (_, plant: Plant) => (
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
                                setTimeout(() => setViewingPlant(plant), 0);
                            }}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTimeout(() => setEditingPlant(plant), 0);
                            }}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTimeout(() => setDeletingPlant(plant), 0);
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
            key: 'plant_name',
            label: 'Plant Name',
            type: 'text',
            placeholder: 'Search by plant name...',
        },
        {
            key: 'address',
            label: 'Address',
            type: 'text',
            placeholder: 'Search by address...',
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
                data={plants.data}
                columns={columns}
                filters={filters}
                loading={loading}
                batchDelete={true}
                entityName="plants"
                pagination={{
                    current_page: plants.current_page,
                    last_page: plants.last_page,
                    per_page: plants.per_page,
                    total: plants.total,
                }}
                onSearch={handleSearch}
                onFilter={handleFilter}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                onBatchDelete={handleBatchDelete}
                searchable={true}
                filterable={true}
                emptyMessage="No plants found."
                rowKey="plant_id"
            />

            {/* Plant Dialogs - Conditional rendering to prevent focus conflicts */}
            {viewingPlant && (
                <PlantViewDialog
                    plant={viewingPlant}
                    open={!!viewingPlant}
                    onOpenChange={(open) => {
                        if (!open) {
                            setTimeout(() => setViewingPlant(null), 200);
                        }
                    }}
                />
            )}

            {editingPlant && (
                <PlantEditDialog
                    plant={editingPlant}
                    open={!!editingPlant}
                    onOpenChange={(open) => {
                        if (!open) {
                            setTimeout(() => setEditingPlant(null), 200);
                        }
                    }}
                    onSuccess={handleEditSuccess}
                />
            )}

            {deletingPlant && (
                <PlantDeleteDialog
                    plant={deletingPlant}
                    open={!!deletingPlant}
                    onOpenChange={(open) => {
                        if (!open) {
                            setTimeout(() => setDeletingPlant(null), 200);
                        }
                    }}
                    onSuccess={handleDeleteSuccess}
                />
            )}
        </>
    );
}
