# User Import Documentation

## Overview
The User Import functionality allows administrators to bulk import users from Excel files. The system supports both manual employee ID assignment and automatic generation.

## Employee ID Management

### Manual Employee ID Entry
- **During Import**: Include an `employee_id` column in your Excel file with unique numeric values
- **In the UI**: Use the Employee ID field when creating new users manually
- **Validation**: The system ensures all employee IDs are unique across the platform

### Automatic Employee ID Generation
- **Role-based Prefixes**: 
  - Admin: 100xxx (e.g., 100001, 100002)
  - Technician: 200xxx (e.g., 200001, 200002)
  - Employee: 300xxx (e.g., 300001, 300002)
- **Sequential**: IDs increment automatically based on the highest existing ID for each role

## Excel Template Format

### Required Columns
- `first_name`: User's first name (required)
- `last_name`: User's last name (required)
- `password`: Initial password for the user (required)

### Optional Columns
- `employee_id`: Unique alphanumeric identifier (if empty, will be auto-generated). Supports leading zeros (e.g., 047667)
- `middle_name`: User's middle name
- `email`: Email address (recommended for password reset functionality)
- `role_name`: User role (will be created automatically if it doesn't exist)
- `department_name`: Department name (will be created automatically if it doesn't exist)
- `plant_name`: Plant name (will be created automatically if it doesn't exist)

### Alternative Column Names
The system accepts alternative column headers for flexibility:
- `first_name` or `firstname`
- `last_name` or `lastname`
- `middle_name` or `middlename`
- `password` or `pin`

## Dynamic Record Creation

### Automatic Creation of Missing Records
The import system automatically creates missing relationships to make the process more user-friendly:

- **Roles**: If a role name doesn't exist, it will be created automatically
- **Departments**: If a department name doesn't exist, it will be created automatically  
- **Plants**: If a plant name doesn't exist, it will be created automatically

This means you can import users with new departments, plants, or roles without having to create them separately first.

### Benefits
- **Simplified Import**: No need to pre-create all departments, plants, and roles
- **Bulk Setup**: Create organizational structure and users in one import
- **Error Reduction**: Reduces validation errors from missing references

## Import Process

1. **Download Template**: Get the latest Excel template from the admin panel
2. **Fill Data**: Complete the template with user information
3. **Upload**: Use the import function in the Users admin section
4. **Validation**: The system validates all data before processing
5. **Results**: View import results with success/error details

## Validation Rules

### Employee ID
- Must be unique across all users
- Can contain numeric characters only (leading zeros supported)
- Maximum 20 characters
- Cannot be changed after user creation

### Excel Formatting for Leading Zeros
- **Method 1**: Format the Excel column as "Text" before entering data
- **Method 2**: Prefix the employee ID with an apostrophe (e.g., `'047667`)
- **Method 3**: Use quotes in CSV format (e.g., `"047667"`)

The import system will automatically clean apostrophes and preserve the leading zeros.

### Email
- Must be valid email format
- Must be unique if provided
- Disposable/temporary emails are flagged

### Role, Department, Plant
- Will be created automatically if they don't exist
- Can be specified by name or ID (if using existing records)
- New records are created with minimal required information (just the name)

## Error Handling

### Duplicate Detection
- **Email**: Users with existing emails are skipped
- **Employee ID**: Users with existing employee IDs are skipped
- **Validation Errors**: Detailed error messages are provided for correction

### Import Results
The system provides detailed feedback including:
- Number of users successfully imported
- Number of users skipped (duplicates)
- Specific validation errors for failed rows

## Best Practices

1. **Backup**: Always backup existing user data before large imports
2. **Test**: Import a small batch first to verify data format
3. **Unique IDs**: Ensure employee IDs are unique and follow company standards
4. **Consistent Naming**: Use consistent naming for departments, plants, and roles to avoid duplicates
5. **Password Policy**: Use secure passwords that meet company requirements
6. **Review New Records**: Check auto-created departments, plants, and roles after import

## Troubleshooting

### Common Issues
- **"Employee ID already exists"**: Check for duplicate IDs in your file or existing users
- **"Email already exists"**: Remove duplicate emails or use unique addresses
- **Invalid data format**: Ensure role_name, department_name, and plant_name are text values

### Support
For technical support or questions about the import process, contact your system administrator.
