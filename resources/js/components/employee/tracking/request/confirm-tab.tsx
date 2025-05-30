import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User } from '@/types';
import axios from 'axios';

interface ConfirmData {
    technician: any;
    requestType: string;
    equipment: any;
    registration: any;
    employee: any;
    receivedBy: User | null;
}

interface EmployeeConfirmTabProps {
    data: ConfirmData;
    onChange: (receivedBy: User | null) => void;
    errors: Record<string, string>;
}

const EmployeeConfirmTab: React.FC<EmployeeConfirmTabProps> = ({ data, onChange, errors = {} }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Generate recall number
    const recallNumber = `RCL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Fetch users for "Received By"
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/admin/users', {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                setUsers(response.data.data.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleReceivedByChange = (userId: string) => {
        const selectedUser = users.find(u => u.user_id.toString() === userId);
        onChange(selectedUser || null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Request Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-medium">Recall Number</h4>
                            <p>{recallNumber}</p>
                        </div>

                        <div>
                            <h4 className="font-medium">Request Type</h4>
                            <p className="capitalize">{data.requestType}</p>
                        </div>

                        <div>
                            <h4 className="font-medium">Technician</h4>
                            <p>{data.technician?.full_name || data.technician?.first_name + ' ' + data.technician?.last_name}</p>
                        </div>

                        <div>
                            <h4 className="font-medium">Registration Date</h4>
                            <p>{data.registration?.registrationDate}</p>
                        </div>

                        <div>
                            <h4 className="font-medium">Equipment</h4>
                            <p>{data.equipment?.description}</p>
                            <p className="text-sm text-muted-foreground">
                                {data.equipment?.manufacturer} {data.equipment?.model}
                                {data.equipment?.serialNumber && ` (S/N: ${data.equipment.serialNumber})`}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium">Employee</h4>
                            <p>ID: {data.employee?.employeeId}</p>
                            <p className="text-sm text-muted-foreground">
                                {data.employee?.department} - {data.employee?.location}
                            </p>
                        </div>
                    </div>

                    {/* Received By */}
                    <div className="border-t pt-6">
                        <div>
                            <Label htmlFor="receivedBy" className={errors.receivedBy ? 'text-destructive' : ''}>
                                Received By *
                            </Label>
                            <Select
                                value={data.receivedBy?.user_id?.toString() || ''}
                                onValueChange={handleReceivedByChange}
                            >
                                <SelectTrigger className={errors.receivedBy ? 'border-destructive' : ''}>
                                    <SelectValue placeholder="Select who received the equipment" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.user_id} value={user.user_id.toString()}>
                                            {user.full_name || `${user.first_name} ${user.last_name}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.receivedBy && <p className="text-sm text-destructive mt-1">{errors.receivedBy}</p>}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default EmployeeConfirmTab;
