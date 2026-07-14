# Commerce Operating System — Human Developer Task-Packet Catalog (V0…V16)

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM ardıl koordinasyon yetkilisidir. AI erişimi
> `read-only-audit`, platform yürütücüsü `human-developer-only`dır. Dosya adı içindeki
> `vibecoder` yalnız tarihsel ref uyumluluğu için korunur.

**Status:** HUMAN-DEVELOPER HANDOFF — 2026-07-13. **Instruction-ready, NOT runtime/GA-ready.** No packet below is done; each is a test-first human handoff. No green test, working slice, or SLO is claimed ([`readiness-oracles`](./commerce-os-vibecoder-readiness-oracles.md) O10).
**Authority:** Codex owns final scope/review, PM coordinates the sequence, AI actors only perform `read-only-audit`, and only the human developer may create a clean implementation worktree/branch, write code/tests, commit, or open a PR. This file itself produces no code/schema/JSON/queue/node/gate.
**Master handoff:** [`commerce-os-test-first-parallel-handoff.md`](./commerce-os-test-first-parallel-handoff.md) (phase DAG, waves, selection rules, no-go). Read it first.

## How to read a packet (canonical — not repeated per packet)

Every packet carries all **14 oracle fields** ([`readiness-oracles`](./commerce-os-vibecoder-readiness-oracles.md) §3, O5) plus ≥1 **non-goal**: `id · objective · non-goal · inputs · allowed-files · forbidden-files · prerequisites · red-tests-first · implementation-steps · test-commands · acceptance-criteria · evidence · rollback · stop-conditions · budget`.

- **Budget (all packets, canonical):** ≤ **400 net lines** · ≤ **20 files** · single purpose · one PR per packet or smaller ([`AGENTS.md`](../AGENTS.md) §4.3). Overflow ⇒ split, never stretch.
- **Test-first (all packets):** write the RED test, observe fail-closed, *then* implement ([`task-to-code-contract`](./task-to-code-contract.md) §2–3). RED family IDs (F1–F16) are defined in [`contract-test plan`](./commerce-os-contract-test-plan.md); packets reference them, not restate them.
- **Waterfall (all data-bearing packets):** `requirements → test-plan/RED → db-schema/migration contract → development → test-qa`. V5–V11 production code cannot begin before its packet-local schema/migration decision and rollback are reviewed; gerektiğinde packet child PR'lara bölünür ama sıra atlanmaz.
- **Forbidden-files (all packets, canonical):** this `actionplan` docs repo; the platform **dirty working tree**; any other packet's directories (single-writer, [`AGENTS.md`](../AGENTS.md) §6); any `*.json` node under `src/data/generated/nodes/**`; queue/schema/gate generators; git `commit/push/merge/reset/clean/stash`. Each packet lists only its *additional* forbidden paths.
- **Command reality:** existing platform commands are `cd apps/api && uv run --python 3.12 pytest -q` · `pnpm test` · `pnpm test:tokens|test:smoke|test:surface|test:storefront` · `make test|up|health`. Commands that depend on files a packet *creates* are marked **expected-after-scaffold (not currently existing)** and must be made real by that packet.
- **Stop (all packets):** any global no-go in the master handoff §9 ⇒ STOP and return to Codex.

Proposed but explicit target paths (implementation repo): kernel `apps/api/src/meta_api/kernel/contracts/**` (+ tests `apps/api/tests/kernel/contracts/**`); SDK `packages/sdk/**`; app-core + BCs `apps/api/src/meta_api/apps/commerce_os/**` (+ tests `apps/api/tests/commerce_os/**`); web `apps/web/src/apps/commerce-operating-system/**` (+ e2e `apps/web/e2e/commerce-os/**`); probes `apps/api/tests/probes/commerce_os/**` + `infra/commerce-os/**`.

---

## V0 — Clean sibling worktree preflight (read-only, writes no files)

