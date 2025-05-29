import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InertiaSmartSelect, SelectOption } from '@/components/ui/smart-select';
import { type Equipment, type User } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useCallback, useState } from 'react';

interface EquipmentFormData {
    employee_id: string;
    recall_number: string;
    serial_number: string;
    description: string;
    model: string;
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
    const [loadingUsers, setLoadingUsers] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm<EquipmentFormData>({
        employee_id: equipment?.employee_id?.toString() || '',
        recall_number: equipment?.recall_number || '',
        serial_number: equipment?.serial_number || '',
        description: equipment?.description || '',
        model: equipment?.model || '',
        manufacturer: equipment?.manufacturer || '',
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

    // Handle user selection
    const handleUserChange = (value: string | number | null) => {
        setData('employee_id', value ? value.toString() : '');
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const submitData = {
            ...data,
            employee_id: data.employee_id || null, // Send null instead of empty string
        };

        const options = {
            onSuccess: () => {
                console.log('EquipmentForm: Operation successful, calling onSuccess');
                reset();
                onSuccess?.();
            },
            onError: (errors: any) => {
                console.error('EquipmentForm: Operation failed:', errors);
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
                        />
                        <InputError message={errors.recall_number} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serial_number">Serial Number</Label>
                        <Input
                            id="serial_number"
                            value={data.serial_number}
                            onChange={(e) => setData('serial_number', e.target.value)}
                            placeholder="Enter serial number (optional)"
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
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="model">Model *</Label>
                        <Input
                            id="model"
                            value={data.model}
                            onChange={(e) => setData('model', e.target.value)}
                            required
                            placeholder="Enter model name"
                        />
                        <InputError message={errors.model} />
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
