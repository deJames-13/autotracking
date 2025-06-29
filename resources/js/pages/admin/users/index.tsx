import { UserForm } from '@/components/admin/users/user-form';
import { UserTable } from '@/components/admin/users/user-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/modal';
import { ImportModal } from '@/components/ui/import-modal';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Department, type Plant, type Role, type User } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Plus, Archive, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: '/admin/users',
    },
];

interface UsersIndexProps {
    roles: Role[];
    departments: Department[];
    plants: Plant[];
}

export default function UsersIndex({ roles, departments, plants }: UsersIndexProps) {
    const { canManageUsers } = useRole();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    const [filters, setFilters] = useState<Record<string, any>>({});

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canManageUsers()) {
            router.visit('/dashboard');
        }
    }, []);

    const fetchUsers = useCallback(async (params: Record<string, any> = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();

            // Add parameters with proper defaults
            queryParams.append('page', params.page?.toString() || '1');
            queryParams.append('per_page', params.per_page?.toString() || '10');

            // Add filters if provided
            if (params.filters) {
                Object.keys(params.filters).forEach((key) => {
                    const value = params.filters[key];
                    if (value && value !== 'all') {
                        queryParams.append(key, value);
                    }
                });
            }

            // Add search if provided
            if (params.search) {
                queryParams.append('search', params.search);
            }

            // Add sorting if provided
            if (params.sort_by) {
                queryParams.append('sort_by', params.sort_by);
            }
            if (params.sort_direction) {
                queryParams.append('sort_direction', params.sort_direction);
            }

            const response = await axios.get(`/admin/users/table-data?${queryParams.toString()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = response.data;
            setUsers(data.data || []);
            setPagination({
                current_page: data.meta.current_page || 1,
                last_page: data.meta.last_page || 1,
                per_page: data.meta.per_page || 10,
                total: data.meta.total || 0,
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch - only run once
    useEffect(() => {
        if (canManageUsers()) {
            fetchUsers();
        }
    }, []);

    // Handle DataTable search
    const handleSearch = useCallback(
        (search: string) => {
            fetchUsers({ ...filters, search, page: 1 });
        },
        [filters],
    );

    // Handle DataTable filters
    const handleFilter = useCallback((newFilters: Record<string, any>) => {
        setFilters(newFilters);
        fetchUsers({ filters: newFilters, page: 1 });
    }, []);

    // Handle DataTable pagination
    const handlePageChange = useCallback(
        (page: number) => {
            fetchUsers({ ...filters, page });
        },
        [filters],
    );

    const handlePerPageChange = useCallback(
        (perPage: number) => {
            fetchUsers({ ...filters, per_page: perPage, page: 1 });
        },
        [filters],
    );

    // Refresh users after actions
    const refreshUsers = useCallback(() => {
        fetchUsers({ ...filters });
    }, [filters]);

    if (!canManageUsers()) {
        return null;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="space-y-6 p-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words max-w-full">
                            User Management
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">Manage system users and their permissions</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.visit(route('admin.users.archived'))}
                            className="w-full sm:w-auto"
                        >
                            <Archive className="mr-2 h-4 w-4" />
                            View Archived
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setIsImportModalOpen(true)}
                            className="w-full sm:w-auto"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Users
                        </Button>

                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>

                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogContent className="flex max-h-[85vh] w-full max-w-[90vw] flex-col overflow-hidden lg:max-w-[80vw] xl:max-w-[72rem]">
                                <DialogHeader className="flex-shrink-0">
                                    <DialogTitle>Add New User</DialogTitle>
                                    <DialogDescription>Create a new user account. All fields marked with * are required.</DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto px-1 py-4">
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
                </div>

                {/* Users Table */}
                <UserTable
                    users={{
                        data: users,
                        current_page: pagination.current_page,
                        last_page: pagination.last_page,
                        per_page: pagination.per_page,
                        total: pagination.total,
                    }}
                    loading={loading}
                    roles={roles}
                    departments={departments}
                    plants={plants}
                    onRefresh={refreshUsers}
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />

                {/* Import Modal */}
                <ImportModal
                    isOpen={isImportModalOpen}
                    onOpenChange={setIsImportModalOpen}
                    title="Import Users"
                    description="Import users from an Excel file. You can specify custom employee IDs or leave blank for auto-generation. Download the template to see the required format."
                    importEndpoint={route('admin.users.import')}
                    templateEndpoint={route('admin.users.download-template')}
                    onSuccess={refreshUsers}
                />
            </div>
        </AppLayout>
    );
}
