import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackOutgoing } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, Calendar, Package, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TrackingOutgoingShowProps {
    completion: TrackOutgoing;
}

const TrackingOutgoingShow: React.FC<TrackingOutgoingShowProps> = ({ completion }) => {
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
            title: completion.recall_number,
            href: `/admin/tracking/outgoing/${completion.track_outgoing_id}`,
        },
    ];

    if (!canManageRequestIncoming()) {
        return null;
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ready_for_pickup':
                return <Badge variant="default">Ready for Pickup</Badge>;
            case 'completed':
                return <Badge variant="secondary">Completed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Outgoing Completion: ${completion.recall_number}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.tracking.outgoing.index')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Outgoing Completions
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Completion: {completion.recall_number}
                            </h1>
                            <p className="text-muted-foreground">Calibration completion details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(completion.status)}
                        {completion.certificate_number && (
                            <Button variant="outline" asChild>
                                <Link href={route('admin.tracking.outgoing.certificate', completion.track_outgoing_id)}>
                                    <FileText className="h-3 w-3 mr-1" />
                                    View Certificate
                                </Link>
                            </Button>
                        )}
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
                                    {format(new Date(completion.cal_date), 'MMMM dd, yyyy')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Next Due Date</Label>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(completion.cal_due_date), 'MMMM dd, yyyy')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Date Out</Label>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(completion.date_out), 'MMMM dd, yyyy HH:mm')}
                                </p>
                            </div>

                            {completion.certificate_number && (
                                <div>
                                    <Label className="text-sm font-medium">Certificate Number</Label>
                                    <p className="text-sm font-medium text-primary">
                                        {completion.certificate_number}
                                    </p>
                                </div>
                            )}

                            {completion.cycle_time && (
                                <div>
                                    <Label className="text-sm font-medium">Cycle Time</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {completion.cycle_time} days
                                    </p>
                                </div>
                            )}

                            <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div>{getStatusBadge(completion.status)}</div>
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
                            {completion.track_incoming && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium">Description</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {completion.track_incoming.description}
                                        </p>
                                    </div>

                                    {completion.track_incoming.serial_number && (
                                        <div>
                                            <Label className="text-sm font-medium">Serial Number</Label>
                                            <p className="text-sm text-muted-foreground">
                                                {completion.track_incoming.serial_number}
                                            </p>
                                        </div>
                                    )}

                                    {completion.track_incoming.manufacturer && (
                                        <div>
                                            <Label className="text-sm font-medium">Manufacturer</Label>
                                            <p className="text-sm text-muted-foreground">
                                                {completion.track_incoming.manufacturer}
                                            </p>
                                        </div>
                                    )}

                                    {completion.track_incoming.model && (
                                        <div>
                                            <Label className="text-sm font-medium">Model</Label>
                                            <p className="text-sm text-muted-foreground">
                                                {completion.track_incoming.model}
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
                            {completion.technician && (
                                <div>
                                    <Label className="text-sm font-medium">Technician</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {completion.technician.first_name} {completion.technician.last_name}
                                    </p>
                                    {completion.technician.email && (
                                        <p className="text-xs text-muted-foreground">
                                            {completion.technician.email}
                                        </p>
                                    )}
                                </div>
                            )}

                            {completion.employee_out_user && (
                                <div>
                                    <Label className="text-sm font-medium">Released By</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {completion.employee_out_user.first_name} {completion.employee_out_user.last_name}
                                    </p>
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
                            {completion.track_incoming && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium">Request Received</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(completion.track_incoming.date_in), 'MMMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium">Original Due Date</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(completion.track_incoming.due_date), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                </>
                            )}

                            <div>
                                <Label className="text-sm font-medium">Calibration Completed</Label>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(completion.cal_date), 'MMMM dd, yyyy')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Released for Pickup</Label>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(completion.date_out), 'MMMM dd, yyyy HH:mm')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Notes */}
                {completion.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{completion.notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Original Request Information */}
                {completion.track_incoming && (
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
                                        Incoming Request: {completion.track_incoming.recall_number}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Status: {completion.track_incoming.status}
                                    </p>
                                </div>
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.tracking.incoming.show', completion.track_incoming.track_incoming_id)}>
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
