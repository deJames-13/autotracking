import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EquipmentSchema } from '@/validation/tracking-request-schema';
import { InertiaSmartSelect, SelectOption } from '@/components/ui/smart-select';

interface DetailTabProps {
    data: EquipmentSchema;
    onChange: (data: EquipmentSchema) => void;
    errors?: Record<string, string>;
}

// Mock service to load options (would be replaced with actual API calls)
const loadPlantOptions = async (inputValue: string): Promise<SelectOption[]> => {
    // This would be an API call to your backend
    const plants = ['Plant A', 'Plant B', 'Plant C'];
    return plants
        .filter(plant => plant.toLowerCase().includes(inputValue.toLowerCase()))
        .map(plant => ({ label: plant, value: plant }));
};

const loadDepartmentOptions = async (inputValue: string): Promise<SelectOption[]> => {
// This would be an API call to your backend
    const departments = ['Production', 'Maintenance', 'Quality Control', 'Engineering'];
    return departments
        .filter(dept => dept.toLowerCase().includes(inputValue.toLowerCase()))
        .map(dept => ({ label: dept, value: dept }));
};

const loadLocationOptions = async (inputValue: string): Promise<SelectOption[]> => {
    // This would be an API call to your backend
    const locations = ['Building A', 'Building B', 'Line 1', 'Line 2', 'Warehouse'];
    return locations
        .filter(loc => loc.toLowerCase().includes(inputValue.toLowerCase()))
        .map(loc => ({ label: loc, value: loc }));
};

// Mock function to create new options (would be replaced with API calls)
const createNewOption = async (inputValue: string): Promise<SelectOption> => {
    // In a real app, this would create the entity in your database via API
    return { label: inputValue, value: inputValue };
};

const DetailTab: React.FC<DetailTabProps> = ({ data, onChange, errors = {} }) => {
    const handleChange = (field: keyof EquipmentSchema, value: string | number | null) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Equipment Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="plant" className={errors.plant ? 'text-destructive' : ''}>
                                Plant
                            </Label>
                            <InertiaSmartSelect
                                name="plant"
                                value={data.plant}
                                onChange={(value) => handleChange('plant', value as string)}
                                loadOptions={loadPlantOptions}
                                onCreateOption={createNewOption}
                                placeholder="Select or create plant"
                                error={errors.plant}
                                className={errors.plant ? 'border-destructive' : ''}
                            />
                        </div>

                        <div>
                            <Label htmlFor="department" className={errors.department ? 'text-destructive' : ''}>
                                Department
                            </Label>
                            <InertiaSmartSelect
                                name="department"
                                value={data.department}
                                onChange={(value) => handleChange('department', value as string)}
                                loadOptions={loadDepartmentOptions}
                                onCreateOption={createNewOption}
                                placeholder="Select or create department"
                                error={errors.department}
                                className={errors.department ? 'border-destructive' : ''}
                            />
                        </div>

                        <div>
                            <Label htmlFor="location" className={errors.location ? 'text-destructive' : ''}>
                                Location
                            </Label>
                            <InertiaSmartSelect
                                name="location"
                                value={data.location}
                                onChange={(value) => handleChange('location', value as string)}
                                loadOptions={loadLocationOptions}
                                onCreateOption={createNewOption}
                                placeholder="Select or create location"
                                error={errors.location}
                                className={errors.location ? 'border-destructive' : ''}
                            />
                        </div>

                        <div>
                            <Label htmlFor="description" className={errors.description ? 'text-destructive' : ''}>
                                Equipment Description
                            </Label>
                            <Input
                                id="description"
                                value={data.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className={errors.description ? 'border-destructive' : ''}
                            />
                            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                        </div>

                        <div>
                            <Label htmlFor="serialNumber" className={errors.serialNumber ? 'text-destructive' : ''}>
                                Serial Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="serialNumber"
                                value={data.serialNumber || ''}
                                onChange={(e) => handleChange('serialNumber', e.target.value)}
                                className={errors.serialNumber ? 'border-destructive' : ''}
                                required
                            />
                            {errors.serialNumber && <p className="text-sm text-destructive mt-1">{errors.serialNumber}</p>}
                        </div>

                        <div>
                            <Label htmlFor="model" className={errors.model ? 'text-destructive' : ''}>
                                Model
                            </Label>
                            <Input
                                id="model"
                                value={data.model || ''}
                                onChange={(e) => handleChange('model', e.target.value)}
                                className={errors.model ? 'border-destructive' : ''}
                            />
                            {errors.model && <p className="text-sm text-destructive mt-1">{errors.model}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="manufacturer" className={errors.manufacturer ? 'text-destructive' : ''}>
                                Manufacturer
                            </Label>
                            <Input
                                id="manufacturer"
                                value={data.manufacturer || ''}
                                onChange={(e) => handleChange('manufacturer', e.target.value)}
                                className={errors.manufacturer ? 'border-destructive' : ''}
                            />
                            {errors.manufacturer && <p className="text-sm text-destructive mt-1">{errors.manufacturer}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DetailTab;
