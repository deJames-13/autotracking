import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EquipmentSchema } from '@/validation/tracking-request-schema';

interface DetailTabProps {
    data: EquipmentSchema;
    onChange: (data: EquipmentSchema) => void;
    errors?: Record<string, string>;
}

// Mock data for plants and departments (would come from backend)
const plants = ['Plant A', 'Plant B', 'Plant C'];
const departments = ['Production', 'Maintenance', 'Quality Control', 'Engineering'];

const DetailTab: React.FC<DetailTabProps> = ({ data, onChange, errors = {} }) => {
    const handleChange = (field: keyof EquipmentSchema, value: string) => {
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
                            <Select
                                value={data.plant}
                                onValueChange={(value) => handleChange('plant', value)}
                            >
                                <SelectTrigger className={errors.plant ? 'border-destructive' : ''}>
                                    <SelectValue placeholder="Select plant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plants.map((plant) => (
                                        <SelectItem key={plant} value={plant}>{plant}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.plant && <p className="text-sm text-destructive mt-1">{errors.plant}</p>}
                        </div>

                        <div>
                            <Label htmlFor="department" className={errors.department ? 'text-destructive' : ''}>
                                Department
                            </Label>
                            <Select
                                value={data.department}
                                onValueChange={(value) => handleChange('department', value)}
                            >
                                <SelectTrigger className={errors.department ? 'border-destructive' : ''}>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.department && <p className="text-sm text-destructive mt-1">{errors.department}</p>}
                        </div>

                        <div>
                            <Label htmlFor="location" className={errors.location ? 'text-destructive' : ''}>
                                Location
                            </Label>
                            <Input
                                id="location"
                                value={data.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                className={errors.location ? 'border-destructive' : ''}
                            />
                            {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
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
