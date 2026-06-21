'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onOpenChange, title, description, children, footer, size = 'md' }: ModalProps) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
    };

    return (
        <>
            {open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className={cn('bg-card text-card-foreground rounded-lg shadow-lg w-full', sizeClasses[size])}>
                        <div className="flex items-start justify-between p-6 border-b border-border">
                            <div>
                                <h2 className="text-lg font-semibold">{title}</h2>
                                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                            </div>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">{children}</div>
                        {footer && <div className="p-6 border-t border-border flex gap-2 justify-end">{footer}</div>}
                    </div>
                </div>
            )}
        </>
    );
}
