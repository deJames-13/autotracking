import { Button } from '@/components/ui/button';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { useRole } from '@/hooks/use-role';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    trackingStats?: {
        activeRequests: number;
        equipmentTracked: number;
        recentUpdates: number;
    };
}

export default function Dashboard({ trackingStats = { activeRequests: 0, equipmentTracked: 0, recentUpdates: 0 } }: DashboardProps) {
    const { isAdmin, isEmployee } = useRole();

    useEffect(() => {
        // Redirect based on user role
        if (isAdmin()) {
            router.visit(route('admin.dashboard'));
        } else if (isEmployee()) {
            router.visit(route('employee.tracking.index'));
        }
        // If neither admin nor employee, stay on this page (fallback)
    }, [isAdmin, isEmployee]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Tracking Overview Section */}
                <div className="border-border rounded-md border p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Tracking Overview</h2>
                        <Button asChild>
                            {isEmployee ? (
                                <Link href={route('employee.tracking.request.index')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Request
                                </Link>
                            ) : (
                                <Link href={route('admin.tracking.request.index')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Request
                                </Link>
                            )}
                        </Button>
                    </div>

                    {/* Dashboard metrics */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="bg-card rounded-lg border p-4">
                            <h3 className="mb-2 font-medium">Active Tracking Requests</h3>
                            <div className="text-2xl font-bold">{trackingStats.activeRequests}</div>
                        </div>
                        <div className="bg-card rounded-lg border p-4">
                            <h3 className="mb-2 font-medium">Equipment Being Tracked</h3>
                            <div className="text-2xl font-bold">{trackingStats.equipmentTracked}</div>
                        </div>
                        <div className="bg-card rounded-lg border p-4">
                            <h3 className="mb-2 font-medium">Recent Updates</h3>
                            <div className="text-2xl font-bold">{trackingStats.recentUpdates}</div>
                        </div>
                    </div>

                    <div className="mt-4 text-right">
                        {isEmployee ? (
                            <Button variant="outline" asChild>
                                <Link href={route('employee.tracking.index')}>View All Tracking Requests</Link>
                            </Button>
                        ) : (
                            <Button variant="outline" asChild>
                                <Link href={route('admin.tracking.index')}>View Tracking Overview</Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
