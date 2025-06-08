import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Location, type PaginationData, type TrackIncoming, type User } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tracking Management',
        href: '/admin/tracking',
    },
    {
        title: 'Incoming Requests',
        href: '/admin/tracking/incoming',
    },
];

interface TrackingIncomingIndexProps {
    requests: PaginationData<TrackIncoming>;
    filterOptions?: {
        statuses: Array<{ value: string; label: string }>;
        technicians: User[];
        locations: Location[];
        employees: User[];
    };
}

const TrackingIncomingIndex: React.FC<TrackingIncomingIndexProps> = ({ requests, filterOptions }) => {
    const { canManageRequestIncoming } = useRole();
    const [loading, setLoading] = useState(false);
    const [trackIncoming, setTrackIncoming] = useState(requests);

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canManageRequestIncoming()) {
            router.visit('/dashboard');
        }
    }, [canManageRequestIncoming]);

    const handleFilterChange = () => {
        get(route('admin.tracking.incoming.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const handleCompleteCalibration = (request: TrackIncoming) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
        // Refresh the data
        router.reload();
    };

    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            if (data.search !== filters.search) {
                handleFilterChange();
            }
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [data.search]);

    if (!canManageRequestIncoming()) {
        return null;
    }

    const getStatusBadge = (status: string) => {
        return <StatusBadge status={status as any} />;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incoming Calibration Requests" />

            <div className="space-y-6 p-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Incoming Calibration Requests</h1>
                        <p className="text-muted-foreground">Manage equipment submitted for calibration</p>
                    </div>
                    <Button onClick={() => router.visit(route('admin.tracking.request.index'))}>
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
                        <option value="pending_calibration">Pending Calibration</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {/* Requests Table */}
                {requests.data.length > 0 ? (
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
                                        Date In
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
                                        onDoubleClick={() => router.visit(route('admin.tracking.incoming.show', request.id))}
                                    >
                                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                            {request.recall_number || (
                                                <span className="text-muted-foreground text-xs">
                                                    {request.request_type === 'new' ? 'To be assigned' : 'N/A'}
                                                </span>
                                            )}
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
                                                <Link href={route('admin.tracking.incoming.show', request.id)}>
                                                    <Eye className="mr-1 h-3 w-3" />
                                                    View
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination would go here */}
                        {requests.last_page > 1 && (
                            <div className="bg-muted text-muted-foreground px-6 py-3 text-center text-sm">
                                Showing {requests.from} to {requests.to} of {requests.total} results
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-muted-foreground">No incoming calibration requests found.</p>
                        <Button className="mt-4" onClick={() => router.visit(route('admin.tracking.request.index'))}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Request
                        </Button>
                    </div>
                )}
            </div>

            {/* Outgoing Calibration Modal */}
            <OutgoingCalibrationModal
                incomingRecord={selectedRequest}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={handleModalSuccess}
            />
        </AppLayout>
    );
};

export default TrackingIncomingIndex;
