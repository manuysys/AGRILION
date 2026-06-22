'use client';

interface AnomalyBadgeProps {
  label: string;
  className?: string;
}

export default function AnomalyBadge({ label, className = '' }: AnomalyBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5
        text-xs font-medium rounded-md
        bg-amber-50 text-amber-700 border border-amber-200
        ${className}
      `}
    >
      <svg width="6" height="6" className="shrink-0">
        <circle cx="3" cy="3" r="3" fill="currentColor" opacity={0.6} />
      </svg>
      {label}
    </span>
  );
}
