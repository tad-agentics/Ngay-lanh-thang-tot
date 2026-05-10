/**
 * Sample persona — canonical QA fixture per FE-HANDOFF §5.
 *
 * Use this user across EVERY dev fixture, screenshot, Storybook entry, and
 * E2E test so QA can spot inconsistencies at a glance.
 *
 * Never use a different fake user unless the scenario explicitly requires it
 * (e.g. testing the "no lá số" state — use the same name but without birth data).
 */

export const SAMPLE_PERSONA = {
  hoTen: "Nguyễn Thị Minh",
  gioiTinh: "Nữ" as const,
  ngaySinh: "1990-05-20",
  ngaySinhDisplay: "20/05/1990",
  gioSinh: "Mão (5–7h)",
  gioSinhCode: 2,

  // Bát Tự / Tứ Trụ
  nhatChu: "Quý Thuỷ",
  napAm: "Trường Lưu Thuỷ",
  truPillars: [
    { label: "Năm", can: "Quý", chi: "Hợi", color: "#3a5d8a" },
    { label: "Tháng", can: "Đinh", chi: "Tỵ", color: "#8b4a2a" },
    { label: "Ngày", can: "Bính", chi: "Tuất", color: "#9a7c22" },
    { label: "Giờ", can: "Mậu", chi: "Mão", color: "#3d6b4a" },
  ],
  daiVan: "Giáp Dần · Mộc · 32 → 41 tuổi",

  // Mock "today" for UI demos
  todayMock: "2026-05-11",
  todayDisplay: "Thứ Hai · 11/05/2026 · ngày Bính Tuất",

  // Avatar initials
  initials: "NM",
  monoline: "QUÝ THUỶ · 20/05/1990 · MÃO",
} as const;

export type SamplePersona = typeof SAMPLE_PERSONA;
