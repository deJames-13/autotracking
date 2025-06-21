# Force Delete Feature Documentation

## Overview
The force delete feature allows administrators to delete entities (Departments, Equipment, Users, Locations, Plants) even when they have related records. Instead of permanently deleting related records, the system sets foreign key references to `null`, preserving data integrity while allowing cleanup.

## Implementation Details

### Database Changes
1. **Foreign Key Constraints**: Updated all foreign key constraints to use `onDelete('set null')` instead of `restrict` or `cascade`
2. **Soft Deletes**: Added soft deletes to locations table for better data preservation
3. **Combined Migrations**: Merged the `process_req_range` field into the main equipment migration

### Migration Files Updated
- `0001_01_01_000000_create_users_table.php`: Added soft deletes to locations
- `2025_05_25_112245_create_equipments_table.php`: Added `process_req_range` field, combined migrations
- `2025_05_25_112250_create_records_table.php`: Updated foreign keys to use `set null`
- Removed: `2025_06_21_000001_add_process_req_range_to_equipments_table.php` (merged)

## Force Delete Implementations

### 1. Departments
**Controller**: `DepartmentController@destroy`
**Force Delete Logic**:
- Sets `department_id` to `null` in users table
- Sets `department_id` to `null` in equipments table  
- Soft deletes locations and sets `department_id` to `null`
- Nullifies foreign keys in tracking records for users/equipment/locations from this department

**UI**: `department-delete-dialog.tsx`
- Checkbox for force delete when related records exist
- Clear warnings about affected records
- Dynamic button text and styling

### 2. Equipment
**Controller**: `EquipmentController@destroy`
**Force Delete Logic**:
- Sets `equipment_id` to `null` in track_incoming records

**UI**: `equipment-delete-dialog.tsx`
- Force delete option when tracking records exist
- Shows count of related tracking records

### 3. Users
**Controller**: `UserController@destroy`
**Force Delete Logic**:
- Sets `employee_id` to `null` in equipments table
- Nullifies user references in track_incoming:
  - `technician_id`
  - `employee_id_in`
  - `received_by_id`
- Nullifies user references in track_outgoing:
  - `employee_id_out`
  - `released_by_id`

**UI**: `user-delete-dialog.tsx`
- Safety checks prevent deleting current user or last admin
- Force delete for users with equipment/tracking records

### 4. Locations
**Controller**: `LocationController@destroy`
**Force Delete Logic**:
- Sets `location_id` to `null` in track_incoming records
- Sets `location_id` to `null` in equipments table

**UI**: `location-delete-dialog.tsx`
- Force delete when tracking records exist
- Shows counts of incoming/outgoing tracking records

### 5. Plants
**Controller**: `PlantController@destroy`
**Force Delete Logic**:
- Sets `plant_id` to `null` in users table
- Sets `plant_id` to `null` in equipments table

**UI**: `plant-delete-dialog.tsx`
- Force delete when users or equipment are assigned
- Shows counts of related users and equipment

## UI Pattern

All delete dialogs follow a consistent pattern:

1. **Normal Delete**: Archive/soft delete when no related records
2. **Warning State**: Yellow warning when related records found
3. **Force Delete Checkbox**: Option to proceed with nullification
4. **Danger State**: Red warning explaining what will be nullified
5. **Dynamic Buttons**: Different text/styling based on force delete state

### Common UI Components:
- `AlertTriangle` icon for warnings
- `Checkbox` for force delete option
- Dynamic dialog titles and descriptions
- Detailed breakdown of affected records
- Loading states during deletion

## Benefits

1. **Data Preservation**: No critical data is lost when force deleting
2. **Clean Database**: Removes orphaned references while keeping historical data
3. **Audit Trail**: Tracking records remain intact for reporting purposes
4. **Flexibility**: Administrators can clean up entities without losing data
5. **Safety**: Clear warnings and confirmations prevent accidental deletions

## Safety Features

1. **Transaction Wrapping**: All operations are wrapped in database transactions
2. **Confirmation Dialogs**: Clear warnings about what will be affected
3. **Visual Indicators**: Shows count of related records before deletion
4. **Rollback Safe**: Migration refresh recreates all constraints properly
5. **User Protection**: Special checks for current user and last admin

## Usage Instructions

1. Navigate to any admin management page (Departments, Users, Equipment, etc.)
2. Click Actions → Delete for any record
3. If record has related data:
   - Warning message will appear
   - Check "Force delete" to proceed with nullification
   - Review the list of affected records
4. Confirm deletion

## Database Schema Impact

### Tables with Nullified Foreign Keys:
- `users`: `department_id`, `plant_id`
- `equipments`: `employee_id`, `department_id`, `plant_id`, `location_id`
- `locations`: `department_id`
- `track_incoming`: `technician_id`, `employee_id_in`, `received_by_id`, `equipment_id`, `location_id`
- `track_outgoing`: `employee_id_out`, `released_by_id`

### Soft Delete Tables:
- `departments`
- `users` 
- `equipments`
- `locations`
- `plants`
- `track_incoming`
- `track_outgoing`

This ensures that even with force delete, records can potentially be restored and re-linked if needed.
