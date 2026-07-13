# ADR-0031 — Commerce OS: Instruction-Ready Handoff Decisions (D7–D13)

**Status:** ACCEPTED — 2026-07-13 (rests on a binding human-authorized directive; Codex MASTER owns these decisions)
**Scope:** Documentation decision only. This ADR produces no code/schema/JSON/queue/gate and opens no app/module node ([`AGENTS.md`](../AGENTS.md) §0, §4.4).
**Source authority:** The human closed decisions D7–D13; this ADR reflects that closure. AI cannot close a human decision — it only records it ([`phase10`](./enterprise-saas-phase-10-human-decision-audit.md) §Açık kararlar; [`ledger`](./enterprise-saas-human-decision-queue.md)).
**Status distinction (binding):** These closures make the Commerce OS handoff **instruction-ready** — a design-time GO can be granted once the downstream packets land (BC-map promotion, contract packages, delivery sequence). **Runtime / GA remains evidence-gated:** SLO/COGS/backup-restore/AI-safety proofs are still required and are *not* granted here ([`oracles`](./commerce-os-vibecoder-readiness-oracles.md) O1; [`phase-oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md)).

## Context

ADR-0030 fixed the Commerce OS product-family/app boundary and the taxonomy (`app`=island, `module`=mountain) ([`ADR-0030`](./adr-0030-commerce-operating-system-boundary.md)). The bounded-context map ([`BC-map`](./commerce-os-bounded-context-map.md)) proposed BC-01…BC-19 under two invariants: **no cross-context write** and **no dependency cycle**. Phase-9 adversarial review left an unresolved register; Phase-10 filtered it to **7 direction-changing human decisions (D7–D13)** plus evidence gates and folded items ([`phase10`](./enterprise-saas-phase-10-human-decision-audit.md)). D7 is a **publication blocker**. This ADR records the human closure of all seven and two folded technical-owner questions, so the delivery sequence ([`delivery`](./kernel-sdk-app-delivery-sequence.md)) can proceed to test-first packet authoring.

These decisions do **not** change D1–D6 (settled) and do **not** change D6 numeric targets.

## Decision table

| ID | Title | Resolution (accepted) | Accountable owner |
|---|---|---|---|
| `D7-design-time-cycle-resolution` | Design-time cycle | **Contract extraction + dependency inversion.** Business BCs never import each other; both sides depend on neutral versioned contract packages + public SDK ports. Design-time deps form a **DAG**. | Architecture authority |
| `D10-lifecycle-compensation-event-semantics` | Lifecycle / saga / events | **Cart owns cart/checkout session → `CheckoutSubmitted` (purchase intent).** Order Orchestration alone writes the order + owns lifecycle + is the saga/process manager. | Architecture authority |
| `D8-export-bundle-disposition-owner` | Canonical export / disposition | **Explicit split:** Platform owns envelope/manifest/crypto/streaming/import-verify runtime; each domain owns payload schema + semantic completeness; governance owns retention/disposition; evidence/audit owns attestation. | Platform + domain + governance (split) |
| `D9-metadata-upgrade-and-restore-authority` | Schema-evolution / restore / crypto-shred | **Split authorities:** metadata/schema-evolution, data-resilience, and key-management are three named owners; no single ambiguous owner. | Three named authorities |
| `D11-provisional-bc-direction` | Channel / Classifieds / Recommerce | **Channel DEMOTE** to integration/projection/config; **Classifieds DEMOTE** to optional edition over Catalog/Offer/CRM/Entitlement; **Recommerce KEEP PROVISIONAL** as a later-edition BC candidate, out of first core slice. | Authority + Catalog/CRM owners |
| `D12-ai-high-risk-review-threshold-owner` | AI high-risk human review | **Central AI Governance accountable owner + domain use-case owner.** Mandatory human approval before high-risk AI action. | AI Governance + domain owner |
| `D13-pilot-validation-envelope` | Pilot validation envelope | **One parameterized reference envelope.** Required fields filled before pilot evidence; default fixture is engineering-only, not contractual proof. D6 targets unchanged. | Commercial/governance + platform |

## D7 — Contract/package dependency model (binding)

- Business BCs **do not directly import each other**. A producer and a consumer both depend on a **neutral, versioned commerce integration-contract package** and on **public SDK ports** — never on each other's internals.
- **Design-time package dependencies form a DAG.** Runtime message feedback (events flowing "backward") may exist, but that does **not** license a design-time cycle. **"It's async" is not, by itself, a solution** to a dependency cycle.
- Direction of dependency (design-time): domain implementations → contract packages ← other domain implementations. Contract packages have no dependency on any business BC.

```
  [BC-03 Cart]        [BC-04 Order]        [BC-05 Inventory]   [BC-07 Payment]   [BC-06 Fulfillment]
        \                 |   |                   |                 |                  |
         \                |   |                   |                 |                  |
          v               v   v                   v                 v                  v
   +------------------------------------------------------------------------------------------+
   |   Versioned commerce integration-contract packages  (events, commands, DTOs, SDK ports)  |
   +------------------------------------------------------------------------------------------+
                       ^  (packages depend on nothing above; DAG root)
```

Both `producer` and `consumer` compile only against contract packages + SDK ports; there is no `import order from cart` or `import cart from order` edge. Versioning is explicit (major = breaking); consumers pin a contract version.

## D10 — Lifecycle / saga / event semantics (binding)

- **Cart & Checkout (BC-03)** owns the cart and checkout session and publishes **`CheckoutSubmitted`** — a *purchase intent*, **not** `OrderPlaced`. Cart never writes an order.
- **Order Orchestration (BC-04)** alone **creates and writes the order** and owns the order lifecycle; it publishes **`OrderCreated` / `OrderConfirmed` / `OrderCancelled`**.
- Order is the **saga / process manager** for: inventory reservation → commit → release; payment authorization → capture → refund-request; fulfillment start → cancel.
- **Inventory (BC-05), Payment (BC-07), Fulfillment (BC-06)** own their own state and **return outcomes through versioned contracts**. **No cross-context write** — Order sends commands and consumes outcome events; it does not write into their stores.
- **Required semantics (must be specified before implementation):**
  - **Cancellation:** Order-initiated; issues compensating commands (release reservation, request refund, cancel fulfillment) and emits `OrderCancelled` only after compensations acknowledge.
  - **Reservation expiry / release:** Inventory owns reservation TTL; on expiry it emits a release outcome; Order treats late reservation as failed and compensates.
  - **Return / refund:** Fulfillment owns RMA/return; Payment owns refund execution on Order's refund-request command.
  - **Duplicate / replay / out-of-order:** all saga commands are **idempotent** (keyed by order + step id); consumers dedupe on message id; out-of-order outcomes reconcile against the order state machine, never overwrite a terminal state.
  - **Compensation:** explicit and named per step; no implicit rollback.

## D8 — Canonical export / disposition (binding)

Explicit split, no single owner of the whole:
- **Platform** owns the export **envelope/manifest, encryption/signing, streaming, checksum**, and the **import/verification runtime**.
- **Each domain** owns its **versioned payload schema** and **semantic completeness** of its slice of the export.
- **Data governance** owns **retention/disposition policy**; **evidence/audit** owns **attestation** of export/disposition.
- **Türkiye counsel** validates **legal precedence** (which rule wins when jurisdiction and policy conflict).
- **Providers never own the canonical export.** A provider export is an input, not the system of record.

## D9 — Schema-evolution / resilience / key-management authorities (binding)

Three named authorities, no single ambiguous owner:
- **Metadata / schema-evolution authority** owns backward/forward **compatibility**, **expand-migrate-contract**, **canary**, and **rollback gates**.
- **Data-resilience authority** owns **backup/restore integrity** and **RPO/RTO drills**.
- **Key-management authority** owns **rotation/revocation/crypto-shred execution**; **governance/counsel authorize irreversible erasure** (crypto-shred is executed by KMS but *authorized* by governance).

## D11 — Provisional BC direction (binding)

- **Channel: DEMOTE** to an integration/projection/config surface — not a business BC that owns data.
- **Classifieds: DEMOTE** to an **optional edition/configuration/workflow** layered over Catalog/Offer/CRM/Entitlement. It **cannot own or copy REOC Property/Listing** data.
- **Recommerce: KEEP PROVISIONAL** as a **later-edition BC candidate**, because serialized asset / provenance / condition / disposition can have an independent lifecycle. It is **outside the first core slice** and **cannot be implemented before the core gate**.

## D12 — AI high-risk human review (binding)

- **Central platform AI Governance = accountable owner; domain = use-case owner.**
- **Mandatory human approval before any high-risk AI action** affecting: money; access/entitlement; legal/regulated decisions; personal/sensitive data disclosure; cross-tenant data; irreversible customer-visible publication; or model/plugin permission expansion.
- **Automatic abstain / degrade / kill-switch is allowed** (safety may fire without a human).
- **Model/version rollback and policy-threshold changes are human-gated.**
- **Budget stop is a platform safety primitive**; **cost allocation/attribution is a FinOps/metering authority** concern (see folded owners).

## D13 — Pilot validation envelope (binding)

- Choose **one parameterized reference validation envelope**. D6 targets are **unchanged**; the envelope only makes them *measurable*.
- **Required filled fields before pilot evidence:** deployment region; 30-day availability window; workload mix; tenant size/mix; provider exclusions/inclusions; data volumes; concurrency/RPS; **2× burst for 15 min**; **8 h soak**; cost/revenue window.
- **Default engineering fixture (NOT contractual proof):** 20 tenants, 1 aggressor tenant, 1M products, 5M offers, 2,000 read RPS, 200 mutation RPS, external-provider latency excluded where [`ADR-0030`](./adr-0030-commerce-operating-system-boundary.md)/D6 says so.
- **Pilot-specific envelope values must be recorded before validation runs.**

## Folded technical owners (closed here)

- **Cost / FinOps:** Platform **FinOps/metering owns canonical cost observations + allocation rules**; Commerce **commercial ops owns plan / pass-through policy**. (Budget stop stays a platform safety primitive per D12.)
- **Key recovery:** Yalnız yetkili **KMS/key-management redundancy, backup ve DR** yolu kullanılabilir; ürün-yönetimli veya plaintext escrow/bypass yoktur. Tüm yetkili recovery materyali kaybedildikten sonra erişim **fail-closed** olur; ürün gizlice yeni bir kurtarma yolu açamaz.

## Accepted alternative (why this shape)

Dependency inversion via versioned contract packages + a single order-owning saga is accepted because it satisfies both BC-map invariants simultaneously: it breaks the design-time cycle **at compile time** (DAG of packages) while still allowing rich runtime event feedback, and it keeps every write inside its owning context (Order commands, domains write themselves). Split authorities (D8/D9) are accepted over a single "data owner" because export, schema-evolution, resilience, and key-management have genuinely different competencies and blast radii.

## Rejected alternatives

- **"Make the cross-import async" (D7).** Rejected: async messaging does not remove a design-time package cycle; it hides it. The DAG must hold at build time.
- **Shared "commerce-core" library both BCs import (D7).** Rejected: a bidirectional shared lib re-creates the cycle and couples internals; only neutral versioned contracts are allowed.
- **Cart emits `OrderPlaced` / creates the order (D10).** Rejected: two writers of order state; violates single-owner + no-cross-context-write.
- **Order writes directly into inventory/payment/fulfillment stores (D10).** Rejected: cross-context write; destroys autonomy and idempotency guarantees.
- **Single "data platform" owns export + schema + backup + keys (D8/D9).** Rejected: ambiguous accountability; incompatible competencies; oversized blast radius.
- **Provider export as canonical (D8).** Rejected: loses portability/legal control; provider lock-in.
- **Classifieds/Channel as full data-owning BCs now; Recommerce in first slice (D11).** Rejected: duplicates REOC/Catalog authority and widens the first slice beyond the sellable minimum.
- **Fully autonomous high-risk AI actions with post-hoc review (D12).** Rejected: irreversible money/access/legal/publication effects require human pre-approval.
- **Per-target ad-hoc validation numbers (D13).** Rejected: non-comparable, non-baselineable; envelope fields must be recorded first.
- **Product-managed/plaintext key escrow veya KMS dışı bypass (folded).** Rejected: crypto-shred ve gizliliği zayıflatır. Meşru kurtarma yalnız yetkili KMS redundancy/backup/DR sözleşmesidir; bunlar da kaybedilirse sistem fail-closed kalır.

## Consequences

Positive:
- The design-time cycle is provably broken; the BC-map DAG can be enforced by package boundaries.
- Order lifecycle has one writer and explicit compensation → predictable cancellation/refund/replay behavior.
- Every authority (export, schema, resilience, keys, AI, cost) has a named accountable owner → no orphaned risk.
- The handoff becomes instruction-ready; downstream packets can be authored test-first.

Negative / cost:
- Contract packages add versioning/release overhead and an extra indirection layer per integration.
- Split authorities require cross-team coordination (RACI) and more governance ceremony.
- Recommerce provisional status may read as "missing"; this is a deliberate scope choice.

## Migration impact

- This ADR **changes no existing node** and opens **no app/module node** ([`AGENTS.md`](../AGENTS.md) §4.4).
- BC-map promotion, contract-package extraction, and the delivery sequence remain **separate, human-approved, test-first** changesets ([`delivery`](./kernel-sdk-app-delivery-sequence.md); [`decision ledger`](./enterprise-saas-human-decision-queue.md)).
- Existing `s-*` commerce nodes are mapped to Commerce OS BCs only via a later item-level triage; not done here.

## Safety invariants (must hold downstream)

1. Design-time package dependency graph is a **DAG**; a build that introduces a BC→BC import fails.
2. **No cross-context write**; a context writes only its own data authority.
3. **Order is the single writer** of order state; Cart emits intent only.
4. All saga commands are **idempotent**; terminal states are never overwritten by late/out-of-order outcomes.
5. **Crypto-shred / irreversible erasure** requires governance/counsel authorization; **key loss is fail-closed**.
6. **High-risk AI action** is human-gated; only abstain/degrade/kill-switch may fire automatically.

## Evidence still required (runtime/GA gate — NOT granted here)

- D7: build-enforced DAG check + published versioned contract packages.
- D10: saga tests for cancellation, reservation expiry, refund, duplicate/replay/out-of-order + compensation.
- D8/D9: export round-trip + import-verify proof; backup/restore RPO/RTO drill; rotation/revocation/crypto-shred drill.
- D12: high-risk AI approval workflow + kill-switch drill.
- D13: recorded pilot envelope values + measured D6 targets under that envelope.
- Closure of O1 and the phase oracles ([`oracles`](./commerce-os-vibecoder-readiness-oracles.md) O1; [`phase-oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md)).

## Related documents

- [`ADR-0030`](./adr-0030-commerce-operating-system-boundary.md) · [`BC-map`](./commerce-os-bounded-context-map.md) · [`human-decision-queue`](./enterprise-saas-human-decision-queue.md)
- [`phase10`](./enterprise-saas-phase-10-human-decision-audit.md) · [`readiness-oracles`](./commerce-os-vibecoder-readiness-oracles.md) · [`phase-oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md)
- [`delivery-sequence`](./kernel-sdk-app-delivery-sequence.md) · [`AGENTS.md`](../AGENTS.md)
