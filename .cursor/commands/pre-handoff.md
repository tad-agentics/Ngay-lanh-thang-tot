# /pre-handoff

Dispatch the QA Agent for the pre-handoff safety audit.
Runs after all feature waves pass QA and the visual fidelity audit is complete.

## Pre-flight checks

Before dispatching, confirm:
- [ ] All features in `artifacts/plans/project-plan.md` are marked complete
- [ ] Visual fidelity audit complete — all BLOCKING items fixed (run `/visual-audit [url]` if not done)
- [ ] `artifacts/docs/changelog.md` — 0 BLOCKING items
- [ ] `artifacts/issues/` — 0 open BLOCKING issues
- [ ] `npm run build` passes on current state

If any check fails: report to human, do not dispatch.

## Dispatch

Launch QA Agent subagent (foreground):

```
Task: Pre-Handoff Safety Audit

Read:
- .cursor/agents/qa-agent.md (your full instructions)
- .cursor/skills/review/SKILL.md (your full pre-handoff instructions)
- .cursor/rules/copy-rules.mdc (copy quality test for compliance check)
- agent-workspace/ACTIVE_CONTEXT.md
- artifacts/docs/tech-spec.md
- artifacts/docs/screen-specs-[app]-v1.md (interaction flows, credit costs for paywall gate integrity check)
- artifacts/docs/emotional-design-system.md (§6 dopamine specs for fidelity check)
- artifacts/docs/changelog.md

Mode: Pre-Handoff
Run the two-pass safety audit against the complete codebase.
Apply AUTO-FIX items directly. Escalate BLOCKING items to Tech Lead.
Signal completion when test: pre-handoff review complete is committed.
```

## After completion

**If clean (0 BLOCKING items):**
1. Update project-plan.md — mark pre-handoff complete
2. Present to human:

```
Pre-handoff audit complete. No blocking issues.

AUTO-FIX items applied: [N]
Informational findings logged: [N]

Ready for production deploy. Run /deploy when ready.
```

**If BLOCKING items found:**
1. Present findings to human
2. Create issues in `artifacts/issues/`
3. After fixes: re-run `/pre-handoff`
