---
name: wireframes
description: Complete Phase 2 instructions — scope planning, anti-bloat rules, screen metadata format, Figma Make brief output, and quality checks. Read this when running /phase2.
disable-model-invocation: true
---

# Phase 2 — Screen Planning + Figma Make Brief

Two jobs, two outputs:
1. **Screen specs** — scope planning, screen metadata with interaction flows, copy slots, states
2. **Figma Make brief** — structured input for the human to use in Figma Make to generate visual designs

Visual design is human-driven via Figma Make. This phase produces the structured input for that process, not wireframe visuals.

---

## Part A — Scope Planning

Scope planning happens before any screen is specced. Define the complete product now — no additions mid-build.

### Before You Plan

Extract from `artifacts/docs/northstar-[app].html` and `artifacts/docs/emotional-design-system.md`:
- App name and one-line description
- Primary user — who is completing the core action?
- Core loop — what is the single most important thing the user does?
- All features — from Build Scope table (§7). Sort into Build vs Not Building.
- Landing page content — from §7b. Headline, keywords, trust signals, CTA copy, FAQ items, social proof. This is the only source for landing page copy — do not invent.
- Revenue model — matters for monetization screen scoping
- Retention mechanic — what brings users back?
- Not Building list — from §8. Use as starting point; add any features cut during scoping.
- Auth model — from §9. Determines auth screen set: anonymous-first? Phone OTP? OAuth? What triggers account creation? What profile data is collected?
- Payment provider and methods — from §11. Determines monetization screen pattern: checkout redirect? QR code? In-app credit purchase? Do not assume Stripe — use the provider specified in the northstar.
- Feature grouping / build waves — from §12. Use as input for recommended build order.
- User scenarios — from §13 (if present). The richest source for navigation flows — each scenario traces an exact path through the app with feature/endpoint tags. Use these to validate every screen is reachable and every navigation path is accounted for.

**Copy direction** — from `artifacts/docs/emotional-design-system.md` and `.cursor/rules/copy-rules.mdc`:
- Copy Slot Inventory — from EDS §7. Use pre-defined copy templates for common UI patterns (empty states, error messages, paywall copy, nav labels).
- Dopamine Moments — from EDS §6. Flag screens that have a designed dopamine moment in the metadata block.
- Copy formula + quality test — from copy-rules.mdc. All screen spec copy must be production-ready and pass the 5-question quality test.

### Scoping Decision Tree

Apply to every feature:

```
Is this required to deliver the complete product experience
(core loop + retention + monetization)?
  YES → Build

Is this a nice-to-have that doesn't directly serve core loop, retention, or monetization?
  → Not Building

Would cutting this prevent a user from completing the core action, coming back, or paying?
  YES → Build
  NO  → Not Building
```

### Category Budgets

| Category | Typical range | Rule |
|---|---|---|
| Core loop | 6–12 screens | Must be ≥50% of total product screens (excluding infrastructure) |
| Retention | 2–5 screens | Each screen must tie to a named retention mechanic from the northstar |
| Monetization | 2–5 screens | Use the payment provider's hosted checkout (if available) to stay at the low end. Check northstar §11. |
| Infrastructure | 4–6 screens | Auth + onboarding + settings + profile — minimize this tax |

**Build-time reality check:** Every screen costs 20–60 minutes during the feature build. Multiply screen count × weighted average. If the build exceeds 10 hours, simplify screens or accept a longer sprint.

### Anti-Bloat Rules — Cut Before Building

1. **"Second dashboard"** — more than one screen whose primary action is "view a summary." Pick one.
2. **"Settings sprawl"** — more than one settings screen. Consolidate into sections.
3. **"Onboarding creep"** — more than 2 onboarding screens (excluding auth). Simplify the product.
4. **"Empty feature"** — any screen that could be a section or modal within an existing screen. Merge it.
5. **"Admin screen"** — any screen that serves the builder, not the user. Use Supabase Dashboard instead.
6. **"Notification management"** — skip notification preference screens unless notifications are the core retention mechanic.
7. **"50% rule"** — infrastructure + monetization outnumber core loop + retention. Cut plumbing, not product.

