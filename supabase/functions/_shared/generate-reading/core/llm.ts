/**
 * Luận giải LLM client — DeepSeek OpenAI-compatible Chat Completions.
 * @see https://api-docs.deepseek.com/
 */
import {
  DEEPSEEK_API_BASE,
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_MODEL_PRO,
  LA_SO_CHI_TIET_TIMEOUT_MS,
  READING_MAX_TOKENS_DEFAULT,
  REQUEST_TIMEOUT_MS,
} from "./config.ts";
import { llmProfileForEndpoint } from "./llm-profiles.ts";
import type { ChatMessage } from "./thread-history.ts";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_cache_hit_tokens?: number;
    prompt_cache_miss_tokens?: number;
  };
  error?: { message?: string; type?: string; code?: string };
};

/** Mọi endpoint luận giải dùng `flash`; `pro` chỉ khi endpoint nằm trong `DEEPSEEK_PRO_ENDPOINTS`. */
export type LlmProfile = "flash" | "pro";

export type LlmCompletionOptions = {
  jsonMode?: boolean;
  profile?: LlmProfile;
  /** Paywall preview — tránh thinking ăn hết `max_tokens`, để `content` còn chỗ cho JSON. */
  disableThinking?: boolean;
};

function resolveModel(profile: LlmProfile): string {
  if (profile === "pro") {
    return Deno.env.get("DEEPSEEK_MODEL_PRO")?.trim() || DEFAULT_LLM_MODEL_PRO;
  }
  return Deno.env.get("DEEPSEEK_MODEL")?.trim() || DEFAULT_LLM_MODEL;
}

function thinkingEnabled(
  profile: LlmProfile,
  options: LlmCompletionOptions,
): boolean {
  if (options.disableThinking) return false;
  if (profile === "pro") return true;
  // Flash default off — faster, avoids reasoning eating max_tokens → empty content.
  const v = Deno.env.get("DEEPSEEK_THINKING")?.trim().toLowerCase();
  if (v === "enabled" || v === "1" || v === "true") return true;
  return false;
}

export async function llmChat(
  messages: ChatMessage[],
  maxTokens: number,
  timeoutMs: number,
  options: LlmCompletionOptions = {},
): Promise<string | null> {
  const key = Deno.env.get("DEEPSEEK_API_KEY");
  if (!key?.trim()) {
    console.warn("[luận-giải] Thiếu biến môi trường DEEPSEEK_API_KEY");
    return null;
  }

  const profile = options.profile ?? "flash";
  const model = resolveModel(profile);
  const thinkingOn = thinkingEnabled(profile, options);

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    stream: false,
    thinking: { type: thinkingOn ? "enabled" : "disabled" },
  };

  if (thinkingOn) {
    body.reasoning_effort =
      Deno.env.get("DEEPSEEK_REASONING_EFFORT")?.trim() || "high";
  } else {
    body.temperature = 0.7;
  }

  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key.trim()}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.warn(
        "[luận-giải] DeepSeek HTTP",
        res.status,
        model,
        errBody.slice(0, 500),
      );
      return null;
    }

    const data = (await res.json()) as ChatCompletionResponse;
    if (data.error?.message) {
      console.warn("[luận-giải] DeepSeek error:", data.error.message);
      return null;
    }

    const usage = data.usage;
    if (
      usage &&
      (usage.prompt_cache_hit_tokens != null ||
        usage.prompt_cache_miss_tokens != null)
    ) {
      console.info(
        "[luận-giải] DeepSeek cache",
        model,
        "hit=",
        usage.prompt_cache_hit_tokens ?? 0,
        "miss=",
        usage.prompt_cache_miss_tokens ?? 0,
      );
    }

    const choice = data.choices?.[0];
    const msg = choice?.message;
    const text = msg?.content?.trim() ?? "";
    if (!text) {
      const reasoningLen = msg?.reasoning_content?.trim().length ?? 0;
      console.warn(
        "[luận-giải] DeepSeek content rỗng",
        model,
        "finish=",
        choice?.finish_reason ?? "n/a",
        "reasoning_chars=",
        reasoningLen,
        "max_tokens=",
        maxTokens,
        "thinking=",
        thinkingOn,
      );
      return null;
    }
    return text;
  } catch (e) {
    console.warn("[luận-giải] Lỗi DeepSeek:", e);
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function llmCompletion(
  system: string,
  userJson: string,
  maxTokens: number,
  timeoutMs: number,
  options: LlmCompletionOptions = {},
): Promise<string | null> {
  return await llmChat(
    [
      { role: "system", content: system },
      { role: "user", content: userJson },
    ],
    maxTokens,
    timeoutMs,
    options,
  );
}

export async function llmLegacyProse(
  systemPrompt: string,
  userJson: string,
  maxTokens: number = READING_MAX_TOKENS_DEFAULT,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
  profile: LlmProfile = "flash",
): Promise<string | null> {
  return await llmCompletion(systemPrompt, userJson, maxTokens, timeoutMs, {
    profile,
    ...(profile === "flash" ? { disableThinking: true } : {}),
  });
}

export async function llmLaSoChiTietJson(
  system: string,
  userJson: string,
  maxTokens = 2048,
  options: Pick<LlmCompletionOptions, "disableThinking"> & {
    timeoutMs?: number;
  } = {},
): Promise<string | null> {
  const { timeoutMs, ...llmOpts } = options;
  return await llmCompletion(
    system,
    userJson,
    maxTokens,
    timeoutMs ?? LA_SO_CHI_TIET_TIMEOUT_MS,
    {
      jsonMode: true,
      profile: llmProfileForEndpoint("la-so-chi-tiet"),
      disableThinking: true,
      ...llmOpts,
    },
  );
}
