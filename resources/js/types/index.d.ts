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
    users?: User[];
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
    address: string | null;
    telephone: string | null;
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
    recall_number: string;
    serial_number?: string | null;
    description: string;
    model?: string | null;
    manufacturer?: string | null;
    plant_id?: number | null;
    department_id?: number | null;
    location_id?: number | null;
    status: 'active' | 'inactive' | 'pending_calibration' | 'in_calibration' | 'retired';
    last_calibration_date?: string | null;
    next_calibration_due?: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    plant?: Plant;
    department?: Department;
    location?: Location;
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

// New Track Incoming interface (calibration requests)
export interface TrackIncoming {
    id: number;
    recall_number: string;
    description: string;
    equipment_id: number;
    technician_id: number;
    location_id: number;
    received_by: number;
    serial_number?: string | null;
    model?: string | null;
    manufacturer?: string | null;
    date_in: string;
    due_date: string;
    status: 'pending_calibration' | 'calibration_in_progress';
    notes?: string | null;
    created_at: string;
    updated_at: string;
    equipment?: Equipment;
    technician?: User;
    location?: Location;
    employee_in?: User;
    track_outgoing?: TrackOutgoing;
}

// New Track Outgoing interface (calibration completions)
export interface TrackOutgoing {
    id: number;
    recall_number: string;
    cal_date: string;
    cal_due_date: string;
    date_out: string;
    employee_out: number;
    certificate_number?: string | null;
    cycle_time?: number | null;
    status: 'ready_for_pickup' | 'completed';
    notes?: string | null;
    created_at: string;
    updated_at: string;
    track_incoming?: TrackIncoming;
    employee_out_user?: User;
    equipment?: Equipment; // Available through hasOneThrough relationship
    technician?: User; // Available through hasOneThrough relationship
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

// Tracking types
export interface TrackingFormData {
    equipment_id: string;
    technician_id: string;
    location_id: string;
    cal_date: string;
    cal_due_date: string;
    description: string;
    recall_number: string;
    is_new_registration: boolean;
    serial_number: string;
    model: string;
    manufacturer: string;
    equipment_scan: string;
    employee_scan: string;
}

export interface EquipmentFormData {
    employee_id?: number | null;
    recall_number: string;
    serial_number?: string;
    description: string;
    model?: string;
    manufacturer?: string;
    plant_id?: number | null;
    department_id?: number | null;
    location_id?: number | null;
    status?: 'active' | 'inactive' | 'pending_calibration' | 'in_calibration' | 'retired';
    last_calibration_date?: string | null;
    next_calibration_due?: string | null;
}

export interface DepartmentFormData {
    department_name: string;
    [key: string]: any;
}

export interface LocationFormData {
    location_name: string;
    department_id: number;
}

export interface PlantFormData {
    plant_name: string;
    address?: string;
    telephone?: string;
}

export interface UserFilters {
    search?: string;
    role_id?: number;
    department_id?: number;
}

export interface TrackingFilters {
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
}