### Mandatory Infrastructure Screens

Auth screens are determined by the northstar §9 (Auth Model). Do not guess the auth method — read it from the northstar.

| Screen | When to include | Notes |
|---|---|---|
| Login | Always | Method from northstar §9: Phone OTP / email+password / magic link / OAuth |
| Signup | Always (unless anonymous-first) | If §9 says anonymous-first: skip signup, add account-upgrade screen at the trigger point instead |
| Forgot Password | Only if email+password auth | Skip for magic link, OAuth, or Phone OTP |
| Account Upgrade | Only if anonymous-first → upgrade | Shown when the §9 "Account trigger" fires |
| Profile / Onboarding | If §9 lists profile data beyond email/phone | Collect birth date, birth time, gender, etc. — only what §9 specifies |
| **Landing Page** | **Always** | **Single conversion page at `/`. Content from northstar §7b.** |

Default to custom auth screens for consumer products (maintains design system consistency). Use Supabase Auth UI only for internal tools.

### Mandatory Landing Page — Section Stack

The landing page is mandatory infrastructure — not a "nice to have." It is the destination for organic search, viral share links, and paid ad traffic. Without it, the PWA has no acquisition surface.

**Route:** `/` (pre-rendered at build time for SEO — authenticated app screens live at `/app/*`)

**Content source:** All copy comes from northstar §7b (Landing Page Content). The screen spec agent does not invent landing page copy — it uses the production-ready content defined in the northstar.

**Section stack (mobile-first, top to bottom):**

1. **Hero (above the fold)** — Headline from §7b, subheadline, phone mockup showing the PWA, primary CTA button (from §7b), microcopy below CTA
2. **Trust bar** — Compact row: user count, star rating, 3–4 media/partner logos. All from §7b trust signals.
3. **Benefits (3–4 items)** — Icon + outcome-focused copy per item. Each benefit ≤ one scroll height.
4. **How it works (3 steps)** — Visual: 1. Tap install → 2. Add to home screen → 3. Start using. Repeat CTA after this section.
5. **Social proof** — Testimonials from §7b with name, age, profession, city. Optional: real-time activity counter.
6. **FAQ (accordion, 4–6 items)** — Questions from §7b. These also feed FAQ JSON-LD structured data (built in tech spec §18).
7. **Final CTA** — Repeat hero CTA with social proof line.
8. **Sticky bottom bar** — Appears after scrolling past hero. Compact: `[App icon] CTA text`. One risk reducer.

**Metadata block must include:**
- Dopamine moment: `none` (landing page is calm/professional, not celebratory)
- Credit cost: `N/A` (no paywall)
- Copy slots: All production-ready from §7b
- Interaction flow: hero load → scroll → CTA tap → install prompt (Android) or manual instructions (iOS)
- Edge case: Already installed → hide install CTA, show deep link into app instead

### Scope Plan Output Format

```markdown
# Screen Scope Plan — [App Name]

## Build Scope
*All screens that ship in this build. Target: [X] screens.*

### Core Loop
| # | Screen Name | Primary User Action | Notes |
|---|---|---|---|
| 1 | [Screen] | [What user does] | [constraint or dependency] |

### Retention
| # | Screen Name | Retention Mechanic | Notes |
|---|---|---|---|

### Monetization
| # | Screen Name | Revenue Mechanic | Notes |
|---|---|---|---|

### Infrastructure
| # | Screen Name | Purpose | Notes |
|---|---|---|---|

### Landing Page
| # | Screen Name | Purpose | Notes |
|---|---|---|---|
| 1 | LandingPage | Single conversion page at `/` — hero, trust, benefits, how-it-works, social proof, FAQ, CTA | Content from northstar §7b |

**Total: [X] screens** ([A] core loop + [B] retention + [C] monetization + [D] infrastructure + [E] landing page)
**Core loop ratio:** [A/(A+B+C)]% of product screens (must be ≥50% — infrastructure and landing page excluded from ratio)
**Build-time estimate:** [X] screens × [avg min] = ~[Y]h

**Core loop summary:** [One sentence: complete product flow from first screen to completion]

---

## Not Building
*Excluded from this version. Do not design, do not spec, do not build.*

Copy this block directly into `project.mdc` and the tech spec Not Building section:

- [Feature] — [one line reason for exclusion]
```

