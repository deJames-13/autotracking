import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Equipment, type User } from '@/types';
import { EquipmentForm } from './equipment-form';

interface EquipmentEditDialogProps {
    equipment: Equipment | null;
    users: User[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EquipmentEditDialog({ equipment, users, open, onOpenChange, onSuccess }: EquipmentEditDialogProps) {
    const handleSuccess = () => {
        console.log('EquipmentEditDialog: Edit successful, calling onSuccess');
        onOpenChange(false);
        onSuccess();
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!equipment) return null;
    console.log(equipment);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] w-full max-w-[90vw] flex-col overflow-scroll lg:max-w-[80vw] xl:max-w-[72rem]">
                <DialogHeader>
                    <DialogTitle>Edit Equipment</DialogTitle>
                    <DialogDescription>Update equipment information.</DialogDescription>
                </DialogHeader>
                <EquipmentForm equipment={equipment} users={users} onSuccess={handleSuccess} onCancel={handleCancel} />
            </DialogContent>
        </Dialog>
    );
}
