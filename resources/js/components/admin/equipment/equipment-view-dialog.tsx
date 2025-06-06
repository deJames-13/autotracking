import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { type Equipment } from '@/types';
import Barcode from 'react-barcode';
import { toast } from 'sonner';

interface EquipmentViewDialogProps {
    equipment: Equipment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EquipmentViewDialog({ equipment, open, onOpenChange }: EquipmentViewDialogProps) {
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
            <DialogContent className="max-w-lg max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Equipment Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6">
                        {/* Barcode for Recall Number */}
                        {equipment.recall_number && (
                            <div className="flex flex-col items-center mb-4">
                                <div className="equipment-barcode-container">
                                    <Barcode
                                        value={equipment.recall_number}
                                        width={2}
                                        height={60}
                                        displayValue={true}
                                        fontSize={16}
                                        margin={8}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-muted-foreground">Recall Number Barcode</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadBarcode}
                                        className="h-6 px-2"
                                    >
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Equipment ID</label>
                                <p className="text-sm">{equipment.equipment_id}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Recall Number</label>
                                <p className="text-sm">{equipment.recall_number}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                                <p className="text-sm">{equipment.serial_number || 'N/A'}</p>
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
                                <p className="text-sm">{equipment.track_incoming?.length || 0} tracking records</p>
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
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Plant</label>
                                <p className="text-sm">{equipment.plant?.plant_name || 'Not assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Department</label>
                                <p className="text-sm">{equipment.department?.department_name || 'Not assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Location</label>
                                <p className="text-sm">{equipment.location?.location_name || 'Not assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <p className="text-sm">
                                    <Badge variant={equipment.status === 'active' ? 'default' : 'secondary'}>
                                        {equipment.status?.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Last Calibration</label>
                                <p className="text-sm">{equipment.last_calibration_date || 'Never'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Next Due Date</label>
                                <p className="text-sm">{equipment.next_calibration_due || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
