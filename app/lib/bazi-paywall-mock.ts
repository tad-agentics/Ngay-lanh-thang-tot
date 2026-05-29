import {
  baziOutlineSections,
  type BaziOutlineKey,
} from "~/lib/bazi-reading-outline";
import type {
  DaiVanNextView,
  LuuNienFactsView,
  LuuNienQuyNhanFacts,
} from "~/lib/luu-nien-facts-ui";
import type { PhongThuyFactsView } from "~/lib/phong-thuy-facts-ui";
import type { PersonalityTraitView } from "~/lib/personality-traits-ui";

const MONTH_SCORES_PLACEHOLDER = [
  55, 62, 70, 68, 76, 48, 42, 65, 78, 80, 72, 68,
] as const;

function paywallVanNamFacts(yearCanChi: string): LuuNienFactsView {
  const y = yearCanChi.trim();
  const yearRef = y ? `Năm ${y}` : "Năm này";
  return {
    yearCanChi: y || null,
    yearRating: "Năm tốt · củng cố",
    yearTheme: y
      ? `"${y} — giai đoạn nuôi dưỡng nền tảng; chưa phải lúc mở rộng mạnh."`
      : `"${yearRef} — giai đoạn nuôi dưỡng nền tảng; chưa phải lúc mở rộng mạnh."`,
    lifeAreas: [
      {
        id: "tai_loc",
        label: "Tài lộc",
        verdict: "Trung bình ↑",
        detail:
          "Thu nhập ổn, tránh đầu tư mạo hiểm. Quý 3 âm lịch thuận cho ký kết.",
      },
      {
        id: "su_nghiep",
        label: "Sự nghiệp",
        verdict: "Tiến triển",
        detail:
          "Cơ hội thăng tiến cuối năm. Quý nhân thường đến từ phương Bắc.",
      },
      {
        id: "tinh_duyen",
        label: "Tình duyên",
        verdict: "Ổn định",
        detail:
          "Độc thân — quý nhân quanh tháng 10. Có đôi — tránh tranh cãi tháng xung.",
      },
      {
        id: "suc_khoe",
        label: "Sức khỏe",
        verdict: "Cẩn trọng",
        detail:
          "Tâm–thận cần chú ý, giảm stress. Khám sức khỏe đầu năm.",
      },
    ],
    warnings: [
      {
        title: "Cảnh báo",
        body: "Cẩn thận các tháng xung khắc với nhật chủ — tránh cam kết lớn hoặc chuyến đi xa khi chưa rõ lịch.",
      },
    ],
    monthScores: [...MONTH_SCORES_PLACEHOLDER],
    quyNhan: null,
    daiVanNext: null,
  };
}

function paywallPhongThuyFacts(): PhongThuyFactsView {
  return {
    huongTot: [
      { name: "Đông Nam", sub: "Sinh Khí — tài lộc", highlight: true },
      { name: "Bắc", sub: "Diên Niên — sức khỏe", highlight: false },
      { name: "Đông", sub: "Thiên Y — quý nhân", highlight: false },
      { name: "Nam", sub: "Phục Vị — bình ổn", highlight: false },
    ],
    huongXau: ["Tây Bắc (Tuyệt Mệnh)", "Tây Nam (Hoạ Hại)"],
    mauMay: [
      { name: "Trắng", hex: "#e8e6df" },
      { name: "Xám", hex: "#8a8c8c" },
      { name: "Xanh đậm", hex: "#1d2538" },
      { name: "Xanh rêu", hex: "#1d3129" },
    ],
    mauKy: ["vàng đậm", "nâu", "đỏ chói"],
    phiTinh: [
      { direction: "Tây Nam", star: "2 Bệnh", tone: "bad" },
      { direction: "Đông", star: "7 Phá", tone: "bad" },
      { direction: "Đông Nam", star: "9 Hỷ", tone: "good" },
      { direction: "Bắc", star: "6 Tài", tone: "good" },
      { direction: "Trung", star: "5 Tử", tone: "bad" },
      { direction: "Nam", star: "1 Bạch", tone: "good" },
      { direction: "Đông Bắc", star: "4 Văn", tone: "good" },
      { direction: "Tây", star: "3 Thị", tone: "neutral" },
      { direction: "Tây Bắc", star: "8 Tài", tone: "good" },
    ],
    phiTinhNote:
      "Trung cung — sao 5 Tử đáo. Hạn chế đào xới, sửa chữa giữa nhà trong năm đang luận.",
  };
}

