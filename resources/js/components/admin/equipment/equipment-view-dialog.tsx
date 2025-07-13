import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CodeDisplay } from '@/components/ui/code-display';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/simple-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Equipment } from '@/types';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface EquipmentViewDialogProps {
    equipment: Equipment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EquipmentViewDialog({ equipment, open, onOpenChange }: EquipmentViewDialogProps) {
    const openTimestamp = useRef<number>(0);

    useEffect(() => {
        if (open) {
            openTimestamp.current = Date.now();
        }
    }, [open]);

    const handleManualClose = () => {
        // Simple close with timeout to prevent auto-close conflicts
        setTimeout(() => {
            onOpenChange(false);
        }, 150);
    };

    const handleInteractOutside = (e: Event) => {
        e.preventDefault();

        // Ignore interactions that happen very soon after opening
        if (Date.now() - openTimestamp.current < 200) {
            return;
        }

        handleManualClose();
    };

    if (!equipment) return null;

    // Remove the old barcode download handler since it's now handled by CodeDisplay component

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-[85vh] max-w-lg"
                onInteractOutside={handleInteractOutside}
                onOpenAutoFocus={(e) => {
                    // Prevent automatic focus to avoid conflicts
                    e.preventDefault();
                }}
                onCloseAutoFocus={(e) => {
                    // Prevent automatic focus restoration to avoid conflicts
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    // Handle escape key with timing to prevent freezing
                    e.preventDefault();
                    handleManualClose();
                }}
                onPointerDownOutside={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle>Equipment Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6">
                        {/* QR Code / Barcode for Recall Number */}
                        {equipment.recall_number && (
                            <CodeDisplay
                                value={equipment.recall_number}
                                label="Recall Number"
                                filename={equipment.recall_number}
                                containerClassName="equipment-code-container"
                                showDownload={true}
                                format="CODE128"
                                width={2}
                                height={60}
                                fontSize={16}
                                margin={8}
                                qrSize={128}
                            />
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Equipment ID</label>
                                <p className="text-sm">{equipment.equipment_id}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Recall Number</label>
                                <p className="text-sm">{equipment.recall_number}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Serial Number</label>
                                <p className="text-sm">{equipment.serial_number || 'N/A'}</p>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Description</label>
                                <p className="text-sm">{equipment.description}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Manufacturer</label>
                                <p className="text-sm">{equipment.manufacturer}</p>
                            </div>
                            {equipment?.process_req_range_start && (
                                <div>
                                    <label className="text-sm font-medium">Process Request Range</label>
                                    <span className="flex items-center gap-2">
                                        <p className="text-muted-foreground text-sm">{equipment?.process_req_range_start}</p>
                                        <ArrowRight className="text-sm" />
                                        <p className="text-muted-foreground text-sm">{equipment?.process_req_range_end}</p>
                                    </span>
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Assignment Status</label>
                                <div>
                                    <Badge variant={equipment.user ? 'default' : 'secondary'}>{equipment.user ? 'Assigned' : 'Unassigned'}</Badge>
                                </div>
                            </div>
                            {equipment.user && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-muted-foreground text-sm font-medium">Assigned User</label>
                                        <p className="text-sm">
                                            {equipment.user.full_name || `${equipment.user.first_name} ${equipment.user.last_name}`}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-muted-foreground text-sm font-medium">User Details</label>
                                        <div className="text-sm">
                                            <div>ID: {equipment.user.employee_id}</div>
                                            {equipment.user.role && <div>Role: {equipment.user.role.role_name.replace('_', ' ')}</div>}
                                            {equipment.user.department && <div>Department: {equipment.user.department.department_name}</div>}
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Total Records</label>
                                <p className="text-sm">{equipment.track_incoming?.length || 0} tracking records</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Created</label>
                                <p className="text-sm">{new Date(equipment.created_at).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Last Updated</label>
                                <p className="text-sm">{new Date(equipment.updated_at).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Plant</label>
                                <p className="text-sm">{equipment.plant?.plant_name || 'Not assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Department</label>
                                <p className="text-sm">{equipment.department?.department_name || 'Not assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Location</label>
                                <p className="text-sm">{equipment.location?.location_name || 'Not assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Status</label>
                                <p className="text-sm">
                                    <Badge variant={equipment.status === 'active' ? 'default' : 'secondary'}>
                                        {equipment.status?.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Last Calibration</label>
                                <p className="text-sm">{equipment.last_calibration_date || 'Never'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Next Due Date</label>
                                <p className="text-sm">{equipment.next_calibration_due || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
