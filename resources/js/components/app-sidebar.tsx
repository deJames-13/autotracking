import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useRole } from '@/hooks/use-role';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Building2, Factory, HardDrive, LayoutGrid, MapPin, Users, Wrench } from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { canManageUsers, canManageEquipment, canManagePlants } = useRole();

    const dashboardItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
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
                <NavMain items={manageItems} label="Manage"/>
            </SidebarContent>

            <SidebarFooter>
                <Separator />
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
