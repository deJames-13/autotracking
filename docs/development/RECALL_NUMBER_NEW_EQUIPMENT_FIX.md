# Recall Number Field for New Equipment - Implementation

## Overview
Modified the tracking request form to always show a recall number field for new equipment requests, allowing manual input instead of hiding the field.

## Changes Made

### 1. Modified detail-tab.tsx
**File:** `/resources/js/components/admin/tracking/request/detail-tab.tsx`

**Key Changes:**
- Updated the recall number section to show for both `routine` and `new` request types
- For `routine` requests: Kept the existing smart-select functionality for searching existing equipment
- For `new` requests: Added a plain input field for manual recall number entry
- Added helpful text label indicating "(for new equipment)" when in new mode
- Maintained barcode scanning functionality for both types
- Added proper error display for the recall number field

**Before:**
```tsx
{requestType === 'routine' && (
    <div className="bg-muted/20 mb-6 rounded-lg border p-4">
        <label className="mb-2 block w-full font-semibold">Recall Number</label>
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
)}
```

**After:**
```tsx
{(requestType === 'routine' || requestType === 'new') && (
    <div className="bg-muted/20 mb-6 rounded-lg border p-4">
        <label className="mb-2 block w-full font-semibold">
            Recall Number
            {requestType === 'new' && <span className="text-muted-foreground ml-1 text-xs font-normal">(for new equipment)</span>}
        </label>
        <div className="flex w-full items-center gap-2">
            <div className="w-full">
                {requestType === 'routine' ? (
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
                ) : (
                    <Input
                        id="recallNumber"
                        value={recallNumber}
                        onChange={(e) => handleRecallNumberChange(e.target.value)}
                        placeholder="Enter recall number for new equipment"
                        className={errors.recallNumber ? 'border-destructive' : ''}
                    />
                )}
            </div>
            {/* ... barcode scanner remains the same ... */}
        </div>
        {recallBarcodeError && <div className="mt-1 text-xs text-red-500">{recallBarcodeError}</div>}
        {errors.recallNumber && <div className="mt-1 text-xs text-red-500">{errors.recallNumber}</div>}
    </div>
)}
```

## Backend Integration
The backend was already properly configured to handle recall numbers for new equipment:

### TrackIncomingRequest Validation
- **For `routine` requests:** Recall number is required and must exist in equipment records
- **For `new` requests:** Recall number is optional (nullable)

### TrackIncomingController
- **For `routine` requests:** Validates that equipment with the recall number exists
- **For `new` requests:** Accepts the recall number if provided, creates new equipment record
- **Storage:** Recall number is stored in both the Equipment and TrackIncoming models

## User Experience Improvements
1. **Consistent Interface:** Recall number field is now always visible when relevant
2. **Clear Context:** Added helpful label text indicating the field is for new equipment
3. **Proper Validation:** Error messages display correctly for both input types
4. **Barcode Support:** Scanning functionality works for both routine and new equipment
5. **Flexible Input:** Plain input allows any recall number format for new equipment

## Impact
- **New Equipment Requests:** Users can now manually enter recall numbers that will be stored with the equipment
- **Routine Equipment Requests:** Existing smart-select functionality is preserved
- **Data Integrity:** Validation ensures proper recall number handling for both request types
- **User Workflow:** More intuitive and consistent form behavior

## Testing Considerations
- Verify recall number input works for new equipment requests
- Confirm smart-select continues to work for routine requests
- Test barcode scanning for both request types
- Validate that recall numbers are properly stored in the database
- Check error handling for invalid recall numbers

## Files Modified
- `/resources/js/components/admin/tracking/request/detail-tab.tsx`

## Files Reviewed (No Changes Needed)
- `/app/Http/Requests/TrackIncomingRequest.php` - Already properly configured
- `/app/Http/Controllers/Api/TrackIncomingController.php` - Already handles both cases
- `/resources/js/pages/admin/tracking/request/index.tsx` - No changes needed
