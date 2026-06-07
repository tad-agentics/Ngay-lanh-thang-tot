import type { LlmProfile } from "./llm.ts";

/**
 * Mọi endpoint luận giải dùng `deepseek-v4-flash`, không thinking (tốc độ + tránh reasoning ăn max_tokens).
 * Giữ set để bump endpoint cụ thể lên pro sau này nếu cần.
 */
export const DEEPSEEK_PRO_ENDPOINTS = new Set<string>();

export function llmProfileForEndpoint(_endpoint: string): LlmProfile {
  return DEEPSEEK_PRO_ENDPOINTS.has(_endpoint) ? "pro" : "flash";
}
