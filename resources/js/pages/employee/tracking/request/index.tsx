import { usePage } from '@inertiajs/react';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TechnicianTab from '@/components/admin/tracking/request/technician-tab';
import DetailTab from '@/components/admin/tracking/request/detail-tab';
import EmployeeSummaryTab from '@/components/admin/tracking/request/employee-summary-tab';
import { Button } from '@/components/ui/button';
import { StepIndicator, type Step } from '@/components/ui/step-indicator';
import { UserCircle2, Wrench, CalendarClock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useRole } from '@/hooks/use-role';
import {
    setRequestType,
    setTechnician,
    updateEquipment,
    updateCalibration,
    updateConfirmationPin,
    setCurrentStep,
    addCompletedStep,
    resetForm,
    markFormClean,
    setScannedEmployee,
    setReceivedBy,
    autoFillEmployeeData
} from '@/store/slices/trackingRequestSlice'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { format } from 'date-fns';
import { store, persistor } from '@/store'
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { User } from '@/types';
import { employeeStepValidationSchemas } from '@/validation/employee-tracking-schema';
import { ZodError } from 'zod';

interface EmployeeTrackingRequestIndexProps {
    errors?: Record<string, string>;
    edit?: number;
    editData?: any;
    currentUserWithRelations?: User;
    auth: {
        user: User;
    };
}

