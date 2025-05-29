import { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Scan,
    Download,
    Clock,
    User as UserIcon,
    MapPin,
    Calendar,
    FileText,
    CheckCircle,
    ArrowRight
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type User, type TrackingRecord, type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tracking', href: '/tracking' },
    { title: 'Outgoing', href: '/tracking/outgoing' },
];

interface OutgoingProps {
    trackingRecords: {
        data: TrackingRecord[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

export default function TrackingOutgoing({ trackingRecords }: OutgoingProps) {
    const [selectedRecord, setSelectedRecord] = useState<TrackingRecord | null>(null);
    const [scannedEmployee, setScannedEmployee] = useState<User | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    const { data, setData, post, processing, errors, reset } = useForm({
        next_cal_due_date: '',
        description: '',
        recall_number: '',
        employee_scan: '',
    });

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
                setCurrentStep(3);
            }
        } catch (error) {
            console.error('Error scanning employee:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecord) return;

        post(`/tracking/outgoing/${selectedRecord.tracking_id}`, {
            onSuccess: () => {
                reset();
                setSelectedRecord(null);
                setScannedEmployee(null);
                setCurrentStep(1);
                router.reload();
            },
        });
    };

    const handleGeneratePdf = (record: TrackingRecord) => {
        window.open(`/tracking/pdf/${record.tracking_id}`, '_blank');
    };

    const calculateCycleTime = (dateIn: string) => {
        const startDate = new Date(dateIn);
        const currentDate = new Date();
        const diffInHours = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
        return diffInHours;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Outgoing Equipment" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Outgoing Equipment</h1>
                        <p className="text-muted-foreground">
                            Process outgoing equipment after calibration
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Equipment Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Equipment to Release</CardTitle>
                            <CardDescription>
                                Choose equipment that has completed calibration
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {trackingRecords.data.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No equipment ready for release
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {trackingRecords.data.map((record) => (
                                        <div
                                            key={record.tracking_id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedRecord?.tracking_id === record.tracking_id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:bg-muted/50'
                                                }`}
                                            onClick={() => {
                                                setSelectedRecord(record);
                                                setData('description', record.description);
                                                setCurrentStep(2);
                                            }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="font-medium">
                                                        {record.equipment?.serial_number}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {record.equipment?.description}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <UserIcon className="h-3 w-3" />
                                                            {record.technician?.first_name} {record.technician?.last_name}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {record.location?.location_name}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {calculateCycleTime(record.date_in)}h
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge variant={
                                                        new Date(record.cal_due_date) < new Date()
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }>
                                                        Due: {new Date(record.cal_due_date).toLocaleDateString()}
                                                    </Badge>
                                                    {record.recall && (
                                                        <Badge variant="outline">Recall</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Release Process */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Release Process</CardTitle>
                            <CardDescription>
                                Complete the outgoing process
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!selectedRecord ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <ArrowRight className="h-8 w-8 mx-auto mb-2" />
                                    Select equipment from the list to begin release process
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Step 1: Equipment Selected */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <h3 className="text-lg font-semibold">Equipment Selected</h3>
                                        </div>

                                        <Alert>
                                            <AlertDescription>
                                                <strong>{selectedRecord.equipment?.serial_number}</strong><br />
                                                {selectedRecord.equipment?.description}<br />
                                                Cycle Time: {calculateCycleTime(selectedRecord.date_in)} hours
                                            </AlertDescription>
                                        </Alert>
                                    </div>

                                    {/* Step 2: Employee Scan */}
                                    {currentStep >= 2 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-5 w-5" />
                                                <h3 className="text-lg font-semibold">Scan Releasing Employee</h3>
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
                                                        Releasing Employee: {scannedEmployee.first_name} {scannedEmployee.last_name}
                                                        {scannedEmployee.department && ` - ${scannedEmployee.department.department_name}`}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    )}

                                    {/* Step 3: Release Details */}
                                    {currentStep >= 3 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                <h3 className="text-lg font-semibold">Release Details</h3>
                                            </div>

                                            <div>
                                                <Label htmlFor="next_cal_due_date">Next Calibration Due Date *</Label>
                                                <Input
                                                    id="next_cal_due_date"
                                                    type="date"
                                                    value={data.next_cal_due_date}
                                                    onChange={(e) => setData('next_cal_due_date', e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    required
                                                />
                                                {errors.next_cal_due_date && (
                                                    <span className="text-sm text-destructive">{errors.next_cal_due_date}</span>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="description">Updated Description *</Label>
                                                <Textarea
                                                    id="description"
                                                    value={data.description}
                                                    onChange={(e) => setData('description', e.target.value)}
                                                    placeholder="Update tool description if needed"
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

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-4">
                                        {currentStep === 3 && (
                                            <>
                                                <Button type="submit" disabled={processing}>
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    {processing ? 'Processing...' : 'Release Equipment'}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => handleGeneratePdf(selectedRecord)}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export PDF
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
