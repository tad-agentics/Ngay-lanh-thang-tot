import { Link } from "react-router";

import { ErrorBanner } from "~/components/ErrorBanner";
import { Button } from "~/components/ui/button";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";

function hasActiveSubscription(subscriptionExpiresAt: string | null): boolean {
  if (!subscriptionExpiresAt) return false;
  return new Date(subscriptionExpiresAt) > new Date();
}

export function CreditGate({
  featureKey,
  children,
}: {
  featureKey: string;
  children: React.ReactNode;
}) {
  const { profile, loading: profileLoading } = useProfile();
  const { costs, loading: costsLoading, error: costsError, reload: reloadCosts } =
    useFeatureCosts();

  if (profileLoading || costsLoading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Đang kiểm tra lượng…
      </div>
    );
  }

  if (costsError) {
    return (
      <div className="space-y-4">
        <ErrorBanner
          message={`Không tải được bảng giá lượng: ${costsError}`}
        />
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={() => reloadCosts()}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const row = costs[featureKey];
  if (!row) {
    if (import.meta.env.DEV) {
      console.warn(`CreditGate: missing feature_credit_costs row for "${featureKey}"`);
    }
    return (
      <div className="space-y-4">
        <ErrorBanner
          message="Chưa cấu hình lượng cho tính năng này trên hệ thống. Bạn có thể thử tải lại."
        />
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => reloadCosts()}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  if (row.is_free || row.credit_cost <= 0) {
    return <>{children}</>;
  }

  if (profile && hasActiveSubscription(profile.subscription_expires_at)) {
    return <>{children}</>;
  }

  const balance = profile?.credits_balance ?? 0;
  if (balance >= row.credit_cost) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-4">
      <ErrorBanner
        message={`Cần ${row.credit_cost} lượng để dùng tính năng này. Bạn đang có ${balance} lượng.`}
      />
      <Button asChild className="w-full sm:w-auto">
        <Link to="/app/mua-luong">Mua lượng</Link>
      </Button>
    </div>
  );
}
