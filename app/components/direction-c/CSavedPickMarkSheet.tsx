import { useEffect, useMemo, useState } from "react";

import { Mono } from "~/components/brand";
import type { TuTruIntent } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import {
  buildGoogleCalendarReminderUrl,
  buildGoogleCalendarUrl,
  downloadSavedPickIcs,
  openGoogleCalendarUrl,
  readAddToGoogleCalendarPreference,
  writeAddToGoogleCalendarPreference,
} from "~/lib/saved-pick-calendar";
import {
  buildSuggestedPickLabels,
  labelToIntent,
  SAVED_PICK_GENERIC_LABEL,
} from "~/lib/saved-pick-mark";
import { TU_TRU_INTENT_OPTIONS } from "~/lib/tu-tru-intents";

const CHON_NGAY_OPTIONS = TU_TRU_INTENT_OPTIONS.filter((o) => o.value !== "MAC_DINH");
const NOTE_MAX_LENGTH = 200;

export type CSavedPickMarkSheetProps = {
  open: boolean;
  mode: "create" | "edit";
  dayIso: string;
  score?: number;
  suggestedLabels: string[];
  initialLabel?: string;
  initialNote?: string | null;
  initialIntent?: TuTruIntent | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (values: {
    label: string;
    intent: TuTruIntent | null;
    note: string | null;
    addToGoogleCalendar: boolean;
  }) => void | Promise<void>;
};

