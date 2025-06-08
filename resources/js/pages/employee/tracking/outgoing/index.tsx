import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmployeeStatusBadge } from '@/components/ui/status-badge';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginationData, type TrackOutgoing } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Eye, Package, Search } from 'lucide-react';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Tracking',
        href: '/employee/tracking',
    },
    {
        title: 'Ready for Pickup',
        href: '/employee/tracking/outgoing',
    },
];

interface EmployeeTrackingOutgoingIndexProps {
    filters?: {
        search?: string;
        status?: string;
    };
    requests?: PaginationData<TrackOutgoing>; // Change prop name from completions to requests for consistency
}

const EmployeeTrackingOutgoingIndex: React.FC<EmployeeTrackingOutgoingIndexProps> = ({
    filters = {},
    requests = { data: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1 }, // Provide default value
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
        get(route('employee.tracking.outgoing.index'), {
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
        return <EmployeeStatusBadge status={status as 'for_pickup' | 'completed'} type="outgoing" />;
    };

    const isRecalibrationDue = (calDueDate: string) => {
        if (!calDueDate) return false;
        return new Date(calDueDate) <= new Date();
    };

    // Make sure requests.data exists before accessing it
    const requestsData = requests?.data || [];
    // console.log(requestsData)

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Equipment Ready for Pickup" />

            <div className="space-y-6 p-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href={route('employee.tracking.index')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Tracking
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Equipment Ready for Pickup</h1>
                        <p className="text-muted-foreground">View your completed calibrations ready for pickup</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                        <Input
                            placeholder="Search by recall number or certificate number..."
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
                        <option value="for_pickup">Ready for Pickup</option>
                        <option value="completed">Picked Up</option>
                    </select>
                </div>

                {/* Completions Table */}
                {requestsData.length > 0 ? (
                    <div className="overflow-hidden rounded-md border">
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
                                        Calibration Date
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Next Due Date
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">Status</th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-border divide-y">
                                {requestsData.map((completion) => {
                                    return (
                                        <tr
                                            key={completion.id}
                                            className="hover:bg-muted/50"
                                            onDoubleClick={() => router.visit(route('employee.tracking.outgoing.show', completion.id))}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {completion.track_incoming?.recall_number || 'N/A'}
                                                    {isRecalibrationDue(completion.cal_due_date) && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            Recal Due
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                <div>
                                                    <div className="font-medium">
                                                        {completion.track_incoming?.description || completion.equipment?.description || 'N/A'}
                                                    </div>
                                                    {completion.track_incoming && (
                                                        <div className="text-muted-foreground text-xs">
                                                            {completion.track_incoming.manufacturer} {completion.track_incoming.model}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                                                {completion.cal_date ? format(new Date(completion.cal_date), 'MMM dd, yyyy') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="text-muted-foreground h-3 w-3" />
                                                    <span
                                                        className={
                                                            isRecalibrationDue(completion.cal_due_date)
                                                                ? 'text-destructive font-medium'
                                                                : 'text-muted-foreground'
                                                        }
                                                    >
                                                        {completion.cal_due_date ? format(new Date(completion.cal_due_date), 'MMM dd, yyyy') : 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(completion.status)}</td>
                                            <td className="space-x-2 px-6 py-4 text-sm whitespace-nowrap">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={route('employee.tracking.outgoing.show', completion.id)}>
                                                        <Eye className="mr-1 h-3 w-3" />
                                                        View
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {requests.last_page > 1 && (
                            <div className="bg-muted text-muted-foreground px-6 py-3 text-center text-sm">
                                Showing {requests.from} to {requests.to} of {requests.total} results
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <Package className="text-muted-foreground mx-auto h-12 w-12" />
                        <p className="text-muted-foreground mt-4">No equipment ready for pickup.</p>
                        <p className="text-muted-foreground mt-2 text-sm">Equipment will appear here once calibration is completed.</p>
                    </div>
                )}

                {/* Summary Cards */}
                {requestsData.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="bg-card rounded-lg border p-4">
                            <h3 className="text-muted-foreground text-sm font-medium">Ready for Pickup</h3>
                            <p className="text-2xl font-bold">{requestsData.filter((c) => c.status === 'for_pickup').length}</p>
                        </div>
                        <div className="bg-card rounded-lg border p-4">
                            <h3 className="text-muted-foreground text-sm font-medium">Picked Up</h3>
                            <p className="text-2xl font-bold">{requestsData.filter((c) => c.status === 'completed').length}</p>
                        </div>
                        <div className="bg-card rounded-lg border p-4">
                            <h3 className="text-muted-foreground text-sm font-medium">Recalibration Due</h3>
                            <p className="text-destructive text-2xl font-bold">
                                {requestsData.filter((c) => isRecalibrationDue(c.cal_due_date)).length}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default EmployeeTrackingOutgoingIndex;
