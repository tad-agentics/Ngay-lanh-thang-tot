import type { LlmProfile } from "./llm.ts";

/**
 * `deepseek-v4-pro` + thinking: `la-so-chi-tiet`, tiểu vận tháng (`tieu-van`), lưu niên (`luu-nien`).
 * Mọi endpoint khác (ngày, chọn ngày, hợp tuổi, phong-thuy, la-so, dai-van, …) → `deepseek-v4-flash`.
 */
export const DEEPSEEK_PRO_ENDPOINTS = new Set([
  "la-so-chi-tiet",
  "tieu-van",
  "luu-nien",
]);

export function llmProfileForEndpoint(endpoint: string): LlmProfile {
  return DEEPSEEK_PRO_ENDPOINTS.has(endpoint) ? "pro" : "flash";
}
