import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, addYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import { TrackIncoming } from '@/types';
import axios from 'axios';

interface OutgoingCalibrationModalProps {
    incomingRecord: TrackIncoming | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface OutgoingFormData {
    recall_number: string;
    cal_date: string;
    cal_due_date: string;
    date_out: string;
    employee_id_out: string;
    cycle_time: number;
    confirmation_pin: string;
}

export function OutgoingCalibrationModal({
    incomingRecord,
    open,
    onOpenChange,
    onSuccess
}: OutgoingCalibrationModalProps) {
    const [employeeName, setEmployeeName] = useState('');
    const [employeeOut, setEmployeeOut] = useState<any>(null);
    const [loadingEmployee, setLoadingEmployee] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [calDate, setCalDate] = useState<Date>();
    const [calDueDate, setCalDueDate] = useState<Date>();
    const [dateOut, setDateOut] = useState<Date>();
    const [employeeError, setEmployeeError] = useState<string>('');
    const [departmentValidation, setDepartmentValidation] = useState<{
        isValid: boolean;
        message: string;
    }>({ isValid: true, message: '' });

    const { data, setData, post, processing, errors, reset } = useForm<OutgoingFormData>({
        recall_number: '',
        cal_date: '',
        cal_due_date: '',
        date_out: '',
        employee_id_out: '',
        cycle_time: 0,
        confirmation_pin: ''
    });

    // Initialize form data when incoming record changes
    useEffect(() => {
        if (incomingRecord && open) {
            const currentDate = new Date();
            const oneYearLater = addYears(currentDate, 1);

            setCalDate(currentDate);
            setCalDueDate(oneYearLater);
            setDateOut(currentDate);

            setData({
                recall_number: incomingRecord.recall_number,
                cal_date: format(currentDate, 'yyyy-MM-dd'),
                cal_due_date: format(oneYearLater, 'yyyy-MM-dd'),
                date_out: format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
                employee_id_out: '',
                cycle_time: calculateCycleTime(incomingRecord.date_in, currentDate),
                confirmation_pin: ''
            });
        }
    }, [incomingRecord, open]);

    // Calculate cycle time in days
    const calculateCycleTime = (dateIn: string, dateOut: Date): number => {
        const inDate = new Date(dateIn);
        const timeDiff = dateOut.getTime() - inDate.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Ensure cycle time is never negative
        return Math.max(0, days);
    };

    // Update cycle time when date_out changes
    useEffect(() => {
        if (incomingRecord && dateOut) {
            const cycleTime = calculateCycleTime(incomingRecord.date_in, dateOut);
            setData('cycle_time', cycleTime);
        }
    }, [dateOut, incomingRecord]);

    // Re-validate department when incoming record changes or employee data becomes available
    useEffect(() => {
        if (employeeOut && incomingRecord?.employee_in) {
            validateDepartment(employeeOut);
        }
    }, [employeeOut, incomingRecord?.employee_in]);

    // Reset validation when modal opens/closes
    useEffect(() => {
        if (!open) {
            setDepartmentValidation({ isValid: true, message: '' });
            setEmployeeOut(null);
            setEmployeeName('');
            setEmployeeError('');
        }
    }, [open]);

    // Handle employee barcode/ID input
    const handleEmployeeChange = (value: string) => {
        setData('employee_id_out', value);
        setEmployeeName('');
        setEmployeeOut(null);
        setEmployeeError('');
        setDepartmentValidation({ isValid: true, message: '' });

        if (value.length >= 1) {
            lookupEmployee(value);
        } else {
            setEmployeeName('');
            setEmployeeOut(null);
            setEmployeeError('');
            setDepartmentValidation({ isValid: true, message: '' });
        }
    };

    // Function to validate department match
    const validateDepartment = (employee: any) => {
        if (!employee || !incomingRecord?.employee_in) {
            setDepartmentValidation({ isValid: true, message: '' });
            return;
        }

        // Get employee_in with fallback for different property names
        const employeeIn = incomingRecord.employee_in || incomingRecord.employeeIn;
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

    // Function to lookup employee by ID
    const lookupEmployee = async (employeeId: string) => {
        if (!employeeId) return;

        setLoadingEmployee(true);
        setEmployeeError(''); // Clear any previous error
        setDepartmentValidation({ isValid: true, message: '' }); // Clear validation
        try {
            const response = await axios.get(route('api.users.search'), {
                params: { employee_id: employeeId },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.data && response.data.length > 0) {
                const employee = response.data[0];
                setEmployeeName(`${employee.first_name} ${employee.last_name}`);
                setEmployeeOut(employee); // Store the full employee object
                setEmployeeError('');

                // Validate department match
                validateDepartment(employee);

                // toast.success(`Employee found: ${employee.first_name} ${employee.last_name}`);
            } else {
                setEmployeeName('');
                setEmployeeOut(null);
                setEmployeeError('Employee not found with this ID');
                setDepartmentValidation({ isValid: true, message: '' });
            }
        } catch (error) {
            setEmployeeName('');
            setEmployeeOut(null);
            setEmployeeError('Error searching for employee');
            setDepartmentValidation({ isValid: true, message: '' });
        } finally {
            setLoadingEmployee(false);
        }
    };

    // Handle calendar date changes
    const handleCalDateChange = (date: Date | undefined) => {
        if (date) {
            setCalDate(date);
            setData('cal_date', format(date, 'yyyy-MM-dd'));

            // Auto-update due date to one year later
            const oneYearLater = addYears(date, 1);
            setCalDueDate(oneYearLater);
            setData('cal_due_date', format(oneYearLater, 'yyyy-MM-dd'));
        }
    };

    const handleCalDueDateChange = (date: Date | undefined) => {
        if (date) {
            setCalDueDate(date);
            setData('cal_due_date', format(date, 'yyyy-MM-dd'));
        }
    };

    const handleDateOutChange = (date: Date | undefined) => {
        if (date && incomingRecord) {
            const dateInTime = new Date(incomingRecord.date_in);

            // Validate that date out is not before date in
            if (date < dateInTime) {
                toast.error('Date Out cannot be earlier than Date In. Please select a valid date.');
                return;
            }

            setDateOut(date);
            setData('date_out', format(date, 'yyyy-MM-dd HH:mm:ss'));
        }
    };

    // Submit form - Remove PIN requirement
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();


        if (!departmentValidation.isValid) {
            toast.error('Cannot complete calibration: Department validation failed');
            return;
        }

        setSubmitting(true);

        try {
            // Submit the form with current data using axios - Remove confirmation_pin
            const response = await axios.post(route('api.track-outgoing.store'), {
                recall_number: data.recall_number,
                cal_date: data.cal_date,
                cal_due_date: data.cal_due_date,
                date_out: data.date_out,
                cycle_time: data.cycle_time
            });

            // Check if the response indicates success
            if (response.data && response.status === 201) {
                toast.success('Calibration completion recorded successfully. Equipment is ready for pickup.');

                // Reset form state
                reset();
                setEmployeeName('');
                setEmployeeOut(null);
                setEmployeeError('');
                setDepartmentValidation({ isValid: true, message: '' });
                setCalDate(undefined);
                setCalDueDate(undefined);
                setDateOut(undefined);
                onOpenChange(false);
                onSuccess();

                // Redirect to outgoing page
                router.visit('/admin/tracking/outgoing');
            } else {
                toast.error('Failed to record calibration completion');
            }

        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const errorData = error.response.data;

                if (errorData.errors) {
                    // Handle validation errors
                    Object.entries(errorData.errors).forEach(([field, messages]) => {
                        if (Array.isArray(messages)) {
                            toast.error(`${field}: ${messages[0]}`);
                        }
                    });
                } else {
                    toast.error(errorData.message || 'Failed to record calibration completion');
                }
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        reset();
        setEmployeeName('');
        setEmployeeOut(null);
        setEmployeeError('');
        setDepartmentValidation({ isValid: true, message: '' });
        setCalDate(undefined);
        setCalDueDate(undefined);
        setDateOut(undefined);
        setData('confirmation_pin', '');
        onOpenChange(false);
    };

    if (!incomingRecord) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Complete Calibration</DialogTitle>
                    <DialogDescription>
                        Record the completion of calibration for {incomingRecord.recall_number}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Equipment Summary */}
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-medium mb-2">Equipment Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Recall Number:</span>
                                <p>{incomingRecord.recall_number}</p>
                            </div>
                            <div>
                                <span className="font-medium">Description:</span>
                                <p>{incomingRecord.description}</p>
                            </div>
                            <div>
                                <span className="font-medium">Serial Number:</span>
                                <p>{incomingRecord.serial_number || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="font-medium">Date In:</span>
                                <p>{format(new Date(incomingRecord.date_in), 'MMM dd, yyyy')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Calibration Date */}
                        <div className="space-y-2">
                            <Label htmlFor="cal_date">Calibration Date *</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="cal_date"
                                    type="date"
                                    value={calDate ? format(calDate, 'yyyy-MM-dd') : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const newDate = new Date(e.target.value);
                                            handleCalDateChange(newDate);
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="shrink-0"
                                        >
                                            <CalendarIcon className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={calDate}
                                            onSelect={handleCalDateChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {errors.cal_date && <p className="text-sm text-destructive">{errors.cal_date}</p>}
                        </div>

                        {/* Calibration Due Date */}
                        <div className="space-y-2">
                            <Label htmlFor="cal_due_date">Calibration Due Date *</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="cal_due_date"
                                    type="date"
                                    value={calDueDate ? format(calDueDate, 'yyyy-MM-dd') : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const newDate = new Date(e.target.value);
                                            handleCalDueDateChange(newDate);
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="shrink-0"
                                        >
                                            <CalendarIcon className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={calDueDate}
                                            onSelect={handleCalDueDateChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {errors.cal_due_date && <p className="text-sm text-destructive">{errors.cal_due_date}</p>}
                        </div>

                        {/* Date Out */}
                        <div className="space-y-2">
                            <Label htmlFor="date_out">Date Out *</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="date_out"
                                    type="date"
                                    value={dateOut ? format(dateOut, 'yyyy-MM-dd') : ''}
                                    min={incomingRecord ? format(new Date(incomingRecord.date_in), 'yyyy-MM-dd') : undefined}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const newDate = new Date(e.target.value);
                                            handleDateOutChange(newDate);
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="shrink-0"
                                        >
                                            <CalendarIcon className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={dateOut}
                                            onSelect={handleDateOutChange}
                                            disabled={(date) => incomingRecord ? date < new Date(incomingRecord.date_in) : false}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {errors.date_out && <p className="text-sm text-destructive">{errors.date_out}</p>}
                            {incomingRecord && (
                                <p className="text-xs text-muted-foreground">
                                    Must be on or after {format(new Date(incomingRecord.date_in), 'MMM dd, yyyy')} (Date In)
                                </p>
                            )}
                        </div>

                        {/* Cycle Time (Read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="cycle_time">Cycle Time (Days)</Label>
                            <Input
                                id="cycle_time"
                                value={data.cycle_time}
                                readOnly
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Automatically calculated from date in to date out
                            </p>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Recording...' : 'Complete Calibration'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
