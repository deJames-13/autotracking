import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Plant } from '@/types';

interface PlantViewDialogProps {
    plant: Plant | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PlantViewDialog({ plant, open, onOpenChange }: PlantViewDialogProps) {
    if (!plant) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-lg">
                <DialogHeader>
                    <DialogTitle>Plant Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Plant ID</label>
                                <p className="text-sm">{plant.plant_id}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Plant Name</label>
                                <p className="text-sm">{plant.plant_name}</p>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Address</label>
                                <p className="text-sm">{plant.address || 'No address provided'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Telephone</label>
                                <p className="text-sm">{plant.telephone || 'No telephone provided'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Total Users</label>
                                <p className="text-sm">{plant.users?.length || 0} users</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Created</label>
                                <p className="text-sm">{new Date(plant.created_at).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Last Updated</label>
                                <p className="text-sm">{new Date(plant.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
