import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/simple-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Department } from '@/types';
import { DepartmentForm } from './department-form';

interface DepartmentEditDialogProps {
    department: Department | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DepartmentEditDialog({ department, open, onOpenChange, onSuccess }: DepartmentEditDialogProps) {
    const handleSuccess = () => {
        console.log('DepartmentEditDialog: Edit successful, calling onSuccess');
        onOpenChange(false);
        onSuccess();
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!department) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] sm:max-h-[85vh] mx-4 sm:mx-auto overflow-scroll">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-lg sm:text-xl">Edit Department</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">Update department information.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh] pr-2 sm:pr-4">
                    <div className="px-1 sm:px-0">
                        <DepartmentForm department={department} onSuccess={handleSuccess} onCancel={handleCancel} />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
