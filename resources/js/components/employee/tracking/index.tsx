import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TrackingRequest {
    id: number;
    recall_number: string;
    equipment_description: string;
    technician_name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    due_date?: string;
}

interface EmployeeTrackingProps {
    recentRequests: TrackingRequest[];
    availableEquipment: any[];
}

const EmployeeTracking: React.FC<EmployeeTrackingProps> = ({
    recentRequests = [],
    availableEquipment = []
}) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-4 w-4" />;
            case 'in_progress':
                return <Clock className="h-4 w-4 text-blue-500" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout>
            <Head title="Equipment Tracking" />

            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Equipment Tracking</h1>
                        <p className="text-muted-foreground">Manage your calibration requests and equipment</p>
                    </div>
                    <Link href={route('employee.tracking.request.index')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Request
                        </Button>
                    </Link>
                </div>

                <Tabs defaultValue="requests" className="w-full">
                    <TabsList>
                        <TabsTrigger value="requests">My Requests</TabsTrigger>
                        <TabsTrigger value="equipment">Available Equipment</TabsTrigger>
                    </TabsList>

                    <TabsContent value="requests" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Calibration Requests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentRequests.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentRequests.map((request) => (
                                            <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex items-center space-x-4">
                                                    {getStatusIcon(request.status)}
                                                    <div>
                                                        <h3 className="font-medium">{request.recall_number}</h3>
                                                        <p className="text-sm text-muted-foreground">{request.equipment_description}</p>
                                                        <p className="text-xs text-muted-foreground">Technician: {request.technician_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge className={getStatusColor(request.status)}>
                                                        {request.status.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                    <div className="text-right text-sm text-muted-foreground">
                                                        <p>Submitted: {new Date(request.created_at).toLocaleDateString()}</p>
                                                        {request.due_date && (
                                                            <p>Due: {new Date(request.due_date).toLocaleDateString()}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">No calibration requests found.</p>
                                        <Link href={route('employee.tracking.request.index')}>
                                            <Button className="mt-4">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Your First Request
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="equipment" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Equipment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {availableEquipment.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {availableEquipment.map((equipment) => (
                                            <div key={equipment.id} className="p-4 border rounded-lg">
                                                <h3 className="font-medium">{equipment.description}</h3>
                                                <p className="text-sm text-muted-foreground">{equipment.serial_number}</p>
                                                <p className="text-xs text-muted-foreground">{equipment.manufacturer} {equipment.model}</p>
                                                <Badge className="mt-2" variant={equipment.status === 'available' ? 'default' : 'secondary'}>
                                                    {equipment.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">No equipment available.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
};

export default EmployeeTracking;
