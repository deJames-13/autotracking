import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Clock, MapPin, User, Calendar, CheckCircle, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface Equipment {
    equipment_id: number;
    serial_number: string;
    description: string;
    manufacturer?: string;
    model?: string;
    track_incoming: TrackingRecord[];
}

interface TrackingRecord {
    tracking_id: number;
    date_out?: string;
    date_in?: string;
    cal_due_date?: string;
    location?: {
        location_name: string;
    };
    employee_in?: {
        first_name: string;
        last_name: string;
    };
    employee_out?: {
        first_name: string;
        last_name: string;
    };
    technician?: {
        first_name: string;
        last_name: string;
    };
    notes?: string;
}

interface Location {
    location_id: number;
    location_name: string;
}

interface EquipmentDetailProps {
    equipment: Equipment;
    locations: Location[];
}

const EquipmentDetail: React.FC<EquipmentDetailProps> = ({ equipment, locations }) => {
    const [checkInDialog, setCheckInDialog] = useState(false);
    const [checkOutDialog, setCheckOutDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Equipment Tracking',
            href: '/employee/tracking',
        },
        {
            title: equipment.description,
            href: `/employee/tracking/equipment/${equipment.equipment_id}`,
        },
    ];

    const checkInForm = useForm({
        location_id: '',
        pin: '',
    });

    const checkOutForm = useForm({
        location_id: '',
        pin: '',
        notes: '',
    });

    const latestRecord = equipment.track_incoming[0];
    const isCheckedOut = latestRecord && latestRecord.date_out && !latestRecord.date_in;

    const handleCheckIn = () => {
        checkInForm.post(route('employee.tracking.equipment.check-in', equipment.equipment_id), {
            onSuccess: () => {
                setCheckInDialog(false);
                checkInForm.reset();
            }
        });
    };

    const handleCheckOut = () => {
        checkOutForm.post(route('employee.tracking.equipment.check-out', equipment.equipment_id), {
            onSuccess: () => {
                setCheckOutDialog(false);
                checkOutForm.reset();
            }
        });
    };

    const getStatusBadge = () => {
        if (!latestRecord) {
            return <Badge variant="secondary">No Activity</Badge>;
        }

        if (latestRecord.date_out && !latestRecord.date_in) {
            return <Badge variant="destructive">Checked Out</Badge>;
        }

        if (latestRecord.date_in) {
            return <Badge variant="default">Checked In</Badge>;
        }

        return <Badge variant="default">Active</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Equipment: ${equipment.description}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <a href={route('employee.tracking.index')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Tracking
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{equipment.description}</h1>
                        <p className="text-muted-foreground">Serial Number: {equipment.serial_number}</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        {/* Equipment Details */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Equipment Information</CardTitle>
                                    {getStatusBadge()}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">Serial Number</Label>
                                        <p className="text-sm text-muted-foreground">{equipment.serial_number}</p>
                                    </div>
                                    {equipment.manufacturer && (
                                        <div>
                                            <Label className="text-sm font-medium">Manufacturer</Label>
                                            <p className="text-sm text-muted-foreground">{equipment.manufacturer}</p>
                                        </div>
                                    )}
                                    {equipment.model && (
                                        <div>
                                            <Label className="text-sm font-medium">Model</Label>
                                            <p className="text-sm text-muted-foreground">{equipment.model}</p>
                                        </div>
                                    )}
                                    {latestRecord?.cal_due_date && (
                                        <div>
                                            <Label className="text-sm font-medium">Due Date</Label>
                                            <p className={`text-sm ${new Date(latestRecord.cal_due_date) < new Date() ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                {format(new Date(latestRecord.cal_due_date), 'MMM dd, yyyy')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tracking History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tracking History</CardTitle>
                                <CardDescription>Complete history of this equipment's tracking records</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {equipment.track_incoming.length > 0 ? (
                                    <div className="space-y-4">
                                        {equipment.track_incoming.map(record => (
                                            <div key={record.tracking_id} className="border rounded-md p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        {record.date_in ? (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <LogOut className="h-4 w-4 text-blue-500" />
                                                        )}
                                                        <span className="font-medium">
                                                            {record.date_in ? 'Checked In' : 'Checked Out'}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline">
                                                        {record.date_in
                                                            ? format(new Date(record.date_in), 'MMM dd, yyyy HH:mm')
                                                            : format(new Date(record.date_out!), 'MMM dd, yyyy HH:mm')
                                                        }
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    {record.location && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-muted-foreground">Location:</span>
                                                            <span>{record.location.location_name}</span>
                                                        </div>
                                                    )}

                                                    {((record.date_in && record.employee_in) || (record.date_out && record.employee_out)) && (
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-muted-foreground">By:</span>
                                                            <span>
                                                                {record.date_in
                                                                    ? `${record.employee_in?.first_name} ${record.employee_in?.last_name}`
                                                                    : `${record.employee_out?.first_name} ${record.employee_out?.last_name}`
                                                                }
                                                            </span>
                                                        </div>
                                                    )}

                                                    {record.cal_due_date && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-muted-foreground">Due Date:</span>
                                                            <span>{format(new Date(record.cal_due_date), 'MMM dd, yyyy')}</span>
                                                        </div>
                                                    )}

                                                    {record.technician && (
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-muted-foreground">Technician:</span>
                                                            <span>{record.technician.first_name} {record.technician.last_name}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {record.notes && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <span className="text-sm text-muted-foreground">Notes:</span>
                                                        <p className="text-sm mt-1">{record.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">
                                        No tracking records found for this equipment.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions Panel */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                                <CardDescription>Manage equipment tracking status</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isCheckedOut ? (
                                    <Dialog open={checkInDialog} onOpenChange={setCheckInDialog}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full">
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Check In Equipment
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Check In Equipment</DialogTitle>
                                                <DialogDescription>
                                                    Confirm the location and enter your PIN to check in this equipment.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="checkin-location">Location</Label>
                                                    <Select
                                                        value={checkInForm.data.location_id}
                                                        onValueChange={(value) => checkInForm.setData('location_id', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select location" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {locations.map(location => (
                                                                <SelectItem key={location.location_id} value={location.location_id.toString()}>
                                                                    {location.location_name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {checkInForm.errors.location_id && (
                                                        <p className="text-sm text-destructive mt-1">{checkInForm.errors.location_id}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="checkin-pin">Your PIN</Label>
                                                    <Input
                                                        id="checkin-pin"
                                                        type="password"
                                                        value={checkInForm.data.pin}
                                                        onChange={(e) => checkInForm.setData('pin', e.target.value)}
                                                        placeholder="Enter your PIN"
                                                    />
                                                    {checkInForm.errors.pin && (
                                                        <p className="text-sm text-destructive mt-1">{checkInForm.errors.pin}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setCheckInDialog(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleCheckIn} disabled={checkInForm.processing}>
                                                    Check In
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <Dialog open={checkOutDialog} onOpenChange={setCheckOutDialog}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full">
                                                <LogOut className="h-4 w-4 mr-2" />
                                                Check Out Equipment
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Check Out Equipment</DialogTitle>
                                                <DialogDescription>
                                                    Confirm the location and enter your PIN to check out this equipment.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="checkout-location">Location</Label>
                                                    <Select
                                                        value={checkOutForm.data.location_id}
                                                        onValueChange={(value) => checkOutForm.setData('location_id', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select location" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {locations.map(location => (
                                                                <SelectItem key={location.location_id} value={location.location_id.toString()}>
                                                                    {location.location_name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {checkOutForm.errors.location_id && (
                                                        <p className="text-sm text-destructive mt-1">{checkOutForm.errors.location_id}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="checkout-notes">Notes (Optional)</Label>
                                                    <Textarea
                                                        id="checkout-notes"
                                                        value={checkOutForm.data.notes}
                                                        onChange={(e) => checkOutForm.setData('notes', e.target.value)}
                                                        placeholder="Add any notes about this checkout..."
                                                        rows={3}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="checkout-pin">Your PIN</Label>
                                                    <Input
                                                        id="checkout-pin"
                                                        type="password"
                                                        value={checkOutForm.data.pin}
                                                        onChange={(e) => checkOutForm.setData('pin', e.target.value)}
                                                        placeholder="Enter your PIN"
                                                    />
                                                    {checkOutForm.errors.pin && (
                                                        <p className="text-sm text-destructive mt-1">{checkOutForm.errors.pin}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setCheckOutDialog(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleCheckOut} disabled={checkOutForm.processing}>
                                                    Check Out
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                <div className="pt-4 border-t">
                                    <p className="text-xs text-muted-foreground text-center">
                                        PIN verification required for all actions
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default EquipmentDetail;
