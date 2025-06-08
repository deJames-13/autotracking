import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Department } from '@/types';
import { DepartmentForm } from './department-form';

interface DepartmentCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (department: Department) => void;
}

export function DepartmentCreateDialog({ open, onOpenChange, onSuccess }: DepartmentCreateDialogProps) {
    const handleSuccess = (department?: Department) => {
        console.log('DepartmentCreateDialog: Create successful');
        if (department) {
            onSuccess(department);
        }
        onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Department</DialogTitle>
                    <DialogDescription>Add a new department to the system.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <DepartmentForm onSuccess={handleSuccess} onCancel={handleCancel} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
