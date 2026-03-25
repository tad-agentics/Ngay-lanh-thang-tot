# /init

First-time project initialization. Run this once when starting a new project from the RAD template, before any phase commands.

## What this does

- Initializes `agent-workspace/` from templates
- Confirms Phase 1 artifacts are in place
- Fills in `copy-rules.mdc` from the EDS
- Scaffolds the React Router v7 (Vite) project structure, installs dependencies, and configures Vitest
- Creates the `staging` branch and links the Vercel project
- Sets the project name in `ACTIVE_CONTEXT.md`
- Reports what's ready and what the next step is

## Steps

### 1. Initialize `agent-workspace/`

Copy templates if not already present:

```bash
cp artifacts/templates/ACTIVE_CONTEXT.md agent-workspace/ACTIVE_CONTEXT.md
cp artifacts/templates/memory-YYYY-MM-DD.md agent-workspace/memory/$(date +%Y-%m-%d).md
```

Open `agent-workspace/ACTIVE_CONTEXT.md` and set:
- `Updated:` to today's date and time
- `Current focus:` to "Init — confirming Phase 1 artifacts, ready for Phase 2"

### 2. Confirm Phase 1 artifacts

Phase 1 (northstar + emotional design system) is produced entirely outside this project. These files must be provided by the human before `/init` can proceed.

Check that both required inputs exist in `artifacts/docs/`:

| File | Required? |
|---|---|
| `artifacts/docs/northstar-[app].html` | **Hard stop** — do not proceed if missing |
| `artifacts/docs/emotional-design-system.md` OR `artifacts/docs/eds-[app].html` | **Hard stop** — EDS may be markdown or branded HTML. Accept either format. |
| `.cursor/rules/copy-rules.mdc` | Soft check — if still the placeholder, step 4 fills it from the EDS |

If northstar or EDS are missing: report exactly which files are absent and stop.

### 3. Read Phase 1 artifacts

Read northstar and EDS to extract:
- App name and one-sentence description
- Build scope (feature count from §7)
- Voice register (from EDS)
- Auth method (from §9 — needed for /setup env var guidance)
- Payment provider (from §11 — needed for /setup MCP and dependency decisions)
- External integration env vars (from §10 — needed for .env.example)
- Whether EDS §6 defines dopamine moments requiring motion (needed for Step 6 deps)

### 4. Confirm `copy-rules.mdc` is populated

Read `.cursor/rules/copy-rules.mdc`. If it still contains placeholder content (brackets like `[word]`, `[adjective]`), extract from the EDS and fill in every section:

- **Copy Formula** — extract formula, length limit, structure, tone, person from EDS copy formula section
- **Forbidden Opening Words** — extract from EDS forbidden patterns as comma-separated list
- **Forbidden Words** — extract from EDS forbidden patterns as comma-separated list
- **Screen-Context Copy Rules** (7 contexts) — extract emotional objective, formula override, and one real example per context type from EDS screen-context rules
- **Paywall / Purchase Moment** — extract from EDS paywall copy guidance
- **Forbidden Patterns** — extract named anti-patterns from EDS
- **Copy Quality Test** — extract 5 binary questions from EDS quality test
- **Hard Rules** — set language and market (e.g., "Copy written in Vietnamese for Vietnam B2C")

Every section must contain real, project-specific content. No `[paste from EDS]` placeholders.

### 5. Create React Router v7 app

```bash
npx create-react-router@latest . --yes
```

This scaffolds a React Router v7 project with Vite and TypeScript.

### 6. Install dependencies

```bash
npm install @supabase/supabase-js zod
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @tailwindcss/vite
```

**PWA — evaluate and install one:**
```bash
# Option A (recommended, more battle-tested for Vite):
npm install -D vite-plugin-pwa
# Option B (if Serwist Vite plugin is mature):
npm install -D @serwist/vite serwist
```

Evaluate which PWA plugin is more stable for Vite at the time of build. Configure the chosen plugin in `vite.config.ts` (template already has placeholder comments for both).

**Conditional — if EDS §6 (Dopamine Moments) requires animation:**
```bash
npm install motion react-countup
```
Only install if Step 3 extraction confirmed dopamine moments exist.

### 7. Scaffold project structure

Create the following directories if they don't exist:

