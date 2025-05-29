import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Department } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface DepartmentFormData {
    department_name: string;
    [key: string]: any;
}

interface DepartmentFormProps {
    department?: Department;
    onSuccess?: (department?: Department) => void;
    onCancel?: () => void;
}

export function DepartmentForm({ department, onSuccess, onCancel }: DepartmentFormProps) {
    const isEditing = !!department;

    const { data, setData, post, put, processing, errors, reset } = useForm<DepartmentFormData>({
        department_name: department?.department_name || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const options = {
            onSuccess: (page: any) => {
                console.log('DepartmentForm: Operation successful, calling onSuccess');
                reset();
                // Pass the department data from the response
                const departmentData = page.props?.department || department;
                onSuccess?.(departmentData);
            },
            onError: (errors: any) => {
                console.error('DepartmentForm: Operation failed:', errors);
            },
            preserveScroll: true,
        };

        if (isEditing) {
            put(route('admin.departments.update', department.department_id), options);
        } else {
            post(route('admin.departments.store'), options);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="department_name">Department Name *</Label>
                <Input
                    id="department_name"
                    value={data.department_name}
                    onChange={(e) => setData('department_name', e.target.value)}
                    required
                    placeholder="Enter department name"
                />
                <InputError message={errors.department_name} />
            </div>

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : isEditing ? 'Update Department' : 'Create Department'}
                </Button>
            </div>
        </form>
    );
}
