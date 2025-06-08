import type { TrackIncoming, TrackOutgoing } from '@/types';
import axios from 'axios';

// API service for tracking operations
export class TrackingService {
    // Search incoming calibration requests
    static async searchIncoming(params: { search?: string; status?: string; department_id?: number; limit?: number; page?: number }) {
        try {
            const response = await axios.get('/admin/track-incoming/search', {
                params,
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            return response.data;
        } catch (error) {
            console.error('Error searching incoming requests:', error);
            throw error;
        }
    }

    // Search outgoing calibration completions
    static async searchOutgoing(params: { search?: string; status?: string; department_id?: number; limit?: number; page?: number }) {
        try {
            const response = await axios.get('/admin/track-outgoing/search', {
                params,
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            return response.data;
        } catch (error) {
            console.error('Error searching outgoing completions:', error);
            throw error;
        }
    }

    // Legacy search for backward compatibility
    static async searchTrackingRecords(params: { search?: string; department_id?: number; limit?: number; page?: number }) {
        try {
            const response = await axios.get('/admin/tracking-records/search', {
                params,
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            return response.data;
        } catch (error) {
            console.error('Error searching tracking records:', error);
            throw error;
        }
    }

    // Get pending incoming requests
    static async getPendingIncoming() {
        try {
            const response = await axios.get('/api/v1/track-incoming/pending', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching pending incoming:', error);
            throw error;
        }
    }

    // Get overdue incoming requests
    static async getOverdueIncoming() {
        try {
            const response = await axios.get('/api/v1/track-incoming/overdue', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching overdue incoming:', error);
            throw error;
        }
    }

    // Get due soon incoming requests
    static async getDueSoonIncoming() {
        try {
            const response = await axios.get('/api/v1/track-incoming/due-soon', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching due soon incoming:', error);
            throw error;
        }
    }

    // Get ready for pickup completions
    static async getReadyForPickup() {
        try {
            const response = await axios.get('/api/v1/track-outgoing/pending', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching ready for pickup:', error);
            throw error;
        }
    }

    // Get a specific incoming request
    static async getIncomingRequest(id: number): Promise<TrackIncoming> {
        try {
            const response = await axios.get(`/api/v1/track-incoming/${id}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching incoming request:', error);
            throw error;
        }
    }

    // Get a specific outgoing completion
    static async getOutgoingCompletion(id: number): Promise<TrackOutgoing> {
        try {
            const response = await axios.get(`/api/v1/track-outgoing/${id}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching outgoing completion:', error);
            throw error;
        }
    }

    // Update incoming request status
    static async updateIncomingStatus(id: number, status: string) {
        try {
            const response = await axios.patch(
                `/api/v1/track-incoming/${id}`,
                {
                    status,
                },
                {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error updating incoming status:', error);
            throw error;
        }
    }

    // Create outgoing completion from incoming request
    static async createOutgoingFromIncoming(
        incomingId: number,
        data: {
            cal_date: string;
            cal_due_date: string;
            date_out: string;
            employee_out: number;
            certificate_number?: string;
            notes?: string;
        },
    ) {
        try {
            const response = await axios.post(
                '/api/v1/track-outgoing',
                {
                    ...data,
                    recall_number: '', // Will be populated from incoming request
                    track_incoming_id: incomingId,
                },
                {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error creating outgoing completion:', error);
            throw error;
        }
    }
}

export default TrackingService;
