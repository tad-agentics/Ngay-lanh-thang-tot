# /foundation

Dispatch Foundation subagents — backend infrastructure and shared components.
Runs after the Setup gate is approved.

## Pre-flight checks

Before dispatching, confirm:
- [ ] `artifacts/plans/build-plan.md` is fully generated (not the placeholder)
- [ ] `.cursor/mcp.json` credentials are configured
- [ ] `npm run build` passes on current state (no pre-existing errors)
- [ ] `git log` shows `chore(setup): scaffold + rules + seed + build plan` commit

If any check fails: report to human, do not dispatch.

## Dispatch — Backend Foundation

Launch Backend Developer subagent (foreground):

```
Task: Foundation — Backend Infrastructure

Read:
- .cursor/agents/backend-developer.md (your full instructions)
- agent-workspace/ACTIVE_CONTEXT.md
- artifacts/docs/tech-spec.md (including Section 18 — SEO & PWA Infrastructure)
- artifacts/docs/northstar-[app].html (§7b for landing page metadata, §5 for brand colors → manifest theme_color)
- artifacts/plans/build-plan.md

Mode: Foundation
Build all shared infrastructure as specified in the Foundation Mode section of your agent file.

Foundation backend includes:
- Supabase client (src/lib/supabase.ts), AuthProvider (src/lib/auth.tsx), types, hooks
- Schema migrations + RLS policies + seed data
- OAuth setup instructions (if applicable)
- Storage buckets + helpers (if applicable)
- Edge Functions: payment webhook, send-email (if applicable)
- Static SEO/PWA files:
  - public/robots.txt — allow /, disallow /app/
  - public/sitemap.xml — landing page at priority 1
  - public/manifest.json — name/short_name from northstar, theme_color from EDS §5, icons, screenshots
  - OG image solution (static PNG or Edge Function — per tech-spec §18)

Signal completion when feat(foundation): backend infrastructure complete is committed.
```

Wait for Backend Foundation to commit before dispatching Frontend Foundation.

## Dispatch — Frontend Foundation

After Backend Foundation commits, launch Frontend Developer subagent (foreground):

```
Task: Foundation — Make Import + Components + Tailwind + Landing Page + Auth Screens

Read:
- .cursor/agents/frontend-developer.md (your full instructions)
- .cursor/skills/design-system/SKILL.md (component inventory process)
- .cursor/rules/copy-rules.mdc (copy quality test for landing page copy validation)
- agent-workspace/ACTIVE_CONTEXT.md
- src/make-import/ (Make's code output — read App.tsx + routes.tsx first)
- artifacts/docs/emotional-design-system.md — §6 Dopamine Moments (check if motion/react-countup are needed)
- artifacts/docs/screen-specs-[app]-v1.md — landing page metadata block
- artifacts/docs/northstar-[app].html — §7b Landing Page Content
- artifacts/plans/build-plan.md

Mode: Foundation

Step 0: Install Make's dependencies — read src/make-import/package.json or scan imports. Run npm install [packages]. Verify npm run build passes.
Step 1: Move src/make-import/components/ui/ → src/components/ui/ as-is. Catalog Make's components and produce artifacts/docs/design-system-spec.md (per design-system SKILL.md). Build any additional shared components Make didn't generate (EmptyState, ErrorBanner, SkeletonCard).
Step 2: Port Make's design tokens — copy theme.css (CSS custom properties + @theme inline) into src/app.css. Replace Google Fonts CDN imports with self-hosted .woff2. Fix next-themes import in sonner.tsx.
Step 3: Create src/hooks/useInstallPrompt.ts (spec in tech-spec §18).
Step 4: Build the landing page (src/routes/_index/route.tsx) as the FIRST screen.
  - Route: / (pre-rendered at build time)
  - Content from northstar §7b — all copy is production-ready, use verbatim
  - Section stack from screen spec metadata: hero, trust bar, benefits, how-it-works, social proof, FAQ, final CTA, sticky bottom bar
  - Wire useInstallPrompt hook
  - iOS detection fallback for install instructions
  - Hero image with loading="eager" (LCP optimization)
  - FAQ section renders both visible accordion AND FAQ JSON-LD structured data
  - Edge case: already-installed detection → swap install CTA for deep link
Step 5: Build auth screens (src/routes/_auth/) — login, signup, callback per northstar §9.

Building the landing page first validates Make's components + Tailwind config on a real screen before feature work begins.

If EDS §6 lists animation dependencies (motion, react-countup), verify they are installed.
Signal completion when feat(foundation): shared components + landing page + auth screens complete is committed.
```

## After completion

1. Update `artifacts/plans/project-plan.md` — mark Foundation complete with commit hashes
2. Update `agent-workspace/ACTIVE_CONTEXT.md` — foundation complete, ready for Wave 1
3. Verify landing page is deployed to staging URL — quick visual check that hero, CTA, and install prompt work
4. Present to human: "Foundation complete. Landing page live at staging URL. Ready to begin feature workstreams. Run `/feature [name]` for each Wave 1 feature (can run in parallel)."

Wave 1 features are listed in `artifacts/plans/build-plan.md`.
