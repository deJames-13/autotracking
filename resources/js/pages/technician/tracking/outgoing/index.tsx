import React, { useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import TechnicianLayout from '@/layouts/technician-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Search,
    Eye,
    Filter,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface TrackOutgoingIndexProps {
    filters: {
        search?: string;
        status?: string;
    };
    requests: {
        data: Array<{
            id: number;
            status: string;
            date_out: string;
            cal_date: string;
            cal_due_date: string;
            recall_number: string;
            overdue: number;
            cycle_time: number;
            track_incoming: {
                recall_number: string;
                description: string;
                serial_number: string;
                model: string;
                manufacturer: string;
            };
            employee_out?: {
                name: string;
                employee_id: string;
            };
            technician: {
                name: string;
                employee_id: string;
            };
        }>;
        links: any[];
        meta: any;
    };
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'for_pickup':
            return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        default:
            return <XCircle className="h-4 w-4 text-red-500" />;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed':
            return <Badge variant="success">Completed</Badge>;
        case 'for_pickup':
            return <Badge variant="warning">For Pickup</Badge>;
        default:
            return <Badge variant="destructive">Unknown</Badge>;
    }
};

const TrackOutgoingIndex: React.FC<TrackOutgoingIndexProps> = ({
    filters,
    requests
}) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = useCallback(() => {
        router.get(route('technician.tracking.outgoing.index'), {
            search: searchTerm,
            status: statusFilter
        }, {
            preserveState: true,
            replace: true
        });
    }, [searchTerm, statusFilter]);

    const handleClearFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('');
        router.get(route('technician.tracking.outgoing.index'), {}, {
            preserveState: true,
            replace: true
        });
    }, []);

    const handleViewRecord = (id: number) => {
        router.get(route('technician.tracking.outgoing.show', id));
    };

    return (
        <TechnicianLayout>
            <Head title="Outgoing Tracking - Technician" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Outgoing Equipment</h1>
                        <p className="text-sm text-gray-600">
                            View equipment you've processed and released
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by recall number, description, serial number..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                            </div>
                            <div className="w-full sm:w-48">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Status</SelectItem>
                                        <SelectItem value="for_pickup">For Pickup</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSearch}>
                                    Search
                                </Button>
                                <Button variant="outline" onClick={handleClearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Equipment Records ({requests.meta?.total || 0})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {requests.data.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-gray-500">
                                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium">No records found</h3>
                                    <p>No outgoing equipment records match your search criteria.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Recall Number</TableHead>
                                            <TableHead>Equipment</TableHead>
                                            <TableHead>Cal Date</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Released To</TableHead>
                                            <TableHead>Cycle Time</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.data.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(request.status)}
                                                        {getStatusBadge(request.status)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {request.track_incoming.recall_number}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {request.track_incoming.description}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {request.track_incoming.manufacturer} {request.track_incoming.model}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            S/N: {request.track_incoming.serial_number}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {request.cal_date ? (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(request.cal_date), 'MMM dd, yyyy')}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">Not set</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {request.cal_due_date ? (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(request.cal_due_date), 'MMM dd, yyyy')}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">Not set</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {request.employee_out ? (
                                                        <div>
                                                            <div className="font-medium">{request.employee_out.name}</div>
                                                            <div className="text-xs text-gray-500">
                                                                ID: {request.employee_out.employee_id}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline">Pending Pickup</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-center">
                                                        <div className="font-medium">{request.cycle_time || 0}</div>
                                                        <div className="text-xs text-gray-500">days</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewRecord(request.id)}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TechnicianLayout>
    );
};

export default TrackOutgoingIndex;
