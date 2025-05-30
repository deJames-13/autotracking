import { EquipmentForm } from '@/components/admin/equipment/equipment-form';
import { EquipmentTable } from '@/components/admin/equipment/equipment-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Equipment, type User, type PaginationData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Equipment Management',
        href: '/admin/equipment',
    },
];

interface EquipmentIndexProps {
    equipment: PaginationData<Equipment>;
    users: User[];
    filters: {
        search?: string;
        employee_id?: number;
        manufacturer?: string;
    };
}

export default function EquipmentIndex({ equipment: initialEquipment, users, filters = {} }: EquipmentIndexProps) {
    const { canManageEquipment } = useRole();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Use live page data instead of initial props
    const { props } = usePage<EquipmentIndexProps>();
    const equipment = props.equipment;

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        employee_id: filters.employee_id || '',
        manufacturer: filters.manufacturer || '',
    });

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canManageEquipment()) {
            router.visit('/dashboard');
        }
    }, [canManageEquipment]);

    const handleFilterChange = () => {
        get(route('admin.equipment.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const refreshEquipment = () => {
        get(route('admin.equipment.index'), {
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
        if (data.employee_id !== filters.employee_id || data.manufacturer !== filters.manufacturer) {
            handleFilterChange();
        }
    }, [data.employee_id, data.manufacturer]);

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
                            <div className="flex-1 overflow-y-auto px-1">
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

                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by serial number, description, or manufacturer..."
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Select
                            value={data.employee_id ? data.employee_id.toString() : 'all'}
                            onValueChange={(value) => setData('employee_id', value === 'all' ? '' : value)}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by user" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {users.map((user) => (
                                    <SelectItem key={user.employee_id} value={user.employee_id.toString()}>
                                        {user.full_name || `${user.first_name} ${user.last_name}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Filter by manufacturer"
                            value={data.manufacturer}
                            onChange={(e) => setData('manufacturer', e.target.value)}
                            className="w-[200px]"
                        />
                    </div>
                </div>

                {/* Equipment Table */}
                <EquipmentTable
                    equipment={equipment}
                    users={users}
                    onRefresh={refreshEquipment}
                />

                {/* Pagination Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Showing {equipment.from || 0} to {equipment.to || 0} of {equipment.total} equipment
                    </div>
                    <div>
                        Page {equipment.current_page} of {equipment.last_page}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
