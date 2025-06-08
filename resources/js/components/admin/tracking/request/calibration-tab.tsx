import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalibrationSchema, TechnicianSchema } from '@/validation/tracking-request-schema';
import React, { useEffect } from 'react';

interface EquipmentSummary {
    plant: string;
    department: string;
    location: string;
    description: string;
    serialNumber?: string;
    model?: string;
    manufacturer?: string;
}

interface CalibrationTabProps {
    data: CalibrationSchema & EquipmentSummary;
    technician: TechnicianSchema;
    onChange: (data: CalibrationSchema) => void;
    errors?: Record<string, string>;
}

const CalibrationTab: React.FC<CalibrationTabProps> = ({ data, technician, onChange, errors = {} }) => {
    // Initialize dates when component mounts
    useEffect(() => {
        const today = new Date();
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(today.getFullYear() + 1);

        // Only set default dates if they're not already set
        const updates: Partial<CalibrationSchema> = {};
        let hasUpdates = false;

        if (!data.calibrationDate) {
            updates.calibrationDate = formatDateForInput(today);
            hasUpdates = true;
        }

        if (!data.expectedDueDate) {
            updates.expectedDueDate = formatDateForInput(oneYearFromNow);
            hasUpdates = true;
        }

        if (hasUpdates) {
            onChange({
                calibrationDate: data.calibrationDate,
                expectedDueDate: data.expectedDueDate,
                dateOut: data.dateOut,
                ...updates,
            });
        }
    }, []);

    // Format date for input field (YYYY-MM-DD)
    const formatDateForInput = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    const handleChange = (field: keyof CalibrationSchema, value: string) => {
        // If changing calibration date and expected due date is empty or matches previous calibration + 1 year,
        // automatically update expected due date to be one year after new calibration date
        if (field === 'calibrationDate' && value) {
            const newCalDate = new Date(value);

            // Only auto-update expected due date if it's empty or was previously auto-set
            if (!data.expectedDueDate || isOneYearApart(new Date(data.calibrationDate), new Date(data.expectedDueDate))) {
                const newDueDate = new Date(newCalDate);
                newDueDate.setFullYear(newCalDate.getFullYear() + 1);

                onChange({
                    calibrationDate: value,
                    expectedDueDate: formatDateForInput(newDueDate),
                    dateOut: data.dateOut,
                });
                return;
            }
        }

        onChange({
            calibrationDate: data.calibrationDate,
            expectedDueDate: data.expectedDueDate,
            dateOut: data.dateOut,
            [field]: value,
        });
    };

    // Check if two dates are one year apart (with a small tolerance for precision issues)
    const isOneYearApart = (startDate: Date, endDate: Date): boolean => {
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        const difference = endDate.getTime() - startDate.getTime();
        return Math.abs(difference - oneYearInMs) < 24 * 60 * 60 * 1000; // 1 day tolerance
    };

    return (
        <div className="space-y-6">
            {/* Technician Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Technician</CardTitle>
                </CardHeader>
                <CardContent>
                    {technician ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="font-medium">Name:</span> {technician.name}
                            </div>
                            <div>
                                <span className="font-medium">Department:</span> {technician.department}
                            </div>
                            <div>
                                <span className="font-medium">Specialization:</span> {technician.specialization}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No technician selected.</p>
                    )}
                </CardContent>
            </Card>

            {/* Equipment Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Equipment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="font-medium">Plant:</span> {data.plant || 'Not specified'}
                        </div>
                        <div>
                            <span className="font-medium">Department:</span> {data.department || 'Not specified'}
                        </div>
                        <div>
                            <span className="font-medium">Location:</span> {data.location || 'Not specified'}
                        </div>
                        <div>
                            <span className="font-medium">Description:</span> {data.description || 'Not specified'}
                        </div>
                        <div>
                            <span className="font-medium">Serial Number:</span> {data.serialNumber || 'Not specified'}
                        </div>
                        <div>
                            <span className="font-medium">Model:</span> {data.model || 'Not specified'}
                        </div>
                        <div>
                            <span className="font-medium">Manufacturer:</span> {data.manufacturer || 'Not specified'}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Calibration Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Calibration Details</CardTitle>
                    <CardDescription>Enter the calibration information for this equipment</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div>
                            <Label htmlFor="calibrationDate" className={errors.calibrationDate ? 'text-destructive' : ''}>
                                Calibration Date
                            </Label>
                            <Input
                                id="calibrationDate"
                                type="date"
                                value={data.calibrationDate}
                                onChange={(e) => handleChange('calibrationDate', e.target.value)}
                                className={errors.calibrationDate ? 'border-destructive' : ''}
                            />
                            {errors.calibrationDate && <p className="text-destructive mt-1 text-sm">{errors.calibrationDate}</p>}
                        </div>

                        <div>
                            <Label htmlFor="expectedDueDate" className={errors.expectedDueDate ? 'text-destructive' : ''}>
                                Expected Due Date
                            </Label>
                            <Input
                                id="expectedDueDate"
                                type="date"
                                value={data.expectedDueDate}
                                onChange={(e) => handleChange('expectedDueDate', e.target.value)}
                                className={errors.expectedDueDate ? 'border-destructive' : ''}
                            />
                            {errors.expectedDueDate && <p className="text-destructive mt-1 text-sm">{errors.expectedDueDate}</p>}
                        </div>

                        <div>
                            <Label htmlFor="dateOut" className={errors.dateOut ? 'text-destructive' : ''}>
                                Date Out
                            </Label>
                            <Input
                                id="dateOut"
                                type="date"
                                value={data.dateOut}
                                onChange={(e) => handleChange('dateOut', e.target.value)}
                                className={errors.dateOut ? 'border-destructive' : ''}
                            />
                            {errors.dateOut && <p className="text-destructive mt-1 text-sm">{errors.dateOut}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CalibrationTab;
