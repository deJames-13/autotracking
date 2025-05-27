import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Location } from '@/types';

interface LocationViewDialogProps {
    location: Location | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LocationViewDialog({ location, open, onOpenChange }: LocationViewDialogProps) {
    if (!location) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Location Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Location ID</label>
                                <p className="text-sm">{location.location_id}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Location Name</label>
                                <p className="text-sm">{location.location_name}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Department</label>
                                <p className="text-sm">{location.department?.department_name || 'No department'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Created</label>
                                <p className="text-sm">
                                    {new Date(location.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                <p className="text-sm">
                                    {new Date(location.updated_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
