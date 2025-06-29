import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleModal, SimpleModalContent, SimpleModalHeader, SimpleModalTitle } from '@/components/ui/simple-modal';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { Check, ChevronDown, Loader2, Plus, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export interface ModalSelectOption {
    label: string;
    value: string | number | null;
    description?: string;
    userData?: any;
}

interface ModalSelectProps {
    name: string;
    value: string | number | null;
    onChange: (value: string | number | null) => void;

    // API Configuration
    searchEndpoint: string;
    createEndpoint?: string;

    // Display Configuration
    label?: string;
    placeholder?: string;
    error?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;

    // Modal Configuration
    modalTitle: string;
    searchPlaceholder?: string;
    allowCreate?: boolean;
    createLabel?: string;

    // Data Configuration
    limit?: number;
    minSearchLength?: number;
    customNoneLabel?: string;
    noNoneOption?: boolean;

    // Event Handlers
    onCreateOption?: (inputValue: string) => Promise<ModalSelectOption>;
    formatOptionLabel?: (option: ModalSelectOption) => string;
    formatCreateLabel?: (inputValue: string) => string;

    // Initial Data
    initialOptions?: ModalSelectOption[];
    currentLabel?: string;
}

export function ModalSelect({
    name,
    value,
    onChange,
    searchEndpoint,
    createEndpoint,
    label,
    placeholder = "Select an option",
    error,
    className,
    disabled = false,
    required = false,
    modalTitle,
    searchPlaceholder = "Search...",
    allowCreate = false,
    createLabel = "Create new",
    limit = 10,
    minSearchLength = 0,
    customNoneLabel = "None",
    noNoneOption = false,
    onCreateOption,
    formatOptionLabel,
    formatCreateLabel,
    initialOptions = [],
    currentLabel,
}: ModalSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [options, setOptions] = useState<ModalSelectOption[]>(initialOptions);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState<string>(currentLabel || '');

    // Load options from API
    const loadOptions = useCallback(async (query: string = '') => {
        if (query.length < minSearchLength && query.length > 0) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(searchEndpoint, {
                params: {
                    search: query,
                    limit,
                    ...(query.length === 0 ? {} : { q: query })
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });

            let fetchedOptions: ModalSelectOption[] = [];

            // Handle different response formats from different controllers
            if (Array.isArray(response.data)) {
                // Direct array format (e.g., from searchDepartments, searchPlants)
                fetchedOptions = response.data.map((item: any) => ({
                    label: item.label || item.department_name || item.plant_name || item.location_name || item.name || String(item.value),
                    value: item.value || item.department_id || item.plant_id || item.location_id || item.id,
                }));
            } else if (response.data.data && Array.isArray(response.data.data)) {
                // Nested data format (e.g., from some equipment endpoints)
                fetchedOptions = response.data.data.map((item: any) => ({
                    label: item.label || item.department_name || item.plant_name || item.location_name || item.description || item.name || String(item.value),
                    value: item.value || item.department_id || item.plant_id || item.location_id || item.equipment_id || item.id,
                }));
            } else if (response.data.data?.data && Array.isArray(response.data.data.data)) {
                // Double nested format (e.g., from paginated endpoints)
                fetchedOptions = response.data.data.data.map((item: any) => {
                    // Handle user objects specifically
                    if (item.first_name && item.last_name) {
                        return {
                            label: `${item.first_name} ${item.last_name} (${item.employee_id})`,
                            value: item.employee_id || item.user_id,
                            userData: {
                                user_id: item.user_id,
                                employee_id: item.employee_id || item.user_id,
                                first_name: item.first_name,
                                last_name: item.last_name,
                                full_name: `${item.first_name} ${item.last_name}`,
                                email: item.email || '',
                            }
                        };
                    }

                    // Handle other entities
                    return {
                        label: item.label || item.department_name || item.plant_name || item.location_name || item.description || item.name || String(item.value),
                        value: item.value || item.department_id || item.plant_id || item.location_id || item.equipment_id || item.id,
                    };
                });
            }

            // Add none option if not disabled
            if (!noNoneOption && query.length === 0) {
                fetchedOptions.unshift({
                    label: customNoneLabel,
                    value: null,
                });
            }

            setOptions(fetchedOptions);
        } catch (error) {
            console.error('Error loading options:', error);
            toast.error('Failed to load options');
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [searchEndpoint, limit, minSearchLength, noNoneOption, customNoneLabel]);

    // Create new option
    const handleCreateOption = async () => {
        if (!searchQuery.trim() || !allowCreate) return;

        setCreating(true);
        try {
            let newOption: ModalSelectOption;

            if (onCreateOption) {
                newOption = await onCreateOption(searchQuery.trim());
            } else if (createEndpoint) {
                const response = await axios.post(createEndpoint, {
                    name: searchQuery.trim(), // All create endpoints expect 'name' field
                }, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                });

                // Handle response format - should return {label, value} format
                if (response.data.label && response.data.value !== undefined) {
                    newOption = {
                        label: response.data.label,
                        value: response.data.value,
                    };
                } else {
                    // Fallback if response format is different
                    newOption = {
                        label: searchQuery.trim(),
                        value: response.data.id || response.data.department_id || response.data.plant_id || response.data.location_id,
                    };
                }
            } else {
                throw new Error('No create option handler provided');
            }

            // Add to options and select it
            setOptions(prev => [newOption, ...prev]);
            handleSelect(newOption);
            setSearchQuery('');

            toast.success(`${createLabel} "${searchQuery.trim()}" created successfully`);
        } catch (error: any) {
            console.error('Error creating option:', error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.response?.data?.errors) {
                // Handle validation errors
                const errors = error.response.data.errors;
                const errorMessages = Object.values(errors).flat();
                toast.error(errorMessages.join(', '));
            } else {
                toast.error(`Failed to create ${createLabel.toLowerCase()}`);
            }
        } finally {
            setCreating(false);
        }
    };

    // Handle option selection
    const handleSelect = (option: ModalSelectOption) => {
        onChange(option.value);
        setSelectedLabel(option.label);
        setIsOpen(false);
        setSearchQuery('');
    };

    // Handle search query change
    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        loadOptions(query);
    };

    // Load initial options when modal opens
    useEffect(() => {
        if (isOpen) {
            loadOptions();
        }
    }, [isOpen, loadOptions]);

    // Update selected label when value changes externally
    useEffect(() => {
        if (currentLabel) {
            setSelectedLabel(currentLabel);
        } else if (value !== null && value !== undefined) {
            // Try to find label from current options
            const foundOption = options.find(opt => String(opt.value) === String(value));
            if (foundOption) {
                setSelectedLabel(foundOption.label);
            } else {
                setSelectedLabel(String(value));
            }
        } else {
            setSelectedLabel('');
        }
    }, [value, currentLabel, options]);

    // Display value
    const displayValue = selectedLabel || (value ? String(value) : '');
    const hasValue = value !== null && value !== undefined && value !== '';

    return (
        <div className="space-y-2">
            {label && (
                <Label
                    htmlFor={name}
                    className={cn(error ? 'text-destructive' : '')}
                >
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}

            <Button
                type="button"
                variant="outline"
                onClick={() => !disabled && setIsOpen(true)}
                disabled={disabled}
                className={cn(
                    "w-full justify-between font-normal",
                    !hasValue && "text-muted-foreground",
                    error && "border-destructive",
                    className
                )}
            >
                <span className="truncate">
                    {displayValue || placeholder}
                </span>
                <div className="flex items-center gap-2">
                    {hasValue && !disabled && (
                        <X
                            className="h-4 w-4 opacity-50 hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                                setSelectedLabel('');
                            }}
                        />
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
            </Button>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            <SimpleModal open={isOpen} onOpenChange={setIsOpen}>
                <SimpleModalContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                    <SimpleModalHeader>
                        <SimpleModalTitle>{modalTitle}</SimpleModalTitle>
                    </SimpleModalHeader>

                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10"
                                autoFocus
                            />
                        </div>

                        {/* Create Option Button */}
                        {allowCreate && searchQuery.trim() && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCreateOption}
                                disabled={creating}
                                className="w-full justify-start"
                            >
                                {creating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                {formatCreateLabel ?
                                    formatCreateLabel(searchQuery.trim()) :
                                    `${createLabel} "${searchQuery.trim()}"`
                                }
                            </Button>
                        )}

                        {/* Options List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : options.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">
                                    {searchQuery.length > 0 && searchQuery.length < minSearchLength ?
                                        `Type at least ${minSearchLength} characters to search` :
                                        'No options found'
                                    }
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {options.map((option, index) => {
                                        const isSelected = String(option.value) === String(value);
                                        return (
                                            <Button
                                                key={`${option.value}-${index}`}
                                                type="button"
                                                variant="ghost"
                                                onClick={() => handleSelect(option)}
                                                className={cn(
                                                    "w-full justify-start h-auto p-3 text-left",
                                                    isSelected && "bg-accent"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {formatOptionLabel ?
                                                                formatOptionLabel(option) :
                                                                option.label
                                                            }
                                                        </div>
                                                        {option.description && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {option.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <Check className="h-4 w-4 text-primary" />
                                                    )}
                                                </div>
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </SimpleModalContent>
            </SimpleModal>
        </div>
    );
}

// Specialized components for common use cases
export function DepartmentModalSelect(props: Omit<ModalSelectProps, 'searchEndpoint' | 'createEndpoint' | 'modalTitle'>) {
    return (
        <ModalSelect
            {...props}
            searchEndpoint={route('admin.departments.search-departments')}
            createEndpoint={route('admin.departments.create-department')}
            modalTitle="Select Department"
            searchPlaceholder="Search departments..."
            createLabel="Department"
            allowCreate={true}
        />
    );
}

export function LocationModalSelect(props: Omit<ModalSelectProps, 'searchEndpoint' | 'createEndpoint' | 'modalTitle'>) {
    return (
        <ModalSelect
            {...props}
            searchEndpoint={route('admin.locations.search-locations')}
            createEndpoint={route('admin.locations.create-location')}
            modalTitle="Select Location"
            searchPlaceholder="Search locations..."
            createLabel="Location"
            allowCreate={true}
        />
    );
}

export function PlantModalSelect(props: Omit<ModalSelectProps, 'searchEndpoint' | 'createEndpoint' | 'modalTitle'>) {
    return (
        <ModalSelect
            {...props}
            searchEndpoint={route('admin.plants.search-plants')}
            createEndpoint={route('admin.plants.create-plant')}
            modalTitle="Select Plant"
            searchPlaceholder="Search plants..."
            createLabel="Plant"
            allowCreate={true}
        />
    );
}

export function UserModalSelect(props: Omit<ModalSelectProps, 'searchEndpoint' | 'modalTitle'>) {
    return (
        <ModalSelect
            {...props}
            searchEndpoint={route('admin.users.index')}
            modalTitle="Select User"
            searchPlaceholder="Search users..."
            formatOptionLabel={(option) =>
                option.userData ?
                    `${option.userData.first_name} ${option.userData.last_name} (${option.userData.employee_id})` :
                    option.label
            }
            minSearchLength={2}
            allowCreate={false}
        />
    );
}

export function EquipmentModalSelect(props: Omit<ModalSelectProps, 'searchEndpoint' | 'modalTitle'>) {
    return (
        <ModalSelect
            {...props}
            searchEndpoint={route('api.equipment.search-by-recall')}
            modalTitle="Select Equipment"
            searchPlaceholder="Search equipment by recall number..."
            formatOptionLabel={(option) =>
                option.description ?
                    `${option.label} - ${option.description}` :
                    option.label
            }
            minSearchLength={2}
            allowCreate={false}
        />
    );
} 