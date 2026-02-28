import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="border-t border-border py-10 text-center">
      <p className="text-[14px] font-normal text-ink mb-1">{title}</p>
      {subtitle && (
        <p className="text-[13px] font-light text-ink-secondary mb-3">{subtitle}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="text-[11px] font-normal tracking-[0.02em] text-accent hover:text-ink transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
