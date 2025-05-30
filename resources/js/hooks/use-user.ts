import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export function useUser() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const getFullName = () => {
        return user.full_name || `${user.first_name} ${user.last_name}`;
    };

    const getInitials = () => {
        const fullName = getFullName();
        const names = fullName.trim().split(' ');

        if (names.length === 0) return '';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();

        const firstInitial = names[0].charAt(0);
        const lastInitial = names[names.length - 1].charAt(0);

        return `${firstInitial}${lastInitial}`.toUpperCase();
    };

    const hasPlant = () => {
        return !!user.plant_id && !!user.plant;
    };

    const hasDepartment = () => {
        return !!user.department_id && !!user.department;
    };

    const isProfileComplete = () => {
        return !!(user.first_name && user.last_name && user.email && user.role_id);
    };

    return {
        user,
        auth,
        getFullName,
        getInitials,
        hasPlant,
        hasDepartment,
        isProfileComplete,
    };
}
