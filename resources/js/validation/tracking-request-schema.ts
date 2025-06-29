import { z } from 'zod';

// Technician schema
export const technicianSchema = z.object({
    id: z.string().min(1, 'Technician ID is required'),
    name: z.string().min(1, 'Technician name is required'),
    department: z.string().min(1, 'Department is required'),
    specialization: z.string().min(1, 'Specialization is required'),
});

// Equipment details schema - updated to match actual usage
export const equipmentSchema = z.object({
    plant: z.union([z.string(), z.number()]).refine((val) => val !== '' && val !== null, {
        message: 'Plant is required',
    }),
    department: z.union([z.string(), z.number()]).refine((val) => val !== '' && val !== null, {
        message: 'Department is required',
    }),
    location: z.union([z.string(), z.number()]).optional().nullable(),
    description: z.string().min(1, 'Description is required'),
    serialNumber: z.string().min(1, 'Serial number is required'),
    // Recall number is optional by default, but will be validated dynamically based on request type
    recallNumber: z.string().optional(),
    model: z.string().optional().default(''),
    manufacturer: z.string().optional().default(''),
    dueDate: z.string().optional().nullable(),
    receivedBy: z.union([z.string(), z.number()]).optional().default(''),
    equipment_id: z.number().nullable().default(null),
    existing: z.boolean().default(false),
    requestType: z.enum(['new', 'routine']).optional(),
    processReqRangeStart: z.string().optional().default(''),
    processReqRangeEnd: z.string().optional().default(''),
    process_req_range: z.string().max(500, 'Process requirement range must be less than 500 characters').optional().default(''),
});

// Dynamic equipment schema that validates recall number based on request type
export const createEquipmentSchema = (requestType?: 'new' | 'routine') => {
    return equipmentSchema.refine(
        (data) => {
            // For routine requests, recall number is required
            if (requestType === 'routine') {
                return data.recallNumber && data.recallNumber.trim().length > 0;
            }
            // For new requests, recall number is optional
            return true;
        },
        {
            message: 'Recall number is required for routine calibration requests',
            path: ['recallNumber'],
        },
    );
};

// Calibration schema
export const calibrationSchema = z
    .object({
        calibrationDate: z.string().min(1, 'Calibration date is required'),
        expectedDueDate: z
            .string()
            .min(1, 'Expected due date is required')
            .refine(
                (val) => {
                    if (!val) return true;
                    return new Date(val) > new Date();
                },
                { message: 'Expected due date must be in the future' },
            ),
        dateOut: z.string().min(1, 'Date out is required'),
    })
    .refine(
        (data) => {
            if (!data.calibrationDate || !data.expectedDueDate) return true;
            return new Date(data.expectedDueDate) > new Date(data.calibrationDate);
        },
        {
            message: 'Expected due date must be after calibration date',
            path: ['expectedDueDate'],
        },
    );

// Employee confirmation schema
export const employeeSchema = z.object({
    employee: z.object({
        id: z.string().min(1, 'Employee ID is required'),
        name: z.string().min(1, 'Employee name is required'),
    }),
    pin: z.string().min(4, 'PIN must be at least 4 digits'),
});

// Complete tracking request schema with dynamic recall number validation
export const createTrackingRequestSchema = (requestType?: 'new' | 'routine') => {
    return z.object({
        technician: technicianSchema,
        equipment: createEquipmentSchema(requestType),
        calibration: calibrationSchema,
        confirmation: employeeSchema,
    });
};

// Default tracking request schema (backward compatibility)
export const trackingRequestSchema = z.object({
    technician: technicianSchema,
    equipment: equipmentSchema,
    calibration: calibrationSchema,
    confirmation: employeeSchema,
});

// Step-specific validation schemas for partial validation during the multi-step form
export const createStepValidationSchemas = (requestType?: 'new' | 'routine') => {
    return {
        technician: z.object({ technician: technicianSchema }),
        details: z.object({ equipment: createEquipmentSchema(requestType) }),
        calibration: z.object({ calibration: calibrationSchema }),
        confirmation: z.object({ confirmation: employeeSchema }),
    };
};

// Default step validation schemas (backward compatibility)
export const stepValidationSchemas = {
    technician: z.object({ technician: technicianSchema }),
    details: z.object({ equipment: equipmentSchema }),
    calibration: z.object({ calibration: calibrationSchema }),
    confirmation: z.object({ confirmation: employeeSchema }),
};

export type TechnicianSchema = z.infer<typeof technicianSchema>;
export type EquipmentSchema = z.infer<typeof equipmentSchema>;
export type CalibrationSchema = z.infer<typeof calibrationSchema>;
export type EmployeeSchema = z.infer<typeof employeeSchema>;
export type TrackingRequestSchema = z.infer<typeof trackingRequestSchema>;

// Type for dynamic schema
export type DynamicTrackingRequestSchema = z.infer<ReturnType<typeof createTrackingRequestSchema>>;
