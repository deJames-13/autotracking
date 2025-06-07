import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Bell,
    Home,
    LogOut,
    Menu,
    Package,
    Search,
    Settings,
    FileText,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';
import { useRole } from '@/hooks/use-role';

interface TechnicianLayoutProps {
    children: React.ReactNode;
    header?: React.ReactNode;
}

const TechnicianLayout: React.FC<TechnicianLayoutProps> = ({ children, header }) => {
    const { auth } = usePage<SharedData>().props;
    const { user } = useRole();
    const [searchQuery, setSearchQuery] = useState('');

    const navigation = [
        {
            name: 'Dashboard',
            href: route('technician.tracking.index'),
            icon: Home,
            current: route().current('technician.tracking.index')
        },
        {
            name: 'New Request',
            href: route('technician.tracking.request.index'),
            icon: FileText,
            current: route().current('technician.tracking.request.*')
        },
        {
            name: 'Incoming Equipment',
            href: route('technician.tracking.incoming.index'),
            icon: Package,
            current: route().current('technician.tracking.incoming.*')
        },
        {
            name: 'Outgoing Equipment',
            href: route('technician.tracking.outgoing.index'),
            icon: TrendingUp,
            current: route().current('technician.tracking.outgoing.*')
        }
    ];

    const handleLogout = () => {
        window.location.href = route('logout');
    };

    const NavigationItems = () => (
        <nav className="grid items-start px-4 text-sm font-medium">
            {navigation.map((item) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            item.current && "bg-muted text-primary"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            {/* Sidebar for large screens */}
            <div className="hidden border-r bg-muted/40 lg:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-[60px] items-center border-b px-6">
                        <Link href={route('technician.tracking.index')} className="flex items-center gap-2 font-semibold">
                            <Package className="h-6 w-6" />
                            <span>Technician Portal</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <NavigationItems />
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                {/* Top navigation */}
                <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <nav className="grid gap-2 text-lg font-medium">
                                <Link
                                    href={route('technician.tracking.index')}
                                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                                >
                                    <Package className="h-6 w-6" />
                                    <span>Technician Portal</span>
                                </Link>
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                                                item.current && "bg-muted text-foreground"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </SheetContent>
                    </Sheet>

                    <div className="w-full flex-1">
                        <form>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search equipment, recall numbers..."
                                    className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>
                    </div>

                    <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                        <Bell className="h-4 w-4" />
                        <span className="sr-only">Toggle notifications</span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" alt={user?.full_name || 'User'} />
                                    <AvatarFallback>
                                        {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user?.first_name} {user?.last_name}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        ID: {user?.employee_id} • {user?.role?.role_name}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Main content */}
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                    {header}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default TechnicianLayout;
