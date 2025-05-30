import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useRole } from '@/hooks/use-role';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    Factory,
    HardDrive,
    LayoutGrid,
    MapPin,
    Users,
    Wrench,
    ArrowDownToLine,
    ArrowUpFromLine,
    Activity,
    Clock,
    AlertTriangle,
    Package,
    CheckCircle,
    LogOut,
    Calendar
} from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { canManageUsers, canManageEquipment, canManagePlants, canManageRequestIncoming, canViewEmployeeTracking } = useRole();

    const dashboardItems: NavItem[] = [
        ...(canManageUsers() ? [
            {
                title: 'Dashboard',
                href: '/admin/dashboard',
                icon: Users,
            },
        ] : [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: Users,
            },
        ]),
    ];

    // Admin tracking items
    const adminTrackingItems: NavItem[] = [
        ...(canManageRequestIncoming() ? [
            {
                title: 'Incoming',
                href: '/admin/tracking',
                icon: ArrowDownToLine,
            },
        ] : [])
    ];

    // Employee tracking items
    const employeeTrackingItems: NavItem[] = [
        ...(canViewEmployeeTracking() ? [
            {
                title: 'My Equipment',
                href: '/employee/tracking',
                icon: Package,
            },
            {
                title: 'Request Calibration',
                href: '/employee/tracking/request',
                icon: Calendar,
            },
        ] : [])
    ];

    const manageItems: NavItem[] = [
        ...(canManageEquipment() ? [
            {
                title: 'Equipment',
                href: '/admin/equipment',
                icon: Wrench,
            }
        ] : []),
        ...(canManageUsers() ? [
            {
                title: 'User',
                href: '/admin/users',
                icon: Users,
            },
            {
                title: 'Department',
                href: '/admin/departments',
                icon: Building2,
            },
            {
                title: 'Location',
                href: '/admin/locations',
                icon: MapPin,
            }
        ] : []),
        ...(canManagePlants() ? [
            {
                title: 'Plant',
                href: '/admin/plants',
                icon: Factory,
            }
        ] : [])
    ];


    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className='bg-background hover:bg-background/30'>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>  
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={dashboardItems} label="Main"/>
                {adminTrackingItems.length > 0 && (
                    <NavMain items={adminTrackingItems} label="Tracking" />
                )}
                {employeeTrackingItems.length > 0 && (
                    <NavMain items={employeeTrackingItems} label="Equipment" />
                )}
                {manageItems.length > 0 && (
                    <NavMain items={manageItems} label="Manage" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <Separator />
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
