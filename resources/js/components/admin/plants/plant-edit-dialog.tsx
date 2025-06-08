import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Plant } from '@/types';
import { PlantForm } from './plant-form';

interface PlantEditDialogProps {
    plant: Plant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function PlantEditDialog({ plant, open, onOpenChange, onSuccess }: PlantEditDialogProps) {
    const handleSuccess = () => {
        console.log('PlantEditDialog: Edit successful, calling onSuccess');
        onOpenChange(false);
        onSuccess();
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!plant) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Plant</DialogTitle>
                    <DialogDescription>Update plant information.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <PlantForm plant={plant} onSuccess={handleSuccess} onCancel={handleCancel} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
