import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Technician {
    id: string;
    name: string;
    department: string;
    specialization: string;
}

interface TechnicianTabProps {
    data: Technician | null;
    onChange: (technician: Technician | null) => void;
    errors: Record<string, string>;
}

// Mock data for technicians (would come from backend in real app)
const mockTechnicians: Technician[] = [
    { id: '1', name: 'John Doe', department: 'Maintenance', specialization: 'Electrical' },
    { id: '2', name: 'Jane Smith', department: 'Engineering', specialization: 'Mechanical' },
    { id: '3', name: 'Robert Johnson', department: 'Maintenance', specialization: 'Calibration' },
    { id: '4', name: 'Emily Brown', department: 'Engineering', specialization: 'Electronics' },
];

const TechnicianTab: React.FC<TechnicianTabProps> = ({ data, onChange, errors = {} }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTechnicians = mockTechnicians.filter(tech =>
        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Check for technician selection error
    const hasError = !!errors.technician;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Select Technician</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-2">
                        <div className="relative mt-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search-technician"
                                placeholder="Search by name, department, or specialization..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className={`border rounded-md ${hasError ? 'border-destructive' : ''}`}>
                        <RadioGroup
                            value={data?.id ?? ''}
                            onValueChange={(value) => {
                                const selectedTech = mockTechnicians.find(t => t.id === value);
                                onChange(selectedTech || null);
                            }}
                        >
                            <div className="grid grid-cols-4 bg-muted px-4 py-2 text-sm font-medium">
                                <div>Selection</div>
                                <div>Name</div>
                                <div>Department</div>
                                <div>Specialization</div>
                            </div>

                            {filteredTechnicians.length > 0 ? (
                                <div className="divide-y">
                                    {filteredTechnicians.map((tech) => (
                                        <div key={tech.id} className="grid grid-cols-4 px-4 py-3 items-center hover:bg-muted">
                                            <div>
                                                <RadioGroupItem value={tech.id} id={`tech-${tech.id}`} />
                                            </div>
                                            <div>{tech.name}</div>
                                            <div>{tech.department}</div>
                                            <div>{tech.specialization}</div>
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
