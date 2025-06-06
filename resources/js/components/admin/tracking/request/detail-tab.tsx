import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EquipmentSchema } from '@/validation/tracking-request-schema';
import { InertiaSmartSelect, SelectOption } from '@/components/ui/smart-select';
import { QrCode, Scan, Search } from 'lucide-react';
import axios from 'axios';
import { User } from '@/types';
import { toast } from 'react-hot-toast';
import { CalendarIcon, User as UserIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setScannedEmployee, updateEquipment, setReceivedBy } from '@/store/slices/trackingRequestSlice';

interface DetailTabProps {
    data: EquipmentSchema;
    onChange: (data: EquipmentSchema) => void;
    onScannedEmployeeChange?: (employee: User | null) => void; // Deprecated: Redux state is used directly
    onReceivedByChange?: (user: User | null) => void;
    errors?: Record<string, string>;
    technician?: User | null;
    receivedBy?: User | null;
    hideReceivedBy?: boolean; // Added to hide receivedBy field for employee context
}

const DetailTab: React.FC<DetailTabProps> = ({
    data,
    onChange,
    onScannedEmployeeChange,
    onReceivedByChange,
    errors = {},
    technician,
    receivedBy,
    hideReceivedBy = false
}) => {
    const { auth } = usePage<SharedData>().props;
    const currentUser = auth.user;
    const dispatch = useAppDispatch();
    const { requestType = '' } = useAppSelector(state => state.trackingRequest);
    const [recallNumber, setRecallNumber] = useState<string>(data.recallNumber || '');
    const [recallBarcode, setRecallBarcode] = useState('');
    const [recallBarcodeError, setRecallBarcodeError] = useState('');
    const [recallLoading, setRecallLoading] = useState(false);

    // Get scannedEmployee from Redux instead of local state
    const { scannedEmployee } = useAppSelector(state => state.trackingRequest);

    const [departments, setDepartments] = useState<SelectOption[]>([]);
    const [locations, setLocations] = useState<SelectOption[]>([]);
    const [plants, setPlants] = useState<SelectOption[]>([]);
    const [loadingInitialData, setLoadingInitialData] = useState(true);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [localDueDate, setLocalDueDate] = useState<string | null>(data.dueDate || null);
    const [employeeBarcode, setEmployeeBarcode] = useState<string>('');
    const [loadingEmployee, setLoadingEmployee] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [barcodeError, setBarcodeError] = useState<string>('');

    // Recall number states
    const [recallError, setRecallError] = useState('');
    const [showRecallScanner, setShowRecallScanner] = useState(false);

    // Function to fetch employee by barcode
    const fetchEmployeeByBarcode = async (barcode: string) => {
        if (!barcode) return;

        setLoadingEmployee(true);
        setBarcodeError(''); // Clear any previous error
        try {
            const response = await axios.get(route('admin.users.search-by-barcode'), {
                params: { barcode },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.data.success && response.data.employee) {
                const employee = response.data.employee;
                // Update Redux state instead of local state
                dispatch(setScannedEmployee(employee));

                // Pass scanned employee to parent (for backward compatibility)
                if (onScannedEmployeeChange) {
                    onScannedEmployeeChange(employee);
                }

                // Auto-fill plant, department, and location based on employee
                const updates: any = {};

                if (employee.plant_id) {
                    updates.plant = employee.plant_id;
                }

                if (employee.department_id) {
                    updates.department = employee.department_id;
                    // Fetch locations for this department
                    setLoadingLocations(true);
                    fetchLocationsByDepartment(employee.department_id);
                }

                if (Object.keys(updates).length > 0) {
                    onChange(updates);
                }

                toast.success(`Employee found: ${employee.first_name} ${employee.last_name}`);
            } else {
                setBarcodeError('Employee not found with this barcode');
                dispatch(setScannedEmployee(null));
                if (onScannedEmployeeChange) {
                    onScannedEmployeeChange(null);
                }
            }
        } catch (error) {
            console.error('Error fetching employee by barcode:', error);
            setBarcodeError('Error searching for employee');
            dispatch(setScannedEmployee(null));
            if (onScannedEmployeeChange) {
                onScannedEmployeeChange(null);
            }
        } finally {
            setLoadingEmployee(false);
        }
    };

    // Recall number: fetch equipment by recall number
    const fetchEquipmentByRecall = async (recall: string) => {
        if (!recall) return;
        setRecallLoading(true);
        setRecallBarcodeError('');
        try {
            const response = await axios.get(route('api.equipment.search-by-recall'), {
                params: { recall_number: recall },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (response.data.success && response.data.equipment) {
                dispatch(updateEquipment({
                    ...response.data.equipment,
                    recallNumber: recall,
                    serialNumber: response.data.equipment.serial_number || '',
                    existing: true,
                    equipment_id: response.data.equipment.equipment_id
                }));
                // Auto-fill serial number in the form
                onChange({ serialNumber: response.data.equipment.serial_number || '' });
            } else {
                dispatch(updateEquipment({
                    recallNumber: recall,
                    existing: false,
                    equipment_id: null
                }));
            }
        } catch (error) {
            setRecallBarcodeError('Error searching for equipment');
        } finally {
            setRecallLoading(false);
        }
    };

    // Handle recall number select/search
    const handleRecallNumberChange = (value: string | number | null) => {
        const recall = value ? String(value) : '';
        setRecallNumber(recall);
        // Always update Redux state with recallNumber
        dispatch(updateEquipment({ recallNumber: recall }));
        if (recall) fetchEquipmentByRecall(recall);
        else dispatch(updateEquipment({ existing: false, equipment_id: null }));
    };

    // Handle recall barcode input
    const handleRecallBarcodeChange = (value: string) => {
        setRecallBarcode(value);
        setRecallBarcodeError('');
        if (value.length > 0) {
            handleRecallNumberChange(value);
        }
    };

    // Handle recall barcode scan
    const handleRecallScan = (detectedCodes: any[]) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const scannedText = detectedCodes[0].rawValue;
            setRecallBarcode(scannedText);
            handleRecallNumberChange(scannedText);
        }
    };

    // SmartSelect load options for recall number
    const loadRecallOptions = async (inputValue: string) => {
        if (!inputValue || inputValue.length < 1) return [];
        try {
            const response = await axios.get(route('api.equipment.search-by-recall'), {
                params: { recall_number: inputValue },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (response.data.success && response.data.equipment) {
                // Use recall_number from backend
                return [{ label: response.data.equipment.recall_number, value: response.data.equipment.recall_number }];
            }
            return [{ label: inputValue, value: inputValue }];
        } catch {
            return [{ label: inputValue, value: inputValue }];
        }
    };


    // Handle barcode input change
    const handleBarcodeChange = (value: string) => {
        setEmployeeBarcode(value);
        setBarcodeError(''); // Clear error when user starts typing
        if (value.length >= 1) { // Employee ID can be just 1 digit
            fetchEmployeeByBarcode(value);
        } else {
            // Update Redux state instead of local state
            dispatch(setScannedEmployee(null));
            if (onScannedEmployeeChange) {
                onScannedEmployeeChange(null);
            }
        }
    };

    // Handle barcode scan
    const handleScan = (detectedCodes: any[]) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const scannedText = detectedCodes[0].rawValue;
            setEmployeeBarcode(scannedText);
            setShowScanner(false);
            fetchEmployeeByBarcode(scannedText);
        }
    };

    // Handle scan error
    const handleScanError = (error: any) => {
        console.error('Scan error:', error);
        toast.error('Error scanning barcode');
    };

    // Function to fetch locations by department
    const fetchLocationsByDepartment = async (departmentId: number) => {
        try {
            const response = await axios.get(route('admin.locations.search-locations'), {
                params: {
                    // department_id: departmentId,
                    limit: 10
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const departmentLocations = response.data.map((location: any) => ({
                label: location.label,
                value: location.value
            }));

            setLocations(departmentLocations);

            // Auto-select first location if user doesn't have a location selected and we have locations
            if (departmentLocations.length > 0 && (!data.location || data.location === '' || data.location === null)) {
                onChange({ location: departmentLocations[0].value });
            }

        } catch (error) {
            console.error('Error fetching locations for department:', error);
        } finally {
            setLoadingLocations(false);
        }
    };

    // Fetch initial data for dropdowns when component mounts
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingInitialData(true);
            try {
                // Fetch departments
                const deptResponse = await axios.get(route('admin.departments.search-departments'), {
                    params: { search: '', limit: 10 }
                });
                setDepartments(deptResponse.data);

                // Fetch plants
                const plantResponse = await axios.get(route('admin.plants.search-plants'), {
                    params: { search: '', limit: 10 }
                });
                setPlants(plantResponse.data);

                // Fetch locations without department filter
                const locResponse = await axios.get('/admin/locations', {
                    params: { limit: 10 },
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                setLocations(locResponse.data.data.data.map((location: any) => ({
                    label: location.location_name,
                    value: location.location_id
                })));
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoadingInitialData(false);
            }
        };

        fetchInitialData();
    }, []);

    // Sync employeeBarcode with Redux scannedEmployee state
    useEffect(() => {
        if (scannedEmployee?.employee_id) {
            setEmployeeBarcode(scannedEmployee.employee_id.toString());
        } else {
            setEmployeeBarcode('');
        }
    }, [scannedEmployee]);

    const handleChange = (field: keyof EquipmentSchema, value: string | number | null) => {
        // Special handling for dueDate to maintain local state
        if (field === 'dueDate') {
            setLocalDueDate(value as string);
        }

        // If changing department, we might need to update locations
        if (field === 'department' && value) {
            setLoadingLocations(true);
            fetchLocationsByDepartment(value as number);
        }

        console.log(value)
        // Special handling for receivedBy field
        if (field === 'receivedBy' && value) {
            // When receivedBy changes, we need to update both the equipment state and Redux receivedBy state
            // First, find the user data from the loadUserOptions
            loadUserOptions('').then(options => {
                const selectedOption = options.find(opt => opt.value === value);
                if (selectedOption && selectedOption.userData && onReceivedByChange) {
                    // Update Redux receivedBy state with complete user data
                    dispatch(setReceivedBy(selectedOption.userData));

                    // Also call the callback for backward compatibility
                    onReceivedByChange(selectedOption.userData);
                }
            }).catch(error => {
                console.error('Error loading user data for receivedBy:', error);
            });
        }

        // Update Redux state with the single field change
        const updatedData = { [field]: value };
        onChange(updatedData);
    };

    // Load department options for SmartSelect
    const loadDepartmentOptions = async (inputValue: string): Promise<SelectOption[]> => {
        try {
            // If we already have pre-loaded departments and input is empty, return them
            if (inputValue === '' && departments.length > 0) {
                return departments;
            }

            // Otherwise load from API
            const response = await axios.get(route('admin.departments.search-departments'), {
                params: { search: inputValue, limit: 10 }
            });
            return response.data;
        } catch (error) {
            console.error('Error loading departments:', error);
            return [];
        }
    };

    // Load plant options for SmartSelect
    const loadPlantOptions = async (inputValue: string): Promise<SelectOption[]> => {
        try {
            // If we already have pre-loaded plants and input is empty, return them
            if (inputValue === '' && plants.length > 0) {
                return plants;
            }

            // Otherwise load from API
            const response = await axios.get(route('admin.plants.search-plants'), {
                params: { search: inputValue, limit: 10 }
            });
            return response.data;
        } catch (error) {
            console.error('Error loading plants:', error);
            return [];
        }
    };

    // Load location options for SmartSelect - don't filter by department
    const loadLocationOptions = async (inputValue: string): Promise<SelectOption[]> => {
        try {
            // If we already have pre-loaded locations and input is empty, return them
            if (inputValue === '' && locations.length > 0) {
                return locations;
            }

            // Only include department_id as an optional filter, not a requirement
            const params: Record<string, string> = {
                search: inputValue,
                limit: '10'
            };

            // Add department as an optional filter if selected
            if (data.department) {
                params.department_id = String(data.department);
            }

            const response = await axios.get('/admin/locations', {
                params,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            return response.data.data.data.map((location: any) => ({
                label: location.location_name,
                value: location.location_id
            }));
        } catch (error) {
            console.error('Error loading locations:', error);
            return [];
        } finally {
            setLoadingLocations(false);
        }
    };

    // Create location option - don't require department
    const createLocationOption = async (inputValue: string): Promise<SelectOption> => {
        try {
            // Optional department association
            const params: any = {
                location_name: inputValue,
            };

            // Add department if available
            if (data.department) {
                params.department_id = data.department;
            }

            const response = await axios.post('/admin/locations', params, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            toast.success(`Location "${inputValue}" created successfully`);

            return {
                label: inputValue,
                value: response.data.data.location_id
            };
        } catch (error: any) {
            console.error('Error creating location:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to create location. Please try again.');
            }

            throw new Error('Failed to create location');
        }
    };

    // Load user options for SmartSelect
    const loadUserOptions = async (inputValue: string): Promise<SelectOption[]> => {
        try {
            const response = await axios.get('/admin/users', {
                params: {
                    search: inputValue,
                    limit: 10
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            return response.data.data.data.map((user: any) => ({
                label: `${user.first_name} ${user.last_name}`,
                value: user.user_id || user.employee_id,
                // Store additional user data for later use
                userData: {
                    user_id: user.user_id,
                    employee_id: user.employee_id || user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    full_name: `${user.first_name} ${user.last_name}`,
                    email: user.email || '',
                }
            }));
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    };

    // Refine the date handling to prevent null values
    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            const formattedDate = format(date, 'yyyy-MM-dd');
            setLocalDueDate(formattedDate);
            handleChange('dueDate', formattedDate);
        }
    };


    useEffect(() => {
        if (data.dueDate !== localDueDate && data.dueDate) {
            setLocalDueDate(data.dueDate);
        }
    }, [data.dueDate]);

    // Auto-fill due date when technician is selected (but don't override employee barcode data)
    useEffect(() => {
        if (technician && !scannedEmployee) {
            const updates: any = {};
            let hasChanges = false;

            // Auto-fill due date to today if not already set
            if (!data.dueDate || data.dueDate === '') {
                const today = new Date();
                const formattedDate = format(today, 'yyyy-MM-dd');
                updates.dueDate = formattedDate;
                setLocalDueDate(formattedDate);
                hasChanges = true;
            }

            // Only update if there are actual changes
            if (hasChanges) {
                onChange(updates);
            }
        }
    }, [technician?.employee_id, scannedEmployee]);

    // Auto-fill receivedBy to current user when component mounts
    useEffect(() => {
        // Skip if hideReceivedBy is true
        if (!hideReceivedBy && !receivedBy && currentUser && onReceivedByChange) {
            // Set the current user as receivedBy
            const userObj = {
                user_id: currentUser.user_id,
                employee_id: currentUser.employee_id || currentUser.user_id,
                first_name: currentUser.first_name,
                last_name: currentUser.last_name,
                full_name: `${currentUser.first_name} ${currentUser.last_name}`,
                email: currentUser.email || '',
            };

            // Update Redux state
            dispatch(setReceivedBy(userObj));

            // Also call the callback for backward compatibility
            onReceivedByChange(userObj);

            // Also update the equipment receivedBy field
            handleChange('receivedBy', currentUser.user_id);
        }
    }, [receivedBy, onReceivedByChange, currentUser, hideReceivedBy, dispatch]);

    // DONT REMOVE
    // console.log(recallNumber)

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Recall Number Section - Only show for routine requests */}
                    {requestType === 'routine' && (
                        <div className="mb-6 p-4 border rounded-lg bg-muted/20">
                            <label className="w-full block font-semibold mb-2">Recall Number</label>
                            <div className="w-full flex gap-2 items-center ">
                                <div className='w-full'>
                                    <InertiaSmartSelect
                                        name="recallNumber"
                                        value={recallNumber}
                                        onChange={handleRecallNumberChange}
                                        loadOptions={loadRecallOptions}
                                        placeholder="Search or enter recall number"
                                        isDisabled={recallLoading}
                                        error={errors.recallNumber}
                                        minSearchLength={1}
                                        required
                                    />
                                </div>
                                {/* Barcode scanner button for recall number */}
                                <div>
                                    <Dialog open={showRecallScanner} onOpenChange={setShowRecallScanner}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full">
                                                <Scan className="h-4 w-4 mr-2" />
                                                Scan Recall Barcode
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Scan Recall Number Barcode</DialogTitle>
                                                <DialogDescription>
                                                    Position the barcode within the camera frame to scan
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex items-center justify-center p-4">
                                                <div className="w-full max-w-sm">
                                                    <Scanner
                                                        onScan={handleRecallScan}
                                                        onError={handleScanError}
                                                        formats={['code_128', 'code_39']}
                                                        constraints={{
                                                            video: {
                                                                facingMode: 'environment'
                                                            }
                                                        }}
                                                        allowMultiple={false}
                                                        scanDelay={500}
                                                        components={{
                                                            finder: true,
                                                            torch: true,
                                                            zoom: false
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                            {recallBarcodeError && <div className="text-red-500 text-xs mt-1">{recallBarcodeError}</div>}
                        </div>
                    )}
                    {/* Employee Barcode Section */}
                    <div className="mb-6 p-4 border rounded-lg bg-muted/20">
                        <h3 className="font-medium text-sm mb-4 flex items-center">
                            <UserIcon className="h-4 w-4 mr-2" />
                            Employee Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="md:col-span-3">
                                <Label htmlFor="employeeBarcode" className={errors.employeeBarcode ? 'text-destructive' : ''}>
                                    Employee Barcode (Employee ID) *
                                </Label>
                                <Input
                                    id="employeeBarcode"
                                    value={employeeBarcode}
                                    onChange={e => setEmployeeBarcode(e.target.value)}
                                    placeholder="Scan or enter employee ID"
                                    className={errors.employeeBarcode ? 'border-destructive' : ''}
                                    disabled={loadingEmployee}
                                />
                                {errors.employeeBarcode && <p className="text-sm text-destructive mt-1">{errors.employeeBarcode}</p>}
                                {barcodeError && <span className="text-sm text-red-600 mt-1 block">{barcodeError}</span>}
                            </div>
                            <Button onClick={() => fetchEmployeeByBarcode(employeeBarcode)} disabled={loadingEmployee || !employeeBarcode}>
                                Search
                            </Button>
                            <div>
                                <Dialog open={showScanner} onOpenChange={setShowScanner}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <Scan className="h-4 w-4 mr-2" />
                                            Scan Barcode
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Scan Employee Barcode</DialogTitle>
                                            <DialogDescription>
                                                Position the Code 128 barcode within the camera frame to scan
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex items-center justify-center p-4">
                                            <div className="w-full max-w-sm">
                                                <Scanner
                                                    onScan={handleScan}
                                                    onError={handleScanError}
                                                    formats={['code_128', 'code_39']}
                                                    constraints={{
                                                        video: {
                                                            facingMode: 'environment'
                                                        }
                                                    }}
                                                    allowMultiple={false}
                                                    scanDelay={500}
                                                    components={{
                                                        finder: true,
                                                        torch: true,
                                                        zoom: false
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Employee Info Display */}
                        {scannedEmployee && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-center text-green-800">
                                    <UserIcon className="h-4 w-4 mr-2" />
                                    <span className="font-medium">
                                        {scannedEmployee.first_name} {scannedEmployee.last_name}
                                    </span>
                                </div>
                                <div className="text-sm text-green-600 mt-1">
                                    ID: {scannedEmployee.employee_id} | {scannedEmployee.department?.department_name} - {scannedEmployee.plant?.plant_name}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Organizational info in one row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                            <Label htmlFor="plant" className={errors.plant ? 'text-destructive' : ''}>
                                Plant
                            </Label>
                            <InertiaSmartSelect
                                name="plant"
                                value={data.plant}
                                onChange={(value) => handleChange('plant', value as string)}
                                label={scannedEmployee?.plant?.plant_name}
                                loadOptions={loadPlantOptions}
                                placeholder="Select plant"
                                error={errors.plant}
                                className={errors.plant ? 'border-destructive' : ''}
                                loading={loadingInitialData}
                                cacheOptions={true}
                                defaultOptions={plants.length > 0 ? plants : true}
                                minSearchLength={0}
                            />
                            {scannedEmployee?.plant && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Auto-filled from employee: {scannedEmployee.plant.plant_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="department" className={errors.department ? 'text-destructive' : ''}>
                                Department
                            </Label>
                            <InertiaSmartSelect
                                name="department"
                                value={data.department}
                                onChange={(value) => handleChange('department', value as string)}
                                loadOptions={loadDepartmentOptions}
                                placeholder="Select department"
                                label={scannedEmployee?.department?.department_name}
                                error={errors.department}
                                defaultOptions={departments.length > 0 ? departments : true}
                                className={errors.department ? 'border-destructive' : ''}
                                loading={loadingInitialData}
                                cacheOptions={true}
                                minSearchLength={0}
                            />
                            {scannedEmployee?.department && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Auto-filled from employee: {scannedEmployee.department.department_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="location" className={errors.location ? 'text-destructive' : ''}>
                                Location
                            </Label>
                            <InertiaSmartSelect
                                name="location"
                                value={data.location}
                                label={data.location_name}
                                onChange={(value) => handleChange('location', value as string)}
                                loadOptions={loadLocationOptions}
                                onCreateOption={createLocationOption}
                                placeholder="Select or create location"
                                error={errors.location}
                                className={errors.location ? 'border-destructive' : ''}
                                loading={loadingLocations || loadingInitialData}
                                cacheOptions={false}
                                defaultOptions={locations.length > 0 ? locations : true}
                                minSearchLength={0}
                            />
                        </div>
                    </div>

                    {/* Equipment details below */}
                    <div className="border-t pt-6">
                        <h3 className="font-medium text-sm mb-4">Equipment Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Label htmlFor="description" className={errors.description ? 'text-destructive' : ''}>
                                    Equipment Description
                                </Label>
                                <Input
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    className={errors.description ? 'border-destructive' : ''}
                                />
                                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                            </div>
                            <div>
                                <Label htmlFor="serialNumber" className={errors.serialNumber ? 'text-destructive' : ''}>
                                    Serial Number
                                </Label>
                                <Input
                                    id="serialNumber"
                                    value={data.serialNumber || ''}
                                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                                    className={errors.serialNumber ? 'border-destructive' : ''}
                                />
                                {errors.serialNumber && <p className="text-sm text-destructive mt-1">{errors.serialNumber}</p>}
                            </div>

                            <div>
                                <Label htmlFor="model" className={errors.model ? 'text-destructive' : ''}>
                                    Model
                                </Label>
                                <Input
                                    id="model"
                                    value={data.model || ''}
                                    onChange={(e) => handleChange('model', e.target.value)}
                                    className={errors.model ? 'border-destructive' : ''}
                                />
                                {errors.model && <p className="text-sm text-destructive mt-1">{errors.model}</p>}
                            </div>

                            <div>
                                <Label htmlFor="manufacturer" className={errors.manufacturer ? 'text-destructive' : ''}>
                                    Manufacturer
                                </Label>
                                <Input
                                    id="manufacturer"
                                    value={data.manufacturer || ''}
                                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                                    className={errors.manufacturer ? 'border-destructive' : ''}
                                />
                                {errors.manufacturer && <p className="text-sm text-destructive mt-1">{errors.manufacturer}</p>}
                            </div>

                        </div>
                    </div>

                    {/* Due date section */}
                    <div className="border-t pt-6 mt-6">
                        <h3 className="font-medium text-sm mb-4">Scheduling Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="dueDate" className={errors.dueDate ? 'text-destructive' : ''}>
                                    Due Date
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !localDueDate && "text-muted-foreground",
                                                errors.dueDate && "border-destructive"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {localDueDate ? format(new Date(localDueDate), 'PPP') : <span>Select a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={localDueDate ? new Date(localDueDate) : undefined}
                                            onSelect={handleDateChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.dueDate && <p className="text-sm text-destructive mt-1">{errors.dueDate}</p>}
                                {technician && localDueDate && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Auto-filled to current day
                                    </p>
                                )}
                            </div>

                            {!hideReceivedBy && (
                                <div>
                                    <Label htmlFor="receivedBy" className={errors.receivedBy ? 'text-destructive' : ''}>
                                        Received By
                                    </Label>

                                    <InertiaSmartSelect
                                        name="receivedBy"
                                        value={receivedBy?.user_id || receivedBy?.employee_id}
                                        label={receivedBy ? `${receivedBy.first_name} ${receivedBy.last_name}` : undefined}
                                        onChange={(value) => handleChange('receivedBy', value as string)}
                                        loadOptions={loadUserOptions}
                                        placeholder="Select user"
                                        error={errors.receivedBy}
                                        className={errors.receivedBy ? 'border-destructive' : ''}
                                        cacheOptions={true}
                                        defaultOptions={true}
                                        minSearchLength={2}
                                    />
                                    {errors.receivedBy && <p className="text-sm text-destructive mt-1">{errors.receivedBy}</p>}
                                    {receivedBy && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Auto-filled to current user: {receivedBy.first_name} {receivedBy.last_name}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DetailTab;
