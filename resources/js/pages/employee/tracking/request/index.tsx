import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StepIndicator, type Step } from '@/components/ui/step-indicator';
import { UserCircle2, Wrench, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeTechnicianTab from '@/components/employee/tracking/request/technician-tab';
import EmployeeDetailsTab from '@/components/employee/tracking/request/detail-tab';
import EmployeeConfirmTab from '@/components/employee/tracking/request/confirm-tab';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Dashboard',
        href: '/employee/tracking',
    },
    {
        title: 'New Calibration Request',
        href: '/employee/tracking/request',
    },
];

interface EmployeeTrackingRequestProps {
    errors?: Record<string, string>;
    existingEquipment?: any[];
}

const EmployeeTrackingRequest: React.FC<EmployeeTrackingRequestProps> = ({
    errors: serverErrors = {},
    existingEquipment = []
}) => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState('technician');
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [requestType, setRequestType] = useState<'new' | 'routine'>('new');
    const [validationMessage, setValidationMessage] = useState<string | null>(null);

    // Form data states
    const [technician, setTechnician] = useState(null);
    const [equipmentData, setEquipmentData] = useState({
        recallNumber: '',
        description: '',
        serialNumber: '',
        model: '',
        manufacturer: '',
        plant: user?.plant_id || '',
        department: user?.department_id || '',
        location: ''
    });
    const [confirmation, setConfirmation] = useState({
        receivedBy: '',
        employeePin: ''
    });

    const { post, processing, errors, clearErrors, setError } = useForm({
        requestType,
        technician,
        equipment: equipmentData,
        confirmation
    });

    const steps: Step[] = [
        { id: 'technician', name: 'Technician', icon: <UserCircle2 className="h-5 w-5" /> },
        { id: 'details', name: 'Equipment Details', icon: <Wrench className="h-5 w-5" /> },
        { id: 'confirmation', name: 'Confirmation', icon: <CheckCircle2 className="h-5 w-5" /> },
    ];

    // Merge server errors
    useEffect(() => {
        if (Object.keys(serverErrors).length > 0) {
            Object.entries(serverErrors).forEach(([key, value]) => {
                setError(key, value);
            });
        }
    }, [serverErrors]);

    // Validation function
    const validateCurrentStep = (): boolean => {
        clearErrors();
        setValidationMessage(null);

        if (currentStep === 'technician') {
            if (!requestType) {
                setError('requestType', 'Please select a request type.');
                setValidationMessage('Please select a request type.');
                return false;
            }
            if (!technician) {
                setError('technician', 'Please select a technician.');
                setValidationMessage('Please select a technician.');
                return false;
            }
        }
        else if (currentStep === 'details') {
            const requiredFields = ['recallNumber', 'description'] as const;
            let isValid = true;

            requiredFields.forEach(field => {
                if (!equipmentData[field]) {
                    setError(`equipment.${field}`, `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required.`);
                    isValid = false;
                }
            });

            if (!isValid) {
                setValidationMessage('Please fill in all required equipment details.');
                return false;
            }
        }
        else if (currentStep === 'confirmation') {
            if (!confirmation.receivedBy) {
                setError('confirmation.receivedBy', 'Please select who will receive the equipment.');
                setValidationMessage('Please select who will receive the equipment.');
                return false;
            }
            if (!confirmation.employeePin || confirmation.employeePin.length < 4) {
                setError('confirmation.employeePin', 'PIN must be at least 4 digits.');
                setValidationMessage('PIN must be at least 4 digits.');
                return false;
            }
        }

        return true;
    };

    // Handle next step
    const handleNext = () => {
        if (!validateCurrentStep()) return;

        setCompletedSteps(prev => [...prev, currentStep]);
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
            data: {
                requestType,
                technician,
                equipment: equipmentData,
                confirmation
            },
            onSuccess: () => {
                router.visit(route('employee.tracking.index'));
            },
            onError: (errors) => {
                if (errors.technician) {
                    setCurrentStep('technician');
                } else if (errors.equipment || Object.keys(errors).some(key => key.startsWith('equipment.'))) {
                    setCurrentStep('details');
                } else if (errors.confirmation || Object.keys(errors).some(key => key.startsWith('confirmation.'))) {
                    setCurrentStep('confirmation');
                }

                if (Object.keys(errors).length > 0) {
                    setValidationMessage('Please fix the validation errors to continue.');
                }
            }
        });
    };

    const getError = (field: string) => errors[field] || '';

    const getStepErrors = (step: string) => {
        return Object.entries(errors)
            .filter(([key]) => key.startsWith(step))
            .reduce((acc, [key, value]) => {
                const fieldName = key.replace(`${step}.`, '');
                acc[fieldName] = value;
                return acc;
            }, {} as Record<string, string>);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Calibration Request" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Calibration Request</h1>
                    <p className="text-muted-foreground">Submit a request for equipment calibration</p>
                </div>

                {/* Request Type Selection */}
                <Tabs
                    defaultValue="new"
                    value={requestType}
                    onValueChange={(value) => setRequestType(value as 'new' | 'routine')}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 bg-muted">
                        <TabsTrigger value="new">New Equipment</TabsTrigger>
                        <TabsTrigger value="routine">Routine Calibration</TabsTrigger>
                    </TabsList>
                </Tabs>
                {errors.requestType && (
                    <p className="text-sm text-destructive mt-1">{errors.requestType}</p>
                )}

                {/* Steps Indicator */}
                <StepIndicator
                    steps={steps}
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                />

                <div>
                    {/* Step Content */}
                    <div className="py-4">
                        {currentStep === 'technician' && (
                            <EmployeeTechnicianTab
                                data={technician}
                                onChange={setTechnician}
                                errors={{ technician: getError('technician') }}
                            />
                        )}

                        {currentStep === 'details' && (
                            <EmployeeDetailsTab
                                data={equipmentData}
                                onChange={setEquipmentData}
                                errors={getStepErrors('equipment')}
                                requestType={requestType}
                                existingEquipment={existingEquipment}
                                user={user}
                            />
                        )}

                        {currentStep === 'confirmation' && (
                            <EmployeeConfirmTab
                                data={{
                                    technician,
                                    equipment: equipmentData,
                                    confirmation,
                                    user
                                }}
                                onChange={setConfirmation}
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

export default EmployeeTrackingRequest;
