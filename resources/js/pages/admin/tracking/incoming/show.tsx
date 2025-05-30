import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackIncoming } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, User, MapPin, Calendar, Package, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { OutgoingCalibrationModal } from '@/components/admin/outgoing/outgoing-calibration-modal';

interface TrackingIncomingShowProps {
    trackIncoming: TrackIncoming;
}

const TrackingIncomingShow: React.FC<TrackingIncomingShowProps> = ({ trackIncoming }) => {
    const { canManageRequestIncoming } = useRole();
    const [showCalibrationModal, setShowCalibrationModal] = useState(false);

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
            title: trackIncoming.recall_number,
            href: `/admin/tracking/incoming/${trackIncoming.id}`,
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

    const isOverdue = new Date(trackIncoming.due_date) < new Date();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Incoming Request: ${trackIncoming.recall_number}`} />

            <div className="space-y-6 p-6">
                <Button variant="outline" size="sm" asChild>
                    <Link href={route('admin.tracking.incoming.index')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Incoming Requests
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Request: {trackIncoming.recall_number}
                            </h1>
                            <p className="text-muted-foreground">Incoming calibration request details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(trackIncoming.status)}
                        {isOverdue && (
                            <Badge variant="destructive">Overdue</Badge>
                        )}
                        {(trackIncoming.status === 'pending_calibration' || trackIncoming.status === 'calibration_in_progress') && !trackIncoming.trackOutgoing && (
                            <Button
                                onClick={() => setShowCalibrationModal(true)}
                                size="sm"
                                className="ml-2"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete Calibration
                            </Button>
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
                                <p className="text-sm text-muted-foreground">{trackIncoming.description}</p>
                            </div>

                            {trackIncoming.serial_number && (
                                <div>
                                    <Label className="text-sm font-medium">Serial Number</Label>
                                    <p className="text-sm text-muted-foreground">{trackIncoming.serial_number}</p>
                                </div>
                            )}

                            {trackIncoming.manufacturer && (
                                <div>
                                    <Label className="text-sm font-medium">Manufacturer</Label>
                                    <p className="text-sm text-muted-foreground">{trackIncoming.manufacturer}</p>
                                </div>
                            )}

                            {trackIncoming.model && (
                                <div>
                                    <Label className="text-sm font-medium">Model</Label>
                                    <p className="text-sm text-muted-foreground">{trackIncoming.model}</p>
                                </div>
                            )}

                            {trackIncoming.equipment && (
                                <div>
                                    <Label className="text-sm font-medium">Equipment Status</Label>
                                    <Badge variant="outline">{trackIncoming.equipment.status}</Badge>
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
                                    {format(new Date(trackIncoming.date_in), 'MMMM dd, yyyy HH:mm')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Due Date</Label>
                                <p className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                    {format(new Date(trackIncoming.due_date), 'MMMM dd, yyyy')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div>{getStatusBadge(trackIncoming.status)}</div>
                            </div>

                            {trackIncoming.notes && (
                                <div>
                                    <Label className="text-sm font-medium">Notes</Label>
                                    <p className="text-sm text-muted-foreground">{trackIncoming.notes}</p>
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
                            {trackIncoming.technician && (
                                <div>
                                    <Label className="text-sm font-medium">Assigned Technician</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackIncoming.technician.first_name} {trackIncoming.technician.last_name}
                                    </p>
                                    {trackIncoming.technician.email && (
                                        <p className="text-xs text-muted-foreground">{trackIncoming.technician.email}</p>
                                    )}
                                </div>
                            )}

                            {trackIncoming.employeeIn && (
                                <div>
                                    <Label className="text-sm font-medium">Received By</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackIncoming.employeeIn.first_name} {trackIncoming.employeeIn.last_name}
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
                            {trackIncoming.location && (
                                <div>
                                    <Label className="text-sm font-medium">Current Location</Label>
                                    <p className="text-sm text-muted-foreground">{trackIncoming.location.location_name}</p>
                                    {trackIncoming.location.department && (
                                        <p className="text-xs text-muted-foreground">
                                            Department: {trackIncoming.location.department.department_name}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Completion Information */}
                {trackIncoming.trackOutgoing && (
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
                                {trackIncoming.trackOutgoing.cal_date && (
                                    <div>
                                        <Label className="text-sm font-medium">Calibration Date</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(trackIncoming.trackOutgoing.cal_date), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                )}

                                {trackIncoming.trackOutgoing.cal_due_date && (
                                    <div>
                                        <Label className="text-sm font-medium">Next Due Date</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(trackIncoming.trackOutgoing.cal_due_date), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                )}

                                {trackIncoming.trackOutgoing.date_out && (
                                    <div>
                                        <Label className="text-sm font-medium">Date Out</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(trackIncoming.trackOutgoing.date_out), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {trackIncoming.trackOutgoing.certificate_number && (
                                <div>
                                    <Label className="text-sm font-medium">Certificate Number</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackIncoming.trackOutgoing.certificate_number}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.tracking.outgoing.show', trackIncoming.trackOutgoing.id)}>
                                        View Completion Details
                                    </Link>
                                </Button>
                                {trackIncoming.trackOutgoing.certificate_number && (
                                    <Button variant="outline" asChild>
                                        <Link href={route('admin.tracking.outgoing.certificate', trackIncoming.trackOutgoing.id)}>
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

            {/* Outgoing Calibration Modal */}
            <OutgoingCalibrationModal
                incomingRecord={trackIncoming}
                open={showCalibrationModal}
                onOpenChange={setShowCalibrationModal}
                onSuccess={() => {
                    setShowCalibrationModal(false);
                    // Refresh the page to show updated data
                    router.reload();
                }}
            />
        </AppLayout>
    );
};

export default TrackingIncomingShow;
