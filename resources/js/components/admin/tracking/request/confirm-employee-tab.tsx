import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera } from 'lucide-react';
import { EmployeeSchema } from '@/validation/tracking-request-schema';

interface ConfirmEmployeeTabProps {
    data: {
        technician: any;
        equipment: any;
        calibration: any;
        confirmation: EmployeeSchema;
    };
    onChange: (data: EmployeeSchema) => void;
    errors?: Record<string, string>;
}

// Mock data for employees (would come from backend)
const employees = [
    { id: '1', name: 'Alex Johnson' },
    { id: '2', name: 'Maria Garcia' },
    { id: '3', name: 'David Chen' },
    { id: '4', name: 'Sarah Williams' },
];

const ConfirmEmployeeTab: React.FC<ConfirmEmployeeTabProps> = ({ data, onChange, errors = {} }) => {
    const [showScanner, setShowScanner] = useState(false);

    // Generate a mock recall number (in real app, this would come from backend)
    const recallNumber = `RCL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const handleEmployeeChange = (employeeId: string) => {
        const selectedEmployee = employees.find(e => e.id === employeeId) || null;
        if (selectedEmployee) {
            onChange({
                ...data.confirmation,
                employee: {
                    id: selectedEmployee.id,
                    name: selectedEmployee.name
                }
            });
        }
    };

    const handlePinChange = (pin: string) => {
        onChange({ ...data.confirmation, pin });
    };

    const handleScanBarcode = () => {
        setShowScanner(true);
        // In a real app, this would activate a barcode scanner
        // For now, we'll just simulate finding an employee after a delay
        setTimeout(() => {
            const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
            onChange({
                ...data.confirmation,
                employee: {
                    id: randomEmployee.id,
                    name: randomEmployee.name
                }
            });
            setShowScanner(false);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Request Summary</CardTitle>
                    <CardDescription>Review and confirm the tracking request details</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Request for Recall #{recallNumber}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <h4 className="font-medium">Technician</h4>
                                <p>{data.technician?.name || 'Not selected'}</p>
                            </div>

                            <div>
                                <h4 className="font-medium">Equipment</h4>
                                <p>{data.equipment.description || 'Not specified'}</p>
                                <p className="text-sm text-muted-foreground">
                                    {data.equipment.manufacturer} {data.equipment.model} {data.equipment.serialNumber && `(S/N: ${data.equipment.serialNumber})`}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium">Location</h4>
                                <p>{data.equipment.plant}, {data.equipment.department}</p>
                                <p className="text-sm text-muted-foreground">{data.equipment.location}</p>
                            </div>

                            <div>
                                <h4 className="font-medium">Calibration Dates</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Cal Date</p>
                                        <p>{data.calibration.calibrationDate || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Due Date</p>
                                        <p>{data.calibration.expectedDueDate || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date Out</p>
                                        <p>{data.calibration.dateOut || 'Not set'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-semibold mb-4">Employee Confirmation</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label
                                    htmlFor="employee"
                                    className={errors['employee.id'] ? 'text-destructive' : ''}
                                >
                                    Registered By
                                </Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={data.confirmation.employee?.id || ''}
                                        onValueChange={handleEmployeeChange}
                                    >
                                        <SelectTrigger className={`flex-1 ${errors['employee.id'] ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="outline" onClick={handleScanBarcode}>
                                        <Camera className="h-4 w-4 mr-2" />
                                        Scan
                                    </Button>
                                </div>
                                {errors['employee.id'] && <p className="text-sm text-destructive mt-1">{errors['employee.id']}</p>}
                            </div>

                            <div>
                                <Label
                                    htmlFor="pin"
                                    className={errors.pin ? 'text-destructive' : ''}
                                >
                                    Employee PIN
                                </Label>
                                <Input
                                    id="pin"
                                    type="password"
                                    placeholder="Enter PIN"
                                    value={data.confirmation.pin}
                                    onChange={(e) => handlePinChange(e.target.value)}
                                    className={errors.pin ? 'border-destructive' : ''}
                                />
                                {errors.pin && <p className="text-sm text-destructive mt-1">{errors.pin}</p>}
                            </div>
                        </div>

                        {showScanner && (
                            <div className="mt-4 p-4 border rounded-md bg-muted text-center">
                                <p className="animate-pulse">Scanning employee barcode...</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ConfirmEmployeeTab;
