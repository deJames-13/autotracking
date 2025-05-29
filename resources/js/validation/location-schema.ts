import { z } from "zod";

// Location schema
export const locationSchema = z.object({
    location_name: z.string()
        .min(1, "Location name is required")
        .max(255, "Location name must be less than 255 characters"),
    department_id: z.string()
        .min(1, "Department is required")
});

// Export the type from the schema
export type LocationSchema = z.infer<typeof locationSchema>;
