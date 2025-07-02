import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleModal, SimpleModalContent, SimpleModalHeader, SimpleModalTitle } from '@/components/ui/simple-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DepartmentModalSelect, LocationModalSelect, PlantModalSelect, UserModalSelect } from '@/components/ui/modal-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setReceivedBy, setScannedEmployee, updateEquipment } from '@/store/slices/trackingRequestSlice';
import { User, type SharedData } from '@/types';
import { EquipmentSchema } from '@/validation/tracking-request-schema';
import { usePage } from '@inertiajs/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';
import { format } from 'date-fns';
import { CalendarIcon, Scan, Search, User as UserIcon, Package, Loader2, Check } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface DetailTabProps {
    data: EquipmentSchema;
    onChange: (data: EquipmentSchema) => void;
    onScannedEmployeeChange?: (employee: User | null) => void; // Deprecated: Redux state is used directly
    onReceivedByChange?: (user: User | null) => void;
    errors?: Record<string, string>;
    technician?: User | null;
    receivedBy?: User | null;
    hideReceivedBy?: boolean; // Added to hide receivedBy field for employee context
    showRecallNumber?: boolean; // Show recall number section for employee context
}

const DetailTab: React.FC<DetailTabProps> = ({
    data,
    onChange,
    onScannedEmployeeChange,
    onReceivedByChange,
    errors = {},
    technician,
    receivedBy,
    hideReceivedBy = false,
    showRecallNumber = false, // default false
}) => {
    const { auth } = usePage<SharedData>().props;
    const currentUser = auth.user;
    const dispatch = useAppDispatch();
    const { requestType = '' } = useAppSelector((state) => state.trackingRequest);

    // Helper function to combine process range fields for backward compatibility
    const getCombinedProcessRange = (equipment?: any): string => {
        // Priority 1: Use new combined field if available
        if (equipment?.process_req_range) {
            return equipment.process_req_range;
        }

        // Priority 2: Combine old fields if they exist
        const start = equipment?.process_req_range_start;
        const end = equipment?.process_req_range_end;

        if (start && end) {
            return `${start} - ${end}`;
        } else if (start) {
            return start;
        } else if (end) {
            return end;
        }

        return '';
    };

    const [recallNumber, setRecallNumber] = useState<string>(data.recallNumber || '');
    const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);
    const [showRecallScanner, setShowRecallScanner] = useState(false);

    // Equipment search states
    const [equipmentSearchQuery, setEquipmentSearchQuery] = useState('');
    const [equipmentResults, setEquipmentResults] = useState<any[]>([]);
    const [loadingEquipment, setLoadingEquipment] = useState(false);

    // Get scannedEmployee from Redux instead of local state
    const { scannedEmployee } = useAppSelector((state) => state.trackingRequest);

    const [localDueDate, setLocalDueDate] = useState<string | null>(data.dueDate || null);
    const [employeeBarcode, setEmployeeBarcode] = useState<string>('');
    const [loadingEmployee, setLoadingEmployee] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [showEmployeeScanner, setShowEmployeeScanner] = useState(false);
    const [barcodeError, setBarcodeError] = useState<string>('');

    // Employee search states
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [employeeResults, setEmployeeResults] = useState<any[]>([]);
    const [loadingEmployeeSearch, setLoadingEmployeeSearch] = useState(false);

    // Function to fetch employee by barcode
    const fetchEmployeeByBarcode = async (barcode: string) => {
        if (!barcode) return;

        setLoadingEmployee(true);
        setBarcodeError(''); // Clear any previous error
        try {
            const response = await axios.get(route('admin.users.search-by-barcode'), {
                params: { barcode },
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
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

    // Fetch equipment by recall number (only called when user selects from modal or scans)
    const fetchEquipmentByRecall = async (recall: string) => {
        if (!recall) return;

        try {
            const response = await axios.get(route('api.equipment.search-by-recall'), {
                params: { recall_number: recall },
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (response.data.success && response.data.equipment) {
                const equipment = response.data.equipment;
                setSelectedEquipment(equipment);
                dispatch(
                    updateEquipment({
                        ...equipment,
                        recallNumber: recall,
                        serialNumber: equipment.serial_number || '',
                        process_req_range: getCombinedProcessRange(equipment),
                        existing: true,
                        equipment_id: equipment.equipment_id,
                    }),
                );
                // Auto-fill form fields including new process requirement range field
                onChange({
                    serialNumber: equipment.serial_number || '',
                    process_req_range: getCombinedProcessRange(equipment),
                    description: equipment.description || '',
                    manufacturer: equipment.manufacturer || '',
                    model: equipment.model || '',
                });

                toast.success(`Equipment found: ${equipment.description || recall}`);
            } else {
                setSelectedEquipment(null);
                dispatch(
                    updateEquipment({
                        recallNumber: recall,
                        existing: false,
                        equipment_id: null,
                    }),
                );
            }
        } catch (error) {
            console.error('Error searching for equipment:', error);
            toast.error('Error searching for equipment');
        }
    };

    // Search equipment by recall number for modal
    const searchEquipment = async (query: string) => {
        if (!query || query.length < 2) {
            setEquipmentResults([]);
            return;
        }

        setLoadingEquipment(true);
        try {
            const response = await axios.get(route('api.equipment.search-by-recall'), {
                params: { recall_number: query },
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (response.data.success && response.data.equipment) {
                setEquipmentResults([response.data.equipment]);
            } else {
                setEquipmentResults([]);
            }
        } catch (error) {
            console.error('Error searching equipment:', error);
            setEquipmentResults([]);
        } finally {
            setLoadingEquipment(false);
        }
    };

    // Search employees for modal
    const searchEmployees = async (query: string) => {
        if (!query || query.length < 2) {
            setEmployeeResults([]);
            return;
        }

        setLoadingEmployeeSearch(true);
        try {
            const response = await axios.get('/admin/users', {
                params: {
                    search: query,
                    limit: 10,
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (response.data?.data?.data) {
                setEmployeeResults(response.data.data.data);
            } else {
                setEmployeeResults([]);
            }
        } catch (error) {
            console.error('Error searching employees:', error);
            setEmployeeResults([]);
        } finally {
            setLoadingEmployeeSearch(false);
        }
    };

    // Handle manual recall number input change (no auto-search)
    const handleRecallInputChange = (value: string) => {
        setRecallNumber(value);
        dispatch(updateEquipment({ recallNumber: value }));
        if (!value) {
            setSelectedEquipment(null);
        }
    };

    // Handle equipment selection from modal
    const handleEquipmentSelect = (equipment: any) => {
        setRecallNumber(equipment.recall_number);
        setShowEquipmentModal(false);
        setEquipmentSearchQuery('');
        setEquipmentResults([]);
        fetchEquipmentByRecall(equipment.recall_number);
    };

    // Handle recall barcode scan - this scans recall numbers
    const handleRecallScan = (detectedCodes: any[]) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const scannedText = detectedCodes[0].rawValue;
            setShowRecallScanner(false);
            setRecallNumber(scannedText);
            fetchEquipmentByRecall(scannedText);
        }
    };

    // Handle manual employee barcode input change (no automatic search)
    const handleBarcodeChange = (value: string) => {
        setEmployeeBarcode(value);
        setBarcodeError(''); // Clear error when user starts typing
        // Clear previous results when input changes
        if (!value) {
            dispatch(setScannedEmployee(null));
            if (onScannedEmployeeChange) {
                onScannedEmployeeChange(null);
            }
        }
    };

    // Handle employee search when button is clicked
    const handleEmployeeSearch = () => {
        if (!employeeBarcode.trim()) {
            setBarcodeError('Please enter an employee ID');
            return;
        }
        fetchEmployeeByBarcode(employeeBarcode.trim());
    };

    // Handle employee selection from modal
    const handleEmployeeSelect = (employee: any) => {
        setEmployeeBarcode(employee.employee_id);
        setShowEmployeeModal(false);
        setEmployeeSearchQuery('');
        setEmployeeResults([]);
        fetchEmployeeByBarcode(employee.employee_id);
    };

    // Handle employee barcode scan - this scans employee IDs
    const handleEmployeeScan = (detectedCodes: any[]) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const scannedText = detectedCodes[0].rawValue;
            setEmployeeBarcode(scannedText);
            setShowEmployeeScanner(false);
            fetchEmployeeByBarcode(scannedText);
        }
    };

    // Handle scan error
    const handleScanError = (error: any) => {
        console.error('Scan error:', error);
        toast.error('Error scanning barcode');
    };

    // Sync employeeBarcode with Redux scannedEmployee state
    useEffect(() => {
        if (scannedEmployee?.employee_id) {
            setEmployeeBarcode(scannedEmployee.employee_id.toString());
        } else {
            setEmployeeBarcode('');
        }
    }, [scannedEmployee]);

    // Debounced search for equipment
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (equipmentSearchQuery) {
                searchEquipment(equipmentSearchQuery);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [equipmentSearchQuery]);

    // Debounced search for employees
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (employeeSearchQuery) {
                searchEmployees(employeeSearchQuery);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [employeeSearchQuery]);

    const handleChange = (field: keyof EquipmentSchema, value: string | number | null) => {
        // Special handling for dueDate to maintain local state
        if (field === 'dueDate') {
            setLocalDueDate(value as string);
        }

        // Special handling for process_req_range field to parse and update old fields
        if (field === 'process_req_range' && typeof value === 'string') {
            // Parse and update old fields for backward compatibility
            const rangeMatch = value.match(/^([^-\s]+)\s*(?:-|to)\s*([^-\s]+)$/i);
            const updatedData: any = { [field]: value };

            if (rangeMatch) {
                updatedData.processReqRangeStart = rangeMatch[1].trim();
                updatedData.processReqRangeEnd = rangeMatch[2].trim();
            } else if (value.trim()) {
                updatedData.processReqRangeStart = value.trim();
                updatedData.processReqRangeEnd = '';
            } else {
                updatedData.processReqRangeStart = '';
                updatedData.processReqRangeEnd = '';
            }

            onChange(updatedData);
            return;
        }

        // Special handling for receivedBy field
        if (field === 'receivedBy' && value) {
            // When receivedBy changes, we need to update both the equipment state and Redux receivedBy state
            // First, find the user data from the loadUserOptions
            loadUserOptions('')
                .then((options) => {
                    const selectedOption = options.find((opt) => opt.value === value);
                    if (selectedOption && selectedOption.userData && onReceivedByChange) {
                        // Update Redux receivedBy state with complete user data
                        dispatch(setReceivedBy(selectedOption.userData));

                        // Also call the callback for backward compatibility
                        onReceivedByChange(selectedOption.userData);
                    }
                })
                .catch((error) => {
                    console.error('Error loading user data for receivedBy:', error);
                });
        }

        // Update Redux state with the single field change
        const updatedData = { [field]: value };
        onChange(updatedData);
    };

    // Load user options for SmartSelect
    const loadUserOptions = async (inputValue: string): Promise<SelectOption[]> => {
        try {
            const response = await axios.get('/admin/users', {
                params: {
                    search: inputValue,
                    limit: 10,
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            return response.data.data.data.map((user: any) => ({
                label: `${user.first_name} ${user.last_name} (${user.employee_id})`,
                value: user.employee_id || user.user_id,
                // Store additional user data for later use
                userData: {
                    user_id: user.user_id,
                    employee_id: user.employee_id || user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    full_name: `${user.first_name} ${user.last_name}`,
                    email: user.email || '',
                },
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
    console.log(data);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Recall Number Section - Show for both routine and new requests with different UI */}
                    {(requestType === 'routine' || requestType === 'new') && (
                        <div className="bg-muted/20 mb-6 rounded-lg border p-4">
                            <label className="mb-2 block w-full font-semibold">
                                Recall Number
                                {requestType === 'new' && <span className="text-muted-foreground ml-1 text-xs font-normal">(optional - will be assigned during calibration if not provided)</span>}
                                {requestType === 'routine' && <span className="text-muted-foreground ml-1 text-xs font-normal">(required for existing equipment)</span>}
                            </label>
                            <div className="flex w-full items-center gap-2">
                                <div className="flex-1">
                                    <Input
                                        id="recallNumber"
                                        value={recallNumber}
                                        onChange={(e) => handleRecallInputChange(e.target.value)}
                                        placeholder={requestType === 'routine' ? "Enter or scan recall number" : "Enter or scan recall number (optional)"}
                                        className={errors.recallNumber ? 'border-destructive' : ''}
                                    />
                                </div>

                                {/* Select Equipment Button - only for routine requests */}
                                {requestType === 'routine' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowEquipmentModal(true)}
                                        className="shrink-0"
                                    >
                                        <Package className="mr-2 h-4 w-4" />
                                        Select
                                    </Button>
                                )}

                                {/* Barcode scanner button for recall number */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowRecallScanner(true)}
                                    className="shrink-0"
                                >
                                    <Scan className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">Scan</span>
                                </Button>
                            </div>

                            {/* Show selected equipment info */}
                            {selectedEquipment && (
                                <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                                    <div className="flex items-center text-blue-800">
                                        <Package className="mr-2 h-4 w-4" />
                                        <span className="font-medium">{selectedEquipment.description}</span>
                                    </div>
                                    <div className="mt-1 text-sm text-blue-600">
                                        Serial: {selectedEquipment.serial_number || 'N/A'} |
                                        Manufacturer: {selectedEquipment.manufacturer || 'N/A'}
                                    </div>
                                </div>
                            )}

                            {errors.recallNumber && <div className="mt-1 text-xs text-red-500">{errors.recallNumber}</div>}
                        </div>
                    )}

                    {/* Employee Barcode Section */}
                    <div className="bg-muted/20 mb-6 rounded-lg border p-4">
                        <h3 className="mb-4 flex items-center text-sm font-medium">
                            <UserIcon className="mr-2 h-4 w-4" />
                            Employee Information
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <Label htmlFor="employeeBarcode" className={errors.employeeBarcode ? 'text-destructive' : ''}>
                                    Employee ID *
                                </Label>
                                <Input
                                    id="employeeBarcode"
                                    value={employeeBarcode}
                                    onChange={(e) => handleBarcodeChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && employeeBarcode.trim()) {
                                            handleEmployeeSearch();
                                        }
                                    }}
                                    placeholder="Enter or scan employee ID"
                                    className={errors.employeeBarcode ? 'border-destructive' : ''}
                                    disabled={loadingEmployee}
                                />
                                {errors.employeeBarcode && <p className="text-destructive mt-1 text-sm">{errors.employeeBarcode}</p>}
                                {barcodeError && <span className="mt-1 block text-sm text-red-600">{barcodeError}</span>}
                            </div>

                            <div className="flex gap-2 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowEmployeeModal(true)}
                                    className="shrink-0"
                                >
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Select
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleEmployeeSearch}
                                    disabled={loadingEmployee || !employeeBarcode.trim()}
                                    className="shrink-0"
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowEmployeeScanner(true)}
                                    className="shrink-0"
                                >
                                    <Scan className="mr-2 h-4 w-4" />
                                    Scan
                                </Button>
                            </div>
                        </div>

                        {/* Employee Info Display */}
                        {scannedEmployee && (
                            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
                                <div className="flex items-center text-green-800">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span className="font-medium">
                                        {scannedEmployee.first_name} {scannedEmployee.last_name}
                                    </span>
                                </div>
                                <div className="mt-1 text-sm text-green-600">
                                    ID: {scannedEmployee.employee_id} | {scannedEmployee.department?.department_name} -{' '}
                                    {scannedEmployee.plant?.plant_name}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Equipment Modal */}
                    <SimpleModal open={showEquipmentModal} onOpenChange={setShowEquipmentModal}>
                        <SimpleModalContent className="max-w-md">
                            <SimpleModalHeader>
                                <SimpleModalTitle>Select Equipment</SimpleModalTitle>
                            </SimpleModalHeader>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search equipment by recall number..."
                                        value={equipmentSearchQuery}
                                        onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                                        className="pl-10"
                                        autoFocus
                                    />
                                </div>

                                <div className="max-h-60 overflow-y-auto">
                                    {loadingEquipment ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : equipmentResults.length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground">
                                            {equipmentSearchQuery.length > 0 && equipmentSearchQuery.length < 2 ?
                                                'Type at least 2 characters to search' :
                                                'No equipment found'
                                            }
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {equipmentResults.map((equipment, index) => (
                                                <Button
                                                    key={`${equipment.equipment_id}-${index}`}
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => handleEquipmentSelect(equipment)}
                                                    className="w-full justify-start h-auto p-3 text-left"
                                                >
                                                    <div className="flex items-center gap-2 w-full">
                                                        <div className="flex-1">
                                                            <div className="font-medium">
                                                                {equipment.recall_number} - {equipment.description}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Serial: {equipment.serial_number || 'N/A'} | {equipment.manufacturer || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <Check className="h-4 w-4 text-primary opacity-0" />
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowEquipmentModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </SimpleModalContent>
                    </SimpleModal>

                    {/* Employee Modal */}
                    <SimpleModal open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
                        <SimpleModalContent className="max-w-md">
                            <SimpleModalHeader>
                                <SimpleModalTitle>Select Employee</SimpleModalTitle>
                            </SimpleModalHeader>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search employee by name or ID..."
                                        value={employeeSearchQuery}
                                        onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                        className="pl-10"
                                        autoFocus
                                    />
                                </div>

                                <div className="max-h-60 overflow-y-auto">
                                    {loadingEmployeeSearch ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : employeeResults.length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground">
                                            {employeeSearchQuery.length > 0 && employeeSearchQuery.length < 2 ?
                                                'Type at least 2 characters to search' :
                                                'No employees found'
                                            }
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {employeeResults.map((employee, index) => (
                                                <Button
                                                    key={`${employee.employee_id}-${index}`}
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => handleEmployeeSelect(employee)}
                                                    className="w-full justify-start h-auto p-3 text-left"
                                                >
                                                    <div className="flex items-center gap-2 w-full">
                                                        <div className="flex-1">
                                                            <div className="font-medium">
                                                                {employee.first_name} {employee.last_name}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                ID: {employee.employee_id} | {employee.department?.department_name || 'No dept'} - {employee.plant?.plant_name || 'No plant'}
                                                            </div>
                                                        </div>
                                                        <Check className="h-4 w-4 text-primary opacity-0" />
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowEmployeeModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </SimpleModalContent>
                    </SimpleModal>

                    {/* Recall Number Scanner Modal */}
                    <SimpleModal open={showRecallScanner} onOpenChange={setShowRecallScanner}>
                        <SimpleModalContent className="sm:max-w-md">
                            <SimpleModalHeader>
                                <SimpleModalTitle>Scan Recall Number Barcode</SimpleModalTitle>
                            </SimpleModalHeader>
                            <div className="flex items-center justify-center p-4">
                                <div className="w-full max-w-sm">
                                    <Scanner
                                        onScan={handleRecallScan}
                                        onError={handleScanError}
                                        formats={['code_128', 'code_39']}
                                        constraints={{
                                            video: {
                                                facingMode: 'environment',
                                            },
                                        }}
                                        allowMultiple={false}
                                        scanDelay={500}
                                        components={{
                                            finder: true,
                                            torch: true,
                                            zoom: false,
                                        }}
                                    />
                                </div>
                            </div>
                        </SimpleModalContent>
                    </SimpleModal>

                    {/* Employee Scanner Modal */}
                    <SimpleModal open={showEmployeeScanner} onOpenChange={setShowEmployeeScanner}>
                        <SimpleModalContent className="sm:max-w-md">
                            <SimpleModalHeader>
                                <SimpleModalTitle>Scan Employee Barcode</SimpleModalTitle>
                            </SimpleModalHeader>
                            <div className="flex items-center justify-center p-4">
                                <div className="w-full max-w-sm">
                                    <Scanner
                                        onScan={handleEmployeeScan}
                                        onError={handleScanError}
                                        formats={['code_128', 'code_39']}
                                        constraints={{
                                            video: {
                                                facingMode: 'environment',
                                            },
                                        }}
                                        allowMultiple={false}
                                        scanDelay={500}
                                        components={{
                                            finder: true,
                                            torch: true,
                                            zoom: false,
                                        }}
                                    />
                                </div>
                            </div>
                        </SimpleModalContent>
                    </SimpleModal>

                    {/* Organizational info in one row */}
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <Label htmlFor="plant" className={errors.plant ? 'text-destructive' : ''}>
                                Plant
                            </Label>
                            <PlantModalSelect
                                name="plant"
                                value={data.plant}
                                onChange={(value) => handleChange('plant', value as string)}
                                placeholder="Select plant"
                                error={errors.plant}
                                currentLabel={scannedEmployee?.plant?.plant_name}
                            />
                            {scannedEmployee?.plant && (
                                <p className="text-muted-foreground mt-1 text-xs">Auto-filled from employee: {scannedEmployee.plant.plant_name}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="department" className={errors.department ? 'text-destructive' : ''}>
                                Department
                            </Label>
                            <DepartmentModalSelect
                                name="department"
                                value={data.department}
                                onChange={(value) => handleChange('department', value as string)}
                                placeholder="Select department"
                                error={errors.department}
                                currentLabel={scannedEmployee?.department?.department_name}
                            />
                            {scannedEmployee?.department && (
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Auto-filled from employee: {scannedEmployee.department.department_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="location" className={errors.location ? 'text-destructive' : ''}>
                                Location
                            </Label>
                            <LocationModalSelect
                                name="location"
                                value={data.location}
                                onChange={(value) => handleChange('location', value as string)}
                                placeholder="Select or create location"
                                error={errors.location}
                                currentLabel={data.location_name}
                            />
                        </div>
                    </div>

                    {/* Equipment details below */}
                    <div className="border-t pt-6">
                        <h3 className="mb-4 text-sm font-medium">Equipment Information</h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                {errors.description && <p className="text-destructive mt-1 text-sm">{errors.description}</p>}
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
                                {errors.serialNumber && <p className="text-destructive mt-1 text-sm">{errors.serialNumber}</p>}
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
                                {errors.model && <p className="text-destructive mt-1 text-sm">{errors.model}</p>}
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
                                {errors.manufacturer && <p className="text-destructive mt-1 text-sm">{errors.manufacturer}</p>}
                            </div>

                            {/* Process Requirement Range field */}
                            <div className="md:col-span-2">
                                <Label htmlFor="process_req_range" className={errors.process_req_range ? 'text-destructive' : ''}>
                                    Process Requirement Range
                                </Label>
                                <Input
                                    id="process_req_range"
                                    value={data.process_req_range || getCombinedProcessRange(data) || ''}
                                    onChange={(e) => handleChange('process_req_range', e.target.value)}
                                    placeholder="Enter range (e.g., 100 - 200, 50 to 100, 75)"
                                    className={errors.process_req_range ? 'border-destructive' : ''}
                                />
                                {errors.process_req_range && <p className="text-destructive mt-1 text-sm">{errors.process_req_range}</p>}
                                <p className="text-sm text-muted-foreground mt-1">
                                    You can enter a single value (e.g., "100") or a range (e.g., "100 - 200", "50 to 100")
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Due date section */}
                    <div className="mt-6 border-t pt-6">
                        <h3 className="mb-4 text-sm font-medium">Scheduling Information</h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="dueDate" className={errors.dueDate ? 'text-destructive' : ''}>
                                    Due Date
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !localDueDate && 'text-muted-foreground',
                                                errors.dueDate && 'border-destructive',
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
                                {errors.dueDate && <p className="text-destructive mt-1 text-sm">{errors.dueDate}</p>}
                                {technician && localDueDate && <p className="text-muted-foreground mt-1 text-xs">Auto-filled to current day</p>}
                            </div>

                            {!hideReceivedBy && (
                                <div>
                                    <Label htmlFor="receivedBy" className={errors.receivedBy ? 'text-destructive' : ''}>
                                        Received By
                                    </Label>
                                    <UserModalSelect
                                        name="receivedBy"
                                        value={receivedBy?.employee_id}
                                        onChange={(value) => handleChange('receivedBy', value as string)}
                                        placeholder="Select user"
                                        error={errors.receivedBy}
                                        currentLabel={receivedBy ? `${receivedBy.first_name} ${receivedBy.last_name}` : undefined}
                                    />
                                    {errors.receivedBy && <p className="text-destructive mt-1 text-sm">{errors.receivedBy}</p>}
                                    {receivedBy && (
                                        <p className="text-muted-foreground mt-1 text-xs">
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
