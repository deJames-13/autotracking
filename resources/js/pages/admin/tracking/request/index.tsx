import CalibrationTab from '@/components/admin/tracking/request/calibration-tab';
import ConfirmEmployeeTab from '@/components/admin/tracking/request/confirm-employee-tab';
import DetailTab from '@/components/admin/tracking/request/detail-tab';
import TechnicianTab from '@/components/admin/tracking/request/technician-tab';
import { Button } from '@/components/ui/button';
import { StepIndicator, type Step } from '@/components/ui/step-indicator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { persistor, store } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    addCompletedStep,
    markFormClean,
    resetForm,
    setCurrentStep,
    setReceivedBy,
    setRequestType,
    setScannedEmployee,
    setTechnician,
    updateCalibration,
    updateConfirmationPin,
    updateEquipment,
} from '@/store/slices/trackingRequestSlice';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { CheckCircle2, UserCircle2, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

interface TrackingRequestIndexProps {
    // Props needed for the request creation process
    errors?: Record<string, string>;
    edit?: number; // ID of the record being edited
    editData?: any; // Data for the record being edited
    confirm?: int; // Flag to indicate confirmation mode
}

const TrackingRequestContent: React.FC<TrackingRequestIndexProps> = ({ errors: serverErrors = {}, edit, editData, confirm }) => {
    const { canManageRequestIncoming, user: currenUser, isAdmin, isTechnician } = useRole();

    // Determine if PIN input should be shown (not for Admin or Technician)
    const shouldShowPinInput = !isAdmin() && !isTechnician();
    const dispatch = useAppDispatch();
    const [isEditMode] = useState(!!edit);
    const [isConfirmMode] = useState(!!confirm);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tracking Management',
            href: '/admin/tracking',
        },
        {
            title: isConfirmMode ? 'Confirm Employee Request' : edit ? 'Edit Tracking Request' : 'New Tracking Request',
            href: '/admin/tracking/request',
        },
    ];

    // Get state from Redux
    const {
        requestType,
        technician,
        equipment,
        calibration,
        confirmation_pin,
        currentStep,
        completedSteps,
        isFormDirty,
        scannedEmployee,
        receivedBy,
    } = useAppSelector((state) => state.trackingRequest);

    // Form state with Inertia useForm - use Redux data as initial values
    const { post, processing, errors, clearErrors, setError } = useForm({
        requestType,
        technician,
        equipment,
        calibration,
        confirmation_pin,
    });

    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Define the steps - exclude confirmation step in confirm mode
    const steps: Step[] = isConfirmMode
        ? [
            { id: 'technician', name: 'Technician', icon: <UserCircle2 className="h-5 w-5" /> },
            { id: 'details', name: 'Equipment Details', icon: <Wrench className="h-5 w-5" /> },
        ]
        : [
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

    // Load edit data when in edit mode
    useEffect(() => {
        if (edit && editData) {
            // Set request type to routine for edits
            dispatch(setRequestType('routine'));

            // Set technician data
            if (editData.technician) {
                dispatch(
                    setTechnician({
                        employee_id: editData.technician.employee_id,
                        first_name: editData.technician.first_name,
                        last_name: editData.technician.last_name,
                        full_name: `${editData.technician.first_name} ${editData.technician.last_name}`,
                        email: editData.technician.email || '',
                    }),
                );
            }

            // Set equipment data
            if (editData.equipment) {
                dispatch(
                    updateEquipment({
                        plant: editData.equipment.plant_id || '',
                        department: editData.equipment.department_id || '',
                        location: editData.location?.location_id || '',
                        location_name: editData.location?.location_name || '',
                        description: editData.description || '',
                        serialNumber: editData.equipment.serial_number || '',
                        recallNumber: editData.recall_number || '',
                        model: editData.equipment.model || '',
                        manufacturer: editData.equipment.manufacturer || '',
                        dueDate: editData.equipment.next_calibration_due
                            ? format(new Date(editData.equipment.next_calibration_due), 'yyyy-MM-dd')
                            : '',
                        receivedBy: '',
                    }),
                );
            }
            // Note: Additional logic can be added here if needed in the future

            // Set received by data
            if (editData.received_by) {
                dispatch(
                    setReceivedBy({
                        employee_id: editData.received_by.employee_id,
                        first_name: editData.received_by.first_name,
                        last_name: editData.received_by.last_name,
                        full_name: `${editData.received_by.first_name} ${editData.received_by.last_name}`,
                        email: editData.received_by.email || '',
                    }),
                );
            } else {
                dispatch(
                    setReceivedBy({
                        employee_id: currenUser.employee_id,
                        first_name: currenUser.first_name,
                        last_name: currenUser.last_name,
                        full_name: `${currenUser.first_name} ${currenUser.last_name}`,
                        email: currenUser.email || '',
                    }),
                );
            }

            // Set scannedData
            if (editData.employee_in) {
                dispatch(
                    setScannedEmployee({
                        employee_id: editData.employee_in.employee_id,
                        first_name: editData.employee_in.first_name,
                        last_name: editData.employee_in.last_name,
                        full_name: `${editData.employee_in.first_name} ${editData.employee_in.last_name}`,
                        email: editData.employee_in.email || '',
                        department_id: editData.employee_in.department?.department_id,
                        plant_id: editData.employee_in.plant?.plant_id,
                        department: editData.employee_in.department
                            ? {
                                department_id: editData.employee_in.department.department_id,
                                department_name: editData.employee_in.department.department_name,
                            }
                            : undefined,
                        plant: editData.employee_in.plant
                            ? {
                                plant_id: editData.employee_in.plant.plant_id,
                                plant_name: editData.employee_in.plant.plant_name,
                            }
                            : undefined,
                    }),
                );
            }

            // If in confirm mode, set initial step to 'details' since we need to update receivedBy
            if (isConfirmMode) {
                dispatch(setCurrentStep('details'));
                dispatch(addCompletedStep('technician'));
            }

            // Mark form as clean since we're loading existing data
            dispatch(markFormClean());
        }
    }, [edit, editData, dispatch, isConfirmMode]);

    // Validate the current step using Inertia's validation
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
                setError('technician', 'Please select a technician to continue.');
                setValidationMessage('Please select a technician to continue.');
                return false;
            }
        } else if (currentStep === 'details') {
            const requiredFields = ['plant', 'department', 'description', 'serialNumber'] as const;
            let isValid = true;

            requiredFields.forEach((field) => {
                const value = equipment[field];
                // Check for empty string, null, undefined, or 0 for ID fields
                const isEmpty =
                    value === '' ||
                    value === null ||
                    value === undefined ||
                    ((field === 'plant' || field === 'department') && value === 0);

                if (isEmpty) {
                    setError(
                        `equipment.${field}`,
                        `${field.charAt(0).toUpperCase() +
                        field
                            .slice(1)
                            .replace(/([A-Z])/g, ' $1')
                            .trim()
                        } is required.`,
                    );
                    isValid = false;
                }
            });

            if (!isValid) {
                setValidationMessage('Please fill in all required equipment details.');
                return false;
            }
        } else if (currentStep === 'calibration') {
            const requiredFields = ['calibrationDate', 'expectedDueDate', 'dateOut'] as const;
            let isValid = true;

            requiredFields.forEach((field) => {
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
        } else if (currentStep === 'confirmation' && !isConfirmMode) {
            // Only validate PIN for non-Admin/non-Technician users
            if (shouldShowPinInput && (!confirmation_pin || confirmation_pin.length < 4)) {
                setError('confirmation_pin', 'PIN must be at least 4 digits.');
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
        dispatch(addCompletedStep(currentStep));

        // Move to next step
        const currentIndex = steps.findIndex((step) => step.id === currentStep);
        if (currentIndex < steps.length - 1) {
            dispatch(setCurrentStep(steps[currentIndex + 1].id));
        }
    };

    // Handle back
    const handleBack = () => {
        const currentIndex = steps.findIndex((step) => step.id === currentStep);
        if (currentIndex > 0) {
            dispatch(setCurrentStep(steps[currentIndex - 1].id));
        }
    };

    const handleConfirmPin = async () => {
        if (!validateCurrentStep()) return false;

        try {
            // Get current Redux state
            const currentState = store.getState().trackingRequest;

            // Check if we have a scanned employee
            if (!currentState.scannedEmployee?.employee_id) {
                toast.error('Employee ID is required.');
                return false;
            }

            // For Admin/Technician, skip PIN requirement
            if (!shouldShowPinInput) {
                toast.success('Employee validated successfully (PIN bypassed for privileged user).');
                return true;
            }

            // For regular users, PIN is required
            if (!currentState.confirmation_pin) {
                toast.error('PIN is required.');
                return false;
            }

            // Build request data - include PIN only if required
            const requestData: any = {
                employee_id: currentState.scannedEmployee.employee_id,
            };

            // Only include PIN if not bypassed
            if (shouldShowPinInput) {
                requestData.pin = currentState.confirmation_pin;
            }

            // Send request to verify PIN using Axios or fetch with proper CSRF handling
            const response = await axios.post(route('api.tracking.request.confirm-pin'), requestData);

            // Axios automatically handles response status
            const result = response.data;

            if (!result.success) {
                toast.error(result.message || 'Invalid PIN. Please try again.');
                return false;
            }

            // PIN verified successfully or bypassed
            const message = result.bypassed_pin
                ? 'Employee validated successfully (PIN bypassed for privileged user).'
                : 'Employee PIN confirmed successfully.';
            toast.success(message);
            return true;
        } catch (error) {
            console.error('Error confirming PIN:', error);

            // Check if the error has a response from the server
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.message || 'PIN verification failed. Please try again.');
            } else {
                toast.error('An error occurred while verifying the PIN. Please try again.');
            }
            return false;
        }
    };
    // Handle form submission
    const handleSubmit = async () => {
        if (!validateCurrentStep() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // First confirm PIN before proceeding with submission (skip in confirm mode or if not needed)
            const isPinConfirmed = isConfirmMode || currentStep !== 'confirmation' || (await handleConfirmPin());
            if (!isPinConfirmed) {
                setIsSubmitting(false);
                return;
            }

            // Get current Redux state for submission
            const currentState = store.getState().trackingRequest;

            // For confirm mode, we need to send a specific flag
            const endpoint = isConfirmMode ? route('api.tracking.incoming.confirm-employee-request', edit) : route('api.tracking.request.store');

            const payload = isConfirmMode
                ? {
                    received_by_id: currentState.receivedBy?.employee_id,
                    employee_id_in: currentState.scannedEmployee?.employee_id,
                }
                : {
                    data: {
                        requestType: currentState.requestType,
                        technician: currentState.technician,
                        equipment: currentState.equipment,
                        calibration: currentState.calibration,
                        confirmation_pin: currentState.confirmation_pin,
                        scannedEmployee: currentState.scannedEmployee,
                        receivedBy: currentState.receivedBy,
                    },
                    edit_id: edit,
                    confirm_mode: isEditMode,
                };

            // Submit the form with current Redux data using axios
            const response = await axios.post(endpoint, payload);

            // Check if the response indicates success
            if (response.data.success) {
                // Show success message
                const successMessage = isConfirmMode
                    ? 'Employee request confirmed successfully!'
                    : edit
                        ? response.data.message || 'Tracking request updated successfully!'
                        : response.data.message || 'Tracking request created successfully!';

                toast.success(successMessage);

                // Reset Redux state on successful submission
                dispatch(resetForm());
                dispatch(markFormClean());

                // Redirect to incoming table using Inertia router
                router.visit(route('admin.tracking.incoming.index'), {
                    onSuccess: () => {
                        // Additional success handling if needed
                        console.log('Successfully navigated to incoming index');
                        setIsSubmitting(false);
                    },
                    onError: () => {
                        setIsSubmitting(false);
                    },
                });
            } else {
                // Handle unsuccessful response
                const errorMessage = isConfirmMode
                    ? 'Failed to confirm employee request'
                    : edit
                        ? response.data.message || 'Failed to update tracking request'
                        : response.data.message || 'Failed to create tracking request';

                toast.error(errorMessage);
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Error submitting form:', error);

            if (axios.isAxiosError(error) && error.response) {
                const errorData = error.response.data;

                // Handle validation errors
                if (error.response.status === 422 && errorData.errors) {
                    const validationErrors = errorData.errors;

                    // Find the first step with errors - handle nested validation structure
                    if (validationErrors['data.technician'] || validationErrors['data.technician.employee_id']) {
                        dispatch(setCurrentStep('technician'));
                    } else if (
                        validationErrors['data.equipment'] ||
                        Object.keys(validationErrors).some((key) => key.startsWith('data.equipment.')) ||
                        validationErrors['data.receivedBy'] ||
                        Object.keys(validationErrors).some((key) => key.startsWith('data.receivedBy.'))
                    ) {
                        dispatch(setCurrentStep('details'));
                    } else if (validationErrors['data.confirmation_pin']) {
                        dispatch(setCurrentStep('confirmation'));
                    }

                    // Set a validation message for the general error
                    setValidationMessage('Please fix the validation errors to continue.');

                    // Show specific error message
                    toast.error('Please check the form for validation errors');
                } else {
                    // Handle other server errors
                    toast.error(errorData.message || 'Failed to create tracking request. Please try again.');
                }
            } else {
                // Handle network or other errors
                toast.error('An error occurred while submitting the request. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get errors for a specific field
    const getError = (field: string) => {
        return errors[field] || '';
    };

    // Get errors for a specific step
    const getStepErrors = (step: string) => {
        return Object.entries(errors)
            .filter(([key]) => key.startsWith(step))
            .reduce(
                (acc, [key, value]) => {
                    const fieldName = key.replace(`${step}.`, '');
                    acc[fieldName] = value;
                    return acc;
                },
                {} as Record<string, string>,
            );
    };

    // Modified function to handle nested data updates properly with better date handling
    const updateNestedData = (key: string, value: any) => {
        if (key === 'equipment') {
            // Use updateEquipment to properly merge values
            dispatch(updateEquipment(value));
        } else if (key === 'calibration') {
            // Handle dates in calibration data
            dispatch(updateCalibration(value));
        } else if (key === 'confirmation_pin') {
            dispatch(updateConfirmationPin(value));
        } else {
            // Handle non-nested data
            dispatch(setTechnician(value));
        }
    };

    // Handle request type change to reset form and generate recall number for new requests
    const handleRequestTypeChange = (type: 'new' | 'routine') => {
        dispatch(setRequestType(type));

        // We'll no longer generate or modify the recall number here
        // The recall number will be generated in the ConfirmEmployeeTab
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
            const url = event?.detail?.url;
            // If navigating away from tracking request pages, reset form
            if (url && !url.includes('/admin/tracking/request')) {
                dispatch(resetForm());
            }
        };

        document.addEventListener('inertia:start', handleInertiaStart);

        return () => {
            document.removeEventListener('inertia:start', handleInertiaStart);
        };
    }, [dispatch]);

    // When recall number changes for routine, prefill equipment info
    useEffect(() => {
        if (requestType === 'routine' && equipment.recallNumber) {
            axios
                .get(route('api.equipment.search-by-recall'), {
                    params: { recall_number: equipment.recallNumber },
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                })
                .then((response) => {
                    if (response.data.success && response.data.equipment) {
                        dispatch(
                            updateEquipment({
                                ...response.data.equipment,
                                recallNumber: equipment.recallNumber,
                                existing: true,
                                equipment_id: response.data.equipment.equipment_id,
                            }),
                        );
                    } else {
                        dispatch(
                            updateEquipment({
                                recallNumber: equipment.recallNumber,
                                existing: false,
                                equipment_id: null,
                            }),
                        );
                    }
                });
        }
    }, [requestType, equipment.recallNumber, dispatch]);

    // Redirect if user doesn't have permission
    if (!canManageRequestIncoming()) {
        router.visit('/dashboard');
        return null;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isConfirmMode ? 'Confirm Employee Request' : edit ? 'Edit Tracking Request' : 'New Tracking Request'} />

            <div className="space-y-6 p-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isConfirmMode ? 'Confirm Employee Request' : edit ? 'Edit Tracking Request' : 'New Tracking Request'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isConfirmMode
                            ? 'Confirm and verify employee equipment request details'
                            : edit
                                ? 'Modify existing equipment tracking request'
                                : 'Create a new equipment tracking request'}
                    </p>
                </div>

                {/* Request Type Selection - Hide in confirm mode */}
                {!isConfirmMode && (
                    <Tabs defaultValue="new" value={requestType} onValueChange={handleRequestTypeChange} className="w-full">
                        <TabsList className="bg-muted grid w-full grid-cols-2">
                            <TabsTrigger
                                value="new"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                disabled={currentStep === 'confirmation'}
                            >
                                New Equipment
                            </TabsTrigger>
                            <TabsTrigger
                                value="routine"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                disabled={currentStep === 'confirmation'}
                            >
                                Routine Calibration
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                {errors.requestType && <p className="text-destructive mt-1 text-sm">{errors.requestType}</p>}

                {/* Steps Indicator - Custom steps for confirm mode */}
                <StepIndicator
                    steps={
                        isConfirmMode
                            ? [
                                { id: 'technician', name: 'Technician', icon: <UserCircle2 className="h-5 w-5" /> },
                                { id: 'details', name: 'Equipment Details', icon: <Wrench className="h-5 w-5" /> },
                            ]
                            : steps
                    }
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
                                onScannedEmployeeChange={(employee) => dispatch(setScannedEmployee(employee))} // Kept for compatibility, but Redux is managed directly in DetailTab
                                onReceivedByChange={(user) => dispatch(setReceivedBy(user))}
                                errors={getStepErrors('equipment')}
                                technician={technician}
                                receivedBy={receivedBy}
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
                                    confirmation_pin,
                                    scannedEmployee,
                                    receivedBy,
                                    edit,
                                }}
                                onChange={updateNestedData}
                                errors={{ pin: getError('confirmation_pin') }}
                            />
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex justify-between">
                        {currentStep !== 'technician' && (
                            <Button variant="outline" onClick={handleBack} disabled={processing || isSubmitting}>
                                Back
                            </Button>
                        )}

                        <div className="ml-auto">
                            {isConfirmMode && currentStep === 'details' ? (
                                <Button onClick={handleSubmit} disabled={processing || isSubmitting}>
                                    {isSubmitting ? 'Confirming...' : 'Confirm Request'}
                                </Button>
                            ) : currentStep !== 'confirmation' ? (
                                    <Button onClick={handleNext} disabled={processing || isSubmitting}>
                                    Next
                                </Button>
                            ) : (
                                        <Button onClick={handleSubmit} disabled={processing || isSubmitting}>
                                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
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
