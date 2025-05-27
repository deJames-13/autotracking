import { type SharedData, type User } from '@/types';
import { usePage } from '@inertiajs/react';

export function useRole() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const hasRole = (roleName: string | string[]): boolean => {
        if (!user) {
            console.warn('No authenticated user found');
            return false;
        }

        if (!user.role) {
            console.warn('User role not loaded. Make sure role relationship is eager loaded for authenticated user.');
            console.warn('User data:', { employee_id: user.employee_id, role_id: user.role_id });
            return false;
        }

        const userRole = user.role.role_name;

        if (Array.isArray(roleName)) {
            return roleName.includes(userRole);
        }

        return userRole === roleName;
    };

    const isAdmin = (): boolean => {
        return hasRole('admin');
    };

    const isPersonnelInCharge = (): boolean => {
        return hasRole('personnel_in_charge');
    };

    const isTechnician = (): boolean => {
        return hasRole('technician');
    };

    const isEmployee = (): boolean => {
        return hasRole('employee');
    };

    const canManageUsers = (): boolean => {
        return hasRole(['admin', 'personnel_in_charge']);
    };

    const canManageEquipment = (): boolean => {
        return hasRole(['admin', 'personnel_in_charge', 'technician']);
    };

    const canViewReports = (): boolean => {
        return hasRole(['admin', 'personnel_in_charge']);
    };

    return {
        user,
        hasRole,
        isAdmin,
        isPersonnelInCharge,
        isTechnician,
        isEmployee,
        canManageUsers,
        canManageEquipment,
        canViewReports,
    };
}
