import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/simple-modal';
import { type Equipment } from '@/types';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface EquipmentDeleteDialogProps {
    equipment: Equipment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EquipmentDeleteDialog({ equipment, open, onOpenChange, onSuccess }: EquipmentDeleteDialogProps) {
    const [forceDelete, setForceDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleManualClose = () => {
        onOpenChange(false);
    };

    const hasRelatedRecords = equipment && (equipment.track_incoming?.length || 0) > 0;

    const handleDelete = () => {
        if (!equipment) return;

        setIsDeleting(true);
        console.log('EquipmentDeleteDialog: Deleting equipment', equipment.equipment_id, 'force:', forceDelete);

        const data = forceDelete ? { force: true } : {};

        router.delete(route('admin.equipment.destroy', equipment.equipment_id), {
            data,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('EquipmentDeleteDialog: Delete successful, calling onSuccess');
                setForceDelete(false);
                setIsDeleting(false);
                toast.success(forceDelete ? 'Equipment and all tracking records permanently deleted' : 'Equipment archived successfully');

                // Close dialog first, then trigger success callback after a delay
                onOpenChange(false);
                setTimeout(() => {
                    onSuccess();
                }, 150); // Give dialog time to close completely
            },
            onError: (errors) => {
                console.error('Error deleting equipment:', errors);
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
                toast.error('Failed to delete equipment. Please try again.');
            },
        });
    };

    const handleCancel = () => {
        handleManualClose();
        setForceDelete(false);
    };

    if (!equipment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
            <DialogContent
                className="max-w-md"
                onInteractOutside={(e) => {
                    // Prevent accidental closes
                    e.preventDefault();
                }}
                onOpenAutoFocus={(e) => {
                    // Prevent automatic focus to avoid conflicts
                    e.preventDefault();
                }}
                onCloseAutoFocus={(e) => {
                    // Prevent automatic focus restoration to avoid conflicts
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    e.preventDefault();
                    handleManualClose();
                    setForceDelete(false);
                }}
            >
                <DialogHeader>
                    <DialogTitle>
                        {forceDelete ? 'Force Delete Equipment' : 'Archive Equipment'}
                    </DialogTitle>
                    <DialogDescription>
                        {forceDelete
                            ? 'Are you sure you want to permanently delete this equipment and all its tracking records? This action cannot be undone.'
                            : 'Are you sure you want to archive this equipment? The equipment will be hidden from the main list but can be restored later.'
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg border p-4">
                        <div className="font-medium">Recall #: {equipment.recall_number}</div>
                        <div className="text-muted-foreground mt-1 text-sm">
                            <div>ID: {equipment.equipment_id}</div>
                            <div>Serial #: {equipment.serial_number || 'N/A'}</div>
                            <div>Manufacturer: {equipment.manufacturer}</div>
                            <div>
                                Assigned to:{' '}
                                {equipment.user
                                    ? equipment.user.full_name || `${equipment.user.first_name} ${equipment.user.last_name}`
                                    : 'Unassigned'}
                            </div>
                            <div>Records: {equipment.track_incoming?.length || 0}</div>
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
                                    This equipment has tracking records. Normal archiving will fail.
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
                                    Force delete (permanently delete equipment and all tracking records)
                                </label>
                            </div>

                            {forceDelete && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-red-800">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-sm font-medium">Warning: Permanent Deletion</span>
                                    </div>
                                    <p className="text-red-700 mt-1 text-sm">
                                        This will permanently delete:
                                    </p>
                                    <ul className="text-red-700 mt-1 text-sm list-disc list-inside ml-2">
                                        <li>{equipment.track_incoming?.length || 0} tracking record(s) and all their data</li>
                                        <li>All related outgoing tracking records</li>
                                        <li>The equipment record itself</li>
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
                                    : 'Archive Equipment'
                            }
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
