# Project Plan — Ngày Lành Tháng Tốt (ngaytot)

## Planning Phases

- [ ] Phase 2 — Screen Specs + Figma Make Brief *(optional this run)*
- [x] Figma Make — code in `src/make-import/`
- [x] Phase 4 — Tech spec + schema + seed + `app/lib/api-types.ts`
- [x] Setup — `build-plan.md`, `project.mdc`, UI deps

## Foundation

- [x] Backend foundation        commit: `9fbdc8d`
- [x] Frontend: Make import + landing + auth        commit: `799dfa2`

## Feature Workstreams

**Dispatch:** use **`/feature <Feature>`** or **`/wave wN`** — see `artifacts/plans/build-plan.md` (orchestration table) and `.cursor/commands/wave.md`.

| Feature | Wave | Backend | Frontend | QA | Commit |
|---|---|---|---|---|---|
| foundation | Foundation | complete | complete | — | `9fbdc8d`, `799dfa2` |
| auth-profile-billing | W1 | complete | complete | PASS (build + vitest) | `3e4ae95` + screens |
| core-loop | W2 | complete | complete | PASS (build + vitest; E2E manual) | staging |
| personalization | W3 | complete | complete | PASS (build + vitest) | `1b2d074` backend, `5e59150` screens |
| social-specialty | W4 | complete | complete | PASS (build + vitest) | `6de2bd2`, `e913ae1` |
| legal-settings | cross | complete (no DB scope) | complete | PASS (build + vitest) | `29252ea` backend, screens: latest |

## Post-Build

- [ ] Visual fidelity audit (Product Designer — staging URL vs Make code)
- [ ] Pre-handoff code review (QA Agent — /review skill)

## Issues

See `artifacts/issues/`
BLOCKING: 0 | NON-BLOCKING: 0
