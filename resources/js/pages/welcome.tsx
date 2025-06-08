import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="AutoTracking System - Calibration Department" />
            <div className="relative min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-[#0a0a0a] dark:to-[#1a1a1a] p-0">
                {/* Header */}
                <header className="w-full flex items-center justify-between px-4 md:px-8 py-4 md:py-6 bg-white/80 dark:bg-[#18181b]/80 shadow-sm z-20">
                    <div className="flex items-center gap-2 md:gap-3">
                        <img src="/logo.png" alt="Logo" className="h-8 md:h-10 w-auto" />
                        <span className="text-xl md:text-2xl font-bold tracking-tight text-blue-900 dark:text-white">AutoTracking</span>
                    </div>
                    <nav className="flex gap-2 md:gap-4">
                        <Link href={route('login')} className="text-sm md:text-base text-blue-700 font-semibold hover:underline">Login</Link>
                        <Link href={route('admin.login')} className="text-sm md:text-base text-blue-700 font-semibold hover:underline">Admin</Link>
                    </nav>
                </header>

                {/* Hero Section */}
                <section className="flex flex-col items-center justify-center text-center py-8 md:py-16 px-4 max-w-4xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 text-blue-900 dark:text-white leading-tight">
                        Calibration Tracking Made Simple
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl text-blue-800 dark:text-blue-100 mb-6 max-w-2xl leading-relaxed">
                        Streamline the in-and-out tracking of equipment in your calibration department. Monitor requests, manage completions, and ensure compliance—all in one place.
                    </p>
                    <Link
                        href={route('dashboard')}
                        className="inline-block bg-blue-700 text-white px-6 md:px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-800 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                        Get Started
                    </Link>
                </section>

                {/* Step-by-Step Tutorial */}
                <section className="w-full max-w-6xl mx-auto py-8 md:py-10 px-4">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-blue-900 dark:text-white text-center">How the System Works</h2>
                    <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        <div className="lg:col-span-2 xl:col-span-3">
                            <ol className="space-y-4 md:space-y-6">
                                <li className="bg-white dark:bg-[#18181b] rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 md:p-6 border-l-4 border-blue-600">
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                                        <div className="flex-1">
                                            <span className="font-bold text-blue-700 text-lg block mb-2">Submit a Calibration Request</span>
                                            <div className="text-blue-900 dark:text-blue-100">
                                                Employees or admins submit equipment for calibration, providing details like department, location, and due date.
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li className="bg-white dark:bg-[#18181b] rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 md:p-6 border-l-4 border-blue-600">
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                                        <div className="flex-1">
                                            <span className="font-bold text-blue-700 text-lg block mb-2">Admin Confirmation</span>
                                            <div className="text-blue-900 dark:text-blue-100">
                                                Admin reviews and confirms incoming requests, assigning technicians and verifying details.
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li className="bg-white dark:bg-[#18181b] rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 md:p-6 border-l-4 border-blue-600">
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                                        <div className="flex-1">
                                            <span className="font-bold text-blue-700 text-lg block mb-2">Calibration Process</span>
                                            <div className="text-blue-900 dark:text-blue-100">
                                                Technicians perform calibration. Status and due dates are updated in the system for traceability.
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li className="bg-white dark:bg-[#18181b] rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 md:p-6 border-l-4 border-blue-600">
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                                        <div className="flex-1">
                                            <span className="font-bold text-blue-700 text-lg block mb-2">Ready for Pickup</span>
                                            <div className="text-blue-900 dark:text-blue-100">
                                                Once calibration is complete, equipment is marked as ready for pickup. Employees are notified and can confirm pickup with a PIN.
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li className="bg-white dark:bg-[#18181b] rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 md:p-6 border-l-4 border-blue-600">
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                                        <div className="flex-1">
                                            <span className="font-bold text-blue-700 text-lg block mb-2">Track & Report</span>
                                            <div className="text-blue-900 dark:text-blue-100">
                                                All activities are logged. Admins can view reports, overdue items, and manage users, equipment, and locations.
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ol>
                        </div>
                    </div>
                </section>

                {/* Mock Dashboard View */}
                <section className="w-full max-w-7xl mx-auto py-8 md:py-12 px-4">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-blue-900 dark:text-white text-center">System Dashboard Preview</h2>
                    <div className="rounded-xl shadow-lg bg-white dark:bg-[#18181b] p-4 md:p-8 border border-blue-100 dark:border-[#23232b]">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 md:mb-8 gap-4">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-blue-900 dark:text-white">Admin Dashboard</h3>
                                <p className="text-sm md:text-base text-blue-800 dark:text-blue-100">Overview of system activity and equipment tracking</p>
                            </div>
                            <button className="bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow hover:bg-blue-800 transition w-full sm:w-auto">
                                <span className="text-sm md:text-base">+ New Request</span>
                            </button>
                        </div>
                        {/* Stats Grid */}
                        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
                            <div className="bg-blue-50 dark:bg-[#23232b] rounded-lg p-3 md:p-5 text-center">
                                <div className="text-xs md:text-sm font-medium text-blue-700 mb-1">Total Equipment</div>
                                <div className="text-xl md:text-2xl font-bold text-blue-900 dark:text-white">120</div>
                                <div className="text-xs text-blue-600 hidden sm:block">Registered in system</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-[#23232b] rounded-lg p-3 md:p-5 text-center">
                                <div className="text-xs md:text-sm font-medium text-blue-700 mb-1">Active Requests</div>
                                <div className="text-xl md:text-2xl font-bold text-blue-900 dark:text-white">8</div>
                                <div className="text-xs text-blue-600 hidden sm:block">Pending calibration</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-[#23232b] rounded-lg p-3 md:p-5 text-center">
                                <div className="text-xs md:text-sm font-medium text-blue-700 mb-1">Equipment Tracked</div>
                                <div className="text-xl md:text-2xl font-bold text-blue-900 dark:text-white">15</div>
                                <div className="text-xs text-blue-600 hidden sm:block">Currently out</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-[#23232b] rounded-lg p-3 md:p-5 text-center">
                                <div className="text-xs md:text-sm font-medium text-blue-700 mb-1">Total Users</div>
                                <div className="text-xl md:text-2xl font-bold text-blue-900 dark:text-white">6</div>
                                <div className="text-xs text-blue-600 hidden sm:block">Active accounts</div>
                            </div>
                        </div>
                        {/* Quick Navigation */}
                        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
                            <div className="bg-blue-100 dark:bg-[#23232b] rounded-lg p-3 md:p-5 text-center">
                                <div className="text-sm md:text-base font-medium text-blue-700">Incoming</div>
                                <div className="text-xs text-blue-600 mt-1">Track requests</div>
                            </div>
                            <div className="bg-blue-100 dark:bg-[#23232b] rounded-lg p-3 md:p-5 text-center">
                                <div className="text-sm md:text-base font-medium text-blue-700">Outgoing</div>
                                <div className="text-xs text-blue-600 mt-1">Ready items</div>
                            </div>
                            <div className="bg-blue-100 dark:bg-[#23232b] rounded-lg p-3 md:p-5 text-center">
                                <div className="text-sm md:text-base font-medium text-blue-700">Equipment</div>
                                <div className="text-xs text-blue-600 mt-1">Manage inventory</div>
                            </div>
                            <div className="bg-blue-100 dark:bg-[#23232b] rounded-lg p-3 md:p-5 text-center">
                                <div className="text-sm md:text-base font-medium text-blue-700">Users</div>
                                <div className="text-xs text-blue-600 mt-1">Account management</div>
                            </div>
                        </div>
                        {/* Explanation */}
                        <div className="text-blue-900 dark:text-blue-100 text-center max-w-4xl mx-auto">
                            <p className="mb-2 font-semibold text-sm md:text-base">Goal of the System</p>
                            <p className="mb-3 text-sm md:text-base">The AutoTracking system is designed to provide full visibility and control over the calibration process. It helps departments:</p>
                            <ul className="list-disc list-inside mb-3 text-sm md:text-base space-y-1">
                                <li>Track equipment from submission to completion</li>
                                <li>Manage technician assignments and workloads</li>
                                <li>Ensure compliance with calibration schedules</li>
                                <li>Generate reports and analytics</li>
                            </ul>
                            <p className="text-sm md:text-base">All actions are logged for traceability, and the dashboard provides a real-time overview of your calibration operations.</p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
