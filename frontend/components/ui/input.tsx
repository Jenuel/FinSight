import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, type, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-foreground/80 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "h-10 w-full min-w-0 rounded-xl border border-input bg-secondary/30 px-3.5 py-2 text-sm text-foreground transition-all duration-200 outline-none placeholder:text-muted-foreground/50 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 disabled:pointer-events-none disabled:opacity-50",
              icon && 'pl-10',
              error && 'border-destructive/60 focus:border-destructive focus:ring-destructive/20',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-destructive font-medium mt-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"
