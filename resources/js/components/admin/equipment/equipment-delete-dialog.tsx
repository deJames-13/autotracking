import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Equipment } from '@/types';
import { router } from '@inertiajs/react';

interface EquipmentDeleteDialogProps {
    equipment: Equipment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EquipmentDeleteDialog({ equipment, open, onOpenChange, onSuccess }: EquipmentDeleteDialogProps) {
    const handleDelete = () => {
        if (!equipment) return;

        router.delete(`/api/v1/equipment/${equipment.equipment_id}`, {
            onSuccess: () => {
                onOpenChange(false);
                onSuccess();
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
                    <DialogTitle>Delete Equipment</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this equipment? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="font-medium">
                            {equipment.serial_number}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            <div>ID: {equipment.equipment_id}</div>
                            <div>Manufacturer: {equipment.manufacturer}</div>
                            <div>Assigned to: {equipment.user ?
                                (equipment.user.full_name || `${equipment.user.first_name} ${equipment.user.last_name}`) :
                                'Unassigned'
                            }</div>
                            <div>Records: {equipment.tracking_records?.length || 0}</div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete Equipment
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
