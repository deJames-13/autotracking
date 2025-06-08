import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmployeeStatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackOutgoing } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Package,
    Calendar,
    User,
    FileText,
    CheckCircle,
    AlertTriangle,
    Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { PickupConfirmationModal } from '@/components/employee/tracking/pickup-confirmation-modal';

interface EmployeeTrackingOutgoingShowProps {
    trackOutgoing: TrackOutgoing;
}

const EmployeeTrackingOutgoingShow: React.FC<EmployeeTrackingOutgoingShowProps> = ({ trackOutgoing }) => {
    if (!trackOutgoing) {
        return router.visit(route('employee.tracking.outgoing.index'))
    }

    const { canSubmitCalibrationRequest } = useRole();
    const [showPickupModal, setShowPickupModal] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employee Tracking',
            href: '/employee/tracking',
        },
        {
            title: 'Ready for Pickup',
            href: '/employee/tracking/outgoing',
        },
        {
            title: trackOutgoing.track_incoming?.recall_number || 'N/A',
            href: `/employee/tracking/outgoing/${trackOutgoing.id}`,
        },
    ];

    if (!canSubmitCalibrationRequest()) {
        return null;
    }

    const getStatusBadge = () => {
        return <EmployeeStatusBadge status={trackOutgoing.status as 'for_pickup' | 'completed'} type="outgoing" />;
    };

    const isRecalibrationDue = () => {
        if (!trackOutgoing.cal_due_date) return false;
        return new Date(trackOutgoing.cal_due_date) <= new Date();
    };

    const canConfirmPickup = () => {
        return trackOutgoing.status === 'for_pickup';
    };

    const handlePickupSuccess = () => {
        setShowPickupModal(false);
        // Refresh the page to show updated status
        router.reload();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pickup Details: ${trackOutgoing.track_incoming?.recall_number}`} />

            <div className="space-y-6 p-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href={route('employee.tracking.outgoing.index')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Ready for Pickup
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Pickup: {trackOutgoing.track_incoming?.recall_number}
                            </h1>
                            <p className="text-muted-foreground">Calibration completion details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge()}
                        {isRecalibrationDue() && (
                            <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Recalibration Due
                            </Badge>
                        )}

                        {/* {canConfirmPickup() && (
                            <Button
                                onClick={() => setShowPickupModal(true)}
                                size="sm"
                                className="ml-2"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirm Pickup
                            </Button>
                        )} */}
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
                                <p className="text-sm text-muted-foreground">
                                    {trackOutgoing.track_incoming?.description || trackOutgoing.equipment?.description || 'N/A'}
                                </p>
                            </div>

                            {trackOutgoing.track_incoming?.serial_number && (
                                <div>
                                    <Label className="text-sm font-medium">Serial Number</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.track_incoming.serial_number}
                                    </p>
                                </div>
                            )}

                            {trackOutgoing.track_incoming?.manufacturer && (
                                <div>
                                    <Label className="text-sm font-medium">Manufacturer</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.track_incoming.manufacturer}
                                    </p>
                                </div>
                            )}

                            {trackOutgoing.track_incoming?.model && (
                                <div>
                                    <Label className="text-sm font-medium">Model</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.track_incoming.model}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Calibration Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Calibration Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {trackOutgoing.cal_date && (
                                <div>
                                    <Label className="text-sm font-medium">Calibration Date</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(trackOutgoing.cal_date), 'MMMM dd, yyyy')}
                                    </p>
                                </div>
                            )}

                            {trackOutgoing.cal_due_date && (
                                <div>
                                    <Label className="text-sm font-medium">Next Due Date</Label>
                                    <p className={`text-sm ${isRecalibrationDue()
                                            ? 'text-destructive font-medium'
                                            : 'text-muted-foreground'
                                        }`}>
                                        {format(new Date(trackOutgoing.cal_due_date), 'MMMM dd, yyyy')}
                                        {isRecalibrationDue() && ' (Overdue)'}
                                    </p>
                                </div>
                            )}

                            {/* {trackOutgoing.certificate_number && (
                                <div>
                                    <Label className="text-sm font-medium">Certificate Number</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.certificate_number}
                                    </p>
                                </div>
                            )} */}

                            {trackOutgoing.cycle_time != undefined && (
                                <div>
                                    <Label className="text-sm font-medium">Cycle Time</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.cycle_time} days
                                    </p>
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

                            {trackOutgoing.released_by && (
                                <div>
                                    <Label className="text-sm font-medium">Released By (Operator)</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.released_by.first_name} {trackOutgoing.released_by.last_name}
                                    </p>
                                    {trackOutgoing.released_by.email && (
                                        <p className="text-xs text-muted-foreground">
                                            {trackOutgoing.released_by.email}
                                        </p>
                                    )}
                                    {trackOutgoing.released_by.employee_id && (
                                        <p className="text-xs text-muted-foreground">
                                            Employee ID: {trackOutgoing.released_by.employee_id}
                                        </p>
                                    )}
                                </div>
                            )}

                            {trackOutgoing.employee_out && (
                                <div>
                                    <Label className="text-sm font-medium">Employee Out (Package Recipient)</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.employee_out.first_name} {trackOutgoing.employee_out.last_name}
                                    </p>
                                    {trackOutgoing.employee_out.email && (
                                        <p className="text-xs text-muted-foreground">
                                            {trackOutgoing.employee_out.email}
                                        </p>
                                    )}
                                    {trackOutgoing.employee_out.employee_id && (
                                        <p className="text-xs text-muted-foreground">
                                            Employee ID: {trackOutgoing.employee_out.employee_id}
                                        </p>
                                    )}
                                    {trackOutgoing.employee_out.department && (
                                        <p className="text-xs text-muted-foreground">
                                            Department: {trackOutgoing.employee_out.department.department_name}
                                        </p>
                                    )}
                                </div>
                            )}

                            {trackOutgoing.track_incoming?.employee_in && (
                                <div>
                                    <Label className="text-sm font-medium">Originally Submitted By</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.track_incoming.employee_in.first_name} {trackOutgoing.track_incoming.employee_in.last_name}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pickup Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Pickup Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div>{getStatusBadge()}</div>
                            </div>

                            {trackOutgoing.date_out && (
                                <div>
                                    <Label className="text-sm font-medium">Date Available</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(trackOutgoing.date_out), 'MMMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                            )}

                            {trackOutgoing.status === 'completed' && trackOutgoing.pickup_date && (
                                <div>
                                    <Label className="text-sm font-medium">Pickup Date</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(trackOutgoing.pickup_date), 'MMMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                            )}
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
                                    <p className="text-sm text-muted-foreground">
                                        Submitted: {format(new Date(trackOutgoing.track_incoming.date_in), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <Button variant="outline" asChild>
                                    <Link href={route('employee.tracking.incoming.show', trackOutgoing.track_incoming.id)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Request Details
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Status Information */}
                {trackOutgoing.status === 'for_pickup' && (
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="text-green-800">Ready for Pickup</CardTitle>
                            <CardDescription className="text-green-700">
                                Your equipment has been calibrated and is ready for pickup. Please confirm pickup when you collect your equipment.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}

                {trackOutgoing.status === 'completed' && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="text-blue-800">Pickup Completed</CardTitle>
                            <CardDescription className="text-blue-700">
                                You have successfully picked up this equipment. The next calibration is due on {' '}
                                {trackOutgoing.cal_due_date && format(new Date(trackOutgoing.cal_due_date), 'MMMM dd, yyyy')}.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}

                {isRecalibrationDue() && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-red-800 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Recalibration Due
                            </CardTitle>
                            <CardDescription className="text-red-700">
                                This equipment is due for recalibration. Please submit a new calibration request as soon as possible.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href={route('employee.tracking.request.index')}>
                                    Submit Recalibration Request
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Pickup Confirmation Modal */}
            <PickupConfirmationModal
                trackOutgoing={trackOutgoing}
                open={showPickupModal}
                onOpenChange={setShowPickupModal}
                onSuccess={handlePickupSuccess}
            />
        </AppLayout>
    );
};

export default EmployeeTrackingOutgoingShow;
