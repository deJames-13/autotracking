import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackIncoming, type PaginationData, type User, type Location } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { TrackIncomingTable } from '@/components/admin/tracking/track-incoming-table';
import { toast } from 'sonner';
import axios from 'axios';

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

const TrackingIncomingIndex: React.FC<TrackingIncomingIndexProps> = ({
    requests,
    filterOptions
}) => {
    const { canManageRequestIncoming } = useRole();
    const [loading, setLoading] = useState(false);
    const [trackIncoming, setTrackIncoming] = useState(requests);
    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

    // Redirect if user doesn't have permission
    useEffect(() => {
        if (!canManageRequestIncoming()) {
            router.visit(route('admin.dashboard'));
        }
    }, []);

    // Fetch filter options on mount if not provided
    useEffect(() => {
        if (!filterOptions) {
            fetchFilterOptions();
        }
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const response = await axios.get(route('admin.tracking.incoming.filter-options'));
            // The filter options should be passed from the backend
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
        }
    };

    // DataTable event handlers
    const handleSearch = useCallback(async (search: string) => {
        setLoading(true);
        const params = { ...currentFilters, search };
        setCurrentFilters(params);

        try {
            const response = await axios.get(route('admin.tracking.incoming.table-data'), { params });
            setTrackIncoming(response.data);
        } catch (error) {
            toast.error('Failed to search data');
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFilters]);

    const handleFilter = useCallback(async (filters: Record<string, any>) => {
        setLoading(true);
        setCurrentFilters(filters);

        try {
            const response = await axios.get(route('admin.tracking.incoming.table-data'), { params: filters });
            setTrackIncoming(response.data);
        } catch (error) {
            toast.error('Failed to filter data');
            console.error('Filter error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePageChange = useCallback(async (page: number) => {
        setLoading(true);
        const params = { ...currentFilters, page };

        try {
            const response = await axios.get(route('admin.tracking.incoming.table-data'), { params });
            setTrackIncoming(response.data);
        } catch (error) {
            toast.error('Failed to change page');
            console.error('Page change error:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFilters]);

    const handlePerPageChange = useCallback(async (perPage: number) => {
        setLoading(true);
        const params = { ...currentFilters, per_page: perPage, page: 1 };
        setCurrentFilters(params);

        try {
            const response = await axios.get(route('admin.tracking.incoming.table-data'), { params });
            setTrackIncoming(response.data);
        } catch (error) {
            toast.error('Failed to change page size');
            console.error('Per page change error:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFilters]);

    const handleRefresh = useCallback(async () => {
        setLoading(true);

        try {
            const response = await axios.get(route('admin.tracking.incoming.table-data'), { params: currentFilters });
            setTrackIncoming(response.data);
            toast.success('Data refreshed');
        } catch (error) {
            toast.error('Failed to refresh data');
            console.error('Refresh error:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFilters]);

    if (!canManageRequestIncoming()) {
        return null;
    }

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

                <TrackIncomingTable
                    trackIncoming={trackIncoming}
                    loading={loading}
                    filterOptions={filterOptions}
                    onRefresh={handleRefresh}
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>
        </AppLayout>
    );
};

export default TrackingIncomingIndex;
