import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type Department, type Equipment, type PaginationData, type Plant, type User } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArchivedEquipmentTable } from '@/components/admin/equipment/archived-equipment-table';

interface ArchivedEquipmentIndexProps {
    // Props can be extended as needed
}

export default function ArchivedEquipmentIndex(props: ArchivedEquipmentIndexProps) {
    const [archivedEquipment, setArchivedEquipment] = useState<PaginationData<Equipment> | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSearch, setCurrentSearch] = useState('');

    // Fetch archived equipment data
    const fetchArchivedData = async (page = 1, perPage = 10, search = '') => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/equipment/archived', {
                params: {
                    page,
                    per_page: perPage,
                    search,
                },
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            setArchivedEquipment(response.data.data);
        } catch (error: any) {
            console.error('Error fetching archived equipment data:', error);
            if (error.response?.status === 403) {
                toast.error('Unauthorized. Only admin users can view archived records.');
                router.visit(route('admin.equipment.index'));
            } else {
                toast.error('Failed to load archived equipment data');
            }
        } finally {
            setLoading(false);
        }
    };

    // Restore record
    const handleRestore = async (id: number) => {
        try {
            await axios.post(`/admin/equipment/${id}/restore`, {}, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            toast.success('Equipment restored successfully.');
            fetchArchivedData(); // Refresh the table
        } catch (error: any) {
            console.error('Error restoring equipment:', error);
            if (error.response?.status === 403) {
                toast.error('Unauthorized. Only admin users can restore records.');
            } else {
                toast.error('Failed to restore equipment.');
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
        fetchArchivedData(page, archivedEquipment?.per_page || 10, currentSearch);
    };

    // Handle per page change
    const handlePerPageChange = (perPage: number) => {
        fetchArchivedData(1, perPage, currentSearch);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchArchivedData(archivedEquipment?.current_page || 1, archivedEquipment?.per_page || 10, currentSearch);
    };

    useEffect(() => {
        fetchArchivedData();
    }, []);

    return (
        <AppLayout>
            <Head title="Archived Equipment" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Archived Equipment</h1>
                        <p className="text-gray-600">View and restore archived equipment records</p>
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
                            onClick={() => router.visit(route('admin.equipment.index'))}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Equipment
                        </Button>
                    </div>
                </div>

                {archivedEquipment && (
                    <ArchivedEquipmentTable
                        archivedEquipment={archivedEquipment}
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
