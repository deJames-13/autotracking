import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Info, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';
import { useRole } from '@/hooks/use-role';

interface ConfirmationTabProps {
    data: {
        technician: any;
        employee: any;
        equipment: any;
        calibration: any;
        confirmation_pin?: string;
        scannedEmployee?: any;
        receivedBy?: any;
    };
    onChange: (key: string, value: string) => void;
    errors?: Record<string, string>;
}

const ConfirmationTab: React.FC<ConfirmationTabProps> = ({ data, onChange, errors = {} }) => {
    const { isAdmin, isTechnician } = useRole();
    const [locationNames, setLocationNames] = useState({
        plant: '',
        department: '',
        location: ''
    });
    const [loading, setLoading] = useState(false);
    const [recallNumber, setRecallNumber] = useState('');
    const [recallLoading, setRecallLoading] = useState(false);

    // Determine if PIN input should be shown (not for Admin or Technician)
    const shouldShowPinInput = !isAdmin() && !isTechnician();
    const currentRole = isAdmin() ? 'Admin' : isTechnician() ? 'Technician' : 'User';

    // Generate a unique recall number when component mounts
    useEffect(() => {
        const fetchUniqueRecallNumber = async () => {
            setRecallLoading(true);
            try {
                const response = await axios.get(route('api.tracking.request.generate-recall'), {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                if (response.data.success) {
                    setRecallNumber(response.data.recall_number);
                } else {
                    console.error('Failed to generate recall number:', response.data.message);
                    // Fallback to local generation if backend fails
                    const timestamp = Date.now().toString();
                    const random = Math.floor(10000 + Math.random() * 90000);
                    setRecallNumber(`RCL-${timestamp.slice(-8)}-${random}`);
                }
            } catch (error) {
                console.error('Error fetching recall number:', error);
                // Fallback to local generation
                const timestamp = Date.now().toString();
                const random = Math.floor(10000 + Math.random() * 90000);
                setRecallNumber(`RCL-${timestamp.slice(-8)}-${random}`);
            } finally {
                setRecallLoading(false);
            }
        };

        fetchUniqueRecallNumber();
    }, []);

    // Fetch location names when component mounts or equipment data changes
    useEffect(() => {
        const fetchLocationNames = async () => {
            if (!data.equipment?.plant && !data.equipment?.department && !data.equipment?.location) {
                return;
            }

            setLoading(true);
            try {
                const names = { plant: '', department: '', location: '' };

                // First, try to get names from scannedEmployee
                if (data.scannedEmployee) {
                    names.plant = data.scannedEmployee.plant?.plant_name || '';
                    names.department = data.scannedEmployee.department?.department_name || '';
                }

                // Fetch plant name if not available from scannedEmployee
                if (!names.plant && data.equipment.plant) {
                    try {
                        const plantResponse = await axios.get(`/admin/plants/${data.equipment.plant}`, {
                            headers: { 'X-Requested-With': 'XMLHttpRequest' }
                        });
                        names.plant = plantResponse.data.plant_name || `Plant ID: ${data.equipment.plant}`;
                    } catch (error) {
                        console.error('Error fetching plant:', error);
                        names.plant = `Plant ID: ${data.equipment.plant}`;
                    }
                }

                // Fetch department name if not available from scannedEmployee
                if (!names.department && data.equipment.department) {
                    try {
                        const deptResponse = await axios.get(`/admin/departments/${data.equipment.department}`, {
                            headers: { 'X-Requested-With': 'XMLHttpRequest' }
                        });
                        names.department = deptResponse.data.department_name || `Department ID: ${data.equipment.department}`;
                    } catch (error) {
                        console.error('Error fetching department:', error);
                        names.department = `Department ID: ${data.equipment.department}`;
                    }
                }

                // Fetch location name
                if (data.equipment.location) {
                    try {
                        const locationResponse = await axios.get(`/admin/locations/${data.equipment.location}`, {
                            headers: { 'X-Requested-With': 'XMLHttpRequest' }
                        });
                        names.location = locationResponse.data.location_name || `Location ID: ${data.equipment.location}`;
                    } catch (error) {
                        console.error('Error fetching location:', error);
                        names.location = `Location ID: ${data.equipment.location}`;
                    }
                }

                setLocationNames(names);
            } catch (error) {
                console.error('Error fetching location names:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocationNames();
    }, [data.equipment, data.scannedEmployee]);

    // Get location names with loading state
    const getLocationName = (type: 'plant' | 'department' | 'location') => {
        if (loading) return 'Loading...';
        return locationNames[type] || 'Not assigned';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Confirmation & Summary
                    </CardTitle>
                    <CardDescription>
                        Review your tracking request details and confirm submission
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Request Summary */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Request for Recall #{recallLoading ? 'Generating...' : recallNumber}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Technician</Label>
                                    <p className="text-sm">
                                        {data.technician?.full_name ||
                                            `${data.technician?.first_name} ${data.technician?.last_name}` ||
                                            'Not selected'}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Employee</Label>
                                    <p className="text-sm">
                                        {data.employee?.full_name ||
                                            `${data.employee?.first_name} ${data.employee?.last_name}` ||
                                            (data.scannedEmployee ? `${data.scannedEmployee.first_name} ${data.scannedEmployee.last_name}` : 'Not selected')}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Equipment</Label>
                                    <p className="text-sm">{data.equipment?.description || 'Not selected'}</p>
                                    {data.equipment && (
                                        <p className="text-xs text-gray-500">
                                            {data.equipment.manufacturer} {data.equipment.model}
                                            {data.equipment.serialNumber && ` (S/N: ${data.equipment.serialNumber})`}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Location</Label>
                                    <p className="text-sm">
                                        {data.equipment ?
                                            `${getLocationName('plant')}, ${getLocationName('department')}` :
                                            'Not assigned'}
                                    </p>
                                    {data.equipment && (
                                        <p className="text-xs text-gray-500">{getLocationName('location')}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Show scanned employee info if available */}
                        {data.scannedEmployee && (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Registered by:</strong> {data.scannedEmployee.first_name} {data.scannedEmployee.last_name}
                                    <br />
                                    <span className="text-sm">
                                        ID: {data.scannedEmployee.employee_id} | {data.scannedEmployee.department?.department_name} - {data.scannedEmployee.plant?.plant_name}
                                    </span>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Calibration Information */}
                        {data.calibration && (
                            <div>
                                <Label className="text-sm font-medium text-gray-600 mb-2 block">Calibration Details</Label>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs text-gray-500">Type</Label>
                                                <p className="text-sm">{data.calibration.type || 'Standard'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Priority</Label>
                                                <Badge variant="outline">
                                                    {data.calibration.priority || 'Normal'}
                                                </Badge>
                                            </div>
                                        </div>
                                        {data.calibration.notes && (
                                            <div className="mt-4">
                                                <Label className="text-xs text-gray-500">Notes</Label>
                                                <p className="text-sm">{data.calibration.notes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* PIN Input for non-admin/technician users */}
                        {shouldShowPinInput && (
                            <div>
                                <Label htmlFor="confirmation-pin" className="flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Confirmation PIN
                                </Label>
                                <Input
                                    id="confirmation-pin"
                                    type="password"
                                    placeholder="Enter your confirmation PIN"
                                    value={data.confirmation_pin || ''}
                                    onChange={(e) => onChange('confirmation_pin', e.target.value)}
                                    className={errors.confirmation_pin ? 'border-red-500' : ''}
                                />
                                {errors.confirmation_pin && (
                                    <p className="text-sm text-red-500 mt-1">{errors.confirmation_pin}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter your PIN to confirm this request
                                </p>
                            </div>
                        )}

                        {/* Role-based confirmation message */}
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                {shouldShowPinInput ? (
                                    <>This request will be queued and require PIN confirmation before processing.</>
                                ) : (
                                    <>As a {currentRole}, your request will be processed immediately without PIN confirmation.</>
                                )}
                            </AlertDescription>
                        </Alert>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ConfirmationTab;
