import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRole } from '@/hooks/use-role';
import { useAppSelector } from '@/store/hooks';
import axios from 'axios';
import { Info } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ConfirmEmployeeTabProps {
    data: {
        technician: any;
        equipment: any;
        calibration: any;
        confirmation_pin: string;
        scannedEmployee?: any;
        receivedBy?: any;
        edit?: number;
    };
    onChange: (key: string, value: string) => void;
    errors?: Record<string, string>;
}

const ConfirmEmployeeTab: React.FC<ConfirmEmployeeTabProps> = ({ data, onChange, errors = {} }) => {
    const { requestType, equipment } = useAppSelector((state) => state.trackingRequest);
    const { isAdmin, isTechnician } = useRole();
    const [locationNames, setLocationNames] = useState({
        plant: '',
        department: '',
        location: '',
    });
    const [loading, setLoading] = useState(true);

    // Determine if PIN input should be shown (not for Admin or Technician)
    const shouldShowPinInput = !isAdmin() && !isTechnician();
    const currentRole = isAdmin() ? 'Admin' : isTechnician() ? 'Technician' : 'User';

    // Fetch location names when component mounts or equipment data changes
    useEffect(() => {
        const fetchLocationNames = async () => {
            setLoading(true);
            try {
                const names = { plant: '', department: '', location: '' };

                // First, try to get names from scannedEmployee
                if (data.scannedEmployee) {
                    names.plant = data.scannedEmployee.plant?.plant_name || '';
                    names.department = data.scannedEmployee.department?.department_name || '';
                    // Location might not be in scannedEmployee, so we'll fetch it separately
                }

                // Only fetch additional data if we don't already have it from scannedEmployee
                const needsFetch =
                    (!names.plant && data.equipment.plant) ||
                    (!names.department && data.equipment.department) ||
                    data.equipment.location;

                if (!needsFetch) {
                    setLocationNames(names);
                    setLoading(false);
                    return;
                }

                // Fetch plant name if not available from scannedEmployee
                if (!names.plant && data.equipment.plant) {
                    try {
                        const plantResponse = await axios.get(`/admin/plants/${data.equipment.plant}`, {
                            headers: { 'X-Requested-With': 'XMLHttpRequest' },
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
                            headers: { 'X-Requested-With': 'XMLHttpRequest' },
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
                            headers: { 'X-Requested-With': 'XMLHttpRequest' },
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
                // Fallback to IDs if fetch fails
                setLocationNames({
                    plant: data.equipment.plant ? `Plant ID: ${data.equipment.plant}` : 'Not assigned',
                    department: data.equipment.department ? `Department ID: ${data.equipment.department}` : 'Not assigned',
                    location: data.equipment.location ? `Location ID: ${data.equipment.location}` : 'Not assigned',
                });
            } finally {
                setLoading(false);
            }
        };

        // Only run if we have equipment data
        if (data.equipment) {
            fetchLocationNames();
        }
    }, [
        data.equipment?.plant,
        data.equipment?.department,
        data.equipment?.location,
        data.scannedEmployee?.employee_id, // Use specific property instead of whole object
        data.scannedEmployee?.plant?.plant_name,
        data.scannedEmployee?.department?.department_name
    ]);

    // Get location names with loading state
    const getLocationName = (type: 'plant' | 'department' | 'location') => {
        if (loading) return 'Loading...';
        return locationNames[type] || 'Not assigned';
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
                        {equipment.recallNumber && (
                            <h3 className="mb-2 text-lg font-semibold">
                                Request for Recall #
                                {equipment.recallNumber || (requestType === 'routine' ? 'Not specified' : 'Will be assigned during calibration')}
                            </h3>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="font-medium">Technician</h4>
                                <p>
                                    {data.technician?.full_name || `${data.technician?.first_name} ${data.technician?.last_name}` || 'Not selected'}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium">Equipment</h4>
                                <p>{data.equipment.description || 'Not specified'}</p>
                                <p className="text-muted-foreground text-sm">
                                    {data.equipment.manufacturer} {data.equipment.model}{' '}
                                    {data.equipment.serialNumber && `(S/N: ${data.equipment.serialNumber})`}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium">Location</h4>
                                <p>
                                    {getLocationName('plant')}, {getLocationName('department')}
                                </p>
                                <p className="text-muted-foreground text-sm">{getLocationName('location')}</p>
                            </div>

                            <div>
                                <h4 className="font-medium">Received By</h4>
                                <p>{data.receivedBy ? `${data.receivedBy.first_name} ${data.receivedBy.last_name}` : 'Not assigned'}</p>
                                {data.receivedBy && <p className="text-muted-foreground text-sm">ID: {data.receivedBy.employee_id}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="mb-4 font-semibold">Employee Confirmation</h3>

                        {/* Show scanned employee info if available */}
                        {data.scannedEmployee && (
                            <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4">
                                <div className="flex items-center text-green-800">
                                    <span className="font-medium">
                                        Registered by: {data.scannedEmployee.first_name} {data.scannedEmployee.last_name}
                                    </span>
                                </div>
                                <div className="mt-1 text-sm text-green-600">
                                    ID: {data.scannedEmployee.employee_id} | {data.scannedEmployee.department?.department_name} -{' '}
                                    {data.scannedEmployee.plant?.plant_name}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
                            {/* Show PIN bypass notification for Admin/Technician */}
                            {!shouldShowPinInput && (
                                <Alert className="mb-4">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        As a {currentRole}, PIN authentication is bypassed for this action. The request will be confirmed without
                                        requiring employee PIN verification.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Show PIN input only for non-Admin/non-Technician users */}
                            {shouldShowPinInput && (
                                <div>
                                    <Label htmlFor="pin" className={errors.pin ? 'text-destructive' : ''}>
                                        Employee PIN
                                    </Label>
                                    <Input
                                        id="pin"
                                        type="password"
                                        placeholder="Enter PIN"
                                        value={data.confirmation_pin}
                                        onChange={(e) => onChange('confirmation_pin', e.target.value)}
                                        className={errors.pin ? 'border-destructive' : ''}
                                    />
                                    {errors.pin && <p className="text-destructive mt-1 text-sm">{errors.pin}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ConfirmEmployeeTab;
