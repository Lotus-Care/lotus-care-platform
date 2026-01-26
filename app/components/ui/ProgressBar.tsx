interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  label,
  showLabel = true,
  className = "",
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-medium text-[var(--foreground)]">
            {label || "Progresso"}
          </span>
          <span className="text-[var(--muted-foreground)]">
            {value}/{max}
          </span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

