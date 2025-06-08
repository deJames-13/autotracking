import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Department } from '@/types';

interface DepartmentViewDialogProps {
    department: Department | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DepartmentViewDialog({ department, open, onOpenChange }: DepartmentViewDialogProps) {
    if (!department) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-lg">
                <DialogHeader>
                    <DialogTitle>Department Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Department ID</label>
                                <p className="text-sm">{department.department_id}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Department Name</label>
                                <p className="text-sm">{department.department_name}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Total Users</label>
                                <p className="text-sm">{department.users?.length || 0} users</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Total Locations</label>
                                <p className="text-sm">{department.locations?.length || 0} locations</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Created</label>
                                <p className="text-sm">{new Date(department.created_at).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-sm font-medium">Last Updated</label>
                                <p className="text-sm">{new Date(department.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
