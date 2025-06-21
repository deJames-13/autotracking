# Database Revision: Process Requirement Range - Single Field Implementation

## Overview
Updated the equipment process requirement range from two separate columns (`process_req_range_start` and `process_req_range_end`) to a single combined field (`process_req_range`) while maintaining full backward compatibility.

## Database Changes

### New Migration
**File:** `database/migrations/2025_06_21_000001_add_process_req_range_to_equipments_table.php`

- Added new `process_req_range` column to `equipments` table
- Column type: `text` with `nullable()` constraint
- Maximum length validation: 500 characters
- Old columns are preserved for backward compatibility

### Migration SQL
```sql
ALTER TABLE equipments ADD process_req_range TEXT NULL AFTER next_calibration_due;
```

## Model Changes

### Equipment Model
**File:** `app/Models/Equipment.php`

#### Added Fields
- `process_req_range` to `$fillable` array

#### Backward Compatibility Accessors/Mutators
- `getProcessReqRangeStartAttribute()`: Parses combined field to extract start value
- `getProcessReqRangeEndAttribute()`: Parses combined field to extract end value  
- `setProcessReqRangeStartAttribute()`: Updates combined field when start is set
- `setProcessReqRangeEndAttribute()`: Updates combined field when end is set

#### Parsing Logic
Supports multiple input formats:
- `"100 - 200"` → start: "100", end: "200"
- `"100-200"` → start: "100", end: "200"
- `"100 to 200"` → start: "100", end: "200"
- `"100"` → start: "100", end: null

## Validation Changes

### TrackIncomingRequest
**File:** `app/Http/Requests/TrackIncomingRequest.php`

- Added `data.equipment.processReqRange` validation (nullable, string, max:500)
- Maintained existing `processReqRangeStart` and `processReqRangeEnd` validation
- Added validation message for the new field

### EquipmentRequest  
**File:** `app/Http/Requests/EquipmentRequest.php`

- Added `process_req_range` validation (nullable, string, max:500)
- Maintained existing separate field validation

## Controller Changes

### TrackIncomingController
**File:** `app/Http/Controllers/Api/TrackIncomingController.php`

#### New Helper Method
- `processRangeData()`: Handles conversion between combined and separate fields
- Supports priority-based field processing:
  1. Use new combined field if provided
  2. Combine old separate fields if new field is empty
  3. Parse combined field back to separate fields for storage

#### Updated Equipment Creation/Update
- Equipment creation and updates now use the helper method
- Stores data in both new and old fields for transition period
- Maintains full backward compatibility

## Frontend Changes

### Equipment Form Component
**File:** `resources/js/components/admin/equipment/equipment-form.tsx`

#### UI Changes
- Replaced two separate input fields with single combined field
- New field label: "Process Requirement Range"
- Enhanced placeholder: "Enter range (e.g., 100 - 200, 50 to 100, 75)"
- Added helpful description text for user guidance

#### Form Logic
- `getCombinedProcessRange()`: Helper to initialize combined field from equipment data
- Real-time parsing: Updates old fields automatically when combined field changes
- Supports all standard range formats

### Tracking Request Form
**File:** `resources/js/components/admin/tracking/request/detail-tab.tsx`

- Form already handles the process range fields correctly
- Compatible with both old and new field structures
- No changes needed as it uses the Redux store

### Redux Store
**File:** `resources/js/store/slices/trackingRequestSlice.ts`

#### Updated EquipmentState Interface
- Added `processReqRange?: string` field
- Maintained existing `processReqRangeStart` and `processReqRangeEnd` for backward compatibility
- Updated initial state to include new field

## Validation Schema Updates

### Equipment Schema
**File:** `resources/js/validation/equipment-schema.ts`

- Added `process_req_range` to both `equipmentSchema` and `equipmentFormSchema`
- Maximum length validation: 500 characters
- Optional field with empty string default

### Tracking Request Schema
**File:** `resources/js/validation/tracking-request-schema.ts`

- Added `processReqRange` to equipment schema
- Maintains existing separate field validation
- 500 character limit validation

## TypeScript Interface Updates

### Equipment Interface
**File:** `resources/js/types/index.d.ts`

- Added `process_req_range?: string | null` to Equipment interface
- Maintains existing separate field types
- Full backward compatibility preserved

## User Experience Improvements

### Before
- Users had to fill two separate fields: "Process Req Range Start" and "Process Req Range End"
- More complex form with extra fields
- Potential confusion about which field to use for single values

### After  
- Single intuitive field: "Process Requirement Range"
- Users can enter natural formats:
  - `"100 - 200"` for ranges
  - `"100 to 200"` for ranges  
  - `"75"` for single values
- Clear helper text and examples
- Automatic parsing and validation

## Backward Compatibility

### Data Migration
- **No data migration needed**: Existing data remains intact
- Old fields continue to work normally
- New field will be populated as records are updated

### API Compatibility
- All existing API endpoints continue to accept old field names
- Controllers handle both old and new field formats
- Responses include both field formats during transition

### Legacy Support
- Old separate fields are preserved in database
- Model accessors ensure old field access still works
- Forms can use either field structure
- Validation supports both approaches

## Implementation Benefits

1. **User-Friendly**: Single field with natural input formats
2. **Flexible**: Supports ranges, single values, and various separators
3. **Backward Compatible**: Zero breaking changes
4. **Data Integrity**: Automatic parsing and validation
5. **Future-Proof**: Easy to remove old fields when ready

## Migration Strategy

### Phase 1: Current Implementation ✅
- New field added alongside existing fields
- All components support both field structures
- Users can start using the new format immediately

### Phase 2: Future (Optional)
- Monitor usage patterns
- Migrate remaining old format data to new format
- Remove old field validations and UI elements

### Phase 3: Complete Migration (Optional)
- Remove old database columns
- Clean up backward compatibility code
- Simplify validation and model logic

## Testing Recommendations

1. **Data Input Testing**
   - Test various range formats ("100-200", "100 - 200", "100 to 200")
   - Test single value inputs
   - Test empty values and validation

2. **Backward Compatibility Testing**
   - Verify existing equipment data displays correctly
   - Test old API format still works
   - Ensure old form submissions process correctly

3. **API Testing**
   - Test equipment creation with new field
   - Test equipment updates with mixed field usage
   - Verify tracking request submissions work

4. **UI Testing**
   - Test equipment form with new combined field
   - Verify tracking request form compatibility
   - Test error handling and validation messages

## Files Modified

### Database
- `database/migrations/2025_06_21_000001_add_process_req_range_to_equipments_table.php`

### Backend
- `app/Models/Equipment.php`
- `app/Http/Requests/TrackIncomingRequest.php`
- `app/Http/Requests/EquipmentRequest.php`
- `app/Http/Controllers/Api/TrackIncomingController.php`

### Frontend
- `resources/js/components/admin/equipment/equipment-form.tsx`
- `resources/js/store/slices/trackingRequestSlice.ts`
- `resources/js/validation/equipment-schema.ts`
- `resources/js/validation/tracking-request-schema.ts`
- `resources/js/types/index.d.ts`

## Database Schema
```sql
-- New column added to equipments table
ALTER TABLE equipments ADD process_req_range TEXT NULL AFTER next_calibration_due;

-- Existing columns preserved for backward compatibility:
-- process_req_range_start TEXT NULL
-- process_req_range_end TEXT NULL
```
