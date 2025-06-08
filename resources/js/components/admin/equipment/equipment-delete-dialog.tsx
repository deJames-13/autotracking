import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Equipment } from '@/types';
import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';

interface EquipmentDeleteDialogProps {
    equipment: Equipment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EquipmentDeleteDialog({ equipment, open, onOpenChange, onSuccess }: EquipmentDeleteDialogProps) {
    const handleDelete = () => {
        if (!equipment) return;

        console.log('EquipmentDeleteDialog: Archiving equipment', equipment.equipment_id);

        router.delete(route('admin.equipment.destroy', equipment.equipment_id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('EquipmentDeleteDialog: Archive successful, calling onSuccess');
                onOpenChange(false);
                toast.success('Equipment archived successfully');
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error archiving equipment:', errors);

                // Handle validation errors
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat();
                    if (errorMessages.length > 0) {
                        toast.error(errorMessages[0] as string);
                        return;
                    }
                }

                // Generic fallback error
                toast.error('Failed to archive equipment. Please try again.');
            },
        });
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!equipment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Archive Equipment</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to archive this equipment? The equipment will be hidden from the main list but can be restored later.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg border p-4">
                        <div className="font-medium">Recall #: {equipment.recall_number}</div>
                        <div className="text-muted-foreground mt-1 text-sm">
                            <div>ID: {equipment.equipment_id}</div>
                            <div>Serial #: {equipment.serial_number || 'N/A'}</div>
                            <div>Manufacturer: {equipment.manufacturer}</div>
                            <div>
                                Assigned to:{' '}
                                {equipment.user
                                    ? equipment.user.full_name || `${equipment.user.first_name} ${equipment.user.last_name}`
                                    : 'Unassigned'}
                            </div>
                            <div>Records: {equipment.track_incoming?.length || 0}</div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Archive Equipment
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
