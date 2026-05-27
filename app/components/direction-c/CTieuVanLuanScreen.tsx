import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CTieuVanLockedScreen } from "~/components/direction-c/CTieuVanLockedScreen";
import { BackBar } from "~/components/brand";
import { useProfile } from "~/hooks/useProfile";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { CT } from "~/lib/c-tokens";
import { canUseTieuVanReading } from "~/lib/entitlements";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { profileHasLaso } from "~/lib/la-so-ui";
import { mapTieuVanPayload } from "~/lib/tieu-van-ui";

type CTieuVanLuanScreenProps = {
  year: number;
};

export function CTieuVanLuanScreen({ year }: CTieuVanLuanScreenProps) {
  const { profile, loading: profileLoading } = useProfile();
  const [reading, setReading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const unlocked = canUseTieuVanReading(profile);
  const month = `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (!unlocked || !profileHasLaso(profile.la_so)) {
      setLoading(false);
      return;
    }
    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await invokeBatTu<unknown>({
        op: "tieu-van",
        body: { ...body, month },
      });
      if (cancelled) return;
      if (!res.ok) {
        setLoading(false);
        toast.error(res.message ?? "Không tải tiểu vận.");
        return;
      }
      const ui = mapTieuVanPayload(res.data);
      const gen = await invokeGenerateReading({
        endpoint: "tieu-van",
        data: res.data,
      });
      if (cancelled) return;
      setReading(gen.reading?.trim() || ui.tongQuan || null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, unlocked, month]);

  if (profileLoading) {
    return (
      <div className="min-h-full bg-paper px-6 py-10 font-serif text-ink-2">
        Đang tải…
      </div>
    );
  }

  if (!unlocked) {
    return <CTieuVanLockedScreen year={year} />;
  }

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title={`Tiểu Vận ${year}`} subtitle="Luận giải vận tháng" />
      <div className="flex-1 px-6 pb-12 pt-2">
        {loading ? (
          <p className="text-sm" style={{ color: CT.muted }}>
            Đang soạn luận giải…
          </p>
        ) : reading ? (
          <p className="text-[15px] leading-relaxed" style={{ color: CT.ink2 }}>
            {reading}
          </p>
        ) : (
          <p className="text-sm" style={{ color: CT.muted }}>
            Chưa có luận giải cho tháng này.
          </p>
        )}
      </div>
    </div>
  );
}
