import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Package, Clock, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useRole } from '@/hooks/use-role';

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
            <Head title={isAdmin() ? "Admin Dashboard" : "Technician Dashboard"} />
            <div className="flex h-full flex-1 flex-col gap-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isAdmin() ? "Admin Dashboard" : "Technician Dashboard"}
                        </h1>
                        <p className="text-muted-foreground">
                            {isAdmin()
                                ? "Overview of system activity and equipment tracking"
                                : "Your assigned equipment tracking and calibration activities"
                            }
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.tracking.request.index')}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Request
                        </Link>
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_equipment}</div>
                            <p className="text-xs text-muted-foreground">
                                {isTechnician() ? "In your scope" : "Registered in system"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_requests}</div>
                            <p className="text-xs text-muted-foreground">
                                {isTechnician() ? "Assigned to you" : "Pending calibration"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Equipment Tracked</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.equipment_tracked}</div>
                            <p className="text-xs text-muted-foreground">
                                {isTechnician() ? "You're handling" : "Currently out"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Conditionally show stats based on role */}
                    {isAdmin() && stats.total_users > 0 ? (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_users}</div>
                                <p className="text-xs text-muted-foreground">Active accounts</p>
                            </CardContent>
                        </Card>
                    ) : (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Overdue Equipment</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-destructive">{stats.overdue_equipment}</div>
                                    <p className="text-xs text-muted-foreground">Needs attention</p>
                                </CardContent>
                            </Card>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent Activities */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivities.length > 0 ? (
                                    recentActivities.map((activity) => (
                                        <div key={activity.id} className="flex items-center space-x-4">
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    by {activity.user} • {new Date(activity.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {isTechnician() ? "No recent activities for your assignments" : "No recent activities"}
                                        </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Requests */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>
                                {isTechnician() ? "Your Pending Requests" : "Pending Requests"}
                            </CardTitle>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('admin.tracking.incoming.index')}>View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingRequests.length > 0 ? (
                                    pendingRequests.map((request) => (
                                        <div key={request.id} className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">
                                                    {request.equipment?.recall_number}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Requested by {request.requested_by?.first_name} {request.requested_by?.last_name}
                                                </p>
                                            </div>
                                            <Badge variant="outline">Pending</Badge>
                                        </div>
                                    ))
                                ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {isTechnician() ? "No pending requests assigned to you" : "No pending requests"}
                                        </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions - Role-based visibility */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <Link href={route('admin.tracking.incoming.index')}>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <ArrowDownToLine className="h-8 w-8 text-primary" />
                                    <div>
                                        <h3 className="font-semibold">
                                            {isTechnician() ? "My Incoming Requests" : "Incoming Requests"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isTechnician() ? "Equipment assigned to you" : "Review equipment submissions"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <Link href={route('admin.tracking.outgoing.index')}>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <ArrowUpFromLine className="h-8 w-8 text-primary" />
                                    <div>
                                        <h3 className="font-semibold">
                                            {isTechnician() ? "My Completions" : "Outgoing Completions"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isTechnician() ? "Equipment you've completed" : "Process completed calibrations"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* Equipment Management - Only show if user can manage equipment */}
                    {canManageEquipment() && (
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <Link href={route('admin.equipment.index')}>
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-4">
                                        <Package className="h-8 w-8 text-primary" />
                                        <div>
                                            <h3 className="font-semibold">Manage Equipment</h3>
                                            <p className="text-sm text-muted-foreground">View and manage all equipment</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    )}

                    {/* User Management - Only show if user can manage users */}
                    {canManageUsers() && (
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <Link href={route('admin.users.index')}>
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-4">
                                        <Users className="h-8 w-8 text-primary" />
                                        <div>
                                            <h3 className="font-semibold">Manage Users</h3>
                                            <p className="text-sm text-muted-foreground">View and manage user accounts</p>
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
