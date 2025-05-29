import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Users, Wrench, Activity, AlertTriangle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
];

interface DashboardStats {
    total_users: number;
    total_equipment: number;
    active_tracking: number;
    overdue_tracking: number;
}

interface RecentTracking {
    tracking_id: number;
    equipment: {
        description: string;
        serial_number: string;
    };
    technician: {
        first_name: string;
        last_name: string;
    };
    location: {
        location_name: string;
    };
    cal_due_date: string;
}

interface AdminDashboardProps {
    stats: DashboardStats;
    recentTracking: RecentTracking[];
}

export default function AdminDashboard({ stats, recentTracking }: AdminDashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Overview of system management and tracking activities</p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_users}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_equipment}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Tracking</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_tracking}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{stats.overdue_tracking}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Tracking */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Tracking Activities</CardTitle>
                        <CardDescription>Latest equipment tracking records</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentTracking.length > 0 ? (
                            <div className="space-y-4">
                                {recentTracking.map((record) => (
                                    <div key={record.tracking_id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{record.equipment.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                S/N: {record.equipment.serial_number} • 
                                                Technician: {record.technician.first_name} {record.technician.last_name} • 
                                                Location: {record.location.location_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Due Date</p>
                                            <p className="font-medium">{new Date(record.cal_due_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No recent tracking activities</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
