import { OutgoingCalibrationModal } from '@/components/admin/tracking/outgoing/outgoing-calibration-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { persistor, store } from '@/store';
import { useAppDispatch } from '@/store/hooks';
import {
    markFormClean,
    resetForm,
    setEquipment,
    setReceivedBy,
    setRequestType,
    setScannedEmployee,
    setTechnician,
} from '@/store/slices/trackingRequestSlice';
import { type BreadcrumbItem, type TrackIncoming } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Edit, FileText, MapPin, Package, User } from 'lucide-react';
import { useState } from 'react';
import Barcode from 'react-barcode';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

interface TrackingIncomingShowProps {
    trackIncoming: TrackIncoming;
}

const TrackingIncomingShowContent: React.FC<TrackingIncomingShowProps> = ({ trackIncoming }) => {
    const { canManageRequestIncoming } = useRole();
    const [showCalibrationModal, setShowCalibrationModal] = useState(false);
    const dispatch = useAppDispatch();

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
        return <StatusBadge status={status as any} />;
    };

    const isOverdue = new Date(trackIncoming.due_date) < new Date();

    const handleEditRequest = (confirm: boolean | null) => {
        // Reset the form first
        dispatch(resetForm());

        // Populate form data from existing record (excluding PIN)
        dispatch(setRequestType('new')); // Assume editing is always routine

        // Set technician data
        if (trackIncoming.technician) {
            dispatch(
                setTechnician({
                    employee_id: trackIncoming.technician.employee_id,
                    first_name: trackIncoming.technician.first_name,
                    last_name: trackIncoming.technician.last_name,
                    full_name: `${trackIncoming.technician.first_name} ${trackIncoming.technician.last_name}`,
                    email: trackIncoming.technician.email,
                }),
            );
        }

        // Set equipment data
        dispatch(
            setEquipment({
                plant: trackIncoming.equipment?.plant_id || '',
                department: trackIncoming.equipment?.department_id || '',
                location: trackIncoming.location?.location_id || '',
                description: trackIncoming.description || '',
                serialNumber: trackIncoming.serial_number || '',
                recallNumber: trackIncoming.recall_number || '',
                model: trackIncoming.model || '',
                manufacturer: trackIncoming.manufacturer || '',
                dueDate: trackIncoming.due_date ? format(new Date(trackIncoming.due_date), 'yyyy-MM-dd') : '',
                receivedBy: '',
            }),
        );

        // Set received by data
        if (trackIncoming.employee_in) {
            dispatch(
                setReceivedBy({
                    employee_id: trackIncoming.employee_in.employee_id,
                    first_name: trackIncoming.employee_in.first_name,
                    last_name: trackIncoming.employee_in.last_name,
                    full_name: `${trackIncoming.employee_in.first_name} ${trackIncoming.employee_in.last_name}`,
                }),
            );
        }

        // Set scanned employee data (employee who originally registered the request)
        if (trackIncoming.employee_in) {
            dispatch(
                setScannedEmployee({
                    employee_id: trackIncoming.employee_in.employee_id,
                    first_name: trackIncoming.employee_in.first_name,
                    last_name: trackIncoming.employee_in.last_name,
                    full_name: `${trackIncoming.employee_in.first_name} ${trackIncoming.employee_in.last_name}`,
                    email: trackIncoming.employee_in.email,
                    department_id: trackIncoming.employee_in.department?.department_id,
                    plant_id: trackIncoming.employee_in.plant?.plant_id,
                    department: trackIncoming.employee_in.department
                        ? {
                              department_id: trackIncoming.employee_in.department.department_id,
                              department_name: trackIncoming.employee_in.department.department_name,
                          }
                        : undefined,
                    plant: trackIncoming.employee_in.plant
                        ? {
                              plant_id: trackIncoming.employee_in.plant.plant_id,
                              plant_name: trackIncoming.employee_in.plant.plant_name,
                          }
                        : undefined,
                }),
            );
        }

        // Mark form as clean since we're loading existing data
        dispatch(markFormClean());

        // Navigate to edit mode in request creation flow
        router.visit(route('admin.tracking.request.index', { edit: trackIncoming.id, confirm }));
    };

    // DONT REMOVE
    // console.log(trackIncoming)

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Incoming Request: ${trackIncoming.recall_number}`} />

            <div className="space-y-6 p-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href={route('admin.tracking.incoming.index')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Incoming Requests
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Request: {trackIncoming.recall_number}</h1>
                            <p className="text-muted-foreground">Incoming calibration request details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(trackIncoming.status)}
                        {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                        {trackIncoming.status === 'for_confirmation' && (
                            <Button onClick={() => handleEditRequest(true)} size="sm" className="ml-2">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirm Request
                            </Button>
                        )}
                        {trackIncoming.status === 'pending_calibration' && (
                            <Button onClick={() => handleEditRequest(false)} variant="outline" size="sm" className="ml-2">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Request
                            </Button>
                        )}
                        {trackIncoming.status === 'pending_calibration' && !trackIncoming.trackOutgoing && (
                            <Button onClick={() => setShowCalibrationModal(true)} size="sm" className="ml-2">
                                <CheckCircle className="mr-2 h-4 w-4" />
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
                            {/* Barcode for Recall Number */}
                            {trackIncoming.recall_number && (
                                <div className="mb-4 flex flex-col items-center">
                                    <Barcode
                                        format='CODE128'
                                        value={trackIncoming.recall_number} width={2} height={60} displayValue={true} fontSize={16} margin={8} />
                                    <span className="text-muted-foreground mt-1 text-xs">Recall Number Barcode</span>
                                </div>
                            )}
                            <div>
                                <Label className="text-sm font-medium">Description</Label>
                                <p className="text-muted-foreground text-sm">{trackIncoming.description}</p>
                            </div>

                            {trackIncoming.serial_number && (
                                <div>
                                    <Label className="text-sm font-medium">Serial Number</Label>
                                    <p className="text-muted-foreground text-sm">{trackIncoming.serial_number}</p>
                                </div>
                            )}

                            {trackIncoming.manufacturer && (
                                <div>
                                    <Label className="text-sm font-medium">Manufacturer</Label>
                                    <p className="text-muted-foreground text-sm">{trackIncoming.manufacturer}</p>
                                </div>
                            )}

                            {trackIncoming.model && (
                                <div>
                                    <Label className="text-sm font-medium">Model</Label>
                                    <p className="text-muted-foreground text-sm">{trackIncoming.model}</p>
                                </div>
                            )}

                            {trackIncoming.equipment && (
                                <div>
                                    <Label className="text-sm font-medium">Equipment Status</Label>
                                    <div>
                                        <Badge variant="outline">{trackIncoming.equipment.status}</Badge>
                                    </div>
                                </div>
                            )}
                            {trackIncoming.equipment?.process_req_range_start && (
                                <div>
                                    <Label className="text-sm font-medium">Process Request Range</Label>
                                    <span className="flex items-center gap-2">
                                        <p className="text-muted-foreground text-sm">{trackIncoming.equipment?.process_req_range_start}</p>
                                        <ArrowRight className="text-sm" />
                                        <p className="text-muted-foreground text-sm">{trackIncoming.equipment?.process_req_range_end}</p>
                                    </span>
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
                                <p className="text-muted-foreground text-sm">{format(new Date(trackIncoming.date_in), 'MMMM dd, yyyy HH:mm')}</p>
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
                                    <p className="text-muted-foreground text-sm">{trackIncoming.notes}</p>
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
                                    <p className="text-muted-foreground text-sm">
                                        {trackIncoming.technician.first_name} {trackIncoming.technician.last_name}
                                    </p>
                                    {trackIncoming.technician.email && (
                                        <p className="text-muted-foreground text-xs">{trackIncoming.technician.email}</p>
                                    )}
                                </div>
                            )}

                            {trackIncoming?.employee_in && (
                                <div>
                                    <Label className="text-sm font-medium">Employee Incoming</Label>
                                    <p className="text-muted-foreground text-sm">
                                        {trackIncoming.employee_in.first_name} {trackIncoming.employee_in.last_name}
                                    </p>
                                    {trackIncoming.employee_in.email && (
                                        <p className="text-muted-foreground text-xs">{trackIncoming.employee_in.email}</p>
                                    )}
                                    {trackIncoming.employee_in.department && (
                                        <p className="text-muted-foreground text-xs">
                                            Department: {trackIncoming.employee_in.department.department_name}
                                        </p>
                                    )}
                                </div>
                            )}
                            {trackIncoming?.received_by && (
                                <div>
                                    <Label className="text-sm font-medium">Originally Received By</Label>
                                    <p className="text-muted-foreground text-sm">
                                        {trackIncoming.received_by.first_name} {trackIncoming.received_by.last_name}
                                    </p>
                                    {trackIncoming.received_by.email && (
                                        <p className="text-muted-foreground text-xs">{trackIncoming.received_by.email}</p>
                                    )}
                                    {trackIncoming.received_by.department && (
                                        <p className="text-muted-foreground text-xs">
                                            Department: {trackIncoming.received_by.department.department_name}
                                        </p>
                                    )}
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
                                    <p className="text-muted-foreground text-sm">{trackIncoming.location.location_name}</p>
                                    {trackIncoming.location.department && (
                                        <p className="text-muted-foreground text-xs">
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
                            <CardDescription>This request has been completed and is available for pickup</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                {trackIncoming.cal_date && (
                                    <div>
                                        <Label className="text-sm font-medium">Calibration Date</Label>
                                        <p className="text-muted-foreground text-sm">{format(new Date(trackIncoming.cal_date), 'MMMM dd, yyyy')}</p>
                                    </div>
                                )}

                                {trackIncoming.cal_due_date && (
                                    <div>
                                        <Label className="text-sm font-medium">Next Due Date</Label>
                                        <p className="text-muted-foreground text-sm">
                                            {format(new Date(trackIncoming.cal_due_date), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                )}

                                {trackIncoming.date_out && (
                                    <div>
                                        <Label className="text-sm font-medium">Date Out</Label>
                                        <p className="text-muted-foreground text-sm">{format(new Date(trackIncoming.date_out), 'MMMM dd, yyyy')}</p>
                                    </div>
                                )}
                            </div>

                            {trackIncoming.certificate_number && (
                                <div>
                                    <Label className="text-sm font-medium">Certificate Number</Label>
                                    <p className="text-muted-foreground text-sm">{trackIncoming.certificate_number}</p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.tracking.outgoing.show', trackIncoming.id)}>View Completion Details</Link>
                                </Button>
                                {/* {trackIncoming.certificate_number && (
                                    <Button variant="outline" asChild>
                                        <Link href={route('admin.tracking.outgoing.certificate', trackIncoming.id)}>
                                            <FileText className="h-3 w-3 mr-1" />
                                            View Certificate
                                        </Link>
                                    </Button>
                                )} */}
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

// Main component wrapped with Redux providers
const TrackingIncomingShow: React.FC<TrackingIncomingShowProps> = (props) => {
    return (
        <Provider store={store}>
            <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
                <TrackingIncomingShowContent {...props} />
            </PersistGate>
        </Provider>
    );
};

export default TrackingIncomingShow;
