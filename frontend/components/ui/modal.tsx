'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onOpenChange, title, description, children, footer, size = 'md' }: ModalProps) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-3xl',
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                onOpenChange(false);
            }
        };
        if (open) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity" 
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />

            {/* Modal Dialog */}
            <div
                role="dialog"
                aria-modal="true"
                className={cn(
                    'relative w-full rounded-2xl glass-card border border-border/70 shadow-2xl overflow-hidden z-10 animate-fade-in-up transition-all duration-200',
                    sizeClasses[size]
                )}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-border/40 bg-secondary/20">
                    <div className="space-y-1 pr-6">
                        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
                        {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-muted-foreground hover:text-foreground hover:bg-secondary p-2 rounded-xl transition-all duration-150 cursor-pointer shrink-0"
                        aria-label="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(85vh-130px)] overflow-y-auto">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-border/40 bg-secondary/15 flex items-center gap-2 justify-end">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
