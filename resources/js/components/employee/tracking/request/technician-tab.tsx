import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User } from '@/types';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';

interface EmployeeTechnicianTabProps {
    data: User | null;
    onChange: (technician: User | null) => void;
    errors: Record<string, string>;
}

const EmployeeTechnicianTab: React.FC<EmployeeTechnicianTabProps> = ({ data, onChange, errors = {} }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch technicians
    useEffect(() => {
        const fetchTechnicians = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams();
                if (searchQuery) {
                    queryParams.append('search', searchQuery);
                }
                // Only get technicians
                queryParams.append('role_name', 'technician');

                const response = await axios.get(`/admin/users?${queryParams.toString()}`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                setTechnicians(response.data.data.data);
            } catch (error) {
                console.error('Error fetching technicians:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTechnicians();
    }, [searchQuery]);

    const hasError = !!errors.technician;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Select Technician</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search technicians..."
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
                        <div className="grid grid-cols-3 bg-muted px-4 py-2 text-sm font-medium">
                            <div>Selection</div>
                            <div>Name</div>
                            <div>Department</div>
                        </div>

                        {loading ? (
                            <div className="divide-y">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="grid grid-cols-3 px-4 py-3 items-center">
                                        <div><Skeleton className="h-4 w-4 rounded-full" /></div>
                                        <div><Skeleton className="h-4 w-32" /></div>
                                        <div><Skeleton className="h-4 w-24" /></div>
                                    </div>
                                ))}
                            </div>
                        ) : technicians.length > 0 ? (
                            <div className="divide-y">
                                {technicians.map((tech) => (
                                    <div
                                        key={tech.employee_id}
                                        className="grid grid-cols-3 px-4 py-3 items-center hover:bg-muted cursor-pointer"
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
                                        <div>{tech.department?.department_name || 'Not assigned'}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-muted-foreground">
                                No technicians found.
                            </div>
                        )}
                    </RadioGroup>
                </div>

                {errors.technician && <p className="text-sm text-destructive mt-2">{errors.technician}</p>}
            </CardContent>
        </Card>
    );
};

export default EmployeeTechnicianTab;
