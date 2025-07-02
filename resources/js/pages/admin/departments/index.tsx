import { DepartmentForm } from '@/components/admin/departments/department-form';
import { DepartmentTable } from '@/components/admin/departments/department-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImportModal } from '@/components/ui/import-modal';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Department, type PaginationData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Archive, Plus, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

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
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });
    const [searchFilters, setSearchFilters] = useState<Record<string, any>>({});

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canManageUsers()) {
            router.visit('/dashboard');
        }
    }, []);

    const fetchDepartments = useCallback(async (params: Record<string, any> = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();

            // Add parameters with proper defaults
            queryParams.append('page', params.page?.toString() || '1');
            queryParams.append('per_page', params.per_page?.toString() || '15');

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

            const response = await axios.get(`/admin/departments/table-data?${queryParams.toString()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = response.data;
            setDepartments(data.data || []);
            setPagination({
                current_page: data.meta.current_page || 1,
                last_page: data.meta.last_page || 1,
                per_page: data.meta.per_page || 15,
                total: data.meta.total || 0,
            });
        } catch (error) {
            console.error('Error fetching departments:', error);
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch - only run once
    useEffect(() => {
        if (canManageUsers()) {
            fetchDepartments();
        }
    }, []);

    // Handle DataTable search
    const handleSearch = useCallback(
        (search: string) => {
            fetchDepartments({ ...searchFilters, search, page: 1 });
        },
        [searchFilters],
    );

    // Handle DataTable filters
    const handleFilter = useCallback((newFilters: Record<string, any>) => {
        setSearchFilters(newFilters);
        fetchDepartments({ filters: newFilters, page: 1 });
    }, []);

    // Handle DataTable pagination
    const handlePageChange = useCallback(
        (page: number) => {
            fetchDepartments({ ...searchFilters, page });
        },
        [searchFilters],
    );

    const handlePerPageChange = useCallback(
        (perPage: number) => {
            fetchDepartments({ ...searchFilters, per_page: perPage, page: 1 });
        },
        [searchFilters],
    );

    // Refresh departments after actions
    const refreshDepartments = useCallback(() => {
        fetchDepartments({ ...searchFilters });
    }, [searchFilters]);

    if (!canManageUsers()) {
        return null;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Department Management" />

            <div className="space-y-6 p-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words max-w-full">
                            Department Management
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">Manage system departments and organizational structure</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => router.visit(route('admin.departments.archived'))}
                        >
                            <Archive className="mr-2 h-4 w-4" />
                            View Archived
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setIsImportModalOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Departments
                        </Button>
                        
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
                </div>

                {/* Departments Table */}
                <DepartmentTable
                    departments={{
                        data: departments,
                        current_page: pagination.current_page,
                        last_page: pagination.last_page,
                        per_page: pagination.per_page,
                        total: pagination.total,
                    }}
                    loading={loading}
                    onRefresh={refreshDepartments}
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />

                {/* Import Modal */}
                <ImportModal
                    isOpen={isImportModalOpen}
                    onOpenChange={setIsImportModalOpen}
                    title="Import Departments"
                    description="Import departments from an Excel file. Download the template to see the required format."
                    importEndpoint={route('admin.departments.import')}
                    templateEndpoint={route('admin.departments.download-template')}
                    onSuccess={refreshDepartments}
                />
            </div>
        </AppLayout>
    );
}