function paywallTinhCachMock(): {
  traits: PersonalityTraitView[];
  introProse: string;
} {
  return {
    introProse:
      "Lá số cho thấy bạn có xu hướng suy nghĩ trước khi hành động, giữ nhịp ổn định trong công việc và quan hệ. Đoạn mở này minh họa bản luận đầy đủ sau khi mở khóa.",
    traits: [
      {
        id: "strength",
        title: "Điểm mạnh",
        text: "Trí phân tích sắc, kiên trì với mục tiêu dài hạn. Người xung quanh thường tin cậy khi cần sự tỉ mỉ.",
      },
      {
        id: "personality",
        title: "Cá tính nổi bật",
        text: "Bề ngoài điềm tĩnh, bên trong sâu sắc. Cảm thông tự nhiên với người yếu thế.",
      },
      {
        id: "note",
        title: "Điểm cần lưu ý",
        text: "Dễ tự gây áp lực khi cầu toàn. Khi mệt nên chủ động tìm hỗ trợ thay vì thu mình.",
      },
      {
        id: "love",
        title: "Tình cảm & quan hệ",
        text: "Yêu sâu nhưng chậm bộc lộ. Hợp người bổ sung phần thiếu của lá số — cần đối phương kiên nhẫn.",
      },
    ],
  };
}

function paywallQuyNhanFacts(): {
  quyNhan: LuuNienQuyNhanFacts;
  daiVanNext: DaiVanNextView;
} {
  return {
    quyNhan: {
      tuoiHop: ["Thân", "Tý", "Thìn"],
      tuoiXung: ["Tỵ", "Hợi"],
      huongQuyNhan: "Bắc",
      note: "Tam hợp hỗ trợ — nên ưu tiên hợp tác với người tuổi hợp.",
    },
    daiVanNext: {
      display: "Đại vận kế tiếp",
      themeVi:
        "Kim sinh Thủy — thời cơ phát triển sự nghiệp nếu biết tận dụng quý nhân.",
      yearsLabel: null,
    },
  };
}

export type BaziPaywallLockedChapter =
  | {
      key: "tinh_cach";
      index: number;
      title: string;
      traits: PersonalityTraitView[];
      introProse: string;
    }
  | {
      key: "van_nam";
      index: number;
      title: string;
      facts: LuuNienFactsView;
    }
  | {
      key: "phong_thuy";
      index: number;
      title: string;
      facts: PhongThuyFactsView;
    }
  | {
      key: "quy_nhan";
      index: number;
      title: string;
      quyNhan: LuuNienQuyNhanFacts;
      daiVanNext: DaiVanNextView;
    };

export function baziPaywallLockedChapters(
  yearCanChi: string,
): BaziPaywallLockedChapter[] {
  const outline = baziOutlineSections(yearCanChi);
  const keys: Exclude<BaziOutlineKey, "menh_tong_quan">[] = [
    "tinh_cach",
    "van_nam",
    "phong_thuy",
    "quy_nhan",
  ];

  return keys.map((key) => {
    const meta = outline.find((o) => o.key === key)!;
    switch (key) {
      case "tinh_cach": {
        const tc = paywallTinhCachMock();
        return {
          key,
          index: meta.index,
          title: meta.title,
          traits: tc.traits,
          introProse: tc.introProse,
        };
      }
      case "van_nam":
        return {
          key,
          index: meta.index,
          title: meta.title,
          facts: paywallVanNamFacts(yearCanChi),
        };
      case "phong_thuy":
        return {
          key,
          index: meta.index,
          title: meta.title,
          facts: paywallPhongThuyFacts(),
        };
      case "quy_nhan": {
        const q = paywallQuyNhanFacts();
        return {
          key,
          index: meta.index,
          title: meta.title,
          quyNhan: q.quyNhan,
          daiVanNext: q.daiVanNext,
        };
      }
    }
  });
}
