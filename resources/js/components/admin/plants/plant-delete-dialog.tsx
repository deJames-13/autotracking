import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Plant } from '@/types';
import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';

interface PlantDeleteDialogProps {
    plant: Plant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function PlantDeleteDialog({ plant, open, onOpenChange, onSuccess }: PlantDeleteDialogProps) {
    const handleDelete = () => {
        if (!plant) return;

        console.log('PlantDeleteDialog: Archiving plant', plant.plant_id);

        router.delete(route('admin.plants.destroy', plant.plant_id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('PlantDeleteDialog: Archive successful, calling onSuccess');
                onOpenChange(false);
                toast.success('Plant archived successfully');
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error archiving plant:', errors);

                // Handle validation errors
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat();
                    if (errorMessages.length > 0) {
                        toast.error(errorMessages[0] as string);
                        return;
                    }
                }

                // Generic fallback error
                toast.error('Failed to archive plant. Please try again.');
            },
        });
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!plant) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Archive Plant</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to archive this plant? The plant will be hidden from the main list but can be restored later.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg border p-4">
                        <div className="font-medium">{plant.plant_name}</div>
                        <div className="text-muted-foreground mt-1 text-sm">
                            <div>ID: {plant.plant_id}</div>
                            {plant.address && <div>Address: {plant.address}</div>}
                            {plant.telephone && <div>Telephone: {plant.telephone}</div>}
                            <div>Users: {plant.users?.length || 0}</div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Archive Plant
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
