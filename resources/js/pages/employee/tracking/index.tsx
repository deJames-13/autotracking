import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ClipboardList, Clock, Package, PackageCheck } from 'lucide-react';

export default function EmployeeTrackingIndex() {
    return (
        <>
            <Head title="Employee Tracking" />

            <div className="container mx-auto py-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Equipment Tracking</h1>
                    <p className="mt-2 text-gray-600">Manage your equipment calibration requests and track their progress.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Submit New Request */}
                    <Card className="transition-shadow hover:shadow-lg">
                        <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                                <ClipboardList className="h-5 w-5 text-blue-600" />
                                <CardTitle className="text-lg">New Request</CardTitle>
                            </div>
                            <CardDescription>Submit a new equipment calibration request</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={route('employee.tracking.request.index')}>
                                <Button className="w-full">Submit Request</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* View Incoming Requests */}
                    <Card className="transition-shadow hover:shadow-lg">
                        <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                                <Package className="h-5 w-5 text-orange-600" />
                                <CardTitle className="text-lg">My Requests</CardTitle>
                            </div>
                            <CardDescription>View submitted requests and their status</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto">
                            <Link href={route('employee.tracking.incoming.index')}>
                                <Button variant="outline" className="w-full">
                                    View Requests
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* View Outgoing/Completed */}
                    <Card className="transition-shadow hover:shadow-lg">
                        <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                                <PackageCheck className="h-5 w-5 text-green-600" />
                                <CardTitle className="text-lg">Ready for Pickup</CardTitle>
                            </div>
                            <CardDescription>View calibrated equipment ready for pickup</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={route('employee.tracking.outgoing.index')}>
                                <Button variant="outline" className="w-full">
                                    View Completed
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Stats Section */}
                <div className="mt-8">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Overview</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600">Pending Confirmation</CardTitle>
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-gray-600">Awaiting admin confirmation</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600">In Calibration</CardTitle>
                                    <Package className="h-4 w-4 text-blue-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-gray-600">Currently being calibrated</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600">Ready for Pickup</CardTitle>
                                    <PackageCheck className="h-4 w-4 text-green-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-gray-600">Ready to be collected</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600">Due for Recalibration</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-gray-600">Need recalibration soon</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
