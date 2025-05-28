import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Department } from '@/types';
import { router } from '@inertiajs/react';

interface DepartmentDeleteDialogProps {
    department: Department | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DepartmentDeleteDialog({ department, open, onOpenChange, onSuccess }: DepartmentDeleteDialogProps) {
    const handleDelete = () => {
        if (!department) return;

        console.log('DepartmentDeleteDialog: Deleting department', department.department_id);
        
        router.delete(route('admin.departments.destroy', department.department_id), {
            onSuccess: () => {
                console.log('DepartmentDeleteDialog: Delete successful, calling onSuccess');
                onOpenChange(false);
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error deleting department:', errors);
            }
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
                    <DialogTitle>Delete Department</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this department? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="font-medium">
                            {department.department_name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
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
                            Delete Department
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