- `src/lib/` — Supabase client, shared utilities
- `src/lib/data/` — typed query functions
- `src/hooks/` — custom hooks (useAuth, useProfile, etc.)
- `src/components/` — shared components
- `src/routes/_index/` — landing page (pre-rendered)
- `src/routes/_auth/` — auth screens
- `src/routes/_app/` — authenticated app screens
- `public/icons/` — PWA icons (192×192 and 512×512, `any` + `maskable` variants)
- `public/screenshots/` — PWA install dialog screenshots
- `public/fonts/` — self-hosted font files (Vietnamese-compatible)
- `supabase/functions/` — Edge Functions
- `supabase/migrations/` — migration files

Verify template infrastructure files are in place:
- `react-router.config.ts` — `ssr: false`, `prerender: ['/']`
- `vite.config.ts` — React Router + Tailwind + PWA plugin (uncomment chosen option)
- `vercel.json` — SPA rewrite rules
- `.cursorignore` — excludes node_modules, dist, .env, database.types.ts
- `.cursorindexingignore` — excludes migrations, seed, templates, memory, database.types.ts

Create `vitest.config.mts` in the project root:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
  },
})
```

Add scripts to `package.json`:
```json
{
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "preview": "npx serve build/client",
    "test": "vitest run"
  }
}
```

Present to human: "Place PWA icons in `public/icons/` (192×192 and 512×512, both regular and maskable). Place a Vietnamese-compatible font file (.woff2) in `public/fonts/` for self-hosting."

### 7b. Set executable permissions on skill scripts

```bash
chmod +x .cursor/skills/*/scripts/*.sh
```

### 8. Set up environment variables

Copy `.env.example` to `.env.local`. Add env vars from Northstar §10 and §11 to both `.env.example` and `.env.local`:

**Always required:**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

**Server-only (Edge Functions only — set via `supabase secrets set` during deploy):**
```
SUPABASE_SERVICE_ROLE_KEY=
```

**From Northstar §10 — add if external integrations specified:**
```
# [Integration name from §10]
[VAR_NAME from §10]=
```

**From Northstar §11 — add if payment provider specified:**
```
# [Payment provider from §11]
[VAR_NAMES from §11]=
```

`.env.local` is gitignored. Present the complete `.env.local` to the human to fill in.

### 9. Configure base MCP servers

Create `.cursor/mcp.json` with the base servers every RAD project requires:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "<SUPABASE_ACCESS_TOKEN>"]
    },
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp-adapter", "--token", "<VERCEL_TOKEN>"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

Present to human: "Fill in credentials in `.cursor/mcp.json`. Context7 requires no credentials. Never commit this file — it is gitignored."

**Do not add Figma MCP.** Figma Make outputs code files directly — the MCP is for Figma Design, not Make. Adding it would cause agents to call `get_design_context` on Make file URLs, get errors, and burn tokens retrying.

### 10. Create staging branch

```bash
git add -A
git commit -m "chore(init): project scaffold and workspace initialized"
git checkout -b staging
git push -u origin staging
```

### 11. Link Vercel project

```bash
npx vercel link
```

Follow prompts to link this repo to Vercel. Every `git push origin staging` triggers a preview deploy.

### 12. Update `agent-workspace/ACTIVE_CONTEXT.md`

- `Updated:` — today's date and time
- `Current focus:` — "Init complete — ready for Phase 2 (screen specs + Figma Make)"
- `Next up:` — "/phase2 — dispatch Product Designer for screen specs and Figma Make brief"

### 13. Report to human

```
## Project initialized: [App Name]

Phase 1 artifacts confirmed:
  ✓ northstar-[app].html
  ✓ emotional-design-system.md (or eds-[app].html)
  ✓ copy-rules.mdc

React Router v7 (Vite) scaffold: ✓
Base packages: @supabase/supabase-js, zod
PWA: [vite-plugin-pwa or @serwist/vite] configured
Test runner: vitest (npm test = vitest run)
.env.local created — fill in Supabase credentials + integration vars before proceeding
MCP config created — fill in Supabase + Vercel credentials in .cursor/mcp.json
Staging branch: created and pushed to origin/staging
Vercel: linked — push to staging to get a preview URL

Action required from human:
  - Fill in .env.local credentials
  - Fill in .cursor/mcp.json tokens (Supabase, Vercel)
  - Place PWA icons in public/icons/ (192×192 + 512×512, regular + maskable)
  - Place Vietnamese font file (.woff2) in public/fonts/

Build scope: [N] features + 1 landing page
Voice register: [from EDS]

Ready for Phase 2. Run /phase2 to dispatch the Product Designer.
```
