import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type Equipment, type User } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface EquipmentFormData {
    employee_id: string;
    serial_number: string;
    description: string;
    manufacturer: string;
    [key: string]: any;
}

interface EquipmentFormProps {
    equipment?: Equipment;
    users: User[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function EquipmentForm({ equipment, users, onSuccess, onCancel }: EquipmentFormProps) {
    const isEditing = !!equipment;

    const { data, setData, post, put, processing, errors, reset } = useForm<EquipmentFormData>({
        employee_id: equipment?.employee_id?.toString() || '',
        serial_number: equipment?.serial_number || '',
        description: equipment?.description || '',
        manufacturer: equipment?.manufacturer || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const submitData = {
            ...data,
            employee_id: data.employee_id || null, // Send null instead of empty string
        };

        const options = {
            onSuccess: () => {
                reset();
                onSuccess?.();
            },
            preserveScroll: true,
        };

        if (isEditing) {
            put(`/api/v1/equipment/${equipment.equipment_id}`, options);
        } else {
            post('/api/v1/equipment', options);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number *</Label>
                <Input
                    id="serial_number"
                    value={data.serial_number}
                    onChange={(e) => setData('serial_number', e.target.value)}
                    required
                    placeholder="Enter serial number"
                />
                <InputError message={errors.serial_number} />
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
                />
                <InputError message={errors.description} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                    id="manufacturer"
                    value={data.manufacturer}
                    onChange={(e) => setData('manufacturer', e.target.value)}
                    required
                    placeholder="Enter manufacturer name"
                />
                <InputError message={errors.manufacturer} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="employee_id">Assigned User</Label>
                <Select value={data.employee_id || 'none'} onValueChange={(value) => setData('employee_id', value === 'none' ? '' : value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select user (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No assignment</SelectItem>
                        {users.map((user) => (
                            <SelectItem key={user.employee_id} value={user.employee_id.toString()}>
                                {user.full_name || `${user.first_name} ${user.last_name}`} ({user.employee_id})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.employee_id} />
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
