import type { TuTruIntent } from "~/lib/api-types";
import { TU_TRU_INTENT_OPTIONS } from "~/lib/tu-tru-intents";

const TRA_CUU_PRESET_KEY = "ngaytot.tra-cuu.preset.v1";

export type TraCuuIntentPreset = {
  intent: TuTruIntent;
  intentLabel: string;
};

const PURPOSE_TO_INTENT: Record<string, TuTruIntent> = {
  "cưới hỏi": "CUOI_HOI",
  "hợp tác": "KY_HOP_DONG",
  "cộng sự": "KY_HOP_DONG",
  "sống chung": "CUOI_HOI",
};

export function purposeLabelToTraCuuIntent(
  purposeLabel: string | null | undefined,
): TraCuuIntentPreset | null {
  const key = purposeLabel?.trim().toLowerCase();
  if (!key) return null;
  const intent = PURPOSE_TO_INTENT[key];
  if (!intent) return null;
  const intentLabel =
    TU_TRU_INTENT_OPTIONS.find((o) => o.value === intent)?.label ?? intent;
  return { intent, intentLabel };
}

export function stashTraCuuIntentPreset(preset: TraCuuIntentPreset): void {
  try {
    sessionStorage.setItem(TRA_CUU_PRESET_KEY, JSON.stringify(preset));
  } catch {
    // ignore
  }
}

export function consumeTraCuuIntentPreset(): TraCuuIntentPreset | null {
  try {
    const raw = sessionStorage.getItem(TRA_CUU_PRESET_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(TRA_CUU_PRESET_KEY);
    const parsed = JSON.parse(raw) as TraCuuIntentPreset;
    if (!parsed?.intent || !parsed.intentLabel) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type HopTuoiNextStepCopy = {
  kicker: string;
  body: string;
  cta: string;
  preset: TraCuuIntentPreset | null;
};

export function buildHopTuoiNextStepCopy(args: {
  purposeLabel?: string | null;
  naphAm1: string;
  naphAm2: string;
}): HopTuoiNextStepCopy {
  const purpose = args.purposeLabel?.trim().toLowerCase() ?? "";
  const preset = purposeLabelToTraCuuIntent(purpose);
  const pair =
    args.naphAm1 !== "—" && args.naphAm2 !== "—"
      ? `${args.naphAm1} × ${args.naphAm2}`
      : "cả hai mệnh";

  if (purpose.includes("cưới")) {
    return {
      kicker: "Có sẵn với gói lịch · gợi ý tiếp theo",
      body: `Tra cứu ngày tốt cho lễ cưới theo ${pair} — chấm điểm chéo Can Chi.`,
      cta: "Tra cứu ngày cưới →",
      preset,
    };
  }
  if (purpose.includes("hợp tác") || purpose.includes("cộng sự")) {
    return {
      kicker: "Có sẵn với gói lịch · gợi ý tiếp theo",
      body: `Tra cứu ngày ký hợp đồng / hợp tác theo ${pair}.`,
      cta: "Tra cứu ngày hợp tác →",
      preset,
    };
  }
  if (purpose.includes("sống chung")) {
    return {
      kicker: "Có sẵn với gói lịch · gợi ý tiếp theo",
      body: `Tra cứu ngày chung sống / an cư theo ${pair}.`,
      cta: "Tra cứu ngày an cư →",
      preset: preset ?? purposeLabelToTraCuuIntent("cưới hỏi"),
    };
  }

  return {
    kicker: "Gợi ý tiếp theo",
    body: `Tra cứu ngày tốt theo ${pair} — chấm điểm chéo Can Chi.`,
    cta: "Tra cứu ngày lành →",
    preset,
  };
}
