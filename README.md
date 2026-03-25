# RAD — Rapid App Development Template

Ship a complete product in ~2–3 days. You define the product, Figma Make designs it, agents build it.

## Stack

React Router v7 (Vite) · Supabase · Vercel · Tailwind CSS · Figma Make

## How It Works

You talk to a **Tech Lead** agent in Cursor. It orchestrates 6 specialist subagents — each with a narrow domain, clear inputs, and defined outputs. Every slash command dispatches the right agent with the right context. You approve gates, agents build.

The key insight: **Figma Make produces a complete working React app with mock data.** The frontend agent's job is integration — swap mocks for real Supabase queries — not construction. This cuts screen build time from ~40 min to ~15 min.

---

## One-Time Setup

Do this once per machine. Skip anything already done.

**Accounts:**
- [ ] [Supabase](https://supabase.com) — create two projects: dev + production
- [ ] [Vercel](https://vercel.com) — connect your GitHub account
- [ ] [Figma](https://figma.com) — access to Figma Make
- [ ] Payment provider (if monetizing) — Stripe, PayOS, etc. Get test mode keys.
- [ ] [Resend](https://resend.com) (if sending email) — get an API key

**Cursor settings:**
- [ ] Settings → Features → Agent → **Auto-run terminal commands → On**
- [ ] Settings → Features → Agent → **Auto-apply edits → On**
- [ ] Model: **Claude Sonnet 4** (or latest) as default

**Global MCP** — add to `~/.cursor/mcp.json` (available in all projects):
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

---

## Step-by-Step: Idea to Production

### Step 1 — Create Your Repo

```bash
gh repo create [app-name] --template your-org/rad-starter --private --clone
cd [app-name]
```

---

### Step 2 — Write the Northstar + EDS (outside Cursor)

Before opening Cursor, produce two files using any LLM or manual process:

| File | What it is |
|---|---|
| `artifacts/docs/northstar-[app].html` | Product northstar — target user, core loop, features, revenue model, moat, auth model, payment, integrations |
| `artifacts/docs/emotional-design-system.md` | Brand voice, visual direction, emotional register, copy formula, forbidden patterns |

Place both in `artifacts/docs/`. The template will hard-stop without them.

**Detailed format:** See `phase1-northstar-eds-writer.md` in project knowledge for the full section-by-section specification.

---

### Step 3 — Initialize the Project

Open in Cursor and run:

```
/init
```

This scaffolds the React Router v7 project, installs dependencies, fills in `copy-rules.mdc` from the EDS, creates the staging branch, and links Vercel.

**After `/init` — you do:**
- [ ] Fill in `.env.local` (Supabase URL + publishable key)
- [ ] Fill in `.cursor/mcp.json` (Supabase + Vercel tokens)
- [ ] Place PWA icons in `public/icons/` (192×192 + 512×512)
- [ ] Place a Vietnamese-compatible `.woff2` font in `public/fonts/`

---

### Step 4 — Plan the Screens

```
/phase2
```

The Product Designer agent produces:
1. **Screen specs** (`screen-specs-[app]-v1.md`) — metadata for every screen: data variables, interaction flows, copy slots, loading/error/empty states, credit costs
2. **Figma Make brief** (`figma-make-brief.md`) — structured prompt with brand context, anti-patterns, and per-screen content hierarchy

**Gate:** Review both files → approve.

---

### Step 5 — Build the Prototype in Figma Make (you do this)

Take the Figma Make brief and build the complete app prototype in Figma Make. This is the most important human step.

**What Make produces:** A complete working React + Tailwind app — every button works, every form submits, every list renders, all with hardcoded mock data.

**Tips for good Make output:**
- Paste the Brand Context section into Make's custom rules
- Use realistic Vietnamese mock data (names, dates, prices from the brief)
- Use property names that map to database columns (`displayName`, `creditBalance`)
- Include 3–5 items in lists for visual density
- Let Make handle all visual decisions — colors, typography, spacing, animations

**When done:**
1. Go to Make's **Code tab**
2. Copy ALL files into `src/make-import/` in your project
3. Approve to proceed

---

### Step 6 — Write the Tech Spec

```
/phase4
```

The Tech Lead reads Make's mock data structures alongside the northstar to derive the database schema. Column names match mock object property names where possible.

**Gate:** Review `tech-spec.md` → approve.

---

### Step 7 — Generate the Build Plan

```
/setup
```

The Tech Lead produces `build-plan.md` — the feature dependency graph with per-feature context packages. Each package tells the build agents exactly what to build without reading the full spec.

**Gate:** Review `build-plan.md` → approve.

---

### Step 8 — Build Foundation

```
/foundation
```

Two sequential agents run unattended:

**Backend Foundation:**
- Supabase client, AuthProvider, types, hooks
- Schema migrations + RLS policies + seed data
- Edge Functions (payment webhook, email — if applicable)
- Static SEO/PWA files (robots.txt, sitemap.xml, manifest.json)
- Generate `database.types.ts`

**Frontend Foundation:**
- Move Make's `components/ui/` → `src/components/ui/` (as-is)
- Catalog components + build missing states (EmptyState, ErrorBanner, SkeletonCard)
- Port Make's CSS design tokens (`theme.css` with `@theme inline`) into `src/app.css`, self-host fonts, fix `next-themes` in sonner.tsx
- Build landing page as first screen (validates everything works)
- Build auth screens (login, signup, OAuth callback)

**Result:** Landing page live on staging URL. Auth flow working end-to-end.

---

### Step 9 — Build Features (wave by wave)

```
/feature auth
/feature profile-settings    ← Wave 1 features run in parallel
```

Each feature runs: **Backend → Frontend → QA**.

The frontend agent is an **integrator**, not a builder:
- Finds the Make component for each screen
- Ports JSX + Tailwind into a route file
- Swaps hardcoded mock data for real Supabase queries
- Replaces fake auth/nav/payment with real implementations
- Adds loading/error/empty states (Make only has happy path)
- Keeps everything else Make generated — layout, styling, animations

**Gate:** QA agent validates each feature → you approve each PASS → next wave starts.

---

### Step 10 — Visual Audit

```
/visual-audit https://[app]-staging.vercel.app
```

Product Designer checks every screen against Make's original components, slop guard rules, mobile viewport, interaction states, copy quality, and landing page completeness.

**Gate:** Fix all BLOCKING findings.

---

### Step 11 — Pre-Handoff Safety Audit

```
/pre-handoff
```

QA Agent runs a two-pass security and quality audit — RLS gaps, secrets in bundle, Edge Function validation, dead code, missing indexes. AUTO-FIX items applied directly, BLOCKING items escalated.

**Gate:** Resolve all BLOCKING items → approve.

---

### Step 12 — Deploy to Production

```
/deploy [production-supabase-ref]
```

DevOps Agent:
1. Pushes schema to production Supabase
2. Deploys Edge Functions
3. Lists env vars for you to set in Vercel Dashboard
4. Merges staging → main → confirms production is live

**Post-deploy smoke check:**
- [ ] Production loads, signup works, core loop completes
- [ ] Payment works (test mode) and webhook fires
- [ ] Landing page renders with OG tags (test with Facebook Sharing Debugger)
- [ ] PWA installs on Android, iOS shows instructions
- [ ] Lighthouse: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms

**Commercial readiness (your responsibility):**
- [ ] Privacy Policy + Terms of Service pages
- [ ] Switch payment provider to live keys → re-deploy

---

## Architecture

```
Frontend (React SPA on Vercel)     →  HTTPS  →  Supabase (sole backend)
- React Router v7 + Vite + Tailwind            - Postgres + RLS
- Pre-rendered landing page at /                - Auth (email, OTP, OAuth)
- SPA for /app/* (authenticated)                - Edge Functions (webhooks, cron, email)
- Make TSX ported into route files              - Storage
- @supabase/supabase-js for all data            - Realtime (if needed)
```

No server runtime in the frontend. No middleware. No API routes. RLS is the single authorization boundary. Edge Functions handle webhooks, cron, email, and anything needing the service role key.

---

## Command Reference

| Command | What it does | When |
|---|---|---|
| `/init` | Scaffold project, install deps, configure MCP | Once, at start |
| `/phase2` | Screen specs + Figma Make brief | After init |
| `/phase4` | Tech spec (schema from Make mock data) | After Make code copied |
| `/setup` | Generate build plan with feature context packages | After tech spec approved |
| `/foundation` | Backend infra + frontend foundation | After setup approved |
| `/feature [name]` | Build one feature: Backend → Frontend → QA | Per feature, in waves |
| `/visual-audit [url]` | Visual fidelity check on staging | After all features pass QA |
| `/pre-handoff` | Security + quality audit | After visual audit |
| `/deploy [ref]` | Production deploy | After pre-handoff approved |

**Utility commands:**

| Command | What it does |
|---|---|
| `/session-start` | Restore context after session drop |
| `/session-end` | Save session memory |
| `/status` | Diagnostic — phases, features, build health |
| `/research [name]` | Research external integrations |
| `/regen-feature [name]` | Regenerate feature context after spec amendment |
| `npm run dev` | Start dev server |
| `npm run build` | Production build (Vite) |
| `npm test` | Run test suite (Vitest) |

---

## File Structure

```
src/
  make-import/              ← Figma Make code dump (temporary — deleted after porting)
  routes/
    _index/route.tsx        ← Landing page (pre-rendered for SEO)
    _auth/                  ← Login, signup, OAuth callback
    _app/                   ← Authenticated screens (auth guard layout)
      layout.tsx            ← Auth check → redirect if no session
      [feature]/route.tsx   ← Feature screens (ported from Make)
  components/
    ui/                     ← Make's UI primitives (moved as-is)
    EmptyState.tsx          ← Built during Foundation (Make doesn't generate these)
    ErrorBanner.tsx
    SkeletonCard.tsx
  hooks/                    ← useAuth, useProfile, useInstallPrompt
  lib/
    supabase.ts             ← Single client (publishable key)
    auth.tsx                ← AuthProvider + useAuth hook
    api-types.ts            ← Shared TypeScript interfaces
    database.types.ts       ← Auto-generated (supabase gen types)
    data/                   ← Typed query functions
  app.css                   ← Tailwind directives + @font-face

supabase/
  migrations/               ← SQL schema + RLS policies
  functions/                ← Edge Functions (webhooks, cron, email)
  seed.sql                  ← Dev seed data

public/
  manifest.json             ← PWA manifest
  robots.txt                ← Crawl rules
  sitemap.xml               ← Sitemap
  fonts/                    ← Self-hosted .woff2
  icons/                    ← PWA icons

artifacts/
  docs/                     ← Planning docs (northstar, EDS, screen specs, tech spec)
  plans/                    ← Build plan + project tracker
  issues/                   ← Issue tracking
  integrations/             ← External API research docs
```

---

## Key Principles

1. **Make designs, agents integrate.** Figma Make handles all visual decisions. Agents never invent layouts or choose colors — they port Make's working code and swap mock data for real queries.

2. **RLS is the auth boundary.** No middleware, no API route guards. Every Supabase query is automatically scoped by the user's JWT. Edge Functions use the service role key only for webhooks and cron.

3. **Ship complete, never return.** Every RAD cycle ships a complete product. If significant new features are needed, start a fresh RAD cycle — don't extend a shipped app.

4. **Code is a commodity; speed of learning is the asset.** The template optimizes for shipping and validating, not for building the "perfect" codebase.
