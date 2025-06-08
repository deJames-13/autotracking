import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="AutoTracking System - Calibration Department" />
            <div className="relative min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-[#0a0a0a] dark:to-[#1a1a1a] p-0">
                {/* Header */}
                <header className="w-full flex items-center justify-between px-8 py-6 bg-white/80 dark:bg-[#18181b]/80 shadow-sm z-20">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
                        <span className="text-2xl font-bold tracking-tight text-blue-900 dark:text-white">AutoTracking</span>
                    </div>
                    <nav className="flex gap-4">
                        <Link href={route('login')} className="text-blue-700 font-semibold hover:underline">Login</Link>
                        <Link href={route('admin.login')} className="text-blue-700 font-semibold hover:underline">Admin</Link>
                    </nav>
                </header>

                {/* Hero Section */}
                <section className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-2xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-blue-900 dark:text-white">Calibration Tracking Made Simple</h1>
                    <p className="text-lg md:text-xl text-blue-800 dark:text-blue-100 mb-6">
                        Streamline the in-and-out tracking of equipment in your calibration department. Monitor requests, manage completions, and ensure compliance—all in one place.
                    </p>
                    <Link href={route('dashboard')} className="inline-block bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow hover:bg-blue-800 transition">Get Started</Link>
                </section>

                {/* Step-by-Step Tutorial */}
                <section className="w-full max-w-4xl mx-auto py-10 px-4">
                    <h2 className="text-2xl font-bold mb-6 text-blue-900 dark:text-white text-center">How the System Works</h2>
                    <ol className="space-y-6 text-left">
                        <li className="bg-white dark:bg-[#18181b] rounded-lg shadow p-5 border-l-4 border-blue-600">
                            <span className="font-bold text-blue-700">1. Submit a Calibration Request</span>
                            <div className="text-blue-900 dark:text-blue-100 mt-1">
                                Employees or admins submit equipment for calibration, providing details like department, location, and due date.
                            </div>
                        </li>
                        <li className="bg-white dark:bg-[#18181b] rounded-lg shadow p-5 border-l-4 border-blue-600">
                            <span className="font-bold text-blue-700">2. Admin Confirmation</span>
                            <div className="text-blue-900 dark:text-blue-100 mt-1">
                                Admin reviews and confirms incoming requests, assigning technicians and verifying details.
                            </div>
                        </li>
                        <li className="bg-white dark:bg-[#18181b] rounded-lg shadow p-5 border-l-4 border-blue-600">
                            <span className="font-bold text-blue-700">3. Calibration Process</span>
                            <div className="text-blue-900 dark:text-blue-100 mt-1">
                                Technicians perform calibration. Status and due dates are updated in the system for traceability.
                            </div>
                        </li>
                        <li className="bg-white dark:bg-[#18181b] rounded-lg shadow p-5 border-l-4 border-blue-600">
                            <span className="font-bold text-blue-700">4. Ready for Pickup</span>
                            <div className="text-blue-900 dark:text-blue-100 mt-1">
                                Once calibration is complete, equipment is marked as ready for pickup. Employees are notified and can confirm pickup with a PIN.
                            </div>
                        </li>
                        <li className="bg-white dark:bg-[#18181b] rounded-lg shadow p-5 border-l-4 border-blue-600">
                            <span className="font-bold text-blue-700">5. Track & Report</span>
                            <div className="text-blue-900 dark:text-blue-100 mt-1">
                                All activities are logged. Admins can view reports, overdue items, and manage users, equipment, and locations.
                            </div>
                        </li>
                    </ol>
                </section>

                {/* Mock Dashboard View */}
                <section className="w-full max-w-6xl mx-auto py-12 px-4">
                    <h2 className="text-2xl font-bold mb-4 text-blue-900 dark:text-white text-center">System Dashboard Preview</h2>
                    <div className="rounded-xl shadow-lg bg-white dark:bg-[#18181b] p-8 border border-blue-100 dark:border-[#23232b]">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-blue-900 dark:text-white">Admin Dashboard</h3>
                                <p className="text-blue-800 dark:text-blue-100">Overview of system activity and equipment tracking</p>
                            </div>
                            <button className="bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 shadow hover:bg-blue-800 transition">
                                <span>+ New Request</span>
                            </button>
                        </div>
                        {/* Stats Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                            <div className="bg-blue-50 dark:bg-[#23232b] rounded-lg p-5 text-center">
                                <div className="text-sm font-medium text-blue-700">Total Equipment</div>
                                <div className="text-2xl font-bold text-blue-900 dark:text-white">120</div>
                                <div className="text-xs text-blue-600">Registered in system</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-[#23232b] rounded-lg p-5 text-center">
                                <div className="text-sm font-medium text-blue-700">Active Requests</div>
                                <div className="text-2xl font-bold text-blue-900 dark:text-white">8</div>
                                <div className="text-xs text-blue-600">Pending calibration</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-[#23232b] rounded-lg p-5 text-center">
                                <div className="text-sm font-medium text-blue-700">Equipment Tracked</div>
                                <div className="text-2xl font-bold text-blue-900 dark:text-white">15</div>
                                <div className="text-xs text-blue-600">Currently out</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-[#23232b] rounded-lg p-5 text-center">
                                <div className="text-sm font-medium text-blue-700">Total Users</div>
                                <div className="text-2xl font-bold text-blue-900 dark:text-white">6</div>
                                <div className="text-xs text-blue-600">Active accounts</div>
                            </div>
                        </div>
                        {/* Quick Navigation */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                            <div className="bg-blue-100 dark:bg-[#23232b] rounded-lg p-5 text-center">
                                <div className="font-semibold text-blue-800 dark:text-white mb-1">Incoming Requests</div>
                                <div className="text-xs text-blue-700">View and manage equipment submitted for calibration</div>
                            </div>
                            <div className="bg-blue-100 dark:bg-[#23232b] rounded-lg p-5 text-center">
                                <div className="font-semibold text-blue-800 dark:text-white mb-1">Outgoing Completions</div>
                                <div className="text-xs text-blue-700">View completed calibrations ready for pickup</div>
                            </div>
                            <div className="bg-blue-100 dark:bg-[#23232b] rounded-lg p-5 text-center">
                                <div className="font-semibold text-blue-800 dark:text-white mb-1">Manage Equipment</div>
                                <div className="text-xs text-blue-700">Add, edit, or remove equipment records</div>
                            </div>
                            <div className="bg-blue-100 dark:bg-[#23232b] rounded-lg p-5 text-center">
                                <div className="font-semibold text-blue-800 dark:text-white mb-1">Manage Users</div>
                                <div className="text-xs text-blue-700">Control user access and permissions</div>
                            </div>
                        </div>
                        {/* Explanation */}
                        <div className="text-blue-900 dark:text-blue-100 text-center max-w-3xl mx-auto">
                            <p className="mb-2 font-semibold">Goal of the System</p>
                            <p className="mb-2">The AutoTracking system is designed to provide full visibility and control over the calibration process. It helps departments:</p>
                            <ul className="list-disc list-inside mb-2">
                                <li>Track equipment as it moves in and out for calibration</li>
                                <li>Monitor request status and due dates</li>
                                <li>Ensure timely completion and pickup</li>
                                <li>Generate reports for compliance and audits</li>
                                <li>Manage users, equipment, and locations efficiently</li>
                            </ul>
                            <p>All actions are logged for traceability, and the dashboard provides a real-time overview of your calibration operations.</p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
