import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Department, type DepartmentFormData as IDepartmentFormData } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

// Use the interface from types file or extend it if needed
type DepartmentFormData = IDepartmentFormData;

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
        <form onSubmit={submit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
                <Label htmlFor="department_name" className="text-sm sm:text-base">Department Name *</Label>
                <Input
                    id="department_name"
                    value={data.department_name}
                    onChange={(e) => setData('department_name', e.target.value)}
                    required
                    placeholder="Enter department name"
                    className="text-sm sm:text-base"
                />
                <InputError message={errors.department_name} />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="w-full sm:w-auto text-sm sm:text-base"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={processing}
                    className="w-full sm:w-auto text-sm sm:text-base"
                >
                    {processing ? 'Saving...' : isEditing ? 'Update Department' : 'Create Department'}
                </Button>
            </div>
        </form>
    );
}
