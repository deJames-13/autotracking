import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type Plant } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import { z } from 'zod';

// Define Zod schema for form validation
const plantSchema = z.object({
    plant_name: z.string().min(1, 'Plant name is required'),
    address: z.string().optional(),
    telephone: z.string().optional(),
});

type PlantFormData = z.infer<typeof plantSchema>;

interface PlantFormProps {
    plant?: Plant;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PlantForm({ plant, onSuccess, onCancel }: PlantFormProps) {
    const isEditing = !!plant;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<PlantFormData>({
        plant_name: plant?.plant_name || '',
        address: plant?.address || '',
        telephone: plant?.telephone || '',
    });

    // Client-side validation
    const validateForm = (): string[] => {
        try {
            plantSchema.parse(data);
            return [];
        } catch (error) {
            if (error instanceof z.ZodError) {
                return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            }
            return ['An unexpected error occurred'];
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        clearErrors();

        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            // Handle validation errors if needed
            return;
        }

        const options = {
            onSuccess: () => {
                console.log('PlantForm: Operation successful, calling onSuccess');
                reset();
                onSuccess?.();
            },
            onError: (errors: any) => {
                console.error('PlantForm: Operation failed:', errors);
            },
            preserveScroll: true,
        };

        if (isEditing) {
            put(route('admin.plants.update', plant.plant_id), options);
        } else {
            post(route('admin.plants.store'), options);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="plant_name">Plant Name *</Label>
                <Input
                    id="plant_name"
                    value={data.plant_name}
                    onChange={(e) => setData('plant_name', e.target.value)}
                    required
                    placeholder="Enter plant name"
                />
                <InputError message={errors.plant_name} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                    id="address"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    placeholder="Enter plant address"
                    rows={3}
                />
                <InputError message={errors.address} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="telephone">Telephone</Label>
                <Input
                    id="telephone"
                    value={data.telephone}
                    onChange={(e) => setData('telephone', e.target.value)}
                    placeholder="Enter telephone number"
                />
                <InputError message={errors.telephone} />
            </div>

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : isEditing ? 'Update Plant' : 'Create Plant'}
                </Button>
            </div>
        </form>
    );
}
