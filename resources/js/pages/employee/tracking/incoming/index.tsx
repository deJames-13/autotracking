import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmployeeStatusBadge } from '@/components/ui/status-badge';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackIncoming, type PaginationData } from '@/types';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Search, Eye, Edit, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { format } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Tracking',
        href: '/employee/tracking',
    },
    {
        title: 'My Requests',
        href: '/employee/tracking/incoming',
    },
];

interface EmployeeTrackingIncomingIndexProps {
    filters?: {
        search?: string;
        status?: string;
    };
    requests: PaginationData<TrackIncoming>;
}

const EmployeeTrackingIncomingIndex: React.FC<EmployeeTrackingIncomingIndexProps> = ({
    filters = {},
    requests = { data: [], meta: {}, links: {} } as unknown as PaginationData<TrackIncoming>
}) => {
    const { canSubmitCalibrationRequest } = useRole();

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || '',
    });

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canSubmitCalibrationRequest()) {
            router.visit('/dashboard');
        }
    }, [canSubmitCalibrationRequest]);

    const handleFilterChange = () => {
        get(route('employee.tracking.incoming.index'), {
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

    if (!canSubmitCalibrationRequest()) {
        return null;
    }

    const getStatusBadge = (status: string) => {
        return <EmployeeStatusBadge status={status as any} />;
    };

    const canEditRequest = (request: TrackIncoming) => {
        return request.status === 'for_confirmation';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Calibration Requests" />

            <div className="space-y-6 p-6">
                <Button variant="outline" size="sm" asChild>
                    <Link href={route('employee.tracking.index')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Tracking
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Calibration Requests</h1>
                        <p className="text-muted-foreground">View and manage your submitted calibration requests</p>
                    </div>
                    <Button onClick={() => router.visit(route('employee.tracking.request.index'))}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Request
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by recall number, description, or serial number..."
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className="px-3 py-2 border border-border rounded-md bg-background"
                    >
                        <option value="">All Statuses</option>
                        <option value="for_confirmation">Awaiting Confirmation</option>
                        <option value="pending_calibration">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {/* Requests Table */}
                {requests && requests.data && requests.data.length > 0 ? (
                    <div className="border rounded-md overflow-scroll">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Recall #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Equipment
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Serial Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Technician
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Date Submitted
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Due Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {requests.data.map(request => (
                                    <tr key={request.id} className="hover:bg-muted/50" onDoubleClick={() => router.visit(route('employee.tracking.incoming.show', request.id))}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {request.recall_number || (
                                                <span className="text-muted-foreground text-xs">
                                                    To be assigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div>
                                                <div className="font-medium">{request.description}</div>
                                                {request.manufacturer && request.model && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {request.manufacturer} {request.model}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {request.serial_number || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {request.technician ? (
                                                `${request.technician.first_name} ${request.technician.last_name}`
                                            ) : 'Unassigned'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {format(new Date(request.date_in), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={
                                                new Date(request.due_date) < new Date()
                                                    ? 'text-destructive font-medium'
                                                    : 'text-muted-foreground'
                                            }>
                                                {format(new Date(request.due_date), 'MMM dd, yyyy')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link href={route('employee.tracking.incoming.show', request.id)}>
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Link>
                                            </Button>

                                            {canEditRequest(request) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link href={route('employee.tracking.request.index', { edit: request.id })}>
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {requests && requests.last_page && requests.last_page > 1 && (
                            <div className="px-6 py-3 bg-muted text-center text-sm text-muted-foreground">
                                Showing {requests.from} to {requests.to} of {requests.total} results
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">You haven't submitted any calibration requests yet.</p>
                        <Button className="mt-4" onClick={() => router.visit(route('employee.tracking.request.index'))}>
                            <Plus className="mr-2 h-4 w-4" />
                            Submit Your First Request
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default EmployeeTrackingIncomingIndex;