import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, placeholder, options, className, ...props }: SelectProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-foreground/80 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'w-full h-10 px-3.5 pr-9 rounded-xl border border-input bg-secondary/30 text-sm text-foreground transition-all duration-200 outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer [&>option]:bg-card [&>option]:text-foreground',
            error && 'border-destructive/60 focus:border-destructive focus:ring-destructive/20',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
      </div>
      {error && <p className="text-[11px] text-destructive font-medium mt-1">{error}</p>}
    </div>
  );
}
