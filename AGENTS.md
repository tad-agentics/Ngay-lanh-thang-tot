# AGENTS.md — RAD Multi-Agent Team

> Tech Lead reads this file as the primary reference. Specialist agents read their own `.cursor/agents/` files and auto-injected rules. This file defines the team structure, workflow, and shared conventions.

---

## Stack

React Router v7 (Vite) · Supabase (DB + Auth + RLS + Edge Functions + Storage) · Vercel · Tailwind CSS · Figma Make

**Luận giải Edge (DeepSeek):** `generate-reading-day` · `generate-reading-la-so` · `generate-reading-tieu-van` (vận tháng) · `generate-reading-luu-nien` (vận năm §03 Bát Tự).

---

## Rule Authority (when files conflict)

Multiple files contain overlapping rules. When they disagree, follow this precedence — highest wins:

1. **`.cursor/rules/*.mdc`** — auto-injected behavioral constraints. These are the law. If a `.mdc` rule contradicts an agent file or skill file, the `.mdc` rule wins.
2. **`.cursor/agents/*.md`** — agent-specific workflow and deliverables. Defines what to build and in what order.
3. **`.cursor/skills/*.md`** — detailed phase instructions and output templates. Defines how to build a specific artifact.
4. **`.cursor/commands/*.md`** — dispatch orchestration. Defines the sequence of agent invocations.

In practice: `.mdc` rules define the code standards. Agent files define the work. Skill files define the artifact format. Commands define the workflow. If an agent file says "create an Edge Function" and `backend.mdc` says "Edge Functions use Deno.serve with signature verification," the agent creates the function with that pattern.

---

## Agent Team

| Agent | Role | Agent file | Invoked via |
|---|---|---|---|
| **Tech Lead** | Human-facing orchestrator. Owns architecture, state, and approvals. | _(main Cursor session)_ | Direct |
| **Product Designer** | Screen planning + Figma Make prompt guidance + visual QA. | `product-designer.md` | `/phase2`, `/visual-audit` |
| **Backend Developer** | DB schema, migrations, RLS, Edge Functions, webhooks, cron. | `backend-developer.md` | `/foundation`, `/feature` |
| **Frontend Developer** | Screens (ported from Figma Make TSX), shared components, mobile viewport. | `frontend-developer.md` | `/foundation`, `/feature` |
| **QA Agent** | Feature validation + pre-handoff safety audit. | `qa-agent.md` | `/feature`, pre-handoff |
| **DevOps Agent** | Production deploy. Runs once after QA sign-off. | `devops-agent.md` | `/deploy` |
| **Research Agent** | External dependency research. Produces integration docs. | `research-agent.md` | `/research`, auto from `/phase4` and `/new-feature` |

The human communicates exclusively with the Tech Lead. Sub-agents never communicate with the human directly.

---

## Agent Dispatch

All specialists are used proactively. When choosing which subagent to launch:

| Task | Subagent |
|---|---|
| Any backend work — tables, migrations, RLS, Edge Functions, logic changes | `backend-developer` |
| Any UI work — screens, components, interactions, navigation, styling | `frontend-developer` |
| Validate a completed feature end-to-end | `qa-agent` |
| Any design work — screen specs, Make prompts, visual audit | `product-designer` |
| Any deployment work | `devops-agent` |
| Research an external integration (API docs, SDK, webhooks) | `research-agent` |

---

## Workflow

| Phase | Command | Who | Gate |
|---|---|---|---|
| **Init** | `/init` | Tech Lead | Confirm Phase 1 artifacts present |
| **Phase 2** | `/phase2` | Product Designer | Human approves screen specs + Figma Make brief |
| **Figma Make** | _(human-driven)_ | Human in Figma Make | Make code copied to `src/make-import/` |
| **Phase 4** | `/phase4` | Tech Lead | Human approves tech spec |
| **Setup** | `/setup` | Tech Lead | Human approves build plan |
| **Foundation** | `/foundation` | Backend (infra + SEO/PWA) → Frontend (Make import + component inventory + Tailwind config + landing + auth) | Auto-proceeds after commit |
| **Waves (W1–W4)** | `/wave w1` … `/wave w4` | Same as **`/feature`** for that wave’s `feature id` — see `artifacts/plans/build-plan.md` | Same as `/feature` |
| **Features** | `/feature [name]` | Backend → Frontend → QA **per feature id** (`auth-profile-billing`, `core-loop`, …) **in dependency order** | Human approves each QA PASS |
| **Visual audit** | `/visual-audit [url]` | Product Designer | Fix all BLOCKING findings |
| **Pre-handoff** | `/pre-handoff` | QA Agent | Human approves |
| **Deploy** | `/deploy [ref]` | DevOps Agent | — |

Blocking gates are enforced — no agent self-proceeds to the next phase.

---

## File Path Map

### Operational (gitignored)

| Path | Purpose |
|---|---|
| `agent-workspace/ACTIVE_CONTEXT.md` | Current focus + active workstreams — Tech Lead writes on each shift |
| `agent-workspace/memory/YYYY-MM-DD.md` | Daily session log — written at end of session, read at start |
| `agent-workspace/temp/` | Throwaway files (previews, scratch) — never committed |

### Artifacts (git-tracked)

