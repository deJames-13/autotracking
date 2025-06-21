import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type TrackIncoming } from '@/types';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface TrackIncomingDeleteDialogProps {
    record: TrackIncoming | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function TrackIncomingDeleteDialog({ record, open, onOpenChange, onSuccess }: TrackIncomingDeleteDialogProps) {
    const [forceDelete, setForceDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const hasRelatedRecords = record && record.track_outgoing;

    const handleDelete = async () => {
        if (!record) return;

        setIsDeleting(true);

        try {
            const response = await axios.delete(`/api/v1/track-incoming/${record.id}`, {
                data: forceDelete ? { force: true } : {},
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            onOpenChange(false);
            setForceDelete(false);
            setIsDeleting(false);

            const message = forceDelete
                ? 'Incoming record and all related outgoing records permanently deleted.'
                : 'Incoming record archived successfully.';

            toast.success(message);
            onSuccess();
        } catch (error: any) {
            console.error('Error deleting incoming record:', error);
            setIsDeleting(false);

            if (error.response?.status === 403) {
                toast.error('Unauthorized. Only admin users can delete tracking records.');
            } else if (error.response?.status === 422) {
                toast.error(error.response.data.message || 'Cannot archive record with related outgoing records.');
            } else {
                toast.error('Failed to delete incoming record. Please try again.');
            }
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
        setForceDelete(false);
    };

    if (!record) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {forceDelete ? 'Force Delete Incoming Record' : 'Archive Incoming Record'}
                    </DialogTitle>
                    <DialogDescription>
                        {forceDelete
                            ? 'Are you sure you want to permanently delete this incoming record and all its related outgoing records? This action cannot be undone.'
                            : 'Are you sure you want to archive this incoming record? The record will be hidden from the main list but can be restored later.'
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg border p-4">
                        <div className="font-medium">Recall #: {record.recall_number}</div>
                        <div className="text-muted-foreground mt-1 text-sm">
                            <div>ID: {record.id}</div>
                            <div>Equipment: {record.equipment?.description || 'N/A'}</div>
                            <div>Technician: {record.technician ? `${record.technician.first_name} ${record.technician.last_name}` : 'Not assigned'}</div>
                            <div>Status: {record.status}</div>
                            <div>Outgoing Records: {hasRelatedRecords ? 1 : 0}</div>
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
                                    This incoming record has related outgoing records. Normal archiving will fail.
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
                                    Force delete (permanently delete incoming record and all related outgoing records)
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
                                        <li>The incoming record and all its data</li>
                                        <li>All related outgoing records</li>
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
                                    : 'Archive Record'
                            }
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
