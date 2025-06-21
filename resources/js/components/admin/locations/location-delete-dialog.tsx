import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Location } from '@/types';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface LocationDeleteDialogProps {
    location: Location | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function LocationDeleteDialog({ location, open, onOpenChange, onSuccess }: LocationDeleteDialogProps) {
    const [forceDelete, setForceDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const hasRelatedRecords = location && (
        (location.track_incoming?.length || 0) > 0 ||
        (location.track_outgoing?.length || 0) > 0
    );

    const handleDelete = () => {
        if (!location) return;

        setIsDeleting(true);
        console.log('LocationDeleteDialog: Deleting location', location.location_id, 'force:', forceDelete);

        const data = forceDelete ? { force: true } : {};

        router.delete(route('admin.locations.destroy', location.location_id), {
            data,
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                console.log('LocationDeleteDialog: Delete successful, calling onSuccess');
                setIsDeleting(false);
                setForceDelete(false);
                toast.success(forceDelete ? 'Location deleted and references nullified successfully' : 'Location archived successfully');
                onOpenChange(false);
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error deleting location:', errors);
                setIsDeleting(false);
                // Handle validation errors from Laravel
                if (errors.location) {
                    toast.error(errors.location);
                } else if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error('Failed to delete location. Please try again.');
                }
            },
        });
    };

    const handleCancel = () => {
        onOpenChange(false);
        setForceDelete(false);
    };

    if (!location) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {forceDelete ? 'Force Delete Location' : 'Archive Location'}
                    </DialogTitle>
                    <DialogDescription>
                        {forceDelete
                            ? 'Are you sure you want to permanently delete this location? All related records will have their location references set to null, but the records themselves will be preserved.'
                            : 'Are you sure you want to archive this location? You can restore it later if needed.'
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg border p-4">
                        <div className="font-medium">{location.location_name}</div>
                        <div className="text-muted-foreground mt-1 text-sm">
                            <div>ID: {location.location_id}</div>
                            <div>Department: {location.department?.department_name || 'No department'}</div>
                            <div>Track Incoming: {location.track_incoming?.length || 0}</div>
                            <div>Track Outgoing: {location.track_outgoing?.length || 0}</div>
                        </div>
                    </div>

                    {hasRelatedRecords && (
                        <div className="space-y-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-yellow-800">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Related Records Found</span>
                                </div>
                                <p className="text-yellow-700 mt-1 text-sm">
                                    This location has tracking records. Normal archiving will fail.
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="force-delete"
                                    checked={forceDelete}
                                    onCheckedChange={setForceDelete}
                                />
                                <label
                                    htmlFor="force-delete"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Force delete (remove location references without deleting records)
                                </label>
                            </div>

                            {forceDelete && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-red-800">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-sm font-medium">Warning: Location Reference Removal</span>
                                    </div>
                                    <p className="text-red-700 mt-1 text-sm">
                                        This will set location references to null for:
                                    </p>
                                    <ul className="text-red-700 mt-1 text-sm list-disc list-inside ml-2">
                                        <li>{(location.track_incoming?.length || 0) + (location.track_outgoing?.length || 0)} tracking record(s) - nullify location reference</li>
                                        <li>All equipment assigned to this location - remove location link</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button
                            variant={forceDelete ? "destructive" : "default"}
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting
                                ? 'Processing...'
                                : forceDelete
                                    ? 'Permanently Delete'
                                    : 'Archive Location'
                            }
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
