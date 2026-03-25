# /feature [name]

Dispatch a complete feature workstream: Backend → Frontend → QA in sequence.
Each step runs as a foreground subagent and must commit before the next is dispatched.

Usage: `/feature auth` or `/feature goal-creation`

## Pre-flight checks

Before dispatching, confirm:
- [ ] Feature `[name]` exists in `artifacts/plans/build-plan.md`
- [ ] Foundation is committed (`feat(foundation): backend infrastructure complete` + `feat(foundation): shared components + landing page + auth screens complete`)
- [ ] All features this one depends on are committed and QA-passed (check build-plan.md dependency graph)
- [ ] `npm run build` passes on current state

If any check fails: report to human, do not dispatch.

## Step 1 — Backend

Launch Backend Developer subagent (foreground):

```
Task: Feature [name] — Backend

Read:
- .cursor/agents/backend-developer.md (your full instructions)
- agent-workspace/ACTIVE_CONTEXT.md
- artifacts/docs/tech-spec.md
- artifacts/plans/build-plan.md — read the [name] feature context package specifically

Mode: Feature
Build the backend for the [name] feature only — migration, RLS, data hooks, Edge Functions (if needed).
Most features are client → RLS direct and need no Edge Functions.
Signal completion when feat([name]): backend complete is committed.
```

Wait for `feat([name]): backend complete` commit before proceeding.

## Step 2 — Frontend

Launch Frontend Developer subagent (foreground):

```
Task: Feature [name] — Frontend

Read:
- .cursor/agents/frontend-developer.md (your full instructions)
- .cursor/rules/copy-rules.mdc (copy formula, quality test — enforce on all copy)
- agent-workspace/ACTIVE_CONTEXT.md
- artifacts/plans/build-plan.md — read the [name] feature context package specifically
- artifacts/docs/screen-specs-[app]-v1.md — screens for this feature only (metadata: interaction flows, dopamine moment flags, production-ready copy slots, credit costs)
- artifacts/docs/design-system-spec.md
- artifacts/docs/emotional-design-system.md — read §6 if any screen has a dopamine moment flag (D1–D4)

Mode: Feature
For each screen: find the corresponding Make component in src/make-import/, port into route file per frontend.mdc porting workflow.
- Implement interaction flows exactly as specified in screen spec metadata
- Copy slots are production-ready — use verbatim
- Add loading/error/empty states (Make output only has happy path)
Signal completion when feat([name]): screens complete is committed.
```

Wait for `feat([name]): screens complete` commit before proceeding.

## Step 3 — QA

Launch QA Agent subagent (foreground):

```
Task: Feature [name] — QA

Read:
- .cursor/agents/qa-agent.md (your full instructions)
- .cursor/rules/copy-rules.mdc (copy quality test — validate all screen copy)
- agent-workspace/ACTIVE_CONTEXT.md
- artifacts/docs/tech-spec.md
- artifacts/plans/build-plan.md — read the [name] acceptance criteria specifically
- artifacts/docs/screen-specs-[app]-v1.md — metadata for this feature's screens
- artifacts/docs/emotional-design-system.md — §6 dopamine specs if any screen has a D1–D4 flag

Mode: Feature
Validate the complete [name] feature end-to-end.
Run /testing skill checklist, write tests, run test suite.
Additional: interaction flow completeness, copy quality test, RLS validation, auth guard, dopamine fidelity.
Signal PASS or BLOCKING with specific items.
```

## After completion

**If PASS:**
1. Update `artifacts/plans/project-plan.md` — mark feature complete
2. Update `agent-workspace/ACTIVE_CONTEXT.md`
3. Report to human: "Feature [name] complete ✓. [Next wave features / All Wave N done]"

**If BLOCKING:**
1. Create `artifacts/issues/[feature-name]-[short-description].md`
2. Report to human with blocking list
3. After fix: re-run Step 3 (QA only)
