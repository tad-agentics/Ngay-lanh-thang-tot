import { Navigate, Outlet } from "react-router";

import { useAuth } from "~/lib/auth";

export default function AppShellLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background text-muted-foreground text-sm">
        Đang tải…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/dang-nhap" replace />;
  }

  return <Outlet />;
}