export function CSavedPickMarkSheet({
  open,
  mode,
  dayIso,
  score,
  suggestedLabels,
  initialLabel = "",
  initialNote = "",
  initialIntent = null,
  busy = false,
  onClose,
  onConfirm,
}: CSavedPickMarkSheetProps) {
  const [label, setLabel] = useState(initialLabel);
  const [note, setNote] = useState(initialNote ?? "");
  const [showAllIntents, setShowAllIntents] = useState(false);
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(() =>
    readAddToGoogleCalendarPreference(),
  );

  useEffect(() => {
    if (!open) return;
    setLabel(initialLabel.trim() || SAVED_PICK_GENERIC_LABEL);
    setNote(initialNote ?? "");
    setShowAllIntents(false);
    setAddToGoogleCalendar(readAddToGoogleCalendarPreference());
  }, [open, initialLabel, initialNote]);

  const chips = useMemo(() => {
    const merged = buildSuggestedPickLabels({
      prefill: initialLabel,
      goodFor: suggestedLabels,
      limit: 10,
    });
    return merged;
  }, [initialLabel, suggestedLabels]);

  const calendarDraft = useMemo(
    () => ({
      dayIso,
      label: label.trim() || SAVED_PICK_GENERIC_LABEL,
      note: note.trim() || null,
      score: score ?? null,
    }),
    [dayIso, label, note, score],
  );

  const dateDot = useMemo(() => {
    const [y, m, d] = dayIso.split("-");
    if (!y || !m || !d) return dayIso;
    return `${d}.${m}.${y}`;
  }, [dayIso]);

  if (!open) return null;

  async function handleSubmit() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const intent = labelToIntent(trimmed);
    writeAddToGoogleCalendarPreference(addToGoogleCalendar);
    await onConfirm({
      label: trimmed,
      intent,
      note: note.trim() || null,
      addToGoogleCalendar,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end"
      style={{ background: "rgba(24,21,14,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-pick-sheet-title"
    >
      <button
        type="button"
        className="min-h-0 flex-1 cursor-default border-none bg-transparent"
        aria-label="Đóng"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        className="max-h-[min(88vh,640px)] overflow-y-auto px-6 pb-8 pt-5"
        style={{ background: CT.paper, fontFamily: "var(--serif)" }}
      >
        <Mono style={{ color: CT.muted, fontSize: 9.5 }}>
          {mode === "edit" ? "Sửa đánh dấu" : "Đánh dấu ngày"}
        </Mono>
        <h2
          id="saved-pick-sheet-title"
          className="mt-1 font-[family-name:var(--display)] text-[22.5px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em]"
          style={{ color: CT.ink }}
        >
          Cho việc gì?
        </h2>
        <p className="mt-2 text-[13.5px] leading-snug" style={{ color: CT.ink2 }}>
          Ngày <strong style={{ fontWeight: 600 }}>{dateDot}</strong>
          {score != null ? (
            <>
              {" "}
              · điểm <strong style={{ fontWeight: 600 }}>{score}</strong>
            </>
          ) : null}
        </p>

        <div className="mt-4 font-serif text-[12px]" style={{ color: CT.muted }}>
          Gợi ý
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((chip) => {
            const sel = label.toLowerCase() === chip.toLowerCase();
            return (
              <button
                key={chip}
                type="button"
                disabled={busy}
                onClick={() => setLabel(chip)}
                className="cursor-pointer border px-2.5 py-1.5 font-serif text-[12px] disabled:opacity-50"
                style={{
                  borderColor: sel ? CT.goldDeep : CT.hairline,
                  background: sel ? "rgba(154,124,34,0.1)" : "#fff",
                  color: sel ? CT.goldDeep : CT.ink,
                  fontWeight: sel ? 600 : 400,
                }}
              >
                {chip}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => setShowAllIntents((o) => !o)}
          className="mt-3 cursor-pointer border-none bg-transparent p-0 font-serif text-xs underline"
          style={{ color: CT.goldDeep }}
        >
          {showAllIntents ? "Thu gọn danh sách việc" : "Xem 28 việc"}
        </button>

        {showAllIntents ? (
          <div
            className="mt-2 max-h-40 overflow-y-auto border"
            style={{ borderColor: CT.hairline }}
          >
            {CHON_NGAY_OPTIONS.map((opt) => {
              const sel = label.toLowerCase() === opt.label.toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={busy}
                  onClick={() => setLabel(opt.label)}
                  className="block w-full cursor-pointer border-none px-3 py-2 text-left font-serif text-[13px] disabled:opacity-50"
                  style={{
                    color: sel ? CT.goldDeep : CT.ink,
                    fontWeight: sel ? 600 : 400,
                    borderBottom: `1px solid ${CT.hairline2}`,
                    background: sel ? "rgba(154,124,34,0.06)" : "transparent",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-5">
          <label
            htmlFor="saved-pick-label"
            className="font-serif text-[12px]"
            style={{ color: CT.muted }}
          >
            Việc đã chọn
          </label>
          <input
            id="saved-pick-label"
            type="text"
            value={label}
            disabled={busy}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full border bg-white px-3 py-2.5 font-[family-name:var(--display-2)] text-[15px] font-semibold tracking-[-0.005em] outline-none disabled:opacity-60"
            style={{ borderColor: CT.goldDeep, color: CT.ink }}
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="saved-pick-note"
            className="font-serif text-[12px]"
            style={{ color: CT.muted }}
          >
            Ghi chú (tuỳ chọn)
          </label>
          <input
            id="saved-pick-note"
            type="text"
            value={note}
            disabled={busy}
            maxLength={NOTE_MAX_LENGTH}
            placeholder="Vd. Lễ tại nhà thờ…"
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full border bg-white px-3 py-2 font-serif text-[13.5px] outline-none disabled:opacity-60"
            style={{ borderColor: CT.hairline, color: CT.ink }}
          />
        </div>

        {initialIntent && initialIntent !== "MAC_DINH" ? (
          <p className="mt-2 font-serif text-[11px]" style={{ color: CT.muted }}>
            Tra cứu: {CHON_NGAY_OPTIONS.find((o) => o.value === initialIntent)?.label}
          </p>
        ) : null}

        <label
          className="mt-5 flex cursor-pointer items-start gap-2.5"
          style={{ color: CT.ink2 }}
        >
          <input
            type="checkbox"
            checked={addToGoogleCalendar}
            disabled={busy}
            onChange={(e) => setAddToGoogleCalendar(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#0e1c14]"
          />
          <span className="font-serif text-[13px] leading-snug">
            <strong style={{ fontWeight: 600, color: CT.ink }}>Thêm vào Google Calendar</strong>
            <span className="mt-0.5 block text-[11.5px]" style={{ color: CT.muted }}>
              Sự kiện cả ngày sau khi lưu · nhắc trước 1 ngày (tùy chọn bên dưới)
            </span>
          </span>
        </label>

        {addToGoogleCalendar && dayIso ? (
          <div className="ml-6 mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => openGoogleCalendarUrl(buildGoogleCalendarUrl(calendarDraft))}
              className="cursor-pointer border-none bg-transparent p-0 font-serif text-[11.5px] underline disabled:opacity-50"
              style={{ color: CT.goldDeep }}
            >
              Xem trên Google Calendar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                openGoogleCalendarUrl(buildGoogleCalendarReminderUrl(calendarDraft))
              }
              className="cursor-pointer border-none bg-transparent p-0 font-serif text-[11.5px] underline disabled:opacity-50"
              style={{ color: CT.goldDeep }}
            >
              Nhắc hôm trước
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => downloadSavedPickIcs(calendarDraft)}
              className="cursor-pointer border-none bg-transparent p-0 font-serif text-[11.5px] underline disabled:opacity-50"
              style={{ color: CT.muted }}
            >
              Tải .ics
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!busy) onClose();
            }}
            className="flex-1 cursor-pointer border py-3 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em] disabled:opacity-50"
            style={{ borderColor: CT.hairline, background: "transparent", color: CT.ink }}
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={busy || !label.trim()}
            onClick={() => void handleSubmit()}
            className="flex-1 cursor-pointer border-none py-3 font-[family-name:var(--display-2)] text-xs font-extrabold uppercase tracking-[0.06em] disabled:opacity-50"
            style={{
              fontFamily: "var(--display-2)",
              background: CT.forest,
              color: CT.cream,
            }}
          >
            {busy ? "Đang lưu…" : mode === "edit" ? "Lưu thay đổi" : "Lưu vào sổ"}
          </button>
        </div>
      </div>
    </div>
  );
}
