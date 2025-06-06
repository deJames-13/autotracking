import { EquipmentForm } from '@/components/admin/equipment/equipment-form';
import { EquipmentTable } from '@/components/admin/equipment/equipment-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Equipment, type User, type Plant, type Department } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Equipment Management',
        href: '/admin/equipment',
    },
];

interface EquipmentIndexProps {
    users: User[];
    plants: Plant[];
    departments: Department[];
}

export default function EquipmentIndex({ users, plants, departments }: EquipmentIndexProps) {
    const { canManageEquipment } = useRole();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0
    });
    const [filters, setFilters] = useState<Record<string, any>>({});

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canManageEquipment()) {
            router.visit('/dashboard');
        }
    }, []);

    const fetchEquipment = useCallback(async (params: Record<string, any> = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();

            // Add parameters with proper defaults
            queryParams.append('page', params.page?.toString() || '1');
            queryParams.append('per_page', params.per_page?.toString() || '15');

            // Add filters if provided
            if (params.filters) {
                Object.keys(params.filters).forEach(key => {
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

            const response = await axios.get(`/admin/equipment/table-data?${queryParams.toString()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = response.data;
            setEquipment(data.data || []);
            setPagination({
                current_page: data.meta.current_page || 1,
                last_page: data.meta.last_page || 1,
                per_page: data.meta.per_page || 15,
                total: data.meta.total || 0
            });
        } catch (error) {
            console.error('Error fetching equipment:', error);
            setEquipment([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch - only run once
    useEffect(() => {
        if (canManageEquipment()) {
            fetchEquipment();
        }
    }, []);

    // Handle DataTable search
    const handleSearch = useCallback((search: string) => {
        fetchEquipment({ ...filters, search, page: 1 });
    }, [filters]);

    // Handle DataTable filters
    const handleFilter = useCallback((newFilters: Record<string, any>) => {
        setFilters(newFilters);
        fetchEquipment({ filters: newFilters, page: 1 });
    }, []);

    // Handle DataTable pagination
    const handlePageChange = useCallback((page: number) => {
        fetchEquipment({ ...filters, page });
    }, [filters]);

    const handlePerPageChange = useCallback((perPage: number) => {
        fetchEquipment({ ...filters, per_page: perPage, page: 1 });
    }, [filters]);

    // Refresh equipment after actions
    const refreshEquipment = useCallback(() => {
        fetchEquipment({ ...filters });
    }, [filters]);

    if (!canManageEquipment()) {
        return null;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Equipment Management" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Equipment Management</h1>
                        <p className="text-muted-foreground">Manage equipment inventory and assignments</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Equipment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-full max-w-[90vw] lg:max-w-[80vw] xl:max-w-[72rem] max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle>Add New Equipment</DialogTitle>
                                <DialogDescription>
                                    Create a new equipment record. All fields marked with * are required.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-1 py-4">
                                <EquipmentForm
                                    users={users}
                                    onSuccess={() => {
                                        setIsAddDialogOpen(false);
                                        refreshEquipment();
                                    }}
                                    onCancel={() => setIsAddDialogOpen(false)}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Equipment Table */}
                <EquipmentTable
                    equipment={{
                        data: equipment,
                        current_page: pagination.current_page,
                        last_page: pagination.last_page,
                        per_page: pagination.per_page,
                        total: pagination.total
                    }}
                    loading={loading}
                    users={users}
                    plants={plants}
                    departments={departments}
                    onRefresh={refreshEquipment}
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
}
