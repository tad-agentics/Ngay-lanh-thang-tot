import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorBanner({
  message = 'Không tải được kết quả lúc này. Thử lại sau vài giây.',
  onRetry,
}: ErrorBannerProps) {
  return (
    <div
      className="border border-border px-4 py-3 bg-card flex items-start gap-3"
      style={{ borderRadius: 'var(--radius-md)' }}
    >
      <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
          >
            <RefreshCw size={12} strokeWidth={1.5} />
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
}
