# DeepSeek — `generate-reading-*` Edge Functions

Luận giải via **DeepSeek V4 Flash**. Browser never calls the LLM; only Supabase Edge Functions do.

References:

- [Your First API Call](https://api-docs.deepseek.com/)
- [Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [JSON Output](https://api-docs.deepseek.com/guides/json_mode)
- [Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode)
- [Context Caching](https://api-docs.deepseek.com/guides/kv_cache) (automatic, on disk)

## Why `deepseek-v4-flash`

| | DeepSeek V4 Flash |
|---|---|
| Input (cache miss) | **$0.14 / 1M tokens** |
| Input (cache hit) | **$0.0028 / 1M** (~1/50 of miss) |
| Output | **$0.28 / 1M** (+ thinking tokens when enabled) |
| Context | **1M** (EF caps body at 180k chars) |

## API shape (OpenAI-compatible)

```
POST https://api.deepseek.com/chat/completions
Authorization: Bearer $DEEPSEEK_API_KEY
```

**Default (prose / JSON):**

```json
{
  "model": "deepseek-v4-flash",
  "messages": [
    { "role": "system", "content": "<static system prompt>" },
    { "role": "user", "content": "<stableStringify(promptBody)>" }
  ],
  "max_tokens": 512,
  "stream": false,
  "thinking": { "type": "enabled" },
  "reasoning_effort": "high"
}
```

JSON endpoints add `"response_format": { "type": "json_object" }`.

## Model routing

| Profile | Model | Endpoints | Thinking |
|---------|--------|-----------|----------|
| `flash` | `DEEPSEEK_MODEL` → `deepseek-v4-flash` | Hôm nay, chi tiết ngày, chọn ngày, hợp tuổi, phong-thuy, la-so, dai-van, … | On by default; `DEEPSEEK_THINKING=disabled` to opt out |
| `pro` | `DEEPSEEK_MODEL_PRO` → `deepseek-v4-pro` | **`la-so-chi-tiet`** (luận Bát Tự năm), **`tieu-van`**, **`luu-nien`** only | **Always on** + `reasoning_effort=high` |

Canonical list: `core/llm-profiles.ts` → `DEEPSEEK_PRO_ENDPOINTS`.

## Thinking mode

| Secret | Flash | Pro |
|--------|-------|-----|
| *(unset)* | thinking on | thinking on |
| `DEEPSEEK_THINKING=disabled` | off | **still on** |
| `DEEPSEEK_REASONING_EFFORT` | when thinking on | always |

**Trade-offs:** better grounding on long `luan_context` / multi-criteria `hop-tuoi`; extra billed tokens + latency. We only return `message.content` to the app (not `reasoning_content`).

## Context caching (automatic — no separate API)

DeepSeek [Context Caching on Disk](https://api-docs.deepseek.com/guides/kv_cache) is **on by default**. You do **not** pass cache keys or enable flags.

**What we already do (correct for cache hits):**

1. **Stable prefix first** — `system` message = full static prompt (`DAY_DETAIL_SYSTEM`, `CHON_NGAY_SYSTEM`, …).
2. **Variable tail last** — single `user` message = `stableStringify(promptBody)` (sorted keys).
3. **Day follow-ups** — `promptBody` keys sort as `endpoint` → `luan_context` → `question`. Same day + same context ⇒ large shared prefix; only `question` differs at the JSON tail ⇒ hits after repeated calls (see doc Example 2).

**What we log:** `usage.prompt_cache_hit_tokens` / `prompt_cache_miss_tokens` in Edge logs (`[luận-giải] DeepSeek cache`).

**Not guaranteed:** best-effort; prefixes &lt; 64 tokens are not cached; first request on a cold prefix is always miss.

**Do prompts need rewriting for DeepSeek?**

**No wholesale rewrite.** Prompts were written for *task shape* (Vietnamese prose, JSON keys, citations), not Gemini-specific APIs. They already work with:

- OpenAI `messages` roles
- `response_format: json_object` where needed (word “json” present)
- No references to Gemini MIME types or thinking budget

Optional polish only (not blocking):

- Remove any legacy “Gemini” comments in code/docs
- For JSON endpoints, keep explicit `JSON` / `day_readings` in system text ([JSON Output guide](https://api-docs.deepseek.com/guides/json_mode))

## Multi-turn “Hỏi tiếp” (implemented)

Follow-up requests send:

```json
{
  "endpoint": "day-detail",
  "data": "<luan_context>",
  "question": "<current>",
  "anchor_reading": "<anchor luận giải>",
  "thread_history": [
    { "role": "user", "content": "…" },
    { "role": "assistant", "content": "…" }
  ]
}
```

Edge builds messages:

1. `system` — `DAY_DETAIL_FOLLOW_UP_SYSTEM`
2. `user` — `luan_context` JSON only
3. `assistant` — anchor reading (if provided)
4. prior turns from `thread_history` (max **8** messages / 4 pairs)
5. `user` — current question

`reading_cache` key includes `thread_history` + anchor hash. Compare chip still uses `day-compare` (deterministic), not LLM.

## Supabase secrets

```bash
supabase secrets set DEEPSEEK_API_KEY=sk-…
supabase secrets set DEEPSEEK_MODEL=deepseek-v4-flash
supabase secrets set DEEPSEEK_MODEL_PRO=deepseek-v4-pro
# optional: supabase secrets set DEEPSEEK_THINKING=disabled  # flash only
```

Redeploy: `generate-reading-day`, `generate-reading-la-so`, `generate-reading-tieu-van`, `generate-reading-luu-nien`.

## Cache invalidation

`GLOBAL_LLM_VER` in `core/cache-versions.ts` — bump when changing provider/model/prompt generation.

## Code map

| File | Role |
|---|---|
| `core/llm.ts` | DeepSeek client + cache usage logging |
| `handler/create-handler.ts` | Auth, `reading_cache`, rate limit |
| `prompts/*.ts` | Provider-agnostic system strings |

Legacy monolith `generate-reading` (Gemini) removed from repo and prod.
