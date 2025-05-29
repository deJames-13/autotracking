import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InertiaSmartSelect, SelectOption } from '@/components/ui/smart-select';
import { type Department, type Plant, type Role, type User, type UserFormData } from '@/types';
import { userSchema, UserSchema } from '@/validation/user-schema';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useCallback, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

interface UserFormProps {
    user?: User;
    roles: Role[];
    departments: Department[];
    plants: Plant[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function UserForm({ user, roles, departments, plants, onSuccess, onCancel }: UserFormProps) {
    const isEditing = !!user;
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingPlants, setLoadingPlants] = useState(false);

    // Memoize the initial form data to prevent unnecessary rerenders
    const initialData = useMemo(() => ({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        middle_name: user?.middle_name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
        role_id: user?.role_id || roles[0]?.role_id || 1,
        department_id: user?.department_id || null,
        plant_id: user?.plant_id || null,
        avatar: user?.avatar || '',
    }), [user, roles]);

    const { data, setData, post, put, processing, errors, reset } = useForm<UserSchema>(initialData);

    // Load department options for SmartSelect
    const loadDepartmentOptions = useCallback(async (inputValue: string): Promise<SelectOption[]> => {
        try {
            setLoadingDepartments(true);
            // In a real app, this would be an API call to search departments
            const filteredDepartments = departments.filter(dept =>
                dept.department_name.toLowerCase().includes(inputValue.toLowerCase())
            ).map(dept => ({
                label: dept.department_name,
                value: dept.department_id
            }));
            return filteredDepartments;
        } catch (error) {
            console.error('Error loading departments:', error);
            return [];
        } finally {
            setLoadingDepartments(false);
        }
    }, [departments]);

    // Create department option - similar to location form
    const createDepartmentOption = useCallback(async (inputValue: string): Promise<SelectOption> => {
        try {
            const response = await axios.post(route('admin.departments.create-department'), {
                name: inputValue
            });
            toast.success(`Department "${inputValue}" created successfully`);
            return response.data;
        } catch (error: any) {
            console.error('Error creating department:', error);

            // Show specific error message if available
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to create department. Please try again.');
            }

            throw new Error('Failed to create department');
        }
    }, []);

    // Load plant options for SmartSelect
    const loadPlantOptions = useCallback(async (inputValue: string): Promise<SelectOption[]> => {
        try {
            setLoadingPlants(true);
            // In a real app, this would be an API call to search plants
            const filteredPlants = plants.filter(plant =>
                plant.plant_name.toLowerCase().includes(inputValue.toLowerCase())
            ).map(plant => ({
                label: plant.plant_name,
                value: plant.plant_id
            }));
            return filteredPlants;
        } catch (error) {
            console.error('Error loading plants:', error);
            return [];
        } finally {
            setLoadingPlants(false);
        }
    }, [plants]);
    
