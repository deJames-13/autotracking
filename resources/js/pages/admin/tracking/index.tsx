import { ReportsTable } from '@/components/admin/tracking/reports/table';
import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
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

            <div className="space-y-6">
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
                        <div className="border-border hover:bg-muted/50 cursor-pointer rounded-md border p-6 transition-colors">
                            <h3 className="mb-2 text-lg font-semibold">Incoming Requests</h3>
                            <p className="text-muted-foreground text-sm">View equipment submitted for calibration</p>
                        </div>
                    </Link>

                    <Link href={route('admin.tracking.outgoing.index')}>
                        <div className="border-border hover:bg-muted/50 cursor-pointer rounded-md border p-6 transition-colors">
                            <h3 className="mb-2 text-lg font-semibold">Outgoing Completions</h3>
                            <p className="text-muted-foreground text-sm">View completed calibrations ready for pickup</p>
                        </div>
                    </Link>

                    <Link href={route('admin.tracking.request.index')}>
                        <div className="border-border hover:bg-muted/50 cursor-pointer rounded-md border p-6 transition-colors">
                            <h3 className="mb-2 text-lg font-semibold">Create New Request</h3>
                            <p className="text-muted-foreground text-sm">Submit new equipment for calibration</p>
                        </div>
                    </Link>
                </div>

                {/* Reports Table */}
                <ReportsTable className="min-h-screen" />
            </div>
        </AppLayout>
    );
};

export default TrackingIndex;