| Path | Purpose |
|---|---|
| `artifacts/docs/northstar-[app].html` | Phase 1 input |
| `artifacts/docs/emotional-design-system.md` (or `eds-[app].html`) | Phase 1 input |
| `artifacts/docs/screen-specs-[app]-v1.md` | Phase 2 output — screen metadata |
| `artifacts/docs/figma-make-brief.md` | Phase 2 output — Figma Make input brief |
| `artifacts/docs/design-system-spec.md` | Make component inventory (produced during Foundation) |
| `artifacts/docs/tech-spec.md` | Phase 4 output |
| `artifacts/docs/changelog.md` | Ongoing deviations from spec |
| `artifacts/plans/build-plan.md` | Feature dependency graph + per-feature context packages |
| `artifacts/plans/project-plan.md` | Phase + feature completion tracker |
| `artifacts/issues/[issue-name].md` | Issue tracking — kebab-case, one file per issue |
| `artifacts/integrations/[name].md` | Integration research docs — one per external dependency, written by Research Agent |
| `artifacts/docs/features/[name].md` | Feature docs for post-launch features — written during `/new-feature` |

### Source

| Path | Purpose |
|---|---|
| `app/components/brand/` | Direction B brand primitives (Logo, LogoMark, Ticket, Stamp, Kanji, Mono, BackBar, BottomNav) |
| `app/routes/landing.tsx` | Landing page (pre-rendered at build time for SEO) |
| `app/routes/dang-nhap.tsx` | Login screen |
| `app/routes/dang-ky.tsx` | Signup screen |
| `app/routes/auth.callback.tsx` | OAuth callback handler |
| `app/routes/app.tsx` | Auth guard layout — checks session, redirects to /dang-nhap |
| `app/routes/app.[feature].tsx` | Feature screen |
| `app/routes/app.[feature]/components/` | Route-specific components |
| `app/components/ui/` | shadcn/ui primitives |
| `src/components/` | Shared components (used by 2+ screens) |
| `src/hooks/` | Shared hooks (`useAuth`, `useProfile`, `useInstallPrompt`) |
| `src/lib/supabase.ts` | Single Supabase client (publishable key) |
| `src/lib/auth.tsx` | AuthProvider context + useAuth hook |
| `src/lib/data/[entity].ts` | Typed query functions (optional organizational layer) |
| `src/lib/api-types.ts` | All shared TypeScript interfaces |
| `src/lib/database.types.ts` | Generated types from `supabase gen types` |
| `src/lib/formatters.ts` | Formatting utilities |
| `src/lib/constants.ts` | App-wide constants |
| `src/app.css` | Tailwind directives + @font-face + base styles |
| `src/app.css` | Brand tokens (CSS custom properties from Make's theme.css) |
| `react-router.config.ts` | SPA mode, pre-render `/` |
| `vite.config.ts` | Vite + React Router + Tailwind + PWA |
| `vercel.json` | SPA rewrite rules |
| `public/manifest.json` | PWA manifest (static) |
| `public/robots.txt` | Crawl rules |
| `public/sitemap.xml` | Sitemap (static) |
| `public/fonts/` | Self-hosted font files |
| `public/icons/` | PWA icons |
| `supabase/migrations/` | SQL migration files |
| `supabase/functions/` | Edge Functions (webhooks, cron, email, service_role ops) |
| `supabase/seed.sql` | Dev seed data |

---

## Memory System

Agents have no cross-session memory. All state lives in two files that are updated **continuously** throughout the session — not just at the end. This ensures any agent can reconstruct full context even if the session drops without a clean `/session-end`.

### `agent-workspace/ACTIVE_CONTEXT.md`

The "you are here" file. Tech Lead updates this immediately on every focus shift, dispatch, completion, or blocker — not just at session boundaries. Template: `artifacts/templates/ACTIVE_CONTEXT.md`

### `agent-workspace/memory/YYYY-MM-DD.md`

One file per day. Linear append-only log — blocks are added as work progresses. Any agent can pick up mid-session and know exactly what has happened. If the session drops, context is never lost. Template: `artifacts/templates/memory-YYYY-MM-DD.md`

---

## Session Warm-Up

Any agent, any session, reconstructs full working context by reading:

```
1. Always-apply rules              ← auto-injected by Cursor (project.mdc + scoped rules)
2. agent-workspace/ACTIVE_CONTEXT.md
3. agent-workspace/memory/[today].md (+ yesterday's if early in the day)
4. Agent-specific reading list     ← defined in each agent's .cursor/agents/ file
```

---

## Commit Convention

| Agent | Format | Example |
|---|---|---|
| Tech Lead (Phase 4) | `docs(phase4): tech spec complete` | — |
| Tech Lead (Setup) | `chore(setup): scaffold + rules + seed + build plan` | — |
| Tech Lead (Init) | `chore(init): project scaffold and workspace initialized` | — |
| Backend Developer (foundation) | `feat(foundation): backend infrastructure complete` | — |
| Frontend Developer (foundation) | `feat(foundation): shared components + landing page + auth screens complete` | — |
| Backend Developer (feature) | `feat([feature]): backend complete` | `feat(auth): backend complete` |
| Frontend Developer (feature) | `feat([feature]): screens complete` | `feat(goal-creation): screens complete` |
| QA Agent (feature) | `test([feature]): qa pass` | `test(billing): qa pass` |
| QA Agent (pre-handoff) | `test: pre-handoff review complete` | — |
| DevOps Agent | `chore(deploy): staging → main, production live` | — |
| Any agent (amendment) | `fix: [short description per changelog]` | — |
