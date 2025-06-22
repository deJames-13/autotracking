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
| first_name | First name | Yes | John |
| last_name | Last name | Yes | Doe |
| middle_name | Middle name | No | M |
| email | Email address | No | john.doe@example.com |
| password | Password | No | password123 |
| role_name | Role name | No | Administrator |
| department_name | Department name | No | IT Department |
| plant_name | Plant name | No | Main Plant |

### Equipment
| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| recall_number | Recall number | No | RN001 |
| serial_number | Serial number | No | SN123456 |
| description | Equipment description | Yes | Digital Multimeter |
| model | Model | No | DMM-2000 |
| manufacturer | Manufacturer | No | Fluke |
| employee_name | Employee full name | No | John Doe |
| plant_name | Plant name | No | Main Plant |
| department_name | Department name | No | IT Department |
| location_name | Location name | No | Server Room |
| status | Status | No | active |
| last_calibration_date | Last calibration date | No | 2024-01-15 |
| next_calibration_due | Next calibration due | No | 2025-01-15 |
| process_req_range | Process required range | No | 0-1000V |

### Departments
| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| department_name | Department name | Yes | Engineering |

### Locations
| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| location_name | Location name | Yes | Main Lab |
| department_name | Department name | No | Engineering |

### Plants
| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| plant_name | Plant name | Yes | Main Plant |
| address | Address | No | 123 Industrial Ave |
| telephone | Phone number | No | 555-0100 |

## Validation Rules

### General
- Empty rows are automatically skipped
- Required fields must have values
- Names used for relationships must exist in the system

### Specific Rules
- **Email**: Must be valid and unique (for users)
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
4. **Backup Data**: Consider backing up before large imports
5. **Review Validation**: Check all validation messages carefully

## Fallback Support

The system supports both name-based and ID-based imports:
- If both `role_name` and `role_id` are provided, `role_name` takes precedence
- If only `role_id` is provided, it will be used directly
- This allows migration from old ID-based templates

## Batch Processing

- Imports are processed in batches of 100 records
- Large files are automatically chunked for better performance
- Progress is shown during upload process
