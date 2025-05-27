import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useRole } from '@/hooks/use-role';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Building2, HardDrive, LayoutGrid, MapPin, Users } from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { canManageUsers, canManageEquipment } = useRole();

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
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
        ...(canManageEquipment() ? [
            {
                title: 'Equipment',
                href: '/admin/equipment',
                icon: HardDrive,
            }
        ] : []),
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