const EmployeeTrackingRequestContent: React.FC<EmployeeTrackingRequestIndexProps> = ({
    errors: serverErrors = {},
    edit,
    editData,
    currentUserWithRelations,
    auth
}) => {
    const dispatch = useAppDispatch();
    const [isEditMode] = useState(!!edit);
    const { canSubmitCalibrationRequest } = useRole();

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
        receivedBy
    } = useAppSelector(state => state.trackingRequest)

    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    // Define the steps for employee (no confirmation step needed)
    const steps: Step[] = [
        { id: 'technician', name: 'Technician', icon: <UserCircle2 className="h-5 w-5" /> },
        { id: 'details', name: 'Equipment Details', icon: <Wrench className="h-5 w-5" /> },
        { id: 'summary', name: 'Review & Submit', icon: <CalendarClock className="h-5 w-5" /> },
    ];

    console.log(currentUserWithRelations)

    // Check if user can submit calibration requests
    useEffect(() => {
        if (!canSubmitCalibrationRequest()) {
            router.visit('/dashboard');
        }
    }, [canSubmitCalibrationRequest]);

    // Auto-fill employee data on mount
    useEffect(() => {
        if (currentUserWithRelations && !scannedEmployee) {
            let firstLocation;
            if (currentUserWithRelations?.department?.locations?.length > 0) {
                firstLocation = currentUserWithRelations?.department?.locations[0]
            }
            // Set scannedEmployee with complete user data including relationships
            dispatch(setScannedEmployee({
                employee_id: currentUserWithRelations.employee_id,
                user_id: currentUserWithRelations.employee_id, // Use employee_id as user_id for compatibility
                first_name: currentUserWithRelations.first_name,
                last_name: currentUserWithRelations.last_name,
                full_name: currentUserWithRelations.full_name || `${currentUserWithRelations.first_name} ${currentUserWithRelations.last_name}`,
                email: currentUserWithRelations.email,
                department_id: currentUserWithRelations.department_id,
                plant_id: currentUserWithRelations.plant_id,
                department: currentUserWithRelations.department,
                plant: currentUserWithRelations.plant,
                role: currentUserWithRelations.role
            }));
            if (firstLocation) {
                dispatch(updateEquipment({
                    department: currentUserWithRelations.department?.department_id,
                    plant: currentUserWithRelations.plant?.plant_id,
                    location: firstLocation.location_id,
                    location_name: firstLocation.location_name,
                    processReqRangeStart: '',
                    processReqRangeEnd: '',
                    dueDate: format(new Date(), 'yyyy-MM-dd'),
                }))

            }


        }
    }, [currentUserWithRelations, dispatch, scannedEmployee]);

    // Clear validation errors when form data changes
    useEffect(() => {
        if (Object.keys(clientErrors).length > 0) {
            setClientErrors({});
        }
        if (validationMessage) {
            setValidationMessage(null);
        }
    }, [technician, equipment, calibration]);

    // Load edit data if in edit mode
    useEffect(() => {
        if (isEditMode && editData) {
            console.log('Loading edit data:', editData);

            // Set technician data
            if (editData.technician) {
                dispatch(setTechnician({
                    employee_id: editData.technician.employee_id,
                    first_name: editData.technician.first_name,
                    last_name: editData.technician.last_name,
                    full_name: `${editData.technician.first_name} ${editData.technician.last_name}`,
                    email: editData.technician.email || '',
                }));
            }

            // Set equipment data - more comprehensive approach
            dispatch(updateEquipment({
                plant: editData.plant_id || editData.equipment?.plant_id || '',
                department: editData.department_id || editData.equipment?.department_id || '',
                location: editData.location?.location_id || '',
                location_name: editData.location?.location_name || '',
                description: editData.description || '',
                serialNumber: editData.serial_number || editData.equipment?.serial_number || '',
                recallNumber: editData.recall_number || '',
                model: editData.model || editData.equipment?.model || '',
                manufacturer: editData.manufacturer || editData.equipment?.manufacturer || '',
                processReqRangeStart: editData.process_req_range_start || editData.equipment?.process_req_range_start || '',
                processReqRangeEnd: editData.process_req_range_end || editData.equipment?.process_req_range_end || '',
                dueDate: editData.due_date ?
                    format(new Date(editData.due_date), 'yyyy-MM-dd') :
                    (editData.equipment?.next_calibration_due ?
                        format(new Date(editData.equipment.next_calibration_due), 'yyyy-MM-dd') : '')
            }));

            // Set employee data
            if (editData.employee_in) {
                dispatch(setScannedEmployee({
                    employee_id: editData.employee_in.employee_id,
                    first_name: editData.employee_in.first_name,
                    last_name: editData.employee_in.last_name,
                    full_name: `${editData.employee_in.first_name} ${editData.employee_in.last_name}`,
                    email: editData.employee_in.email || '',
                    department_id: editData.employee_in.department_id,
                    plant_id: editData.employee_in.plant_id,
                    department: editData.employee_in.department,
                    plant: editData.employee_in.plant,
                    role: editData.employee_in.role
                }));
            }

            // Set received by data if present
            if (editData.received_by) {
                dispatch(setReceivedBy({
                    employee_id: editData.received_by.employee_id,
                    first_name: editData.received_by.first_name,
                    last_name: editData.received_by.last_name,
                    full_name: `${editData.received_by.first_name} ${editData.received_by.last_name}`,
                    email: editData.received_by.email || '',
                }));
            }

            // Mark form as clean since we're loading existing data
            dispatch(markFormClean());

            // Set current step (optional - depends on your UX)
            dispatch(setCurrentStep('technician'));
        }
    }, [isEditMode, editData, dispatch]);

    // Step validation function with Zod validation
    const validateCurrentStep = (): boolean => {
        clearValidationMessage();
        setClientErrors({});

        try {
            switch (currentStep) {
                case 'technician':
                    if (!technician) {
                        setValidationMessage('Please select a technician before proceeding.');
                        return false;
                    }

                    // Validate with Zod
                    employeeStepValidationSchemas.technician.parse({ technician });
                    return true;

                case 'details':
                    console.log(equipment)
                    if (!equipment.plant || !equipment.department || !equipment.location ||
                        !equipment.description || !equipment.serialNumber || !equipment.dueDate) {
                        setValidationMessage('Please fill in all required equipment details.');
                        return false;
                    }

                    // Validate with Zod
                    employeeStepValidationSchemas.details.parse({ equipment });
                    return true;

                case 'summary':
                    // No validation needed for summary step as it's just a review
                    return true;

                default:
                    return true;
            }
        } catch (error) {
            if (error instanceof ZodError) {
                const fieldErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    fieldErrors[path] = err.message;
                });
                setClientErrors(fieldErrors);

                // Set a general validation message
                setValidationMessage('Please fix the validation errors below before proceeding.');
                return false;
            }

            // Handle unexpected errors
            console.error('Validation error:', error);
            setValidationMessage('An unexpected validation error occurred.');
            return false;
        }
    };

    const clearValidationMessage = () => {
        setValidationMessage(null);
        setClientErrors({});
    };

    // Handle next step
    const handleNext = () => {
        if (!validateCurrentStep()) return;

        clearValidationMessage();

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
    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;

        // Get current Redux state for submission
        const currentState = store.getState().trackingRequest;

        try {
            // Submit the form using employee API endpoint
            const response = await axios.post(route('employee.tracking.api.incoming.store'), {
                data: {
                    technician: currentState.technician,
                    equipment: currentState.equipment,
                    calibration: currentState.calibration,
                    scannedEmployee: currentState.scannedEmployee,
                    receivedBy: currentState.receivedBy
                },
                edit_id: edit
            });

            // Check if the response indicates success
            if (response.data.message) {
                const successMessage = edit
                    ? 'Tracking request updated successfully!'
                    : 'Tracking request submitted successfully! Awaiting admin confirmation.';
                toast.success(successMessage);

                // Reset form and redirect
                dispatch(resetForm());
                dispatch(markFormClean());

                router.visit(route('employee.tracking.incoming.index'));
            }
        } catch (error: any) {
            console.error('Error submitting request:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('An error occurred while submitting the request. Please try again.');
            }
        }
    };

    // Reset form on component unmount or when navigating away
    useEffect(() => {
        return () => {
            if (!isEditMode) {
                dispatch(resetForm());
                dispatch(markFormClean());
            }
        };
    }, [dispatch, isEditMode]);

    // Improve the edit data loading to properly handle all fields
    useEffect(() => {
        if (isEditMode && editData) {
            console.log('Loading edit data:', editData);

            // Set technician data
            if (editData.technician) {
                dispatch(setTechnician({
                    employee_id: editData.technician.employee_id,
                    first_name: editData.technician.first_name,
                    last_name: editData.technician.last_name,
                    full_name: `${editData.technician.first_name} ${editData.technician.last_name}`,
                    email: editData.technician.email || '',
                }));
            }

            // Set equipment data - more comprehensive approach
            dispatch(updateEquipment({
                plant: editData.plant_id || editData.equipment?.plant_id || '',
                department: editData.department_id || editData.equipment?.department_id || '',
                location: editData.location?.location_id || '',
                location_name: editData.location?.location_name || '',
                description: editData.description || '',
                serialNumber: editData.serial_number || editData.equipment?.serial_number || '',
                recallNumber: editData.recall_number || '',
                model: editData.model || editData.equipment?.model || '',
                manufacturer: editData.manufacturer || editData.equipment?.manufacturer || '',
                processReqRangeStart: editData.process_req_range_start || editData.equipment?.process_req_range_start || '',
                processReqRangeEnd: editData.process_req_range_end || editData.equipment?.process_req_range_end || '',
                dueDate: editData.due_date ?
                    format(new Date(editData.due_date), 'yyyy-MM-dd') :
                    (editData.equipment?.next_calibration_due ?
                        format(new Date(editData.equipment.next_calibration_due), 'yyyy-MM-dd') : '')
            }));

            // Set employee data
            if (editData.employee_in) {
                dispatch(setScannedEmployee({
                    employee_id: editData.employee_in.employee_id,
                    first_name: editData.employee_in.first_name,
                    last_name: editData.employee_in.last_name,
                    full_name: `${editData.employee_in.first_name} ${editData.employee_in.last_name}`,
                    email: editData.employee_in.email || '',
                    department_id: editData.employee_in.department_id,
                    plant_id: editData.employee_in.plant_id,
                    department: editData.employee_in.department,
                    plant: editData.employee_in.plant,
                    role: editData.employee_in.role
                }));
            }

            // Set received by data if present
            if (editData.received_by) {
                dispatch(setReceivedBy({
                    employee_id: editData.received_by.employee_id,
                    first_name: editData.received_by.first_name,
                    last_name: editData.received_by.last_name,
                    full_name: `${editData.received_by.first_name} ${editData.received_by.last_name}`,
                    email: editData.received_by.email || '',
                }));
            }

            // Mark form as clean since we're loading existing data
            dispatch(markFormClean());

            // Set current step (optional - depends on your UX)
            dispatch(setCurrentStep('technician'));
        }
    }, [isEditMode, editData, dispatch]);

    // Render current step content
    const renderStepContent = () => {
        // Merge server and client errors
        const mergedErrors = { ...serverErrors, ...clientErrors };

        switch (currentStep) {
            case 'technician':
                return (
                    <TechnicianTab
                        data={technician}
                        onChange={(data) => dispatch(setTechnician(data))}
                        errors={mergedErrors}
                    />
                );

            case 'details':
                return (
                    <DetailTab
                        data={equipment}
                        onChange={(data) => dispatch(updateEquipment(data))}
                        onScannedEmployeeChange={(employee) => dispatch(setScannedEmployee(employee))}
                        onReceivedByChange={(user) => dispatch(setReceivedBy(user))}
                        errors={mergedErrors}
                        technician={technician}
                        receivedBy={receivedBy}
                        hideReceivedBy={true}
                    />
                );

            case 'summary':
                return (
                    <EmployeeSummaryTab
                        data={{
                            technician,
                            equipment,
                            calibration,
                            scannedEmployee,
                            receivedBy
                        }}
                        errors={mergedErrors}
                    />
                );

            default:
                return null;
        }
    };

    const currentStepIndex = steps.findIndex(step => step.id === currentStep);
    const isLastStep = currentStepIndex === steps.length - 1;

    // Return null if user doesn't have permission
    if (!canSubmitCalibrationRequest()) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={edit ? 'Edit Tracking Request' : 'New Tracking Request'} />

            <div className="container mx-auto py-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {edit ? 'Edit Tracking Request' : 'New Tracking Request'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {edit
                            ? 'Modify your equipment calibration request details.'
                            : 'Submit a new equipment calibration request.'
                        }
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="mb-8">
                    <StepIndicator
                        steps={steps}
                        currentStep={currentStep}
                        completedSteps={completedSteps}
                    />
                </div>

                {/* Validation Message */}
                {validationMessage && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {validationMessage}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Main Content */}
                <Card>
                    <CardContent className="p-6">
                        {renderStepContent()}
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStepIndex === 0}
                    >
                        Back
                    </Button>

                    <div className="space-x-3">
                        {!isLastStep ? (
                            <Button onClick={handleNext}>
                                Next
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit}>
                                {edit ? 'Update Request' : 'Submit Request'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main component with Redux provider
export default function EmployeeTrackingRequestIndex(props: EmployeeTrackingRequestIndexProps) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <EmployeeTrackingRequestContent {...props} />
            </PersistGate>
        </Provider>
    );
}