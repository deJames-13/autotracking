import { z } from "zod";

// Employee technician schema - simplified since they just select a technician
export const employeeTechnicianSchema = z.object({
    employee_id: z.number().min(1, "Please select a technician"),
    first_name: z.string().min(1, "Technician first name is required"),
    last_name: z.string().min(1, "Technician last name is required"),
    full_name: z.string().optional(),
    email: z.string().email().optional(),
});

// Employee equipment schema - same as admin but without some optional fields
export const employeeEquipmentSchema = z.object({
    plant: z.union([z.string(), z.number()]).refine(val => val !== "" && val !== null && val !== 0, {
        message: "Plant is required"
    }),
    department: z.union([z.string(), z.number()]).refine(val => val !== "" && val !== null && val !== 0, {
        message: "Department is required"
    }),
    location: z.union([z.string(), z.number()]).refine(val => val !== "" && val !== null && val !== 0, {
        message: "Location is required"
    }),
    description: z.string().min(1, "Equipment description is required"),
    serialNumber: z.string().min(1, "Serial number is required"),
    recallNumber: z.string().optional(),
    model: z.string().optional().default(''),
    manufacturer: z.string().optional().default(''),
    dueDate: z.string().min(1, "Due date is required")
        .refine(
            (val) => {
                if (!val) return false;
                const dueDate = new Date(val);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return dueDate >= today;
            },
            { message: "Due date must be today or in the future" }
        ),
    receivedBy: z.union([z.string(), z.number()]).optional().default(''),
    equipment_id: z.number().nullable().default(null),
    existing: z.boolean().default(false),
});

// Employee calibration schema - optional for employees
export const employeeCalibrationSchema = z.object({
    calibrationDate: z.string().optional().default(''),
    expectedDueDate: z.string().optional().default(''),
    dateOut: z.string().optional().default('')
}).refine(
    (data) => {
        // If dates are provided, validate them
        if (data.calibrationDate && data.expectedDueDate) {
            return new Date(data.expectedDueDate) > new Date(data.calibrationDate);
        }
        return true;
    },
    {
        message: "Expected due date must be after calibration date",
        path: ["expectedDueDate"]
    }
);

// Complete employee tracking request schema
export const employeeTrackingRequestSchema = z.object({
    technician: employeeTechnicianSchema,
    equipment: employeeEquipmentSchema,
    calibration: employeeCalibrationSchema,
});

// Step-specific validation schemas for employee forms
export const employeeStepValidationSchemas = {
    technician: z.object({ technician: employeeTechnicianSchema }),
    details: z.object({ equipment: employeeEquipmentSchema }),
    summary: z.object({}) // No validation for summary step
};

export type EmployeeTechnicianSchema = z.infer<typeof employeeTechnicianSchema>;
export type EmployeeEquipmentSchema = z.infer<typeof employeeEquipmentSchema>;
export type EmployeeCalibrationSchema = z.infer<typeof employeeCalibrationSchema>;
export type EmployeeTrackingRequestSchema = z.infer<typeof employeeTrackingRequestSchema>;
