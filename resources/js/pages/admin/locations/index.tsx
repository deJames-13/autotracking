import { LocationForm } from '@/components/admin/locations/location-form';
import { LocationTable } from '@/components/admin/locations/location-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Department, type Location, type PaginationData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Location Management',
        href: '/admin/locations',
    },
];

interface LocationsIndexProps {
    locations: PaginationData<Location>;
    departments: Department[];
    filters: {
        search?: string;
        department_id?: number;
    };
}

export default function LocationsIndex({ locations: initialLocations, departments, filters = {} }: LocationsIndexProps) {
    const { canManageUsers } = useRole();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        department_id: filters.department_id || '',
    });

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canManageUsers()) {
            router.visit('/dashboard');
        }
    }, [canManageUsers]);

    const handleFilterChange = () => {
        get(route('admin.locations.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const refreshLocations = () => {
        get(route('admin.locations.index'), {
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
        if (data.department_id !== filters.department_id) {
            handleFilterChange();
        }
    }, [data.department_id]);

    if (!canManageUsers()) {
        return null;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Location Management" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Location Management</h1>
                        <p className="text-muted-foreground">Manage system locations and organizational spaces</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Location
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle>Add New Location</DialogTitle>
                                <DialogDescription>
                                    Create a new location. All fields marked with * are required.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-1">
                                <LocationForm
                                    departments={departments}
                                    onSuccess={() => {
                                        setIsAddDialogOpen(false);
                                        refreshLocations();
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
                            placeholder="Search locations by name..."
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex gap-2">
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

                {/* Locations Table */}
                <LocationTable
                    locations={initialLocations}
                    departments={departments}
                    onRefresh={refreshLocations}
                />

                {/* Pagination Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Showing {initialLocations.from || 0} to {initialLocations.to || 0} of {initialLocations.total} locations
                    </div>
                    <div>
                        Page {initialLocations.current_page} of {initialLocations.last_page}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
