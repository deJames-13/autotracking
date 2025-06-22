import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BatchDataTable, DataTableColumn, DataTableFilter } from '@/components/ui/batch-data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Department, type Equipment, type PaginationData, type Plant, type User } from '@/types';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { EquipmentDeleteDialog } from './equipment-delete-dialog';
import { EquipmentEditDialog } from './equipment-edit-dialog';
import { EquipmentViewDialog } from './equipment-view-dialog';

interface EquipmentTableProps {
    equipment: PaginationData<Equipment>;
    loading?: boolean;
    users: User[];
    plants: Plant[];
    departments: Department[];
    onRefresh?: () => void;
    onSearch?: (search: string) => void;
    onFilter?: (filters: Record<string, any>) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

export function EquipmentTable({
    equipment,
    loading = false,
    users,
    plants,
    departments,
    onRefresh,
    onSearch,
    onFilter,
    onPageChange,
    onPerPageChange,
}: EquipmentTableProps) {
    const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);

    const handleRefresh = () => {
        console.log('EquipmentTable: Refresh triggered');
        if (onRefresh) {
            onRefresh();
        } else {
            // Fallback to Inertia reload if no onRefresh provided
            router.reload({ only: ['equipment'] });
        }
    };

    const handleEditSuccess = () => {
        console.log('EquipmentTable: Edit success triggered');
        setEditingEquipment(null);
        handleRefresh();
    };

    const handleDeleteSuccess = () => {
        console.log('EquipmentTable: Delete success triggered');
        setDeletingEquipment(null);
        handleRefresh();
    };