- **Objective:** Establish a clean, isolated implementation workspace from an explicitly recorded base commit, without touching the user's dirty tree.
- **Non-goal:** Writing any file, running any test, or consuming/discarding the dirty changes.
- **Inputs:** Master handoff §5; reviewer-confirmed clean base commit (e.g. `930c09b4041fe91b5682806eb391b70745c007cd`); [`implementation-workspace-manifest`](./implementation-workspace-manifest.md).
- **Allowed-files:** none (read-only preflight). Records the base commit only in packet evidence.
- **Forbidden-files:** canonical + **any write anywhere**; `git stash/reset/clean/checkout -f`; copying the dirty tree.
- **Prerequisites:** platform repo reachable; base commit recorded and confirmed clean by reviewer.
- **Red-tests-first:** preflight assertion (manual/scripted read-only) that FAILS if the base commit is dirty/unreachable or if repo roots (`apps/api/src/meta_api`, `apps/api/tests`, `apps/web/src`, `packages/ui`, `infra`) are absent.
- **Implementation-steps:** (1) record base commit in evidence; (2) create a clean sibling worktree on a fresh branch from that commit (`git worktree add ../commerce-os-impl <base>`), sibling to the dirty checkout; (3) verify roots present; (4) confirm baseline commands invokable read-only.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q --collect-only` (collection only, no run) · `make health`.
- **Acceptance-criteria:** worktree is clean (`git status` empty), branched from the recorded commit; no dirty file present; roots verified; no file written.
- **Evidence:** recorded base commit SHA + `git worktree list` + clean `git status` capture.
- **Rollback:** `git worktree remove` the sibling; nothing else to undo (no writes).
- **Stop-conditions:** base commit dirty/unrecorded/unreachable, or any instruction implies stashing/resetting/copying the dirty tree ⇒ STOP.
- **Budget:** 0 files (read-only).

---

## V1 — Kernel public-contract gap audit + missing scaffolds (test-first)

- **Objective:** Audit the kernel public contract surface and scaffold **only the contracts proven missing**, test-first.
- **Non-goal:** Inventing new kernel primitives, or scaffolding a contract that already exists ([`commerce-os-kernel-sdk-gap-directive`](./commerce-os-kernel-sdk-gap-directive.md) §3).
- **Inputs:** delivery-sequence §Kernel gate (`check-core-contract`); kernel-sdk-gap directive; readiness-oracles O6.
- **Allowed-files:** `apps/api/src/meta_api/kernel/contracts/**` and `apps/api/tests/kernel/contracts/**` — **only where the audit proves a contract is missing.**
- **Forbidden-files:** canonical + any BC/app-core/SDK/web path; kernel internals outside `contracts/**`.
- **Prerequisites:** V0 green (clean worktree).
- **Red-tests-first:** F1 boundary intent — a RED test asserting a required kernel port contract (tenancy/identity/PDP/event-bus/audit/ledger) is missing or unsigned; fails until scaffolded.
- **Implementation-steps:** (1) enumerate required public contracts vs present; (2) record present-vs-missing table in evidence; (3) for each *missing* one, add the contract scaffold + its RED contract test; (4) leave existing contracts untouched.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/kernel/contracts` · kernel `check-core-contract` (existing gate).
- **Acceptance-criteria:** every required public contract exists or has a scaffold + RED test; no new primitive invented; `check-core-contract` reference wired.
- **Evidence:** gap table (present/missing) + RED→scaffold diff.
- **Rollback:** delete added scaffolds/tests under `kernel/contracts/**`.
- **Stop-conditions:** audit cannot prove a gap (don't scaffold) or `check-core-contract` RED for unrelated reasons ⇒ STOP.
- **Budget:** canonical.

---

## V2 — Public SDK package / ports (packages/sdk created only here)

- **Objective:** Create the public SDK package wrapping kernel public contracts as typed ports; **`packages/sdk` may be created only in this packet.**
- **Non-goal:** Leaking kernel internal types; adding any commerce/business logic.
- **Inputs:** V1 kernel contracts; delivery-sequence §SDK (`packages/sdk`); implementation-workspace-manifest.
- **Allowed-files:** `packages/sdk/package.json`, `packages/sdk/src/ports/**`, `packages/sdk/tests/ports/**` (package scaffold + typed ports).
- **Forbidden-files:** canonical + kernel internals; any `apps/**` path.
- **Prerequisites:** V1 green.
- **Red-tests-first:** typed-port signature RED test (port absent) + forbidden-stack scan; kernel-internal-leak negative test.
- **Implementation-steps:** (1) create `packages/sdk` manifest; (2) generate/define typed ports over V1 public contracts; (3) add package tests; (4) wire deterministic codegen if applicable.
- **Test-commands:** `pnpm --filter @commerce-os/sdk test` — **expected-after-scaffold (not currently existing;** `packages/sdk` is documented in the manifest but currently absent).
- **Acceptance-criteria:** SDK exposes only public ports; no kernel-internal import; package test suite defined and RED→green transition recorded.
- **Evidence:** RED→green port tests + forbidden-stack/leak scan report.
- **Rollback:** remove `packages/sdk/**`.
- **Stop-conditions:** attempt to create `packages/sdk` outside V2, or SDK importing kernel internals ⇒ STOP.
- **Budget:** canonical.

---

## V3 — Commerce OS app-core composition skeleton

- **Objective:** Define the `commerce-operating-system` app-core composition root (slug, capability map, event namespace, default policy) with no BC surface.
- **Non-goal:** Implementing any BC domain logic or business event payloads.
- **Inputs:** delivery-sequence §App-core (slug `commerce-operating-system`, namespace `commerce_os_*`, event `commerce-os.*`); BC-map §7; ADR-0030.
- **Allowed-files:** `apps/api/src/meta_api/apps/commerce_os/**` (app-core composition only) + `apps/api/tests/commerce_os/**` (app-core tests) + `apps/web/src/apps/commerce-operating-system/**` shell.
- **Forbidden-files:** canonical + any `commerce_os/<bc>/**` subdirectory; SDK/kernel paths.
- **Prerequisites:** V2 green.
- **Red-tests-first:** RED app-core `healthz` + slug/capability/event-namespace registration test (composition absent).
- **Implementation-steps:** (1) register app slug/namespace; (2) define capability map + default policy; (3) app-core healthz; (4) declare BC binding contract slots (empty).
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os` · `pnpm test:smoke` (web shell).
- **Acceptance-criteria:** app-core composes and healthz passes; no BC directory created; namespace/policy defaults present.
- **Evidence:** RED→green app-core registration + healthz.
- **Rollback:** remove app-core composition files.
- **Stop-conditions:** any BC module scaffolded before app-core exists (delivery-sequence Gate 2) ⇒ STOP.
- **Budget:** canonical.

---

## V4 — Neutral versioned integration-contract packages + import-DAG guard

- **Objective:** Publish the neutral, versioned commerce integration-contract packages (events/commands/DTOs) and a build-enforced **import-DAG guard**; contracts depend on no business BC.
- **Non-goal:** Placing any BC logic in the contract packages; allowing a BC→BC import to compile.
- **Inputs:** ADR-0031 D7; BC-map §5 DAG + §6 message table; contract-test plan F1/F2.
- **Allowed-files:** `packages/sdk/src/contracts/**`, `packages/sdk/tests/contracts/**` (neutral integration contracts + DAG/compatibility tests). V2 owns manifest + `ports/**`; V4 owns only `contracts/**` — globs çakışmaz.
- **Forbidden-files:** canonical + any `apps/**` BC path.
- **Prerequisites:** V2 + V3 green.
- **Red-tests-first:** **F1** package-dag-no-bc-import (RED: a BC import or a cycle must fail the build) + **F2** contract-version-compat (RED: breaking change without major bump).
- **Implementation-steps:** (1) define versioned event/command/DTO contracts for BC-01…BC-07 boundaries (`CheckoutSubmitted`, `Reserve/ReleaseStock`, `Authorize/Capture/RefundPayment`, `Start/CancelFulfillment`, outcomes); (2) add semver + consumer-pin rules; (3) implement the import-DAG guard.
- **Test-commands:** `pnpm --filter @commerce-os/contracts test` and the DAG-guard check — **expected-after-scaffold (not currently existing).**
- **Acceptance-criteria:** contract packages have zero dependency on any BC; DAG guard fails on a synthetic `import order from cart`; major=breaking enforced.
- **Evidence:** F1 DAG/import-boundary report + F2 compatibility matrix (RED→green).
- **Rollback:** remove contract sub-packages + guard config.
- **Stop-conditions:** guard cannot fail a synthetic BC→BC import, or "async" proposed as a cycle fix ⇒ STOP.
- **Budget:** canonical.

---

## Wave A (after V4, ≤4 parallel, disjoint dirs) — V5 · V6 · V8 · V9

Each writes only its own BC subdirectory under `apps/api/src/meta_api/apps/commerce_os/<bc>/**` and `apps/api/tests/commerce_os/<bc>/**`, compiling only against V4 contracts + V2 SDK ports. **No BC imports another BC.** Common per-BC fields: `test-commands` = `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os/<bc>`; `rollback` = remove that `<bc>/**` subtree; `budget` = canonical; `stop` = cross-context write / BC→BC import / provider execution embedded ⇒ STOP.

## V5 — Catalog Governance (BC-01)
- **Objective:** Catalog authority (product/variant/attribute/taxonomy/asset-ref + governance) publishing `ProductPublished`/`ProductDiscontinued`.
- **Non-goal:** Holding price/stock or doing discovery/ranking (BC-map §2 BC-01 non-goals).
- **Inputs:** BC-map BC-01; V4 contracts; F3 tenant-isolation.
- **Allowed-files:** `.../commerce_os/catalog_governance/**` + `tests/commerce_os/catalog_governance/**`.
- **Forbidden-files:** canonical + any other BC dir; price/stock authority.
- **Prerequisites:** V4 green.
- **Red-tests-first:** F3 tenant-isolation (cross-tenant read/write denied) + RED model/lifecycle (draft→in-review→active→discontinued) contract test.
- **Implementation-steps:** define model + governance lifecycle; publish outcome events via V4 contracts; tenant-scoped store.
- **Acceptance-criteria:** lifecycle enforced; only Catalog data written; `ProductPublished` conforms to pinned contract; tenant-escape denied.
- **Evidence:** RED→green model/lifecycle + tenant-escape negative report.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os/catalog_governance` (expected after packet scaffold).
- **Rollback:** remove only `catalog_governance/**`; retain shared V4 contracts.
- **Stop-conditions:** cross-context write, price/stock authority, or BC→BC import appears ⇒ STOP.
- **Budget:** canonical ≤400 net lines / ≤20 files; split before starting if exceeded.

## V6 — Offer & Pricing (BC-02)
- **Objective:** Offer/price-list/rule/CPQ authority publishing `PriceCalculated`/`OfferPublished`, consuming `ProductPublished`.
- **Non-goal:** Applying promotions or taking payment (BC-02 non-goals); computing tax in-app (external provider).
- **Inputs:** BC-map BC-02; V4 contracts; F3.
- **Allowed-files:** `.../commerce_os/offer_pricing/**` + `tests/commerce_os/offer_pricing/**`.
- **Forbidden-files:** canonical + other BC dirs; embedded tax execution.
- **Prerequisites:** V4 green (may run parallel to V5/V8/V9).
- **Red-tests-first:** F3 + money-rounding property RED (lossless totals) + RED price-rule contract test.
- **Implementation-steps:** offer/rule model; price calculation; publish `PriceCalculated`/`OfferPublished`; tax via provider port only.
- **Acceptance-criteria:** deterministic lossless pricing; tax stays behind provider port; events conform.
- **Evidence:** RED→green pricing + rounding property report.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os/offer_pricing` (expected after packet scaffold).
- **Rollback:** remove only `offer_pricing/**`; retain shared V4 contracts.
- **Stop-conditions:** embedded tax/payment execution, Catalog store write, or BC→BC import appears ⇒ STOP.
- **Budget:** canonical ≤400 net lines / ≤20 files; split before starting if exceeded.

## V8 — Inventory & Availability (BC-05)
- **Objective:** Stock/reservation (TTL owner)/ATP authority; consume `ReserveStock`/`ReleaseReservation`; publish `StockReserved`/`ReservationReleased`/`ReservationExpired`/`AvailabilityConfirmed`/`StockLevelChanged`.
- **Non-goal:** Writing order state or executing replenishment/shipping (BC-05 non-goals).
- **Inputs:** BC-map BC-05 + §2.1; V4 contracts; F6 reservation-expiry; F9 idempotency.
- **Allowed-files:** `.../commerce_os/inventory_availability/**` + `tests/commerce_os/inventory_availability/**`.
- **Forbidden-files:** canonical + other BC dirs; order-state writes.
- **Prerequisites:** V4 green (parallel to V5/V6/V9).
- **Red-tests-first:** F6 reservation-expiry-release + F9 duplicate/replay idempotency + inventory-race RED (no oversell).
- **Implementation-steps:** stock model + reservation TTL owner; consume reserve/release commands; emit outcomes incl. `ReservationExpired`.
- **Acceptance-criteria:** TTL owned by Inventory; no oversell under concurrency; commands idempotent; no order-state write.
- **Evidence:** RED→green expiry/release + race + idempotency reports.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os/inventory_availability` (expected after packet scaffold).
- **Rollback:** remove only `inventory_availability/**`; retain shared V4 contracts.
- **Stop-conditions:** order-state write, oversell invariant failure, or BC→BC import appears ⇒ STOP.
- **Budget:** canonical ≤400 net lines / ≤20 files; split before starting if exceeded.

## V9 — Payment & Adjustment provider-neutral orchestration (BC-07)
- **Objective:** Payment-intent/txn/refund/adjustment authority; consume `AuthorizePayment`/`CapturePayment`/`RefundPayment`; publish `PaymentAuthorized`/`PaymentCaptured`/`PaymentFailed`/`PaymentRefunded`/`AdjustmentApplied`; **regulated execution stays behind an external provider port.**
- **Non-goal:** Executing licensed payment/settlement in-app (delegated to PSP/escrow/MoR provider); doing reconciliation.
- **Inputs:** BC-map BC-07; ADR-0030 §7; V4 contracts; F7 provider-failure; F9.
- **Allowed-files:** `.../commerce_os/payment_adjustment/**` + `tests/commerce_os/payment_adjustment/**`.
- **Forbidden-files:** canonical + other BC dirs; embedding PSP/escrow/MoR execution as canonical authority.
- **Prerequisites:** V4 green (parallel to V5/V6/V8).
- **Red-tests-first:** F7 payment-provider-failure (degraded/circuit-breaker) + F9 double-capture/refund idempotency negative.
- **Implementation-steps:** payment-intent model; command handlers behind provider port; degraded-mode + idempotent capture/refund.
- **Acceptance-criteria:** provider behind port (not canonical authority); PSP outage ⇒ `PaymentFailed` outcome, no double-write; capture/refund idempotent.
- **Evidence:** RED→green provider-failure + double-capture/refund reports.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os/payment_adjustment` (expected after packet scaffold).
- **Rollback:** remove only `payment_adjustment/**`; retain provider port and shared V4 contracts.
- **Stop-conditions:** licensed execution becomes canonical, double capture/refund occurs, or BC→BC import appears ⇒ STOP.
- **Budget:** canonical ≤400 net lines / ≤20 files; split before starting if exceeded.

---

## V7 — Cart & Checkout intent (BC-03) [Wave B]

- **Objective:** Cart/checkout-session authority publishing **`CheckoutSubmitted`** (purchase intent), consuming `PriceCalculated`/`OfferPublished`/`AvailabilityConfirmed`. **Cart never writes an order.**
- **Non-goal:** Emitting `OrderPlaced`/`OrderCreated`, creating/writing an order, executing payment, or owning stock (BC-03 non-goals; D10).
- **Inputs:** BC-map BC-03; ADR-0031 D10; contract-test F4; V5/V6/V8 frozen contracts.
- **Allowed-files:** `.../commerce_os/cart_checkout/**` + `tests/commerce_os/cart_checkout/**`.
- **Forbidden-files:** canonical + Order/Payment/Inventory dirs; any order-store write.
- **Prerequisites:** V5 + V6 + V8 contracts frozen (Wave B).
- **Red-tests-first:** **F4** cart-intent-vs-order-single-writer (RED: Cart publishing `OrderPlaced`/`OrderCreated`, or any order-store write, must fail) + RED cart lifecycle (open→checkout→submitted/abandoned).
- **Implementation-steps:** cart/session model; consume price/availability inputs; publish `CartUpdated` + `CheckoutSubmitted` intent only.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os/cart_checkout`.
- **Acceptance-criteria:** Cart emits `CheckoutSubmitted` intent, never order events; no order write; consumes only V4 contract inputs.
- **Evidence:** F4 event-ownership + cross-context-write negative report (RED→green).
- **Rollback:** remove `cart_checkout/**`.
- **Stop-conditions:** any `OrderPlaced`/order-creation path appears in Cart ⇒ STOP.
- **Budget:** canonical.

---

## V10 — Order Orchestration saga / single writer (BC-04) [Wave C]

- **Objective:** The **sole writer** of order state and the saga/process manager; consume `CheckoutSubmitted` + inventory/payment/fulfillment outcomes; emit commands + `OrderCreated`/`OrderConfirmed`/`OrderCancelled`.
- **Non-goal:** Writing into inventory/payment/fulfillment stores (cross-context write); Cart creating the order.
- **Inputs:** BC-map BC-04 + §2.1 + §6; ADR-0031 D10; F5 cancellation, F8 refund, F9 idempotency, F6.
- **Allowed-files:** `.../commerce_os/order_orchestration/**` + `tests/commerce_os/order_orchestration/**`.
- **Forbidden-files:** canonical + other BC stores; any write outside Order authority.
- **Prerequisites:** V7 + V8 + V9 contracts (Wave C).
- **Red-tests-first:** **F5** order-saga-cancellation (compensations acked before `OrderCancelled`) + **F8** refund-execution ownership + **F9** duplicate/replay/out-of-order (terminal state never overwritten).
- **Implementation-steps:** order state machine (created→confirmed→in-fulfillment→completed/cancelled); create order from `CheckoutSubmitted`; issue idempotent commands (reserve/authorize/capture/start); reconcile outcomes; named compensations.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os/order_orchestration`.
- **Acceptance-criteria:** single writer of order; commands idempotent (order+step id); cancellation only after compensation acks; no cross-context write.
- **Evidence:** F5/F8/F9 saga traces + compensation-ack reports (RED→green).
- **Rollback:** remove `order_orchestration/**`.
- **Stop-conditions:** a second writer of order state, an implicit rollback, or a terminal-state overwrite ⇒ STOP.
- **Budget:** canonical.

---

## V11 — Fulfillment & Returns (BC-06) [Wave D]

- **Objective:** Shipment/fulfillment/RMA authority; consume `StartFulfillment`/`CancelFulfillment`; publish `ShipmentDispatched`/`Delivered`/`ReturnAuthorized`.
- **Non-goal:** Executing the payment refund (Payment owns it, on Order's command); holding stock/order authority (BC-06 non-goals).
- **Inputs:** BC-map BC-06 + §6; F8 refund (Fulfillment→`ReturnAuthorized`→Order→`RefundPayment`).
- **Allowed-files:** `.../commerce_os/fulfillment_returns/**` + `tests/commerce_os/fulfillment_returns/**`.
- **Forbidden-files:** canonical + other BC dirs; refund execution.
- **Prerequisites:** V10 contract green (Wave D).
- **Red-tests-first:** RED fulfillment lifecycle (allocated→dispatched→delivered→returned/closed) + F8 return path (`ReturnAuthorized` triggers Order refund-command, Fulfillment does not refund).
- **Implementation-steps:** shipment/RMA model; consume start/cancel commands; publish outcomes incl. `ReturnAuthorized`; carrier via provider port.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os/fulfillment_returns`.
- **Acceptance-criteria:** lifecycle enforced; refund delegated to Payment via Order; no order/stock write.
- **Evidence:** RED→green lifecycle + F8 return-ownership report.
- **Rollback:** remove `fulfillment_returns/**`.
- **Stop-conditions:** Fulfillment executing a refund or writing order state ⇒ STOP.
- **Budget:** canonical.

---

## V12 — Integrated core vertical slice / contract tests

- **Objective:** Wire BC-01…BC-07 through V4 contracts into one vertical slice and run cross-BC contract/integration tests: Catalog→Offer→Checkout intent→Order saga→Inventory/Payment→Fulfillment.
- **Non-goal:** New BC business logic; any optional-edition BC.
- **Inputs:** V5–V11 green; BC-map §6; contract-test F1–F9.
- **Allowed-files:** `apps/api/tests/commerce_os/integration/**` (integration/e2e tests + wiring fixtures only).
- **Forbidden-files:** canonical + any BC domain source (integration lane writes no new domain logic).
- **Prerequisites:** V5–V11 green.
- **Red-tests-first:** RED end-to-end slice test (cart→delivery) + F1 DAG re-check + F5/F6/F8/F9 cross-BC saga integration.
- **Implementation-steps:** compose BCs via contracts; run consumer-driven contract tests; assert DAG holds across the assembled build.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os/integration` · `pnpm test:surface`.
- **Acceptance-criteria:** vertical slice passes contract/integration tests; DAG guard still green on assembled build; no BC→BC import introduced.
- **Evidence:** integration/e2e RED→green + assembled DAG report.
- **Rollback:** remove `integration/**` tests/fixtures.
- **Stop-conditions:** any cross-context write or DAG violation surfaces at integration ⇒ STOP.
- **Budget:** canonical.

---

## V13 — Export/import + metadata/migration/resilience contracts

- **Objective:** Implement, test-first, the export envelope↔domain-payload boundary, expand→migrate→contract metadata evolution, and restore/key-loss resilience per split authorities.
- **Non-goal:** Making a single "data platform" own export+schema+backup+keys; fabricating RPO/RTO or escrow numbers while authority is `unresolved`.
- **Inputs:** [`data-migration contract`](./commerce-os-data-migration-contract.md) (D8/D9 RACI); contract-test F10/F11/F12.
- **Allowed-files:** `.../commerce_os/portability/**` + `tests/commerce_os/portability/**` (payload-completeness + migration/restore drills); domain payload schemas stay within each owning BC dir.
- **Forbidden-files:** canonical + rewriting the platform envelope crypto/transport (platform-owned).
- **Prerequisites:** V12 green.
- **Red-tests-first:** **F10** export-import round-trip (diff=∅, governed disposition attestation) + **F11** metadata expand→migrate→contract (deterministic rollback) + **F12** restore-and-key-loss (fail-closed, no silent plaintext).
- **Implementation-steps:** domain payload completeness reports; dual-read/write/backfill/verify/contract; clean-room restore drill; rotation/revoke path.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os/portability` — migration/restore harness **expected-after-scaffold (not currently existing).**
- **Acceptance-criteria:** round-trip diff=∅; irreversible steps gated; key loss fail-closed; each authority named (no single owner).
- **Evidence:** F10/F11/F12 reports with envelope/RPO-RTO refs (values recorded, not invented).
- **Rollback:** remove `portability/**`.
- **Stop-conditions:** counsel/escrow authority `unresolved` while a number is required ⇒ BLOCK VALIDATION / STOP.
- **Budget:** canonical.

---

## V14 — Web/operator/API surface + accessibility/localization baseline

- **Objective:** Operator/API surface for the commerce-os app with a WCAG 2.2 + localization/jurisdiction baseline.
- **Non-goal:** Storefront/consumer UI beyond the operator scope; new domain logic in the web layer.
- **Inputs:** contract-test F15 a11y-localization; delivery-sequence app-web shell; V12 slice.
- **Allowed-files:** `apps/web/src/apps/commerce-operating-system/**` + `apps/web/e2e/commerce-os/**`.
- **Forbidden-files:** canonical + `apps/api` domain source; other apps' web dirs.
- **Prerequisites:** V13 green.
- **Red-tests-first:** **F15** a11y (keyboard/focus/contrast) RED + localization/jurisdiction pack RED + operator-surface e2e RED.
- **Implementation-steps:** operator views over app-core/API; keyboard/focus/contrast compliance; i18n/jurisdiction pack; counsel-gated regions still gated.
- **Test-commands:** `pnpm test:tokens` · `pnpm test:surface` · `pnpm --filter web e2e commerce-os` — e2e **expected-after-scaffold (not currently existing).**
- **Acceptance-criteria:** full keyboard + visible focus + contrast pass; i18n pack current; counsel gate not bypassed.
- **Evidence:** axe/keyboard drill + jurisdiction/i18n audit (RED→green).
- **Rollback:** remove the web app + e2e dirs.
- **Stop-conditions:** a counsel-gated locale bypasses its gate, or a11y RED unresolved ⇒ STOP.
- **Budget:** canonical.

---

## V15 — Security / AI / ECA / plugin / provider-exit / noisy-neighbor probe harness

- **Objective:** Stand up the adversarial probe harness: plugin exfiltration, AI/ECA safety, provider-exit portability, noisy-neighbor SLO isolation.
- **Non-goal:** Granting runtime/GA; enabling autonomous high-risk AI action (must stay human-gated, D12).
- **Inputs:** contract-test F13/F14/F16; ADR-0031 D12; readiness-oracles O7.
- **Allowed-files:** `apps/api/tests/probes/commerce_os/**` and `infra/commerce-os/**` (**V15 only**).
- **Forbidden-files:** canonical + BC domain source; any web app dir.
- **Prerequisites:** V14 green.
- **Red-tests-first:** **F13** plugin-exfiltration (signed/no-egress sandbox; unapproved permission-diff denied) + **F14** ai-eca-safety (eval/injection/PII-redaction; ECA depth>6 / forbidden app-module write / human-stop bypass denied) + **F16** slo-noisy-neighbor + provider-exit portability.
- **Implementation-steps:** exfiltration negative suite; AI eval/injection/PII + ECA runaway probes; load-isolation + failover + exit-portability drills; envelope fields recorded before runs.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/probes/commerce_os` · `make up && make health` (infra) — probe/infra harness **expected-after-scaffold (not currently existing).**
- **Acceptance-criteria:** high-risk AI human-gated (only abstain/degrade/kill-switch auto); no unsigned egress; neighbor p95 degradation within contextual-candidate bound; exit-portability proven.
- **Evidence:** F13/F14/F16 negative-suite + isolation/failover reports (envelope values recorded).
- **Rollback:** remove `tests/probes/commerce_os/**` + `infra/commerce-os/**`.
- **Stop-conditions:** any high-risk AI path fires without human gate, or envelope fields unrecorded before a drill ⇒ STOP.
- **Budget:** canonical.

---

## V16 — Pilot evidence / readiness + actionplan evidence handback (no GA claim)

- **Objective:** Assemble pilot evidence against the recorded D13 envelope and propose an `actionplan` evidence writeback — **without claiming GA**.
- **Non-goal:** Declaring runtime/GA/"done"; directly changing `actionplan` app/module nodes.
- **Inputs:** ADR-0031 D13 (recorded envelope); V12–V15 evidence; readiness-oracles O10; contract-test §5 evidence schema.
- **Allowed-files:** evidence artifacts **in the implementation repo** (e.g. `apps/api/tests/commerce_os/**` evidence records, evidence bundle under the impl repo). Proposes an `actionplan` writeback as a reviewed patch only.
- **Forbidden-files:** canonical + **any direct edit of `actionplan` app/module nodes** (`src/data/generated/nodes/**`) unless separately human-authorized.
- **Prerequisites:** V15 green; D13 envelope values recorded.
- **Red-tests-first:** RED evidence-completeness assertion — fails if any F-family `greenArtifact` is a plan rather than an actual result, or any envelope field is missing.
- **Implementation-steps:** collect actual RED→green artifacts + audit/outbox traces; bind envelope values; assemble pilot evidence bundle; draft (not apply) actionplan writeback proposal for human review.
- **Test-commands:** `cd apps/api && uv run --python 3.12 pytest -q tests/commerce_os` (evidence-completeness) — bundle tooling **expected-after-scaffold (not currently existing).**
- **Acceptance-criteria:** every claimed family has an actual green artifact + audit trail; envelope recorded; **no GA claim**; actionplan writeback is a proposal pending human authorization.
- **Evidence:** pilot evidence bundle (actual, not plan) + envelope ref + proposed (unapplied) writeback patch.
- **Rollback:** discard the evidence bundle/proposal; nothing merged.
- **Stop-conditions:** any "GA/ready/passed" claim without actual evidence, or a direct node change without human authorization ⇒ STOP.
- **Budget:** canonical.

---

## Related documents

- [`master handoff`](./commerce-os-test-first-parallel-handoff.md) · [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) · [`bounded-context map`](./commerce-os-bounded-context-map.md) · [`readiness-oracles`](./commerce-os-vibecoder-readiness-oracles.md)
- [`contract-test plan`](./commerce-os-contract-test-plan.md) · [`data-migration contract`](./commerce-os-data-migration-contract.md) · [`implementation-workspace-manifest`](./implementation-workspace-manifest.md) · [`kernel-sdk-app-delivery-sequence`](./kernel-sdk-app-delivery-sequence.md)
- [`task-to-code-contract`](./task-to-code-contract.md) · [`ready-for-dev-gate`](./ready-for-dev-gate.md) · [`AGENTS.md`](../AGENTS.md)
