import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export function useAuth() {
    const { auth } = usePage<SharedData>().props;

    return {
        user: auth.user,
        auth,
        isAuthenticated: !!auth.user,
        isAdmin: () => auth.user?.role?.role_name === 'admin',
        isEmployee: () => auth.user?.role?.role_name === 'employee',
        isTechnician: () => auth.user?.role?.role_name === 'technician',
        isPersonnelInCharge: () => false, // Role no longer exists
    };
}
