import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DepartmentModalSelect } from '@/components/ui/modal-select';
import { type Department, type Location } from '@/types';
import { locationSchema, LocationSchema } from '@/validation/location-schema';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

interface LocationFormProps {
    location?: Location;
    departments: Department[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function LocationForm({ location, departments, onSuccess, onCancel }: LocationFormProps) {
    const isEditing = !!location;
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Memoize the form data to prevent unnecessary rerenders
    const initialData = useMemo(
        () => ({
            location_name: location?.location_name || '',
            department_id: location?.department_id?.toString() || '',
        }),
        [location],
    );

    const { data, setData, post, put, processing, errors, reset } = useForm<LocationSchema>(initialData);

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

            <DepartmentModalSelect
                name="department_id"
                value={data.department_id}
                onChange={handleDepartmentChange}
                label="Department"
                placeholder="Select or create department"
                error={allErrors.department_id}
                noNoneOption={true}
                required={true}
                currentLabel={location?.department?.department_name}
            />

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
