import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeDisplay } from '@/components/ui/code-display';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OutgoingStatusBadge } from '@/components/ui/status-badge';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackOutgoing } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, CheckCircle, Clock, Edit, Info, Package, Scan, Search, User } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface TrackingOutgoingShowProps {
    trackOutgoing: TrackOutgoing | { data: TrackOutgoing };
}

const TrackingOutgoingShow: React.FC<TrackingOutgoingShowProps> = ({ trackOutgoing }) => {
    // Handle both direct model and resource-wrapped data
    const outgoingData = trackOutgoing.data || trackOutgoing;

    const { canManageRequestIncoming, isAdmin, isTechnician } = useRole();

    // Determine if PIN input should be shown (not for Admin or Technician)
    const shouldShowPinInput = !isAdmin() && !isTechnician();
    const currentRole = isAdmin() ? 'Admin' : isTechnician() ? 'Technician' : 'User';

    // State for pickup confirmation
    const [showPickupForm, setShowPickupForm] = useState(false);
    const [employeeId, setEmployeeId] = useState('');
    const [employeeName, setEmployeeName] = useState('');
    const [confirmationPin, setConfirmationPin] = useState('');
    const [loadingEmployee, setLoadingEmployee] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [employeeError, setEmployeeError] = useState('');
    const [employeeOut, setEmployeeOut] = useState<any>(null);
    const [departmentValidation, setDepartmentValidation] = useState<{
        isValid: boolean;
        message: string;
    }>({ isValid: true, message: '' });

    // Scanner state
    const [showScanner, setShowScanner] = useState(false);

    // Ref for barcode canvas to enable download
    const barcodeRef = useRef<HTMLCanvasElement>(null);

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
            title: outgoingData.track_incoming?.recall_number || outgoingData.id,
            href: `/admin/tracking/outgoing/${outgoingData.id}`,
        },
    ];

    if (!canManageRequestIncoming()) {
        return null;
    }

    const getStatusBadge = () => {
        return <OutgoingStatusBadge status={outgoingData.status as any} />;
    };

    // Function to validate department match
    const validateDepartment = (employee: any) => {
        if (!employee || !outgoingData.track_incoming?.employee_in) {
            setDepartmentValidation({ isValid: true, message: '' });
            return;
        }
        console.log(outgoingData.track_incoming);

        // Get employee_in with fallback for different property names
        const employeeIn = outgoingData.track_incoming.employee_in || outgoingData.track_incoming.employeeIn;
        if (!employeeIn) {
            setDepartmentValidation({ isValid: true, message: '' });
            return;
        }

        // Extract department information with comprehensive fallbacks
        const employeeOutDeptId = employee.department_id || employee.department?.department_id;
        const employeeInDeptId = employeeIn.department_id || employeeIn.department?.department_id;

        const employeeOutDeptName = employee.department?.department_name || 'Unknown Department';
        const employeeInDeptName = employeeIn.department?.department_name || 'Unknown Department';

        if (!employeeOutDeptId || !employeeInDeptId) {
            const message = 'Department information is missing for validation. Please ensure both employees have department assignments.';
            setDepartmentValidation({
                isValid: false,
                message,
            });
            return;
        }

        // Check if departments match
        if (employeeOutDeptId !== employeeInDeptId) {
            const message = `Department mismatch: Employee is from ${employeeOutDeptName} but equipment was received from ${employeeInDeptName} department. Only employees from the same department can complete calibrations.`;
            setDepartmentValidation({
                isValid: false,
                message,
            });
            toast.error('Department mismatch');
            return;
        }

        // Departments match - validation passed
        const message = `✓ Department validation passed: Both employees are from ${employeeOutDeptName} department.`;
        setDepartmentValidation({
            isValid: true,
            message,
        });
    };

    // Handle employee ID input change (no automatic search)
    const handleEmployeeChange = (value: string) => {
        setEmployeeId(value);
        // Clear previous results when input changes
        setEmployeeName('');
        setEmployeeError('');
        setEmployeeOut(null);
        setDepartmentValidation({ isValid: true, message: '' });
    };

    // Handle employee search when button is clicked
    const handleEmployeeSearch = async () => {
        handleEmployeeSearchWithId(employeeId);
    };

    // Handle pickup confirmation
    const handleConfirmPickup = async () => {
        if (!employeeId) {
            toast.error('Please enter employee ID');
            return;
        }

        // Only check PIN for non-Admin/non-Technician users
        if (shouldShowPinInput && !confirmationPin) {
            toast.error('Please enter confirmation PIN');
            return;
        }

        if (employeeError) {
            toast.error('Please resolve employee lookup error');
            return;
        }

        if (!departmentValidation.isValid) {
            toast.error('Cannot confirm pickup: Department validation failed');
            return;
        }

        setSubmitting(true);

        try {
            // Build request data - include PIN only if required
            const requestData: any = {
                employee_id: employeeId,
            };

            // Only include PIN if not bypassed
            if (shouldShowPinInput) {
                requestData.confirmation_pin = confirmationPin;
            }

            const response = await axios.post(route('api.track-outgoing.confirm-pickup', outgoingData.id), requestData);

            if (response.data.success) {
                const message = response.data.bypassed_pin
                    ? `Equipment pickup confirmed successfully (PIN bypassed for ${currentRole})`
                    : 'Equipment pickup confirmed successfully';
                toast.success(message);
                // Refresh the page to show updated status
                router.reload();
            } else {
                toast.error(response.data.message || 'Failed to confirm pickup');
            }
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                const errorData = error.response.data;
                toast.error(errorData.message || 'Failed to confirm pickup');
            } else {
                console.log(error);
                toast.error('An unexpected error occurred');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Handle barcode scanning
    const handleScanBarcode = () => {
        setShowScanner(true);
    };

    // Handle barcode scan
    const handleScan = (detectedCodes: any[]) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const scannedText = detectedCodes[0].rawValue;
            setEmployeeId(scannedText);
            setShowScanner(false);
            // Trigger employee search after scan
            handleEmployeeSearchWithId(scannedText);
        }
    };

    // Handle scan error
    const handleScanError = (error: any) => {
        console.error('Scan error:', error);
        toast.error('Error scanning barcode');
    };

    // Helper function to search employee with specific ID
    const handleEmployeeSearchWithId = async (id: string) => {
        if (!id.trim()) {
            setEmployeeError('Please enter an employee ID');
            return;
        }

        setLoadingEmployee(true);
        setEmployeeError('');
        setEmployeeName('');
        setEmployeeOut(null);
        setDepartmentValidation({ isValid: true, message: '' });

        try {
            const response = await axios.get(route('api.users.search'), {
                params: { employee_id: id.trim() },
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (response.data && response.data.length > 0) {
                const employee = response.data[0];
                setEmployeeName(`${employee.first_name} ${employee.last_name}`);
                setEmployeeOut(employee);
                setEmployeeError('');

                // Validate department match
                validateDepartment(employee);
            } else {
                setEmployeeName('');
                setEmployeeOut(null);
                setEmployeeError('Employee not found');
            }
        } catch (error) {
            setEmployeeName('');
            setEmployeeOut(null);
            setEmployeeError('Error searching for employee');
        } finally {
            setLoadingEmployee(false);
        }
    };

    // Remove the old barcode download handler since it's now handled by CodeDisplay component

    // Handle mark as returned
    const handleReturn = async () => {
        try {
            const response = await axios.post(route('api.track-outgoing.mark-returned', outgoingData.id));
            if (response.data.success) {
                toast.success('Equipment marked as returned successfully');
                router.reload();
            } else {
                toast.error(response.data.message || 'Failed to mark as returned');
            }
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.message || 'Failed to mark as returned');
            } else {
                toast.error('An unexpected error occurred');
            }
        }
    };

    // Handle mark as received
    const handleReceive = async () => {
        try {
            const response = await axios.post(route('api.track-outgoing.mark-received', outgoingData.id));
            if (response.data.success) {
                toast.success('Equipment marked as received successfully');
                router.reload();
            } else {
                toast.error(response.data.message || 'Failed to mark as received');
            }
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.message || 'Failed to mark as received');
            } else {
                toast.error('An unexpected error occurred');
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Outgoing Completion: ${outgoingData.track_incoming?.recall_number}`} />

            <div className="space-y-6 p-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href={route('admin.tracking.outgoing.index')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Outgoing Completions
                    </Link>
                </Button>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words max-w-full">
                            Outgoing: {outgoingData.track_incoming?.recall_number || outgoingData.id}
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">Outgoing calibration details</p>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 w-full md:w-auto">
                        <div className="flex flex-row flex-wrap gap-2 md:gap-2 md:flex-nowrap">
                            {getStatusBadge()}
                            {outgoingData.status === 'for_pickup' && (
                                <Button onClick={() => setShowPickupForm(true)} size="sm" className="ml-0 md:ml-2 w-full md:w-auto">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Confirm Pickup
                                </Button>
                            )}
                            {outgoingData.status === 'for_return' && (
                                <Button onClick={handleReturn} size="sm" className="ml-0 md:ml-2 w-full md:w-auto">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Returned
                                </Button>
                            )}
                            {outgoingData.status === 'for_receipt' && (
                                <Button onClick={handleReceive} size="sm" className="ml-0 md:ml-2 w-full md:w-auto">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Received
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pickup Confirmation Form - Only show if status is for_pickup */}
                {outgoingData.status === 'for_pickup' && showPickupForm && (
                    <>
                        {/* Information about pickup policy */}
                        <Card className="border-blue-200 bg-blue-50">
                            <CardContent className="pt-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">Equipment Pickup Policy</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>
                                                Any employee from the{' '}
                                                <strong>{outgoingData.track_incoming?.employee_in?.department?.department_name || 'same'}</strong>{' '}
                                                department can pick up this equipment.
                                            </p>
                                            <p className="mt-1">
                                                The employee scanning their ID and confirming with their PIN will be recorded as the person who picked
                                                up the equipment.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Confirm Equipment Pickup
                                </CardTitle>
                                <CardDescription>Employees from the same department can pickup equipment for their department</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Employee ID Scanner */}
                                <div className="space-y-2">
                                    <Label htmlFor="employee_id_input">Employee ID (Barcode) *</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                id="employee_id_input"
                                                value={employeeId}
                                                onChange={(e) => handleEmployeeChange(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && employeeId.trim()) {
                                                        handleEmployeeSearch();
                                                    }
                                                }}
                                                placeholder="Scan or enter employee ID"
                                                disabled={loadingEmployee || submitting}
                                            />
                                            {employeeName && !employeeError && (
                                                <p className="text-muted-foreground mt-1 text-sm">Employee: {employeeName}</p>
                                            )}
                                            {employeeError && <p className="mt-1 text-sm text-red-600">{employeeError}</p>}
                                            {loadingEmployee && <p className="text-muted-foreground mt-1 text-sm">Looking up employee...</p>}

                                            {/* Department Validation Status */}
                                            {employeeOut && !departmentValidation.isValid && (
                                                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                                                    <div className="flex items-start">
                                                        <div className="flex-shrink-0">
                                                            <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-2">
                                                            <p className="text-sm font-medium text-amber-800">Department Validation Warning</p>
                                                            <p className="mt-1 text-sm text-amber-700">{departmentValidation.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {employeeOut && departmentValidation.isValid && departmentValidation.message.includes('✓') && (
                                                <div className="mt-2 rounded-md border border-green-200 bg-green-50 p-3">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <p className="ml-2 text-sm font-medium text-green-800">{departmentValidation.message}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="default"
                                            onClick={handleEmployeeSearch}
                                            disabled={loadingEmployee || submitting || !employeeId.trim()}
                                        >
                                            <Search className="mr-2 h-4 w-4" />
                                            Search
                                        </Button>
                                        <Button type="button" variant="outline" onClick={handleScanBarcode} disabled={submitting}>
                                            <Scan className="mr-2 h-4 w-4" />
                                            Scan
                                        </Button>
                                    </div>
                                </div>

                                {/* PIN Confirmation - Show only for non-Admin/non-Technician users */}
                                {shouldShowPinInput ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmation_pin">Employee PIN Confirmation *</Label>
                                        <Input
                                            id="confirmation_pin"
                                            type="password"
                                            placeholder="Enter employee PIN to confirm pickup"
                                            value={confirmationPin}
                                            onChange={(e) => setConfirmationPin(e.target.value)}
                                            disabled={submitting}
                                        />
                                        <p className="text-muted-foreground text-xs">Employee must enter their PIN to confirm equipment pickup</p>
                                    </div>
                                ) : (
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                            As a {currentRole}, PIN authentication is bypassed for equipment pickup confirmation.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Submit Button */}
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setShowPickupForm(false)} disabled={submitting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleConfirmPickup}
                                        disabled={
                                            submitting ||
                                            !employeeId ||
                                            (shouldShowPinInput && !confirmationPin) ||
                                            !!employeeError ||
                                            !departmentValidation.isValid
                                        }
                                    >
                                        {submitting ? 'Processing...' : 'Confirm Pickup'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

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
                                <p className="text-muted-foreground text-sm">{format(new Date(outgoingData.cal_date), 'MMMM dd, yyyy')}</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Next Due Date</Label>
                                <p className="text-muted-foreground text-sm">{format(new Date(outgoingData.cal_due_date), 'MMMM dd, yyyy')}</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Date Out</Label>
                                <p className="text-muted-foreground text-sm">{format(new Date(outgoingData.date_out), 'MMMM dd, yyyy HH:mm')}</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Cycle Time</Label>
                                <p className="text-muted-foreground text-sm">{outgoingData.cycle_time} days</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">CT Reqd</Label>
                                <p className="text-muted-foreground text-sm">{outgoingData.ct_reqd ?? '—'} days</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Commit ETC</Label>
                                <p className="text-muted-foreground text-sm">
                                    {outgoingData.commit_etc ? format(new Date(outgoingData.commit_etc), 'MMM dd, yyyy') : '—'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Actual ETC</Label>
                                <p className="text-muted-foreground text-sm">
                                    {outgoingData.actual_etc ? format(new Date(outgoingData.actual_etc), 'MMM dd, yyyy') : '—'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Overdue</Label>
                                <p className="text-muted-foreground text-sm">{outgoingData.overdue === 1 ? 'Yes' : 'No'}</p>
                            </div>
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
                            {/* QR Code / Barcode for Recall Number */}
                            {outgoingData.equipment?.recall_number && (
                                <CodeDisplay
                                    value={outgoingData.equipment?.recall_number}
                                    label="Recall Number"
                                    filename={outgoingData.equipment?.recall_number}
                                    containerClassName="outgoing-recall-code-container"
                                    showDownload={true}
                                    format="CODE128"
                                    width={2}
                                    height={60}
                                    fontSize={16}
                                    margin={8}
                                    qrSize={128}
                                />
                            )}

                            {outgoingData.equipment && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium">Description</Label>
                                        <p className="text-muted-foreground text-sm">{outgoingData.equipment.description}</p>
                                    </div>

                                    {outgoingData.equipment.serial_number && (
                                        <div>
                                            <Label className="text-sm font-medium">Serial Number</Label>
                                            <p className="text-muted-foreground text-sm">{outgoingData.equipment.serial_number}</p>
                                        </div>
                                    )}

                                    {outgoingData.equipment.manufacturer && (
                                        <div>
                                            <Label className="text-sm font-medium">Manufacturer</Label>
                                            <p className="text-muted-foreground text-sm">{outgoingData.equipment.manufacturer}</p>
                                        </div>
                                    )}

                                    {outgoingData.equipment.model && (
                                        <div>
                                            <Label className="text-sm font-medium">Model</Label>
                                            <p className="text-muted-foreground text-sm">{outgoingData.equipment.model}</p>
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
                            {outgoingData.technician && (
                                <div>
                                    <Label className="text-sm font-medium">Technician</Label>
                                    <p className="text-muted-foreground text-sm">
                                        {outgoingData.technician.first_name} {outgoingData.technician.last_name}
                                    </p>
                                    {outgoingData.technician.email && (
                                        <p className="text-muted-foreground text-xs">{outgoingData.technician.email}</p>
                                    )}
                                </div>
                            )}
                            {/* {trackOutgoing.track_incoming?.employee_in && (
                                <div>
                                    <Label className="text-sm font-medium">Employee Incoming</Label>
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
                            {trackOutgoing.track_incoming?.received_by && (
                                <div>
                                    <Label className="text-sm font-medium">Originally Received By</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.track_incoming.received_by.first_name} {trackOutgoing.track_incoming.received_by.last_name}
                                    </p>
                                    {trackOutgoing.track_incoming.received_by.email && (
                                        <p className="text-xs text-muted-foreground">{trackOutgoing.track_incoming.received_by.email}</p>
                                    )}
                                    {trackOutgoing.track_incoming.received_by.department && (
                                        <p className="text-xs text-muted-foreground">
                                            Department: {trackOutgoing.track_incoming.received_by.department.department_name}
                                        </p>
                                    )}
                                </div>
                            )} */}

                            {outgoingData.employee_out && (
                                <div>
                                    <Label className="text-sm font-medium">Employee Outgoing</Label>
                                    <p className="text-muted-foreground text-sm">
                                        {outgoingData.employee_out.first_name} {outgoingData.employee_out.last_name}
                                    </p>
                                    {outgoingData.employee_out.email && (
                                        <p className="text-muted-foreground text-xs">{outgoingData.employee_out.email}</p>
                                    )}
                                    {outgoingData.employee_out.employee_id && (
                                        <p className="text-muted-foreground text-xs">Employee ID: {outgoingData.employee_out.employee_id}</p>
                                    )}
                                    {outgoingData.employee_out.department && (
                                        <p className="text-muted-foreground text-xs">
                                            Department: {outgoingData.employee_out.department.department_name}
                                        </p>
                                    )}
                                </div>
                            )}
                            {outgoingData.released_by && (
                                <div>
                                    <Label className="text-sm font-medium">Released By (PIC)</Label>
                                    <p className="text-muted-foreground text-sm">
                                        {outgoingData.released_by.first_name} {outgoingData.released_by.last_name}
                                    </p>
                                    {outgoingData.released_by.email && (
                                        <p className="text-muted-foreground text-xs">{outgoingData.released_by.email}</p>
                                    )}
                                    {outgoingData.released_by.employee_id && (
                                        <p className="text-muted-foreground text-xs">Employee ID: {outgoingData.released_by.employee_id}</p>
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
                            {outgoingData.track_incoming && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium">Request Received</Label>
                                        <p className="text-muted-foreground text-sm">
                                            {format(new Date(outgoingData.track_incoming.date_in), 'MMMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium">Original Due Date</Label>
                                        <p className="text-muted-foreground text-sm">
                                            {format(new Date(outgoingData.track_incoming.due_date), 'MMMM dd, yyyy')}
                                        </p>
                                    </div>
                                </>
                            )}

                            <div>
                                <Label className="text-sm font-medium">Calibration Completed</Label>
                                <p className="text-muted-foreground text-sm">{format(new Date(outgoingData.cal_date), 'MMMM dd, yyyy')}</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Released for Pickup</Label>
                                <p className="text-muted-foreground text-sm">{format(new Date(outgoingData.date_out), 'MMMM dd, yyyy HH:mm')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Original Request Information */}
                {outgoingData.track_incoming && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Request</CardTitle>
                            <CardDescription>View the original incoming calibration request</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Incoming Request: {outgoingData.track_incoming.recall_number}</p>
                                    <p className="text-muted-foreground text-sm">Status: {outgoingData.track_incoming.status}</p>
                                </div>
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.tracking.incoming.show', outgoingData.track_incoming.id)}>View Request Details</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Scanner Dialog */}
            <Dialog open={showScanner} onOpenChange={setShowScanner}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Scan Employee Barcode</DialogTitle>
                        <DialogDescription>Position the barcode within the camera frame to scan</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4">
                        <div className="w-full max-w-sm">
                            <Scanner
                                formats={['code_128', 'code_39']}
                                onScan={handleScan}
                                onError={handleScanError}
                                constraints={{
                                    video: {
                                        facingMode: 'environment',
                                    },
                                }}
                                allowMultiple={false}
                                scanDelay={500}
                                components={{
                                    finder: true,
                                    torch: true,
                                    zoom: false,
                                }}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default TrackingOutgoingShow;
