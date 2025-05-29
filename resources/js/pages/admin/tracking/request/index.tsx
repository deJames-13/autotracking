import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TechnicianTab from '@/components/admin/tracking/request/technician-tab';
import DetailTab from '@/components/admin/tracking/request/detail-tab';
import CalibrationTab from '@/components/admin/tracking/request/calibration-tab';
import ConfirmEmployeeTab from '@/components/admin/tracking/request/confirm-employee-tab';
import { Button } from '@/components/ui/button';
import { StepIndicator, type Step } from '@/components/ui/step-indicator';
import { UserCircle2, Wrench, CalendarClock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tracking Management',
        href: '/admin/tracking',
    },
    {
        title: 'New Tracking Request',
        href: '/admin/tracking/request',
    },
];

interface TrackingRequestIndexProps {
    // Props needed for the request creation process
    errors?: Record<string, string>;
}

const TrackingRequestIndex: React.FC<TrackingRequestIndexProps> = ({ errors: serverErrors = {} }) => {
    const { canManageUsers } = useRole();

    // Define the steps
    const steps: Step[] = [
        { id: 'technician', name: 'Technician', icon: <UserCircle2 className="h-5 w-5" /> },
        { id: 'details', name: 'Equipment Details', icon: <Wrench className="h-5 w-5" /> },
        { id: 'calibration', name: 'Calibration', icon: <CalendarClock className="h-5 w-5" /> },
        { id: 'confirmation', name: 'Confirmation', icon: <CheckCircle2 className="h-5 w-5" /> },
    ];

    // Form state with Inertia useForm
    const { data, setData, post, processing, errors, clearErrors, setError, hasErrors } = useForm({
        technician: null,
        equipment: {
            plant: '',
            department: '',
            location: '',
            description: '',
            serialNumber: '',
            model: '',
            manufacturer: ''
        },
        calibration: {
            calibrationDate: '',
            expectedDueDate: '',
            dateOut: ''
        },
        confirmation: {
            employee: null,
            pin: ''
        }
    });

    const [currentStep, setCurrentStep] = useState('technician');
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);

    // Merge server errors with client-side errors if needed
    useEffect(() => {
        if (Object.keys(serverErrors).length > 0) {
            Object.entries(serverErrors).forEach(([key, value]) => {
                setError(key, value);
            });
        }
    }, [serverErrors]);

    // Validate the current step using Inertia's validation
    const validateCurrentStep = (): boolean => {
        clearErrors();
        setValidationMessage(null);

        if (currentStep === 'technician') {
            if (!data.technician) {
                setError('technician', 'Please select a technician to continue.');
                setValidationMessage('Please select a technician to continue.');
                return false;
            }
        }
        else if (currentStep === 'details') {
            const requiredFields = ['plant', 'department', 'location', 'description', 'serialNumber'] as const;
            let isValid = true;

            requiredFields.forEach(field => {
                if (!data.equipment[field]) {
                    setError(`equipment.${field}`, `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1').trim()} is required.`);
                    isValid = false;
                }
            });

            if (!isValid) {
                setValidationMessage('Please fill in all required equipment details.');
                return false;
            }
        }
        else if (currentStep === 'calibration') {
            const requiredFields = ['calibrationDate', 'expectedDueDate', 'dateOut'] as const;
            let isValid = true;

            requiredFields.forEach(field => {
                if (!data.calibration[field]) {
                    setError(`calibration.${field}`, `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required.`);
                    isValid = false;
                }
            });

            if (!isValid) {
                setValidationMessage('Please fill in all calibration dates.');
                return false;
            }

            // Validate date relationships
            const calibrationDate = new Date(data.calibration.calibrationDate);
            const expectedDueDate = new Date(data.calibration.expectedDueDate);

            if (expectedDueDate <= calibrationDate) {
                setError('calibration.expectedDueDate', 'Expected due date must be after calibration date.');
                setValidationMessage('Expected due date must be after calibration date.');
                return false;
            }

            // Validate that expectedDueDate is in the future
            if (expectedDueDate <= new Date()) {
                setError('calibration.expectedDueDate', 'Expected due date must be in the future.');
                setValidationMessage('Expected due date must be in the future.');
                return false;
            }
        }
        else if (currentStep === 'confirmation') {
            if (!data.confirmation.employee) {
                setError('confirmation.employee', 'Please select an employee for confirmation.');
                setValidationMessage('Please select an employee for confirmation.');
                return false;
            }

            if (!data.confirmation.pin || data.confirmation.pin.length < 4) {
                setError('confirmation.pin', 'PIN must be at least 4 digits.');
                setValidationMessage('PIN must be at least 4 digits.');
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

        // Submit the form with Inertia
        post(route('admin.tracking.request.store'), {
            onSuccess: () => {
                router.visit(route('admin.tracking.index'));
            },
            onError: (errors) => {
                // Find the first step with errors
                if (errors.technician) {
                    setCurrentStep('technician');
                } else if (errors.equipment || Object.keys(errors).some(key => key.startsWith('equipment.'))) {
                    setCurrentStep('details');
                } else if (errors.calibration || Object.keys(errors).some(key => key.startsWith('calibration.'))) {
                    setCurrentStep('calibration');
                } else if (errors.confirmation || Object.keys(errors).some(key => key.startsWith('confirmation.'))) {
                    setCurrentStep('confirmation');
                }

                // Set a validation message for the general error
                if (Object.keys(errors).length > 0) {
                    setValidationMessage('Please fix the validation errors to continue.');
                }
            }
        });
    };

    // Get errors for a specific field
    const getError = (field: string) => {
        return errors[field] || '';
    };

    // Get errors for a specific step
    const getStepErrors = (step: string) => {
        return Object.entries(errors)
            .filter(([key]) => key.startsWith(step))
            .reduce((acc, [key, value]) => {
                const fieldName = key.replace(`${step}.`, '');
                acc[fieldName] = value;
                return acc;
            }, {} as Record<string, string>);
    };

    // Redirect if user doesn't have permission
    if (!canManageUsers()) {
        router.visit('/dashboard');
        return null;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Tracking Request" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Tracking Request</h1>
                    <p className="text-muted-foreground">Create a new equipment tracking request</p>
                </div>

                {/* Steps Indicator */}
                <StepIndicator
                    steps={steps}
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                />

                {/* Validation Message */}
                {/* {validationMessage && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{validationMessage}</AlertDescription>
                    </Alert>
                )} */}

                <div>
                    {/* Step Content */}
                    <div className="py-4">
                        {currentStep === 'technician' && (
                            <TechnicianTab
                                data={data.technician}
                                onChange={(technician) => setData('technician', technician)}
                                errors={{ technician: getError('technician') }}
                            />
                        )}

                        {currentStep === 'details' && (
                            <DetailTab
                                data={data.equipment}
                                onChange={(equipment) => setData('equipment', equipment)}
                                errors={getStepErrors('equipment')}
                            />
                        )}

                        {currentStep === 'calibration' && (
                            <CalibrationTab
                                data={{ ...data.calibration, ...data.equipment }}
                                technician={data.technician}
                                onChange={(calibration) => setData('calibration', calibration)}
                                errors={getStepErrors('calibration')}
                            />
                        )}

                        {currentStep === 'confirmation' && (
                            <ConfirmEmployeeTab
                                data={data}
                                onChange={(confirmation) => setData('confirmation', confirmation)}
                                errors={getStepErrors('confirmation')}
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
                            {currentStep !== 'confirmation' ? (
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

export default TrackingRequestIndex;
