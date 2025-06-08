import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EmployeeStatusBadge } from '@/components/ui/status-badge';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackIncoming } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Edit, Eye, FileText, MapPin, Package, User } from 'lucide-react';

interface EmployeeTrackingIncomingShowProps {
    record: TrackIncoming;
}

const EmployeeTrackingIncomingShow: React.FC<EmployeeTrackingIncomingShowProps> = ({ record }) => {
    const { canSubmitCalibrationRequest } = useRole();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employee Tracking',
            href: '/employee/tracking',
        },
        {
            title: 'My Requests',
            href: '/employee/tracking/incoming',
        },
        {
            title: record.recall_number || 'Pending Assignment',
            href: `/employee/tracking/incoming/${record.id}`,
        },
    ];

    if (!canSubmitCalibrationRequest()) {
        return null;
    }

    const getStatusBadge = (status: string) => {
        return <EmployeeStatusBadge status={status as any} />;
    };

    const canEditRequest = () => {
        return record.status === 'for_confirmation';
    };

    const isOverdue = new Date(record.due_date) < new Date();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`My Request: ${record.recall_number}`} />

            <div className="space-y-6 p-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href={route('employee.tracking.incoming.index')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to My Requests
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Request: {record.recall_number || 'Pending Assignment'}</h1>
                            <p className="text-muted-foreground">Calibration request details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(record.status)}
                        {isOverdue && <Badge variant="destructive">Overdue</Badge>}

                        {canEditRequest() && (
                            <Button asChild variant="outline" size="sm" className="ml-2">
                                <Link href={route('employee.tracking.request.index', { edit: record.id })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Request
                                </Link>
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
                                <p className="text-muted-foreground text-sm">{record.description}</p>
                            </div>

                            {record.serial_number && (
                                <div>
                                    <Label className="text-sm font-medium">Serial Number</Label>
                                    <p className="text-muted-foreground text-sm">{record.serial_number}</p>
                                </div>
                            )}

                            {record.manufacturer && (
                                <div>
                                    <Label className="text-sm font-medium">Manufacturer</Label>
                                    <p className="text-muted-foreground text-sm">{record.manufacturer}</p>
                                </div>
                            )}

                            {record.model && (
                                <div>
                                    <Label className="text-sm font-medium">Model</Label>
                                    <p className="text-muted-foreground text-sm">{record.model}</p>
                                </div>
                            )}

                            {record.equipment && (
                                <div>
                                    <Label className="text-sm font-medium">Equipment Status</Label>
                                    <div>
                                        <Badge variant="outline">{record.equipment.status}</Badge>
                                    </div>
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
                                <Label className="text-sm font-medium">Date Submitted</Label>
                                <p className="text-muted-foreground text-sm">{format(new Date(record.date_in), 'MMMM dd, yyyy HH:mm')}</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Due Date</Label>
                                <p className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                    {format(new Date(record.due_date), 'MMMM dd, yyyy')}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div>{getStatusBadge(record.status)}</div>
                            </div>

                            {record.notes && (
                                <div>
                                    <Label className="text-sm font-medium">Notes</Label>
                                    <p className="text-muted-foreground text-sm">{record.notes}</p>
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
                            {record.technician && (
                                <div>
                                    <Label className="text-sm font-medium">Assigned Technician</Label>
                                    <p className="text-muted-foreground text-sm">
                                        {record.technician.first_name} {record.technician.last_name}
                                    </p>
                                    {record.technician.email && <p className="text-muted-foreground text-xs">{record.technician.email}</p>}
                                </div>
                            )}

                            {record.employee_in && (
                                <div>
                                    <Label className="text-sm font-medium">Submitted By</Label>
                                    <p className="text-muted-foreground text-sm">
                                        {record.employee_in.first_name} {record.employee_in.last_name}
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
                            {record.location && (
                                <div>
                                    <Label className="text-sm font-medium">Current Location</Label>
                                    <p className="text-muted-foreground text-sm">{record.location.location_name}</p>
                                    {record.location.department && (
                                        <p className="text-muted-foreground text-xs">Department: {record.location.department.department_name}</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Completion Information */}
                {record.trackOutgoing && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Calibration Completion
                            </CardTitle>
                            <CardDescription>Your request has been completed and is available for pickup</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                {record.trackOutgoing.cal_date && (
                                    <div>
                                        <Label className="text-sm font-medium">Calibration Date</Label>
                                        <p className="text-muted-foreground text-sm">
                                            {format(new Date(record.trackOutgoing.cal_date), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                )}

                                {record.trackOutgoing.cal_due_date && (
                                    <div>
                                        <Label className="text-sm font-medium">Next Due Date</Label>
                                        <p className="text-muted-foreground text-sm">
                                            {format(new Date(record.trackOutgoing.cal_due_date), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                )}

                                {record.trackOutgoing.date_out && (
                                    <div>
                                        <Label className="text-sm font-medium">Date Out</Label>
                                        <p className="text-muted-foreground text-sm">
                                            {format(new Date(record.trackOutgoing.date_out), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {record.trackOutgoing.certificate_number && (
                                <div>
                                    <Label className="text-sm font-medium">Certificate Number</Label>
                                    <p className="text-muted-foreground text-sm">{record.trackOutgoing.certificate_number}</p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('employee.tracking.outgoing.show', record.trackOutgoing.id)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Pickup Details
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Status Information */}
                {record.status === 'for_confirmation' && (
                    <Card className="border-amber-200 bg-amber-50">
                        <CardHeader>
                            <CardTitle className="text-amber-800">Awaiting Admin Confirmation</CardTitle>
                            <CardDescription className="text-amber-700">
                                Your request is currently being reviewed by an administrator. You can still edit this request until it's confirmed.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}

                {record.status === 'pending_calibration' && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="text-blue-800">In Progress</CardTitle>
                            <CardDescription className="text-blue-700">
                                Your request has been confirmed and is currently being processed by the assigned technician.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default EmployeeTrackingIncomingShow;