### Common Scoping Mistakes

| Pattern | Problem | Fix |
|---|---|---|
| Auth screens missing from count | Built ad-hoc, eats unplanned time | Include Login + Signup in count from the start |
| Monetization excluded "for later" | Product ships without revenue | Include payment/upgrade screens from day one |
| Settings screen bloat | 3+ settings screens | One settings screen, max |
| Onboarding beyond minimum required fields | Friction, not value | Cut to bare minimum |
| More than one "home" or dashboard | Split attention | Pick one, cut the other |
| Features added "since we're already building" | Scope creep kills speed | Not in scope plan = Not Building |

---

## Part B — Screen Metadata + Figma Make Brief

Once the scope plan is confirmed, produce two outputs:

### Output 1 — `artifacts/docs/screen-specs-[app]-v1.md`

Screen metadata for every screen. This is the build brief for feature agents. Each screen has a structured metadata block — the direct input for backend and frontend agents.

**Copy in screen specs must be production-ready — not directional.**

All copy must be validated against `copy-rules.mdc` and the EDS copy formula before delivery. The frontend agent copies these strings verbatim into components.

**Read before writing any copy:** `artifacts/docs/emotional-design-system.md` (§5 Copy Formula, §6 Screen-Context Rules, §7 Copy Slot Inventory, §8 Forbidden Patterns) and `.cursor/rules/copy-rules.mdc`.

| Element | Wrong | Right (production-ready) | Dynamic (token) |
|---|---|---|---|
| CTA | `[Primary CTA]` | `Xem chi tiết` | — |
| Empty state | `[Empty state message]` | `Cho biết ngày giờ sinh để kết quả dành riêng cho bạn.` | — |
| Error | `[Error message]` | `Không tải được kết quả lúc này. Thử lại sau vài giây.` | — |
| Headline | `[Screen headline]` | `Ngày tốt tuần này` | — |
| Personalized | `[Greeting]` | — | `Nhật Chủ {{user.nhat_chu}} — hành {{user.hanh}}` |
| Paywall | `[Upgrade CTA]` | `Xem lý do và giờ tốt — cần {{cost}} tín dụng` | `{{cost}}` |

**`{{COPY:context}}` is the exception, not the norm.** Only use when the copy genuinely depends on runtime data that can't be templated.

#### Screen Metadata Block Format

```markdown
## [Screen Name]

**Route:** `/app/[path]`

**Components:**
- [ComponentName] — purpose/usage note
- [ComponentName] — purpose/usage note

**Data:**
| Variable | Source | Default if null |
|---|---|---|
| profiles.display_name | profiles table | "User" |
| items.title | items table | — (required, never null) |

**States:**
- Loading: [exact behavior — e.g. "show skeleton cards in place of each card component"]
- Error: [exact behavior — e.g. "show error banner with retry action, hide main content"]
- Empty: [exact behavior — e.g. "show empty state component with CTA to add first item"]

**Interaction flow:**
1. [Initial state — what user sees on screen load]
2. [User action → result]
3. [Branch condition — e.g. "IF user has saved profile → auto-fill, skip to step 5. ELSE → show input fields."]
4. [User action]
5. [System response — e.g. "IF credits ≥ cost → loading state (D1 dopamine). ELSE → inline paywall."]
6. [Result state — e.g. "Top 3 results slide in. CTA fade in after 2s."]
7. [Exit — e.g. "Tap result → DetailScreen. Tap share → ShareFlow."]

**Navigation:**
- Enters from: [ScreenName] via [exact trigger]
- Exits to: [ScreenName] via [exact trigger]
- Back: [Hardware back / swipe back / disabled]

**Dopamine moment:** [none | D1/D2/D3/D4 — reference EDS §6 by ID]

**Copy slots (production-ready):**
- page_title: "Chọn ngày theo tuổi" — Ambient
- result_primary: "{{result.date}} — {{result.reason_short}}, hợp mệnh {{user.menh}} của bạn" — Decision
- paywall_ask: "Xem kết quả — cần {{cost}} tín dụng. Số dư: {{user.credits}} tín dụng." — Paywall
- error_generic: "Không tải được kết quả lúc này. Thử lại sau vài giây." — Error

**Edge cases:**
- [Specific condition and how the screen handles it]

**Credit cost:** [N credits | free | N/A] — from northstar §5 pricing table
```

