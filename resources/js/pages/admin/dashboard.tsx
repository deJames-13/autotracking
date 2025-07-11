import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Clock, Package, Plus, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
];

interface AdminDashboardProps {
    stats: {
        total_equipment: number;
        active_requests: number;
        equipment_tracked: number;
        total_users: number;
        overdue_equipment: number;
        recent_updates: number;
    };
    recentActivities: Array<{
        id: number;
        type: string;
        description: string;
        user: string;
        created_at: string;
    }>;
    pendingRequests: Array<{
        id: number;
        equipment: any;
        requested_by: any;
        technician: any;
        status: string;
        created_at: string;
    }>;
}

export default function AdminDashboard({ stats, recentActivities, pendingRequests }: AdminDashboardProps) {
    const { isAdmin, isTechnician, canManageUsers, canManageEquipment } = useRole();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isAdmin() ? 'Admin Dashboard' : 'Technician Dashboard'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-2 md:p-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{isAdmin() ? 'Admin Dashboard' : 'Technician Dashboard'}</h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            {isAdmin()
                                ? 'Overview of system activity and equipment tracking'
                                : 'Your assigned equipment tracking and calibration activities'}
                        </p>
                    </div>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href={route('admin.tracking.request.index')}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Request
                        </Link>
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium">Total Equipment</CardTitle>
                            <Package className="text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="text-xl md:text-2xl font-bold">{stats.total_equipment}</div>
                            <p className="text-muted-foreground text-xs">{isTechnician() ? 'In your scope' : 'Registered in system'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium">Active Requests</CardTitle>
                            <Clock className="text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="text-xl md:text-2xl font-bold">{stats.active_requests}</div>
                            <p className="text-muted-foreground text-xs">{isTechnician() ? 'Assigned to you' : 'Pending calibration'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium">Equipment Tracked</CardTitle>
                            <Package className="text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="text-xl md:text-2xl font-bold">{stats.equipment_tracked}</div>
                            <p className="text-muted-foreground text-xs">{isTechnician() ? "You're handling" : 'Currently out'}</p>
                        </CardContent>
                    </Card>

                    {/* Conditionally show stats based on role */}
                    {isAdmin() && stats.total_users > 0 ? (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs md:text-sm font-medium">Total Users</CardTitle>
                                <Users className="text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="text-xl md:text-2xl font-bold">{stats.total_users}</div>
                                <p className="text-muted-foreground text-xs">Active accounts</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs md:text-sm font-medium">Overdue Equipment</CardTitle>
                                    <AlertTriangle className="text-destructive h-3 w-3 md:h-4 md:w-4" />
                            </CardHeader>
                                <CardContent className="pt-2">
                                    <div className="text-destructive text-xl md:text-2xl font-bold">{stats.overdue_equipment}</div>
                                <p className="text-muted-foreground text-xs">Needs attention</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Recent Activities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base md:text-lg">Recent Activities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 md:space-y-4">
                                {recentActivities.length > 0 ? (
                                    recentActivities.slice(0, 5).map((activity) => (
                                        <div key={activity.id} className="flex items-start space-x-3">
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm md:text-base font-medium leading-tight">{activity.description}</p>
                                                <p className="text-muted-foreground text-xs">
                                                    by {activity.user} • {new Date(activity.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        {isTechnician() ? 'No recent activities for your assignments' : 'No recent activities'}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Requests */}
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <CardTitle className="text-base md:text-lg">{isTechnician() ? 'Your Pending Requests' : 'Pending Requests'}</CardTitle>
                            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                                <Link href={route('admin.tracking.incoming.index')}>View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 md:space-y-4">
                                {pendingRequests.length > 0 ? (
                                    pendingRequests.slice(0, 5).map((request) => (
                                        <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                            <div className="space-y-1">
                                                <p className="text-sm md:text-base font-medium">{request.equipment?.recall_number}</p>
                                                <p className="text-muted-foreground text-xs">
                                                    Requested by {request.requested_by?.first_name} {request.requested_by?.last_name}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="self-start sm:self-center">Pending</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        {isTechnician() ? 'No pending requests assigned to you' : 'No pending requests'}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions - Role-based visibility */}
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
                        <Link href={route('admin.tracking.incoming.index')}>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                    <ArrowDownToLine className="text-primary h-6 w-6 md:h-8 md:w-8 self-center sm:self-auto" />
                                    <div className="text-center sm:text-left">
                                        <h3 className="font-semibold text-sm md:text-base">{isTechnician() ? 'My Incoming Requests' : 'Incoming Requests'}</h3>
                                        <p className="text-muted-foreground text-xs md:text-sm">
                                            {isTechnician() ? 'Equipment assigned to you' : 'Review equipment submissions'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
                        <Link href={route('admin.tracking.outgoing.index')}>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                    <ArrowUpFromLine className="text-primary h-6 w-6 md:h-8 md:w-8 self-center sm:self-auto" />
                                    <div className="text-center sm:text-left">
                                        <h3 className="font-semibold text-sm md:text-base">{isTechnician() ? 'My Completions' : 'Outgoing Completions'}</h3>
                                        <p className="text-muted-foreground text-xs md:text-sm">
                                            {isTechnician() ? "Equipment you've completed" : 'Process completed calibrations'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* Equipment Management - Only show if user can manage equipment */}
                    {canManageEquipment() && (
                        <Card className="cursor-pointer transition-shadow hover:shadow-md">
                            <Link href={route('admin.equipment.index')}>
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                        <Package className="text-primary h-6 w-6 md:h-8 md:w-8 self-center sm:self-auto" />
                                        <div className="text-center sm:text-left">
                                            <h3 className="font-semibold text-sm md:text-base">Manage Equipment</h3>
                                            <p className="text-muted-foreground text-xs md:text-sm">View and manage all equipment</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    )}

                    {/* User Management - Only show if user can manage users */}
                    {canManageUsers() && (
                        <Card className="cursor-pointer transition-shadow hover:shadow-md">
                            <Link href={route('admin.users.index')}>
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                        <Users className="text-primary h-6 w-6 md:h-8 md:w-8 self-center sm:self-auto" />
                                        <div className="text-center sm:text-left">
                                            <h3 className="font-semibold text-sm md:text-base">Manage Users</h3>
                                            <p className="text-muted-foreground text-xs md:text-sm">View and manage user accounts</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
