import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Location } from '@/types';
import { router } from '@inertiajs/react';

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
            onSuccess: () => {
                console.log('LocationDeleteDialog: Delete successful, calling onSuccess');
                onOpenChange(false);
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error deleting location:', errors);
            }
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
                    <DialogTitle>Delete Location</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this location? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="font-medium">
                            {location.location_name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
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
                            Delete Location
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
