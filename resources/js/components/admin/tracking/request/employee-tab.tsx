import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, User, CheckCircle, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';

interface EmployeeTabProps {
    data: {
        technician: any;
        employee: any;
        equipment: any;
        calibration: any;
        scannedEmployee?: any;
        receivedBy?: any;
    };
    onChange: (key: string, value: any) => void;
    errors?: Record<string, string>;
}

const EmployeeTab: React.FC<EmployeeTabProps> = ({ data, onChange, errors = {} }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState(data.employee || data.scannedEmployee);

    // Update selected employee when data changes
    useEffect(() => {
        setSelectedEmployee(data.employee || data.scannedEmployee);
    }, [data.employee, data.scannedEmployee]);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        try {
            const response = await axios.get(route('api.employees.search'), {
                params: { term: searchTerm },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.data.success) {
                setSearchResults(response.data.employees || []);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching employees:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectEmployee = (employee: any) => {
        setSelectedEmployee(employee);
        onChange('employee', employee);
        setSearchResults([]);
        setSearchTerm(`${employee.first_name} ${employee.last_name}`);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const clearSelection = () => {
        setSelectedEmployee(null);
        onChange('employee', null);
        setSearchTerm('');
        setSearchResults([]);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Employee Selection
                    </CardTitle>
                    <CardDescription>
                        Search and select the employee for this tracking request
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Search Input */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label htmlFor="employee-search">Employee Search</Label>
                                <Input
                                    id="employee-search"
                                    type="text"
                                    placeholder="Search by name, employee ID, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className={errors.employee ? 'border-red-500' : ''}
                                />
                                {errors.employee && (
                                    <p className="text-sm text-red-500 mt-1">{errors.employee}</p>
                                )}
                            </div>
                            <Button
                                type="button"
                                onClick={handleSearch}
                                disabled={isSearching || !searchTerm.trim()}
                            >
                                <Search className="w-4 h-4 mr-2" />
                                {isSearching ? 'Searching...' : 'Search'}
                            </Button>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="space-y-2">
                                <Label>Search Results</Label>
                                {searchResults.map((employee) => (
                                    <div
                                        key={employee.employee_id}
                                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => handleSelectEmployee(employee)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium">
                                                    {employee.first_name} {employee.last_name}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    ID: {employee.employee_id} | {employee.email}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {employee.department?.department_name} - {employee.plant?.plant_name}
                                                </p>
                                            </div>
                                            <Badge variant="outline">
                                                {employee.role?.role_name || 'Employee'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Show message when scanned employee is auto-selected */}
                        {data.scannedEmployee && !data.employee && (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Employee automatically selected from QR code scan: {data.scannedEmployee.first_name} {data.scannedEmployee.last_name}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Selected Employee Display */}
                        {selectedEmployee && (
                            <div className="mt-6">
                                <Separator className="mb-4" />
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <Label className="text-lg font-medium">Selected Employee</Label>
                                    </div>
                                    {data.employee && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearSelection}
                                        >
                                            Clear Selection
                                        </Button>
                                    )}
                                </div>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                                                <p className="text-sm">
                                                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                                                </p>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Employee ID</Label>
                                                <p className="text-sm">{selectedEmployee.employee_id}</p>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Email</Label>
                                                <p className="text-sm">{selectedEmployee.email}</p>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Role</Label>
                                                <Badge variant="outline" className="ml-2">
                                                    {selectedEmployee.role?.role_name || 'Employee'}
                                                </Badge>
                                            </div>

                                            {selectedEmployee.department && (
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Department</Label>
                                                    <p className="text-sm">{selectedEmployee.department.department_name}</p>
                                                </div>
                                            )}

                                            {selectedEmployee.plant && (
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Plant</Label>
                                                    <p className="text-sm">{selectedEmployee.plant.plant_name}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Additional Information */}
                                        {selectedEmployee.phone && (
                                            <div className="mt-4 pt-4 border-t">
                                                <Label className="text-sm font-medium text-gray-600">Phone</Label>
                                                <p className="text-sm">{selectedEmployee.phone}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* No Results Message */}
                        {searchTerm && searchResults.length === 0 && !isSearching && !selectedEmployee && (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    No employees found matching "{searchTerm}". Please try a different search term.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EmployeeTab;
