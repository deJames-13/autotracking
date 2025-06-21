import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type User } from '@/types';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface UserDeleteDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function UserDeleteDialog({ user, open, onOpenChange, onSuccess }: UserDeleteDialogProps) {
    const [forceDelete, setForceDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const hasRelatedRecords = user && (
        (user.equipments?.length || 0) > 0 ||
        (user.track_incoming_as_technician?.length || 0) > 0 ||
        (user.track_incoming_as_employee_in?.length || 0) > 0 ||
        (user.track_incoming_as_received_by?.length || 0) > 0 ||
        (user.track_outgoing_as_employee_out?.length || 0) > 0
    );

    const handleDelete = () => {
        if (!user) return;

        setIsDeleting(true);
        console.log('UserDeleteDialog: Deleting user', user.employee_id, 'force:', forceDelete);

        const data = forceDelete ? { force: true } : {};

        router.delete(route('admin.users.destroy', user.employee_id), {
            data,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('UserDeleteDialog: Delete successful, calling onSuccess');
                onOpenChange(false);
                setForceDelete(false);
                setIsDeleting(false);
                toast.success(forceDelete ? 'User deleted and all references nullified successfully' : 'User archived successfully');
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error deleting user:', errors);
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
                toast.error('Failed to delete user. Please try again.');
            },
        });
    };

    const handleCancel = () => {
        onOpenChange(false);
        setForceDelete(false);
    };

    if (!user) return null;

    const equipmentCount = user.equipments?.length || 0;
    const trackingRecordsCount = (user.track_incoming_as_technician?.length || 0) +
                                (user.track_incoming_as_employee_in?.length || 0) +
                                (user.track_incoming_as_received_by?.length || 0) +
                                (user.track_outgoing_as_employee_out?.length || 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-md sm:max-w-lg mx-4 sm:mx-auto">
                <DialogHeader>
                    <DialogTitle>
                        {forceDelete ? 'Force Delete User' : 'Archive User'}
                    </DialogTitle>
                    <DialogDescription>
                        {forceDelete 
                            ? 'Are you sure you want to permanently delete this user? All related records will have their user references set to null, but the records themselves will be preserved.'
                            : 'Are you sure you want to archive this user? The user will be hidden from the main list but can be restored later.'
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg border p-4">
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-muted-foreground mt-1 text-sm">
                            <div>ID: {user.employee_id}</div>
                            <div>Email: {user.email || 'N/A'}</div>
                            <div>Role: {user.role?.role_name || 'N/A'}</div>
                            <div>Department: {user.department?.department_name || 'N/A'}</div>
                            <div>Equipment: {equipmentCount}</div>
                            <div>Tracking Records: {trackingRecordsCount}</div>
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
                                    This user has related records. Normal archiving will fail.
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
                                    Force delete (remove user references without deleting records)
                                </label>
                            </div>

                            {forceDelete && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-red-800">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-sm font-medium">Warning: User Reference Removal</span>
                                    </div>
                                    <p className="text-red-700 mt-1 text-sm">
                                        This will set user references to null for:
                                    </p>
                                    <ul className="text-red-700 mt-1 text-sm list-disc list-inside ml-2">
                                        {equipmentCount > 0 && (
                                            <li>{equipmentCount} equipment item(s) - remove user assignment</li>
                                        )}
                                        {trackingRecordsCount > 0 && (
                                            <li>{trackingRecordsCount} tracking record(s) - nullify user references</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                        <Button 
                            variant="outline" 
                            onClick={handleCancel} 
                            disabled={isDeleting}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant={forceDelete ? "destructive" : "default"} 
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full sm:w-auto"
                        >
                            {isDeleting 
                                ? 'Processing...' 
                                : forceDelete 
                                    ? 'Permanently Delete' 
                                    : 'Archive User'
                            }
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
