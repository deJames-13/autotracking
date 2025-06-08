import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, OutgoingStatusBadge } from '@/components/ui/status-badge';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackOutgoing, type PaginationData } from '@/types';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { Search, Eye, FileText, Calendar } from 'lucide-react';
import { useEffect } from 'react';
import { format } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tracking Management',
        href: '/admin/tracking',
    },
    {
        title: 'Outgoing Completions',
        href: '/admin/tracking/outgoing',
    },
];

interface TrackingOutgoingIndexProps {
    filters?: {
        search?: string;
        status?: string;
    };
    completions: PaginationData<TrackOutgoing>;
}

const TrackingOutgoingIndex: React.FC<TrackingOutgoingIndexProps> = ({
    filters = {},
    completions
}) => {
    const { canManageRequestIncoming } = useRole();

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
        get(route('admin.tracking.outgoing.index'), {
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

    if (!canManageRequestIncoming()) {
        return null;
    }

    const getStatusBadge = (status: string) => {
        return <OutgoingStatusBadge status={status as any} />;
    };


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Outgoing Calibration Completions" />

            <div className="space-y-6 p-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Outgoing Calibration Completions</h1>
                        <p className="text-muted-foreground">Manage completed calibrations ready for pickup</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                        className="px-3 py-2 border border-border rounded-md bg-background"
                    >
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {/* Completions Table */}
                {completions.data.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
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
                                        Calibration Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Next Due Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Date Out
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
                                {completions.data.map(completion => (
                                    <tr key={completion.id} className="hover:bg-muted/50" onDoubleClick={() => router.visit(route('admin.tracking.outgoing.show', completion.id))}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {completion.track_incoming.recall_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div>
                                                <div className="font-medium">
                                                    {completion.track_incoming?.description ||
                                                        completion.equipment?.description || 'N/A'}
                                                </div>
                                                {completion.track_incoming && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {completion.track_incoming.manufacturer} {completion.track_incoming.model}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {format(new Date(completion.cal_date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                <span className={
                                                    new Date(completion.cal_due_date) < new Date()
                                                        ? 'text-destructive font-medium'
                                                        : 'text-muted-foreground'
                                                }>
                                                    {format(new Date(completion.cal_due_date), 'MMM dd, yyyy')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {format(new Date(completion.date_out), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(completion.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link href={route('admin.tracking.outgoing.show', completion.id)}>
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
                        {completions.last_page > 1 && (
                            <div className="px-6 py-3 bg-muted text-center text-sm text-muted-foreground">
                                Showing {completions.from} to {completions.to} of {completions.total} results
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No outgoing calibration completions found.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default TrackingOutgoingIndex;
