import { z } from 'zod';

// Equipment schema
export const equipmentSchema = z
    .object({
        employee_id: z.union([z.string(), z.number()]).nullable().optional(),
        recall_number: z.string().min(1, 'Recall number is required').max(255, 'Recall number must be less than 255 characters'),
        serial_number: z.string().max(255, 'Serial number must be less than 255 characters').optional().or(z.literal('')),
        description: z.string().min(1, 'Description is required'),
        model: z.string().max(255, 'Model must be less than 255 characters').optional().or(z.literal('')),
        manufacturer: z.string().max(255, 'Manufacturer must be less than 255 characters').optional().or(z.literal('')),
        plant_id: z.union([z.string(), z.number()]).nullable().optional(),
        department_id: z.union([z.string(), z.number()]).nullable().optional(),
        location_id: z.union([z.string(), z.number()]).nullable().optional(),
        status: z.enum(['active', 'inactive', 'pending_calibration', 'in_calibration', 'retired']).optional().default('active'),
        last_calibration_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)')
            .optional()
            .or(z.literal('')),
        next_calibration_due: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)')
            .optional()
            .or(z.literal('')),
        process_req_range_start: z.string().optional().default(''),
        process_req_range_end: z.string().optional().default(''),
        process_req_range: z.string().max(500, 'Process requirement range must be less than 500 characters').optional().default(''),
    })
    .refine(
        (data) => {
            // If both calibration dates are provided, next_calibration_due should be after last_calibration_date
            if (data.last_calibration_date && data.next_calibration_due && data.last_calibration_date !== '' && data.next_calibration_due !== '') {
                return new Date(data.next_calibration_due) > new Date(data.last_calibration_date);
            }
            return true;
        },
        {
            message: 'Next calibration due date must be after last calibration date',
            path: ['next_calibration_due'],
        },
    );

// Equipment form schema for client-side validation (with string types for form inputs)
export const equipmentFormSchema = z
    .object({
        employee_id: z.string().optional().default(''),
        recall_number: z.string().min(1, 'Recall number is required').max(255, 'Recall number must be less than 255 characters'),
        serial_number: z.string().max(255, 'Serial number must be less than 255 characters').optional().default(''),
        description: z.string().min(1, 'Description is required'),
        model: z.string().max(255, 'Model must be less than 255 characters').optional().default(''),
        manufacturer: z.string().max(255, 'Manufacturer must be less than 255 characters').optional().default(''),
        plant_id: z.string().optional().default(''),
        department_id: z.string().optional().default(''),
        location_id: z.string().optional().default(''),
        status: z.enum(['active', 'inactive', 'pending_calibration', 'in_calibration', 'retired']).optional().default('active'),
        last_calibration_date: z.string().optional().default(''),
        next_calibration_due: z.string().optional().default(''),
        process_req_range_start: z.string().optional().default(''),
        process_req_range_end: z.string().optional().default(''),
        process_req_range: z.string().max(500, 'Process requirement range must be less than 500 characters').optional().default(''),
    })
    .refine(
        (data) => {
            // Validate date formats if provided
            if (data.last_calibration_date && data.last_calibration_date !== '') {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(data.last_calibration_date)) {
                    return false;
                }
            }
            if (data.next_calibration_due && data.next_calibration_due !== '') {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(data.next_calibration_due)) {
                    return false;
                }
            }
            return true;
        },
        {
            message: 'Invalid date format (YYYY-MM-DD required)',
            path: ['last_calibration_date', 'next_calibration_due'],
        },
    )
    .refine(
        (data) => {
            // If both calibration dates are provided, next_calibration_due should be after last_calibration_date
            if (data.last_calibration_date && data.next_calibration_due && data.last_calibration_date !== '' && data.next_calibration_due !== '') {
                return new Date(data.next_calibration_due) > new Date(data.last_calibration_date);
            }
            return true;
        },
        {
            message: 'Next calibration due date must be after last calibration date',
            path: ['next_calibration_due'],
        },
    );

// Employee equipment request schema (for calibration requests)
export const employeeEquipmentRequestSchema = z.object({
    recallNumber: z.string().min(1, 'Recall number is required').max(255, 'Recall number must be less than 255 characters'),
    description: z.string().min(1, 'Equipment description is required'),
    serialNumber: z.string().max(255, 'Serial number must be less than 255 characters').optional().default(''),
    model: z.string().max(255, 'Model must be less than 255 characters').optional().default(''),
    manufacturer: z.string().max(255, 'Manufacturer must be less than 255 characters').optional().default(''),
    plant: z.string().min(1, 'Plant is required'),
    department: z.string().min(1, 'Department is required'),
    location: z.string().optional().nullable(),
});

// Export the types from the schemas
export type EquipmentSchema = z.infer<typeof equipmentSchema>;
export type EquipmentFormSchema = z.infer<typeof equipmentFormSchema>;
export type EmployeeEquipmentRequestSchema = z.infer<typeof employeeEquipmentRequestSchema>;
