import { Button } from '@/components/ui/button';
import { Download, QrCode, Barcode as BarcodeIcon } from 'lucide-react';
import { useState } from 'react';
import Barcode from 'react-barcode';
import QRCode from 'react-qr-code';
import { toast } from 'react-hot-toast';

interface CodeDisplayProps {
    value: string;
    label: string;
    filename: string;
    containerClassName?: string;
    showDownload?: boolean;
    format?: 'CODE128' | 'CODE39';
    width?: number;
    height?: number;
    fontSize?: number;
    margin?: number;
    qrSize?: number;
}

export function CodeDisplay({
    value,
    label,
    filename,
    containerClassName = '',
    showDownload = true,
    format = 'CODE128',
    width = 2,
    height = 60,
    fontSize = 16,
    margin = 8,
    qrSize = 128,
}: CodeDisplayProps) {
    const [isQRCode, setIsQRCode] = useState(true); // QR code as default

    // Don't render if value is empty or null
    if (!value || value.trim() === '') {
        return null;
    }

    const handleDownload = () => {
        try {
            // Find the appropriate element
            const element = document.querySelector(`.${containerClassName.replace(/\s+/g, '.')} ${isQRCode ? 'svg' : 'svg'}`) as SVGSVGElement;
            if (!element) {
                toast.error(`${isQRCode ? 'QR Code' : 'Barcode'} not found`);
                return;
            }

            // Get element dimensions
            const rect = element.getBoundingClientRect();
            const elementWidth = rect.width || (isQRCode ? qrSize : 300);
            const elementHeight = rect.height || (isQRCode ? qrSize : 100);

            // Create a canvas to convert SVG to PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                toast.error('Could not create download canvas');
                return;
            }

            // Set canvas size with padding
            canvas.width = elementWidth + 20;
            canvas.height = elementHeight + 20;

            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Convert SVG to data URL
            const svgData = new XMLSerializer().serializeToString(element);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // Create an image element to load the SVG
            const img = new Image();
            img.onload = () => {
                // Draw the SVG image onto the canvas with padding
                ctx.drawImage(img, 10, 10, elementWidth, elementHeight);

                // Convert canvas to blob and download
                canvas.toBlob((blob) => {
                    if (!blob) {
                        toast.error(`Could not generate ${isQRCode ? 'QR code' : 'barcode'} image`);
                        return;
                    }

                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${isQRCode ? 'qrcode' : 'barcode'}-${filename}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    URL.revokeObjectURL(svgUrl);

                    toast.success(`${isQRCode ? 'QR code' : 'Barcode'} downloaded successfully`);
                }, 'image/png');
            };

            img.onerror = () => {
                toast.error(`Failed to load ${isQRCode ? 'QR code' : 'barcode'} for download`);
                URL.revokeObjectURL(svgUrl);
            };

            img.src = svgUrl;
        } catch (error) {
            console.error(`Error downloading ${isQRCode ? 'QR code' : 'barcode'}:`, error);
            toast.error(`Failed to download ${isQRCode ? 'QR code' : 'barcode'}`);
        }
    };

    return (
        <div className="mb-4 flex flex-col items-center">
            <div className={`${containerClassName} mb-2`}>
                {isQRCode ? (
                    <div style={{ background: 'white', padding: '8px' }}>
                        <QRCode
                            value={value}
                            size={qrSize}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                            level="L"
                        />
                    </div>
                ) : (
                    <Barcode
                        format={format}
                        value={value}
                        width={width}
                        height={height}
                        displayValue={true}
                        fontSize={fontSize}
                        margin={margin}
                    />
                )}
            </div>
            <div className="mt-2 flex items-center gap-2">
                <span className="text-muted-foreground text-xs">{label}</span>
                <div className="flex items-center gap-1">
                    <Button
                        variant={isQRCode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsQRCode(true)}
                        className="h-6 px-2"
                    >
                        <QrCode className="h-3 w-3" />
                    </Button>
                    <Button
                        variant={!isQRCode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsQRCode(false)}
                        className="h-6 px-2"
                    >
                        <BarcodeIcon className="h-3 w-3" />
                    </Button>
                    {showDownload && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="h-6 px-2"
                        >
                            <Download className="mr-1 h-3 w-3" />
                            Download
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
} 