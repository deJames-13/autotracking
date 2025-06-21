import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type PaginationData, type TrackOutgoing } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArchivedOutgoingTable } from '@/components/admin/tracking/archived-outgoing-table';

interface ArchivedOutgoingIndexProps {
    // Props can be extended as needed
}

export default function ArchivedOutgoingIndex(props: ArchivedOutgoingIndexProps) {
    const [archivedOutgoing, setArchivedOutgoing] = useState<PaginationData<TrackOutgoing> | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSearch, setCurrentSearch] = useState('');

    // Fetch archived outgoing data
    const fetchArchivedData = async (page = 1, perPage = 10, search = '') => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/track-outgoing/archived', {
                params: {
                    page,
                    per_page: perPage,
                    search,
                },
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            setArchivedOutgoing(response.data);
        } catch (error: any) {
            console.error('Error fetching archived outgoing data:', error);
            if (error.response?.status === 403) {
                toast.error('Unauthorized. Only admin users can view archived records.');
                router.visit(route('admin.tracking.outgoing.index'));
            } else {
                toast.error('Failed to load archived outgoing data');
            }
        } finally {
            setLoading(false);
        }
    };

    // Restore record
    const handleRestore = async (id: number) => {
        try {
            await axios.post(`/api/v1/track-outgoing/${id}/restore`, {}, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            toast.success('Outgoing record restored successfully.');
            fetchArchivedData(); // Refresh the table
        } catch (error: any) {
            console.error('Error restoring outgoing record:', error);
            if (error.response?.status === 403) {
                toast.error('Unauthorized. Only admin users can restore records.');
            } else {
                toast.error('Failed to restore outgoing record.');
            }
        }
    };

    // Handle search
    const handleSearch = (search: string) => {
        setCurrentSearch(search);
        fetchArchivedData(1, 10, search);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        fetchArchivedData(page, archivedOutgoing?.per_page || 10, currentSearch);
    };

    // Handle per page change
    const handlePerPageChange = (perPage: number) => {
        fetchArchivedData(1, perPage, currentSearch);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchArchivedData(archivedOutgoing?.current_page || 1, archivedOutgoing?.per_page || 10, currentSearch);
    };

    useEffect(() => {
        fetchArchivedData();
    }, []);

    return (
        <AppLayout>
            <Head title="Archived Outgoing Records" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Archived Outgoing Records</h1>
                        <p className="text-gray-600">View and restore archived outgoing tracking records</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.visit(route('admin.tracking.outgoing.index'))}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Outgoing
                        </Button>
                        <Button variant="outline" onClick={handleRefresh}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {archivedOutgoing && (
                    <ArchivedOutgoingTable
                        archivedOutgoing={archivedOutgoing}
                        loading={loading}
                        onRestore={handleRestore}
                        onSearch={handleSearch}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                        onRefresh={handleRefresh}
                    />
                )}
            </div>
        </AppLayout>
    );
}
