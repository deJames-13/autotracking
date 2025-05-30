import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import EmployeeTechnicianTab from '@/components/employee/tracking/request/technician-tab';
import EmployeeTypeTab from '@/components/employee/tracking/request/type-tab';
import EmployeeDetailsTab from '@/components/employee/tracking/request/details-tab';
import EmployeeConfirmTab from '@/components/employee/tracking/request/confirm-tab';
import { Button } from '@/components/ui/button';
import { StepIndicator, type Step } from '@/components/ui/step-indicator';
import { UserCircle2, Wrench, CalendarClock, CheckCircle2, FileText, ScanLine } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Equipment Tracking',
        href: '/employee/tracking',
    },
    {
        title: 'Request Calibration',
        href: '/employee/tracking/request',
    },
];

interface EmployeeTrackingRequestProps {
    errors?: Record<string, string>;
}

const EmployeeTrackingRequest: React.FC<EmployeeTrackingRequestProps> = ({ errors: serverErrors = {} }) => {
    const { canViewEmployeeTracking } = useRole();

    const [currentStep, setCurrentStep] = useState('technician');
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);

    // Form state
    const { data, setData, post, processing, errors, clearErrors, setError } = useForm({
        technician: null,
        requestType: 'routine',
        equipment: {
            recallNumber: '',
            description: '',
            serialNumber: '',
            model: '',
            manufacturer: '',
        },
        registration: {
            registrationDate: new Date().toISOString().split('T')[0],
        },
        employee: {
            employeeId: '',
            department: '',
            location: '',
        },
        receivedBy: null,
    });

    // Define the steps for employee flow
    const steps: Step[] = [
        { id: 'technician', name: 'Technician', icon: <UserCircle2 className="h-5 w-5" /> },
        { id: 'type', name: 'Type', icon: <FileText className="h-5 w-5" /> },
        { id: 'details', name: 'Details', icon: <Wrench className="h-5 w-5" /> },
        { id: 'registration', name: 'Registration', icon: <CalendarClock className="h-5 w-5" /> },
        { id: 'scan', name: 'Scan Employee', icon: <ScanLine className="h-5 w-5" /> },
        { id: 'confirm', name: 'Confirm', icon: <CheckCircle2 className="h-5 w-5" /> },
    ];

    // Merge server errors
    useEffect(() => {
        if (Object.keys(serverErrors).length > 0) {
            Object.entries(serverErrors).forEach(([key, value]) => {
                setError(key, value);
            });
        }
    }, [serverErrors]);

    // Validate current step
    const validateCurrentStep = (): boolean => {
        clearErrors();
        setValidationMessage(null);

        if (currentStep === 'technician') {
            if (!data.technician) {
                setError('technician', 'Please select a technician.');
                setValidationMessage('Please select a technician to continue.');
                return false;
            }
        }
        else if (currentStep === 'type') {
            if (!data.requestType) {
                setError('requestType', 'Please select a request type.');
                setValidationMessage('Please select request type.');
                return false;
            }
        }
        else if (currentStep === 'details') {
            const requiredFields = ['recallNumber', 'description'] as const;
            let isValid = true;

            requiredFields.forEach(field => {
                if (!data.equipment[field]) {
                    setError(`equipment.${field}`, `${field} is required.`);
                    isValid = false;
                }
            });

            if (!isValid) {
                setValidationMessage('Please fill in all required equipment details.');
                return false;
            }
        }
        else if (currentStep === 'registration') {
            if (!data.registration.registrationDate) {
                setError('registration.registrationDate', 'Registration date is required.');
                setValidationMessage('Please select registration date.');
                return false;
            }
        }
        else if (currentStep === 'scan') {
            if (!data.employee.employeeId) {
                setError('employee.employeeId', 'Please scan employee ID.');
                setValidationMessage('Please scan employee ID to continue.');
                return false;
            }
        }
        else if (currentStep === 'confirm') {
            if (!data.receivedBy) {
                setError('receivedBy', 'Please select who received the equipment.');
                setValidationMessage('Please select received by.');
                return false;
            }
        }

        return true;
    };

    // Handle next step
    const handleNext = () => {
        if (!validateCurrentStep()) return;

        // Mark current step as completed
        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep]);
        }

        // Move to next step
        const currentIndex = steps.findIndex(step => step.id === currentStep);
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1].id);
        }
    };

    // Handle back
    const handleBack = () => {
        const currentIndex = steps.findIndex(step => step.id === currentStep);
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1].id);
        }
    };

    // Handle form submission
    const handleSubmit = () => {
        if (!validateCurrentStep()) return;

        post(route('employee.tracking.request.store'), {
            onSuccess: () => {
                router.visit(route('employee.tracking.index'));
            },
            onError: (errors) => {
                // Navigate to first step with errors
                const stepOrder = ['technician', 'type', 'details', 'registration', 'scan', 'confirm'];
                for (const step of stepOrder) {
                    if (Object.keys(errors).some(key => key.startsWith(step))) {
                        setCurrentStep(step);
                        break;
                    }
                }
                setValidationMessage('Please fix the validation errors to continue.');
            }
        });
    };

    // Redirect if user doesn't have permission
    if (!canViewEmployeeTracking()) {
        router.visit('/dashboard');
        return null;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Request Calibration" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Request Calibration</h1>
                    <p className="text-muted-foreground">Schedule equipment for calibration service</p>
                </div>

                {/* Steps Indicator */}
                <StepIndicator
                    steps={steps}
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                />

                {/* Validation Message */}
                {validationMessage && (
                    <Alert variant="destructive">
                        <AlertDescription>{validationMessage}</AlertDescription>
                    </Alert>
                )}

                <div>
                    {/* Step Content */}
                    <div className="py-4">
                        {currentStep === 'technician' && (
                            <EmployeeTechnicianTab
                                data={data.technician}
                                onChange={(technician) => setData('technician', technician)}
                                errors={{ technician: errors.technician || '' }}
                            />
                        )}

                        {currentStep === 'type' && (
                            <EmployeeTypeTab
                                data={data.requestType}
                                onChange={(type) => setData('requestType', type)}
                                errors={{ requestType: errors.requestType || '' }}
                            />
                        )}

                        {currentStep === 'details' && (
                            <EmployeeDetailsTab
                                data={data.equipment}
                                onChange={(equipment) => setData('equipment', equipment)}
                                errors={Object.entries(errors)
                                    .filter(([key]) => key.startsWith('equipment.'))
                                    .reduce((acc, [key, value]) => {
                                        acc[key.replace('equipment.', '')] = value;
                                        return acc;
                                    }, {} as Record<string, string>)
                                }
                            />
                        )}

                        {currentStep === 'registration' && (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">Registration Date</label>
                                            <input
                                                type="date"
                                                value={data.registration.registrationDate}
                                                onChange={(e) => setData('registration', { registrationDate: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border rounded-md"
                                            />
                                            {errors['registration.registrationDate'] && (
                                                <p className="text-sm text-destructive mt-1">{errors['registration.registrationDate']}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {currentStep === 'scan' && (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <ScanLine className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                            <h3 className="text-lg font-medium">Scan Employee ID</h3>
                                            <p className="text-muted-foreground">Scan employee barcode to auto-fill department and location</p>
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Employee ID (or type manually)"
                                                value={data.employee.employeeId}
                                                onChange={(e) => {
                                                    const employeeId = e.target.value;
                                                    // Simulate auto-fill after employee ID is entered
                                                    if (employeeId.length >= 4) {
                                                        setData('employee', {
                                                            employeeId,
                                                            department: 'Engineering',
                                                            location: 'Building A - Floor 2'
                                                        });
                                                    } else {
                                                        setData('employee', { employeeId, department: '', location: '' });
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border rounded-md text-center text-lg"
                                            />
                                            {errors['employee.employeeId'] && (
                                                <p className="text-sm text-destructive mt-1">{errors['employee.employeeId']}</p>
                                            )}
                                        </div>
                                        {data.employee.department && (
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                                                    <p>{data.employee.department}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                                                    <p>{data.employee.location}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {currentStep === 'confirm' && (
                            <EmployeeConfirmTab
                                data={{
                                    technician: data.technician,
                                    requestType: data.requestType,
                                    equipment: data.equipment,
                                    registration: data.registration,
                                    employee: data.employee,
                                    receivedBy: data.receivedBy
                                }}
                                onChange={(receivedBy) => setData('receivedBy', receivedBy)}
                                errors={{ receivedBy: errors.receivedBy || '' }}
                            />
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8">
                        {currentStep !== 'technician' && (
                            <Button variant="outline" onClick={handleBack} disabled={processing}>
                                Back
                            </Button>
                        )}

                        <div className="ml-auto">
                            {currentStep !== 'confirm' ? (
                                <Button onClick={handleNext} disabled={processing}>
                                    Next
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={processing}>
                                    Submit Request
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default EmployeeTrackingRequest;
