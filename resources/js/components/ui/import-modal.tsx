import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface ImportModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    importEndpoint: string;
    templateEndpoint: string;
    onSuccess?: () => void;
}

export function ImportModal({
    isOpen,
    onOpenChange,
    title,
    description,
    importEndpoint,
    templateEndpoint,
    onSuccess,
}: ImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errors, setErrors] = useState<any[]>([]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            // Validate file type
            const allowedTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/csv',
            ];
            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error('Please select an Excel file (.xlsx, .xls) or CSV file.');
                return;
            }

            // Validate file size (10MB max)
            if (selectedFile.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB.');
                return;
            }

            setFile(selectedFile);
            setErrors([]);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get(templateEndpoint, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title.toLowerCase().replace(' ', '_')}_template.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Import template has been downloaded successfully.');
        } catch (error) {
            toast.error('Failed to download template. Please try again.');
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file to import.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setErrors([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(importEndpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    }
                },
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setFile(null);
                onSuccess?.();
                onOpenChange(false);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error: any) {
            console.error('Import error:', error);

            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                toast.error('There were validation errors in your file. Please check the details below.');
            } else {
                toast.error(error.response?.data?.message || 'An error occurred during import.');
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const resetModal = () => {
        setFile(null);
        setErrors([]);
        setUploadProgress(0);
        setIsUploading(false);
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) resetModal();
                onOpenChange(open);
            }}
        >
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Download Template Section */}
                    <div className="rounded-lg border border-dashed border-gray-300 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium">Template</span>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadTemplate}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Download the template file to see the required format and column headers.
                        </p>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-3">
                        <Label htmlFor="import-file">Select File to Import</Label>
                        <Input
                            id="import-file"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        {file && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Selected: {file.name}
                            </div>
                        )}
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                        </div>
                    )}

                    {/* Validation Errors */}
                    {errors.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <div className="flex items-center gap-2 text-red-800">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Validation Errors</span>
                            </div>
                            <div className="mt-2 max-h-32 overflow-y-auto">
                                {errors.map((error, index) => (
                                    <div key={index} className="text-xs text-red-700">
                                        Row {error.row}: {error.errors.join(', ')}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isUploading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleImport}
                            disabled={!file || isUploading}
                            className="flex-1"
                        >
                            {isUploading ? 'Importing...' : 'Import'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
