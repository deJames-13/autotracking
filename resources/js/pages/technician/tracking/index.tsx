import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import TechnicianLayout from '@/layouts/technician-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, FileText, Package, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { Link } from '@inertiajs/react';
import axios from 'axios';

interface DashboardStats {
    incoming: {
        pending_calibration: number;
        in_calibration: number;
        for_release: number;
        for_confirmation: number;
        completed: number;
        total: number;
    };
    outgoing: {
        for_pickup: number;
        completed: number;
        total: number;
    };
    overview: {
        today_completed: number;
        yesterday_completed: number;
        completed_change: number;
        overdue_equipment: number;
        due_soon_equipment: number;
    };
    recent_activity: Array<{
        id: number;
        recall_number: string;
        description: string;
        status: string;
        updated_at: string;
        employee_name: string;
    }>;
}

const TechnicianTrackingIndex: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(route('technician.tracking.api.dashboard.stats'));
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <TechnicianLayout>
                <Head title="Technician Tracking Dashboard" />
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            </TechnicianLayout>
        );
    }

    return (
        <TechnicianLayout>
            <Head title="Technician Tracking Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Equipment Tracking</h1>
                        <p className="text-muted-foreground">
                            Manage your assigned calibration requests and track equipment status
                        </p>
                    </div>
                    <Link href={route('technician.tracking.request.index')}>
                        <Button>
                            <FileText className="mr-2 h-4 w-4" />
                            New Request
                        </Button>
                    </Link>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Pending Calibration
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.incoming.pending_calibration || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.overview.overdue_equipment ? (
                                    <span className="text-red-600 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {stats.overview.overdue_equipment} overdue
                                    </span>
                                ) : (
                                    'All up to date'
                                )}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                In Calibration
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.incoming.in_calibration || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.overview.due_soon_equipment ? (
                                    <span className="text-yellow-600 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {stats.overview.due_soon_equipment} due soon
                                    </span>
                                ) : (
                                    'No urgent items'
                                )}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ready for Release
                            </CardTitle>
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.incoming.for_release || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting pickup
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Completed Today
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.overview.today_completed || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.overview.completed_change !== undefined && (
                                    stats.overview.completed_change >= 0 ? (
                                        <span className="text-green-600">
                                            +{stats.overview.completed_change.toFixed(1)}% from yesterday
                                        </span>
                                    ) : (
                                        <span className="text-red-600">
                                            {stats.overview.completed_change.toFixed(1)}% from yesterday
                                        </span>
                                    )
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Navigation Tabs */}
                <Tabs defaultValue="incoming" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="incoming">Incoming Equipment</TabsTrigger>
                        <TabsTrigger value="outgoing">Outgoing Equipment</TabsTrigger>
                    </TabsList>

                    <TabsContent value="incoming" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Assigned Equipment</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Equipment assigned to you for calibration
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span>View all incoming equipment</span>
                                        <Link href={route('technician.tracking.incoming.index')}>
                                            <Button variant="outline">View All</Button>
                                        </Link>
                                    </div>

                                    {/* Quick status filters */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <Link href={route('technician.tracking.incoming.index', { status: 'pending_calibration' })}>
                                            <Button variant="outline" className="w-full justify-start">
                                                <Badge variant="secondary" className="mr-2">
                                                    {stats?.incoming.pending_calibration || 0}
                                                </Badge>
                                                Pending
                                            </Button>
                                        </Link>
                                        <Link href={route('technician.tracking.incoming.index', { status: 'in_calibration' })}>
                                            <Button variant="outline" className="w-full justify-start">
                                                <Badge variant="default" className="mr-2">
                                                    {stats?.incoming.in_calibration || 0}
                                                </Badge>
                                                In Progress
                                            </Button>
                                        </Link>
                                        <Link href={route('technician.tracking.incoming.index', { status: 'for_release' })}>
                                            <Button variant="outline" className="w-full justify-start">
                                                <Badge variant="success" className="mr-2">
                                                    {stats?.incoming.for_release || 0}
                                                </Badge>
                                                Ready
                                            </Button>
                                        </Link>
                                        <Link href={route('technician.tracking.incoming.index', { status: 'for_confirmation' })}>
                                            <Button variant="outline" className="w-full justify-start">
                                                <Badge variant="warning" className="mr-2">
                                                    {stats?.incoming.for_confirmation || 0}
                                                </Badge>
                                                Confirmation
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="outgoing" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Equipment You Processed</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Track equipment you've calibrated through pickup and completion
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span>View all outgoing equipment</span>
                                        <Link href={route('technician.tracking.outgoing.index')}>
                                            <Button variant="outline">View All</Button>
                                        </Link>
                                    </div>

                                    {/* Quick status filters */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link href={route('technician.tracking.outgoing.index', { status: 'for_pickup' })}>
                                            <Button variant="outline" className="w-full justify-start">
                                                <Badge variant="warning" className="mr-2">
                                                    {stats?.outgoing.for_pickup || 0}
                                                </Badge>
                                                For Pickup
                                            </Button>
                                        </Link>
                                        <Link href={route('technician.tracking.outgoing.index', { status: 'completed' })}>
                                            <Button variant="outline" className="w-full justify-start">
                                                <Badge variant="success" className="mr-2">
                                                    {stats?.outgoing.completed || 0}
                                                </Badge>
                                                Completed
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </TechnicianLayout>
    );
};

export default TechnicianTrackingIndex;
