'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

        const variants = {
            primary: 'btn-primary',
            secondary: 'btn-secondary',
            ghost: 'bg-transparent text-text-muted hover:text-text-secondary',
        };

        const sizes = {
            sm: 'px-4 py-2 text-sm',
            md: 'px-6 py-3 text-base',
            lg: 'px-8 py-4 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
