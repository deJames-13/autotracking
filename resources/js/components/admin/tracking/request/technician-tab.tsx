import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumn, DataTableFilter } from '@/components/ui/data-table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRole } from '@/hooks/use-role';
import { Department, User } from '@/types';
import axios from 'axios';
import { Info } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TechnicianTabProps {
    data: User | null;
    onChange: (technician: User | null) => void;
    errors: Record<string, string>;
}

const TechnicianTab: React.FC<TechnicianTabProps> = ({ data, onChange, errors = {} }) => {
    const { isTechnician, user } = useRole();
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    // Auto-populate technician if current user is a technician
    useEffect(() => {
        if (isTechnician() && user && !data) {
            const currentUserAsTechnician: User = {
                employee_id: user.employee_id,
                first_name: user.first_name,
                last_name: user.last_name,
                full_name: user.full_name || `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: user.role,
                department: user.department,
                plant: user.plant,
                // Add other required User properties
                role_id: user.role_id,
                department_id: user.department_id,
                plant_id: user.plant_id,
                password: '',
                created_at: user.created_at || '',
                updated_at: user.updated_at || '',
                email_verified_at: user.email_verified_at || null,
            };
            onChange(currentUserAsTechnician);
        }
    }, [isTechnician, user, data, onChange]);

    // Fetch technicians with pagination (only if not a technician user)
    const fetchTechnicians = useCallback(
        async (params: Record<string, any> = {}) => {
            // Skip fetching if current user is a technician (they can only select themselves)
            if (isTechnician()) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const queryParams = new URLSearchParams();

                // Always filter for technicians only
                queryParams.append('role_name', 'technician');
                queryParams.append('limit', params.per_page?.toString() || '15');

                if (params.page) {
                    queryParams.append('page', params.page.toString());
                }
                if (params.search) {
                    queryParams.append('search', params.search);
                }
                if (params.department_id && params.department_id !== 'all') {
                    queryParams.append('department_id', params.department_id);
                }

                const response = await axios.get(`/admin/users?${queryParams.toString()}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                const userData = response.data.data;
                setTechnicians(userData.data || []);
                setPagination({
                    current_page: userData.current_page || 1,
                    last_page: userData.last_page || 1,
                    per_page: userData.per_page || 15,
                    total: userData.total || 0,
                });
                setDepartments(response.data.departments || []);
            } catch (error) {
                console.error('Error fetching technicians:', error);
                setTechnicians([]);
            } finally {
                setLoading(false);
            }
        },
        [isTechnician],
    );

    // Initial fetch
    useEffect(() => {
        fetchTechnicians();
    }, []);

    // Define DataTable columns
    const columns: DataTableColumn<User>[] = [
        {
            key: 'selection',
            label: 'Select',
            render: (value, row) => <RadioGroupItem value={row.employee_id.toString()} id={`tech-${row.employee_id}`} />,
            width: 'w-16',
        },
        {
            key: 'name',
            label: 'Name',
            render: (value, row) => (
                <div>
                    <div className="font-medium">{row.full_name || `${row.first_name} ${row.last_name}`}</div>
                    <div className="text-muted-foreground text-sm">{row.email}</div>
                </div>
            ),
            sortable: true,
        },
        {
            key: 'role',
            label: 'Role',
            render: (value, row) => <Badge variant="secondary">{row.role?.role_name || 'Not assigned'}</Badge>,
        },
        {
            key: 'department',
            label: 'Department',
            render: (value, row) => row.department?.department_name || 'Not assigned',
            sortable: true,
        },
        {
            key: 'plant',
            label: 'Plant',
            render: (value, row) => row.plant?.plant_name || 'Not assigned',
        },
    ];

    // Define DataTable filters
    const filters: DataTableFilter[] = [
        {
            key: 'department_id',
            label: 'Department',
            type: 'select',
            options: [
                { value: 'all', label: 'All Departments' },
                ...departments.map((dept) => ({
                    value: dept.department_id.toString(),
                    label: dept.department_name,
                })),
            ],
        },
    ];

    // Handle DataTable events
    const handleSearch = (search: string) => {
        fetchTechnicians({ search, page: 1 });
    };

    const handleFilter = (filters: Record<string, any>) => {
        fetchTechnicians({ ...filters, page: 1 });
    };

    const handlePageChange = (page: number) => {
        fetchTechnicians({ page });
    };

    const handlePerPageChange = (perPage: number) => {
        fetchTechnicians({ per_page: perPage, page: 1 });
    };

    // Check for technician selection error
    const hasError = !!errors.technician;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Select Technician</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Show auto-assignment message for technician users */}
                    {isTechnician() && (
                        <Alert className="mb-4">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                As a Technician, you are automatically assigned to this request. The technician selection is disabled.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Show current technician selection if user is a technician */}
                    {isTechnician() && data && (
                        <div className="bg-muted/50 rounded-md border p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{data.full_name || `${data.first_name} ${data.last_name}`}</div>
                                    <div className="text-muted-foreground text-sm">{data.email}</div>
                                    <div className="text-muted-foreground text-xs">
                                        {data.department?.department_name} - {data.plant?.plant_name}
                                    </div>
                                </div>
                                <Badge variant="secondary">{data.role?.role_name || 'Technician'}</Badge>
                            </div>
                        </div>
                    )}

                    {/* Show technician selection table for non-technician users */}
                    {!isTechnician() && (
                        <div className={cn(
                            hasError ? 'border-destructive rounded-md border p-4' : '',
                            'overflow-x-auto bg-white dark:bg-[#18181b] rounded-md'
                        )}>
                            <RadioGroup
                                value={data?.employee_id?.toString() ?? ''}
                                onValueChange={(value) => {
                                    const selectedTech = technicians.find((t) => t.employee_id.toString() === value);
                                    onChange(selectedTech || null);
                                }}
                            >
                                <div className="min-w-[400px] md:min-w-0">
                                    <DataTable
                                        data={technicians}
                                        columns={columns}
                                        loading={loading}
                                        pagination={pagination}
                                        filters={filters}
                                        onSearch={handleSearch}
                                        onFilter={handleFilter}
                                        onPageChange={handlePageChange}
                                        onPerPageChange={handlePerPageChange}
                                        searchable={true}
                                        filterable={true}
                                        emptyMessage="No technicians found matching your criteria."
                                        searchDebounceMs={500}
                                        rowKey="employee_id"
                                    />
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {/* Display validation error */}
                    {errors.technician && <p className="text-destructive mt-2 text-sm">{errors.technician}</p>}
                </CardContent>
            </Card>
        </div>
    );
};

export default TechnicianTab;
