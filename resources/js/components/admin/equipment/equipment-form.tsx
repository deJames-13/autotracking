import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DepartmentModalSelect, LocationModalSelect, PlantModalSelect, UserModalSelect } from '@/components/ui/modal-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type Department, type Equipment, type Location, type Plant, type User } from '@/types';
import { equipmentFormSchema } from '@/validation/equipment-schema';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useState } from 'react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

interface EquipmentFormData {
    employee_id: string;
    recall_number: string;
    serial_number: string;
    description: string;
    model: string;
    manufacturer: string;
    plant_id: string;
    department_id: string;
    location_id: string;
    status: string;
    last_calibration_date: string;
    next_calibration_due: string;
    process_req_range_start: string;
    process_req_range_end: string;
    process_req_range: string; // New combined field
    [key: string]: any;
}

interface EquipmentFormProps {
    equipment?: Equipment;
    users: User[];
    plants?: Plant[];
    departments?: Department[];
    locations?: Location[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function EquipmentForm({ equipment, users, plants = [], departments = [], locations = [], onSuccess, onCancel }: EquipmentFormProps) {
    const isEditing = !!equipment;
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const getCombinedProcessRange = (equipment?: Equipment): string => {
        // Priority 1: Use new combined field if available
        if ((equipment as any)?.process_req_range) {
            return (equipment as any).process_req_range;
        }

        // Priority 2: Combine old fields if they exist
        const start = equipment?.process_req_range_start;
        const end = equipment?.process_req_range_end;

        if (start && end) {
            return `${start} - ${end}`;
        } else if (start) {
            return start;
        } else if (end) {
            return end;
        }

        return '';
    };

    // Helper function to format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateString?: string | null): string => {
        if (!dateString) return '';

        try {
            // If it's already in YYYY-MM-DD format, return as is
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString;
            }

            // Handle MM/DD/YYYY format (common in some locales)
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                const [month, day, year] = dateString.split('/');
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }

            // Try to parse various date formats using Date constructor
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn('Invalid date format:', dateString);
                return '';
            }

