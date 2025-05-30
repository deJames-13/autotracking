import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EquipmentData {
    recallNumber: string;
    description: string;
    serialNumber: string;
    model: string;
    manufacturer: string;
}

interface EmployeeDetailsTabProps {
    data: EquipmentData;
    onChange: (data: EquipmentData) => void;
    errors: Record<string, string>;
}

const EmployeeDetailsTab: React.FC<EmployeeDetailsTabProps> = ({ data, onChange, errors = {} }) => {
    const handleChange = (field: keyof EquipmentData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Equipment Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <Label htmlFor="recallNumber" className={errors.recallNumber ? 'text-destructive' : ''}>
                            Recall Number *
                        </Label>
                        <Input
                            id="recallNumber"
                            value={data.recallNumber}
                            onChange={(e) => handleChange('recallNumber', e.target.value)}
                            className={errors.recallNumber ? 'border-destructive' : ''}
                        />
                        {errors.recallNumber && <p className="text-sm text-destructive mt-1">{errors.recallNumber}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="description" className={errors.description ? 'text-destructive' : ''}>
                            Equipment Description *
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
                        <Label htmlFor="serialNumber">Serial Number</Label>
                        <Input
                            id="serialNumber"
                            value={data.serialNumber}
                            onChange={(e) => handleChange('serialNumber', e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="model">Model</Label>
                        <Input
                            id="model"
                            value={data.model}
                            onChange={(e) => handleChange('model', e.target.value)}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        <Input
                            id="manufacturer"
                            value={data.manufacturer}
                            onChange={(e) => handleChange('manufacturer', e.target.value)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default EmployeeDetailsTab;