### What Goes Where

| Information | In Figma Make brief | In screen metadata |
|---|---|---|
| Layout and visual hierarchy | ✓ (described for Make) | — |
| Copy text and labels (production-ready) | ✓ (content hierarchy) | ✓ (copy slots with context types) |
| Which shared components are used | — | ✓ |
| Database table.column → variable mappings | — | ✓ |
| Default values for nullable data | — | ✓ |
| Loading/error/empty state behavior | — | ✓ |
| Interaction flow (step-by-step within screen) | — | ✓ |
| Branch conditions (credit check, profile exists) | — | ✓ |
| Navigation enter/exit with exact triggers | — | ✓ |
| Edge cases and constraints | — | ✓ |
| Dopamine moment flag (D1–D4 or none) | — | ✓ |
| Credit cost (paywall gate) | — | ✓ |

### Metadata Quality Rules

**Component references**
- Every component name exactly matches its exported name in `design-system-spec.md` — no paraphrasing
- No component referenced that doesn't exist in the design system spec — flag if missing

**Data variables**
- Every variable maps to an exact `table.column` from the tech spec schema — not a concept
- Source is the actual Supabase table, not "from the database"
- Default value defined for every nullable variable

**Navigation**
- Screen names in "Enters from" and "Exits to" exactly match names used in other screens
- Trigger is the exact UI element — "Tap 'Save' button", not "tap the CTA"

**States**
- Loading state specifies exact component behavior — "show skeleton card", not "show a loading indicator"
- Error state specifies exact recovery action — "show error banner with retry tap target", not "show error"

---

### Output 2 — `artifacts/docs/figma-make-brief.md`

Structured input for the human to use in Figma Make. This is NOT an agent-executable step — the human takes this brief into Figma Make and generates a complete working React app with mock data.

**What Make produces:** A full React + Tailwind app where every button works, every form submits, every list renders — with hardcoded mock data. The frontend agent later swaps these mocks for real Supabase queries.

**After Make:** Human copies ALL files from Make's Code tab into `src/make-import/`.

```markdown
# Figma Make Brief — [App Name]

## Brand Context (paste into Figma Make custom rules)

- **App name:** [name]
- **Visual register:** [from EDS §5 — e.g. "Premium-warm"]
- **Brand colors:** [from EDS §5 — primary, background, foreground, surface, muted with hex values]
- **Typography:** Heading: [serif/sans-serif]. Body: [serif/sans-serif]. [Direction from EDS §5]
- **Iconography:** [from EDS §5 — e.g. "minimal line, no emoji"]
- **Platform:** Mobile-first PWA, 375px baseline

## Design Principles (negative constraints for Make)

[From EDS §4 — list each principle as a constraint]
- [Principle as constraint — e.g. "Acknowledge the action before asking for the next one"]

## Anti-patterns (never generate these)

[From EDS §8 Forbidden Patterns + design-system.mdc AI Slop Guard]
- [Anti-pattern — e.g. "No gradient backgrounds"]
- [Anti-pattern — e.g. "No 3-column icon-in-circle grids"]

## Mock Data Guidance

Make will generate mock data for all screens. Structure this mock data to match the real schema shape:
- Use realistic Vietnamese names, dates, and values (not "Lorem ipsum")
- Use property names that map naturally to database columns (e.g. `displayName`, `creditBalance`, `createdAt`)
- Include 3–5 items in lists to test visual density
- Include realistic prices and credit costs matching northstar §4

The tech spec agent reads these mock structures to derive the database schema. Better mocks = smoother integration.

## Screens (in build order)

### [Screen Name]
**Purpose:** [One sentence — what the user does here]
**Content hierarchy (top to bottom):**
1. [Element — e.g. "Screen header with back arrow and title"]
2. [Element — e.g. "Date selector showing 7 days"]
3. [Element — e.g. "Result card with score, date, and one-line reason"]
4. [Element — e.g. "CTA button: 'Xem chi tiết'"]
**Key copy:** [1–2 most important copy strings for visual context]
**Mood:** [From EDS emotional layers — e.g. "Relief — decision made, user can move on"]
**Mock data needed:** [What hardcoded data this screen should have — e.g. "3 result cards with date, score, reason, menh"]

[Repeat for each screen]
```

