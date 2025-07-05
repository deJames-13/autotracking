import { TrackIncomingTable } from '@/components/admin/tracking/track-incoming-table';
import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type Location, type PaginationData, type TrackIncoming, type User } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Plus, Archive } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface TrackIncomingIndexProps {
    // Props can be extended as needed
}

interface FilterOptions {
    statuses: Array<{ value: string; label: string }>;
    technicians: User[];
    locations: Location[];
    employees: User[];
}

export default function TrackIncomingIndex(props: TrackIncomingIndexProps) {
    const { isAdmin } = useRole();
    const [trackIncoming, setTrackIncoming] = useState<PaginationData<TrackIncoming> | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentSort, setCurrentSort] = useState<{ column: string, direction: 'asc' | 'desc' } | null>(null);

    // Fetch table data
    const fetchTableData = async (page = 1, perPage = 10, search = '', filters = {}, sortColumn?: string, sortDirection?: 'asc' | 'desc') => {
        try {
            setLoading(true);
            const params: any = {
                page,
                per_page: perPage,
                search,
                ...filters,
            };

            if (sortColumn && sortDirection) {
                params.sort_by = sortColumn;
                params.sort_direction = sortDirection;
            }

            const response = await axios.get(route('admin.tracking.incoming.table-data'), {
                params,
            });
            setTrackIncoming(response.data);
        } catch (error) {
            console.error('Error fetching track incoming data:', error);
            toast.error('Failed to load track incoming data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch filter options
    const fetchFilterOptions = async () => {
        try {
            const response = await axios.get(route('admin.tracking.incoming.filter-options'));
            setFilterOptions(response.data);
        } catch (error) {
            console.error('Error fetching filter options:', error);
            toast.error('Failed to load filter options');
        }
    };

    // Load initial data
    useEffect(() => {
        fetchTableData();
        fetchFilterOptions();
    }, []);

    // Handle search
    const handleSearch = (search: string) => {
        setCurrentSearch(search);
        fetchTableData(1, trackIncoming?.per_page || 10, search, currentFilters, currentSort?.column, currentSort?.direction);
    };

    // Handle filter
    const handleFilter = (filters: Record<string, any>) => {
        setCurrentFilters(filters);
        fetchTableData(1, trackIncoming?.per_page || 10, currentSearch, filters, currentSort?.column, currentSort?.direction);
    };

    // Handle sort
    const handleSort = (column: string, direction: 'asc' | 'desc') => {
        setCurrentSort({ column, direction });
        fetchTableData(trackIncoming?.current_page || 1, trackIncoming?.per_page || 10, currentSearch, currentFilters, column, direction);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        fetchTableData(page, trackIncoming?.per_page || 10, currentSearch, currentFilters, currentSort?.column, currentSort?.direction);
    };

    // Handle per page change
    const handlePerPageChange = (perPage: number) => {
        fetchTableData(1, perPage, currentSearch, currentFilters, currentSort?.column, currentSort?.direction);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchTableData(trackIncoming?.current_page || 1, trackIncoming?.per_page || 10, currentSearch, currentFilters, currentSort?.column, currentSort?.direction);
    };

    return (
        <AppLayout>
            <Head title="Track Incoming Equipment" />

            <div className="flex flex-col space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight break-words max-w-full">Track Incoming Equipment</h1>
                        <p className="text-muted-foreground break-words max-w-full">Manage and track incoming equipment calibration requests</p>
                    </div>

                    <div className="flex gap-2">
                        {isAdmin() && (
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/admin/tracking/incoming/archived')}
                                size="sm"
                                className="w-full sm:w-auto"
                            >
                                <Archive className="mr-2 h-4 w-4" />
                                View Archived
                            </Button>
                        )}
                        <Button onClick={() => router.visit(route('admin.tracking.request.index'))} size="sm" className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            New Request
                        </Button>
                    </div>
                </div>

                {trackIncoming && (
                    <TrackIncomingTable
                        trackIncoming={trackIncoming}
                        loading={loading}
                        filterOptions={filterOptions}
                        onRefresh={handleRefresh}
                        onSearch={handleSearch}
                        onFilter={handleFilter}
                        onSort={handleSort}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                )}
            </div>
        </AppLayout>
    );
}
