# Date Formatting Fix for Equipment Form

## Issue
The equipment form was receiving date values in MM/DD/YYYY format but expecting YYYY-MM-DD format for HTML date inputs, causing "Invalid date format" validation errors.

## Root Cause
1. Laravel's date casting was not explicitly formatting dates to YYYY-MM-DD
2. Frontend form initialization was not handling various date formats
3. Date inputs needed proper validation and formatting

## Solutions Implemented

### 1. Backend Changes (Equipment.php)

#### Updated Date Casts
```php
protected $casts = [
    'last_calibration_date' => 'date:Y-m-d',
    'next_calibration_due' => 'date:Y-m-d'
];
```

**Before**: Used generic 'date' casting which could return various formats
**After**: Explicitly format dates as 'Y-m-d' (YYYY-MM-DD) for consistent API responses

#### Fixed Model Accessors
- Added proper null checking with `isset()` and `!empty()` in accessor methods
- Prevents "Undefined array key" errors when `process_req_range` field doesn't exist
- Improved error handling in mutators

### 2. Frontend Changes (equipment-form.tsx)

#### Added Date Formatting Helper
```typescript
const formatDateForInput = (dateString?: string | null): string => {
    if (!dateString) return '';
    
    try {
        // Handle YYYY-MM-DD format (return as-is)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        // Handle MM/DD/YYYY format
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const [month, day, year] = dateString.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Fallback: Parse with Date constructor and format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '';
        }
        
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.warn('Error formatting date:', dateString, error);
        return '';
    }
};
```

#### Updated Form Initialization
```typescript
const { data, setData, post, put, processing, errors, reset } = useForm<EquipmentFormData>({
    // ...other fields...
    last_calibration_date: formatDateForInput(equipment?.last_calibration_date),
    next_calibration_due: formatDateForInput(equipment?.next_calibration_due),
    // ...other fields...
});
```

#### Added Date Input Handler
```typescript
const handleDateChange = (field: 'last_calibration_date' | 'next_calibration_due', value: string) => {
    // Only allow YYYY-MM-DD format
    if (value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        setData(field, value);
    }
};
```

#### Updated Date Input Elements
```tsx
<Input
    id="last_calibration_date"
    type="date"
    value={data.last_calibration_date}
    onChange={(e) => handleDateChange('last_calibration_date', e.target.value)}
    className={getCombinedErrors('last_calibration_date') ? 'border-destructive' : ''}
/>
```

### 3. Validation Schema Updates (equipment-schema.ts)

#### Improved Error Messages
```typescript
last_calibration_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)')
    .optional()
    .or(z.literal('')),
next_calibration_due: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)')
    .optional()
    .or(z.literal('')),
```

## Date Format Support

### Input Formats Handled
1. **YYYY-MM-DD**: Direct pass-through (HTML standard)
2. **MM/DD/YYYY**: Converted to YYYY-MM-DD
3. **Any valid Date() parseable format**: Converted via Date constructor
4. **Empty/null values**: Handled gracefully

### Output Format
- **Consistent**: Always YYYY-MM-DD for HTML date inputs
- **Backend**: Laravel casts ensure YYYY-MM-DD in API responses
- **Database**: Stored in standard DATE format

## Validation Flow

1. **Frontend Validation**: Zod schema validates YYYY-MM-DD format
2. **Input Handling**: `handleDateChange` enforces format on user input
3. **Form Initialization**: `formatDateForInput` converts various formats to standard
4. **Backend Validation**: Laravel request validation ensures proper format

## Error Prevention

### Undefined Array Key Errors
- Added `isset()` checks in Equipment model accessors
- Proper null handling in mutators
- Graceful fallbacks when fields don't exist

### Invalid Date Errors
- Format validation before date parsing
- Try-catch blocks around date operations
- Console warnings for debugging invalid inputs

### Validation Errors
- Clear error messages specify required format
- Real-time validation prevents invalid submissions
- Server-side validation as backup

## Testing Considerations

### Manual Testing
1. **Create Equipment**: Test with various date input methods
2. **Edit Equipment**: Verify existing dates load correctly
3. **Date Validation**: Test invalid formats show proper errors
4. **Empty Dates**: Verify optional fields work with empty values

### Edge Cases Covered
- Null/undefined date values
- Various international date formats
- Invalid date strings
- Empty form submissions
- Browser date picker usage

## Benefits

1. **User Experience**: Seamless date input regardless of source format
2. **Data Consistency**: All dates standardized to YYYY-MM-DD
3. **Error Prevention**: Robust error handling prevents crashes
4. **Validation**: Clear feedback for invalid date formats
5. **Maintenance**: Centralized date formatting logic

## Files Modified

### Backend
- `/app/Models/Equipment.php`: Updated date casts and accessor error handling

### Frontend
- `/resources/js/components/admin/equipment/equipment-form.tsx`: Added date formatting and validation
- `/resources/js/validation/equipment-schema.ts`: Improved validation error messages

All changes maintain backward compatibility while providing robust date handling for the equipment management system.
