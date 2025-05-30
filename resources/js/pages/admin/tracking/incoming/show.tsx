import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackIncoming } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, MapPin, Calendar, Package, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface TrackingIncomingShowProps {
    request: TrackIncoming;
}

const TrackingIncomingShow: React.FC<TrackingIncomingShowProps> = ({ request }) => {
    const { canManageRequestIncoming } = useRole();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tracking Management',
            href: '/admin/tracking',
        },
        {
            title: 'Incoming Requests',
            href: '/admin/tracking/incoming',
        },
        {
            title: request.recall_number,
            href: `/admin/tracking/incoming/${request.track_incoming_id}`,
        },
    ];

    if (!canManageRequestIncoming()) {
        return null;
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_calibration':
                return <Badge variant="secondary">Pending Calibration</Badge>;
            case 'calibration_in_progress':
                return <Badge variant="default">Calibration in Progress</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const isOverdue = new Date(request.due_date) < new Date();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Incoming Request: ${request.recall_number}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.tracking.incoming.index')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Incoming Requests
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Request: {request.recall_number}
                            </h1>
                            <p className="text-muted-foreground">Incoming calibration request details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        {isOverdue && (
                            <Badge variant="destructive">Overdue</Badge>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Equipment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Equipment Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Description</Label>
                                <p className="text-sm text-muted-foreground">{request.description}</p>
                            </div>

                            {request.serial_number && (
                                <div>
                                    <Label className="text-sm font-medium">Serial Number</Label>
                                    <p className="text-sm text-muted-foreground">{request.serial_number}</p>
                                </div>
                            )}

                            {request.manufacturer && (
                                <div>
                                    <Label className="text-sm font-medium">Manufacturer</Label>
                                    <p className="text-sm text-muted-foreground">{request.manufacturer}</p>
                                </div>
                            )}

                            {request.model && (
                                <div>
                                    <Label className="text-sm font-medium">Model</Label>
                                    <p className="text-sm text-muted-foreground">{request.model}</p>
                                </div>
                            )}

                            {request.equipment && (
                                <div>
                                    <Label className="text-sm font-medium">Equipment Status</Label>
                                    <Badge variant="outline">{request.equipment.status}</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Request Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Request Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Date Received</Label>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(request.date_in), 'MMMM dd, yyyy HH:mm')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Due Date</Label>
                                <p className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                    {format(new Date(request.due_date), 'MMMM dd, yyyy')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div>{getStatusBadge(request.status)}</div>
                            </div>

                            {request.notes && (
                                <div>
                                    <Label className="text-sm font-medium">Notes</Label>
                                    <p className="text-sm text-muted-foreground">{request.notes}</p>
                                </div>
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
                            {request.technician && (
                                <div>
                                    <Label className="text-sm font-medium">Assigned Technician</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {request.technician.first_name} {request.technician.last_name}
                                    </p>
                                    {request.technician.email && (
                                        <p className="text-xs text-muted-foreground">{request.technician.email}</p>
                                    )}
                                </div>
                            )}

                            {request.employee_in && (
                                <div>
                                    <Label className="text-sm font-medium">Received By</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {request.employee_in.first_name} {request.employee_in.last_name}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Location Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {request.location && (
                                <div>
                                    <Label className="text-sm font-medium">Current Location</Label>
                                    <p className="text-sm text-muted-foreground">{request.location.location_name}</p>
                                    {request.location.department && (
                                        <p className="text-xs text-muted-foreground">
                                            Department: {request.location.department.department_name}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Completion Information */}
                {request.track_outgoing && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Calibration Completion
                            </CardTitle>
                            <CardDescription>
                                This request has been completed and is available for pickup
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label className="text-sm font-medium">Calibration Date</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(request.track_outgoing.cal_date), 'MMMM dd, yyyy')}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">Next Due Date</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(request.track_outgoing.cal_due_date), 'MMMM dd, yyyy')}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">Date Out</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(request.track_outgoing.date_out), 'MMMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>

                            {request.track_outgoing.certificate_number && (
                                <div>
                                    <Label className="text-sm font-medium">Certificate Number</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {request.track_outgoing.certificate_number}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.tracking.outgoing.show', request.track_outgoing.track_outgoing_id)}>
                                        View Completion Details
                                    </Link>
                                </Button>
                                {request.track_outgoing.certificate_number && (
                                    <Button variant="outline" asChild>
                                        <Link href={route('admin.tracking.outgoing.certificate', request.track_outgoing.track_outgoing_id)}>
                                            <FileText className="h-3 w-3 mr-1" />
                                            View Certificate
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default TrackingIncomingShow;
