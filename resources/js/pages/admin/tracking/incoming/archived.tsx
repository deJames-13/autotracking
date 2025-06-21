import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type PaginationData, type TrackIncoming } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArchivedIncomingTable } from '@/components/admin/tracking/archived-incoming-table';

interface ArchivedIncomingIndexProps {
    // Props can be extended as needed
}

export default function ArchivedIncomingIndex(props: ArchivedIncomingIndexProps) {
    const [archivedIncoming, setArchivedIncoming] = useState<PaginationData<TrackIncoming> | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSearch, setCurrentSearch] = useState('');

    // Fetch archived incoming data
    const fetchArchivedData = async (page = 1, perPage = 10, search = '') => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/track-incoming/archived', {
                params: {
                    page,
                    per_page: perPage,
                    search,
                },
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            setArchivedIncoming(response.data);
        } catch (error: any) {
            console.error('Error fetching archived incoming data:', error);
            if (error.response?.status === 403) {
                toast.error('Unauthorized. Only admin users can view archived records.');
                router.visit(route('admin.tracking.incoming.index'));
            } else {
                toast.error('Failed to load archived incoming data');
            }
        } finally {
            setLoading(false);
        }
    };

    // Restore record
    const handleRestore = async (id: number) => {
        try {
            await axios.post(`/api/v1/track-incoming/${id}/restore`, {}, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            toast.success('Incoming record restored successfully.');
            fetchArchivedData(); // Refresh the table
        } catch (error: any) {
            console.error('Error restoring incoming record:', error);
            if (error.response?.status === 403) {
                toast.error('Unauthorized. Only admin users can restore records.');
            } else {
                toast.error('Failed to restore incoming record.');
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
        fetchArchivedData(page, archivedIncoming?.per_page || 10, currentSearch);
    };

    // Handle per page change
    const handlePerPageChange = (perPage: number) => {
        fetchArchivedData(1, perPage, currentSearch);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchArchivedData(archivedIncoming?.current_page || 1, archivedIncoming?.per_page || 10, currentSearch);
    };

    useEffect(() => {
        fetchArchivedData();
    }, []);

    return (
        <AppLayout>
            <Head title="Archived Incoming Records" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Archived Incoming Records</h1>
                        <p className="text-gray-600">View and restore archived incoming tracking records</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.visit(route('admin.tracking.incoming.index'))}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Incoming
                        </Button>
                        <Button variant="outline" onClick={handleRefresh}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {archivedIncoming && (
                    <ArchivedIncomingTable
                        archivedIncoming={archivedIncoming}
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
