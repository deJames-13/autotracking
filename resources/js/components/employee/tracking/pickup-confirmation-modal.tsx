import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type TrackOutgoing } from '@/types';
import axios from 'axios';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface PickupConfirmationModalProps {
    trackOutgoing: TrackOutgoing;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const PickupConfirmationModal: React.FC<PickupConfirmationModalProps> = ({ trackOutgoing, open, onOpenChange, onSuccess }) => {
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(route('api.employee.tracking.outgoing.pickup', trackOutgoing.id), {
                confirmation_pin: pin,
            });

            if (response.data.success) {
                toast.success('Pickup confirmed successfully!');
                onSuccess();
                setPin('');
            } else {
                setError(response.data.message || 'Failed to confirm pickup');
            }
        } catch (error: any) {
            console.error('Error confirming pickup:', error);

            if (error.response?.status === 422) {
                // Validation error
                const errors = error.response.data.errors;
                if (errors.confirmation_pin) {
                    setError(errors.confirmation_pin[0]);
                } else {
                    setError('Please check your input and try again.');
                }
            } else {
                setError(error.response?.data?.message || 'An error occurred while confirming pickup');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setPin('');
        setError('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Confirm Equipment Pickup
                    </DialogTitle>
                    <DialogDescription>
                        Please confirm that you are picking up the calibrated equipment: {trackOutgoing.recall_number}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        {/* Equipment Summary */}
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Equipment:</strong> {trackOutgoing.track_incoming?.description || 'N/A'}
                                <br />
                                <strong>Serial Number:</strong> {trackOutgoing.track_incoming?.serial_number || 'N/A'}
                                <br />
                                <strong>Certificate:</strong> {trackOutgoing.certificate_number || 'N/A'}
                            </AlertDescription>
                        </Alert>

                        {/* PIN Input */}
                        <div className="space-y-2">
                            <Label htmlFor="pin">Your PIN</Label>
                            <Input
                                id="pin"
                                type="password"
                                placeholder="Enter your PIN"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength={4}
                                pattern="[0-9]{4}"
                                required
                                disabled={isLoading}
                                className={error ? 'border-red-500' : ''}
                            />
                            <p className="text-muted-foreground text-xs">Enter your PIN to confirm pickup</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || pin.length !== 4}>
                            {isLoading ? 'Confirming...' : 'Confirm Pickup'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
