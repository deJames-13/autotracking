import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    CheckCircle,
    AlertTriangle,
    Package,
    Settings,
    Eye,
    FileCheck,
    Truck
} from 'lucide-react';

export type TrackingStatus =
    | 'for_confirmation'
    | 'pending_calibration'
    | 'completed'
    | 'for_pickup'
    | 'overdue'
    | 'unknown';

interface StatusBadgeProps {
    status: TrackingStatus;
    className?: string;
    showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
    const getStatusConfig = (status: TrackingStatus) => {
        switch (status) {
            case 'for_confirmation':
                return {
                    variant: 'warning' as const,
                    text: 'Awaiting Confirmation',
                    icon: <AlertTriangle className="h-3 w-3" />
                };
            case 'pending_calibration':
                return {
                    variant: 'secondary' as const,
                    text: 'Pending Calibration',
                    icon: <Settings className="h-3 w-3" />
                };
            case 'completed':
                return {
                    variant: 'success' as const,
                    text: 'Completed',
                    icon: <CheckCircle className="h-3 w-3" />
                };
            case 'for_pickup':
                return {
                    variant: 'default' as const,
                    text: 'Ready for Pickup',
                    icon: <Package className="h-3 w-3" />
                };
            case 'overdue':
                return {
                    variant: 'destructive' as const,
                    text: 'Overdue',
                    icon: <Clock className="h-3 w-3" />
                };
            default:
                return {
                    variant: 'outline' as const,
                    text: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    icon: <Eye className="h-3 w-3" />
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Badge variant={config.variant} className={className}>
            {showIcon && config.icon}
            {config.text}
        </Badge>
    );
}

// Employee-specific status badge with different text variations
export function EmployeeStatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
    const getStatusConfig = (status: TrackingStatus) => {
        switch (status) {
            case 'for_confirmation':
                return {
                    variant: 'warning' as const,
                    text: 'Awaiting Admin Confirmation',
                    icon: <AlertTriangle className="h-3 w-3" />
                };
            case 'pending_calibration':
                return {
                    variant: 'default' as const,
                    text: 'Confirmed - In Progress',
                    icon: <Settings className="h-3 w-3" />
                };
            case 'completed':
                return {
                    variant: 'success' as const,
                    text: 'Completed',
                    icon: <CheckCircle className="h-3 w-3" />
                };
            case 'for_pickup':
                return {
                    variant: 'secondary' as const,
                    text: 'Ready for Pickup',
                    icon: <Package className="h-3 w-3" />
                };
            case 'overdue':
                return {
                    variant: 'destructive' as const,
                    text: 'Overdue',
                    icon: <Clock className="h-3 w-3" />
                };
            default:
                return {
                    variant: 'outline' as const,
                    text: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    icon: <Eye className="h-3 w-3" />
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Badge variant={config.variant} className={className}>
            {showIcon && config.icon}
            {config.text}
        </Badge>
    );
}

// Outgoing/Pickup specific status badge
export function OutgoingStatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
    const getStatusConfig = (status: TrackingStatus) => {
        switch (status) {
            case 'for_pickup':
                return {
                    variant: 'warning' as const,
                    text: 'Ready for Pickup',
                    icon: <Package className="h-3 w-3" />
                };
            case 'completed':
                return {
                    variant: 'default' as const,
                    text: 'Picked Up',
                    icon: <Truck className="h-3 w-3" />
                };
            default:
                return {
                    variant: 'outline' as const,
                    text: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    icon: <Eye className="h-3 w-3" />
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Badge variant={config.variant} className={className}>
            {showIcon && config.icon}
            {config.text}
        </Badge>
    );
}

// Helper function to get status badge based on context
export function getTrackingStatusBadge(
    status: string,
    context: 'admin' | 'employee' | 'outgoing' = 'admin',
    options?: { className?: string; showIcon?: boolean }
) {
    const { className, showIcon = true } = options || {};
    const normalizedStatus = status as TrackingStatus;

    switch (context) {
        case 'employee':
            return <EmployeeStatusBadge status={normalizedStatus} className={className} showIcon={showIcon} />;
        case 'outgoing':
            return <OutgoingStatusBadge status={normalizedStatus} className={className} showIcon={showIcon} />;
        default:
            return <StatusBadge status={normalizedStatus} className={className} showIcon={showIcon} />;
    }
}
