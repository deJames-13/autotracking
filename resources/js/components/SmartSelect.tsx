import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    initialValue?: string | number | null;
    customNoneLabel?: string;
    noNoneOption?: boolean;
    loading?: boolean;
    onSelect?: (value: string | number | null) => void;
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
}

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
        />
    );
};

export default SmartSelect;
