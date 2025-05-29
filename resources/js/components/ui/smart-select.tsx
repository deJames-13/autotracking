import { Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { SingleValue, MultiValue, ActionMeta } from 'react-select';

export interface SelectOption {
    label: string;
    value: string | number | null;
    __isNew__?: boolean;
}

interface SmartSelectFieldProps extends UseControllerProps {
    loadOptions: (inputValue: string) => Promise<SelectOption[]>;
    initialValue?: string | number | null | (string | number | null)[];
    customNoneLabel?: string;
    noNoneOption?: boolean;
    loading?: boolean;
    onSelect?: (value: string | number | null | (string | number | null)[]) => void;
    onCreateOption?: (inputValue: string) => Promise<SelectOption> | SelectOption;
    placeholder?: string;
    isDisabled?: boolean;
    className?: string;
    isMulti?: boolean;
    cacheOptions?: boolean;
    defaultOptions?: SelectOption[] | boolean;
}

interface SmartSelectProps {
    loadOptions: (inputValue: string) => Promise<SelectOption[]>;
    onSelect: (value: string | number | null | (string | number | null)[]) => void;
    value?: string | number | null | (string | number | null)[];
    onCreateOption?: (inputValue: string) => Promise<SelectOption> | SelectOption;
    customNoneLabel?: string;
    noNoneOption?: boolean;
    loading?: boolean;
    placeholder?: string;
    isDisabled?: boolean;
    className?: string;
    isMulti?: boolean;
    cacheOptions?: boolean;
    defaultOptions?: SelectOption[] | boolean;
    name?: string;
    error?: string;
    initialOption?: SelectOption | null;
    minSearchLength?: number; // Add minimum search length parameter
}

// Store selected option labels globally to prevent losing them on re-renders
const optionCache = new Map<string | number, string>();

// Direct form component that works with Inertia
export const InertiaSmartSelect = ({
    name,
    value,
    onChange,
    error,
    loadOptions,
    onCreateOption,
    customNoneLabel = 'None',
    noNoneOption = false,
    loading = false,
    isMulti = false,
    initialOption = null,
    minSearchLength = 2, // Default minimum search length is 2
    ...props
}: {
    name: string;
    value: string | number | null | (string | number | null)[];
    onChange: (value: string | number | null | (string | number | null)[]) => void;
    error?: string;
    initialOption?: SelectOption | null;
    minSearchLength?: number;
} & Omit<SmartSelectProps, 'onSelect' | 'value' | 'initialOption' | 'minSearchLength'>) => {
    // Ref to track if we've initialized the component
    const initialized = useRef(false);
    // Internal selectedOption state - ONLY updated by our controlled logic
    const [selectedOption, setSelectedOption] = useState<SelectOption | SelectOption[] | null>(initialOption);
    // Track if we're loading a label for a value
    const [loadingLabel, setLoadingLabel] = useState(false);

    // Function to load the label for a value if we don't have it cached
    const loadLabelForValue = async (val: string | number | null) => {
        if (val === null || val === 'none') return;
        if (optionCache.has(val)) return;

        try {
            setLoadingLabel(true);
            // Load all options to try to find a match
            const options = await loadOptions('');
            const option = options.find(opt => opt.value === val);

            if (option) {
                optionCache.set(val, option.label);
            } else {
                // If we can't find it, just use the value as the label
                optionCache.set(val, String(val));
            }
        } catch (error) {
            console.error('Error loading label for value:', error);
            // Fallback to using the value as the label
            optionCache.set(val, String(val));
        } finally {
            setLoadingLabel(false);
        }
    };

    // Simple async load options without any side effects
    const handleAsyncLoadOptions = async (inputValue: string): Promise<SelectOption[]> => {
        // Only require minimum characters if minSearchLength is greater than 0
        if (minSearchLength > 0 && inputValue.length < minSearchLength) {
            // Return initial options on empty search if minSearchLength is 0
            if (inputValue.length === 0) {
                try {
                    return await loadOptions('');
                } catch (error) {
                    console.error('Error loading initial options:', error);
                    return [];
                }
            }
            return [];
        }

        try {
            const options = await loadOptions(inputValue);

            if (noNoneOption) {
                return options;
            }

            // Add "None" option if not in multi-select mode
            if (!isMulti) {
                return [
                    { label: customNoneLabel, value: 'none' },
                    ...options
                ];
            }

            return options;
        } catch (error) {
            console.error('Error loading options:', error);
            return [];
        }
    };

    // Handle change from the select component
    const handleChange = (
        newValue: SingleValue<SelectOption> | MultiValue<SelectOption>,
        actionMeta: ActionMeta<SelectOption>
    ) => {
        if (isMulti) {
            const values = newValue as MultiValue<SelectOption>;
            // Send the numeric values to the form, but keep the full options with labels for display
            const newValues = values ? values.map(option => option.value) : [];
            onChange(newValues);
            setSelectedOption(values || null);
        } else {
            const option = newValue as SingleValue<SelectOption>;
            if (!option) {
                onChange(null);
                setSelectedOption(null);
                return;
            }

            if (option.value === 'none') {
                onChange(null);
                setSelectedOption({ label: customNoneLabel, value: 'none' });
            } else {
                // Save the label to our cache - use a string key for consistent lookup
                optionCache.set(String(option.value), option.label);

                // Send just the value to the form
                onChange(option.value);

                // Keep the full option with label for display
                setSelectedOption(option);
            }
        }
    };

    // Handle create option - keep the numerical ID from the API
    const handleCreateOption = async (inputValue: string) => {
        if (onCreateOption) {
            try {
                const newOption = await onCreateOption(inputValue);

                // Save the label to our cache - use a string key for consistent lookup
                optionCache.set(String(newOption.value), newOption.label);

                if (isMulti) {
                    const currentValues = selectedOption as SelectOption[] || [];
                    const newValues = [...currentValues, newOption];
                    // For multi-select, use the numeric ID values
                    onChange(newValues.map(option => option.value));
                    setSelectedOption(newValues);
                } else {
                    // Send the numeric ID value to the form
                    onChange(newOption.value);

                    // Keep the full option with label for display
                    setSelectedOption(newOption);
                }
            } catch (error) {
                console.error('Error creating new option:', error);
            }
        }
    };

    // Function to get or fetch label for a value
    const getOrFetchLabel = async (val: string | number | null) => {
        if (val === null || val === 'none') return null;

        // Check cache first with string key for consistent lookup
        const cacheKey = String(val);
        if (optionCache.has(cacheKey)) {
            return { value: val, label: optionCache.get(cacheKey)! };
        }

        try {
            setLoadingLabel(true);
            // Try to load the label
            const options = await loadOptions('');
            const option = options.find(opt => String(opt.value) === cacheKey);

            if (option) {
                // Found the option, cache and return
                optionCache.set(cacheKey, option.label);
                return option;
            } else {
                // If not found, use the value as label
                optionCache.set(cacheKey, cacheKey);
                return { value: val, label: cacheKey };
            }
        } catch (error) {
            console.error('Error loading label for value:', error);
            // Use value as label as fallback
            optionCache.set(cacheKey, cacheKey);
            return { value: val, label: cacheKey };
        } finally {
            setLoadingLabel(false);
        }
    };

    // Initialize selected option based on value prop or initialOption
    useEffect(() => {
        // Skip if value hasn't changed
        if (value === null && selectedOption === null) return;
        if (selectedOption && value !== null && String(selectedOption.value) === String(value)) return;

        // Use a ref to track if this is the first run with an initialOption
        const isFirstRun = !initialized.current && initialOption;

        // If we have an initialOption and it's the first run, use it directly
        if (isFirstRun) {
            setSelectedOption(initialOption);
            initialized.current = true;
            return;
        }

        const initializeOption = async () => {
            // For multi-select
            if (isMulti && Array.isArray(value)) {
                // Handle multi-select initialization
                const options = await Promise.all(
                    value.map(async (val) => {
                        const option = await getOrFetchLabel(val);
                        return option || { label: String(val), value: val };
                    })
                );
                setSelectedOption(options);
                return;
            }

            // For single-select
            if (!isMulti) {
                if (value === null) {
                    // For null/none value
                    if (!noNoneOption) {
                        setSelectedOption({ label: customNoneLabel, value: 'none' });
                    } else {
                        setSelectedOption(null);
                    }
                    return;
                }

                // For actual value
                const option = await getOrFetchLabel(value);
                setSelectedOption(option);
            }
        };

        // Only run initialization if the value has changed
        initializeOption();
    }, [value]); // Only depend on value, not isMulti, noNoneOption

    if (loading) {
        return (
            <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
            </div>
        );
    }

    // Use a modified value for display in the select component
    const getDisplayValue = () => {
        // If we don't have a selected option yet, return null
        if (!selectedOption) return null;

        // For multi-select, return the array of options
        if (isMulti) return selectedOption;

        // For single select, ensure we show the label but use the value internally
        return selectedOption;
    };

    return (
        <div>
            <AsyncCreatableSelect
                name={name}
                value={selectedOption}
                onChange={handleChange}
                loadOptions={handleAsyncLoadOptions}
                onCreateOption={onCreateOption ? handleCreateOption : undefined}
                isLoading={loading || loadingLabel}
                cacheOptions={props.cacheOptions ?? true}
                defaultOptions={props.defaultOptions ?? true} // Set default to true
                isSearchable
                isMulti={isMulti}
                placeholder={props.placeholder}
                isDisabled={props.isDisabled}
                className={props.className}
                formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                noOptionsMessage={({ inputValue }) =>
                    !inputValue || (minSearchLength > 0 && inputValue.length < minSearchLength)
                        ? minSearchLength > 0 ? `Type at least ${minSearchLength} characters to search...` : 'No options available'
                        : `No options found for "${inputValue}"`
                }
                getOptionValue={(option) => String(option.value)}
                getOptionLabel={(option) => option.label}
                styles={{
                    control: (base) => ({
                        ...base,
                        minHeight: '38px',
                    }),
                    menu: (base) => ({
                        ...base,
                        zIndex: 999,
                    })
                }}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

const SmartSelectField = ({
    loadOptions,
    initialValue,
    customNoneLabel,
    noNoneOption = false,
    loading = false,
    onCreateOption,
    cacheOptions = true,
    defaultOptions = true,
    isMulti = false,
    ...props
}: SmartSelectFieldProps) => {
    const {
        field,
        fieldState: { error }
    } = useController(props);

    const [selectedOption, setSelectedOption] = useState<SelectOption | SelectOption[] | null>(null);

    const handleAsyncLoadOptions = async (inputValue: string): Promise<SelectOption[]> => {
        try {
            const options = await loadOptions(inputValue);

            if (noNoneOption) {
                return options;
            }

            // Add "None" option if not in multi-select mode
            if (!isMulti) {
                return [
                    { label: customNoneLabel || 'None', value: 'none' },
                    ...options
                ];
            }

            return options;
        } catch (error) {
            console.error('Error loading options:', error);
            return [];
        }
    };

    const handleChange = (
        newValue: SingleValue<SelectOption> | MultiValue<SelectOption>,
        actionMeta: ActionMeta<SelectOption>
    ) => {
        if (isMulti) {
            const values = newValue as MultiValue<SelectOption>;
            field.onChange(values ? values.map(option => option.value) : []);
            setSelectedOption(values ? [...values] : null);
        } else {
            const option = newValue as SingleValue<SelectOption>;
            if (!option) {
                field.onChange(null);
                setSelectedOption(null);
                return;
            }

            if (option.value === 'none') {
                field.onChange(null);
                setSelectedOption({ label: customNoneLabel || 'None', value: 'none' });
            } else {
                field.onChange(option.value);
                setSelectedOption(option);
            }
        }
    };

    const handleCreateOption = async (inputValue: string) => {
        if (onCreateOption) {
            try {
                const newOption = await onCreateOption(inputValue);

                if (isMulti) {
                    const currentValues = selectedOption as SelectOption[] || [];
                    const newValues = [...currentValues, newOption];
                    field.onChange(newValues.map(option => option.value));
                    setSelectedOption(newValues);
                } else {
                    field.onChange(newOption.value);
                    setSelectedOption(newOption);
                }
            } catch (error) {
                console.error('Error creating new option:', error);
            }
        }
    };

    useEffect(() => {
        if (initialValue !== undefined) {
            if (isMulti && Array.isArray(initialValue)) {
                // Handle multi-select initial values
                setSelectedOption(initialValue.map(val => ({ label: String(val), value: val })));
            } else if (!isMulti) {
                // Handle single select initial value
                if (initialValue === null && !noNoneOption) {
                    setSelectedOption({ label: customNoneLabel || 'None', value: 'none' });
                } else if (initialValue !== null) {
                    setSelectedOption({ label: String(initialValue), value: initialValue });
                }
            }
        }
    }, [initialValue, customNoneLabel, noNoneOption, isMulti]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <AsyncCreatableSelect
                {...field}
                value={selectedOption}
                onChange={handleChange}
                loadOptions={handleAsyncLoadOptions}
                onCreateOption={handleCreateOption}
                cacheOptions={cacheOptions}
                defaultOptions={defaultOptions}
                isSearchable
                isMulti={isMulti}
                placeholder={props.placeholder}
                isDisabled={props.isDisabled}
                className={props.className}
                formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                noOptionsMessage={({ inputValue }) =>
                    inputValue ? `No options found for "${inputValue}"` : 'Start typing to search...'
                }
                getOptionValue={(option) => String(option.value)}
                getOptionLabel={(option) => option.label}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error.message}</p>
            )}
        </div>
    );
};

