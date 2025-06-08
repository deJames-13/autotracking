import { LocationForm } from '@/components/admin/locations/location-form';
import { LocationTable } from '@/components/admin/locations/location-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Department, type Location, type PaginationData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
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

    // Use live page data instead of initial props
    const { props } = usePage<LocationsIndexProps>();
    const locations = props.locations;

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

            <div className="space-y-6 p-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words max-w-full">
                            Location Management
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">Manage system locations and organizational spaces</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Location
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="flex max-h-[85vh] max-w-md flex-col overflow-hidden">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle>Add New Location</DialogTitle>
                                <DialogDescription>Create a new location. All fields marked with * are required.</DialogDescription>
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
                        <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                        <Input
                            placeholder="Search locations by name..."
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Select
                            value={data.department_id.toString()}
                            onValueChange={(value) => setData('department_id', value === 'all' ? '' : value)}
                        >
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
                <LocationTable locations={locations} departments={departments} onRefresh={refreshLocations} />

                {/* Pagination Info */}
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <div>
                        Showing {locations.from || 0} to {locations.to || 0} of {locations.total} locations
                    </div>
                    <div>
                        Page {locations.current_page} of {locations.last_page}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
