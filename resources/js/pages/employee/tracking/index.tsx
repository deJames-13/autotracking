import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ClipboardList,
    Package,
    PackageCheck,
    Clock,
    AlertTriangle,
    BarChart3,
    Activity
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface DashboardStats {
    submitted_requests: number;
    pending_requests: number;
    completed_requests: number;
    ready_for_pickup: number;
    overdue_equipment: number;
}

interface RecentActivity {
    id: number;
    equipment_name: string;
    equipment_recall: string;
    status: string;
    status_changed_at: string;
    technician_name?: string;
}

export default function EmployeeTrackingIndex() {
    const [stats, setStats] = useState<DashboardStats>({
        submitted_requests: 0,
        pending_requests: 0,
        completed_requests: 0,
        ready_for_pickup: 0,
        overdue_equipment: 0,
    });
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsResponse, activitiesResponse] = await Promise.all([
                    axios.get(route('employee.tracking.api.dashboard.stats')),
                    axios.get(route('employee.tracking.api.dashboard.recent-activities'))
                ]);

                setStats(statsResponse.data);
                setRecentActivities(activitiesResponse.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending confirmation':
                return 'text-yellow-600';
            case 'confirmed':
            case 'in calibration':
                return 'text-blue-600';
            case 'calibrated':
            case 'ready for pickup':
                return 'text-green-600';
            case 'picked up':
                return 'text-gray-600';
            default:
                return 'text-red-600';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Head title="Employee Tracking" />

            <div className="container mx-auto py-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Equipment Tracking</h1>
                    <p className="text-gray-600 mt-2">
                        Manage your equipment calibration requests and track their progress.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Submit New Request */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                                <ClipboardList className="h-5 w-5 text-blue-600" />
                                <CardTitle className="text-lg">New Request</CardTitle>
                            </div>
                            <CardDescription>
                                Submit a new equipment calibration request
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={route('employee.tracking.request.index')}>
                                <Button className="w-full">
                                    Submit Request
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* View Incoming Requests */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                                <Package className="h-5 w-5 text-orange-600" />
                                <CardTitle className="text-lg">My Requests</CardTitle>
                            </div>
                            <CardDescription>
                                View submitted requests and their status
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='mt-auto'>
                            <Link href={route('employee.tracking.incoming.index')}>
                                <Button variant="outline" className="w-full">
                                    View Requests
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* View Outgoing/Completed */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                                <PackageCheck className="h-5 w-5 text-green-600" />
                                <CardTitle className="text-lg">Ready for Pickup</CardTitle>
                            </div>
                            <CardDescription>
                                View calibrated equipment ready for pickup
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={route('employee.tracking.outgoing.index')}>
                                <Button variant="outline" className="w-full">
                                    View Completed
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Stats Section */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Pending Confirmation
                                    </CardTitle>
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '...' : stats.pending_requests}
                                </div>
                                <p className="text-xs text-gray-600">Awaiting admin confirmation</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Total Submitted
                                    </CardTitle>
                                    <ClipboardList className="h-4 w-4 text-blue-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '...' : stats.submitted_requests}
                                </div>
                                <p className="text-xs text-gray-600">All submitted requests</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Completed
                                    </CardTitle>
                                    <PackageCheck className="h-4 w-4 text-green-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '...' : stats.completed_requests}
                                </div>
                                <p className="text-xs text-gray-600">Successfully completed</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Ready for Pickup
                                    </CardTitle>
                                    <Package className="h-4 w-4 text-green-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '...' : stats.ready_for_pickup}
                                </div>
                                <p className="text-xs text-gray-600">Ready to be collected</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Due for Recalibration
                                    </CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '...' : stats.overdue_equipment}
                                </div>
                                <p className="text-xs text-gray-600">Need recalibration soon</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Recent Activities Section */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Activities
                    </h2>
                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">Loading activities...</div>
                            ) : recentActivities.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">No recent activities</div>
                            ) : (
                                <div className="divide-y">
                                    {recentActivities.map((activity) => (
                                        <div key={activity.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {activity.equipment_name}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            ({activity.equipment_recall})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                                                            {activity.status}
                                                        </span>
                                                        {activity.technician_name && (
                                                            <span className="text-sm text-gray-500">
                                                                • by {activity.technician_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(activity.status_changed_at)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
