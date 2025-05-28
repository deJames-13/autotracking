import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Plant, type PaginationData } from '@/types';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { PlantViewDialog } from './plant-view-dialog';
import { PlantEditDialog } from './plant-edit-dialog';
import { PlantDeleteDialog } from './plant-delete-dialog';

interface PlantTableProps {
    plants: PaginationData<Plant>;
    onRefresh?: () => void;
}

export function PlantTable({ plants, onRefresh }: PlantTableProps) {
    const [viewingPlant, setViewingPlant] = useState<Plant | null>(null);
    const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
    const [deletingPlant, setDeletingPlant] = useState<Plant | null>(null);

    const handleRefresh = () => {
        console.log('PlantTable: Refresh triggered');
        if (onRefresh) {
            onRefresh();
        } else {
            // Fallback to Inertia reload if no onRefresh provided
            router.reload({ only: ['plants'] });
        }
    };

    const handleEditSuccess = () => {
        console.log('PlantTable: Edit success triggered');
        setEditingPlant(null);
        // Use Inertia reload to refresh the page data
        router.reload({ only: ['plants'] });
    };

    const handleDeleteSuccess = () => {
        console.log('PlantTable: Delete success triggered');
        setDeletingPlant(null);
        // Use Inertia reload to refresh the page data
        router.reload({ only: ['plants'] });
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead className="w-[200px]">Plant Name</TableHead>
                            <TableHead className="w-[300px]">Address</TableHead>
                            <TableHead className="w-[150px]">Telephone</TableHead>
                            <TableHead className="w-[120px]">Users</TableHead>
                            <TableHead className="w-[150px]">Created</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plants.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No plants found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            plants.data.map((plant) => (
                                <TableRow key={plant.plant_id}>
                                    <TableCell className="font-medium">
                                        {plant.plant_id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">
                                            {plant.plant_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm max-w-[300px] truncate" title={plant.address || ''}>
                                            {plant.address || <span className="text-muted-foreground italic">No address</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {plant.telephone || <span className="text-muted-foreground italic">No telephone</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                            {plant.users?.length || 0} users
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(plant.created_at).toLocaleDateString()}
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
                                                <DropdownMenuItem onClick={() => setViewingPlant(plant)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditingPlant(plant)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingPlant(plant)}
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

            {/* Plant Dialogs */}
            <PlantViewDialog
                plant={viewingPlant}
                open={!!viewingPlant}
                onOpenChange={(open) => !open && setViewingPlant(null)}
            />

            <PlantEditDialog
                plant={editingPlant}
                open={!!editingPlant}
                onOpenChange={(open) => !open && setEditingPlant(null)}
                onSuccess={handleEditSuccess}
            />

            <PlantDeleteDialog
                plant={deletingPlant}
                open={!!deletingPlant}
                onOpenChange={(open) => !open && setDeletingPlant(null)}
                onSuccess={handleDeleteSuccess}
            />
        </>
    );
}
