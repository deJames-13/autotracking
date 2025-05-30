import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Clock, Package, AlertTriangle, Activity, Calendar, MapPin, Plus } from 'lucide-react';
import { format } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Equipment Tracking',
        href: '/employee/tracking',
    },
];

interface Equipment {
    equipment_id: number;
    serial_number: string;
    description: string;
    manufacturer?: string;
    model?: string;
    tracking_records: TrackingRecord[];
}

interface TrackingRecord {
    tracking_id: number;
    date_out?: string;
    date_in?: string;
    cal_due_date?: string;
    location?: {
        location_name: string;
    };
    equipment?: Equipment;
}

interface EmployeeTrackingIndexProps {
    assignedEquipment: Equipment[];
    recentActivities: TrackingRecord[];
    overdueEquipment: Equipment[];
    stats: {
        total_assigned: number;
        overdue_count: number;
        recent_activities: number;
    };
}

const EmployeeTrackingIndex: React.FC<EmployeeTrackingIndexProps> = ({
    assignedEquipment,
    recentActivities,
    overdueEquipment,
    stats
}) => {
    const getStatusBadge = (equipment: Equipment) => {
        const latestRecord = equipment.tracking_records[0];

        if (!latestRecord) {
            return <Badge variant="secondary">No Activity</Badge>;
        }

        if (latestRecord.date_out && !latestRecord.date_in) {
            return <Badge variant="destructive">Checked Out</Badge>;
        }

        if (latestRecord.date_in) {
            return <Badge variant="default">Checked In</Badge>;
        }

        if (latestRecord.cal_due_date && new Date(latestRecord.cal_due_date) < new Date()) {
            return <Badge variant="destructive">Overdue</Badge>;
        }

        return <Badge variant="default">Active</Badge>;
    };

    const isOverdue = (equipment: Equipment) => {
        const latestRecord = equipment.tracking_records[0];
        return latestRecord?.cal_due_date && new Date(latestRecord.cal_due_date) < new Date();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Equipment Tracking" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Equipment Tracking</h1>
                        <p className="text-muted-foreground">Manage your assigned equipment and tracking activities</p>
                    </div>
                    <Button asChild>
                        <Link href={route('employee.tracking.request.index')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Request Calibration
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_assigned}</div>
                            <p className="text-xs text-muted-foreground">Equipment assigned to you</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{stats.overdue_count}</div>
                            <p className="text-xs text-muted-foreground">Equipment past due date</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.recent_activities}</div>
                            <p className="text-xs text-muted-foreground">Your recent actions</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Overdue Equipment Alert */}
                {overdueEquipment.length > 0 && (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Overdue Equipment
                            </CardTitle>
                            <CardDescription>
                                The following equipment is past its due date and requires immediate attention.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {overdueEquipment.map(equipment => (
                                    <div key={equipment.equipment_id} className="flex items-center justify-between p-3 border rounded-md">
                                        <div>
                                            <p className="font-medium">{equipment.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                S/N: {equipment.serial_number}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="destructive">Overdue</Badge>
                                            {equipment.tracking_records[0]?.cal_due_date && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Due: {format(new Date(equipment.tracking_records[0].cal_due_date), 'MMM dd, yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Assigned Equipment */}
                    <Card>
                        <CardHeader>
                            <CardTitle>My Equipment</CardTitle>
                            <CardDescription>Equipment currently assigned to you</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {assignedEquipment.length > 0 ? (
                                <div className="space-y-4">
                                    {assignedEquipment.map(equipment => (
                                        <div key={equipment.equipment_id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium">{equipment.description}</p>
                                                    {getStatusBadge(equipment)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    S/N: {equipment.serial_number}
                                                </p>
                                                {equipment.manufacturer && equipment.model && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {equipment.manufacturer} {equipment.model}
                                                    </p>
                                                )}
                                                {equipment.tracking_records[0]?.cal_due_date && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                        <p className={`text-xs ${isOverdue(equipment) ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                            Due: {format(new Date(equipment.tracking_records[0].cal_due_date), 'MMM dd, yyyy')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link href={route('employee.tracking.equipment.show', equipment.equipment_id)}>
                                                    View Details
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">
                                    No equipment currently assigned to you.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Activities */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activities</CardTitle>
                            <CardDescription>Your recent tracking activities</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentActivities.length > 0 ? (
                                <div className="space-y-4">
                                    {recentActivities.map(activity => (
                                        <div key={activity.tracking_id} className="flex items-start gap-3 p-3 border rounded-md">
                                            <div className="flex-shrink-0 mt-1">
                                                {activity.date_in ? (
                                                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                                ) : (
                                                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-medium">
                                                        {activity.date_in ? 'Checked In' : 'Checked Out'}
                                                    </p>
                                                    <Badge variant="outline" className="text-xs">
                                                        {activity.date_in
                                                            ? format(new Date(activity.date_in), 'MMM dd, HH:mm')
                                                            : format(new Date(activity.date_out!), 'MMM dd, HH:mm')
                                                        }
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {activity.equipment?.description}
                                                </p>
                                                {activity.location && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <p className="text-xs text-muted-foreground">
                                                            {activity.location.location_name}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">
                                    No recent activities found.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
};

export default EmployeeTrackingIndex;
