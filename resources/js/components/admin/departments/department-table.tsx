import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Department, type PaginationData } from '@/types';
import { router } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DepartmentDeleteDialog } from './department-delete-dialog';
import { DepartmentEditDialog } from './department-edit-dialog';
import { DepartmentViewDialog } from './department-view-dialog';

interface DepartmentTableProps {
    departments: PaginationData<Department>;
    onRefresh?: () => void;
}

export function DepartmentTable({ departments, onRefresh }: DepartmentTableProps) {
    const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

    const handleEditSuccess = () => {
        console.log('DepartmentTable: Edit success triggered');
        setEditingDepartment(null);

        // Use onRefresh callback if available, otherwise reload page
        if (onRefresh) {
            onRefresh();
        } else {
            router.reload({ only: ['departments'] });
        }
    };

    const handleDeleteSuccess = () => {
        console.log('DepartmentTable: Delete success triggered');
        setDeletingDepartment(null);

        // Use onRefresh callback if available, otherwise reload page
        if (onRefresh) {
            onRefresh();
        } else {
            router.reload({ only: ['departments'] });
        }
    };

    return (
        <>
            <div className="rounded-md border overflow-scroll">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead className="w-[300px]">Department Name</TableHead>
                            <TableHead className="w-[120px]">Users</TableHead>
                            <TableHead className="w-[120px]">Locations</TableHead>
                            <TableHead className="w-[150px]">Created</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No departments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            departments.data.map((department) => (
                                <TableRow key={department.department_id}>
                                    <TableCell className="font-medium">{department.department_id}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{department.department_name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">{department.users?.length || 0} users</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">{department.locations?.length || 0} locations</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">{new Date(department.created_at).toLocaleDateString()}</div>
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
                                                <DropdownMenuItem onClick={() => setViewingDepartment(department)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditingDepartment(department)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeletingDepartment(department)} className="text-destructive">
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

            {/* Department Dialogs */}
            <DepartmentViewDialog
                department={viewingDepartment}
                open={!!viewingDepartment}
                onOpenChange={(open) => !open && setViewingDepartment(null)}
            />

            <DepartmentEditDialog
                department={editingDepartment}
                open={!!editingDepartment}
                onOpenChange={(open) => !open && setEditingDepartment(null)}
                onSuccess={handleEditSuccess}
            />

            <DepartmentDeleteDialog
                department={deletingDepartment}
                open={!!deletingDepartment}
                onOpenChange={(open) => !open && setDeletingDepartment(null)}
                onSuccess={handleDeleteSuccess}
            />
        </>
    );
}
