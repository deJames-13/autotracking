
-- TODO

- [ ] fix Equipment crud 
- [ ] fix delete/archiving
- [ ] enable equipment crud for employee
- [ ] enable manual input for recall number for requests (admin/employee)

- [ ] Scan in ougoing show not working
- [ ] Scan not working on equipment
- [ ] Barcode format on employee, equipment, recall show incoming - outgoing


- [ ] Latest modified on top
- [ ] Update email notification
- [ ] Refresh error on crud pages


- [ ] Imports
    - [ ] batch user imports
    - [ ] batch department
    - [ ] batch plant
    - [ ] batch locations


- [ ] Table paginated/filters (turn to datatable)  
    - [x] user
    - [x] equipment

    - [ ] incoming
    - [ ] outgoing
        - [x] remove export button
-- Creds
100001 - admin
200001 - technician
200002 - technician
300001 - employee
300002 - employee


-- TESTING
- [x] Cycle time    
    - [x] Manual inputs for CT Reqd (days) standard 
    - [x] Manual inputs for Commit and Actual ETCs 
    - [x] auto calculate queuing days, start to finish
    - [x] auto calculate overdue

- [x] Incoming Request Revision
    - [x] Received By not working properly when changing from select
    - [x] Recall number should be after calibration
        - [x] Recall number auto generates when not specified
        - [x] allow editing of recall number


- [x] Accounts
    - [x] Manual input or auto generated of id (unique)
    - [x] On user creation, email user with their employee id and pin
    - [x] Admin can reset password immediately, email automatically on change  

- [x] Bar Code downloadables


- [x] Equipment
    - [x] process requirement range (start - end) (for new items) in request detail-tab

- [x] Roles
    - [x] Admin
        - [x] Can see all
        - [x] Can for accept (no pin needed)

    - [x] Technician
        - [x] Can only see theyre own incoming, calibration, outgoing, 
        
    - [x] Employee
        - [x] Can only see theyre own incoming and outgoing


- [x] Setup Routine Cal
    - [x] Recall number can not be unique to allow archiving of past records
    - [x] Recall number selection with search and auto fill data
- [x] Generate BarCode for equipment, employee id


- [x] TO DO FIX Outgoing Confirmation -  From Pop Up to show.tsx
- [x] TO DO FIX Confirmation Button not redirecting to intened route

- Setup MVRCs - Model Controller Routes Views
    - [x] Roles 
        - [x] Technician
        - [x] Employee
        - [x] Person In Charge
        - [x] Admin
    - [x] Equipments
    - [x] Tracking Record
        - [x] Incoming
        - [x] Outgoing
        - [x] Cycles


- Setup required Packages
    - [x] barryvdh/laravel-dompdf
    - [x] maatwebsite/excel



Admin / Person In Charge
- [x] Go to admin page
- Auth Page
    - [x] Verified Email
    - [x] Password

- [x] Reports
- Tracking
    - 
- [x] Managements

Employee Process
- Go to website
- Auth Page 
    - Employee ID instead of email for employees
    - PIN (Personal Identification Number / Password alternative)
- Single Page Layout for easy access
    - Profile SideBar (Basic info for employee role base on #users database)
    - Content Section 
        - Tabs
            - Technicians Assigned (Table of selectable list of technicians) (will direct to incoming if selected to start request process)
            - Incoming (Request for incoming equipment)
            - Calibration (Request for calibration of routine (already registered request/equiment) and newly registered (has no record in database) ) 
            - Outgoing (Request for outgoing of registered equipment)
            - Reports (Table of records - Technician  - Incoming - Outgoing - Cycle Time)

