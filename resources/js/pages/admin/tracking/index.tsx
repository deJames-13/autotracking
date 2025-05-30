import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tracking Management',
        href: '/admin/tracking',
    },
];

interface TrackingIndexProps {
    filters?: {
        search?: string;
    };
    requests?: any[]; // This would be populated with tracking requests from the backend
}

const TrackingIndex: React.FC<TrackingIndexProps> = ({ filters = {}, requests = [] }) => {
    const { canManageRequestIncoming } = useRole();

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
    });

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canManageRequestIncoming()) {
            router.visit('/dashboard');
        }
    }, [canManageRequestIncoming]);

    const handleFilterChange = () => {
        get(route('admin.tracking.index'), {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tracking Management" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tracking Management</h1>
                        <p className="text-muted-foreground">Monitor and manage equipment tracking across the system</p>
                    </div>
                    <Button onClick={() => router.visit(route('admin.tracking.request.index'))}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Request
                    </Button>
                </div>

                {/* Quick Navigation Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Link href={route('admin.tracking.incoming.index')}>
                        <div className="rounded-md border border-border p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                            <h3 className="text-lg font-semibold mb-2">Incoming Requests</h3>
                            <p className="text-sm text-muted-foreground">
                                View equipment submitted for calibration
                            </p>
                        </div>
                    </Link>

                    <Link href={route('admin.tracking.outgoing.index')}>
                        <div className="rounded-md border border-border p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                            <h3 className="text-lg font-semibold mb-2">Outgoing Completions</h3>
                            <p className="text-sm text-muted-foreground">
                                View completed calibrations ready for pickup
                            </p>
                        </div>
                    </Link>

                    <Link href={route('admin.tracking.request.index')}>
                        <div className="rounded-md border border-border p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                            <h3 className="text-lg font-semibold mb-2">Create New Request</h3>
                            <p className="text-sm text-muted-foreground">
                                Submit new equipment for calibration
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Legacy Tracking Requests Management Section */}
                <div className="rounded-md border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">Legacy Tracking Requests</h2>
                        <p className="text-sm text-muted-foreground">
                            Historical tracking data (backward compatibility)
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tracking requests..."
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Requests Table */}
                    {requests.length > 0 ? (
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
                                            Technician
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Date Out
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Due Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {/* This would be populated with actual request data */}
                                    {requests.map(request => (
                                        <tr key={request.id} className="hover:bg-muted/50 cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.recallNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.equipment}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.technician}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.dateOut}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.dueDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{request.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No tracking requests found. Create a new request to get started.</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default TrackingIndex;
