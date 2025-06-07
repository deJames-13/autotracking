import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, CheckCircle, Info, QrCode } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';
import Barcode from 'react-barcode';

interface EquipmentTabProps {
    data: {
        technician: any;
        employee: any;
        equipment: any;
        calibration: any;
        scannedEmployee?: any;
        receivedBy?: any;
    };
    onChange: (key: string, value: any) => void;
    errors?: Record<string, string>;
    requestType: 'new' | 'routine';
}

const EquipmentTab: React.FC<EquipmentTabProps> = ({ data, onChange, errors = {}, requestType }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isGeneratingRecall, setIsGeneratingRecall] = useState(false);
    const [barcodeValue, setBarcodeValue] = useState<string | null>(null);

    // Equipment form data
    const [equipment, setEquipment] = useState({
        description: data.equipment?.description || '',
        serialNumber: data.equipment?.serialNumber || '',
        recallNumber: data.equipment?.recallNumber || '',
        model: data.equipment?.model || '',
        manufacturer: data.equipment?.manufacturer || '',
        location: data.equipment?.location || '',
        plant: data.equipment?.plant || '',
        department: data.equipment?.department || '',
        dueDate: data.equipment?.dueDate || '',
        ...data.equipment
    });

    // Generate barcode when recall number changes
    useEffect(() => {
        if (equipment.recallNumber) {
            setBarcodeValue(equipment.recallNumber);
        }
    }, [equipment.recallNumber]);

    const generateBarcode = (recallNumber: string) => {
        setBarcodeValue(recallNumber);
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        try {
            const response = await axios.get(route('api.equipment.search'), {
                params: { term: searchTerm },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.data.success) {
                setSearchResults(response.data.equipment || []);
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

    const handleSelectEquipment = (selectedEquipment: any) => {
        const newEquipment = {
            ...equipment,
            description: selectedEquipment.description,
            serialNumber: selectedEquipment.serial_number,
            recallNumber: selectedEquipment.recall_number,
            model: selectedEquipment.model,
            manufacturer: selectedEquipment.manufacturer,
            equipment_id: selectedEquipment.id,
            existing: true
        };

        setEquipment(newEquipment);
        onChange('equipment', newEquipment);
        setSearchResults([]);
        setSearchTerm(selectedEquipment.description);
    };

    const generateRecallNumber = async () => {
        setIsGeneratingRecall(true);
        try {
            const response = await axios.post(route('api.tracking.request.generate-recall'), {}, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.data.success && response.data.recall_number) {
                const newEquipment = {
                    ...equipment,
                    recallNumber: response.data.recall_number
                };
                setEquipment(newEquipment);
                onChange('equipment', newEquipment);
            }
        } catch (error) {
            console.error('Error generating recall number:', error);
        } finally {
            setIsGeneratingRecall(false);
        }
    };

    const handleEquipmentChange = (field: string, value: any) => {
        const newEquipment = {
            ...equipment,
            [field]: value
        };
        setEquipment(newEquipment);
        onChange('equipment', newEquipment);
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
                        <Package className="w-5 h-5" />
                        Equipment Details
                    </CardTitle>
                    <CardDescription>
                        {requestType === 'routine'
                            ? 'Search for existing equipment or enter equipment details'
                            : 'Enter new equipment details'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Equipment Search for Routine Requests */}
                        {requestType === 'routine' && (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="equipment-search">Search Existing Equipment</Label>
                                        <Input
                                            id="equipment-search"
                                            type="text"
                                            placeholder="Search by description, serial number, or recall number..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleSearch}
                                        disabled={isSearching || !searchTerm.trim()}
                                    >
                                        <Search className="w-4 h-4 mr-2" />
                                        {isSearching ? 'Searching...' : 'Search'}
                                    </Button>
                                </div>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Search Results</Label>
                                        {searchResults.map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => handleSelectEquipment(item)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium">{item.description}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            Serial: {item.serial_number} | Recall: {item.recall_number}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.manufacturer} - {item.model}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline">
                                                        {item.status || 'Available'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Separator />
                            </div>
                        )}

                        {/* Equipment Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="description">Equipment Description *</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Enter equipment description..."
                                    value={equipment.description}
                                    onChange={(e) => handleEquipmentChange('description', e.target.value)}
                                    className={errors['equipment.description'] ? 'border-red-500' : ''}
                                />
                                {errors['equipment.description'] && (
                                    <p className="text-sm text-red-500">{errors['equipment.description']}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="manufacturer">Manufacturer</Label>
                                <Input
                                    id="manufacturer"
                                    placeholder="Enter manufacturer..."
                                    value={equipment.manufacturer}
                                    onChange={(e) => handleEquipmentChange('manufacturer', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <Input
                                    id="model"
                                    placeholder="Enter model..."
                                    value={equipment.model}
                                    onChange={(e) => handleEquipmentChange('model', e.target.value)}
                                />
                            </div>

                            {requestType === 'new' ? (
                                <div className="space-y-2">
                                    <Label htmlFor="serialNumber">Serial Number *</Label>
                                    <Input
                                        id="serialNumber"
                                        placeholder="Enter serial number..."
                                        value={equipment.serialNumber}
                                        onChange={(e) => handleEquipmentChange('serialNumber', e.target.value)}
                                        className={errors['equipment.serialNumber'] ? 'border-red-500' : ''}
                                    />
                                    {errors['equipment.serialNumber'] && (
                                        <p className="text-sm text-red-500">{errors['equipment.serialNumber']}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="recallNumber">Recall Number *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="recallNumber"
                                            placeholder="Enter or generate recall number..."
                                            value={equipment.recallNumber}
                                            onChange={(e) => handleEquipmentChange('recallNumber', e.target.value)}
                                            className={errors['equipment.recallNumber'] ? 'border-red-500' : ''}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={generateRecallNumber}
                                            disabled={isGeneratingRecall}
                                        >
                                            {isGeneratingRecall ? 'Generating...' : 'Generate'}
                                        </Button>
                                    </div>
                                    {errors['equipment.recallNumber'] && (
                                        <p className="text-sm text-red-500">{errors['equipment.recallNumber']}</p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={equipment.dueDate}
                                    onChange={(e) => handleEquipmentChange('dueDate', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    placeholder="Enter location..."
                                    value={equipment.location}
                                    onChange={(e) => handleEquipmentChange('location', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Barcode Display */}
                        {barcodeValue && equipment.recallNumber && (
                            <div className="mt-6">
                                <Separator className="mb-4" />
                                <div className="flex items-center gap-2 mb-4">
                                    <QrCode className="w-5 h-5" />
                                    <Label className="text-lg font-medium">Generated Barcode</Label>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="border rounded p-4 bg-white">
                                        <Barcode value={barcodeValue} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Recall Number: <strong>{equipment.recallNumber}</strong>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            This barcode will be used to track the equipment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EquipmentTab;
