import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    
    const baseClasses = "w-full rounded-lg sm:rounded-xl border bg-[var(--background)] px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-[var(--foreground)] transition-all focus:outline-none focus:ring-2";
    
    const errorClasses = error
      ? "border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20"
      : "border-[var(--input)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20";
    
    return (
      <div className="space-y-1.5 sm:space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-semibold text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseClasses} ${errorClasses} ${className}`}
          {...props}
        />
        {error && (
          <div className="mt-1.5 rounded-lg border border-red-300 bg-red-50/80 dark:bg-red-950/20 dark:border-red-800/50 px-2.5 py-1.5">
            <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
              <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}
        {helperText && !error && (
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

