import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Department, type Plant, type Role, type User, type UserFormData } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

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

    const { data, setData, post, put, processing, errors, reset } = useForm<UserFormData & { [key: string]: any }>({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        middle_name: user?.middle_name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
        role_id: user?.role_id || roles[0]?.role_id || 1,
        department_id: user?.department_id || undefined,
        plant_id: user?.plant_id || undefined,
        avatar: user?.avatar || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const submitData = { ...data };

        // Remove password fields if not provided during edit
        if (isEditing && !submitData.password) {
            delete submitData.password;
            delete submitData.password_confirmation;
        }

        const options = {
            onSuccess: () => {
                reset();
                onSuccess?.();
            },
            preserveScroll: true,
        };

        if (isEditing) {
            put(`/api/v1/users/${user.employee_id}`, options);
        } else {
            post('/api/v1/users', options);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                        id="first_name"
                        value={data.first_name}
                        onChange={(e) => setData('first_name', e.target.value)}
                        required
                        placeholder="Enter first name"
                    />
                    <InputError message={errors.first_name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                        id="last_name"
                        value={data.last_name}
                        onChange={(e) => setData('last_name', e.target.value)}
                        required
                        placeholder="Enter last name"
                    />
                    <InputError message={errors.last_name} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                    id="middle_name"
                    value={data.middle_name}
                    onChange={(e) => setData('middle_name', e.target.value)}
                    placeholder="Enter middle name (optional)"
                />
                <InputError message={errors.middle_name} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="Enter email address (optional)"
                />
                <InputError message={errors.email} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="password">
                        Password {!isEditing && '*'}
                        {isEditing && <span className="text-sm text-muted-foreground">(leave blank to keep current)</span>}
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        required={!isEditing}
                        placeholder={isEditing ? "Enter new password (optional)" : "Enter password"}
                        minLength={4}
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                        Confirm Password {!isEditing && '*'}
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required={!isEditing && !!data.password}
                        placeholder="Confirm password"
                    />
                    <InputError message={errors.password_confirmation} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="role_id">Role *</Label>
                <Select value={data.role_id.toString()} onValueChange={(value) => setData('role_id', parseInt(value))}>
                    <SelectTrigger>
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
                <InputError message={errors.role_id} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="department_id">Department</Label>
                    <Select
                        value={data.department_id?.toString() || "none"}
                        onValueChange={(value) => setData('department_id', value === "none" ? undefined : parseInt(value))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Department</SelectItem>
                            {departments.map((department) => (
                                <SelectItem key={department.department_id} value={department.department_id.toString()}>
                                    {department.department_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.department_id} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="plant_id">Plant</Label>
                    <Select
                        value={data.plant_id?.toString() || "none"}
                        onValueChange={(value) => setData('plant_id', value === "none" ? undefined : parseInt(value))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a plant" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Plant</SelectItem>
                            {plants.map((plant) => (
                                <SelectItem key={plant.plant_id} value={plant.plant_id.toString()}>
                                    {plant.plant_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.plant_id} />
                </div>
            </div>

            <div className="flex justify-end gap-3">
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
