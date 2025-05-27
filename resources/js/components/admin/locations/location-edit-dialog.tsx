import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Department, type Location } from '@/types';
import { LocationForm } from './location-form';

interface LocationEditDialogProps {
    location: Location | null;
    departments: Department[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function LocationEditDialog({
    location,
    departments,
    open,
    onOpenChange,
    onSuccess
}: LocationEditDialogProps) {
    const handleSuccess = () => {
        onOpenChange(false);
        onSuccess();
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!location) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Edit Location</DialogTitle>
                    <DialogDescription>
                        Update location information.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <LocationForm
                        location={location}
                        departments={departments}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