---

## Recommended Build Order

After scoping, recommend the build order for feature workstreams. If the northstar §12 (Feature Grouping) defines waves, use that structure directly. Otherwise, group by dependency:

```
Wave 1 — Foundation + Auth + Landing Page:
  Auth screens, profile/onboarding, payment infrastructure, landing page
  (Landing page is built first in Frontend Foundation — validates theme + components immediately)
  (Must complete before any feature requiring an authenticated user)

Wave 2 — Core Loop:
  Primary user action screens — the screens that deliver the core value proposition
  (Must be ≥50% of product screens)

Wave 3 — Personalization + Retention:
  Screens that deepen engagement, require core loop data to exist

Wave 4 — Social + Specialty:
  Sharing, viral mechanics, secondary features
```

If northstar §13 (User Scenarios) is present, validate: does the wave order allow each scenario to be completed end-to-end within its wave, or does a scenario cross wave boundaries? Cross-boundary scenarios indicate a missed dependency.

---

## Quality Check

### Scope plan
- Category budgets respected — core loop ≥50% of product screens
- All anti-bloat rules pass
- Build-time estimate is realistic (≤10 hours for 3-day target)
- Not Building section populated with specific feature names
- Landing page included in scope plan with all 8 sections from the section stack spec
- Landing page copy is production-ready from northstar §7b — not placeholder

### Screen metadata
- Every screen in the scope plan has a metadata block — no missing screens
- Every metadata block has **production-ready copy** — no `[label]` placeholders
- All copy strings pass the 5-question Copy Quality Test from the EDS
- Dynamic values use `{{variable}}` tokens, not hardcoded sample data
- `{{COPY:context}}` tokens used only for genuinely runtime-dependent copy
- Routes defined for every screen — using `/app/[path]` convention
- **Interaction flow defined** — step-by-step within-screen sequence including branch conditions
- Copy slots are production-ready strings tagged with context type (Decision / Confirmation / Empty / Error / Paywall / Ambient)
- All navigation paths explicit — no "goes to next screen"
- Empty state defined for every data-dependent component
- All data variables map to exact `table.column` names
- Default values defined for every nullable variable
- Dopamine moment field set on every screen — `none` or specific D[N] ID from EDS §6
- Credit cost field set on paywall-gated screens — matches northstar §5 pricing table

### Figma Make brief
- Brand context includes colors, typography, and visual register from EDS §5
- Anti-patterns section includes both EDS §8 and design-system.mdc Slop Guard rules
- Every screen in the scope plan has a brief entry with content hierarchy
- Content hierarchy matches the metadata block's component and data structure
- Build order matches feature grouping from northstar §12

### Cross-screen consistency
- Screen names consistent across all metadata blocks
- Navigation graph complete — every "Exits to" has a corresponding "Enters from"
- No orphaned screens — every screen reachable from at least one other

### Cursor-readiness
- Every screen has a unique, exact functional name ("DashboardScreen", not "Home Screen 2")
- Every navigation path names both the trigger and destination by exact name
- All data placeholders are realistic — "3 items" not "N items"
- Every screen with multiple user actions has an interaction flow with explicit branch conditions
- Paywall gates specify: what partial result is shown free, what is behind the gate, exact credit cost
- Copy slots tagged with context type — frontend agent knows which copy-rules.mdc context applies
