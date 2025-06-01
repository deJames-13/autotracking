

- [x] Setup Routine Cal
    - [x] Recall number can not be unique to allow archiving of past records
    - [x] Recall number selection with search and auto fill data
- [ ] Cycle time    
    - [ ] Manual inputs for CT Reqd (days) standard 
    - [ ] Manual inputs for Commit and Actual ETCs 
    - [ ] auto calculate queuing days, start to finish
    - [ ] aut calculate overdue
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

