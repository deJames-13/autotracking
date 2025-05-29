import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Equipment, type User } from '@/types';
import { EquipmentForm } from './equipment-form';

interface EquipmentEditDialogProps {
    equipment: Equipment | null;
    users: User[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EquipmentEditDialog({ 
    equipment, 
    users,
    open, 
    onOpenChange, 
    onSuccess 
}: EquipmentEditDialogProps) {
    const handleSuccess = () => {
        console.log('EquipmentEditDialog: Edit successful, calling onSuccess');
        onOpenChange(false);
        onSuccess();
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!equipment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[90vw] lg:max-w-[80vw] xl:max-w-[72rem] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Equipment</DialogTitle>
                    <DialogDescription>
                        Update equipment information.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6 py-2">
                    <EquipmentForm
                        equipment={equipment}
                        users={users}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
