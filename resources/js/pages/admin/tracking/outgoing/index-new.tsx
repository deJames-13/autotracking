import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackOutgoing, type PaginationData, type User } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { TrackOutgoingTable } from '@/components/admin/tracking/track-outgoing-table';
import { toast } from 'react-hot-toast';
import axios from 'axios';

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
    completions: PaginationData<TrackOutgoing>;
    filterOptions?: {
        statuses: Array<{ value: string; label: string }>;
        technicians: User[];
        employeesOut: User[];
        releasedBy: User[];
    };
}

const TrackingOutgoingIndex: React.FC<TrackingOutgoingIndexProps> = ({
    completions,
    filterOptions
}) => {
    const { canManageRequestIncoming } = useRole();
    const [loading, setLoading] = useState(false);
    const [trackOutgoing, setTrackOutgoing] = useState(completions);
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
            const response = await axios.get(route('admin.tracking.outgoing.filter-options'));
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
            const response = await axios.get(route('admin.tracking.outgoing.table-data'), { params });
            setTrackOutgoing(response.data);
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
            const response = await axios.get(route('admin.tracking.outgoing.table-data'), { params: filters });
            setTrackOutgoing(response.data);
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
            const response = await axios.get(route('admin.tracking.outgoing.table-data'), { params });
            setTrackOutgoing(response.data);
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
            const response = await axios.get(route('admin.tracking.outgoing.table-data'), { params });
            setTrackOutgoing(response.data);
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
            const response = await axios.get(route('admin.tracking.outgoing.table-data'), { params: currentFilters });
            setTrackOutgoing(response.data);
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
            <Head title="Outgoing Calibration Completions" />

            <div className="space-y-6 p-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Outgoing Calibration Completions</h1>
                        <p className="text-muted-foreground">Manage completed calibrations ready for pickup</p>
                    </div>
                    <Button onClick={() => router.visit(route('admin.tracking.incoming.index'))}>
                        <Plus className="mr-2 h-4 w-4" />
                        View Incoming
                    </Button>
                </div>

                <TrackOutgoingTable
                    trackOutgoing={trackOutgoing}
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

export default TrackingOutgoingIndex;
