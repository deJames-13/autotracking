import { UserForm } from '@/components/admin/users/user-form';
import { UserTable } from '@/components/admin/users/user-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Department, type Plant, type Role, type User, type PaginationData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: '/admin/users',
    },
];

interface UsersIndexProps {
    users: PaginationData<User>;
    roles: Role[];
    departments: Department[];
    plants: Plant[];
    filters: {
        search?: string;
        role_id?: number;
        department_id?: number;
    };
}

export default function UsersIndex({ users: initialUsers, roles, departments, plants, filters }: UsersIndexProps) {
    const { canManageUsers } = useRole();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        role_id: filters.role_id || '',
        department_id: filters.department_id || '',
    });

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canManageUsers()) {
            router.visit('/dashboard');
        }
    }, [canManageUsers]);

    const handleFilterChange = () => {
        get(route('admin.users.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const refreshUsers = () => {
        get(route('admin.users.index'), {
            preserveState: true,
            replace: true,
        });
    };

    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            if (data.search !== filters.search) {
                handleFilterChange();
            }
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [data.search]);

    useEffect(() => {
        if (data.role_id !== filters.role_id || data.department_id !== filters.department_id) {
            handleFilterChange();
        }
    }, [data.role_id, data.department_id]);

    if (!canManageUsers()) {
        return null; // or loading spinner
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">Manage system users and their permissions</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>
                                    Create a new user account. All fields marked with * are required.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-1">
                                <UserForm
                                    roles={roles}
                                    departments={departments}
                                    plants={plants}
                                    onSuccess={() => {
                                        setIsAddDialogOpen(false);
                                        refreshUsers();
                                    }}
                                    onCancel={() => setIsAddDialogOpen(false)}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users by name or email..."
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Select value={data.role_id.toString()} onValueChange={(value) => setData('role_id', value === 'all' ? '' : value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {roles.map((role) => (
                                    <SelectItem key={role.role_id} value={role.role_id.toString()}>
                                        {role.role_name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={data.department_id.toString()} onValueChange={(value) => setData('department_id', value === 'all' ? '' : value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map((department) => (
                                    <SelectItem key={department.department_id} value={department.department_id.toString()}>
                                        {department.department_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Users Table */}
                <UserTable
                    users={initialUsers}
                    roles={roles}
                    departments={departments}
                    plants={plants}
                    onRefresh={refreshUsers}
                />

                {/* Pagination Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Showing {initialUsers.from || 0} to {initialUsers.to || 0} of {initialUsers.total} users
                    </div>
                    <div>
                        Page {initialUsers.current_page} of {initialUsers.last_page}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
