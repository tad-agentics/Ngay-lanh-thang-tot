import type { LucideIcon } from "lucide-react";
import { BookOpen, Home, TrendingUp, Users, X } from "lucide-react";
import { useNavigate } from "react-router";

import { Chip } from "~/components/Chip";

interface ExploreSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasLaso: boolean;
}

interface FeatureItem {
  id: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  route: string;
  requiresLaso: boolean;
}

const FEATURES: FeatureItem[] = [
  {
    id: "la-so",
    label: "Lá số tứ trụ",
    description: "Giải mã bản mệnh, Nhật Chủ, Dụng Thần và Đại Vận",
    Icon: BookOpen,
    route: "/app/la-so",
    requiresLaso: false,
  },
  {
    id: "van-thang",
    label: "Vận tháng",
    description: "Tổng quan tài vận, sự nghiệp, tình duyên theo tháng",
    Icon: TrendingUp,
    route: "/app/van-thang",
    requiresLaso: true,
  },
  {
    id: "hop-tuoi",
    label: "Hợp tuổi",
    description: "Kiểm tra độ tương hợp giữa hai người theo nạp âm",
    Icon: Users,
    route: "/app/hop-tuoi",
    requiresLaso: true,
  },
  {
    id: "phong-thuy",
    label: "Phong thủy",
    description: "Hướng tốt, màu hợp mệnh theo tháng",
    Icon: Home,
    route: "/app/phong-thuy",
    requiresLaso: true,
  },
];

export function ExploreSheetModal({ isOpen, onClose, hasLaso }: ExploreSheetModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleFeature = (feature: FeatureItem) => {
    onClose();
    void navigate(feature.route);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        role="presentation"
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-card border-t border-border px-4 pt-4 pb-8 w-full"
        style={{
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
        }}
      >
        <div className="w-8 h-1 bg-border rounded-full mx-auto mb-4" aria-hidden />

        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-foreground"
            style={{
              fontFamily: "var(--font-lora)",
              fontSize: "var(--text-lg)",
              fontWeight: 600,
            }}
          >
            Khám phá
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground"
            aria-label="Đóng"
            style={{
              minWidth: 44,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {FEATURES.map((f) => {
            const needsLaso = f.requiresLaso && !hasLaso;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFeature(f)}
                className="flex items-center gap-3 px-3.5 py-3 bg-background border border-border text-left transition-colors active:bg-muted w-full"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--surface)",
                    opacity: needsLaso ? 0.45 : 1,
                  }}
                >
                  <f.Icon size={18} className="text-surface-foreground" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: needsLaso ? "var(--muted-foreground)" : "var(--foreground)",
                      }}
                    >
                      {f.label}
                    </span>
                    {needsLaso ? (
                      <Chip color="default" size="sm" radius="sm">
                        Cần lá số trước
                      </Chip>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5 truncate">{f.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {!hasLaso ? (
          <p className="text-muted-foreground text-xs text-center mt-4 leading-relaxed">
            Lập lá số tứ trụ để mở khoá Vận tháng, Hợp tuổi và Phong thủy.
          </p>
        ) : null}
      </div>
    </div>
  );
}
