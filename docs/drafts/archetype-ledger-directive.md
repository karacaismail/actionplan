# archetype-ledger — Çift-Taraflı Muhasebe Metamodeli (TASLAK — kilitlenmeyi bekliyor)

Durum: taslak iskelet. CI'a bağlı değil. İnsan onayı gerekir.
Gerekçe: Accounting (Parasut-benzeri) ürününün ve MRP costing'in en temel yapısı çift-taraflı defterdir (yevmiye, hesap planı, dönem kapatma). Kernel/archetype katmanında böyle bir metamodel YOKTUR (grep 0). Her app yeniden icat ederse kernel'in kendi felsefesi ihlal olur ("50 app × kendi implementasyonu = 50× hata"). Ön şart: gerçek `Money` atomu (bugün `currency` düz string; bkz. atomik-primitif-katman-gap). (P0, bkz. gap-2026-07-02-02-archetype §4 G-A2.)

## 1. Amaç / Kapsam / Non-goals

- Amaç: değişmez (append-only) çift-taraplı defteri veri modeli olarak tanımlamak.
- Kapsam: hesap planı (chart of accounts), yevmiye fişi (journal entry), borç/alacak satırları (debit/credit lines), dönem (period), dönem kapatma, ters kayıt (reversal), çok-para-birimi (FX).
- Non-goals: vergi mevzuatı hesaplaması (Computation + jurisdiction işi); e-fatura/e-arşiv entegrasyonu (provider-adapter/app işi); finansal raporlama UI (Surface işi).

## 2. Nedir / ne yapar / ne yapmaz

- Nedir: değişmez muhasebe defteri sözleşmesi (Money atomu üzerine kurulu).
- Ne yapar: her fişte borç toplamı = alacak toplamı değişmezini zorlar; dönem kilidini uygular; düzeltmeyi yalnız ters kayıtla yapar.
- Ne yapmaz: kayıtlı fişi UPDATE/DELETE etmez (yalnız reversal); dönem kapandıktan sonra geriye yazmaz.

## 3. Sözleşme şekli (backend — SQLAlchemy 2.0 / FastAPI)

TODO: `account` (code, type: asset/liability/equity/income/expense), `journal_entry` (id, date, period_ref, tenant_id, immutable), `journal_line` (entry_ref, account_ref, debit: Money, credit: Money), `accounting_period` (status: open/closing/closed). Değişmez: append-only + REVOKE UPDATE/DELETE. Money atomu (value+currency+precision+rounding) zorunlu.

## 4. WBS / bağımlılık

TODO: `archetype-ledger` düğümü. `dependsOn`: Money atomu, k-computation (bakiye/FX türetme), scale-invariant (financial etiketi → outbox+idempotency). `blocks`: accounting app, MRP costing, HRMS payroll.

## 5. Multi-tenant / AI guardrail

- Tenant: her defter tenant-scoped; RLS zorunlu.
- AI: fiş taslağı önerebilir; kayıt (posting) yalnız typed action + insan onayı ile; dönem kilidini AI açamaz.

## 6. Test stratejisi (test-önce)

TODO negatif testler: dengesiz fiş reddi (borç≠alacak); kapalı döneme yazma reddi; kayıtlı fişi UPDATE/DELETE reddi (yalnız reversal); FX yuvarlama tutarlılığı; çapraz-tenant erişim reddi.

## 7. Kabul kriterleri / DoD

TODO: Money atomu gerçek; denge değişmezi test-kanıtlı; dönem kapatma runbook; scale-invariant beyanı; insan onayı (kilit).
