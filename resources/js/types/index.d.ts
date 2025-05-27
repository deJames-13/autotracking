import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    employee_id: number;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    full_name?: string;
    avatar?: string | undefined;
    email: string;
    password?: string;
    role_id: number;
    department_id?: number | null;
    plant_id?: number | null;
    email_verified_at: string | null;
    remember_token?: string | null;
    created_at: string;
    updated_at: string;
    role?: Role;
    department?: Department;
    plant?: Plant;
    equipments?: Equipment[];
}

export interface Role {
    role_id: number;
    role_name: string;
    created_at: string;
    updated_at: string;
}

export interface Department {
    department_id: number;
    department_name: string;
    created_at: string;
    updated_at: string;
    users?: User[];
    locations?: Location[];
}

export interface Plant {
    plant_id: number;
    plant_name: string;
    created_at: string;
    updated_at: string;
    users?: User[];
}

export interface Location {
    location_id: number;
    location_name: string;
    department_id?: number | null;
    created_at: string;
    updated_at: string;
    department?: Department;
    tracking_records?: TrackingRecord[];
}

export interface Equipment {
    equipment_id: number;
    employee_id?: number | null;
    serial_number: string;
    description: string;
    manufacturer: string;
    created_at: string;
    updated_at: string;
    user?: User;
    tracking_records?: TrackingRecord[];
}

export interface TrackingRecord {
    tracking_id: number;
    recall: boolean;
    description: string;
    equipment_id: number;
    technician_id: number;
    location_id: number;
    due_date: string;
    date_in: string;
    employee_id_in: number;
    cal_date: string;
    cal_due_date: string;
    date_out?: string | null;
    employee_id_out?: number | null;
    cycle_time: number;
    created_at: string;
    updated_at: string;
    equipment?: Equipment;
    technician?: User;
    location?: Location;
    employeeIn?: User;
    employeeOut?: User;
}

// Pagination types
export interface PaginationData<T> {
    data: T[];
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
}

// Form types
export interface UserFormData {
    first_name: string;
    last_name: string;
    middle_name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    role_id: number;
    department_id?: number;
    plant_id?: number;
    avatar?: string;
}
