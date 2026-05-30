/**
 * Direction C — CSplash (artboard 01)
 */

import { useEffect } from "react";
import { useNavigate } from "react-router";

import { Logo, Mono } from "~/components/brand";
import { useAuth } from "~/lib/auth";
import { CT } from "~/lib/c-tokens";
import { supabase } from "~/lib/supabase";

export default function SplashRoute() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/dang-nhap", { replace: true });
      return;
    }

    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed_at, ngay_sinh, gio_sinh")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.onboarding_completed_at) {
        navigate("/lich", { replace: true });
      } else {
        const hasDate =
          data?.ngay_sinh != null && String(data.ngay_sinh).trim() !== "";
        const hasGio =
          data?.gio_sinh != null && String(data.gio_sinh).trim() !== "";
        navigate(hasDate && hasGio ? "/dang-dung-lich" : "/dang-ky", {
          replace: true,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, navigate, user]);

  return (
    <main
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden"
      style={{ background: CT.forest, color: CT.cream }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 320,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(197,165,90,0.14) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <Logo dark size={52} showUrl />
        <div className="max-w-[280px] text-center">
          <Mono style={{ color: CT.gold, fontSize: 10.5, letterSpacing: "0.22em" }}>
            Đang mở lịch của bạn
          </Mono>
          <p
            className="mt-3 font-serif text-sm italic leading-[1.5]"
            style={{ color: "rgba(237,231,211,0.65)" }}
          >
            "Mỗi ngày một trang — của riêng bạn."
          </p>
        </div>
        <div
          className="relative h-[1.5px] w-[72px] overflow-hidden"
          style={{ background: "rgba(197,165,90,0.3)" }}
        >
          <div
            className="absolute bottom-0 left-0 top-0 w-[40%]"
            style={{ background: CT.gold }}
          />
        </div>
      </div>
    </main>
  );
}
