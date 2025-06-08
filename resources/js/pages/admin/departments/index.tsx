import { DepartmentForm } from '@/components/admin/departments/department-form';
import { DepartmentTable } from '@/components/admin/departments/department-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Department, type PaginationData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Department Management',
        href: '/admin/departments',
    },
];

interface DepartmentsIndexProps {
    departments: PaginationData<Department>;
    filters: {
        search?: string;
    };
}

export default function DepartmentsIndex({ departments: initialDepartments, filters = {} }: DepartmentsIndexProps) {
    const { canManageUsers } = useRole();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Use live page data instead of initial props
    const { props } = usePage<DepartmentsIndexProps>();
    const departments = props.departments;

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
        get(route('admin.departments.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const refreshDepartments = () => {
        get(route('admin.departments.index'), {
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
            <Head title="Department Management" />

            <div className="space-y-6 p-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words max-w-full">
                            Department Management
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">Manage system departments and organizational structure</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Department
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="flex max-h-[85vh] max-w-md flex-col overflow-hidden">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle>Add New Department</DialogTitle>
                                <DialogDescription>Create a new department. All fields marked with * are required.</DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-1">
                                <DepartmentForm
                                    onSuccess={() => {
                                        setIsAddDialogOpen(false);
                                        refreshDepartments();
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
                            placeholder="Search departments by name..."
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Departments Table */}
                <DepartmentTable departments={departments} onRefresh={refreshDepartments} />

                {/* Pagination Info */}
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <div>
                        Showing {departments.from || 0} to {departments.to || 0} of {departments.total} departments
                    </div>
                    <div>
                        Page {departments.current_page} of {departments.last_page}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
