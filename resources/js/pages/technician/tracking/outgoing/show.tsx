import React from 'react';
import { Head } from '@inertiajs/react';
import TechnicianLayout from '@/layouts/technician-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Building,
    FileText,
    CheckCircle,
    AlertCircle,
    XCircle,
    Settings
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';

interface TrackOutgoing {
    id: number;
    status: string;
    date_out: string;
    cal_date: string;
    cal_due_date: string;
    recall_number: string;
    overdue: number;
    cycle_time: number;
    picked_up_at?: string;
    notes?: string;
    track_incoming: {
        recall_number: string;
        description: string;
        serial_number: string;
        model: string;
        manufacturer: string;
        date_in: string;
        due_date: string;
        employee_in: {
            name: string;
            employee_id: string;
            department: {
                department_name: string;
            };
        };
    };
    employee_out?: {
        name: string;
        employee_id: string;
        department: {
            department_name: string;
        };
    };
    technician: {
        name: string;
        employee_id: string;
    };
    released_by: {
        name: string;
        employee_id: string;
    };
}

interface TrackOutgoingShowProps {
    record: TrackOutgoing;
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed':
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'for_pickup':
            return <AlertCircle className="h-5 w-5 text-yellow-500" />;
        default:
            return <XCircle className="h-5 w-5 text-red-500" />;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed':
            return <Badge variant="success" className="text-base px-3 py-1">Completed</Badge>;
        case 'for_pickup':
            return <Badge variant="warning" className="text-base px-3 py-1">For Pickup</Badge>;
        default:
            return <Badge variant="destructive" className="text-base px-3 py-1">Unknown</Badge>;
    }
};

const TrackOutgoingShow: React.FC<TrackOutgoingShowProps> = ({ record }) => {
    const handleGoBack = () => {
        router.get(route('technician.tracking.outgoing.index'));
    };

    return (
        <TechnicianLayout>
            <Head title={`Outgoing Equipment - ${record.track_incoming.recall_number}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={handleGoBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to List
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Outgoing Equipment Details
                            </h1>
                            <p className="text-sm text-gray-600">
                                Recall Number: {record.track_incoming.recall_number}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {getStatusIcon(record.status)}
                        {getStatusBadge(record.status)}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Equipment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Equipment Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Description</label>
                                <p className="text-base font-medium">{record.track_incoming.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                                    <p className="text-base">{record.track_incoming.manufacturer}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Model</label>
                                    <p className="text-base">{record.track_incoming.model}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Serial Number</label>
                                <p className="text-base font-mono">{record.track_incoming.serial_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Recall Number</label>
                                <p className="text-base font-mono">{record.track_incoming.recall_number}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Process Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Process Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Date Received</label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <p className="text-base">
                                            {format(new Date(record.track_incoming.date_in), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Calibration Date</label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <p className="text-base">
                                            {record.cal_date ? format(new Date(record.cal_date), 'MMM dd, yyyy') : 'Not set'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Original Due Date</label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <p className="text-base">
                                            {format(new Date(record.track_incoming.due_date), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Next Cal Due Date</label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <p className="text-base">
                                            {record.cal_due_date ? format(new Date(record.cal_due_date), 'MMM dd, yyyy') : 'Not set'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Cycle Time</label>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <p className="text-base">
                                            {record.cycle_time || 0} days
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Overdue</label>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <p className={`text-base ${record.overdue > 0 ? 'text-red-600 font-medium' : ''}`}>
                                            {record.overdue || 0} days
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personnel Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Personnel Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Equipment Received By</label>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-base font-medium">{record.track_incoming.employee_in.name}</p>
                                        <p className="text-sm text-gray-500">
                                            ID: {record.track_incoming.employee_in.employee_id} •
                                            {record.track_incoming.employee_in.department.department_name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Technician (You)</label>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-400" />
                                    <div>
                                        <p className="text-base font-medium text-blue-600">{record.technician.name}</p>
                                        <p className="text-sm text-gray-500">
                                            ID: {record.technician.employee_id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Released By</label>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-base font-medium">{record.released_by.name}</p>
                                        <p className="text-sm text-gray-500">
                                            ID: {record.released_by.employee_id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {record.employee_out && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Picked Up By</label>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-green-400" />
                                        <div>
                                            <p className="text-base font-medium text-green-600">{record.employee_out.name}</p>
                                            <p className="text-sm text-gray-500">
                                                ID: {record.employee_out.employee_id} •
                                                {record.employee_out.department.department_name}
                                            </p>
                                            {record.picked_up_at && (
                                                <p className="text-xs text-gray-400">
                                                    Picked up: {format(new Date(record.picked_up_at), 'MMM dd, yyyy HH:mm')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Additional Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Additional Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Current Status</label>
                                <div className="flex items-center gap-3 mt-1">
                                    {getStatusIcon(record.status)}
                                    {getStatusBadge(record.status)}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Date Released</label>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <p className="text-base">
                                        {format(new Date(record.date_out), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                            </div>
                            {record.notes && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Notes</label>
                                    <p className="text-base bg-gray-50 p-3 rounded-md">
                                        {record.notes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TechnicianLayout>
    );
};

export default TrackOutgoingShow;
