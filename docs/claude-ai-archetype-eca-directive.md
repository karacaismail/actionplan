# Claude Directive: AI ArcheType + Backend ECA Guardrails

## Current Finding

The current worktree already has structural ECA (`src/engine/eca.ts`) and generated `agentPolicy` data, but the previous policy was too permissive: `tools/gen-rules.mjs` assigned `apply-gated` autonomy to `app` and `module` nodes and generated publish-oriented rules. This conflicts with the security boundary below.

## Hard Security Boundary

- AI cost is not a constraint; security is the constraint.
- AI may generate an `archetype` draft.
- AI may propose an `archetype` update.
- AI must never generate, update, publish, delete, or directly mutate `app` or `module`.
- AI must never override, disable, rewrite, or bypass rulesets.
- In production, an `archetype` update is allowed only as a gated proposal and only if historical data is preserved.
- Production update requirements: immutable snapshot, rollback plan, compatibility check, and append-only or expand-contract migration.
- ECA must not become a UI feature. ECA is backend/engine-side ruleset data used only to minimize risk.

## Required Code Shape

- Keep ECA machine-readable in `ecaRules`; do not store it only as prose.
- Keep agent authority machine-readable in `agentPolicy`; do not rely on prompt text alone.
- `app` and `module` policies must use `autonomy: "none"` for AI mutation.
- `archetype` policies may use `autonomy: "draft"` with explicit allowed targets/actions.
- Every node must include deny rules for AI app/module generation and update attempts.
- Every node must include deny rules for AI ruleset override attempts.
- ArcheType nodes must include gated rules for draft generation and production update proposals.

## Advanced Backend ECA Scenarios

- `ai.generation.requested` + `targetLevel in ["app","module"]` -> deny.
- `ai.update.requested` + `targetLevel in ["app","module"]` -> deny.
- `ai.ruleset.override.requested` -> deny.
- `ai.risk.scored` + `riskScore >= 80` -> create critical review task and require approval.
- `ai.archetype.generate.requested` + draft/staging -> create ArcheType draft, approval required.
- `ai.archetype.update.requested` + production + `historyPreserved != true` -> deny.
- `ai.archetype.update.requested` + production + preserved history + snapshot + rollback + compatibility + allowed migration -> propose production update, approval required.
- Any ECA chain depth must remain capped at 6.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm test` passes.
- Tests prove AI cannot generate/update app or module.
- Tests prove AI can generate only ArcheType drafts and can propose production ArcheType updates only with historical data preservation.
- Tests scan generated node JSON and fail if app/module policy is not `none`.
- Tests scan generated node JSON and fail if publish rules reappear as AI/ECA automation.
- Generated prompts and `items[]` text repeat the same boundary: AI only ArcheType, no app/module, no ruleset bypass, prod history preserved.

## Non-Goals

- Do not build an ECA UI.
- Do not add autonomous CI self-repair that can push code without a separate governance design.
- Do not give AI direct database, production write, ruleset edit, publish, or destructive migration authority.
