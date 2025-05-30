import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InertiaSmartSelect } from '@/components/ui/smart-select';
import { Camera } from 'lucide-react';
import axios from 'axios';

interface ConfirmationData {
    receivedBy: string;
    employeePin: string;
}

interface EmployeeConfirmTabProps {
    data: {
        technician: any;
        equipment: any;
        confirmation: ConfirmationData;
        user: any;
    };
    onChange: (data: ConfirmationData) => void;
    errors?: Record<string, string>;
}

const EmployeeConfirmTab: React.FC<EmployeeConfirmTabProps> = ({ data, onChange, errors = {} }) => {
    const [showScanner, setShowScanner] = useState(false);
    const [recallNumber] = useState(`RCL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

    const handleChange = (field: keyof ConfirmationData, value: string) => {
        onChange({ ...data.confirmation, [field]: value });
    };

    const handleScanBarcode = () => {
        setShowScanner(true);
        // Simulate barcode scanning
        setTimeout(() => {
            // In real implementation, this would scan an actual barcode
            setShowScanner(false);
        }, 2000);
    };

    // Load personnel options for receiving equipment
    const loadPersonnelOptions = async (inputValue: string) => {
        try {
            const response = await axios.get('/admin/users', {
                params: {
                    search: inputValue,
                    limit: 10
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            return response.data.data.data.map((user: any) => ({
                label: `${user.first_name} ${user.last_name} (${user.department?.department_name || 'No Dept'})`,
                value: user.employee_id
            }));
        } catch (error) {
            console.error('Error loading personnel:', error);
            return [];
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Request Summary</CardTitle>
                    <CardDescription>Review and confirm your calibration request</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Calibration Request #{recallNumber}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <h4 className="font-medium">Requested By</h4>
                                <p>{data.user?.first_name} {data.user?.last_name}</p>
                                <p className="text-sm text-muted-foreground">{data.user?.email}</p>
                            </div>

                            <div>
                                <h4 className="font-medium">Assigned Technician</h4>
                                <p>{data.technician?.full_name || `${data.technician?.first_name} ${data.technician?.last_name}`}</p>
                                <p className="text-sm text-muted-foreground">{data.technician?.department?.department_name}</p>
                            </div>

                            <div>
                                <h4 className="font-medium">Equipment</h4>
                                <p>{data.equipment.description}</p>
                                <p className="text-sm text-muted-foreground">
                                    Recall: {data.equipment.recallNumber}
                                </p>
                                {data.equipment.serialNumber && (
                                    <p className="text-sm text-muted-foreground">
                                        S/N: {data.equipment.serialNumber}
                                    </p>
                                )}
                            </div>

                            <div>
                                <h4 className="font-medium">Location</h4>
                                <p>{data.equipment.plant}</p>
                                <p className="text-sm text-muted-foreground">{data.equipment.department}</p>
                                <p className="text-sm text-muted-foreground">{data.equipment.location}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-semibold mb-4">Confirmation Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label
                                    htmlFor="receivedBy"
                                    className={errors.receivedBy ? 'text-destructive' : ''}
                                >
                                    Equipment Received By *
                                </Label>
                                <div className="flex gap-2">
                                    <InertiaSmartSelect
                                        name="receivedBy"
                                        value={data.confirmation.receivedBy}
                                        onChange={(value) => handleChange('receivedBy', value as string)}
                                        loadOptions={loadPersonnelOptions}
                                        placeholder="Select personnel"
                                        error={errors.receivedBy}
                                        className={`flex-1 ${errors.receivedBy ? 'border-destructive' : ''}`}
                                        cacheOptions={true}
                                        defaultOptions={true}
                                        minSearchLength={2}
                                    />
                                    <Button type="button" variant="outline" onClick={handleScanBarcode}>
                                        <Camera className="h-4 w-4 mr-2" />
                                        Scan
                                    </Button>
                                </div>
                                {errors.receivedBy && <p className="text-sm text-destructive mt-1">{errors.receivedBy}</p>}
                            </div>

                            <div>
                                <Label
                                    htmlFor="employeePin"
                                    className={errors.employeePin ? 'text-destructive' : ''}
                                >
                                    Your PIN *
                                </Label>
                                <Input
                                    id="employeePin"
                                    type="password"
                                    placeholder="Enter your PIN"
                                    value={data.confirmation.employeePin}
                                    onChange={(e) => handleChange('employeePin', e.target.value)}
                                    className={errors.employeePin ? 'border-destructive' : ''}
                                />
                                {errors.employeePin && <p className="text-sm text-destructive mt-1">{errors.employeePin}</p>}
                                <p className="text-xs text-muted-foreground mt-1">
                                    Enter your PIN to confirm this request
                                </p>
                            </div>
                        </div>

                        {showScanner && (
                            <div className="mt-4 p-4 border rounded-md bg-muted text-center">
                                <p className="animate-pulse">Scanning employee barcode...</p>
                            </div>
                        )}

                        <div className="mt-6 p-4 bg-blue-50 rounded-md">
                            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Your request will be submitted for processing</li>
                                <li>• The assigned technician will be notified</li>
                                <li>• You'll receive updates on the calibration status</li>
                                <li>• Equipment will be returned to the specified location when complete</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EmployeeConfirmTab;
