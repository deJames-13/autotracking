import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export function useRole() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const canManageUsers = () => {
        return user.role?.role_name === 'admin';
    };

    const canManageEquipment = () => {
        return ['admin', 'personnel_in_charge'].includes(user.role?.role_name || '');
    };

    const canManagePlants = () => {
        return user.role?.role_name === 'admin';
    };

    const canManageRequestIncoming = () => {
        return ['admin', 'personnel_in_charge'].includes(user.role?.role_name || '');
    };

    const canViewEmployeeTracking = () => {
        return user.role?.role_name === 'employee';
    };

    const canCheckInOut = () => {
        return user.role?.role_name === 'employee';
    };

    const isAdmin = () => {
        return user.role?.role_name === 'admin';
    };

    const isEmployee = () => {
        return user.role?.role_name === 'employee';
    };

    const isPersonnelInCharge = () => {
        return user.role?.role_name === 'personnel_in_charge';
    };

    const isTechnician = () => {
        return user.role?.role_name === 'technician';
    };

    return {
        canManageUsers,
        canManageEquipment,
        canManagePlants,
        canManageRequestIncoming,
        canViewEmployeeTracking,
        canCheckInOut,
        isAdmin,
        isEmployee,
        isPersonnelInCharge,
        isTechnician,
        user,
    };
}
