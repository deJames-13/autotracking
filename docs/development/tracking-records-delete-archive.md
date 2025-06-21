# Tracking Records Delete/Archive Feature

## Overview
Implemented admin-only delete and archive functionality for incoming and outgoing tracking records.

## Features Implemented

### 1. **TrackIncomingController** (`/app/Http/Controllers/Api/TrackIncomingController.php`)

#### Enhanced `destroy` Method:
- **Admin-only access**: Only users with role `admin` can delete records
- **Soft delete by default**: Records are archived (soft deleted) unless force delete is specified
- **Force delete capability**: When `force=true` parameter is passed:
  - Deletes all related `track_outgoing` records first
  - Then permanently deletes the incoming record
- **Relationship validation**: Prevents archiving if related outgoing records exist (without force)

#### New Methods:
- **`restore($id)`**: Restore soft-deleted incoming records (admin only)
- **`archived()`**: List all archived incoming records with search and pagination (admin only)

### 2. **TrackOutgoingController** (`/app/Http/Controllers/Api/TrackOutgoingController.php`)

#### Enhanced `destroy` Method:
- **Admin-only access**: Only users with role `admin` can delete records  
- **Soft delete by default**: Records are archived unless force delete is specified
- **Force delete capability**: When `force=true` parameter is passed, permanently deletes the record

#### New Methods:
- **`restore($id)`**: Restore soft-deleted outgoing records (admin only)
- **`archived()`**: List all archived outgoing records with search and pagination (admin only)

## API Endpoints

### Existing Enhanced Endpoints:
- `DELETE /api/v1/track-incoming/{id}` - Archive/delete incoming record
- `DELETE /api/v1/track-outgoing/{id}` - Archive/delete outgoing record

### New Endpoints:
- `GET /api/v1/track-incoming/archived` - List archived incoming records (admin only)
- `POST /api/v1/track-incoming/{id}/restore` - Restore archived incoming record (admin only)  
- `GET /api/v1/track-outgoing/archived` - List archived outgoing records (admin only)
- `POST /api/v1/track-outgoing/{id}/restore` - Restore archived outgoing record (admin only)

## Usage Examples

### Archive a Record (Soft Delete):
```bash
DELETE /api/v1/track-incoming/123
```

### Force Delete a Record:
```bash
DELETE /api/v1/track-incoming/123?force=true
```

### List Archived Records:
```bash
GET /api/v1/track-incoming/archived?search=equipment&per_page=20
```

### Restore an Archived Record:
```bash
POST /api/v1/track-incoming/123/restore
```

## Authorization

- **Archive/Delete**: Admin role required
- **Restore**: Admin role required  
- **View Archived**: Admin role required
- **Regular Users**: Cannot access any delete/archive functionality

## Data Safety

### Incoming Records:
- **Soft Delete**: Safe archiving that preserves related outgoing records
- **Force Delete**: Permanently removes incoming record AND all related outgoing records
- **Validation**: Prevents archiving when outgoing records exist (unless force delete)

### Outgoing Records:
- **Soft Delete**: Safe archiving with no dependencies
- **Force Delete**: Permanent removal
- **No Dependencies**: Outgoing records can be safely archived/deleted without cascading effects

## Error Handling

- **403 Unauthorized**: Non-admin users get clear error messages
- **422 Validation Error**: When attempting to archive records with dependencies
- **404 Not Found**: When trying to restore non-existent archived records
- **Transaction Safety**: Force deletes use database transactions for data consistency

## Database Schema

Both `track_incoming` and `track_outgoing` tables already have:
- `deleted_at` column for soft deletes (SoftDeletes trait)
- Proper foreign key relationships
- Cascade delete configured for outgoing → incoming relationship

This implementation provides a robust, admin-controlled system for managing tracking record lifecycle while maintaining data integrity and providing clear audit trails through soft deletes.
