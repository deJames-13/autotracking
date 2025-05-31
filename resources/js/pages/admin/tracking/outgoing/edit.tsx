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
    const { canManageRequestIncoming } = useRole();

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
            title: trackOutgoing.recall_number,
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

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.put(`/api/v1/track-outgoing/${trackOutgoing.id}`, {
                ...data,
                recall_number: trackOutgoing.recall_number,
                employee_id_out: trackOutgoing.employee_out_user?.employee_id,
                cycle_time: parseInt(data.cycle_time)
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
            <Head title={`Edit Outgoing Completion: ${trackOutgoing.recall_number}`} />

            <div className="space-y-6 p-6">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/tracking/outgoing/${trackOutgoing.id}`}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Completion Details
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Completion: {trackOutgoing.recall_number}
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
                                        Cycle Time (days) *
                                    </Label>
                                    <Input
                                        id="cycle_time"
                                        type="number"
                                        min="1"
                                        value={data.cycle_time}
                                        onChange={(e) => setData('cycle_time', e.target.value)}
                                        className={errors.cycle_time ? 'border-destructive' : ''}
                                        placeholder="Enter cycle time in days"
                                        required
                                    />
                                    {errors.cycle_time && (
                                        <p className="text-sm text-destructive">{errors.cycle_time}</p>
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

                                {trackOutgoing.employee_out_user && (
                                    <div>
                                        <Label className="text-sm font-medium">Released By</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {trackOutgoing.employee_out_user.first_name} {trackOutgoing.employee_out_user.last_name}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <Label className="text-sm font-medium">Recall Number</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {trackOutgoing.recall_number}
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
