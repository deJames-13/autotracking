import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackIncoming, type PaginationData } from '@/types';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { Plus, Search, Eye, FileText, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { OutgoingCalibrationModal } from '@/components/admin/tracking/outgoing/outgoing-calibration-modal';

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
    filters?: {
        search?: string;
        status?: string;
    };
    requests: PaginationData<TrackIncoming>;
}

const TrackingIncomingIndex: React.FC<TrackingIncomingIndexProps> = ({
    filters = {},
    requests
}) => {
    const { canManageRequestIncoming } = useRole();

    // State for outgoing calibration modal
    const [selectedRequest, setSelectedRequest] = useState<TrackIncoming | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || '',
    });

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
        handleFilterChange();
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
        switch (status) {
            case 'pending_calibration':
                return <Badge variant="secondary">Pending</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incoming Calibration Requests" />

            <div className="space-y-6 p-6">
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
                        <option value="pending_calibration">Pending Calibration</option>
                    </select>
                </div>

                {/* Requests Table */}
                {requests.data.length > 0 ? (
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
                                        Date In
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
                                    <tr key={request.id} className="hover:bg-muted/50" onDoubleClick={() => router.visit(route('admin.tracking.incoming.show', request.id))}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {request.recall_number}
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
                                                <Link href={route('admin.tracking.incoming.show', request.id)}>
                                                    <Eye className="h-3 w-3 mr-1" />
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
                            <div className="px-6 py-3 bg-muted text-center text-sm text-muted-foreground">
                                Showing {requests.from} to {requests.to} of {requests.total} results
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
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