            // Format as YYYY-MM-DD for HTML date input
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.warn('Error formatting date:', dateString, error);
            return '';
        }
    };

    const { data, setData, post, put, processing, errors, reset } = useForm<EquipmentFormData>({
        employee_id: equipment?.employee_id?.toString() || '',
        recall_number: equipment?.recall_number || '',
        serial_number: equipment?.serial_number || '',
        description: equipment?.description || '',
        model: equipment?.model || '',
        manufacturer: equipment?.manufacturer || '',
        plant_id: equipment?.plant_id?.toString() || '',
        department_id: equipment?.department_id?.toString() || '',
        location_id: equipment?.location_id?.toString() || '',
        status: equipment?.status || 'active',
        last_calibration_date: formatDateForInput(equipment?.last_calibration_date),
        next_calibration_due: formatDateForInput(equipment?.next_calibration_due),
        process_req_range_start: equipment?.process_req_range_start || '',
        process_req_range_end: equipment?.process_req_range_end || '',
        process_req_range: getCombinedProcessRange(equipment),
    });

    // Client-side validation function
    const validateData = (formData: EquipmentFormData): boolean => {
        try {
            equipmentFormSchema.parse(formData);
            setClientErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path.length > 0) {
                        newErrors[err.path[0] as string] = err.message;
                    }
                });
                setClientErrors(newErrors);
            }
            return false;
        }
    };

    // Get combined errors (client + server)
    const getCombinedErrors = (field: string): string => {
        return clientErrors[field] || errors[field] || '';
    };

    // Handle changes for smart selects
    const handleSmartSelectChange = (field: keyof EquipmentFormData, value: string | number | null) => {
        const newValue = value === null ? '' : String(value);
        // Only update if the value has actually changed
        if (data[field] !== newValue) {
            setData(field, newValue);
        }
    };

    // Handle user selection
    const handleUserChange = (value: string | number | null) => {
        const newValue = value === null ? '' : String(value);
        // Only update if the value has actually changed
        if (data.employee_id !== newValue) {
            setData('employee_id', newValue);
        }
    };

    // Handle regular select changes
    const handleSelectChange = (field: keyof EquipmentFormData, value: string | number | null) => {
        const newValue = value === null ? '' : String(value);
        // Only update if the value has actually changed
        if (data[field] !== newValue) {
            setData(field, newValue);
        }
    };

    // Handle date input changes with validation
    const handleDateChange = (field: 'last_calibration_date' | 'next_calibration_due', value: string) => {
        // Only allow YYYY-MM-DD format
        if (value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            setData(field, value);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Clear previous client errors
        setClientErrors({});

        // Client-side validation
        if (!validateData(data)) {
            return;
        }

        const submitData = {
            ...data,
            employee_id: data.employee_id || null,
            plant_id: data.plant_id || null,
            department_id: data.department_id || null,
            location_id: data.location_id || null,
        };

        const options = {
            onSuccess: () => {
                console.log('EquipmentForm: Operation successful, calling onSuccess');
                reset();
                setClientErrors({});
                onSuccess?.();
            },
            onError: (errors: any) => {
                console.error('EquipmentForm: Operation failed:', errors);
                // Server errors will be handled by Inertia
            },
            preserveScroll: true,
        };

        if (isEditing) {
            put(route('admin.equipment.update', equipment.equipment_id), options);
        } else {
            post(route('admin.equipment.store'), options);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6" key={`equipment-form-${equipment?.equipment_id || 'new'}`}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left column */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="recall_number">Recall Number *</Label>
                        <Input
                            id="recall_number"
                            value={data.recall_number}
                            onChange={(e) => setData('recall_number', e.target.value)}
                            required
                            placeholder="Enter recall number"
                            className={getCombinedErrors('recall_number') ? 'border-destructive' : ''}
                            autoFocus={false}
                        />
                        <InputError message={getCombinedErrors('recall_number')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serial_number">Serial Number</Label>
                        <Input
                            id="serial_number"
                            value={data.serial_number}
                            onChange={(e) => setData('serial_number', e.target.value)}
                            placeholder="Enter serial number (optional)"
                            className={getCombinedErrors('serial_number') ? 'border-destructive' : ''}
                        />
                        <InputError message={getCombinedErrors('serial_number')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            required
                            placeholder="Enter equipment description"
                            rows={3}
                            className={getCombinedErrors('description') ? 'border-destructive' : ''}
                        />
                        <InputError message={getCombinedErrors('description')} />
                    </div>

                    <PlantModalSelect
                        name="plant_id"
                        value={data.plant_id || null}
                        onChange={(value) => handleSmartSelectChange('plant_id', value)}
                        label="Plant"
                        placeholder="Search for a plant or create new"
                        error={errors.plant_id}
                        currentLabel={equipment?.plant?.plant_name}
                    />

                    <DepartmentModalSelect
                        name="department_id"
                        value={data.department_id || null}
                        onChange={(value) => handleSmartSelectChange('department_id', value)}
                        label="Department"
                        placeholder="Search for a department or create new"
                        error={errors.department_id}
                        currentLabel={equipment?.department?.department_name}
                    />
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input id="model" value={data.model} onChange={(e) => setData('model', e.target.value)} placeholder="Enter model name" />
                        <InputError message={errors.model} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        <Input
                            id="manufacturer"
                            value={data.manufacturer}
                            onChange={(e) => setData('manufacturer', e.target.value)}
                            placeholder="Enter manufacturer name"
                        />
                        <InputError message={errors.manufacturer} />
                    </div>

                    <LocationModalSelect
                        name="location_id"
                        value={data.location_id || null}
                        onChange={(value) => handleSmartSelectChange('location_id', value)}
                        label="Location"
                        placeholder="Search for a location or create new"
                        error={errors.location_id}
                        currentLabel={equipment?.location?.location_name}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={data.status}
                            onValueChange={(value) => handleSelectChange('status', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending_calibration">Pending Calibration</SelectItem>
                                <SelectItem value="in_calibration">In Calibration</SelectItem>
                                <SelectItem value="retired">Retired</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="last_calibration_date">Last Calibration Date</Label>
                        <Input
                            id="last_calibration_date"
                            type="date"
                            value={data.last_calibration_date}
                            onChange={(e) => handleDateChange('last_calibration_date', e.target.value)}
                            className={getCombinedErrors('last_calibration_date') ? 'border-destructive' : ''}
                        />
                        <InputError message={getCombinedErrors('last_calibration_date')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="next_calibration_due">Next Calibration Due</Label>
                        <Input
                            id="next_calibration_due"
                            type="date"
                            value={data.next_calibration_due}
                            onChange={(e) => handleDateChange('next_calibration_due', e.target.value)}
                            className={getCombinedErrors('next_calibration_due') ? 'border-destructive' : ''}
                        />
                        <InputError message={getCombinedErrors('next_calibration_due')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="process_req_range">Process Requirement Range</Label>
                        <Input
                            id="process_req_range"
                            value={data.process_req_range}
                            onChange={(e) => {
                                const value = e.target.value;
                                setData('process_req_range', value);

                                // Parse and update old fields for backward compatibility
                                const rangeMatch = value.match(/^([^-\s]+)\s*(?:-|to)\s*([^-\s]+)$/i);
                                if (rangeMatch) {
                                    setData('process_req_range_start', rangeMatch[1].trim());
                                    setData('process_req_range_end', rangeMatch[2].trim());
                                } else if (value.trim()) {
                                    setData('process_req_range_start', value.trim());
                                    setData('process_req_range_end', '');
                                } else {
                                    setData('process_req_range_start', '');
                                    setData('process_req_range_end', '');
                                }
                            }}
                            placeholder="Enter range (e.g., 100 - 200, 50 to 100, 75)"
                            className={getCombinedErrors('process_req_range') ? 'border-destructive' : ''}
                        />
                        <InputError message={getCombinedErrors('process_req_range')} />
                        <p className="text-sm text-muted-foreground">
                            You can enter a single value (e.g., "100") or a range (e.g., "100 - 200", "50 to 100")
                        </p>
                    </div>

                    <UserModalSelect
                        name="employee_id"
                        value={data.employee_id || null}
                        onChange={handleUserChange}
                        label="Assigned User"
                        placeholder="Search for a user"
                        error={errors.employee_id}
                        currentLabel={equipment?.user ? `${equipment.user.first_name} ${equipment.user.last_name} (${equipment.user.employee_id})` : undefined}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : isEditing ? 'Update Equipment' : 'Create Equipment'}
                </Button>
            </div>
        </form>
    );
}
