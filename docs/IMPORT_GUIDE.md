# Import Guide

This guide explains how to use the import functionality for entities in the AutoTracking system.

## Supported Entities

The following entities support import via Excel/CSV files:
- Users
- Equipment  
- Departments
- Locations
- Plants

## Import Features

### Name-Based Relationships
Instead of using numeric IDs, you can use human-readable names for relationships:

- **Users**: Use `role_name`, `department_name`, `plant_name` instead of `role_id`, `department_id`, `plant_id`
- **Equipment**: Use `employee_name`, `plant_name`, `department_name`, `location_name` instead of IDs
- **Locations**: Use `department_name` instead of `department_id`

### Duplicate Handling
The import system automatically handles duplicates by skipping existing records:

- **Users**: Skips if email already exists
- **Equipment**: Skips if recall_number or serial_number already exists
- **Departments**: Skips if department_name already exists
- **Locations**: Skips if location_name already exists
- **Plants**: Skips if plant_name already exists

This allows you to safely re-import files without creating duplicates.

### Template Download
Each entity page has a "Download Template" button that provides:
- Correct column headers using name fields
- Sample data showing the expected format
- Proper Excel/CSV format for import

## Import Process

1. **Download Template**: Click "Download Template" to get the correct format
2. **Fill Data**: Complete the Excel/CSV file with your data
3. **Upload File**: Use the "Import" button to upload your file
4. **Review Results**: Check for any errors or successful imports

## Column Mapping

### Users
| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| first_name | First name | Yes | Derick |
| last_name | Last name | Yes | Espinosa |
| middle_name | Middle name | No | E |
| email | Email address | No | derick.espinosa@company.com |
| password | Password | No | password123 |
| role_name | Role name | No | admin |
| department_name | Department name | No | Calibrations |
| plant_name | Plant name | No | P1 |

### Equipment
| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| recall_number | Recall number | No | RN001 |
| serial_number | Serial number | No | CAL-2024-001 |
| description | Equipment description | Yes | Digital Multimeter |
| model | Model | No | Fluke 87V |
| manufacturer | Manufacturer | No | Fluke Corporation |
| employee_name | Employee full name | No | Derick Espinosa |
| plant_name | Plant name | No | P1 |
| department_name | Department name | No | Calibrations |
| location_name | Location name | No | Annex A |
| status | Status | No | active |
| last_calibration_date | Last calibration date | No | 2024-01-15 |
| next_calibration_due | Next calibration due | No | 2025-01-15 |
| process_req_range | Process required range | No | 0-1000V DC/AC |

### Departments
| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| department_name | Department name | Yes | Calibrations |

### Locations
| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| location_name | Location name | Yes | Annex A |
| department_name | Department name | No | Calibrations |

### Plants
| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| plant_name | Plant name | Yes | P1 |
| address | Address | No | 123 Industrial Ave, Plant 1 District, 12345 |
| telephone | Phone number | No | 555-001-0001 |

## Available Values in System

### Roles (for role_name field)
- `admin` - Administrator role
- `employee` - Regular employee role  
- `technician` - Technician role

### Departments (for department_name field)
- `Admin` - Administrative department
- `Calibrations` - Calibration department
- `Tracking` - Tracking department
- `Constructions` - Construction department
- `HR` - Human Resources department
- `Electrical` - Electrical department

### Plants (for plant_name field)
- `P1` - Plant 1 (123 Industrial Ave, Plant 1 District, 12345)
- `P2` - Plant 2 (456 Manufacturing Blvd, Plant 2 District, 23456)
- `P3` - Plant 3 (789 Production Road, Plant 3 District, 34567)

### Locations (for location_name field)
- `Annex A` - Located in Calibrations department
- `Annex B` - Located in Tracking department
- `Building B` - Located in Constructions department
- `Building A Floor 2` - Located in HR department
- `Building B Basement` - Located in Electrical department

### Equipment Status Values
- `active` - Equipment is active and in use
- `inactive` - Equipment is inactive
- `pending_calibration` - Equipment is pending calibration
- `in_calibration` - Equipment is currently being calibrated
- `retired` - Equipment has been retired

## Validation Rules

### General
- Empty rows are automatically skipped
- Required fields must have values
- Names used for relationships must exist in the system
- **Duplicate records are automatically skipped** instead of causing errors

### Specific Rules
- **Email**: Must be valid (unique constraint handled by skipping duplicates)
- **Recall/Serial Numbers**: Duplicate equipment is skipped based on these identifiers
- **Status**: Must be one of: active, inactive, pending_calibration, in_calibration, retired (for equipment)
- **Dates**: Must be in valid date format (YYYY-MM-DD recommended)
- **Names**: Must exactly match existing names in the system

## Error Handling

If import fails:
1. Check the error messages displayed
2. Verify that relationship names exist in the system
3. Ensure required fields are filled
4. Check data format matches expectations
5. Download a fresh template if needed

## Best Practices

1. **Use Templates**: Always start with the downloaded template
2. **Test Small Batches**: Import a few records first to verify format
3. **Check Relationships**: Ensure referenced names (roles, departments, etc.) exist
4. **Don't Worry About Duplicates**: The system will automatically skip existing records
5. **Review Results**: Check the success message to see how many records were imported vs skipped
6. **Re-import Safely**: You can re-import the same file multiple times without creating duplicates

## Fallback Support

The system supports both name-based and ID-based imports:
- If both `role_name` and `role_id` are provided, `role_name` takes precedence
- If only `role_id` is provided, it will be used directly
- This allows migration from old ID-based templates

## Batch Processing

- Imports are processed in batches of 100 records
- Large files are automatically chunked for better performance
- Progress is shown during upload process
