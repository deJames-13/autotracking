import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import * as React from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';

// Modal Context for passing onOpenChange to child components
const ModalContext = createContext<{
    onOpenChange?: (open: boolean) => void;
}>({});

interface ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

function Modal({ open, onOpenChange, children }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            // Don't close modal if react-select is open
            const isReactSelectOpen = document.body.hasAttribute('data-react-select-open');
            if (e.key === 'Escape' && open && !isReactSelectOpen) {
                onOpenChange(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <ModalContext.Provider value={{ onOpenChange }}>
            <div
                ref={overlayRef}
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
                onClick={(e) => {
                    // Only close modal if clicking on the overlay itself, not on any child elements
                    // Also check for react-select dropdown elements
                    const target = e.target as Element;
                    const isOverlay = e.target === overlayRef.current;

                    // Comprehensive check for react-select elements
                    const isSelectElement = target.closest && (
                        target.closest('[class*="react-select"]') !== null ||
                        target.closest('[class*="select__"]') !== null ||
                        target.closest('[id*="react-select"]') !== null ||
                        target.matches('[class*="react-select"]') ||
                        target.matches('[class*="select__"]')
                    );

                    if (isOverlay && !isSelectElement) {
                        onOpenChange(false);
                    }
                }}
            >
                {children}
            </div>
        </ModalContext.Provider>
    );
}

interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    children: React.ReactNode;
    onInteractOutside?: (e: Event) => void;
    onOpenAutoFocus?: (e: Event) => void;
    onCloseAutoFocus?: (e: Event) => void;
    onEscapeKeyDown?: (e: KeyboardEvent) => void;
    onPointerDownOutside?: (e: Event) => void;
    showCloseButton?: boolean;
    onOpenChange?: (open: boolean) => void;
}

function ModalContent({
    className,
    children,
    onInteractOutside,
    onOpenAutoFocus,
    onCloseAutoFocus,
    onEscapeKeyDown,
    onPointerDownOutside,
    showCloseButton = true,
    onOpenChange: propOnOpenChange,
    ...props
}: ModalContentProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const { onOpenChange: contextOnOpenChange } = useContext(ModalContext);
    const onOpenChange = propOnOpenChange || contextOnOpenChange;

    useEffect(() => {
        if (onOpenAutoFocus) {
            // Use setTimeout to avoid immediate focus conflicts
            const timer = setTimeout(() => {
                const event = new Event('focus');
                onOpenAutoFocus(event);
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [onOpenAutoFocus]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onEscapeKeyDown) {
                e.preventDefault();
                onEscapeKeyDown(e);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onEscapeKeyDown]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // Check if the click is outside the modal content but exclude react-select portals
        const target = e.target as Node;
        const isOutsideContent = contentRef.current && !contentRef.current.contains(target);

        // More comprehensive check for react-select elements
        const isSelectElement = target && (target as Element).closest && (
            (target as Element).closest('[class*="react-select"]') !== null ||
            (target as Element).closest('[class*="select__"]') !== null ||
            (target as Element).closest('[id*="react-select"]') !== null ||
            (target as Element).matches('[class*="react-select"]') ||
            (target as Element).matches('[class*="select__"]')
        );

        if (isOutsideContent && !isSelectElement) {
            if (onPointerDownOutside) {
                const event = new Event('pointerdown');
                onPointerDownOutside(event);
            }
            if (onInteractOutside) {
                const event = new Event('interact');
                onInteractOutside(event);
            }
        }
    };

    return (
        <div
            ref={contentRef}
            className={cn(
                "bg-background relative grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg",
                "animate-in fade-in-0 zoom-in-95 duration-200",
                "sm:max-w-lg",
                className
            )}
            onPointerDown={(e) => {
                // Stop propagation to prevent modal from closing when clicking inside content
                e.stopPropagation();
            }}
            onFocus={(e) => {
                // Prevent focus events from bubbling when react-select is open to avoid recursion
                const isReactSelectOpen = document.body.hasAttribute('data-react-select-open');
                if (isReactSelectOpen) {
                    e.stopPropagation();
                }
            }}
            onBlur={(e) => {
                // Prevent blur events from bubbling when react-select is open to avoid recursion
                const isReactSelectOpen = document.body.hasAttribute('data-react-select-open');
                if (isReactSelectOpen) {
                    e.stopPropagation();
                }
            }}
            {...props}
        >
            {children}
            {showCloseButton && onOpenChange && (
                <button
                    className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
                    onClick={() => onOpenChange(false)}
                    type="button"
                >
                    <XIcon className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            )}
        </div>
    );
}

interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

function ModalHeader({ className, ...props }: ModalHeaderProps) {
    return (
        <div
            className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
            {...props}
        />
    );
}

interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    className?: string;
}

function ModalTitle({ className, ...props }: ModalTitleProps) {
    return (
        <h2
            className={cn("text-lg leading-none font-semibold", className)}
            {...props}
        />
    );
}

interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    className?: string;
}

function ModalDescription({ className, ...props }: ModalDescriptionProps) {
    return (
        <p
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    onOpenChange?: (open: boolean) => void;
}

function ModalClose({ className, onOpenChange: propOnOpenChange, ...props }: ModalCloseProps) {
    const { onOpenChange: contextOnOpenChange } = useContext(ModalContext);
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

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

function ModalFooter({ className, ...props }: ModalFooterProps) {
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

interface ModalTriggerProps extends React.HTMLAttributes<HTMLElement> {
    className?: string;
    children: React.ReactNode;
    asChild?: boolean;
}

function ModalTrigger({ className, children, asChild, onClick, ...props }: ModalTriggerProps) {
    const { onOpenChange } = useContext(ModalContext);

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

// Export components with names matching the Dialog API for easy replacement
export {
    Modal as Dialog,
    ModalContent as DialogContent,
    ModalHeader as DialogHeader,
    ModalTitle as DialogTitle,
    ModalDescription as DialogDescription,
    ModalClose as DialogClose,
    ModalFooter as DialogFooter,
    ModalTrigger as DialogTrigger,
};

// Also export the original names for flexibility
export {
    Modal,
    ModalContent,
    ModalHeader,
    ModalTitle,
    ModalDescription,
    ModalClose,
    ModalFooter,
    ModalTrigger,
};
