import { z } from 'zod';

// User schema
export const userSchema = z
    .object({
        employee_id: z
            .union([z.string(), z.number()])
            .optional()
            .refine((val) => {
                if (!val) return true; // Optional field
                const str = String(val);
                return /^[0-9]+$/.test(str) && str.length <= 20;
            }, 'Employee ID must contain only numeric characters and be max 20 characters'),
        first_name: z.string().min(1, 'First name is required').max(255, 'First name must be less than 255 characters'),
        last_name: z.string().min(1, 'Last name is required').max(255, 'Last name must be less than 255 characters'),
        middle_name: z.string().optional(),
        email: z.string().email('Invalid email address').optional().or(z.literal('')),
        password: z.string().min(4, 'Password must be at least 4 characters').optional().or(z.literal('')),
        password_confirmation: z.string().optional().or(z.literal('')),
        role_id: z.union([z.string(), z.number()]).refine((val) => !!val, 'Role is required'),
        department_id: z.union([z.string(), z.number()]).optional().nullable(),
        plant_id: z.union([z.string(), z.number()]).optional().nullable(),
        avatar: z.string().optional(),
    })
    .refine(
        (data) => {
            // If password is provided, make sure password_confirmation matches
            if (data.password && data.password !== data.password_confirmation) {
                return false;
            }
            return true;
        },
        {
            message: 'Passwords do not match',
            path: ['password_confirmation'],
        },
    );

// Export the type from the schema
export type UserSchema = z.infer<typeof userSchema>;
