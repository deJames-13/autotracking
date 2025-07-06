import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackOutgoing } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Save, User as UserIcon } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface TrackingOutgoingEditProps {
    trackOutgoing: TrackOutgoing | { data: TrackOutgoing };
}

const TrackingOutgoingEdit: React.FC<TrackingOutgoingEditProps> = ({ trackOutgoing }) => {
    const { canManageRequestIncoming, isAdmin } = useRole();

    // Handle both direct model and resource-wrapped data
    const outgoingData = trackOutgoing.data || trackOutgoing;
    console.log(outgoingData)

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tracking Management',
            href: '/admin/tracking',
        },
        {
            title: 'Outgoing Completions',
            href: '/admin/tracking/outgoing',
        },
        {
            title: outgoingData.track_incoming?.recall_number || outgoingData.incoming_id,
            href: `/admin/tracking/outgoing/${outgoingData.id}`,
        },
        {
            title: 'Edit',
            href: `/admin/tracking/outgoing/${outgoingData.id}/edit`,
        },
    ];

    // Helper function to safely parse and format dates
    const formatDateForInput = (dateValue: string | null | undefined, formatString: string = 'yyyy-MM-dd'): string => {
        if (!dateValue || dateValue === '' || dateValue === 'null') return '';

        try {
            // Since we now format dates properly in the backend resource,
            // we should receive ISO date strings that JavaScript can parse directly
            const date = new Date(dateValue);

            // Check if the date is valid
            if (isNaN(date.getTime())) {
                return '';
            }

            return format(date, formatString);
        } catch (error) {
            return '';
        }
    };

    const { data, setData, processing, errors, reset } = useForm({
        cal_date: formatDateForInput(outgoingData.cal_date),
        cal_due_date: formatDateForInput(outgoingData.cal_due_date),
        date_out: formatDateForInput(outgoingData.date_out, "yyyy-MM-dd'T'HH:mm"),
        cycle_time: outgoingData.cycle_time?.toString() || '',
        ct_reqd: outgoingData.ct_reqd,
        commit_etc: formatDateForInput(outgoingData.commit_etc), // Date field as string
        actual_etc: formatDateForInput(outgoingData.actual_etc), // Date field as string
        overdue: outgoingData.overdue === 1 ? 'yes' : 'no',
        overdue_manual_override: false, // Track if user manually set the overdue value
    });

    // Function to calculate automated overdue based on ct_reqd vs cycle_time
    const calculateAutomatedOverdue = () => {
        const ctReqd = parseInt(data.ct_reqd) || 0;
        const cycleTime = parseInt(data.cycle_time) || 0;
        return ctReqd < cycleTime ? 'yes' : 'no';
    };

    // Effect to automatically update overdue when ct_reqd or cycle_time changes
    useEffect(() => {
        if (!data.overdue_manual_override) {
            const automatedOverdue = calculateAutomatedOverdue();
            if (data.overdue !== automatedOverdue) {
                setData('overdue', automatedOverdue);
            }
        }
    }, [data.ct_reqd, data.cycle_time, data.overdue_manual_override]);

    if (!canManageRequestIncoming()) {
        return null;
    }

    // Prevent editing if equipment has already been picked up (unless user is admin)
    if (outgoingData.status === 'completed' && !isAdmin()) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Edit Outgoing Completion: ${outgoingData.recall_number}`} />
                <div className="space-y-6 p-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/tracking/outgoing/${outgoingData.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Completion Details
                        </Link>
                    </Button>
                    <div className="py-8 text-center">
                        <h2 className="mb-4 text-2xl font-bold text-gray-900">Cannot Edit Completed Record</h2>
                        <p className="mb-6 text-gray-600">
                            This equipment has already been picked up and cannot be edited. Only administrators can edit completed records.
                        </p>
                        <Button asChild>
                            <Link href={`/admin/tracking/outgoing/${outgoingData.id}`}>View Details</Link>
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.put(
                `/api/v1/track-outgoing/${outgoingData.id}`,
                {
                    ...data,
                    recall_number: outgoingData.track_incoming?.recall_number,
                    incoming_id: outgoingData.incoming_id,
                    employee_id_out: outgoingData.employee_out?.employee_id,
                    cycle_time: parseInt(data.cycle_time),
                    ct_reqd: data.ct_reqd ? parseInt(data.ct_reqd) : null,
                    commit_etc: data.commit_etc || null, // Send as date string
                    actual_etc: data.actual_etc || null, // Send as date string
                    overdue: data.overdue === 'yes' ? 1 : 0,
                },
                {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                },
            );

            if (response.data) {
                toast.success('Outgoing completion updated successfully!');
                // Redirect back to show page
                // window.location.href = `/admin/tracking/outgoing/${outgoingData.id}`;
            }
        } catch (error: any) {
            console.error('Error updating outgoing completion:', error);

            if (error.response?.status === 422 && error.response?.data?.errors) {
                // Handle validation errors
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((field) => {
                    toast.error(`${field}: ${validationErrors[field][0]}`);
                });
            } else {
                toast.error(error.response?.data?.message || 'Failed to update outgoing completion');
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Outgoing Completion: ${outgoingData.track_incoming?.recall_number || outgoingData.incoming_id}`} />

            <div className="space-y-6 p-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/tracking/outgoing/${outgoingData.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Completion Details
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Completion: {outgoingData.track_incoming?.recall_number || outgoingData.incoming_id}
                        </h1>
                        <p className="text-muted-foreground">Update calibration completion details</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Calibration Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Calibration Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="cal_date" className="text-sm font-medium">
                                        Calibration Date *
                                    </Label>
                                    <Input
                                        id="cal_date"
                                        type="date"
                                        value={data.cal_date}
                                        onChange={(e) => setData('cal_date', e.target.value)}
                                        className={errors.cal_date ? 'border-destructive' : ''}
                                        required
                                    />
                                    {errors.cal_date && <p className="text-destructive text-sm">{errors.cal_date}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="cal_due_date" className="text-sm font-medium">
                                        Next Due Date *
                                    </Label>
                                    <Input
                                        id="cal_due_date"
                                        type="date"
                                        value={data.cal_due_date}
                                        onChange={(e) => setData('cal_due_date', e.target.value)}
                                        className={errors.cal_due_date ? 'border-destructive' : ''}
                                        required
                                    />
                                    {errors.cal_due_date && <p className="text-destructive text-sm">{errors.cal_due_date}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="date_out" className="text-sm font-medium">
                                        Date Out *
                                    </Label>
                                    <Input
                                        id="date_out"
                                        type="datetime-local"
                                        value={data.date_out}
                                        onChange={(e) => setData('date_out', e.target.value)}
                                        className={errors.date_out ? 'border-destructive' : ''}
                                        required
                                    />
                                    {errors.date_out && <p className="text-destructive text-sm">{errors.date_out}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="cycle_time" className="text-sm font-medium">
                                        Actual No. of Cycle Time (days)
                                    </Label>
                                    <Input
                                        id="cycle_time"
                                        type="number"
                                        value={data.cycle_time}
                                        min={0}
                                        onChange={(e) => setData('cycle_time', e.target.value)}
                                    />
                                    {errors.cycle_time && <p className="text-destructive text-sm">{errors.cycle_time}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="ct_reqd" className="text-sm font-medium">
                                        CT Reqd (days)
                                    </Label>
                                    <Input
                                        id="ct_reqd"
                                        type="number"
                                        value={data.ct_reqd || ''}
                                        min={0}
                                        onChange={(e) => setData('ct_reqd', e.target.value)}
                                    />
                                    {errors.ct_reqd && <p className="text-destructive text-sm">{errors.ct_reqd}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="commit_etc" className="text-sm font-medium">
                                        Commit ETC Date
                                    </Label>
                                    <Input
                                        id="commit_etc"
                                        type="date"
                                        value={data.commit_etc || ''}
                                        onChange={(e) => setData('commit_etc', e.target.value)}
                                    />
                                    {errors.commit_etc && <p className="text-destructive text-sm">{errors.commit_etc}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="actual_etc" className="text-sm font-medium">
                                        Actual ETC Date
                                    </Label>
                                    <Input
                                        id="actual_etc"
                                        type="date"
                                        value={data.actual_etc || ''}
                                        onChange={(e) => setData('actual_etc', e.target.value)}
                                    />
                                    {errors.actual_etc && <p className="text-destructive text-sm">{errors.actual_etc}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="overdue" className="text-sm font-medium">
                                        Overdue
                                        {!data.overdue_manual_override && (
                                            <span className="text-muted-foreground ml-2 text-xs">(Auto: {calculateAutomatedOverdue()})</span>
                                        )}
                                    </Label>
                                    <Select
                                        value={data.overdue}
                                        onValueChange={(value) => {
                                            setData('overdue', value);
                                            setData('overdue_manual_override', true);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select overdue status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="no">No</SelectItem>
                                            <SelectItem value="yes">Yes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {data.overdue_manual_override && (
                                        <p className="mt-1 text-xs text-orange-600">
                                            Manual override active.
                                            <button
                                                type="button"
                                                className="ml-1 text-blue-600 hover:underline"
                                                onClick={() => {
                                                    setData('overdue_manual_override', false);
                                                    setData('overdue', calculateAutomatedOverdue());
                                                }}
                                            >
                                                Reset to auto
                                            </button>
                                        </p>
                                    )}
                                    {errors.overdue && <p className="text-destructive text-sm">{errors.overdue}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="queueing_time" className="text-sm font-medium">
                                        Queueing Time (days)
                                    </Label>
                                    <Input
                                        id="queueing_time"
                                        type="number"
                                        value={(() => {
                                            if (!outgoingData.track_incoming?.date_in || !data.date_out) return 0;
                                            const dateIn = new Date(outgoingData.track_incoming.date_in);
                                            const dateOut = new Date(data.date_out);
                                            const timeDiff = dateOut.getTime() - dateIn.getTime();
                                            const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            return Math.max(0, days);
                                        })()}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Personnel Information (Read-only) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4" />
                                    Personnel (Read-only)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {outgoingData.technician && (
                                    <div>
                                        <Label className="text-sm font-medium">Technician</Label>
                                        <p className="text-muted-foreground text-sm">
                                            {outgoingData.technician.first_name} {outgoingData.technician.last_name}
                                        </p>
                                        {outgoingData.technician.email && (
                                            <p className="text-muted-foreground text-xs">{outgoingData.technician.email}</p>
                                        )}
                                    </div>
                                )}

                                {outgoingData.released_by && (
                                    <div>
                                        <Label className="text-sm font-medium">Released By (PIC)</Label>
                                        <p className="text-muted-foreground text-sm">
                                            {outgoingData.released_by.first_name} {outgoingData.released_by.last_name}
                                        </p>
                                        {outgoingData.released_by.email && (
                                            <p className="text-muted-foreground text-xs">{outgoingData.released_by.email}</p>
                                        )}
                                        {outgoingData.released_by.employee_id && (
                                            <p className="text-muted-foreground text-xs">Employee ID: {outgoingData.released_by.employee_id}</p>
                                        )}
                                    </div>
                                )}

                                {outgoingData.employee_out && (
                                    <div>
                                        <Label className="text-sm font-medium">Employee Out (Package Recipient)</Label>
                                        <p className="text-muted-foreground text-sm">
                                            {outgoingData.employee_out.first_name} {outgoingData.employee_out.last_name}
                                        </p>
                                        {outgoingData.employee_out.email && (
                                            <p className="text-muted-foreground text-xs">{outgoingData.employee_out.email}</p>
                                        )}
                                        {outgoingData.employee_out.employee_id && (
                                            <p className="text-muted-foreground text-xs">Employee ID: {outgoingData.employee_out.employee_id}</p>
                                        )}
                                        {outgoingData.employee_out.department && (
                                            <p className="text-muted-foreground text-xs">
                                                Department: {outgoingData.employee_out.department.department_name}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <Label className="text-sm font-medium">Recall Number</Label>
                                    <p className="text-muted-foreground text-sm">
                                        {outgoingData.track_incoming?.recall_number || outgoingData.incoming_id}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Equipment Information (Read-only) */}
                    {outgoingData.track_incoming && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Equipment Information (Read-only)</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <Label className="text-sm font-medium">Description</Label>
                                    <p className="text-muted-foreground text-sm">{outgoingData.track_incoming.description}</p>
                                </div>

                                {outgoingData.track_incoming.serial_number && (
                                    <div>
                                        <Label className="text-sm font-medium">Serial Number</Label>
                                        <p className="text-muted-foreground text-sm">{outgoingData.track_incoming.serial_number}</p>
                                    </div>
                                )}

                                {outgoingData.track_incoming.manufacturer && (
                                    <div>
                                        <Label className="text-sm font-medium">Manufacturer</Label>
                                        <p className="text-muted-foreground text-sm">{outgoingData.track_incoming.manufacturer}</p>
                                    </div>
                                )}

                                {outgoingData.track_incoming.model && (
                                    <div>
                                        <Label className="text-sm font-medium">Model</Label>
                                        <p className="text-muted-foreground text-sm">{outgoingData.track_incoming.model}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Form Actions */}
                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" type="button" asChild>
                            <Link href={`/admin/tracking/outgoing/${outgoingData.id}`}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default TrackingOutgoingEdit;
