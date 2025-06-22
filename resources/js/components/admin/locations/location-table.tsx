import { Button } from '@/components/ui/button';
import { BatchDataTable, DataTableColumn, DataTableFilter } from '@/components/ui/batch-data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Department, type Location, type PaginationData } from '@/types';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { LocationDeleteDialog } from './location-delete-dialog';
import { LocationEditDialog } from './location-edit-dialog';
import { LocationViewDialog } from './location-view-dialog';

interface LocationTableProps {
    locations: PaginationData<Location>;
    departments: Department[];
    loading?: boolean;
    onRefresh?: () => void;
    onSearch?: (search: string) => void;
    onFilter?: (filters: Record<string, unknown>) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

export function LocationTable({
    locations,
    departments,
    loading = false,
    onRefresh,
    onSearch,
    onFilter,
    onPageChange,
    onPerPageChange,
}: LocationTableProps) {
    const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

    const handleRefresh = () => {
        console.log('LocationTable: Refresh triggered');
        if (onRefresh) {
            onRefresh();
        } else {
            // Fallback to Inertia reload if no onRefresh provided
            router.reload({ only: ['locations'] });
        }
    };

    const handleEditSuccess = () => {
        console.log('LocationTable: Edit success triggered');
        setEditingLocation(null);
        handleRefresh();
    };

    const handleDeleteSuccess = () => {
        console.log('LocationTable: Delete success triggered');
        setDeletingLocation(null);
        handleRefresh();
    };

    const handleBatchDelete = async (ids: any[], force: boolean = false): Promise<void> => {
        try {
            const response = await axios.delete(route('admin.locations.batch-destroy'), {
                data: {
                    ids,
                    force: force ? 1 : 0
                }
            });

            if (response.data.success) {
                toast.success(`Successfully deleted ${response.data.deleted_count} location(s)`);

                // Show warnings for failed deletions if any
                if (response.data.failed_count > 0) {
                    toast.error(`Failed to delete ${response.data.failed_count} location(s) due to dependencies. Use force delete if needed.`);
                }

                // Use the same refresh logic as single delete
                handleRefresh();
            } else {
                toast.error(response.data.message || 'Failed to delete locations');
            }
        } catch (error: any) {
            console.error('Error in batch delete:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to delete locations. Please try again.');
            }
        }
    };

    // Define DataTable columns
    const columns: DataTableColumn<Location>[] = [
        {
            key: 'location_id',
            label: 'ID',
            sortable: true,
            width: 'w-[100px]',
        },
        {
            key: 'location_name',
            label: 'Location Name',
            sortable: true,
            filterable: true,
            width: 'w-[250px]',
            render: (value: string) => (
                <div className="font-medium">{value}</div>
            ),
        },
        {
            key: 'department_name',
            label: 'Department',
            sortable: true,
            filterable: true,
            width: 'w-[200px]',
            render: (_, location: Location) => (
                <div>{location.department?.department_name || 'N/A'}</div>
            ),
        },
        {
            key: 'equipment',
            label: 'Equipment',
            width: 'w-[120px]',
            render: (_, location: Location) => (
                <div className="text-muted-foreground text-sm">
                    {location.equipment?.length || 0} items
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
            render: (_, location: Location) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingLocation(location)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingLocation(location)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingLocation(location)} className="text-destructive">
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
            key: 'location_name',
            label: 'Location Name',
            type: 'text',
            placeholder: 'Search by location name...',
        },
        {
            key: 'department_id',
            label: 'Department',
            type: 'select',
            options: [
                { value: 'all', label: 'All Departments' },
                ...departments.map(dept => ({
                    value: dept.department_id.toString(),
                    label: dept.department_name
                }))
            ],
            placeholder: 'Filter by department...',
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
                data={locations.data}
                columns={columns}
                filters={filters}
                loading={loading}
                batchDelete={true}
                entityName="locations"
                pagination={{
                    current_page: locations.current_page,
                    last_page: locations.last_page,
                    per_page: locations.per_page,
                    total: locations.total,
                }}
                onSearch={handleSearch}
                onFilter={handleFilter}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                onBatchDelete={handleBatchDelete}
                searchable={true}
                filterable={true}
                emptyMessage="No locations found."
                rowKey="location_id"
            />

            {/* Location Dialogs */}
            <LocationViewDialog location={viewingLocation} open={!!viewingLocation} onOpenChange={(open) => !open && setViewingLocation(null)} />

            <LocationEditDialog
                location={editingLocation}
                departments={departments}
                open={!!editingLocation}
                onOpenChange={(open) => !open && setEditingLocation(null)}
                onSuccess={handleEditSuccess}
            />

            <LocationDeleteDialog
                location={deletingLocation}
                open={!!deletingLocation}
                onOpenChange={(open) => !open && setDeletingLocation(null)}
                onSuccess={handleDeleteSuccess}
            />
        </>
    );
}
