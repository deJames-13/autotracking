import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Location } from '@/types';
import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';

interface LocationDeleteDialogProps {
    location: Location | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function LocationDeleteDialog({ location, open, onOpenChange, onSuccess }: LocationDeleteDialogProps) {
    const handleDelete = () => {
        if (!location) return;

        console.log('LocationDeleteDialog: Deleting location', location.location_id);

        router.delete(route('admin.locations.destroy', location.location_id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                console.log('LocationDeleteDialog: Delete successful, calling onSuccess');
                toast.success('Location archived successfully');
                onOpenChange(false);
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error archiving location:', errors);
                // Handle validation errors from Laravel
                if (errors.location) {
                    toast.error(errors.location);
                } else if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error('Failed to archive location. Please try again.');
                }
            },
        });
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!location) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Archive Location</DialogTitle>
                    <DialogDescription>Are you sure you want to archive this location? You can restore it later if needed.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg border p-4">
                        <div className="font-medium">{location.location_name}</div>
                        <div className="text-muted-foreground mt-1 text-sm">
                            <div>ID: {location.location_id}</div>
                            <div>Department: {location.department?.department_name || 'No department'}</div>
                            <div>Track Incoming: {location.track_incoming?.length || 0}</div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Archive Location
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
