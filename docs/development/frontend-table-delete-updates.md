# Frontend Table Updates for Tracking Records Delete/Archive

## Overview
Updated the frontend tables for incoming and outgoing tracking records to include admin-only delete/archive functionality with proper dialogs and confirmations.

## Files Modified

### 1. **Delete Dialog Components Created:**

#### `/resources/js/components/admin/tracking/track-incoming-delete-dialog.tsx`
- **Admin-only delete dialog** for incoming tracking records
- **Force delete capability** with clear warnings about cascading deletions
- **Relationship awareness** - warns when outgoing records exist
- **Visual feedback** with loading states and confirmation checkboxes
- **API integration** with proper error handling and success messages

#### `/resources/js/components/admin/tracking/track-outgoing-delete-dialog.tsx`
- **Admin-only delete dialog** for outgoing tracking records
- **Force delete option** for permanent deletion vs archiving
- **Simple interface** as outgoing records have no dependencies
- **Consistent UI/UX** with incoming dialog patterns

### 2. **Table Components Updated:**

#### `/resources/js/components/admin/tracking/track-incoming-table.tsx`
**Changes:**
- Added `useRole` hook for admin permission checking
- Added `useState` for delete dialog management
- Added `Trash2` icon import for delete actions
- Added delete dialog import
- **Enhanced Actions Column:**
  - Added admin-only "Delete/Archive" option in dropdown menu
  - Red styling for destructive action
  - Proper state management for dialog opening
- **Updated Return JSX:**
  - Wrapped DataTable with fragment to include dialog
  - Added TrackIncomingDeleteDialog component
  - Connected dialog state and refresh functionality

#### `/resources/js/components/admin/tracking/track-outgoing-table.tsx`
**Changes:**
- Added delete dialog state management
- Added `Trash2` icon import
- Added delete dialog import
- **Enhanced Actions Column:**
  - Added admin-only "Delete/Archive" option
  - Consistent styling with incoming table
- **Updated Return JSX:**
  - Added TrackOutgoingDeleteDialog component
  - Proper state management and refresh integration

## Features Implemented

### 🔒 **Security & Authorization**
- **Admin-only access**: Delete options only visible to admin users
- **Role-based UI**: Uses `useRole().isAdmin()` for permission checking
- **Visual indicators**: Red styling for destructive actions

### ⚠️ **Safety Features**
- **Confirmation dialogs**: Require explicit user confirmation
- **Force delete warnings**: Clear messaging about permanent vs archive operations
- **Relationship awareness**: Incoming dialog warns about related outgoing records
- **Loading states**: Prevent double-clicks during API calls

### 🔄 **User Experience**
- **Consistent UI**: Both dialogs follow same design patterns
- **Clear messaging**: Different messages for archive vs permanent delete
- **Immediate feedback**: Toast notifications for success/error states
- **Table refresh**: Automatic refresh after successful operations

### 🛠️ **Technical Implementation**
- **API Integration**: Direct axios calls to delete endpoints
- **Error handling**: Proper 403, 422, and generic error responses
- **State management**: Clean dialog state handling
- **TypeScript safety**: Proper typing for all components

## API Endpoints Used

### **Incoming Records:**
- `DELETE /api/v1/track-incoming/{id}` - Archive incoming record
- `DELETE /api/v1/track-incoming/{id}?force=true` - Force delete with relations

### **Outgoing Records:**
- `DELETE /api/v1/track-outgoing/{id}` - Archive outgoing record  
- `DELETE /api/v1/track-outgoing/{id}?force=true` - Force delete permanently

## Usage Flow

### **For Admin Users:**
1. **View Table** - See all tracking records with actions dropdown
2. **Click Delete/Archive** - Access admin-only option in actions menu
3. **Review Dialog** - See record details and relationship warnings
4. **Choose Operation:**
   - **Archive (default)**: Soft delete that can be restored
   - **Force Delete**: Permanent deletion with cascade for incoming records
5. **Confirm Action** - Explicit confirmation required
6. **See Results** - Toast notification and table refresh

### **For Non-Admin Users:**
- **Delete options hidden** - No access to delete/archive functionality
- **Standard actions only** - View and edit options remain available

## Error Handling

### **Frontend:**
- **403 Unauthorized**: "Only admin users can delete tracking records"
- **422 Validation**: Shows specific validation errors from backend
- **Network errors**: Generic retry message
- **Loading states**: Prevents multiple submissions

### **Backend Integration:**
- **Direct API calls** using axios with proper headers
- **Response handling** for both success and error cases
- **State cleanup** on dialog close or successful operations

## UI/UX Improvements

### **Visual Design:**
- **Red styling** for destructive actions in dropdown
- **Warning colors** (yellow/red) for different alert levels
- **Consistent icons** using Lucide React icons
- **Professional layout** with proper spacing and typography

### **Interaction Design:**
- **Progressive disclosure** - warnings appear based on relationships
- **Confirmation patterns** - checkbox for force delete acknowledgment  
- **Immediate feedback** - loading states and success notifications
- **Escape hatches** - clear cancel options at all stages

This implementation provides a comprehensive, secure, and user-friendly way for admin users to manage the lifecycle of tracking records while maintaining data integrity and providing clear audit trails.