    // Create plant option
    const createPlantOption = useCallback(async (inputValue: string): Promise<SelectOption> => {
        try {
            const response = await axios.post(route('admin.plants.create-plant'), {
                name: inputValue
            });
            toast.success(`Plant "${inputValue}" created successfully`);
            return response.data;
        } catch (error: any) {
            console.error('Error creating plant:', error);

            // Show specific error message if available
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to create plant. Please try again.');
            }

            throw new Error('Failed to create plant');
        }
    }, []);

    // Validate form using Zod
    const validateForm = (): boolean => {
        try {
            // For editing users, if no password is provided, we create a temporary object 
            // without password fields to validate the rest of the form
            let dataToValidate = data;
            if (isEditing && !data.password) {
                const { password, password_confirmation, ...rest } = data;
                dataToValidate = rest as UserSchema;
            }

            // Validate the form data using the Zod schema
            userSchema.parse(dataToValidate);
            setValidationErrors({});
            return true;
        } catch (error: any) {
            // Extract and format Zod validation errors
            const formattedErrors: Record<string, string> = {};
            if (error.errors) {
                error.errors.forEach((err: any) => {
                    const path = err.path.join('.');
                    formattedErrors[path] = err.message;
                });
            }
            setValidationErrors(formattedErrors);
            return false;
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            toast.error('Please correct the errors in the form');
            return;
        }

        const submitData = { ...data };

        // Remove password fields if not provided during edit
        if (isEditing && !submitData.password) {
            delete submitData.password;
            delete submitData.password_confirmation;
        }

        const options = {
            onSuccess: () => {
                console.log('UserForm: Operation successful, calling onSuccess');
                toast.success(isEditing ? 'User updated successfully' : 'User created successfully');
                reset();
                onSuccess?.();
            },
            onError: (errors: any) => {
                console.error('UserForm: Operation failed:', errors);
                toast.error('Failed to save user. Please check the form and try again.');
            },
            preserveScroll: true,
        };

        if (isEditing) {
            put(route('admin.users.update', user.employee_id), options);
        } else {
            post(route('admin.users.store'), options);
        }
    };

    // Combine server-side errors with client-side validation errors
    const allErrors = { ...errors, ...validationErrors };

    // Handle department selection
    const handleDepartmentChange = (value: string | number | null) => {
        setData('department_id', value);
    };

    // Handle plant selection
    const handlePlantChange = (value: string | number | null) => {
        setData('plant_id', value);
    };

    return (
        <form onSubmit={submit} className="space-y-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-6">
                    {/* Name fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name" className={allErrors.first_name ? 'text-destructive' : ''}>
                                First Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="first_name"
                                value={data.first_name}
                                onChange={(e) => setData('first_name', e.target.value)}
                                className={allErrors.first_name ? 'border-destructive' : ''}
                                placeholder="Enter first name"
                            />
                            <InputError message={allErrors.first_name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="last_name" className={allErrors.last_name ? 'text-destructive' : ''}>
                                Last Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="last_name"
                                value={data.last_name}
                                onChange={(e) => setData('last_name', e.target.value)}
                                className={allErrors.last_name ? 'border-destructive' : ''}
                                placeholder="Enter last name"
                            />
                            <InputError message={allErrors.last_name} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="middle_name" className={allErrors.middle_name ? 'text-destructive' : ''}>
                            Middle Name
                        </Label>
                        <Input
                            id="middle_name"
                            value={data.middle_name}
                            onChange={(e) => setData('middle_name', e.target.value)}
                            className={allErrors.middle_name ? 'border-destructive' : ''}
                            placeholder="Enter middle name (optional)"
                        />
                        <InputError message={allErrors.middle_name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className={allErrors.email ? 'text-destructive' : ''}>
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className={allErrors.email ? 'border-destructive' : ''}
                            placeholder="Enter email address (optional)"
                        />
                        <InputError message={allErrors.email} />
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Password fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className={allErrors.password ? 'text-destructive' : ''}>
                                Password {!isEditing && <span className="text-destructive">*</span>}
                                {isEditing && <span className="text-xs text-muted-foreground block">(leave blank to keep current)</span>}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className={allErrors.password ? 'border-destructive' : ''}
                                placeholder={isEditing ? "New password" : "Enter password"}
                            />
                            <InputError message={allErrors.password} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation" className={allErrors.password_confirmation ? 'text-destructive' : ''}>
                                Confirm Password {!isEditing && <span className="text-destructive">*</span>}
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className={allErrors.password_confirmation ? 'border-destructive' : ''}
                                placeholder="Confirm password"
                            />
                            <InputError message={allErrors.password_confirmation} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role_id" className={allErrors.role_id ? 'text-destructive' : ''}>
                            Role <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.role_id.toString()}
                            onValueChange={(value) => setData('role_id', parseInt(value))}
                        >
                            <SelectTrigger className={allErrors.role_id ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.role_id} value={role.role_id.toString()}>
                                        {role.role_name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={allErrors.role_id} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="department_id" className={allErrors.department_id ? 'text-destructive' : ''}>
                                Department
                            </Label>
                            <InertiaSmartSelect
                                name="department_id"
                                value={data.department_id}
                                onChange={handleDepartmentChange}
                                loadOptions={loadDepartmentOptions}
                                onCreateOption={createDepartmentOption}
                                placeholder="Select or create department"
                                error={allErrors.department_id}
                                loading={loadingDepartments}
                                className={allErrors.department_id ? 'border-destructive' : ''}
                                cacheOptions={true}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="plant_id" className={allErrors.plant_id ? 'text-destructive' : ''}>
                                Plant
                            </Label>
                            <InertiaSmartSelect
                                name="plant_id"
                                value={data.plant_id}
                                onChange={handlePlantChange}
                                loadOptions={loadPlantOptions}
                                onCreateOption={createPlantOption}
                                placeholder="Select or create plant"
                                error={allErrors.plant_id}
                                loading={loadingPlants}
                                className={allErrors.plant_id ? 'border-destructive' : ''}
                                cacheOptions={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
                </Button>
            </div>
        </form>
    );
}
