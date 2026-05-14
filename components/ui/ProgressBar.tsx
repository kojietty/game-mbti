interface Props {
  current: number; // 0-based completed count
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className = "" }: Props) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-[var(--color-muted)] tabular-nums">
        {current} / {total}
      </span>
    </div>
  );
}
