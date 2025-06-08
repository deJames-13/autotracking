import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OutgoingStatusBadge } from '@/components/ui/status-badge';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginationData, type TrackOutgoing } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar, Eye, Search } from 'lucide-react';
import { useEffect } from 'react';

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

const TrackingOutgoingIndex: React.FC<TrackingOutgoingIndexProps> = ({ filters = {}, completions }) => {
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
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {/* Completions Table */}
                {completions.data.length > 0 ? (
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
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Date Out
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">Status</th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-border divide-y">
                                {completions.data.map((completion) => (
                                    <tr
                                        key={completion.id}
                                        className="hover:bg-muted/50"
                                        onDoubleClick={() => router.visit(route('admin.tracking.outgoing.show', completion.id))}
                                    >
                                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">{completion.track_incoming.recall_number}</td>
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
                                            {format(new Date(completion.cal_date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="text-muted-foreground h-3 w-3" />
                                                <span
                                                    className={
                                                        new Date(completion.cal_due_date) < new Date()
                                                            ? 'text-destructive font-medium'
                                                            : 'text-muted-foreground'
                                                    }
                                                >
                                                    {format(new Date(completion.cal_due_date), 'MMM dd, yyyy')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                                            {format(new Date(completion.date_out), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(completion.status)}</td>
                                        <td className="space-x-2 px-6 py-4 text-sm whitespace-nowrap">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={route('admin.tracking.outgoing.show', completion.id)}>
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
                        {completions.last_page > 1 && (
                            <div className="bg-muted text-muted-foreground px-6 py-3 text-center text-sm">
                                Showing {completions.from} to {completions.to} of {completions.total} results
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-muted-foreground">No outgoing calibration completions found.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default TrackingOutgoingIndex;
