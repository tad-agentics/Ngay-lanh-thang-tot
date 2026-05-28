import { AppShellViewport } from "~/components/AppShellViewport";
import { CDayDetailScreen } from "~/components/direction-c/CDayDetailScreen";
import { useAuth } from "~/lib/auth";
import { ProfileProvider } from "~/lib/profile-context";

export default function NgayDetailRoute() {
  const { user, loading } = useAuth();

  const screen = (
    <AppShellViewport>
      <CDayDetailScreen />
    </AppShellViewport>
  );

  if (loading) {
    return (
      <AppShellViewport>
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Đang tải…
        </div>
      </AppShellViewport>
    );
  }

  if (user) {
    return <ProfileProvider user={user}>{screen}</ProfileProvider>;
  }

  return screen;
}
