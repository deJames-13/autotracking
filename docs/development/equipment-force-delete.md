# Equipment Force Delete Implementation

## Overview
Updated the equipment force delete functionality to permanently delete all related tracking records instead of just nullifying references. This provides a true cascade delete option for equipment cleanup.

## Changes Made

### Backend Controller (EquipmentController.php)
**Method**: `forceDeleteEquipmentWithRelations()`

**Previous Behavior**: 
- Set `equipment_id` to `null` in track_incoming records
- Preserve all tracking data

**New Behavior**:
1. Find all `track_incoming` records for the equipment
2. Delete all `track_outgoing` records that reference those incoming records
3. Delete all `track_incoming` records for the equipment
4. Finally delete the equipment itself

**Code Logic**:
```php
\DB::transaction(function () use ($equipment) {
    // 1. Get all track_incoming records for this equipment
    $trackIncomingIds = \DB::table('track_incoming')
        ->where('equipment_id', $equipment->equipment_id)
        ->pluck('id');

    // 2. Delete track_outgoing records that reference these track_incoming records
    if ($trackIncomingIds->isNotEmpty()) {
        \DB::table('track_outgoing')
            ->whereIn('incoming_id', $trackIncomingIds)
            ->delete();
    }

    // 3. Delete track_incoming records for this equipment
    \DB::table('track_incoming')
        ->where('equipment_id', $equipment->equipment_id)
        ->delete();

    // 4. Finally, force delete the equipment itself
    $equipment->forceDelete();
});
```

### Frontend Dialog (equipment-delete-dialog.tsx)
**Updated Elements**:
- Dialog description warns about permanent deletion
- Checkbox label indicates "permanently delete equipment and all tracking records"
- Warning message clarifies that tracking records will be deleted, not just nullified
- Success toast message reflects permanent deletion

**Warning Messages**:
- Shows count of tracking records that will be permanently deleted
- Lists what will be deleted: tracking records, outgoing records, and equipment
- Clear indication this action cannot be undone

## Database Impact

### Tables Affected:
1. `track_outgoing` - Records deleted where `incoming_id` references equipment's tracking records
2. `track_incoming` - Records deleted where `equipment_id` matches the equipment
3. `equipments` - Equipment record permanently deleted

### Data Loss Warning:
⚠️ **This is a destructive operation** - All tracking history for the equipment will be permanently lost, including:
- Calibration dates and due dates
- Technician assignments
- Employee check-in/out records
- Cycle times and performance metrics
- Status history and notes

## Use Cases

**When to use Force Delete**:
- Equipment is permanently retired/scrapped
- Data cleanup for test/demo equipment
- Correcting data entry errors where equipment was created in error
- Complete removal of equipment and all its history

**When NOT to use Force Delete**:
- Equipment might be reactivated later
- Historical tracking data needs to be preserved
- Audit trails are required for compliance
- Equipment is just being transferred or reassigned

## Safety Features

1. **Transaction Wrapping**: All deletions occur within a database transaction
2. **Clear Warnings**: Multiple UI warnings about permanent deletion
3. **Confirmation Required**: Force delete checkbox must be explicitly checked
4. **Cascade Logic**: Proper order of deletion to avoid foreign key conflicts

## Migration Compatibility

This change works with the existing migration structure where `track_outgoing.incoming_id` has a foreign key constraint with cascade delete to `track_incoming.id`. The manual deletion respects this relationship by deleting in the correct order.

## Comparison with Other Entities

Unlike other entities (departments, users, locations, plants) which nullify references to preserve data, **equipment force delete is destructive** because:
- Equipment tracking records are tightly coupled to the specific equipment
- Equipment lifecycle data is not useful without the equipment context
- Equipment replacement scenarios typically warrant fresh tracking history

This makes equipment force delete the most aggressive cleanup option in the system.
