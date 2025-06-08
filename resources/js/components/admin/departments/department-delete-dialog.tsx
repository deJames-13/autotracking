import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Department } from '@/types';
import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';

interface DepartmentDeleteDialogProps {
    department: Department | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DepartmentDeleteDialog({ department, open, onOpenChange, onSuccess }: DepartmentDeleteDialogProps) {
    const handleDelete = () => {
        if (!department) return;

        console.log('DepartmentDeleteDialog: Archiving department', department.department_id);

        router.delete(route('admin.departments.destroy', department.department_id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('DepartmentDeleteDialog: Archive successful, calling onSuccess');
                onOpenChange(false);
                toast.success('Department archived successfully');
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error archiving department:', errors);

                // Handle validation errors
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat();
                    if (errorMessages.length > 0) {
                        toast.error(errorMessages[0] as string);
                        return;
                    }
                }

                // Generic fallback error
                toast.error('Failed to archive department. Please try again.');
            },
        });
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!department) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Archive Department</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to archive this department? The department will be hidden from the main list but can be restored later.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg border p-4">
                        <div className="font-medium">{department.department_name}</div>
                        <div className="text-muted-foreground mt-1 text-sm">
                            <div>ID: {department.department_id}</div>
                            <div>Users: {department.users?.length || 0}</div>
                            <div>Locations: {department.locations?.length || 0}</div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Archive Department
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
