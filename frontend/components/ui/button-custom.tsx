import { cn } from '@/lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 outline-none select-none cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100';

    const variantStyles = {
        primary: 'bg-primary text-primary-foreground hover:opacity-90 shadow-xs font-semibold',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
        destructive: 'bg-destructive/15 text-destructive hover:bg-destructive hover:text-white border border-destructive/20',
        outline: 'border border-border/80 bg-background/50 hover:bg-secondary text-foreground hover:border-foreground/20',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-secondary/80',
    };

    const sizeStyles = {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-9.5 px-4 text-sm gap-2',
        lg: 'h-11 px-6 text-base gap-2.5 font-semibold',
    };

    return (
        <button className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props}>
            {children}
        </button>
    );
}
