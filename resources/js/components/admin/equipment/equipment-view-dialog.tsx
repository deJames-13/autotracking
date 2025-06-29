import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/simple-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Equipment } from '@/types';
import { ArrowRight, Download } from 'lucide-react';
import { useEffect, useRef } from 'react';
import Barcode from 'react-barcode';
import { toast } from 'react-hot-toast';

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

    // Handle barcode download
    const handleDownloadBarcode = () => {
        try {
            // Find the barcode SVG element
            const barcodeSvg = document.querySelector('.equipment-barcode-container svg') as SVGSVGElement;
            if (!barcodeSvg) {
                toast.error('Barcode not found');
                return;
            }

            // Get SVG dimensions
            const svgRect = barcodeSvg.getBoundingClientRect();
            const svgWidth = svgRect.width || 300;
            const svgHeight = svgRect.height || 100;

            // Create a canvas to convert SVG to PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                toast.error('Could not create download canvas');
                return;
            }

            // Set canvas size with some padding
            canvas.width = svgWidth + 20;
            canvas.height = svgHeight + 20;

            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Convert SVG to data URL
            const svgData = new XMLSerializer().serializeToString(barcodeSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // Create an image element to load the SVG
            const img = new Image();
            img.onload = () => {
                // Draw the SVG image onto the canvas with padding
                ctx.drawImage(img, 10, 10, svgWidth, svgHeight);

                // Convert canvas to blob and download
                canvas.toBlob((blob) => {
                    if (!blob) {
                        toast.error('Could not generate barcode image');
                        return;
                    }

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `equipment-barcode-${equipment.recall_number || 'unknown'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    URL.revokeObjectURL(svgUrl);

                    toast.success('Barcode downloaded successfully');
                }, 'image/png');
            };

            img.onerror = () => {
                toast.error('Failed to load barcode for download');
                URL.revokeObjectURL(svgUrl);
            };

            img.src = svgUrl;
        } catch (error) {
            console.error('Error downloading barcode:', error);
            toast.error('Failed to download barcode');
        }
    };

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
                        {/* Barcode for Recall Number */}
                        {equipment.recall_number && (
                            <div className="mb-4 flex flex-col items-center">
                                <div className="equipment-barcode-container">
                                    <Barcode
                                        format='CODE128'
                                        value={equipment.recall_number} width={2} height={60} displayValue={true} fontSize={16} margin={8} />
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-muted-foreground text-xs">Recall Number Barcode</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadBarcode}
                                        className="h-6 px-2"
                                        onFocus={(e) => e.stopPropagation()}
                                        onBlur={(e) => e.stopPropagation()}
                                    >
                                        <Download className="mr-1 h-3 w-3" />
                                        Download
                                    </Button>
                                </div>
                            </div>
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
