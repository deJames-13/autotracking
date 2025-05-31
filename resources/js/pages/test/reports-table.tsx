import React from 'react';
import { Head } from '@inertiajs/react';
import { ReportsTable } from '@/components/admin/tracking/reports/table';

export default function TestReportsTable() {
    return (
        <>
            <Head title="Test Reports Table" />
            <div className="container mx-auto py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Test Reports Table</h1>
                    <p className="text-muted-foreground">
                        Testing the comprehensive report table implementation
                    </p>
                </div>

                <ReportsTable />
            </div>
        </>
    );
}
