import { Link } from "react-router";

import { useMarketingConsent } from "~/hooks/useMarketingConsent";
import { CT } from "~/lib/c-tokens";
import { isMetaPixelRuntimeEnabled } from "~/lib/meta-pixel";

/** First-visit marketing / analytics consent (Meta Pixel). */
export function MetaPixelConsentBanner() {
  const { needsPrompt, setConsent } = useMarketingConsent();

  if (!isMetaPixelRuntimeEnabled() || !needsPrompt) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Thông báo cookie và đo lường quảng cáo"
      className="fixed inset-x-0 bottom-0 z-[190] border-t px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(24,21,14,0.12)]"
      style={{
        background: CT.paper,
        borderColor: CT.hairline,
        color: CT.ink,
        fontFamily: "var(--serif)",
      }}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-3">
        <p className="m-0 text-[13.5px] leading-relaxed" style={{ color: CT.ink2 }}>
          Chúng tôi dùng cookie và công cụ đo lường (Meta Pixel) để hiểu lượt truy cập
          và tối ưu quảng cáo. Bạn có thể từ chối — ứng dụng vẫn dùng bình thường.{" "}
          <Link
            to="/chinh-sach-bao-mat"
            className="font-semibold no-underline"
            style={{ color: CT.goldDeep }}
          >
            Xem chính sách bảo mật
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className="cursor-pointer border bg-transparent px-4 py-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
            style={{ borderColor: CT.hairline, color: CT.ink2 }}
          >
            Từ chối
          </button>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="flex-1 cursor-pointer border-none px-4 py-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.08em]"
            style={{ background: CT.forest, color: CT.cream }}
          >
            Chấp nhận
          </button>
        </div>
      </div>
    </div>
  );
}
