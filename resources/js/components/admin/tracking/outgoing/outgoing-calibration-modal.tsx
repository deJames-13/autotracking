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
    incoming_id: number | null;
    recall_number: string;
    cal_date: string;
    cal_due_date: string;
    date_out: string;
    employee_id_out: string;
    cycle_time: number;
    ct_reqd: number | null;
    commit_etc: number | null;
    actual_etc: number | null;
    overdue: number | null;
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
        incoming_id: incomingRecord ? incomingRecord.id : null,
        recall_number: '',
        cal_date: '',
        cal_due_date: '',
        date_out: '',
        employee_id_out: '',
        cycle_time: 0,
        ct_reqd: null,
        commit_etc: null,
        actual_etc: null,
        overdue: null,
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
                incoming_id: incomingRecord.id,
                recall_number: incomingRecord.recall_number,
                cal_date: format(currentDate, 'yyyy-MM-dd'),
                cal_due_date: format(oneYearLater, 'yyyy-MM-dd'),
                date_out: format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
                employee_id_out: '',
                cycle_time: calculateCycleTime(incomingRecord.date_in, currentDate),
                ct_reqd: null,
                commit_etc: null,
                actual_etc: null,
                overdue: null,
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

            // Auto-calculate overdue if commit_etc is set
            if (commitEtc && date > commitEtc) {
                const timeDiff = date.getTime() - commitEtc.getTime();
                const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
                setData('overdue', days);
            }
        }
    };

    const handleCommitEtcChange = (date: Date | undefined) => {
        if (date) {
            setCommitEtc(date);
            setData('commit_etc', format(date, 'yyyy-MM-dd'));

            // Auto-calculate overdue if date_out is set
            if (dateOut && dateOut > date) {
                const timeDiff = dateOut.getTime() - date.getTime();
                const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
                setData('overdue', days);
            } else {
                setData('overdue', 0);
            }
        }
    };

    const handleActualEtcChange = (date: Date | undefined) => {
        if (date) {
            setActualEtc(date);
            setData('actual_etc', format(date, 'yyyy-MM-dd'));
        }
    };

    // Calculate queuing days (from date in to cal date)
    const calculateQueuingDays = (): number => {
        if (!incomingRecord || !calDate) return 0;

        const dateIn = new Date(incomingRecord.date_in);
        const calDateObj = new Date(calDate);

        const timeDiff = calDateObj.getTime() - dateIn.getTime();
        return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
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
            // Submit the form with current data using axios - Include all cycle time fields
            const response = await axios.post(route('api.track-outgoing.store'), {
                incoming_id: data.incoming_id,
                recall_number: data.recall_number,
                cal_date: data.cal_date,
                cal_due_date: data.cal_due_date,
                date_out: data.date_out,
                employee_id_out: data.employee_id_out,
                cycle_time: data.cycle_time,
                ct_reqd: data.ct_reqd,
                commit_etc: data.commit_etc,
                actual_etc: data.actual_etc,
                overdue: data.overdue,
                confirmation_pin: data.confirmation_pin
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
                            <Input
                                id="cal_date"
                                type="date"
                                value={calDate ? format(calDate, 'yyyy-MM-dd') : ''}
                                onChange={e => {
                                    if (e.target.value) handleCalDateChange(new Date(e.target.value));
                                }}
                            />
                        </div>
                        {/* Calibration Due Date */}
                        <div className="space-y-2">
                            <Label htmlFor="cal_due_date">Calibration Due Date *</Label>
                            <Input
                                id="cal_due_date"
                                type="date"
                                value={calDueDate ? format(calDueDate, 'yyyy-MM-dd') : ''}
                                onChange={e => {
                                    if (e.target.value) handleCalDueDateChange(new Date(e.target.value));
                                }}
                            />
                        </div>
                        {/* Date Out */}
                        <div className="space-y-2">
                            <Label htmlFor="date_out">Date Out *</Label>
                            <Input
                                id="date_out"
                                type="date"
                                value={dateOut ? format(dateOut, 'yyyy-MM-dd') : ''}
                                onChange={e => {
                                    if (e.target.value) handleDateOutChange(new Date(e.target.value));
                                }}
                            />
                        </div>
                        {/* CT Reqd (manual input) */}
                        <div className="space-y-2">
                            <Label htmlFor="ct_reqd">CT Reqd (days)</Label>
                            <Input
                                id="ct_reqd"
                                type="number"
                                value={data.ct_reqd ?? ''}
                                min={0}
                                onChange={e => setData('ct_reqd', e.target.value ? parseInt(e.target.value) : null)}
                            />
                        </div>
                        {/* Commit ETC (manual input, days) */}
                        <div className="space-y-2">
                            <Label htmlFor="commit_etc">Commit ETC (days)</Label>
                            <Input
                                id="commit_etc"
                                type="number"
                                value={data.commit_etc ?? ''}
                                min={0}
                                onChange={e => setData('commit_etc', e.target.value ? parseInt(e.target.value) : null)}
                            />
                        </div>
                        {/* Actual ETC (manual input, days) */}
                        <div className="space-y-2">
                            <Label htmlFor="actual_etc">Actual ETC (days)</Label>
                            <Input
                                id="actual_etc"
                                type="number"
                                value={data.actual_etc ?? ''}
                                min={0}
                                onChange={e => setData('actual_etc', e.target.value ? parseInt(e.target.value) : null)}
                            />
                        </div>
                        {/* Cycle Time (editable) */}
                        <div className="space-y-2">
                            <Label htmlFor="cycle_time">Cycle Time (Days)</Label>
                            <Input
                                id="cycle_time"
                                type="number"
                                value={data.cycle_time}
                                min={0}
                                onChange={e => setData('cycle_time', e.target.value ? parseInt(e.target.value) : 0)}
                            />
                        </div>
                        {/* Queuing Days (auto) */}
                        <div className="space-y-2">
                            <Label>Queuing Days</Label>
                            <Input
                                value={calculateQueuingDays()}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                        {/* Overdue (auto/manual) */}
                        <div className="space-y-2">
                            <Label htmlFor="overdue">Overdue (days)</Label>
                            <Input
                                id="overdue"
                                type="number"
                                value={data.overdue ?? 0}
                                min={0}
                                onChange={e => setData('overdue', e.target.value ? parseInt(e.target.value) : 0)}
                            />
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
