import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Department } from '@/types';
import { DepartmentForm } from './department-form';

interface DepartmentEditDialogProps {
    department: Department | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DepartmentEditDialog({
    department,
    open,
    onOpenChange,
    onSuccess
}: DepartmentEditDialogProps) {
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
            <DialogContent className="max-w-md max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Edit Department</DialogTitle>
                    <DialogDescription>
                        Update department information.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <DepartmentForm
                        department={department}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
