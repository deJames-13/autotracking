import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2 } from 'lucide-react';
import { type Department } from '@/types';
import { DepartmentCreateDialog } from '@/components/admin/departments/department-create-dialog';

interface DepartmentSelectProps {
    departments: Department[];
    value: string;
    onValueChange: (value: string) => void;
    onDepartmentCreated: (department: Department) => void;
    error?: string;
    required?: boolean;
}

export function DepartmentSelect({
    departments = [],
    value,
    onValueChange,
    onDepartmentCreated,
    error,
    required = false
}: DepartmentSelectProps) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const handleDepartmentCreated = (department: Department) => {
        onDepartmentCreated(department);
        onValueChange(department.department_id.toString());
        setShowCreateDialog(false);
    };

    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="department_id">
                    Department {required && '*'}
                </Label>
                <div className="flex gap-2">
                    <Select value={value} onValueChange={onValueChange}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((department) => (
                                <SelectItem
                                    key={department.department_id}
                                    value={department.department_id.toString()}
                                >
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        {department.department_name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowCreateDialog(true)}
                        title="Add new department"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {error && (
                    <span className="text-sm text-destructive">{error}</span>
                )}
            </div>

            <DepartmentCreateDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleDepartmentCreated}
            />
        </>
    );
}
