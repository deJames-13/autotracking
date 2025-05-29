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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
    setRequestType,
    setTechnician,
    updateEquipment,
    updateCalibration,
    updateConfirmation,
    setCurrentStep,
    addCompletedStep,
    resetForm,
    markFormClean
} from '@/store/slices/trackingRequestSlice'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/store'

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

const TrackingRequestContent: React.FC<TrackingRequestIndexProps> = ({ errors: serverErrors = {} }) => {
    const { canManageUsers } = useRole();
    const dispatch = useAppDispatch()

    // Get state from Redux
    const {
        requestType,
        technician,
        equipment,
        calibration,
        confirmation,
        currentStep,
        completedSteps,
        isFormDirty
    } = useAppSelector(state => state.trackingRequest)

    // Form state with Inertia useForm - use Redux data as initial values
    const { post, processing, errors, clearErrors, setError } = useForm({
        requestType,
        technician,
        equipment,
        calibration,
        confirmation
    })

    const [validationMessage, setValidationMessage] = useState<string | null>(null);

    // Define the steps
    const steps: Step[] = [
        { id: 'technician', name: 'Technician', icon: <UserCircle2 className="h-5 w-5" /> },
        { id: 'details', name: 'Equipment Details', icon: <Wrench className="h-5 w-5" /> },
        { id: 'confirmation', name: 'Confirmation', icon: <CheckCircle2 className="h-5 w-5" /> },
    ];

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

        // Add debugging
        console.log('Validating step:', currentStep);
        console.log('Current equipment state:', equipment);

        if (currentStep === 'technician') {
            if (!requestType) {
                setError('requestType', 'Please select a request type.');
                setValidationMessage('Please select a request type.');
                return false;
            }

            if (!technician) {
                setError('technician', 'Please select a technician to continue.');
                setValidationMessage('Please select a technician to continue.');
                return false;
            }
        }
        else if (currentStep === 'details') {
            const requiredFields = ['plant', 'department', 'location', 'description', 'serialNumber'] as const;
            let isValid = true;

            requiredFields.forEach(field => {
                const value = equipment[field];
                // Check for empty string, null, undefined, or 0 for ID fields
                const isEmpty = value === '' || value === null || value === undefined ||
                    (field === 'plant' || field === 'department' || field === 'location') && value === 0;

                if (isEmpty) {
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
                if (!calibration[field]) {
                    setError(`calibration.${field}`, `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required.`);
                    isValid = false;
                }
            });

            if (!isValid) {
                setValidationMessage('Please fill in all calibration dates.');
                return false;
            }

            // Validate date relationships
            const calibrationDate = new Date(calibration.calibrationDate);
            const expectedDueDate = new Date(calibration.expectedDueDate);

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
            if (!confirmation.employee) {
                setError('confirmation.employee', 'Please select an employee for confirmation.');
                setValidationMessage('Please select an employee for confirmation.');
                return false;
            }

            if (!confirmation.pin || confirmation.pin.length < 4) {
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

        // Mark current step as completed in Redux
        dispatch(addCompletedStep(currentStep))

        // Move to next step
        const currentIndex = steps.findIndex(step => step.id === currentStep);
        if (currentIndex < steps.length - 1) {
            dispatch(setCurrentStep(steps[currentIndex + 1].id))
        }
    };

    // Handle back
    const handleBack = () => {
        const currentIndex = steps.findIndex(step => step.id === currentStep);
        if (currentIndex > 0) {
            dispatch(setCurrentStep(steps[currentIndex - 1].id))
        }
    };

    // Handle form submission
    const handleSubmit = () => {
        if (!validateCurrentStep()) return;

        // Get current Redux state for submission
        const currentState = store.getState().trackingRequest

        // Submit the form with current Redux data
        post(route('admin.tracking.request.store'), {
            data: {
                requestType: currentState.requestType,
                technician: currentState.technician,
                equipment: currentState.equipment,
                calibration: currentState.calibration,
                confirmation: currentState.confirmation
            },
            onSuccess: () => {
                // Reset Redux state on successful submission
                dispatch(resetForm())
                dispatch(markFormClean())
                router.visit(route('admin.tracking.index'));
            },
            onError: (errors) => {
                // Find the first step with errors
                if (errors.technician) {
                    dispatch(setCurrentStep('technician'));
                } else if (errors.equipment || Object.keys(errors).some(key => key.startsWith('equipment.'))) {
                    dispatch(setCurrentStep('details'));
                } else if (errors.calibration || Object.keys(errors).some(key => key.startsWith('calibration.'))) {
                    dispatch(setCurrentStep('calibration'));
                } else if (errors.confirmation || Object.keys(errors).some(key => key.startsWith('confirmation.'))) {
                    dispatch(setCurrentStep('confirmation'));
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

    // Modified function to handle nested data updates properly with better date handling
    const updateNestedData = (key: string, value: any) => {
        if (key === 'equipment') {
            // Use updateEquipment to properly merge values
            dispatch(updateEquipment(value))
        } else if (key === 'calibration') {
            // Handle dates in calibration data
            dispatch(updateCalibration(value))
        } else if (key === 'confirmation') {
            dispatch(updateConfirmation(value))
        } else {
            // Handle non-nested data
            dispatch(setTechnician(value));
        }
    };

    // Add cleanup effect when component unmounts or user navigates away
    useEffect(() => {
        // Cleanup function that runs when component unmounts
        return () => {
            // Only reset if form is not dirty or if user is navigating away from tracking pages
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/admin/tracking/request')) {
                dispatch(resetForm());
            }
        };
    }, [dispatch]);

    // Add beforeunload event to reset form when user refreshes or closes tab
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Reset form on page unload if not submitted
            if (isFormDirty) {
                dispatch(resetForm());
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isFormDirty, dispatch]);

    // Add Inertia navigation listener to reset form when navigating away
    useEffect(() => {
        const handleInertiaStart = (event: any) => {
            const { url } = event.detail;
            // If navigating away from tracking request pages, reset form
            if (!url.includes('/admin/tracking/request')) {
                dispatch(resetForm());
            }
        };

        document.addEventListener('inertia:start', handleInertiaStart);

        return () => {
            document.removeEventListener('inertia:start', handleInertiaStart);
        };
    }, [dispatch]);

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

                {/* Request Type Selection */}
                <Tabs
                    defaultValue="new"
                    value={requestType}
                    onValueChange={(value) => dispatch(setRequestType(value as 'new' | 'routine'))}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 bg-muted">
                        <TabsTrigger
                            value="new"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            New
                        </TabsTrigger>
                        <TabsTrigger
                            value="routine"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            Routine
                        </TabsTrigger>
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
                            <TechnicianTab
                                data={technician}
                                onChange={(tech) => dispatch(setTechnician(tech))}
                                errors={{ technician: getError('technician') }}
                            />
                        )}

                        {currentStep === 'details' && (
                            <DetailTab
                                data={equipment}
                                onChange={(equipmentUpdate) => dispatch(updateEquipment(equipmentUpdate))}
                                errors={getStepErrors('equipment')}
                                technician={technician}
                            />
                        )}

                        {currentStep === 'calibration' && (
                            <CalibrationTab
                                data={{ ...calibration, ...equipment }}
                                technician={technician}
                                onChange={(cal) => dispatch(updateCalibration(cal))}
                                errors={getStepErrors('calibration')}
                            />
                        )}

                        {currentStep === 'confirmation' && (
                            <ConfirmEmployeeTab
                                data={{
                                    technician,
                                    equipment,
                                    calibration,
                                    confirmation
                                }}
                                onChange={(conf) => dispatch(updateConfirmation(conf))}
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

// Main component wrapped with Redux providers
const TrackingRequestIndex: React.FC<TrackingRequestIndexProps> = (props) => {
    return (
        <Provider store={store}>
            <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
                <TrackingRequestContent {...props} />
            </PersistGate>
        </Provider>
    );
};

export default TrackingRequestIndex;
