import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { InertiaSmartSelect } from '@/components/ui/smart-select';
import axios from 'axios';

interface EquipmentData {
    recallNumber: string;
    description: string;
    serialNumber: string;
    model: string;
    manufacturer: string;
    plant: string;
    department: string;
    location: string;
}

interface EmployeeDetailsTabProps {
    data: EquipmentData;
    onChange: (data: EquipmentData) => void;
    errors: Record<string, string>;
    requestType: 'new' | 'routine';
    existingEquipment: any[];
    user: any;
}

const EmployeeDetailsTab: React.FC<EmployeeDetailsTabProps> = ({
    data,
    onChange,
    errors = {},
    requestType,
    existingEquipment,
    user
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEquipment, setFilteredEquipment] = useState(existingEquipment);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [trackingRecords, setTrackingRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(false);

    // Filter existing equipment based on search
    useEffect(() => {
        console.log(user)
        if (requestType === 'routine') {
            const filtered = existingEquipment.filter(eq =>
                eq.recall_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                eq.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                eq.serial_number.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredEquipment(filtered);
        }
    }, [searchQuery, existingEquipment, requestType]);

    // Search tracking records by recall number
    useEffect(() => {
        const searchTrackingRecords = async () => {
            if (searchQuery.length < 3) {
                setTrackingRecords([]);
                return;
            }

            setLoadingRecords(true);
            try {
                const userDepartmentId = user?.department?.data?.department_id || user?.department?.department_id || user?.department_id;

                const response = await axios.get('/admin/tracking-records/search', {
                    params: {
                        search: searchQuery,
                        department_id: userDepartmentId,
                        limit: 10
                    },
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                setTrackingRecords(response.data.data || []);
            } catch (error) {
                console.error('Error searching tracking records:', error);
                setTrackingRecords([]);
            } finally {
                setLoadingRecords(false);
            }
        };

        const debounceTimer = setTimeout(searchTrackingRecords, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, user]);

    // Auto-fill user location data and generate recall number for new requests
    useEffect(() => {
        if (user && (!data.plant || !data.department)) {
            // Extract the actual plant and department names from nested data
            const plantName = user.plant?.data?.plant_name || user.plant?.plant_name || '';
            const departmentName = user.department?.data?.department_name || user.department?.department_name || '';

            // For form submission, we need to send the IDs, but display names
            onChange({
                ...data,
                plant: user.plant_id?.toString() || data.plant,
                department: user.department_id?.toString() || data.department,
            });
        }

        // Auto-generate recall number for new requests
        if (requestType === 'new' && !data.recallNumber) {
            const generateRecallNumber = () => {
                const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                return `RCL-${timestamp}-${random}`;
            };

            onChange({
                ...data,
                recallNumber: generateRecallNumber()
            });
        }
    }, [user, requestType]);

    const handleChange = (field: keyof EquipmentData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    const handleEquipmentSelect = (equipment: any) => {
        setSelectedEquipment(equipment);
        onChange({
            ...data,
            recallNumber: equipment.recall_number,
            description: equipment.description,
            serialNumber: equipment.serial_number,
            model: equipment.model || '',
            manufacturer: equipment.manufacturer || '',
        });
    };

    const loadLocationOptions = async (inputValue: string) => {
        try {
            // Use the user's department ID from the nested structure
            const userDepartmentId = user?.department?.data?.department_id || user?.department?.department_id || user?.department_id;

            const response = await axios.get('/admin/locations/search', {
                params: {
                    search: inputValue,
                    department_id: userDepartmentId,
                    limit: 10
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            return response.data.data.map((location: any) => ({
                label: location.location_name,
                value: location.location_id.toString()
            }));
        } catch (error) {
            console.error('Error loading locations:', error);
            return [];
        }
    };

    // Get display names for plant and department
    const getPlantDisplayName = () => {
        return user?.plant?.data?.plant_name || user?.plant?.plant_name || 'Not assigned';
    };

    const getDepartmentDisplayName = () => {
        return user?.department?.data?.department_name || user?.department?.department_name || 'Not assigned';
    };

    const handleTrackingRecordSelect = (record: any) => {
        const equipment = record.equipment;
        if (equipment) {
            setSelectedEquipment(equipment);
            onChange({
                ...data,
                recallNumber: record.recall || equipment.recall_number,
                description: record.description || equipment.description,
                serialNumber: equipment.serial_number || '',
                model: equipment.model || '',
                manufacturer: equipment.manufacturer || '',
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Routine Equipment Search */}
            {requestType === 'routine' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Search Existing Equipment & Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by recall number, description, or serial number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {searchQuery && (
                                <div className="space-y-4">
                                    {/* Equipment Results */}
                                    {filteredEquipment.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Equipment Records</h4>
                                            <div className="max-h-40 overflow-y-auto border rounded-md">
                                                {filteredEquipment.map((equipment) => (
                                                    <div
                                                        key={equipment.id}
                                                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                                        onClick={() => handleEquipmentSelect(equipment)}
                                                    >
                                                        <div className="font-medium">{equipment.recall_number}</div>
                                                        <div className="text-sm text-muted-foreground">{equipment.description}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            S/N: {equipment.serial_number} | {equipment.manufacturer} {equipment.model}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tracking Records Results */}
                                    {loadingRecords ? (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Tracking Records</h4>
                                            <div className="p-3 text-center text-muted-foreground">
                                                Searching tracking records...
                                            </div>
                                        </div>
                                    ) : trackingRecords.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Tracking Records (Same Department)</h4>
                                            <div className="max-h-40 overflow-y-auto border rounded-md">
                                                {trackingRecords.map((record) => (
                                                    <div
                                                        key={record.tracking_id}
                                                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                                        onClick={() => handleTrackingRecordSelect(record)}
                                                    >
                                                        <div className="font-medium">
                                                            {record.recall || record.equipment?.recall_number || 'No Recall #'}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {record.description || record.equipment?.description}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Technician: {record.technician?.first_name} {record.technician?.last_name} |
                                                            Date: {new Date(record.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* No Results */}
                                    {!loadingRecords && filteredEquipment.length === 0 && trackingRecords.length === 0 && searchQuery.length >= 3 && (
                                        <div className="p-3 text-center text-muted-foreground border rounded-md">
                                            No equipment or tracking records found. Try different search terms.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Equipment Details Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Equipment Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Location Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <Label htmlFor="plant">Plant</Label>
                            <Input
                                id="plant"
                                value={getPlantDisplayName()}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Auto-filled from your profile</p>
                        </div>

                        <div>
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                value={getDepartmentDisplayName()}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Auto-filled from your profile</p>
                        </div>

                        <div>
                            <Label htmlFor="location" className={errors.location ? 'text-destructive' : ''}>
                                Location
                            </Label>
                            <InertiaSmartSelect
                                name="location"
                                value={data.location || null}
                                onChange={(value) => handleChange('location', value?.toString() || '')}
                                loadOptions={loadLocationOptions}
                                placeholder="Select location"
                                error={errors.location}
                                className={errors.location ? 'border-destructive' : ''}
                                cacheOptions={true}
                                defaultOptions={true}
                                minSearchLength={0}
                            />
                            {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
                        </div>
                    </div>

                    {/* Equipment Information */}
                    <div className="border-t pt-6">
                        <h3 className="font-medium text-sm mb-4">Equipment Information</h3>
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
                                    disabled={
                                        (requestType === 'routine' && selectedEquipment) ||
                                        requestType === 'new'
                                    }
                                    placeholder={requestType === 'new' ? 'Auto-generated' : 'Enter recall number'}
                                />
                                {requestType === 'new' && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Auto-generated for new equipment
                                    </p>
                                )}
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
                                    disabled={requestType === 'routine' && selectedEquipment}
                                    placeholder="Enter equipment description"
                                />
                                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                            </div>

                            <div>
                                <Label htmlFor="serialNumber" className={errors.serialNumber ? 'text-destructive' : ''}>
                                    Serial Number *
                                </Label>
                                <Input
                                    id="serialNumber"
                                    value={data.serialNumber}
                                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                                    className={errors.serialNumber ? 'border-destructive' : ''}
                                    disabled={requestType === 'routine' && selectedEquipment}
                                    placeholder="Enter serial number"
                                />
                                {errors.serialNumber && <p className="text-sm text-destructive mt-1">{errors.serialNumber}</p>}
                            </div>

                            <div>
                                <Label htmlFor="model">Model</Label>
                                <Input
                                    id="model"
                                    value={data.model}
                                    onChange={(e) => handleChange('model', e.target.value)}
                                    disabled={requestType === 'routine' && selectedEquipment}
                                    placeholder="Enter model (optional)"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="manufacturer">Manufacturer</Label>
                                <Input
                                    id="manufacturer"
                                    value={data.manufacturer}
                                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                                    disabled={requestType === 'routine' && selectedEquipment}
                                    placeholder="Enter manufacturer (optional)"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EmployeeDetailsTab;
