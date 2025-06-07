import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Scan, Info, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';

interface EquipmentTabProps {
    data: {
        technician: any;
        equipment: any;
        calibration: any;
        scannedEmployee?: any;
        receivedBy?: any;
    };
    onChange: (key: string, value: any) => void;
    errors?: Record<string, string>;
}

const EquipmentTab: React.FC<EquipmentTabProps> = ({ data, onChange, errors = {} }) => {
    const [searchCode, setSearchCode] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState(data.equipment);
    const [locationNames, setLocationNames] = useState({
        plant: '',
        department: '',
        location: ''
    });
    const [loading, setLoading] = useState(false);

    // Update selected equipment when data changes
    useEffect(() => {
        setSelectedEquipment(data.equipment);
    }, [data.equipment]);

    // Fetch location names when equipment is selected
    useEffect(() => {
        const fetchLocationNames = async () => {
            if (!selectedEquipment?.plant && !selectedEquipment?.department && !selectedEquipment?.location) {
                return;
            }

            setLoading(true);
            try {
                const names = { plant: '', department: '', location: '' };

                // Fetch plant name
                if (selectedEquipment.plant) {
                    try {
                        const plantResponse = await axios.get(`/admin/plants/${selectedEquipment.plant}`, {
                            headers: { 'X-Requested-With': 'XMLHttpRequest' }
                        });
                        names.plant = plantResponse.data.plant_name || `Plant ID: ${selectedEquipment.plant}`;
                    } catch (error) {
                        console.error('Error fetching plant:', error);
                        names.plant = `Plant ID: ${selectedEquipment.plant}`;
                    }
                }

                // Fetch department name
                if (selectedEquipment.department) {
                    try {
                        const deptResponse = await axios.get(`/admin/departments/${selectedEquipment.department}`, {
                            headers: { 'X-Requested-With': 'XMLHttpRequest' }
                        });
                        names.department = deptResponse.data.department_name || `Department ID: ${selectedEquipment.department}`;
                    } catch (error) {
                        console.error('Error fetching department:', error);
                        names.department = `Department ID: ${selectedEquipment.department}`;
                    }
                }

                // Fetch location name
                if (selectedEquipment.location) {
                    try {
                        const locationResponse = await axios.get(`/admin/locations/${selectedEquipment.location}`, {
                            headers: { 'X-Requested-With': 'XMLHttpRequest' }
                        });
                        names.location = locationResponse.data.location_name || `Location ID: ${selectedEquipment.location}`;
                    } catch (error) {
                        console.error('Error fetching location:', error);
                        names.location = `Location ID: ${selectedEquipment.location}`;
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
    }, [selectedEquipment]);

    const handleSearch = async () => {
        if (!searchCode.trim()) return;

        setIsSearching(true);
        try {
            const response = await axios.get(route('api.equipment.search'), {
                params: { code: searchCode },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.data.success) {
                setSearchResults(response.data.equipment || []);
                if (response.data.equipment && response.data.equipment.length === 1) {
                    handleSelectEquipment(response.data.equipment[0]);
                }
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching equipment:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectEquipment = (equipment: any) => {
        setSelectedEquipment(equipment);
        onChange('equipment', equipment);
        setSearchResults([]);
        setSearchCode(equipment.recall_number || equipment.serial_number || '');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scan className="w-5 h-5" />
                        Equipment Selection
                    </CardTitle>
                    <CardDescription>
                        Search for equipment by recall number or serial number
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label htmlFor="equipment-search">Equipment Code</Label>
                                <Input
                                    id="equipment-search"
                                    type="text"
                                    placeholder="Scan or enter recall number or serial number..."
                                    value={searchCode}
                                    onChange={(e) => setSearchCode(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className={errors.equipment ? 'border-red-500' : ''}
                                />
                                {errors.equipment && (
                                    <p className="text-sm text-red-500 mt-1">{errors.equipment}</p>
                                )}
                            </div>
                            <Button
                                type="button"
                                onClick={handleSearch}
                                disabled={isSearching || !searchCode.trim()}
                            >
                                <Search className="w-4 h-4 mr-2" />
                                {isSearching ? 'Searching...' : 'Search'}
                            </Button>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="space-y-2">
                                <Label>Search Results</Label>
                                {searchResults.map((equipment) => (
                                    <div
                                        key={equipment.id}
                                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => handleSelectEquipment(equipment)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium">{equipment.description}</h4>
                                                <p className="text-sm text-gray-600">
                                                    {equipment.manufacturer} {equipment.model}
                                                </p>                                <p className="text-xs text-gray-500">
                                                    S/N: {equipment.serial_number || 'N/A'} |
                                                    Recall: {equipment.recall_number || 'N/A'}
                                                </p>
                                            </div>
                                            <Badge variant="outline">
                                                {equipment.status || 'Available'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Equipment Display */}
                        {selectedEquipment && (
                            <div className="mt-6">
                                <Separator className="mb-4" />
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <Label className="text-lg font-medium">Selected Equipment</Label>
                                </div>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Description</Label>
                                                <p className="text-sm">{selectedEquipment.description}</p>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Manufacturer & Model</Label>
                                                <p className="text-sm">{selectedEquipment.manufacturer} {selectedEquipment.model}</p>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Serial Number</Label>
                                                <p className="text-sm">{selectedEquipment.serial_number || 'N/A'}</p>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Status</Label>
                                                <Badge variant="outline" className="ml-2">
                                                    {selectedEquipment.status || 'Available'}
                                                </Badge>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Recall Number</Label>
                                                <p className="text-sm">{selectedEquipment.recall_number || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Location Information */}
                                        {(selectedEquipment.plant || selectedEquipment.department || selectedEquipment.location) && (
                                            <div className="mt-4 pt-4 border-t">
                                                <Label className="text-sm font-medium text-gray-600 mb-2 block">Location</Label>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <Label className="text-xs text-gray-500">Plant</Label>
                                                        <p className="text-sm">
                                                            {loading ? 'Loading...' : (locationNames.plant || 'Not assigned')}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-gray-500">Department</Label>
                                                        <p className="text-sm">
                                                            {loading ? 'Loading...' : (locationNames.department || 'Not assigned')}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-gray-500">Location</Label>
                                                        <p className="text-sm">
                                                            {loading ? 'Loading...' : (locationNames.location || 'Not assigned')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {searchCode && searchResults.length === 0 && !isSearching && (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    No equipment found with the code "{searchCode}". Please check the code and try again.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EquipmentTab;
