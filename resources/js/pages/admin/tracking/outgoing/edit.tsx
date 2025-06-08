import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TrackOutgoing, type User } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Calendar, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { FormEventHandler } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface TrackingOutgoingEditProps {
    trackOutgoing: TrackOutgoing;
}

const TrackingOutgoingEdit: React.FC<TrackingOutgoingEditProps> = ({ trackOutgoing }) => {
    const { canManageRequestIncoming, isAdmin } = useRole();

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
            title: trackOutgoing.track_incoming?.recall_number || trackOutgoing.incoming_id,
            href: `/admin/tracking/outgoing/${trackOutgoing.id}`,
        },
        {
            title: 'Edit',
            href: `/admin/tracking/outgoing/${trackOutgoing.id}/edit`,
        },
    ];

    const { data, setData, processing, errors, reset } = useForm({
        cal_date: format(new Date(trackOutgoing.cal_date), 'yyyy-MM-dd'),
        cal_due_date: format(new Date(trackOutgoing.cal_due_date), 'yyyy-MM-dd'),
        date_out: format(new Date(trackOutgoing.date_out), 'yyyy-MM-dd\'T\'HH:mm'),
        cycle_time: trackOutgoing.cycle_time?.toString() || '',
    });

    if (!canManageRequestIncoming()) {
        return null;
    }

    // Prevent editing if equipment has already been picked up (unless user is admin)
    if (trackOutgoing.status === 'completed' && !isAdmin()) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Edit Outgoing Completion: ${trackOutgoing.recall_number}`} />
                <div className="space-y-6 p-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/tracking/outgoing/${trackOutgoing.id}`}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Completion Details
                        </Link>
                    </Button>
                    <div className="text-center py-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cannot Edit Completed Record</h2>
                        <p className="text-gray-600 mb-6">
                            This equipment has already been picked up and cannot be edited. Only administrators can edit completed records.
                        </p>
                        <Button asChild>
                            <Link href={`/admin/tracking/outgoing/${trackOutgoing.id}`}>
                                View Details
                            </Link>
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.put(`/api/v1/track-outgoing/${trackOutgoing.id}`, {
                ...data,
                recall_number: trackOutgoing.track_incoming?.recall_number,
                incoming_id: trackOutgoing.incoming_id,
                employee_id_out: trackOutgoing.employee_out_user?.employee_id,
                cycle_time: parseInt(data.cycle_time),
                ct_reqd: data.ct_reqd ? parseInt(data.ct_reqd) : null,
                commit_etc: data.commit_etc ? parseInt(data.commit_etc) : null,
                actual_etc: data.actual_etc ? parseInt(data.actual_etc) : null,
                overdue: data.overdue ? parseInt(data.overdue) : 0
            }, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.data) {
                toast.success('Outgoing completion updated successfully!');
                // Redirect back to show page
                window.location.href = `/admin/tracking/outgoing/${trackOutgoing.id}`;
            }
        } catch (error: any) {
            console.error('Error updating outgoing completion:', error);

            if (error.response?.status === 422 && error.response?.data?.errors) {
                // Handle validation errors
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach(field => {
                    toast.error(`${field}: ${validationErrors[field][0]}`);
                });
            } else {
                toast.error(error.response?.data?.message || 'Failed to update outgoing completion');
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Outgoing Completion: ${trackOutgoing.track_incoming?.recall_number || trackOutgoing.incoming_id}`} />

            <div className="space-y-6 p-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/tracking/outgoing/${trackOutgoing.id}`}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Completion Details
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Completion: {trackOutgoing.track_incoming?.recall_number || trackOutgoing.incoming_id}
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
                                    {errors.cal_date && (
                                        <p className="text-sm text-destructive">{errors.cal_date}</p>
                                    )}
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
                                    {errors.cal_due_date && (
                                        <p className="text-sm text-destructive">{errors.cal_due_date}</p>
                                    )}
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
                                    {errors.date_out && (
                                        <p className="text-sm text-destructive">{errors.date_out}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="cycle_time" className="text-sm font-medium">
                                        Cycle Time (days)
                                    </Label>
                                    <Input
                                        id="cycle_time"
                                        type="number"
                                        value={data.cycle_time}
                                        min={0}
                                        onChange={e => setData('cycle_time', e.target.value)}
                                    />
                                    {errors.cycle_time && (
                                        <p className="text-sm text-destructive">{errors.cycle_time}</p>
                                    )}
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
                                        onChange={e => setData('ct_reqd', e.target.value)}
                                    />
                                    {errors.ct_reqd && (
                                        <p className="text-sm text-destructive">{errors.ct_reqd}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="commit_etc" className="text-sm font-medium">
                                        Commit ETC (days)
                                    </Label>
                                    <Input
                                        id="commit_etc"
                                        type="number"
                                        value={data.commit_etc || ''}
                                        min={0}
                                        onChange={e => setData('commit_etc', e.target.value)}
                                    />
                                    {errors.commit_etc && (
                                        <p className="text-sm text-destructive">{errors.commit_etc}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="actual_etc" className="text-sm font-medium">
                                        Actual ETC (days)
                                    </Label>
                                    <Input
                                        id="actual_etc"
                                        type="number"
                                        value={data.actual_etc || ''}
                                        min={0}
                                        onChange={e => setData('actual_etc', e.target.value)}
                                    />
                                    {errors.actual_etc && (
                                        <p className="text-sm text-destructive">{errors.actual_etc}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="overdue" className="text-sm font-medium">
                                        Overdue (days)
                                    </Label>
                                    <Input
                                        id="overdue"
                                        type="number"
                                        value={data.overdue || 0}
                                        min={0}
                                        onChange={e => setData('overdue', e.target.value)}
                                    />
                                    {errors.overdue && (
                                        <p className="text-sm text-destructive">{errors.overdue}</p>
                                    )}
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
                                {trackOutgoing.technician && (
                                    <div>
                                        <Label className="text-sm font-medium">Technician</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {trackOutgoing.technician.first_name} {trackOutgoing.technician.last_name}
                                        </p>
                                        {trackOutgoing.technician.email && (
                                            <p className="text-xs text-muted-foreground">
                                                {trackOutgoing.technician.email}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {trackOutgoing.released_by && (
                                    <div>
                                        <Label className="text-sm font-medium">Released By (Operator)</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {trackOutgoing.released_by.first_name} {trackOutgoing.released_by.last_name}
                                        </p>
                                        {trackOutgoing.released_by.email && (
                                            <p className="text-xs text-muted-foreground">
                                                {trackOutgoing.released_by.email}
                                            </p>
                                        )}
                                        {trackOutgoing.released_by.employee_id && (
                                            <p className="text-xs text-muted-foreground">
                                                Employee ID: {trackOutgoing.released_by.employee_id}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {trackOutgoing.employee_out && (
                                    <div>
                                        <Label className="text-sm font-medium">Employee Out (Package Recipient)</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {trackOutgoing.employee_out.first_name} {trackOutgoing.employee_out.last_name}
                                        </p>
                                        {trackOutgoing.employee_out.email && (
                                            <p className="text-xs text-muted-foreground">
                                                {trackOutgoing.employee_out.email}
                                            </p>
                                        )}
                                        {trackOutgoing.employee_out.employee_id && (
                                            <p className="text-xs text-muted-foreground">
                                                Employee ID: {trackOutgoing.employee_out.employee_id}
                                            </p>
                                        )}
                                        {trackOutgoing.employee_out.department && (
                                            <p className="text-xs text-muted-foreground">
                                                Department: {trackOutgoing.employee_out.department.department_name}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <Label className="text-sm font-medium">Recall Number</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.track_incoming?.recall_number || trackOutgoing.incoming_id}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Equipment Information (Read-only) */}
                    {trackOutgoing.track_incoming && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Equipment Information (Read-only)</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <Label className="text-sm font-medium">Description</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.track_incoming.description}
                                    </p>
                                </div>

                                {trackOutgoing.track_incoming.serial_number && (
                                    <div>
                                        <Label className="text-sm font-medium">Serial Number</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {trackOutgoing.track_incoming.serial_number}
                                        </p>
                                    </div>
                                )}

                                {trackOutgoing.track_incoming.manufacturer && (
                                    <div>
                                        <Label className="text-sm font-medium">Manufacturer</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {trackOutgoing.track_incoming.manufacturer}
                                        </p>
                                    </div>
                                )}

                                {trackOutgoing.track_incoming.model && (
                                    <div>
                                        <Label className="text-sm font-medium">Model</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {trackOutgoing.track_incoming.model}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Form Actions */}
                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" type="button" asChild>
                            <Link href={`/admin/tracking/outgoing/${trackOutgoing.id}`}>
                                Cancel
                            </Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default TrackingOutgoingEdit;
