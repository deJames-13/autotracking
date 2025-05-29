import { z } from "zod";

// Technician schema
export const technicianSchema = z.object({
    id: z.string().min(1, "Technician ID is required"),
    name: z.string().min(1, "Technician name is required"),
    department: z.string().min(1, "Department is required"),
    specialization: z.string().min(1, "Specialization is required"),
});

// Equipment details schema
export const equipmentSchema = z.object({
    plant: z.string().min(1, "Plant is required"),
    department: z.string().min(1, "Department is required"),
    location: z.string().min(1, "Location is required"),
    description: z.string().min(1, "Equipment description is required"),
    serialNumber: z.string().min(1, "Department is required"),
    model: z.string().optional(),
    manufacturer: z.string().optional(),
});

// Calibration schema
export const calibrationSchema = z.object({
    calibrationDate: z.string().min(1, "Calibration date is required"),
    expectedDueDate: z.string().min(1, "Expected due date is required")
        .refine(
            (val) => {
                if (!val) return true;
                return new Date(val) > new Date();
            },
            { message: "Expected due date must be in the future" }
        ),
    dateOut: z.string().min(1, "Date out is required"),
}).refine(
    (data) => {
        if (!data.calibrationDate || !data.expectedDueDate) return true;
        return new Date(data.expectedDueDate) > new Date(data.calibrationDate);
    },
    {
        message: "Expected due date must be after calibration date",
        path: ["expectedDueDate"]
    }
);

// Employee confirmation schema
export const employeeSchema = z.object({
    employee: z.object({
        id: z.string().min(1, "Employee ID is required"),
        name: z.string().min(1, "Employee name is required"),
    }),
    pin: z.string().min(4, "PIN must be at least 4 digits"),
});

// Complete tracking request schema
export const trackingRequestSchema = z.object({
    technician: technicianSchema,
    equipment: equipmentSchema,
    calibration: calibrationSchema,
    confirmation: employeeSchema,
});

// Step-specific validation schemas for partial validation during the multi-step form
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
