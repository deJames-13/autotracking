import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn, DataTableFilter } from '@/components/ui/data-table';
import { type Department, type Plant, type Role, type User, type PaginationData } from '@/types';
import { router } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil, Trash2, Download } from 'lucide-react';
import { useState, useCallback } from 'react';
import { UserForm } from './user-form';
import Barcode from 'react-barcode';
import { toast } from 'react-hot-toast';

interface UserTableProps {
    users: PaginationData<User>;
    loading?: boolean;
    roles: Role[];
    departments: Department[];
    plants: Plant[];
    onRefresh?: () => void;
    onSearch?: (search: string) => void;
    onFilter?: (filters: Record<string, any>) => void;
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
    onPerPageChange
}: UserTableProps) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const handleEditSuccess = () => {
        console.log('UserTable: Edit success triggered');
        setEditingUser(null);
        router.reload({ only: ['users'] });
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
                router.reload({ only: ['users'] });
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
            }
        });
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
        return roleName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Handle barcode download
    const handleDownloadBarcode = () => {
        try {
            // Find the barcode SVG element
            const barcodeSvg = document.querySelector('.user-barcode-container svg') as SVGSVGElement;
            if (!barcodeSvg) {
                toast.error('Barcode not found');
                return;
            }

            // Get SVG dimensions
            const svgRect = barcodeSvg.getBoundingClientRect();
            const svgWidth = svgRect.width || 300;
            const svgHeight = svgRect.height || 100;

            // Create a canvas to convert SVG to PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                toast.error('Could not create download canvas');
                return;
            }

            // Set canvas size with some padding
            canvas.width = svgWidth + 20;
            canvas.height = svgHeight + 20;

            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Convert SVG to data URL
            const svgData = new XMLSerializer().serializeToString(barcodeSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // Create an image element to load the SVG
            const img = new Image();
            img.onload = () => {
                // Draw the SVG image onto the canvas with padding
                ctx.drawImage(img, 10, 10, svgWidth, svgHeight);

                // Convert canvas to blob and download
                canvas.toBlob((blob) => {
                    if (!blob) {
                        toast.error('Could not generate barcode image');
                        return;
                    }

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `user-barcode-${viewingUser?.employee_id || 'unknown'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    URL.revokeObjectURL(svgUrl);

                    toast.success('Barcode downloaded successfully');
                }, 'image/png');
            };

            img.onerror = () => {
                toast.error('Failed to load barcode for download');
                URL.revokeObjectURL(svgUrl);
            };

            img.src = svgUrl;
        } catch (error) {
            console.error('Error downloading barcode:', error);
            toast.error('Failed to download barcode');
        }
    };

    // Define DataTable columns
    const columns: DataTableColumn<User>[] = [
        {
            key: 'name',
            label: 'Name',
            render: (value, row) => (
                <div className="space-y-0.5">
                    <div className="font-medium">
                        {row.full_name || `${row.first_name} ${row.last_name}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        ID: {row.employee_id}
                    </div>
                </div>
            ),
            sortable: true,
            width: 'w-[200px]'
        },
        {
            key: 'email',
            label: 'Email',
            render: (value, row) => (
                <div className="text-sm">
                    {row.email || (
                        <span className="text-muted-foreground italic">No email</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[200px]'
        },
        {
            key: 'role',
            label: 'Role',
            render: (value, row) => (
                <Badge
                    variant="secondary"
                    className={getRoleBadgeColor(row.role?.role_name || '')}
                >
                    {formatRoleName(row.role?.role_name || 'Unknown')}
                </Badge>
            ),
            sortable: true,
            width: 'w-[120px]'
        },
        {
            key: 'department',
            label: 'Department',
            render: (value, row) => (
                <div className="text-sm">
                    {row.department?.department_name || (
                        <span className="text-muted-foreground italic">No department</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[150px]'
        },
        {
            key: 'plant',
            label: 'Plant',
            render: (value, row) => (
                <div className="text-sm">
                    {row.plant?.plant_name || (
                        <span className="text-muted-foreground italic">No plant</span>
                    )}
                </div>
            ),
            sortable: true,
            width: 'w-[120px]'
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (value, row) => (
                <div className="text-sm text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString()}
                </div>
            ),
            sortable: true,
            width: 'w-[100px]'
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
                        <DropdownMenuItem onClick={() => setViewingUser(row)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingUser(row)}>
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
            width: 'w-[70px]'
        }
    ];

    // Define DataTable filters
    const filters: DataTableFilter[] = [
        {
            key: 'role_name',
            label: 'Role',
            type: 'select',
            options: [
                { value: 'all', label: 'All Roles' },
                ...roles.map(role => ({
                    value: role.role_name,
                    label: formatRoleName(role.role_name)
                }))
            ]
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
            ]
        },
        {
            key: 'plant_id',
            label: 'Plant',
            type: 'select',
            options: [
                { value: 'all', label: 'All Plants' },
                ...plants.map(plant => ({
                    value: plant.plant_id.toString(),
                    label: plant.plant_name
                }))
            ]
        }
    ];

    // Handle DataTable events
    const handleSearch = useCallback((search: string) => {
        if (onSearch) {
            onSearch(search);
        }
    }, [onSearch]);

    const handleFilter = useCallback((filters: Record<string, any>) => {
        if (onFilter) {
            onFilter(filters);
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
            <DataTable
                data={users.data}
                columns={columns}
                filters={filters}
                loading={loading}
                pagination={{
                    current_page: users.current_page,
                    last_page: users.last_page,
                    per_page: users.per_page,
                    total: users.total
                }}
                onSearch={handleSearch}
                onFilter={handleFilter}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                searchable={true}
                filterable={true}
                emptyMessage="No users found."
                rowKey="employee_id"
            />

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="w-full max-w-[90vw] lg:max-w-[80vw] xl:max-w-[72rem] max-h-[85vh] overflow-scroll flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information. Leave password blank to keep the current password.
                        </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <UserForm
                            user={editingUser}
                            roles={roles}
                            departments={departments}
                            plants={plants}
                            onSuccess={handleEditSuccess}
                            onCancel={() => setEditingUser(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* View User Dialog */}
            <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
                <DialogContent className="max-w-lg overflow-scroll">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {viewingUser && (
                        <div className="space-y-6">
                            {/* Employee ID Barcode */}
                            {viewingUser.employee_id && (
                                <div className="flex flex-col items-center mb-4">
                                    <div className="user-barcode-container">
                                        <Barcode
                                            value={String(viewingUser.employee_id)}
                                            width={2}
                                            height={60}
                                            displayValue={true}
                                            fontSize={16}
                                            margin={8}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-muted-foreground">Employee ID Barcode</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDownloadBarcode}
                                            className="h-6 px-2"
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                                    <p className="text-sm">{viewingUser.employee_id}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                    <p className="text-sm">
                                        {viewingUser.full_name || `${viewingUser.first_name} ${viewingUser.middle_name || ''} ${viewingUser.last_name}`.trim()}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                                    <p className="text-sm">{viewingUser.email || 'No email'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                                    <p className="text-sm">
                                        <Badge
                                            variant="secondary"
                                            className={getRoleBadgeColor(viewingUser.role?.role_name || '')}
                                        >
                                            {formatRoleName(viewingUser.role?.role_name || 'Unknown')}
                                        </Badge>
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                                    <p className="text-sm">{viewingUser.department?.department_name || 'No department'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Plant</label>
                                    <p className="text-sm">{viewingUser.plant?.plant_name || 'No plant'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                                    <p className="text-sm">
                                        <Badge variant={viewingUser.email_verified_at ? "default" : "secondary"}>
                                            {viewingUser.email_verified_at ? 'Verified' : 'Not verified'}
                                        </Badge>
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                    <p className="text-sm">
                                        {new Date(viewingUser.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Archive Confirmation Dialog */}
            <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Archive User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to archive this user? The user will be hidden from the main list but can be restored later.
                        </DialogDescription>
                    </DialogHeader>
                    {deletingUser && (
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <div className="font-medium">
                                    {deletingUser.full_name || `${deletingUser.first_name} ${deletingUser.last_name}`}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {deletingUser.email && (
                                        <div>{deletingUser.email}</div>
                                    )}
                                    <div>
                                        Role: {formatRoleName(deletingUser.role?.role_name || '')}
                                    </div>
                                    <div>
                                        ID: {deletingUser.employee_id}
                                    </div>
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
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
