import { PlantForm } from '@/components/admin/plants/plant-form';
import { PlantTable } from '@/components/admin/plants/plant-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Plant, type PaginationData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Plant Management',
        href: '/admin/plants',
    },
];

interface PlantsIndexProps {
    plants: PaginationData<Plant>;
    filters: {
        search?: string;
    };
}

export default function PlantsIndex({ plants: initialPlants, filters = {} }: PlantsIndexProps) {
    const { canManageUsers } = useRole();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
    });

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canManageUsers()) {
            router.visit('/dashboard');
        }
    }, [canManageUsers]);

    const handleFilterChange = () => {
        get(route('admin.plants.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const refreshPlants = () => {
        get(route('admin.plants.index'), {
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

    if (!canManageUsers()) {
        return null;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Plant Management" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Plant Management</h1>
                        <p className="text-muted-foreground">Manage plant locations and facilities</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Plant
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle>Add New Plant</DialogTitle>
                                <DialogDescription>
                                    Create a new plant. All fields marked with * are required.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-1">
                                <PlantForm
                                    onSuccess={() => {
                                        setIsAddDialogOpen(false);
                                        refreshPlants();
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
                            placeholder="Search plants by name..."
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Plants Table */}
                <PlantTable
                    plants={initialPlants}
                    onRefresh={refreshPlants}
                />

                {/* Pagination Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Showing {initialPlants.from || 0} to {initialPlants.to || 0} of {initialPlants.total} plants
                    </div>
                    <div>
                        Page {initialPlants.current_page} of {initialPlants.last_page}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
