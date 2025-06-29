import { PlantForm } from '@/components/admin/plants/plant-form';
import { PlantTable } from '@/components/admin/plants/plant-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ImportModal } from '@/components/ui/import-modal';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginationData, type Plant } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Archive, Plus, Search, Upload } from 'lucide-react';
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
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Use live page data instead of initial props
    const { props } = usePage<PlantsIndexProps>();
    const plants = props.plants;

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

            <div className="space-y-6 p-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words max-w-full">
                            Plant Management
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">Manage plant locations and facilities</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => router.visit(route('admin.plants.archived'))}
                        >
                            <Archive className="mr-2 h-4 w-4" />
                            View Archived
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setIsImportModalOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Plants
                        </Button>
                        
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Plant
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="flex max-h-[85vh] max-w-md flex-col overflow-hidden">
                                <DialogHeader className="flex-shrink-0">
                                    <DialogTitle>Add New Plant</DialogTitle>
                                    <DialogDescription>Create a new plant. All fields marked with * are required.</DialogDescription>
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
                </div>

                {/* Filters */}
                {/* <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                        <Input
                            placeholder="Search plants by name..."
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div> */}

                {/* Plants Table */}
                <PlantTable plants={plants} onRefresh={refreshPlants} />

                {/* Import Modal */}
                <ImportModal
                    isOpen={isImportModalOpen}
                    onOpenChange={setIsImportModalOpen}
                    title="Import Plants"
                    description="Import plants from an Excel file. Download the template to see the required format."
                    importEndpoint={route('admin.plants.import')}
                    templateEndpoint={route('admin.plants.download-template')}
                    onSuccess={refreshPlants}
                />

                {/* Pagination Info */}
                {/* <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <div>
                        Showing {plants.from || 0} to {plants.to || 0} of {plants.total} plants
                    </div>
                    <div>
                        Page {plants.current_page} of {plants.last_page}
                    </div>
                </div> */}
            </div>
        </AppLayout>
    );
}
