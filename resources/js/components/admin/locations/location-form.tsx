import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Department, type Location } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface LocationFormData {
    location_name: string;
    department_id: string;
    [key: string]: any;
}

interface LocationFormProps {
    location?: Location;
    departments: Department[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function LocationForm({ location, departments, onSuccess, onCancel }: LocationFormProps) {
    const isEditing = !!location;

    const { data, setData, post, put, processing, errors, reset } = useForm<LocationFormData>({
        location_name: location?.location_name || '',
        department_id: location?.department_id?.toString() || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const options = {
            onSuccess: () => {
                console.log('LocationForm: Operation successful, calling onSuccess');
                reset();
                onSuccess?.();
            },
            onError: (errors: any) => {
                console.error('LocationForm: Operation failed:', errors);
            },
            preserveScroll: true,
        };

        if (isEditing) {
            put(route('admin.locations.update', location.location_id), options);
        } else {
            post(route('admin.locations.store'), options);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="location_name">Location Name *</Label>
                <Input
                    id="location_name"
                    value={data.location_name}
                    onChange={(e) => setData('location_name', e.target.value)}
                    required
                    placeholder="Enter location name"
                />
                <InputError message={errors.location_name} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="department_id">Department *</Label>
                <Select value={data.department_id} onValueChange={(value) => setData('department_id', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                        {departments.map((department) => (
                            <SelectItem key={department.department_id} value={department.department_id.toString()}>
                                {department.department_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.department_id} />
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
