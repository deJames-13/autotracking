import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Plant } from '@/types';
import { router } from '@inertiajs/react';

interface PlantDeleteDialogProps {
    plant: Plant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function PlantDeleteDialog({ plant, open, onOpenChange, onSuccess }: PlantDeleteDialogProps) {
    const handleDelete = () => {
        if (!plant) return;

        console.log('PlantDeleteDialog: Deleting plant', plant.plant_id);
        
        router.delete(route('admin.plants.destroy', plant.plant_id), {
            onSuccess: () => {
                console.log('PlantDeleteDialog: Delete successful, calling onSuccess');
                onOpenChange(false);
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error deleting plant:', errors);
            }
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
                    <DialogTitle>Delete Plant</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this plant? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="font-medium">
                            {plant.plant_name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
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
                            Delete Plant
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
