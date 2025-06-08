import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmployeeStatusBadge } from '@/components/ui/status-badge';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginationData, type TrackIncoming } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Eye, Plus, Search } from 'lucide-react';
import { useEffect } from 'react';

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
    requests = { data: [], meta: {}, links: {} } as unknown as PaginationData<TrackIncoming>,
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

            <div className="space-y-6 p-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href={route('employee.tracking.index')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
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
                        <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
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
                        className="border-border bg-background rounded-md border px-3 py-2"
                    >
                        <option value="">All Statuses</option>
                        <option value="for_confirmation">Awaiting Confirmation</option>
                        <option value="pending_calibration">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {/* Requests Table */}
                {requests && requests.data && requests.data.length > 0 ? (
                    <div className="overflow-scroll rounded-md border">
                        <table className="divide-border min-w-full divide-y">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Recall #
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Equipment
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Serial Number
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Technician
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Date Submitted
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Due Date
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">Status</th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-border divide-y">
                                {requests.data.map((request) => (
                                    <tr
                                        key={request.id}
                                        className="hover:bg-muted/50"
                                        onDoubleClick={() => router.visit(route('employee.tracking.incoming.show', request.id))}
                                    >
                                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                            {request.recall_number || <span className="text-muted-foreground text-xs">To be assigned</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <div>
                                                <div className="font-medium">{request.description}</div>
                                                {request.manufacturer && request.model && (
                                                    <div className="text-muted-foreground text-xs">
                                                        {request.manufacturer} {request.model}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                                            {request.serial_number || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            {request.technician ? `${request.technician.first_name} ${request.technician.last_name}` : 'Unassigned'}
                                        </td>
                                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                                            {format(new Date(request.date_in), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <span
                                                className={
                                                    new Date(request.due_date) < new Date() ? 'text-destructive font-medium' : 'text-muted-foreground'
                                                }
                                            >
                                                {format(new Date(request.due_date), 'MMM dd, yyyy')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                                        <td className="space-x-2 px-6 py-4 text-sm whitespace-nowrap">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={route('employee.tracking.incoming.show', request.id)}>
                                                    <Eye className="mr-1 h-3 w-3" />
                                                    View
                                                </Link>
                                            </Button>

                                            {/* {canEditRequest(request) && (
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
                                            )} */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {requests && requests.last_page && requests.last_page > 1 && (
                            <div className="bg-muted text-muted-foreground px-6 py-3 text-center text-sm">
                                Showing {requests.from} to {requests.to} of {requests.total} results
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center">
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
