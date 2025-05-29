import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type Department, type Plant, type Role, type User, type PaginationData } from '@/types';
import { router } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { UserForm } from './user-form';

interface UserTableProps {
    users: PaginationData<User>;
    roles: Role[];
    departments: Department[];
    plants: Plant[];
    onRefresh?: () => void;
}

export function UserTable({ users, roles, departments, plants, onRefresh }: UserTableProps) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const handleEditSuccess = () => {
        console.log('UserTable: Edit success triggered');
        setEditingUser(null);
        router.reload({ only: ['users'] });
    };

    const handleDelete = (user: User) => {
        console.log('UserTable: Deleting user', user.employee_id);
        
        router.delete(route('admin.users.destroy', user.employee_id), {
            onSuccess: () => {
                console.log('UserTable: Delete success triggered');
                setDeletingUser(null);
                router.reload({ only: ['users'] });
            },
            onError: (errors) => {
                console.error('Error deleting user:', errors);
            }
        });
    };

    const getRoleBadgeColor = (roleName: string) => {
        switch (roleName) {
            case 'admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'personnel_in_charge':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
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

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead className="w-[200px]">Email</TableHead>
                            <TableHead className="w-[120px]">Role</TableHead>
                            <TableHead className="w-[150px]">Department</TableHead>
                            <TableHead className="w-[120px]">Plant</TableHead>
                            <TableHead className="w-[100px]">Created</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.data.map((user) => (
                                <TableRow key={user.employee_id}>
                                    <TableCell className="font-medium">
                                        <div className="space-y-0.5">
                                            <div className="font-medium">
                                                {user.full_name || `${user.first_name} ${user.last_name}`}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                ID: {user.employee_id}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {user.email || (
                                                <span className="text-muted-foreground italic">No email</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={getRoleBadgeColor(user.role?.role_name || '')}
                                        >
                                            {formatRoleName(user.role?.role_name || 'Unknown')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {user.department?.department_name || (
                                                <span className="text-muted-foreground italic">No department</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {user.plant?.plant_name || (
                                                <span className="text-muted-foreground italic">No plant</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setViewingUser(user)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingUser(user)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto overflow-scroll">
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
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
                                    Delete User
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
