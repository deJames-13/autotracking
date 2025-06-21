import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type PaginationData, type Plant } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArchivedPlantsTable } from '@/components/admin/plants/archived-plants-table';

interface ArchivedPlantsIndexProps {
    // Props can be extended as needed
}

export default function ArchivedPlantsIndex(props: ArchivedPlantsIndexProps) {
    const [archivedPlants, setArchivedPlants] = useState<PaginationData<Plant> | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSearch, setCurrentSearch] = useState('');

    // Fetch archived plants data
    const fetchArchivedData = async (page = 1, perPage = 10, search = '') => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/plants/archived', {
                params: {
                    page,
                    per_page: perPage,
                    search,
                },
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            setArchivedPlants(response.data.data);
        } catch (error: any) {
            console.error('Error fetching archived plants data:', error);
            if (error.response?.status === 403) {
                toast.error('Unauthorized. Only admin users can view archived records.');
                router.visit(route('admin.plants.index'));
            } else {
                toast.error('Failed to load archived plants data');
            }
        } finally {
            setLoading(false);
        }
    };

    // Restore record
    const handleRestore = async (id: string) => {
        try {
            await axios.post(`/admin/plants/${id}/restore`, {}, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            toast.success('Plant restored successfully.');
            fetchArchivedData(); // Refresh the table
        } catch (error: any) {
            console.error('Error restoring plant:', error);
            if (error.response?.status === 403) {
                toast.error('Unauthorized. Only admin users can restore records.');
            } else {
                toast.error('Failed to restore plant.');
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
        fetchArchivedData(page, archivedPlants?.per_page || 10, currentSearch);
    };

    // Handle per page change
    const handlePerPageChange = (perPage: number) => {
        fetchArchivedData(1, perPage, currentSearch);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchArchivedData(archivedPlants?.current_page || 1, archivedPlants?.per_page || 10, currentSearch);
    };

    useEffect(() => {
        fetchArchivedData();
    }, []);

    return (
        <AppLayout>
            <Head title="Archived Plants" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Archived Plants</h1>
                        <p className="text-gray-600">View and restore archived plant records</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.visit(route('admin.plants.index'))}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Plants
                        </Button>
                    </div>
                </div>

                {archivedPlants && (
                    <ArchivedPlantsTable
                        archivedPlants={archivedPlants}
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
