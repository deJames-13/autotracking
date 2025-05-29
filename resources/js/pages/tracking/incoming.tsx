import { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Scan, Plus, Clock, User as UserIcon, MapPin, Calendar, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type User, type Location, type Equipment, type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tracking', href: '/tracking' },
    { title: 'Incoming', href: '/tracking/incoming' },
];

interface IncomingProps {
    users: User[];
    locations: Location[];
}

export default function TrackingIncoming({ users, locations }: IncomingProps) {
    const [scannedEquipment, setScannedEquipment] = useState<Equipment | null>(null);
    const [scannedEmployee, setScannedEmployee] = useState<User | null>(null);
    const [isNewRegistration, setIsNewRegistration] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [cycleStartTime] = useState(new Date());

    const { data, setData, post, processing, errors, reset } = useForm({
        equipment_id: '',
        technician_id: '',
        location_id: '',
        cal_date: new Date().toISOString().split('T')[0],
        cal_due_date: '',
        description: '',
        recall_number: '',
        is_new_registration: false,
        serial_number: '',
        manufacturer: '',
        equipment_scan: '',
        employee_scan: '',
    });

    const handleEquipmentScan = async () => {
        if (!data.equipment_scan) return;

        try {
            const response = await fetch('/tracking/scan-equipment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ code: data.equipment_scan }),
            });

            const result = await response.json();

            if (result.success) {
                setScannedEquipment(result.data);
                setData(prev => ({
                    ...prev,
                    equipment_id: result.data.equipment_id,
                    description: result.data.description,
                    manufacturer: result.data.manufacturer,
                }));
                setCurrentStep(2);
            } else {
                // Equipment not found - offer new registration
                setIsNewRegistration(true);
                setData(prev => ({
                    ...prev,
                    serial_number: data.equipment_scan,
                    is_new_registration: true,
                }));
            }
        } catch (error) {
            console.error('Error scanning equipment:', error);
        }
    };

    const handleEmployeeScan = async () => {
        if (!data.employee_scan) return;

        try {
            const response = await fetch('/tracking/scan-employee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ code: data.employee_scan }),
            });

            const result = await response.json();

            if (result.success) {
                setScannedEmployee(result.data);
                setData(prev => ({
                    ...prev,
                    technician_id: result.data.employee_id,
                }));

                // Auto-fill location based on employee's department
                const userLocation = locations.find(loc => loc.department_id === result.data.department_id);
                if (userLocation) {
                    setData(prev => ({
                        ...prev,
                        location_id: userLocation.location_id.toString(),
                    }));
                }

                setCurrentStep(3);
            }
        } catch (error) {
            console.error('Error scanning employee:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tracking/incoming', {
            onSuccess: () => {
                reset();
                setScannedEquipment(null);
                setScannedEmployee(null);
                setCurrentStep(1);
                setIsNewRegistration(false);
            },
        });
    };

    const stepIndicators = [
        { step: 1, title: 'Scan Equipment', icon: Scan },
        { step: 2, title: 'Assign Technician', icon: UserIcon },
        { step: 3, title: 'Set Details', icon: FileText },
        { step: 4, title: 'Submit', icon: Plus },
    ];

    const renderWorkflowForm = () => {
        return (
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Equipment Scan */}
                {currentStep >= 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Scan className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">
                                {isNewRegistration ? 'Enter Serial Number' : 'Scan Equipment'}
                            </h3>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder={isNewRegistration ? 'Enter serial number' : 'Scan or enter equipment code'}
                                value={data.equipment_scan}
                                onChange={(e) => setData('equipment_scan', e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" onClick={handleEquipmentScan}>
                                <Scan className="h-4 w-4 mr-2" />
                                Scan
                            </Button>
                        </div>

                        {scannedEquipment && (
                            <Alert>
                                <AlertDescription>
                                    Equipment found: {scannedEquipment.description} ({scannedEquipment.serial_number})
                                </AlertDescription>
                            </Alert>
                        )}

                        {isNewRegistration && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="manufacturer">Manufacturer *</Label>
                                    <Input
                                        id="manufacturer"
                                        value={data.manufacturer}
                                        onChange={(e) => setData('manufacturer', e.target.value)}
                                        required
                                    />
                                    {errors.manufacturer && (
                                        <span className="text-sm text-destructive">{errors.manufacturer}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Technician Assignment */}
                {currentStep >= 2 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">Scan Employee / Assign Technician</h3>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Scan employee barcode or ID"
                                value={data.employee_scan}
                                onChange={(e) => setData('employee_scan', e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" onClick={handleEmployeeScan}>
                                <Scan className="h-4 w-4 mr-2" />
                                Scan
                            </Button>
                        </div>

                        {scannedEmployee && (
                            <Alert>
                                <AlertDescription>
                                    Employee: {scannedEmployee.first_name} {scannedEmployee.last_name}
                                    {scannedEmployee.department && ` - ${scannedEmployee.department.department_name}`}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div>
                            <Label htmlFor="technician_id">Technician Assignment *</Label>
                            <Select value={data.technician_id} onValueChange={(value) => setData('technician_id', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select technician" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.filter(user => user.role?.role_name === 'technician').map((user) => (
                                        <SelectItem key={user.employee_id} value={user.employee_id.toString()}>
                                            {user.first_name} {user.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.technician_id && (
                                <span className="text-sm text-destructive">{errors.technician_id}</span>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="location_id">Location *</Label>
                            <Select value={data.location_id} onValueChange={(value) => setData('location_id', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((location) => (
                                        <SelectItem key={location.location_id} value={location.location_id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                {location.location_name}
                                                {location.department && (
                                                    <Badge variant="secondary">{location.department.department_name}</Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.location_id && (
                                <span className="text-sm text-destructive">{errors.location_id}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Details */}
                {currentStep >= 3 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">Calibration Details</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="cal_date">Calibration Date *</Label>
                                <Input
                                    id="cal_date"
                                    type="date"
                                    value={data.cal_date}
                                    onChange={(e) => setData('cal_date', e.target.value)}
                                    required
                                />
                                {errors.cal_date && (
                                    <span className="text-sm text-destructive">{errors.cal_date}</span>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="cal_due_date">Calibration Due Date *</Label>
                                <Input
                                    id="cal_due_date"
                                    type="date"
                                    value={data.cal_due_date}
                                    onChange={(e) => setData('cal_due_date', e.target.value)}
                                    required
                                />
                                {errors.cal_due_date && (
                                    <span className="text-sm text-destructive">{errors.cal_due_date}</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description of the Tool *</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Enter tool description"
                                required
                            />
                            {errors.description && (
                                <span className="text-sm text-destructive">{errors.description}</span>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="recall_number">Recall Number (if applicable)</Label>
                            <Input
                                id="recall_number"
                                value={data.recall_number}
                                onChange={(e) => setData('recall_number', e.target.value)}
                                placeholder="Enter recall number if applicable"
                            />
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                    >
                        Previous
                    </Button>

                    {currentStep < 4 ? (
                        <Button
                            type="button"
                            onClick={() => setCurrentStep(currentStep + 1)}
                            disabled={
                                (currentStep === 1 && !data.equipment_scan) ||
                                (currentStep === 2 && !data.technician_id) ||
                                (currentStep === 3 && (!data.cal_date || !data.cal_due_date || !data.description))
                            }
                        >
                            Next
                        </Button>
                    ) : (
                        <Button type="submit" disabled={processing}>
                            <Plus className="h-4 w-4 mr-2" />
                            {processing ? 'Processing...' : 'Add to Incoming'}
                        </Button>
                    )}
                </div>
            </form>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incoming Equipment" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Incoming Equipment</h1>
                        <p className="text-muted-foreground">
                            Process incoming equipment for calibration
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm text-muted-foreground">
                            Started: {cycleStartTime.toLocaleTimeString()}
                        </span>
                    </div>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-4 mb-6">
                    {stepIndicators.map((indicator, index) => {
                        const Icon = indicator.icon;
                        const isActive = currentStep === indicator.step;
                        const isCompleted = currentStep > indicator.step;

                        return (
                            <div key={indicator.step} className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' :
                                        isCompleted ? 'bg-green-100 text-green-700' :
                                            'bg-muted text-muted-foreground'
                                    }`}>
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{indicator.title}</span>
                                </div>
                                {index < stepIndicators.length - 1 && (
                                    <div className={`w-8 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-muted'
                                        }`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <Tabs value={isNewRegistration ? 'new' : 'routine'} className="w-full">
                    <TabsList>
                        <TabsTrigger value="routine">Routine Schedule</TabsTrigger>
                        <TabsTrigger value="new">Newly Registered</TabsTrigger>
                    </TabsList>

                    <TabsContent value="routine" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Routine Calibration Process</CardTitle>
                                <CardDescription>
                                    Process existing equipment for routine calibration
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderWorkflowForm()}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="new" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>New Equipment Registration</CardTitle>
                                <CardDescription>
                                    Register and process new equipment for calibration
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderWorkflowForm()}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