const SmartSelect = ({
    isField = false,
    onSelect,
    customNoneLabel = 'None',
    noNoneOption = false,
    loading = false,
    isMulti = false,
    ...props
}: SmartSelectProps & { isField?: boolean } & Partial<SmartSelectFieldProps>) => {
    if (isField) {
        return <SmartSelectField {...props as SmartSelectFieldProps} />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
            </div>
        );
    }

    const handleAsyncLoadOptions = async (inputValue: string): Promise<SelectOption[]> => {
        try {
            const options = await props.loadOptions(inputValue);

            if (noNoneOption || isMulti) {
                return options;
            }

            return [
                { label: customNoneLabel, value: 'none' },
                ...options
            ];
        } catch (error) {
            console.error('Error loading options:', error);
            return [];
        }
    };

    const handleChange = (
        newValue: SingleValue<SelectOption> | MultiValue<SelectOption>
    ) => {
        if (isMulti) {
            const values = newValue as MultiValue<SelectOption>;
            onSelect(values ? values.map(option => option.value) : []);
        } else {
            const option = newValue as SingleValue<SelectOption>;
            if (option) {
                onSelect(option.value);
            }
        }
    };

    return (
        <AsyncCreatableSelect
            {...props}
            onChange={handleChange}
            loadOptions={handleAsyncLoadOptions}
            cacheOptions={props.cacheOptions}
            defaultOptions={props.defaultOptions}
            isSearchable
            isMulti={isMulti}
            formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
            noOptionsMessage={({ inputValue }) =>
                inputValue ? `No options found for "${inputValue}"` : 'Start typing to search...'
            }
            getOptionValue={(option) => String(option.value)}
            getOptionLabel={(option) => option.label}
        />
    );
};

export default SmartSelect;
