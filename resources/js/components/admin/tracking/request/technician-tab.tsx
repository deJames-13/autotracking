import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User, Role, Department, Plant } from '@/types';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TechnicianTabProps {
    data: User | null;
    onChange: (technician: User | null) => void;
    errors: Record<string, string>;
}

const TechnicianTab: React.FC<TechnicianTabProps> = ({ data, onChange, errors = {} }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [plants, setPlants] = useState<Plant[]>([]);
    const [filters, setFilters] = useState({
        role_id: '',
        department_id: '',
    });

    // Fetch technicians and filter options
    useEffect(() => {
        const fetchTechnicians = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams();

                if (searchQuery) {
                    queryParams.append('search', searchQuery);
                }

                // Always filter for technicians only
                queryParams.append('role_name', 'technician');

                if (filters.department_id) {
                    queryParams.append('department_id', filters.department_id);
                }

                const response = await axios.get(`/admin/users?${queryParams.toString()}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                // Additional client-side filter to ensure only technicians
                const technicianUsers = response.data.data.data.filter(user =>
                    user.role?.role_name === 'technician'
                );

                setTechnicians(technicianUsers);
                setRoles(response.data.roles);
                setDepartments(response.data.departments);
                setPlants(response.data.plants);
            } catch (error) {
                console.error('Error fetching technicians:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTechnicians();
    }, [searchQuery, filters]);

    // Handle filter changes
    const handleFilterChange = (key: string, value: string) => {
        // Don't allow role filtering since we only want technicians
        if (key === 'role_id') {
            return;
        }

        setFilters(prev => ({
            ...prev,
            [key]: value === 'all' ? '' : value // Convert "all" to empty string for backend
        }));
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            role_id: '', // Keep this but it won't be used
            department_id: '',
        });
        setSearchQuery('');
    };

    // Check for technician selection error
    const hasError = !!errors.technician;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Select Technician</CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuLabel>Filter Technicians</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem className="p-0 focus:bg-transparent">
                                        <div className="p-2 w-full">
                                            <Label htmlFor="department">Department</Label>
                                            <Select
                                                value={filters.department_id || 'all'}
                                                onValueChange={(value) => handleFilterChange('department_id', value)}
                                            >
                                                <SelectTrigger id="department">
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Departments</SelectItem>
                                                    {departments.map((dept) => (
                                                        <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                                                            {dept.department_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-center"
                                        onClick={resetFilters}
                                    >
                                        Reset Filters
                                    </Button>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative mt-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search-technician"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className={`border rounded-md ${hasError ? 'border-destructive' : ''}`}>
                        <RadioGroup
                            value={data?.employee_id?.toString() ?? ''}
                            onValueChange={(value) => {
                                const selectedTech = technicians.find(t => t.employee_id.toString() === value);
                                onChange(selectedTech || null);
                            }}
                        >
                            <div className="grid grid-cols-5 bg-muted px-4 py-2 text-sm font-medium">
                                <div>Selection</div>
                                <div>Name</div>
                                <div>Role</div>
                                <div>Department</div>
                                <div>Plant</div>
                            </div>

                            {loading ? (
                                <div className="divide-y">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="grid grid-cols-5 px-4 py-3 items-center">
                                            <div><Skeleton className="h-4 w-4 rounded-full" /></div>
                                            <div><Skeleton className="h-4 w-32" /></div>
                                            <div><Skeleton className="h-4 w-24" /></div>
                                            <div><Skeleton className="h-4 w-24" /></div>
                                            <div><Skeleton className="h-4 w-24" /></div>
                                        </div>
                                    ))}
                                </div>
                            ) : technicians.length > 0 ? (
                                <div className="divide-y">
                                        {technicians.map((tech) => (
                                            <div
                                                key={tech.employee_id}
                                                className="grid grid-cols-5 px-4 py-3 items-center hover:bg-muted cursor-pointer"
                                                onClick={() => onChange(tech)}
                                            >
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <RadioGroupItem
                                                        value={tech.employee_id.toString()}
                                                        id={`tech-${tech.employee_id}`}
                                                    />
                                                </div>
                                            <div>
                                                <div className="font-medium">{tech.full_name || `${tech.first_name} ${tech.last_name}`}</div>
                                                <div className="text-sm text-muted-foreground">{tech.email}</div>
                                            </div>
                                                <div>{tech.role?.role_name || 'Not assigned'}</div>
                                            <div>{tech.department?.department_name || 'Not assigned'}</div>
                                            <div>{tech.plant?.plant_name || 'Not assigned'}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-muted-foreground">
                                    No technicians found matching your search.
                                </div>
                            )}
                        </RadioGroup>
                    </div>

                    {/* Display validation error */}
                    {errors.technician && <p className="text-sm text-destructive mt-2">{errors.technician}</p>}
                </CardContent>
            </Card>
        </div>
    );
};

export default TechnicianTab;
