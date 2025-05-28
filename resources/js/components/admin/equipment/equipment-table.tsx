import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type Equipment, type User, type PaginationData } from '@/types';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { EquipmentViewDialog } from './equipment-view-dialog';
import { EquipmentEditDialog } from './equipment-edit-dialog';
import { EquipmentDeleteDialog } from './equipment-delete-dialog';

interface EquipmentTableProps {
    equipment: PaginationData<Equipment>;
    users: User[];
    onRefresh?: () => void;
}

export function EquipmentTable({ equipment, users, onRefresh }: EquipmentTableProps) {
    const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);

    const handleEditSuccess = () => {
        console.log('EquipmentTable: Edit success triggered');
        setEditingEquipment(null);
        router.reload({ only: ['equipment'] });
    };

    const handleDeleteSuccess = () => {
        console.log('EquipmentTable: Delete success triggered');
        setDeletingEquipment(null);
        router.reload({ only: ['equipment'] });
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead className="w-[150px]">Serial Number</TableHead>
                            <TableHead className="w-[200px]">Description</TableHead>
                            <TableHead className="w-[150px]">Manufacturer</TableHead>
                            <TableHead className="w-[200px]">Assigned User</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[100px]">Created</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {equipment.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No equipment found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            equipment.data.map((item) => (
                                <TableRow key={item.equipment_id}>
                                    <TableCell className="font-medium">
                                        {item.equipment_id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">
                                            {item.serial_number}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm max-w-[200px] truncate" title={item.description}>
                                            {item.description}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {item.manufacturer}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {item.user ? (
                                                <div>
                                                    <div className="font-medium">
                                                        {item.user.full_name || `${item.user.first_name} ${item.user.last_name}`}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        ID: {item.user.employee_id}
                                                        {item.user.role && (
                                                            <span> • {item.user.role.role_name.replace('_', ' ')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">Unassigned</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.user ? "default" : "secondary"}>
                                            {item.user ? 'Assigned' : 'Available'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setViewingEquipment(item)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditingEquipment(item)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingEquipment(item)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Equipment Dialogs */}
            <EquipmentViewDialog
                equipment={viewingEquipment}
                open={!!viewingEquipment}
                onOpenChange={(open) => !open && setViewingEquipment(null)}
            />

            <EquipmentEditDialog
                equipment={editingEquipment}
                users={users}
                open={!!editingEquipment}
                onOpenChange={(open) => !open && setEditingEquipment(null)}
                onSuccess={handleEditSuccess}
            />

            <EquipmentDeleteDialog
                equipment={deletingEquipment}
                open={!!deletingEquipment}
                onOpenChange={(open) => !open && setDeletingEquipment(null)}
                onSuccess={handleDeleteSuccess}
            />
        </>
    );
}
