import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BatchDataTable, DataTableColumn, DataTableFilter } from '@/components/ui/batch-data-table';
import { CodeDisplay } from '@/components/ui/code-display';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/simple-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Department, type PaginationData, type Plant, type Role, type User } from '@/types';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { UserForm } from './user-form';

interface UserTableProps {
    users: PaginationData<User>;
    loading?: boolean;
    roles: Role[];
    departments: Department[];
    plants: Plant[];
    onRefresh?: () => void;
    onSearch?: (search: string) => void;
    onFilter?: (filters: Record<string, unknown>) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

export function UserTable({
    users,
    loading = false,
    roles,
    departments,
    plants,
    onRefresh,
    onSearch,
    onFilter,
    onPageChange,
    onPerPageChange,
}: UserTableProps) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const handleRefresh = () => {
        console.log('UserTable: Refresh triggered');
        if (onRefresh) {
            onRefresh();
        } else {
            // Fallback to Inertia reload if no onRefresh provided
            router.reload({
                only: ['users'],
                preserveState: true,
                preserveScroll: true
            });
        }
    };

    const handleEditSuccess = () => {
        console.log('UserTable: Edit success triggered');
        // Clear editing state first
        setEditingUser(null);

        // Delay refresh to prevent race conditions
        setTimeout(() => {
            handleRefresh();
        }, 100);
    };

