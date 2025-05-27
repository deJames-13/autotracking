import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { type Equipment } from '@/types';

interface EquipmentViewDialogProps {
    equipment: Equipment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EquipmentViewDialog({ equipment, open, onOpenChange }: EquipmentViewDialogProps) {
    if (!equipment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Equipment Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Equipment ID</label>
                                <p className="text-sm">{equipment.equipment_id}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                                <p className="text-sm">{equipment.serial_number}</p>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <p className="text-sm">{equipment.description}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                                <p className="text-sm">{equipment.manufacturer}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Assignment Status</label>
                                <div>
                                    <Badge variant={equipment.user ? "default" : "secondary"}>
                                        {equipment.user ? 'Assigned' : 'Unassigned'}
                                    </Badge>
                                </div>
                            </div>
                            {equipment.user && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Assigned User</label>
                                        <p className="text-sm">
                                            {equipment.user.full_name || `${equipment.user.first_name} ${equipment.user.last_name}`}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">User Details</label>
                                        <div className="text-sm">
                                            <div>ID: {equipment.user.employee_id}</div>
                                            {equipment.user.role && (
                                                <div>Role: {equipment.user.role.role_name.replace('_', ' ')}</div>
                                            )}
                                            {equipment.user.department && (
                                                <div>Department: {equipment.user.department.department_name}</div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Total Records</label>
                                <p className="text-sm">{equipment.tracking_records?.length || 0} tracking records</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Created</label>
                                <p className="text-sm">
                                    {new Date(equipment.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                <p className="text-sm">
                                    {new Date(equipment.updated_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
