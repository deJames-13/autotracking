import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackOutgoing } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, Calendar, Package, Clock, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface TrackingOutgoingShowProps {
    trackOutgoing: TrackOutgoing;
}

const TrackingOutgoingShow: React.FC<TrackingOutgoingShowProps> = ({ trackOutgoing }) => {
    const { canManageRequestIncoming } = useRole();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tracking Management',
            href: '/admin/tracking',
        },
        {
            title: 'Outgoing Completions',
            href: '/admin/tracking/outgoing',
        },
        {
            title: trackOutgoing.recall_number,
            href: `/admin/tracking/outgoing/${trackOutgoing.id}`,
        },
    ];

    if (!canManageRequestIncoming()) {
        return null;
    }

    const getStatusBadge = () => {

        if (trackOutgoing.cal_date && trackOutgoing.cal_due_date) {
            const calDate = new Date(trackOutgoing.cal_date);
            const dueDDate = new Date(trackOutgoing.cal_due_date);

            if (calDate < dueDDate) {
                return <Badge variant="default">Completed</Badge>;
            } else {
                return <Badge variant="secondary">For Routine Calibration</Badge>;
            }
        }
    };


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Outgoing Completion: ${trackOutgoing.recall_number}`} />

            <div className="space-y-6 p-6">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.tracking.outgoing.index')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Outgoing Completions
                            </Link>
                        </Button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Completion: {trackOutgoing.recall_number}
                            </h1>
                            <p className="text-muted-foreground">Calibration completion details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge()}
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.tracking.outgoing.edit', trackOutgoing.id)}>
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Calibration Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Calibration Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Calibration Date</Label>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(trackOutgoing.cal_date), 'MMMM dd, yyyy')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Next Due Date</Label>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(trackOutgoing.cal_due_date), 'MMMM dd, yyyy')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Date Out</Label>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(trackOutgoing.date_out), 'MMMM dd, yyyy HH:mm')}
                                </p>
                            </div>

                            {trackOutgoing.cycle_time && (
                                <div>
                                    <Label className="text-sm font-medium">Cycle Time</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.cycle_time} days
                                    </p>
                                </div>
                            )}

                            <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div>{getStatusBadge()}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Equipment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Equipment Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {trackOutgoing.track_incoming && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium">Description</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {trackOutgoing.track_incoming.description}
                                        </p>
                                    </div>

                                    {trackOutgoing.track_incoming.serial_number && (
                                        <div>
                                            <Label className="text-sm font-medium">Serial Number</Label>
                                            <p className="text-sm text-muted-foreground">
                                                {trackOutgoing.track_incoming.serial_number}
                                            </p>
                                        </div>
                                    )}

                                    {trackOutgoing.track_incoming.manufacturer && (
                                        <div>
                                            <Label className="text-sm font-medium">Manufacturer</Label>
                                            <p className="text-sm text-muted-foreground">
                                                {trackOutgoing.track_incoming.manufacturer}
                                            </p>
                                        </div>
                                    )}

                                    {trackOutgoing.track_incoming.model && (
                                        <div>
                                            <Label className="text-sm font-medium">Model</Label>
                                            <p className="text-sm text-muted-foreground">
                                                {trackOutgoing.track_incoming.model}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Personnel Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Personnel
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {trackOutgoing.technician && (
                                <div>
                                    <Label className="text-sm font-medium">Technician</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.technician.first_name} {trackOutgoing.technician.last_name}
                                    </p>
                                    {trackOutgoing.technician.email && (
                                        <p className="text-xs text-muted-foreground">
                                            {trackOutgoing.technician.email}
                                        </p>
                                    )}
                                </div>
                            )}

                            {trackOutgoing.employee_out_user && (
                                <div>
                                    <Label className="text-sm font-medium">Released By</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.employee_out_user.first_name} {trackOutgoing.employee_out_user.last_name}
                                    </p>
                                </div>
                            )}

                            {trackOutgoing.track_incoming?.employee_in && (
                                <div>
                                    <Label className="text-sm font-medium">Originally Received By</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.track_incoming.employee_in.first_name} {trackOutgoing.track_incoming.employee_in.last_name}
                                    </p>
                                    {trackOutgoing.track_incoming.employee_in.email && (
                                        <p className="text-xs text-muted-foreground">{trackOutgoing.track_incoming.employee_in.email}</p>
                                    )}
                                    {trackOutgoing.track_incoming.employee_in.department && (
                                        <p className="text-xs text-muted-foreground">
                                            Department: {trackOutgoing.track_incoming.employee_in.department.department_name}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {trackOutgoing.track_incoming && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium">Request Received</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(trackOutgoing.track_incoming.date_in), 'MMMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium">Original Due Date</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(trackOutgoing.track_incoming.due_date), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                </>
                            )}

                            <div>
                                <Label className="text-sm font-medium">Calibration Completed</Label>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(trackOutgoing.cal_date), 'MMMM dd, yyyy')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Released for Pickup</Label>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(trackOutgoing.date_out), 'MMMM dd, yyyy HH:mm')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Original Request Information */}
                {trackOutgoing.track_incoming && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Request</CardTitle>
                            <CardDescription>
                                View the original incoming calibration request
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">
                                        Incoming Request: {trackOutgoing.track_incoming.recall_number}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Status: {trackOutgoing.track_incoming.status}
                                    </p>
                                </div>
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.tracking.incoming.show', trackOutgoing.track_incoming.id)}>
                                        View Request Details
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default TrackingOutgoingShow;
