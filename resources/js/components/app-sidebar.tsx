import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Separator } from '@/components/ui/separator';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useRole } from '@/hooks/use-role';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Activity, ArrowDownToLine, ArrowUpFromLine, Building2, Factory, MapPin, Plus, Users, Wrench } from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    const { canManageUsers, canManageEquipment, canManagePlants, canManageRequestIncoming, canViewEmployeeTracking } = useRole();

    const dashboardItems: NavItem[] = [
        ...(canManageUsers()
            ? [
                  {
                      title: 'Dashboard',
                      href: '/admin/dashboard',
                      icon: Users,
                  },
              ]
            : [
                  {
                      title: 'Dashboard',
                      href: '/dashboard',
                      icon: Users,
                  },
              ]),
    ];

    // Admin tracking items
    const adminTrackingItems: NavItem[] = [
        ...(canManageRequestIncoming()
            ? [
                  {
                      title: 'Tracking Overview',
                      href: '/admin/tracking',
                      icon: Activity,
                  },
                  {
                      title: 'Incoming Requests',
                      href: '/admin/tracking/incoming',
                      icon: ArrowDownToLine,
                  },
                  {
                      title: 'Outgoing Completions',
                      href: '/admin/tracking/outgoing',
                      icon: ArrowUpFromLine,
                  },
              ]
            : []),
    ];

    // Employee tracking items
    const employeeTrackingItems: NavItem[] = [
        ...(canViewEmployeeTracking()
            ? [
                  {
                      title: 'Equipment Tracking',
                      href: '/employee/tracking',
                      icon: Activity,
                  },
                  {
                      title: 'Submit Request',
                      href: '/employee/tracking/request',
                      icon: Plus,
                  },
                  {
                      title: 'My Requests',
                      href: '/employee/tracking/incoming',
                      icon: ArrowDownToLine,
                  },
                  {
                      title: 'Ready for Pickup',
                      href: '/employee/tracking/outgoing',
                      icon: ArrowUpFromLine,
                  },
              ]
            : []),
    ];

    const manageItems: NavItem[] = [
        ...(canManageEquipment()
            ? [
                  {
                      title: 'Equipment',
                      href: '/admin/equipment',
                      icon: Wrench,
                  },
              ]
            : []),
        ...(canManageUsers()
            ? [
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
                  },
              ]
            : []),
        ...(canManagePlants()
            ? [
                  {
                      title: 'Plant',
                      href: '/admin/plants',
                      icon: Factory,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="bg-background hover:bg-background/30">
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={dashboardItems} label="Main" />
                {adminTrackingItems.length > 0 && <NavMain items={adminTrackingItems} label="Tracking" />}
                {employeeTrackingItems.length > 0 && <NavMain items={employeeTrackingItems} label="Equipment" />}
                {manageItems.length > 0 && <NavMain items={manageItems} label="Manage" />}
            </SidebarContent>

            <SidebarFooter>
                <Separator />
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
