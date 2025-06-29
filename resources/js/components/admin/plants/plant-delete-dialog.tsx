import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/simple-modal';
import { type Plant } from '@/types';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface PlantDeleteDialogProps {
    plant: Plant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function PlantDeleteDialog({ plant, open, onOpenChange, onSuccess }: PlantDeleteDialogProps) {
    const [forceDelete, setForceDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const hasRelatedRecords = plant && (
        (plant.users?.length || 0) > 0 ||
        (plant.equipments?.length || 0) > 0
    );

    const handleDelete = () => {
        if (!plant) return;

        setIsDeleting(true);
        console.log('PlantDeleteDialog: Deleting plant', plant.plant_id, 'force:', forceDelete);

        const data = forceDelete ? { force: true } : {};

        router.delete(route('admin.plants.destroy', plant.plant_id), {
            data,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('PlantDeleteDialog: Delete successful, calling onSuccess');
                onOpenChange(false);
                setForceDelete(false);
                setIsDeleting(false);
                toast.success(forceDelete ? 'Plant deleted and references nullified successfully' : 'Plant archived successfully');
                onSuccess();
            },
            onError: (errors) => {
                console.error('Error deleting plant:', errors);
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
                toast.error('Failed to delete plant. Please try again.');
            },
        });
    };

    const handleCancel = () => {
        onOpenChange(false);
        setForceDelete(false);
    };

    if (!plant) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {forceDelete ? 'Force Delete Plant' : 'Archive Plant'}
                    </DialogTitle>
                    <DialogDescription>
                        {forceDelete
                            ? 'Are you sure you want to permanently delete this plant? All related records will have their plant references set to null, but the records themselves will be preserved.'
                            : 'Are you sure you want to archive this plant? The plant will be hidden from the main list but can be restored later.'
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg border p-4">
                        <div className="font-medium">{plant.plant_name}</div>
                        <div className="text-muted-foreground mt-1 text-sm">
                            <div>ID: {plant.plant_id}</div>
                            {plant.address && <div>Address: {plant.address}</div>}
                            {plant.telephone && <div>Telephone: {plant.telephone}</div>}
                            <div>Users: {plant.users?.length || 0}</div>
                            <div>Equipment: {plant.equipments?.length || 0}</div>
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
                                    This plant has related records. Normal archiving will fail.
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
                                    Force delete (remove plant references without deleting records)
                                </label>
                            </div>

                            {forceDelete && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-red-800">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-sm font-medium">Warning: Plant Reference Removal</span>
                                    </div>
                                    <p className="text-red-700 mt-1 text-sm">
                                        This will set plant references to null for:
                                    </p>
                                    <ul className="text-red-700 mt-1 text-sm list-disc list-inside ml-2">
                                        {(plant.users?.length || 0) > 0 && (
                                            <li>{plant.users?.length} user(s) - remove plant assignment</li>
                                        )}
                                        {(plant.equipments?.length || 0) > 0 && (
                                            <li>{plant.equipments?.length} equipment item(s) - remove plant link</li>
                                        )}
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
                                    : 'Archive Plant'
                            }
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