    const handleBatchDelete = async (ids: any[], force: boolean = false): Promise<void> => {
        try {
            const response = await axios.delete(route('admin.equipment.batch-destroy'), {
                data: {
                    ids,
                    force: force ? 1 : 0
                }
            });

            if (response.data.success) {
                toast.success(`Successfully deleted ${response.data.deleted_count} equipment(s)`);

                // Show warnings for failed deletions if any
                if (response.data.failed_count > 0) {
                    toast.error(`Failed to delete ${response.data.failed_count} equipment(s) due to dependencies. Use force delete if needed.`);
                }

                // Use the same refresh logic as single delete
                handleRefresh();
            } else {
                toast.error(response.data.message || 'Failed to delete equipment');
            }
        } catch (error: any) {
            console.error('Error in batch delete:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to delete equipment. Please try again.');
            }
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'in_calibration':
                return 'secondary';
            case 'pending_calibration':
                return 'outline';
            default:
                return 'destructive';
        }
    };

    // Define DataTable columns
    const columns: DataTableColumn<Equipment>[] = [
        {
            key: 'equipment_id',
            label: 'ID',
            render: (value, row) => <div className="font-medium">{row.equipment_id}</div>,
            sortable: true,
            width: 'w-[100px]',
        },
        {
            key: 'recall_number',
            label: 'Recall Number',
            render: (value, row) => <div className="font-medium">{row.recall_number}</div>,
            sortable: true,
            width: 'w-[150px]',
        },
        {
            key: 'serial_number',
            label: 'Serial Number',
            render: (value, row) => <div className="text-sm">{row.serial_number || 'N/A'}</div>,
            sortable: true,
            width: 'w-[150px]',
        },
        {
            key: 'description',
            label: 'Description',
            render: (value, row) => (
                <div className="space-y-0.5">
                    <div className="max-w-[200px] truncate text-sm" title={row.description}>
                        {row.description}
                    </div>
                    {row.manufacturer && <div className="text-muted-foreground text-xs">{row.manufacturer}</div>}
                </div>
            ),
            sortable: true,
            width: 'w-[250px]',
        },
        {
            key: 'plant_name',
            label: 'Plant',
            render: (value, row) => <div className="text-sm">{row.plant?.plant_name || 'Not assigned'}</div>,
            sortable: true,
            width: 'w-[150px]',
        },
        {
            key: 'department_name',
            label: 'Department',
            render: (value, row) => <div className="text-sm">{row.department?.department_name || 'Not assigned'}</div>,
            sortable: true,
            width: 'w-[150px]',
        },
        {
            key: 'user_name',
            label: 'Assigned User',
            render: (value, row) => (
                <div className="text-sm">
                    {row.user ? (
                        <div>
                            <div className="font-medium">{row.user.full_name || `${row.user.first_name} ${row.user.last_name}`}</div>
                            <div className="text-muted-foreground text-xs">
                                ID: {row.user.employee_id}
                                {row.user.role && <span> • {row.user.role.role_name.replace('_', ' ')}</span>}
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[200px]',
        },
        {
            key: 'status',
            label: 'Status',
            render: (value, row) => <Badge variant={getStatusBadgeVariant(row.status)}>{row.status?.replace('_', ' ').toUpperCase()}</Badge>,
            sortable: true,
            width: 'w-[120px]',
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (value, row) => <div className="text-muted-foreground text-sm">{new Date(row.created_at).toLocaleDateString()}</div>,
            sortable: true,
            width: 'w-[100px]',
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
                        <DropdownMenuItem onClick={() => setViewingEquipment(row)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingEquipment(row)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingEquipment(row)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            width: 'w-[70px]',
        },
    ];

    // Define DataTable filters
    const filters: DataTableFilter[] = [
        {
            key: 'employee_id',
            label: 'Assigned User',
            type: 'select',
            options: [
                { value: 'all', label: 'All Users' },
                { value: 'unassigned', label: 'Unassigned' },
                ...users.map((user) => ({
                    value: user.employee_id.toString(),
                    label: user.full_name || `${user.first_name} ${user.last_name}`,
                })),
            ],
        },
        {
            key: 'plant_id',
            label: 'Plant',
            type: 'select',
            options: [
                { value: 'all', label: 'All Plants' },
                ...plants.map((plant) => ({
                    value: plant.plant_id.toString(),
                    label: plant.plant_name,
                })),
            ],
        },
        {
            key: 'department_id',
            label: 'Department',
            type: 'select',
            options: [
                { value: 'all', label: 'All Departments' },
                ...departments.map((dept) => ({
                    value: dept.department_id.toString(),
                    label: dept.department_name,
                })),
            ],
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'in_calibration', label: 'In Calibration' },
                { value: 'pending_calibration', label: 'Pending Calibration' },
                { value: 'inactive', label: 'Inactive' },
            ],
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

    const handleFilter = useCallback(
        (filters: Record<string, any>) => {
            if (onFilter) {
                onFilter(filters);
            }
        },
        [onFilter],
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
        <>
            <BatchDataTable
                data={equipment.data}
                columns={columns}
                filters={filters}
                loading={loading}
                batchDelete={true}
                entityName="equipment"
                pagination={{
                    current_page: equipment.current_page,
                    last_page: equipment.last_page,
                    per_page: equipment.per_page,
                    total: equipment.total,
                }}
                onSearch={handleSearch}
                onFilter={handleFilter}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                onBatchDelete={handleBatchDelete}
                searchable={true}
                filterable={true}
                emptyMessage="No equipment found."
                rowKey="equipment_id"
            />

            {/* Equipment Dialogs */}
            <EquipmentViewDialog equipment={viewingEquipment} open={!!viewingEquipment} onOpenChange={(open) => !open && setViewingEquipment(null)} />

            <EquipmentEditDialog
                equipment={editingEquipment}
                users={users}
                open={!!editingEquipment}
                onOpenChange={(open) => !open && setEditingEquipment(null)}
                onSuccess={handleEditSuccess}
            />

            <EquipmentDeleteDialog
                equipment={deletingEquipment}
                open={!!deletingEquipment}
                onOpenChange={(open) => !open && setDeletingEquipment(null)}
                onSuccess={handleDeleteSuccess}
            />
        </>
    );
}
