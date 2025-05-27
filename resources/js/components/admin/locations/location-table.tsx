import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Department, type Location, type PaginationData } from '@/types';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { LocationViewDialog } from './location-view-dialog';
import { LocationEditDialog } from './location-edit-dialog';
import { LocationDeleteDialog } from './location-delete-dialog';

interface LocationTableProps {
    locations: PaginationData<Location>;
    departments: Department[];
    onRefresh: () => void;
}

export function LocationTable({ locations, departments, onRefresh }: LocationTableProps) {
    const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead className="w-[250px]">Location Name</TableHead>
                            <TableHead className="w-[200px]">Department</TableHead>
                            <TableHead className="w-[150px]">Created</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {locations.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No locations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            locations.data.map((location) => (
                                <TableRow key={location.location_id}>
                                    <TableCell className="font-medium">
                                        {location.location_id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">
                                            {location.location_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {location.department?.department_name || (
                                                <span className="text-muted-foreground italic">No department</span>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(location.created_at).toLocaleDateString()}
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
                                                <DropdownMenuItem onClick={() => setViewingLocation(location)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditingLocation(location)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingLocation(location)}
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

            {/* Location Dialogs */}
            <LocationViewDialog
                location={viewingLocation}
                open={!!viewingLocation}
                onOpenChange={(open) => !open && setViewingLocation(null)}
            />

            <LocationEditDialog
                location={editingLocation}
                departments={departments}
                open={!!editingLocation}
                onOpenChange={(open) => !open && setEditingLocation(null)}
                onSuccess={onRefresh}
            />

            <LocationDeleteDialog
                location={deletingLocation}
                open={!!deletingLocation}
                onOpenChange={(open) => !open && setDeletingLocation(null)}
                onSuccess={onRefresh}
            />
        </>
    );
}
