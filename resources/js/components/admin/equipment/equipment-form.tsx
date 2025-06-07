import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InertiaSmartSelect, SelectOption } from '@/components/ui/smart-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Equipment, type User, type Plant, type Department, type Location } from '@/types';
import { equipmentFormSchema, type EquipmentFormSchema } from '@/validation/equipment-schema';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useCallback, useState } from 'react';
import { z } from 'zod';
import axios from 'axios';

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
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

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
        last_calibration_date: equipment?.last_calibration_date || '',
        next_calibration_due: equipment?.next_calibration_due || '',
        process_req_range_start: equipment?.process_req_range_start || '',
        process_req_range_end: equipment?.process_req_range_end || '',
    });

    // Load user options for SmartSelect
    const loadUserOptions = useCallback(async (inputValue: string): Promise<SelectOption[]> => {
        try {
            setLoadingUsers(true);
            // Filter users based on input value
            const filteredUsers = users.filter(user =>
                (user.full_name || `${user.first_name} ${user.last_name}`).toLowerCase().includes(inputValue.toLowerCase()) ||
                user.employee_id.toString().includes(inputValue)
            ).map(user => ({
                label: `${user.full_name || `${user.first_name} ${user.last_name}`} (${user.employee_id})`,
                value: user.employee_id.toString()
            }));
            return filteredUsers;
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        } finally {
            setLoadingUsers(false);
        }
    }, [users]);

    // Load plant options for SmartSelect
    const loadPlantOptions = useCallback(async (inputValue: string): Promise<SelectOption[]> => {
        try {
            const response = await axios.get('/admin/plants/search', {
                params: {
                    search: inputValue,
                    limit: 10
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            return response.data.data.map((plant: Plant) => ({
                label: plant.plant_name,
                value: plant.plant_id.toString()
            }));
        } catch (error) {
            console.error('Error loading plants:', error);
            return plants.map(plant => ({
                label: plant.plant_name,
                value: plant.plant_id.toString()
            }));
        }
    }, [plants]);

    // Load department options for SmartSelect
    const loadDepartmentOptions = useCallback(async (inputValue: string): Promise<SelectOption[]> => {
        try {
            const response = await axios.get('/admin/departments/search', {
                params: {
                    search: inputValue,
                    limit: 10
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            return response.data.data.map((department: Department) => ({
                label: department.department_name,
                value: department.department_id.toString()
            }));
        } catch (error) {
            console.error('Error loading departments:', error);
            return departments.map(dept => ({
                label: dept.department_name,
                value: dept.department_id.toString()
            }));
        }
    }, [departments]);

    // Load location options for SmartSelect
    const loadLocationOptions = useCallback(async (inputValue: string): Promise<SelectOption[]> => {
        try {
            const response = await axios.get('/admin/locations/search', {
                params: {
                    search: inputValue,
                    department_id: data.department_id || undefined,
                    limit: 10
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            return response.data.data.map((location: Location) => ({
                label: `${location.location_name}${location.department ? ` (${location.department.department_name})` : ''}`,
                value: location.location_id.toString()
            }));
        } catch (error) {
            console.error('Error loading locations:', error);
            return locations.map(location => ({
                label: `${location.location_name}${location.department ? ` (${location.department.department_name})` : ''}`,
                value: location.location_id.toString()
            }));
        }
    }, [locations, data.department_id]);

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
        setData(field, value ? value.toString() : '');
    };

    // Handle user selection
    const handleUserChange = (value: string | number | null) => {
        setData('employee_id', value ? value.toString() : '');
    };

    // Handle regular select changes
    const handleSelectChange = (field: keyof EquipmentFormData, value: string | number | null) => {
        setData(field, value ? value.toString() : '');
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
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                    <div className="space-y-2">
                        <Label htmlFor="plant_id">Plant</Label>
                        <InertiaSmartSelect
                            name="plant_id"
                            value={data.plant_id || null}
                            onChange={(value) => handleSmartSelectChange('plant_id', value)}
                            loadOptions={loadPlantOptions}
                            placeholder="Search for a plant"
                            error={errors.plant_id}
                            customNoneLabel="No plant"
                            cacheOptions={true}
                            defaultOptions={true}
                            minSearchLength={0}
                        />
                        <InputError message={errors.plant_id} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="department_id">Department</Label>
                        <InertiaSmartSelect
                            name="department_id"
                            value={data.department_id || null}
                            onChange={(value) => handleSmartSelectChange('department_id', value)}
                            loadOptions={loadDepartmentOptions}
                            placeholder="Search for a department"
                            error={errors.department_id}
                            customNoneLabel="No department"
                            cacheOptions={true}
                            defaultOptions={true}
                            minSearchLength={0}
                        />
                        <InputError message={errors.department_id} />
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input
                            id="model"
                            value={data.model}
                            onChange={(e) => setData('model', e.target.value)}
                            placeholder="Enter model name"
                        />
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

                    <div className="space-y-2">
                        <Label htmlFor="location_id">Location</Label>
                        <InertiaSmartSelect
                            name="location_id"
                            value={data.location_id || null}
                            onChange={(value) => handleSmartSelectChange('location_id', value)}
                            loadOptions={loadLocationOptions}
                            placeholder="Search for a location"
                            error={errors.location_id}
                            customNoneLabel="No location"
                            cacheOptions={true}
                            defaultOptions={true}
                            minSearchLength={0}
                        />
                        <InputError message={errors.location_id} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={data.status} onValueChange={(value) => handleSelectChange('status', value)}>
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
                            onChange={(e) => setData('last_calibration_date', e.target.value)}
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
                            onChange={(e) => setData('next_calibration_due', e.target.value)}
                            className={getCombinedErrors('next_calibration_due') ? 'border-destructive' : ''}
                        />
                        <InputError message={getCombinedErrors('next_calibration_due')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="process_req_range_start">Process Req Range Start</Label>
                        <Input
                            id="process_req_range_start"
                            value={data.process_req_range_start}
                            onChange={(e) => setData('process_req_range_start', e.target.value)}
                            placeholder="Enter process requirement range start"
                            className={getCombinedErrors('process_req_range_start') ? 'border-destructive' : ''}
                        />
                        <InputError message={getCombinedErrors('process_req_range_start')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="process_req_range_end">Process Req Range End</Label>
                        <Input
                            id="process_req_range_end"
                            value={data.process_req_range_end}
                            onChange={(e) => setData('process_req_range_end', e.target.value)}
                            placeholder="Enter process requirement range end"
                            className={getCombinedErrors('process_req_range_end') ? 'border-destructive' : ''}
                        />
                        <InputError message={getCombinedErrors('process_req_range_end')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="employee_id">Assigned User</Label>
                        <InertiaSmartSelect
                            name="employee_id"
                            value={data.employee_id || null}
                            onChange={handleUserChange}
                            loadOptions={loadUserOptions}
                            placeholder="Search for a user"
                            error={errors.employee_id}
                            loading={loadingUsers}
                            customNoneLabel="No assignment"
                            cacheOptions={true}
                            defaultOptions={true}
                            minSearchLength={0}
                        />
                        <InputError message={errors.employee_id} />
                    </div>
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
