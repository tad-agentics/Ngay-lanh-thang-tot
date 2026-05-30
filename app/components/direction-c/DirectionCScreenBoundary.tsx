import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router";

import { CTopStrip, Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import { captureClientException } from "~/lib/sentry";

type Props = {
  children: ReactNode;
  /** Shown in fallback copy, e.g. "Lịch". */
  screen?: string;
};

type State = {
  error: Error | null;
};

function DirectionCScreenErrorFallback({
  screen,
  onRetry,
  devMessage,
}: {
  screen?: string;
  onRetry: () => void;
  devMessage?: string;
}) {
  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <CTopStrip />
      <div className="flex flex-1 flex-col justify-center px-6 py-10">
        <Mono
          style={{
            color: CT.goldDeep,
            fontSize: 10,
            letterSpacing: "0.2em",
          }}
        >
          LỖI HIỂN THỊ
        </Mono>
        <h1
          className="mt-3 text-[28px] font-extrabold uppercase leading-tight tracking-[-0.02em]"
          style={{ fontFamily: "var(--display)", color: CT.ink }}
        >
          {screen ? `Không tải được ${screen}` : "Không tải được màn hình"}
        </h1>
        <p className="mt-3 max-w-[300px] text-[14px] leading-relaxed" style={{ color: CT.muted }}>
          Đã xảy ra lỗi không mong muốn. Bạn có thể thử lại hoặc quay về Lịch.
        </p>
        {devMessage ? (
          <p
            className="mt-3 max-w-full overflow-x-auto font-mono text-[11px] leading-snug"
            style={{ color: CT.ink2 }}
          >
            {devMessage}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer border-none px-4 py-3 text-[13px] font-bold uppercase tracking-wide"
            style={{ background: CT.forest, color: CT.cream, fontFamily: "var(--display-2)" }}
          >
            Thử lại
          </button>
          <Link
            to="/lich"
            className="inline-block px-4 py-3 text-center text-[13px] font-semibold no-underline"
            style={{
              border: `1px solid ${CT.goldDeep}`,
              color: CT.goldDeep,
            }}
          >
            Về Lịch
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer border-none bg-transparent p-0 text-left font-serif text-[13px] underline"
            style={{ color: CT.muted }}
          >
            Tải lại trang
          </button>
        </div>
      </div>
    </div>
  );
}

/** Catches render errors in a Direction C screen without taking down the whole app shell. */
export class DirectionCScreenBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureClientException(error, {
      tags: {
        boundary: "DirectionCScreenBoundary",
        ...(this.props.screen ? { screen: this.props.screen } : {}),
      },
      extra: info.componentStack
        ? { componentStack: info.componentStack }
        : undefined,
    });
  }

  private retry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <DirectionCScreenErrorFallback
          screen={this.props.screen}
          onRetry={this.retry}
          devMessage={
            import.meta.env.DEV ? this.state.error.message : undefined
          }
        />
      );
    }
    return this.props.children;
  }
}
