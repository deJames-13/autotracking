import { TrackOutgoingTable } from '@/components/admin/tracking/track-outgoing-table';
import AppLayout from '@/layouts/app-layout';
import { type PaginationData, type TrackOutgoing } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface TrackOutgoingIndexProps {
    // Props can be extended as needed
}

interface FilterOptions {
    statuses: Array<{ value: string; label: string }>;
    technicians: Array<{ value: string; label: string }>;
    employees_out: Array<{ value: string; label: string }>;
    released_by: Array<{ value: string; label: string }>;
}

export default function TrackOutgoingIndex(props: TrackOutgoingIndexProps) {
    const [trackOutgoing, setTrackOutgoing] = useState<PaginationData<TrackOutgoing> | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
    const [currentSearch, setCurrentSearch] = useState('');

    // Fetch table data
    const fetchTableData = async (page = 1, perPage = 10, search = '', filters = {}) => {
        try {
            setLoading(true);
            const response = await axios.get(route('admin.tracking.outgoing.table-data'), {
                params: {
                    page,
                    per_page: perPage,
                    search,
                    ...filters,
                },
            });
            setTrackOutgoing(response.data);
        } catch (error) {
            console.error('Error fetching track outgoing data:', error);
            toast.error('Failed to load track outgoing data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch filter options
    const fetchFilterOptions = async () => {
        try {
            const response = await axios.get(route('admin.tracking.outgoing.filter-options'));
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
        fetchTableData(1, trackOutgoing?.per_page || 10, search, currentFilters);
    };

    // Handle filter
    const handleFilter = (filters: Record<string, any>) => {
        setCurrentFilters(filters);
        fetchTableData(1, trackOutgoing?.per_page || 10, currentSearch, filters);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        fetchTableData(page, trackOutgoing?.per_page || 10, currentSearch, currentFilters);
    };

    // Handle per page change
    const handlePerPageChange = (perPage: number) => {
        fetchTableData(1, perPage, currentSearch, currentFilters);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchTableData(trackOutgoing?.current_page || 1, trackOutgoing?.per_page || 10, currentSearch, currentFilters);
    };

    return (
        <AppLayout>
            <Head title="Track Outgoing Equipment" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Track Outgoing Equipment</h1>
                        <p className="text-muted-foreground">Manage and track outgoing equipment calibration completions</p>
                    </div>

                    {/* <Button
                        onClick={() => {
                            // Export functionality can be added here
                            toast.success('Export feature coming soon');
                        }}
                        size="sm"
                        variant="outline"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button> */}
                </div>

                {trackOutgoing && (
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
                )}
            </div>
        </AppLayout>
    );
}
