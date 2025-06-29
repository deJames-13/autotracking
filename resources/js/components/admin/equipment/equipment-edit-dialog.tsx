import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/simple-modal';
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
    const handleManualClose = () => {
        onOpenChange(false);
    };

    const handleSuccess = () => {
        console.log('EquipmentEditDialog: Edit successful, calling onSuccess');
        // Close dialog first, then trigger success callback
        onOpenChange(false);
        // Use setTimeout to prevent race conditions and allow dialog to close
        setTimeout(() => {
            onSuccess();
        }, 150);
    };

    const handleCancel = () => {
        handleManualClose();
    };

    if (!equipment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
            <DialogContent
                className="flex max-h-[85vh] w-full max-w-[90vw] flex-col overflow-scroll lg:max-w-[80vw] xl:max-w-[72rem]"
                onInteractOutside={(e) => {
                    // Prevent dialog from closing when interacting with select dropdowns
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    // Allow manual escape key handling
                    e.preventDefault();
                    handleManualClose();
                }}
                onOpenAutoFocus={(e) => {
                    // Prevent automatic focus to avoid conflicts
                    e.preventDefault();
                }}
                onCloseAutoFocus={(e) => {
                    // Prevent automatic focus restoration to avoid conflicts
                    e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Edit Equipment</DialogTitle>
                    <DialogDescription>Update equipment information.</DialogDescription>
                </DialogHeader>
                <EquipmentForm equipment={equipment} users={users} onSuccess={handleSuccess} onCancel={handleCancel} />
            </DialogContent>
        </Dialog>
    );
}
