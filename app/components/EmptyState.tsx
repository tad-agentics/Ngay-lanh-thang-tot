interface EmptyStateProps {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="text-center px-6 py-10 text-muted-foreground">
      <p className="text-sm leading-relaxed">{message}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-4 bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-opacity active:opacity-80"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
