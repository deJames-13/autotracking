import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import TechnicianLayout from '@/layouts/technician-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

// Import step components
import EmployeeTab from '@/components/technician/tracking/request/employee-tab';
import EquipmentTab from '@/components/technician/tracking/request/equipment-tab';
import ConfirmationTab from '@/components/technician/tracking/request/confirmation-tab';

interface Employee {
    employee_id: string;
    first_name: string;
    last_name: string;
    employee_number: string;
    department?: {
        department_name: string;
    };
    plant?: {
        plant_name: string;
    };
    role?: {
        role_name: string;
    };
}

interface User {
    id: number;
    name: string;
    email: string;
    employee_id?: string;
    role?: {
        role_name: string;
    };
}

interface TechnicianRequestIndexProps {
    user: User;
    employees?: Employee[];
    isEditMode?: boolean;
    editData?: any;
}

interface FormData {
    employee: Employee | null;
    request_type: 'new' | 'routine' | '';
    equipment_name: string;
    equipment_description: string;
    model_number: string;
    serial_number: string;
    manufacturer: string;
    recall_number: string;
    qr_code?: string;
    comments: string;
}

interface ValidationErrors {
    [key: string]: string[];
}

type Step = 'employee' | 'equipment' | 'confirmation';

const TechnicianRequestContent: React.FC<TechnicianRequestIndexProps> = ({
    user,
    employees = [],
    isEditMode = false,
    editData = null
}) => {
    const [currentStep, setCurrentStep] = useState<Step>('employee');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const [formData, setFormData] = useState<FormData>(() => {
        if (isEditMode && editData) {
            return {
                employee: editData.employee || null,
                request_type: editData.request_type || '',
                equipment_name: editData.equipment_name || '',
                equipment_description: editData.equipment_description || '',
                model_number: editData.model_number || '',
                serial_number: editData.serial_number || '',
                manufacturer: editData.manufacturer || '',
                recall_number: editData.recall_number || '',
                qr_code: editData.qr_code || '',
                comments: editData.comments || ''
            };
        }
        return {
            employee: null,
            request_type: '',
            equipment_name: '',
            equipment_description: '',
            model_number: '',
            serial_number: '',
            manufacturer: '',
            recall_number: '',
            qr_code: '',
            comments: ''
        };
    });

    const handleDataChange = (key: keyof FormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));

        // Clear validation errors for this field
        if (validationErrors[key]) {
            setValidationErrors(prev => ({
                ...prev,
                [key]: []
            }));
        }
    };

    // Helper function to flatten validation errors
    const flattenErrors = (errors: ValidationErrors): Record<string, string> => {
        const flattened: Record<string, string> = {};
        Object.keys(errors).forEach(key => {
            if (Array.isArray(errors[key]) && errors[key].length > 0) {
                flattened[key] = errors[key][0];
            } else if (typeof errors[key] === 'string') {
                flattened[key] = errors[key] as string;
            }
        });
        return flattened;
    };

    const validateStep = (step: Step): boolean => {
        const errors: ValidationErrors = {};

        switch (step) {
            case 'employee':
                if (!formData.employee) {
                    errors.employee = ['Please select an employee'];
                }
                break;

            case 'equipment':
                if (!formData.request_type) {
                    errors.request_type = ['Please select a request type'];
                }
                if (!formData.equipment_name.trim()) {
                    errors.equipment_name = ['Equipment name is required'];
                }
                if (!formData.equipment_description.trim()) {
                    errors.equipment_description = ['Equipment description is required'];
                }
                if (formData.request_type === 'new') {
                    if (!formData.serial_number.trim()) {
                        errors.serial_number = ['Serial number is required for new equipment'];
                    }
                }
                if (formData.request_type === 'routine') {
                    if (!formData.recall_number.trim()) {
                        errors.recall_number = ['Recall number is required for routine requests'];
                    }
                }
                break;

            case 'confirmation':
                // All validation should be done in previous steps
                break;
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const steps: { key: Step; label: string; description: string }[] = [
        { key: 'employee', label: 'Employee', description: 'Select employee' },
        { key: 'equipment', label: 'Equipment', description: 'Equipment details' },
        { key: 'confirmation', label: 'Review', description: 'Confirm request' }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === currentStep);

    const canProceedToNext = (): boolean => {
        switch (currentStep) {
            case 'employee':
                return !!formData.employee;
            case 'equipment':
                return !!(formData.request_type && formData.equipment_name && formData.equipment_description &&
                    (formData.request_type === 'new' ? formData.serial_number : true) &&
                    (formData.request_type === 'routine' ? formData.recall_number : true));
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep) && canProceedToNext()) {
            const nextStepIndex = currentStepIndex + 1;
            if (nextStepIndex < steps.length) {
                setCurrentStep(steps[nextStepIndex].key);
            }
        }
    };

    const handlePrevious = () => {
        const prevStepIndex = currentStepIndex - 1;
        if (prevStepIndex >= 0) {
            setCurrentStep(steps[prevStepIndex].key);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep('confirmation')) {
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = {
                employee_id: formData.employee?.employee_id,
                request_type: formData.request_type,
                equipment_name: formData.equipment_name,
                equipment_description: formData.equipment_description,
                model_number: formData.model_number,
                serial_number: formData.serial_number,
                manufacturer: formData.manufacturer,
                recall_number: formData.recall_number,
                qr_code: formData.qr_code,
                comments: formData.comments
            };

            const endpoint = isEditMode && editData
                ? `/technician/tracking/api/incoming/${editData.id}`
                : '/technician/tracking/api/incoming';

            const method = isEditMode ? 'put' : 'post';

            router[method](endpoint, submitData, {
                onSuccess: () => {
                    toast.success(isEditMode ? 'Request updated successfully!' : 'Request submitted successfully!');
                    router.visit('/technician/tracking');
                },
                onError: (errors) => {
                    console.error('Submission errors:', errors);
                    setValidationErrors(errors);
                    toast.error('Please check the form for errors');
                }
            });
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('An error occurred while submitting the request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStepStatus = (stepKey: Step): 'completed' | 'current' | 'disabled' => {
        const stepIndex = steps.findIndex(step => step.key === stepKey);
        const currentIndex = steps.findIndex(step => step.key === currentStep);

        if (stepIndex < currentIndex) {
            return 'completed';
        } else if (stepIndex === currentIndex) {
            return 'current';
        } else {
            return 'disabled';
        }
    };

    return (
        <TechnicianLayout>
            <Head title={isEditMode ? "Edit Tracking Request" : "New Tracking Request"} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isEditMode ? 'Edit Tracking Request' : 'New Tracking Request'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isEditMode ? 'Update equipment tracking information' : 'Submit a new equipment tracking request'}
                        </p>
                    </div>
                    {isEditMode && editData && (
                        <Badge variant="outline">
                            Recall: {editData.recall_number}
                        </Badge>
                    )}
                </div>

                {/* Progress Steps */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-8">
                            {steps.map((step, index) => {
                                const status = getStepStatus(step.key);
                                return (
                                    <div key={step.key} className="flex items-center">
                                        <div className="flex flex-col items-center">
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center font-medium
                                                ${status === 'completed' ? 'bg-green-500 text-white' :
                                                    status === 'current' ? 'bg-blue-500 text-white' :
                                                        'bg-gray-200 text-gray-500'}
                                            `}>
                                                {status === 'completed' ? '✓' : index + 1}
                                            </div>
                                            <div className="mt-2 text-center">
                                                <div className={`font-medium ${status === 'current' ? 'text-blue-600' : 'text-gray-500'}`}>
                                                    {step.label}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {step.description}
                                                </div>
                                            </div>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`
                                                flex-1 h-px mx-4 
                                                ${status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}
                                            `} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Step Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>{steps.find(s => s.key === currentStep)?.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentStep === 'employee' && (
                            <EmployeeTab
                                data={{
                                    technician: user,
                                    employee: formData.employee,
                                    equipment: null,
                                    calibration: null
                                }}
                                onChange={handleDataChange}
                                errors={flattenErrors(validationErrors)}
                            />
                        )}

                        {currentStep === 'equipment' && (
                            <EquipmentTab
                                data={{
                                    technician: user,
                                    employee: formData.employee,
                                    equipment: {
                                        description: formData.equipment_description,
                                        serialNumber: formData.serial_number,
                                        recallNumber: formData.recall_number,
                                        model: formData.model_number,
                                        manufacturer: formData.manufacturer
                                    },
                                    calibration: null
                                }}
                                onChange={handleDataChange}
                                errors={flattenErrors(validationErrors)}
                                requestType={(formData.request_type || 'new') as 'new' | 'routine'}
                            />
                        )}

                        {currentStep === 'confirmation' && (
                            <ConfirmationTab
                                data={{
                                    technician: user,
                                    employee: formData.employee,
                                    equipment: {
                                        description: formData.equipment_description,
                                        serialNumber: formData.serial_number,
                                        recallNumber: formData.recall_number,
                                        model: formData.model_number,
                                        manufacturer: formData.manufacturer
                                    },
                                    calibration: null
                                }}
                                onChange={handleDataChange}
                                errors={flattenErrors(validationErrors)}
                                requestType={formData.request_type as 'new' | 'routine'}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Navigation */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={handlePrevious}
                                disabled={currentStepIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>

                            <div className="flex gap-2">
                                {currentStep === 'confirmation' ? (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="min-w-[120px]"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                {isEditMode ? 'Updating...' : 'Submitting...'}
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                {isEditMode ? 'Update Request' : 'Submit Request'}
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleNext}
                                        disabled={!canProceedToNext()}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TechnicianLayout>
    );
};

// Main component wrapped with providers
const TechnicianRequestIndex: React.FC<TechnicianRequestIndexProps> = (props) => {
    return <TechnicianRequestContent {...props} />;
};

export default TechnicianRequestIndex;
