# Employee Tracking System Testing Guide

## 🎯 Overview
This guide provides step-by-step instructions to test the complete employee tracking system implementation.

## 🔧 Prerequisites
1. Database migration applied (status column added to track_outgoing table)
2. Application server running (Laravel + Vite)
3. User accounts with employee roles created
4. Sample equipment data available

## 📋 Test Scenarios

### 1. Employee Request Submission Flow
**Goal**: Test employee can submit equipment requests with auto-filled data

**Steps**:
1. Login as employee user
2. Navigate to **Equipment Tracking** → **Submit Request**
3. Verify employee data is auto-filled in the form
4. Complete equipment details:
   - Plant, Department, Location
   - Description, Serial Number
   - Due Date
5. Submit request
6. Verify status is set to 'for_confirmation'
7. Verify no PIN confirmation step is shown

**Expected Result**: 
- Request created with status 'for_confirmation'
- Employee data auto-populated
- Request appears in "My Requests" section

### 2. Employee Request Management
**Goal**: Test employee can view and edit pending requests

**Steps**:
1. Navigate to **Equipment Tracking** → **My Requests**
2. Verify 'for_confirmation' requests show "Edit" button
3. Click on a pending request to view details
4. Test editing functionality for pending requests
5. Verify confirmed requests are read-only

**Expected Result**:
- Can edit requests with 'for_confirmation' status
- Cannot edit requests after admin confirmation
- Status badges display correctly

### 3. Admin Confirmation Process
**Goal**: Test admin can confirm employee requests

**Steps**:
1. Login as admin user
2. Navigate to **Admin** → **Tracking** → **Incoming**
3. Verify requests with 'for_confirmation' status appear
4. Click "Confirm" button on an employee request
5. Verify status changes to appropriate next status
6. Check that confirmed requests show in admin workflow

**Expected Result**:
- Admin can see employee requests requiring confirmation
- Confirmation button works correctly
- Status transitions properly after confirmation

### 4. Calibration to Pickup Flow
**Goal**: Test admin calibration process and employee pickup

**Steps**:
1. As admin, complete calibration for confirmed request
2. Set calibration date and update status to 'for_pickup'
3. As employee, navigate to **Equipment Tracking** → **Ready for Pickup**
4. Verify equipment appears in pickup list
5. Click on equipment to view pickup details
6. Test pickup confirmation with PIN
7. Verify status changes to 'completed' after pickup

**Expected Result**:
- Equipment appears in employee pickup list when ready
- Pickup confirmation modal works with PIN validation
- Status transitions to 'completed' after successful pickup

### 5. Recalibration Flagging
**Goal**: Test recalibration due date alerts

**Steps**:
1. Create equipment with cal_due_date in the past or near future
2. Navigate to employee outgoing view
3. Verify recalibration alerts appear for due equipment
4. Check alert styling and messaging

**Expected Result**:
- Equipment due for recalibration shows appropriate warnings
- Alert styling is visible and informative

### 6. Navigation and Access Control
**Goal**: Test employee navigation and permissions

**Steps**:
1. Login as employee
2. Verify sidebar shows employee tracking navigation:
   - Equipment Tracking (dashboard)
   - Submit Request
   - My Requests
   - Ready for Pickup
3. Test each navigation link
4. Verify employee cannot access admin-only features

**Expected Result**:
- All employee navigation links work correctly
- Employee interface is properly restricted
- No admin functionality exposed to employees

## 🐛 Common Issues to Check

### Backend Issues
- [ ] Migration applied correctly
- [ ] Routes registered properly  
- [ ] Controllers return correct responses
- [ ] Status transitions work as expected
- [ ] Auto-filled employee data functions

### Frontend Issues
- [ ] Component imports work correctly
- [ ] Navigation links point to correct routes
- [ ] Status badges display properly
- [ ] Forms submit correctly
- [ ] Toast notifications appear

### Database Issues
- [ ] Status enum values accepted
- [ ] Foreign key relationships intact
- [ ] Data validation working

## 🔍 Validation Checklist

After completing all test scenarios:

- [ ] Employee can submit requests without PIN
- [ ] Employee data auto-fills correctly
- [ ] Admin confirmation workflow functions
- [ ] Pickup process works end-to-end
- [ ] Status transitions happen correctly
- [ ] Recalibration alerts appear when due
- [ ] Navigation works for all user types
- [ ] Access control properly restricts functionality

## 📊 Success Criteria

The implementation is successful when:
1. Complete flow from employee request to pickup works
2. Admin confirmation process integrates smoothly
3. Status management functions correctly
4. Employee and admin interfaces work without errors
5. All navigation links and features are accessible

## 🚀 Next Steps

After successful testing:
1. Document any issues found and fixes needed
2. Create user training materials
3. Plan deployment strategy
4. Set up monitoring for the new features

---
*Generated: June 1, 2025*
