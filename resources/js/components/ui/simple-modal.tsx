import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import * as React from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';

// Simple Modal Context
const SimpleModalContext = createContext<{
    onOpenChange?: (open: boolean) => void;
}>({});

interface SimpleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

function SimpleModal({ open, onOpenChange, children }: SimpleModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const isInitialRender = useRef(true);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            // Focus the modal overlay after a short delay to avoid conflicts
            setTimeout(() => {
                overlayRef.current?.focus();
            }, 100);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                // Don't close if there's an active react-select dropdown
                const selectMenus = document.querySelectorAll('[class*="react-select__menu"]');
                if (selectMenus.length > 0) {
                    return;
                }
                onOpenChange(false);
            }
        };

        if (open) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <SimpleModalContext.Provider value={{ onOpenChange }}>
            <div
                ref={overlayRef}
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
                tabIndex={-1}
                onClick={(e) => {
                    // Only close if clicking the overlay itself
                    if (e.target === overlayRef.current) {
                        onOpenChange(false);
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        onOpenChange(false);
                    }
                }}
            >
                {children}
            </div>
        </SimpleModalContext.Provider>
    );
}

interface SimpleModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    children: React.ReactNode;
    showCloseButton?: boolean;
    onOpenChange?: (open: boolean) => void;
}

function SimpleModalContent({
    className,
    children,
    showCloseButton = true,
    onOpenChange: propOnOpenChange,
    ...props
}: SimpleModalContentProps) {
    const { onOpenChange: contextOnOpenChange } = useContext(SimpleModalContext);
    const onOpenChange = propOnOpenChange || contextOnOpenChange;

    return (
        <div
            className={cn(
                "bg-background relative grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg",
                "animate-in fade-in-0 zoom-in-95 duration-200",
                "sm:max-w-lg",
                className
            )}
            onClick={(e) => {
                // Prevent clicks inside the modal from closing it
                e.stopPropagation();
            }}
            {...props}
        >
            {children}
            {showCloseButton && onOpenChange && (
                <button
                    className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
                    onClick={() => onOpenChange(false)}
                    type="button"
                    aria-label="Close"
                >
                    <XIcon className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            )}
        </div>
    );
}

interface SimpleModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

function SimpleModalHeader({ className, ...props }: SimpleModalHeaderProps) {
    return (
        <div
            className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
            {...props}
        />
    );
}

interface SimpleModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    className?: string;
}

function SimpleModalTitle({ className, ...props }: SimpleModalTitleProps) {
    return (
        <h2
            className={cn("text-lg leading-none font-semibold", className)}
            {...props}
        />
    );
}

interface SimpleModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    className?: string;
}

function SimpleModalDescription({ className, ...props }: SimpleModalDescriptionProps) {
    return (
        <p
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

interface SimpleModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

function SimpleModalFooter({ className, ...props }: SimpleModalFooterProps) {
    return (
        <div
            className={cn(
                "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
                className
            )}
            {...props}
        />
    );
}

interface SimpleModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    onOpenChange?: (open: boolean) => void;
}

function SimpleModalClose({ className, onOpenChange: propOnOpenChange, ...props }: SimpleModalCloseProps) {
    const { onOpenChange: contextOnOpenChange } = useContext(SimpleModalContext);
    const onOpenChange = propOnOpenChange || contextOnOpenChange;

    return (
        <button
            className={cn(
                "ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
                "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            onClick={() => onOpenChange?.(false)}
            {...props}
        >
            <XIcon />
            <span className="sr-only">Close</span>
        </button>
    );
}

interface SimpleModalTriggerProps extends React.HTMLAttributes<HTMLElement> {
    className?: string;
    children: React.ReactNode;
    asChild?: boolean;
}

function SimpleModalTrigger({ className, children, asChild, onClick, ...props }: SimpleModalTriggerProps) {
    const { onOpenChange } = useContext(SimpleModalContext);

    const handleClick = (e: React.MouseEvent) => {
        // Call the original onClick if provided
        if (onClick) {
            onClick(e);
        }
        // Open the modal
        if (onOpenChange) {
            onOpenChange(true);
        }
    };

    if (asChild) {
        return React.cloneElement(children as React.ReactElement, {
            ...props,
            onClick: handleClick,
            className: cn(className, (children as React.ReactElement).props.className)
        });
    }

    return (
        <button
            className={cn("cursor-pointer", className)}
            onClick={handleClick}
            {...props}
        >
            {children}
        </button>
    );
}

// Export with Dialog names for easy replacement
export {
    SimpleModal as Dialog,
    SimpleModalContent as DialogContent,
    SimpleModalHeader as DialogHeader,
    SimpleModalTitle as DialogTitle,
    SimpleModalDescription as DialogDescription,
    SimpleModalClose as DialogClose,
    SimpleModalFooter as DialogFooter,
    SimpleModalTrigger as DialogTrigger,
};

// Also export original names
export {
    SimpleModal,
    SimpleModalContent,
    SimpleModalHeader,
    SimpleModalTitle,
    SimpleModalDescription,
    SimpleModalClose,
    SimpleModalFooter,
    SimpleModalTrigger,
}; 