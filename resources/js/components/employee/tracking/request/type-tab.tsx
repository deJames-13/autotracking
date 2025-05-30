import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface EmployeeTypeTabProps {
    data: string;
    onChange: (type: string) => void;
    errors: Record<string, string>;
}

const EmployeeTypeTab: React.FC<EmployeeTypeTabProps> = ({ data, onChange, errors = {} }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Request Type</CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup value={data} onValueChange={onChange}>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="routine" id="routine" />
                            <Label htmlFor="routine" className="flex-1 cursor-pointer">
                                <div>
                                    <div className="font-medium">Routine Calibration</div>
                                    <div className="text-sm text-muted-foreground">
                                        Regular scheduled calibration for existing equipment
                                    </div>
                                </div>
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new" id="new" />
                            <Label htmlFor="new" className="flex-1 cursor-pointer">
                                <div>
                                    <div className="font-medium">New Equipment</div>
                                    <div className="text-sm text-muted-foreground">
                                        Initial calibration for new equipment
                                    </div>
                                </div>
                            </Label>
                        </div>
                    </div>
                </RadioGroup>

                {errors.requestType && <p className="text-sm text-destructive mt-2">{errors.requestType}</p>}
            </CardContent>
        </Card>
    );
};

export default EmployeeTypeTab;
