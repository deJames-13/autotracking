import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Package, Calendar, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ConfirmationTabProps {
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

const ConfirmationTab: React.FC<ConfirmationTabProps> = ({
    data,
    onChange,
    errors = {},
    requestType
}) => {
    const employee = data.employee || data.receivedBy || data.scannedEmployee;
    const equipment = data.equipment || {};
    const technician = data.technician;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Request Confirmation
                    </CardTitle>
                    <CardDescription>
                        Please review the details below before submitting the request
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Request Type */}
                        <div>
                            <Label className="text-lg font-medium">Request Type</Label>
                            <div className="mt-2">
                                <Badge variant={requestType === 'new' ? 'default' : 'secondary'} className="text-base">
                                    {requestType === 'new' ? 'New Equipment Request' : 'Routine Equipment Request'}
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        {/* Technician Information */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-5 h-5 text-blue-600" />
                                <Label className="text-lg font-medium">Technician Information</Label>
                            </div>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Name</Label>
                                            <p className="text-sm">
                                                {technician?.first_name} {technician?.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Employee ID</Label>
                                            <p className="text-sm">{technician?.employee_id}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Email</Label>
                                            <p className="text-sm">{technician?.email}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Role</Label>
                                            <Badge variant="outline">
                                                {technician?.role?.role_name || 'Technician'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Separator />

                        {/* Employee Information */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-5 h-5 text-green-600" />
                                <Label className="text-lg font-medium">Receiving Employee</Label>
                            </div>
                            {employee ? (
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Name</Label>
                                                <p className="text-sm">
                                                    {employee.first_name} {employee.last_name}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Employee ID</Label>
                                                <p className="text-sm">{employee.employee_id}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Email</Label>
                                                <p className="text-sm">{employee.email}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Role</Label>
                                                <Badge variant="outline">
                                                    {employee.role?.role_name || 'Employee'}
                                                </Badge>
                                            </div>
                                            {employee.department && (
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Department</Label>
                                                    <p className="text-sm">{employee.department.department_name}</p>
                                                </div>
                                            )}
                                            {employee.plant && (
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Plant</Label>
                                                    <p className="text-sm">{employee.plant.plant_name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="p-4 border border-red-200 rounded-md bg-red-50">
                                    <p className="text-red-800 text-sm">No employee selected</p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Equipment Information */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="w-5 h-5 text-purple-600" />
                                <Label className="text-lg font-medium">Equipment Details</Label>
                            </div>
                            {equipment && Object.keys(equipment).length > 0 ? (
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <Label className="text-sm font-medium text-gray-600">Description</Label>
                                                <p className="text-sm">{equipment.description || 'Not specified'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Manufacturer</Label>
                                                <p className="text-sm">{equipment.manufacturer || 'Not specified'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Model</Label>
                                                <p className="text-sm">{equipment.model || 'Not specified'}</p>
                                            </div>
                                            {requestType === 'new' && equipment.serialNumber && (
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Serial Number</Label>
                                                    <p className="text-sm font-mono">{equipment.serialNumber}</p>
                                                </div>
                                            )}
                                            {requestType === 'routine' && equipment.recallNumber && (
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Recall Number</Label>
                                                    <p className="text-sm font-mono">{equipment.recallNumber}</p>
                                                </div>
                                            )}
                                            {equipment.location && (
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Location</Label>
                                                    <p className="text-sm">{equipment.location}</p>
                                                </div>
                                            )}
                                            {equipment.dueDate && (
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Due Date</Label>
                                                    <p className="text-sm">
                                                        {new Date(equipment.dueDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="p-4 border border-red-200 rounded-md bg-red-50">
                                    <p className="text-red-800 text-sm">No equipment details provided</p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Request Summary */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-5 h-5 text-orange-600" />
                                <Label className="text-lg font-medium">Request Summary</Label>
                            </div>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Request Type:</span>
                                            <Badge variant={requestType === 'new' ? 'default' : 'secondary'}>
                                                {requestType === 'new' ? 'New' : 'Routine'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Technician:</span>
                                            <span className="text-sm">
                                                {technician?.first_name} {technician?.last_name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Receiving Employee:</span>
                                            <span className="text-sm">
                                                {employee ? `${employee.first_name} ${employee.last_name}` : 'Not selected'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Equipment:</span>
                                            <span className="text-sm">
                                                {equipment?.description ?
                                                    equipment.description.substring(0, 50) + (equipment.description.length > 50 ? '...' : '')
                                                    : 'Not specified'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Date Created:</span>
                                            <span className="text-sm">{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ConfirmationTab;