    const handleDelete = (user: User) => {
        console.log('UserTable: Archiving user', user.employee_id);

        router.delete(route('admin.users.destroy', user.employee_id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('UserTable: Archive success triggered');
                setDeletingUser(null);
                toast.success('User archived successfully');

                // Delay refresh to prevent race conditions
                setTimeout(() => {
                    handleRefresh();
                }, 100);
            },
            onError: (errors) => {
                console.error('Error archiving user:', errors);

                // Handle validation errors
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat();
                    if (errorMessages.length > 0) {
                        toast.error(errorMessages[0] as string);
                        return;
                    }
                }

                // Generic fallback error
                toast.error('Failed to archive user. Please try again.');
            },
        });
    };

    const handleBatchDelete = async (ids: any[], force: boolean = false): Promise<void> => {
        try {
            const response = await axios.delete(route('admin.users.batch-destroy'), {
                data: {
                    ids,
                    force: force ? 1 : 0
                }
            });

            if (response.data.success) {
                toast.success(`Successfully deleted ${response.data.deleted_count} user(s)`);

                // Show warnings for failed deletions if any
                if (response.data.failed_count > 0) {
                    toast.error(`Failed to delete ${response.data.failed_count} user(s) due to dependencies. Use force delete if needed.`);
                }

                // Use the same refresh logic as single delete
                handleRefresh();
            } else {
                toast.error(response.data.message || 'Failed to delete users');
            }
        } catch (error: any) {
            console.error('Error in batch delete:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to delete users. Please try again.');
            }
        }
    };

    const getRoleBadgeColor = (roleName: string) => {
        switch (roleName) {
            case 'admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'technician':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'employee':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const formatRoleName = (roleName: string) => {
        return roleName.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    // Remove the old barcode download handler since it's now handled by CodeDisplay component

    // Define DataTable columns
    const columns: DataTableColumn<User>[] = [
        {
            key: 'name',
            label: 'Name',
            render: (value, row) => (
                <div className="space-y-0.5">
                    <div className="font-medium">{row.full_name || `${row.first_name} ${row.last_name}`}</div>
                    <div className="text-muted-foreground text-xs">ID: {row.employee_id}</div>
                </div>
            ),
            sortable: true,
            width: 'w-[200px]',
        },
        {
            key: 'email',
            label: 'Email',
            render: (value, row) => <div className="text-sm">{row.email || <span className="text-muted-foreground italic">No email</span>}</div>,
            sortable: true,
            width: 'w-[200px]',
        },
        {
            key: 'role',
            label: 'Role',
            render: (value, row) => (
                <Badge variant="secondary" className={getRoleBadgeColor(row.role?.role_name || '')}>
                    {formatRoleName(row.role?.role_name || 'Unknown')}
                </Badge>
            ),
            sortable: true,
            width: 'w-[120px]',
        },
        {
            key: 'department',
            label: 'Department',
            render: (value, row) => (
                <div className="text-sm">
                    {row.department?.department_name || <span className="text-muted-foreground italic">No department</span>}
                </div>
            ),
            sortable: true,
            width: 'w-[150px]',
        },
        {
            key: 'plant',
            label: 'Plant',
            render: (value, row) => (
                <div className="text-sm">{row.plant?.plant_name || <span className="text-muted-foreground italic">No plant</span>}</div>
            ),
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
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                        >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => setViewingUser(row)}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setEditingUser(row)}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeletingUser(row)}
                            className="text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Archive
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
            key: 'role_name',
            label: 'Role',
            type: 'select',
            options: [
                { value: 'all', label: 'All Roles' },
                ...roles.map((role) => ({
                    value: role.role_name,
                    label: formatRoleName(role.role_name),
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
        (filters: Record<string, unknown>) => {
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
                data={users.data}
                columns={columns}
                filters={filters}
                loading={loading}
                batchDelete={true}
                entityName="users"
                pagination={{
                    current_page: users.current_page,
                    last_page: users.last_page,
                    per_page: users.per_page,
                    total: users.total,
                }}
                onSearch={handleSearch}
                onFilter={handleFilter}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                onBatchDelete={handleBatchDelete}
                searchable={true}
                filterable={true}
                emptyMessage="No users found."
                rowKey="employee_id"
            />

            {/* Edit User Dialog - Conditional rendering */}
            {editingUser && (
                <Dialog open={!!editingUser} onOpenChange={(open) => {
                    if (!open) {
                        setEditingUser(null);
                    }
                }}>
                    <DialogContent
                        className="flex max-h-[85vh] w-full max-w-[90vw] flex-col overflow-scroll lg:max-w-[80vw] xl:max-w-[72rem]"
                    >
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>Update user information. Leave password blank to keep the current password.</DialogDescription>
                        </DialogHeader>
                        <UserForm
                            user={editingUser}
                            roles={roles}
                            departments={departments}
                            plants={plants}
                            onSuccess={handleEditSuccess}
                            onCancel={() => setEditingUser(null)}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* View User Dialog - Conditional rendering */}
            {viewingUser && (
                <Dialog open={!!viewingUser} onOpenChange={(open) => {
                    if (!open) {
                        setViewingUser(null);
                    }
                }}>
                    <DialogContent
                        className="max-w-lg overflow-scroll"
                    >
                        <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            {/* Employee ID QR Code / Barcode */}
                            {viewingUser.employee_id && (
                                <CodeDisplay
                                    value={String(viewingUser.employee_id)}
                                    label="Employee ID"
                                    filename={String(viewingUser.employee_id)}
                                    containerClassName="user-code-container"
                                    showDownload={true}
                                    format="CODE128"
                                    width={2}
                                    height={60}
                                    fontSize={16}
                                    margin={8}
                                    qrSize={128}
                                />
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-muted-foreground text-sm font-medium">Employee ID</label>
                                    <p className="text-sm">{viewingUser.employee_id}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground text-sm font-medium">Full Name</label>
                                    <p className="text-sm">
                                        {viewingUser.full_name ||
                                            `${viewingUser.first_name} ${viewingUser.middle_name || ''} ${viewingUser.last_name}`.trim()}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground text-sm font-medium">Email</label>
                                    <p className="text-sm">{viewingUser.email || 'No email'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground text-sm font-medium">Role</label>
                                    <p className="text-sm">
                                        <Badge variant="secondary" className={getRoleBadgeColor(viewingUser.role?.role_name || '')}>
                                            {formatRoleName(viewingUser.role?.role_name || 'Unknown')}
                                        </Badge>
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground text-sm font-medium">Department</label>
                                    <p className="text-sm">{viewingUser.department?.department_name || 'No department'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground text-sm font-medium">Plant</label>
                                    <p className="text-sm">{viewingUser.plant?.plant_name || 'No plant'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground text-sm font-medium">Email Verified</label>
                                    <p className="text-sm">
                                        <Badge variant={viewingUser.email_verified_at ? 'default' : 'secondary'}>
                                            {viewingUser.email_verified_at ? 'Verified' : 'Not verified'}
                                        </Badge>
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground text-sm font-medium">Created</label>
                                    <p className="text-sm">{new Date(viewingUser.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Archive Confirmation Dialog - Conditional rendering */}
            {deletingUser && (
                <Dialog open={!!deletingUser} onOpenChange={(open) => {
                    if (!open) {
                        setDeletingUser(null);
                    }
                }}>
                    <DialogContent
                        className="max-w-md"
                    >
                        <DialogHeader>
                            <DialogTitle>Archive User</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to archive this user? The user will be hidden from the main list but can be restored later.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="bg-muted/50 rounded-lg border p-4">
                                <div className="font-medium">{deletingUser.full_name || `${deletingUser.first_name} ${deletingUser.last_name}`}</div>
                                <div className="text-muted-foreground mt-1 text-sm">
                                    {deletingUser.email && <div>{deletingUser.email}</div>}
                                    <div>Role: {formatRoleName(deletingUser.role?.role_name || '')}</div>
                                    <div>ID: {deletingUser.employee_id}</div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setDeletingUser(null)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => handleDelete(deletingUser)}>
                                    Archive User
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
