# Import Functionality Documentation

This document explains how to use the batch import functionality for the AutoTracking system.

## Overview

The system supports importing data for the following entities:
- Users
- Equipment
- Departments
- Locations
- Plants

## How to Import Data

### Step 1: Access Import Function
1. Navigate to any admin management page (Users, Equipment, Departments, Locations, or Plants)
2. Click the "Import [Entity]" button next to the "Add [Entity]" button

### Step 2: Download Template
1. In the import modal, click "Download" in the Template section
2. This will download an Excel template with the correct column headers
3. Fill in your data following the template format

### Step 3: Upload and Import
1. Select your completed Excel file using the file input
2. Click "Import" to process the file
3. The system will validate and import your data

## Template Formats

### Users Template
Required columns:
- `first_name` (required)
- `last_name` (required)
- `middle_name` (optional)
- `email` (optional, must be unique if provided)
- `password` (optional, defaults to 'default123')
- `role_id` (optional, defaults to 1)
- `department_id` (optional, must exist in departments table)
- `plant_id` (optional, must exist in plants table)

### Equipment Template
Required columns:
- `description` (required)
- `recall_number` (optional)
- `serial_number` (optional)
- `model` (optional)
- `manufacturer` (optional)
- `employee_id` (optional, must exist in users table)
- `plant_id` (optional, must exist in plants table)
- `department_id` (optional, must exist in departments table)
- `location_id` (optional, must exist in locations table)
- `status` (optional, one of: active, inactive, pending_calibration, in_calibration, retired)
- `last_calibration_date` (optional, date format)
- `next_calibration_due` (optional, date format)
- `process_req_range` (optional)

### Departments Template
Required columns:
- `department_name` (required, must be unique)

### Locations Template
Required columns:
- `location_name` (required)
- `department_id` (optional, must exist in departments table)

### Plants Template
Required columns:
- `plant_name` (required, must be unique)
- `address` (optional)
- `telephone` (optional)

## File Requirements

- **File formats**: Excel (.xlsx, .xls) or CSV files
- **File size**: Maximum 10MB
- **Header row**: The first row must contain column headers
- **Batch processing**: Files are processed in batches of 100 rows

## Import Features

### Validation
- Each row is validated according to the entity's rules
- Validation errors are displayed in the modal with specific row numbers
- Import stops if validation fails

### Error Handling
- Detailed error messages for validation failures
- Progress indicator during upload
- Success/failure notifications

### Data Processing
- Empty rows are automatically skipped
- Batch processing for better performance
- Chunk reading for large files

## Tips for Successful Imports

1. **Use the template**: Always start with the downloaded template to ensure correct format
2. **Check relationships**: Ensure foreign key values (like department_id, plant_id) exist in their respective tables
3. **Validate data**: Review your data before importing to avoid validation errors
4. **Start small**: Test with a few rows first before importing large datasets
5. **Backup**: Always backup your data before performing large imports

## Troubleshooting

### Common Issues

**"Validation errors occurred during import"**
- Check that required fields are not empty
- Verify foreign key relationships exist
- Ensure unique fields (like email, department_name) are not duplicated

**"File too large"**
- Split large files into smaller chunks (under 10MB)
- Remove unnecessary columns or data

**"Invalid file type"**
- Use only .xlsx, .xls, or .csv files
- Ensure the file is not corrupted

**"Import failed"**
- Check server logs for detailed error information
- Verify database connectivity
- Ensure sufficient permissions

## Backend Implementation

The import functionality uses Laravel Excel package with the following features:
- `ToModel` concern for converting rows to Eloquent models
- `WithHeadingRow` for header row support
- `WithValidation` for data validation
- `WithBatchInserts` for efficient batch processing
- `WithChunkReading` for memory-efficient processing

## API Endpoints

Each entity has two import-related endpoints:

### Import Data
- **POST** `/admin/{entity}/import`
- **Parameters**: `file` (multipart/form-data)
- **Response**: JSON with success/error status

### Download Template
- **GET** `/admin/{entity}/download-template`
- **Response**: Excel file download

Examples:
- `POST /admin/users/import`
- `GET /admin/users/download-template`
- `POST /admin/equipment/import`
- `GET /admin/equipment/download-template`

## Security Considerations

- File uploads are limited to specific MIME types
- File size is restricted to 10MB maximum
- Validation is performed on all data before import
- Users must have appropriate permissions to access import functionality
