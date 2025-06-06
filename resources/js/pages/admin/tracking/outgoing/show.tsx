import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OutgoingStatusBadge } from '@/components/ui/status-badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackOutgoing } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, User, Calendar, Package, Clock, Edit, Scan, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Barcode from 'react-barcode';

interface TrackingOutgoingShowProps {
    trackOutgoing: TrackOutgoing;
}

const TrackingOutgoingShow: React.FC<TrackingOutgoingShowProps> = ({ trackOutgoing }) => {
    console.log(trackOutgoing)
    const { canManageRequestIncoming } = useRole();

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
        return <OutgoingStatusBadge status={trackOutgoing.status as any} />;
    };

    // Function to validate department match
    const validateDepartment = (employee: any) => {
        if (!employee || !trackOutgoing.track_incoming?.employee_in) {
            setDepartmentValidation({ isValid: true, message: '' });
            return;
        }

        // Get employee_in with fallback for different property names
        const employeeIn = trackOutgoing.track_incoming.employee_in || trackOutgoing.track_incoming.employeeIn;
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
                message
            });
            return;
        }

        // Check if departments match
        if (employeeOutDeptId !== employeeInDeptId) {
            const message = `Department mismatch: Employee is from ${employeeOutDeptName} but equipment was received by ${employeeInDeptName} department. Only employees from the same department can complete calibrations.`;
            setDepartmentValidation({
                isValid: false,
                message
            });
            toast.error("Department mismatch");
            return;
        }

        // Departments match - validation passed
        const message = `✓ Department validation passed: Both employees are from ${employeeOutDeptName} department.`;
        setDepartmentValidation({
            isValid: true,
            message
        });
    };

    // Handle employee ID input and lookup
    const handleEmployeeChange = async (value: string) => {
        setEmployeeId(value);
        setEmployeeName('');
        setEmployeeError('');
        setEmployeeOut(null);
        setDepartmentValidation({ isValid: true, message: '' });

        if (value.length >= 1) {
            setLoadingEmployee(true);
            try {
                const response = await axios.get(route('api.users.search'), {
                    params: { employee_id: value },
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
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
                    setEmployeeError('Employee not found with this ID');
                }
            } catch (error) {
                setEmployeeName('');
                setEmployeeOut(null);
                setEmployeeError('Error searching for employee');
            } finally {
                setLoadingEmployee(false);
            }
        } else {
            setEmployeeName('');
            setEmployeeOut(null);
            setEmployeeError('');
        }
    };

    // Handle pickup confirmation
    const handleConfirmPickup = async () => {
        if (!employeeId) {
            toast.error('Please enter employee ID');
            return;
        }

        if (!confirmationPin) {
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
            const response = await axios.post(route('api.track-outgoing.confirm-pickup', trackOutgoing.id), {
                employee_id: employeeId,
                confirmation_pin: confirmationPin
            });

            if (response.data.success) {
                toast.success('Equipment pickup confirmed successfully');
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
                console.log(error)
                toast.error('An unexpected error occurred');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Handle barcode scanning (simplified version)
    const handleScanBarcode = () => {
        // In a real implementation, you'd integrate with a barcode scanner
        // For now, just focus the input field
        const input = document.getElementById('employee_id_input') as HTMLInputElement;
        if (input) {
            input.focus();
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
                        {(trackOutgoing.status === 'for_pickup') && (
                            <>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={route('admin.tracking.outgoing.edit', trackOutgoing.id)}>
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                    </Link>
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setShowPickupForm(!showPickupForm)}
                                    variant={showPickupForm ? "outline" : "default"}
                                >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {showPickupForm ? 'Cancel Pickup' : 'Confirm Pickup'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Pickup Confirmation Form - Only show if status is for_pickup */}
                {trackOutgoing.status === 'for_pickup' && showPickupForm && (
                    <>
                        {/* Information about pickup policy */}
                        <Card className="border-blue-200 bg-blue-50">
                            <CardContent className="pt-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">Equipment Pickup Policy</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>Any employee from the <strong>{trackOutgoing.track_incoming?.employee_in?.department?.department_name || 'same'}</strong> department can pick up this equipment.</p>
                                            <p className="mt-1">The employee scanning their ID and confirming with their PIN will be recorded as the person who picked up the equipment.</p>
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
                                <CardDescription>
                                    Employees from the same department can pickup equipment for their department
                                </CardDescription>
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
                                                placeholder="Scan or enter employee ID"
                                                disabled={loadingEmployee || submitting}
                                            />
                                            {employeeName && !employeeError && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Employee: {employeeName}
                                                </p>
                                            )}
                                            {employeeError && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {employeeError}
                                                </p>
                                            )}
                                            {loadingEmployee && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Looking up employee...
                                                </p>
                                            )}

                                            {/* Department Validation Status */}
                                            {employeeOut && !departmentValidation.isValid && (
                                                <div className="mt-2 p-3 border border-amber-200 bg-amber-50 rounded-md">
                                                    <div className="flex items-start">
                                                        <div className="flex-shrink-0">
                                                            <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-2">
                                                            <p className="text-sm text-amber-800 font-medium">Department Validation Warning</p>
                                                            <p className="text-sm text-amber-700 mt-1">{departmentValidation.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {employeeOut && departmentValidation.isValid && departmentValidation.message.includes('✓') && (
                                                <div className="mt-2 p-3 border border-green-200 bg-green-50 rounded-md">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <p className="ml-2 text-sm text-green-800 font-medium">{departmentValidation.message}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleScanBarcode}
                                            disabled={submitting}
                                        >
                                            <Scan className="h-4 w-4 mr-2" />
                                            Scan
                                        </Button>
                                    </div>
                                </div>

                                {/* PIN Confirmation */}
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
                                    <p className="text-xs text-muted-foreground">
                                        Employee must enter their PIN to confirm equipment pickup
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowPickupForm(false)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleConfirmPickup}
                                        disabled={submitting || !employeeId || !confirmationPin || !!employeeError || !departmentValidation.isValid}
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

                            <div>
                                <Label className="text-sm font-medium">Cycle Time</Label>
                                <p className="text-sm text-muted-foreground">
                                    {trackOutgoing.cycle_time} days
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">CT Reqd</Label>
                                <p className="text-sm text-muted-foreground">
                                    {trackOutgoing.ct_reqd ?? '—'} days
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Commit ETC</Label>
                                <p className="text-sm text-muted-foreground">
                                    {trackOutgoing.commit_etc ? `${trackOutgoing.commit_etc} days` : '—'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Actual ETC</Label>
                                <p className="text-sm text-muted-foreground">
                                    {trackOutgoing.actual_etc ? `${trackOutgoing.actual_etc} days` : '—'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Overdue</Label>
                                <p className="text-sm text-muted-foreground">
                                    {trackOutgoing.overdue ?? 0} days
                                </p>
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
                            {/* Barcode for Recall Number */}
                            {trackOutgoing.track_incoming?.recall_number && (
                                <div className="flex flex-col items-center mb-4">
                                    <Barcode
                                        value={trackOutgoing.track_incoming?.recall_number}
                                        width={2}
                                        height={60}
                                        displayValue={true}
                                        fontSize={16}
                                        margin={8}
                                    />
                                    <span className="text-xs text-muted-foreground mt-1">Recall Number Barcode</span>
                                </div>
                            )}

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

                            {trackOutgoing.employee_out && (
                                <div>
                                    <Label className="text-sm font-medium">Employee Outgoing</Label>
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
