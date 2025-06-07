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
        return ['admin', 'personnel_in_charge', 'technician'].includes(user.role?.role_name || '');
    };

    const canViewEmployeeTracking = () => {
        return user.role?.role_name !== 'admin';
    };

    const canCheckInOut = () => {
        return user.role?.role_name !== 'employee';
    };

    const canSubmitCalibrationRequest = () => {
        return ['employee', 'technician', 'admin'].includes(user.role?.role_name || '');
    };

    const canAccessAdminRoutes = () => {
        return ['admin', 'technician'].includes(user.role?.role_name || '');
    };

    const canOnlySeeOwnRecords = () => {
        return user.role?.role_name === 'technician';
    };

    const canApproveRequests = () => {
        return ['admin', 'technician'].includes(user.role?.role_name || '');
    };

    const canManageOutgoing = () => {
        return ['admin', 'technician'].includes(user.role?.role_name || '');
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
        canSubmitCalibrationRequest,
        canAccessAdminRoutes,
        canOnlySeeOwnRecords,
        canApproveRequests,
        canManageOutgoing,
        isAdmin,
        isEmployee,
        isPersonnelInCharge,
        isTechnician,
        user,
        auth,
    };
}
