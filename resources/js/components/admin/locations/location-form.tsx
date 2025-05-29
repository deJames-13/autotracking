import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InertiaSmartSelect, SelectOption } from '@/components/ui/smart-select';
import { type Department, type Location } from '@/types';
import { locationSchema, LocationSchema } from '@/validation/location-schema';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface LocationFormProps {
    location?: Location;
    departments: Department[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function LocationForm({ location, departments, onSuccess, onCancel }: LocationFormProps) {
    const isEditing = !!location;
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Memoize the form data to prevent unnecessary rerenders
    const initialData = useMemo(() => ({
        location_name: location?.location_name || '',
        department_id: location?.department_id?.toString() || '',
    }), [location]);

    const { data, setData, post, put, processing, errors, reset } = useForm<LocationSchema>(initialData);

    // Get initial department information for the select
    const initialDepartment = useMemo(() => {
        if (!location?.department_id) return null;

        // If we have the full department object (from the API/server)
        if (location.department) {
            return {
                value: location.department_id.toString(),
                label: location.department.department_name
            };
        }

        // Try to find the department in the provided departments list
        const dept = departments.find(d => d.department_id === location.department_id);
        if (dept) {
            return {
                value: dept.department_id.toString(),
                label: dept.department_name
            };
        }

        return null;
    }, [location, departments]);

    // Optimize loadDepartmentOptions - no state changes during typing
    const loadDepartmentOptions = useCallback(async (inputValue: string): Promise<SelectOption[]> => {
        // The component will already filter out short searches
        try {
            const response = await axios.get(route('admin.departments.search-departments'), {
                params: { search: inputValue }
            });
            return response.data;
        } catch (error) {
            console.error('Error loading departments:', error);
            return [];
        }
    }, []);

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

    const validateForm = (): boolean => {
        try {
            // Validate the form data using the Zod schema
            locationSchema.parse(data);
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

        const options = {
            onSuccess: () => {
                console.log('LocationForm: Operation successful, calling onSuccess');
                toast.success(isEditing ? 'Location updated successfully' : 'Location created successfully');
                reset();
                onSuccess?.();
            },
            onError: (errors: any) => {
                console.error('LocationForm: Operation failed:', errors);
                toast.error('Failed to save location. Please check the form and try again.');
            },
            preserveScroll: true,
        };

        if (isEditing) {
            put(route('admin.locations.update', location.location_id), options);
        } else {
            post(route('admin.locations.store'), options);
        }
    };

    // Combine server-side errors with client-side validation errors
    const allErrors = { ...errors, ...validationErrors };

    // Add a specialized handler for department changes
    const handleDepartmentChange = (value: string | number | null) => {
        if (value === null) {
            setData('department_id', '');
        } else {
            // Just update the ID in the form
            setData('department_id', value.toString());
        }
    };

    // Make sure we're initializing the department with both label and value
    useEffect(() => {
        // When we have a location with a department ID, make sure to initialize it with proper label
        if (location?.department_id && location?.department) {
            // If we have a department object with the name, add it to the label cache
            if (typeof window !== 'undefined' && (window as any).optionCache) {
                const optionCache = (window as any).optionCache;
                optionCache.set(
                    String(location.department_id),
                    location.department.department_name
                );
            }
        }
    }, [location]);

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="location_name" className={allErrors.location_name ? 'text-destructive' : ''}>
                    Location Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="location_name"
                    value={data.location_name}
                    onChange={(e) => setData('location_name', e.target.value)}
                    className={allErrors.location_name ? 'border-destructive' : ''}
                    placeholder="Enter location name"
                />
                <InputError message={allErrors.location_name} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="department_id" className={allErrors.department_id ? 'text-destructive' : ''}>
                    Department <span className="text-destructive">*</span>
                </Label>
                <InertiaSmartSelect
                    name="department_id"
                    value={data.department_id}
                    onChange={handleDepartmentChange}
                    loadOptions={loadDepartmentOptions}
                    onCreateOption={createDepartmentOption}
                    placeholder="Select or create department"
                    error={allErrors.department_id}
                    noNoneOption={true}
                    loading={loadingDepartments}
                    className={allErrors.department_id ? 'border-destructive' : ''}
                    cacheOptions={true}
                    defaultOptions={true}
                />
            </div>

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : isEditing ? 'Update Location' : 'Create Location'}
                </Button>
            </div>
        </form>
    );
}
