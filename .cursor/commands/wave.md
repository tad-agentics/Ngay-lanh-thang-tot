# /wave [w1 | w2 | w3 | w4 | legal | foundation]

Maps **build-plan waves** to the existing RAD commands in `AGENTS.md`. Use this when you think in “Wave 2” terms instead of feature ids.

## Wave → dispatch

| Say | Feature id | Run |
|-----|------------|-----|
| **`/wave foundation`** | `foundation` | **`/foundation`** (once, after Setup gate) |
| **`/wave w1`** | `auth-profile-billing` | **`/feature auth-profile-billing`** |
| **`/wave w2`** | `core-loop` | **`/feature core-loop`** |
| **`/wave w3`** | `personalization` | **`/feature personalization`** |
| **`/wave w4`** | `social-specialty` | **`/feature social-specialty`** |
| **`/wave legal`** | `legal-settings` | **`/feature legal-settings`** |

Aliases: `w01` → `w1`, `cross` → `legal`.

## Pre-flight

Same as **`/feature`** (see `.cursor/commands/feature.md`):

- [ ] Scope for that wave exists in `artifacts/plans/build-plan.md`
- [ ] **Depends on** waves are committed and QA-passed (see dependency graph in build-plan)
- [ ] `npm run build` passes

## After shipping

Update **`artifacts/plans/project-plan.md`** (table + dates). For small slices that do not need a full three-agent run, note the deviation in **`artifacts/docs/changelog.md`**.

## Source of truth

- Scope + acceptance: **`artifacts/plans/build-plan.md`** (orchestration table at top)
- Completion tracking: **`artifacts/plans/project-plan.md`**
