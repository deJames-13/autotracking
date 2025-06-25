import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/modal';
import { type Department } from '@/types';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface DepartmentDeleteDialogProps {
    department: Department | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DepartmentDeleteDialog({ department, open, onOpenChange, onSuccess }: DepartmentDeleteDialogProps) {
    const [forceDelete, setForceDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const hasRelatedRecords = department && (
        (department.users?.length || 0) > 0 ||
        (department.locations?.length || 0) > 0
    );

    const handleDelete = () => {
        if (!department) return;

        setIsDeleting(true);
        console.log('DepartmentDeleteDialog: Deleting department', department.department_id, 'force:', forceDelete);

        const data = forceDelete ? { force: true } : {};

        router.delete(route('admin.departments.destroy', department.department_id), {
            data,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('DepartmentDeleteDialog: Delete successful, calling onSuccess');
                onOpenChange(false);
                setForceDelete(false);
                setIsDeleting(false);
                toast.success(forceDelete ? 'Department deleted and all references nullified successfully' : 'Department archived successfully');
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error deleting department:', errors);
                setIsDeleting(false);

                // Handle validation errors
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat();
                    if (errorMessages.length > 0) {
                        toast.error(errorMessages[0] as string);
                        return;
                    }
                }

                // Generic fallback error
                toast.error('Failed to delete department. Please try again.');
            },
        });
    };

    const handleCancel = () => {
        onOpenChange(false);
        setForceDelete(false);
    };

    if (!department) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] sm:max-h-[85vh] mx-4 sm:mx-auto overflow-scroll">
                <DialogHeader>
                    <DialogTitle>
                        {forceDelete ? 'Force Delete Department' : 'Archive Department'}
                    </DialogTitle>
                    <DialogDescription>
                        {forceDelete
                            ? 'Are you sure you want to permanently delete this department? All related records will have their department references set to null, but the records themselves will be preserved.'
                            : 'Are you sure you want to archive this department? The department will be hidden from the main list but can be restored later.'
                        }
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

                    {hasRelatedRecords && (
                        <div className="space-y-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-yellow-800">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Related Records Found</span>
                                </div>
                                <p className="text-yellow-700 mt-1 text-sm">
                                    This department has related records. Normal archiving will fail.
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="force-delete"
                                    checked={forceDelete}
                                    onCheckedChange={setForceDelete}
                                />
                                <label
                                    htmlFor="force-delete"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Force delete (remove department references without deleting records)
                                </label>
                            </div>

                            {forceDelete && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-red-800">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-sm font-medium">Warning: Department Reference Removal</span>
                                    </div>
                                    <p className="text-red-700 mt-1 text-sm">
                                        This will set department references to null for:
                                    </p>
                                    <ul className="text-red-700 mt-1 text-sm list-disc list-inside ml-2">
                                        {(department.users?.length || 0) > 0 && (
                                            <li>{department.users?.length} user(s) - remove department assignment</li>
                                        )}
                                        {(department.locations?.length || 0) > 0 && (
                                            <li>{department.locations?.length} location(s) - archive and remove department link</li>
                                        )}
                                        <li>All equipment assigned to this department - remove department link</li>
                                        <li>All tracking records related to this department - nullify references</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button
                            variant={forceDelete ? "destructive" : "default"}
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting
                                ? 'Processing...'
                                : forceDelete
                                    ? 'Permanently Delete'
                                    : 'Archive Department'
                            }
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
