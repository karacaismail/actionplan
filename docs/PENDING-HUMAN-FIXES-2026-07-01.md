# Bekleyen İnsan-Düzeltmeleri — 2026-07-01

Durum: **ÇÖZÜLDÜ (2026-07-02)** — aşağıdaki maddelerin tümü uygulandı: **C1** `AGENTS.md:82` artık `FastAPI + SQLAlchemy 2.0` (Prisma kaldırıldı); **C2** altı ADR (A1/A2/A3/A4/K1/P1) **Kilitli** (insan onayı: ismail); üç "hayalet kapı" (`check-i18n`, `check-core-contract`, `check-scale-invariant`) yazıldı ve `deploy.yml`'de koşuyor. **Ek:** ADR-A5 (ArcheType storage canonical = shared-tablo+JSONB+promotion) 2026-07-02'de Kilitlendi. Bu dosya tarihsel kayıt olarak korunur; yeni bir insan-fix kalmadı.
Kapsam: Bu dosya **yalnız insanın yapması gereken canon düzeltmelerini** listeler. Aşağıdaki maddeler `AGENTS.md` §7 gereği **kanonik sözleşme** dosyalarına dokunur; AI ajan bunları doğrudan yeniden yazamaz, yalnız değişiklik önerir (changeset). Her madde tam diff ile verilmiştir; insan gözden geçirip elle uygular.

Neden ayrı dosya: `AGENTS.md` §7 "Kanonik Dokümanlar ve Düzenleme Yetkisi" — `AGENTS.md`, ADR'ler ve `src/data/standards/*.json` yalnız insan onayıyla değişir. RECONCILE işi (`00-standards-index.md`, `14-enterprise-readiness-checklist.md`) AI tarafından yapıldı; ama aşağıdakiler canon olduğu için AI DOKUNMADI, yalnız diff önerdi.

---

## C1 — AGENTS.md:82 backend stack yanlış (Prisma → FastAPI/SQLAlchemy)

| Alan | Değer |
|---|---|
| Dosya:satır | `AGENTS.md:82` |
| Kanon mı | EVET — `AGENTS.md` §7 kanonik dosya listesinde ("bu `AGENTS.md`'yi yalnız Kullanıcı/Admin değiştirebilir") |
| Priority | P0 |
| Sahip | **İnsan** |
| Neden ajan yapamaz | `AGENTS.md` kendi AI-governance kuralına göre (§7) yalnız insan tarafından düzenlenir; AI yalnız changeset önerir. |
| Etki | Backend stack beyanı yanlış; ajan Prisma/PostgreSQL varsayıp yanlış-üretim yapabilir. Doğru stack `numeronym-siniflandirma.md` §2 (ORM satırı: "SQLAlchemy 2.0") ve `adr-K1-kernel-kimlik.md` (stack kilidi) ile çelişiyor. |

Mevcut metin (satır 82):
```
- Veri/form/durum ekosistemi: **TanStack** (Router/Query/Table) + RHF/Zod (veya TanStack Form). Backend kilidi: **Prisma + PostgreSQL**.
```

Önerilen metin (satır 82):
```
- Veri/form/durum ekosistemi: **TanStack** (Router/Query/Table) + RHF/Zod (veya TanStack Form). Backend: **FastAPI + SQLAlchemy 2.0 / SQLModel + Alembic + PostgreSQL**.
```

Unified diff:
```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -82 +82 @@
-- Veri/form/durum ekosistemi: **TanStack** (Router/Query/Table) + RHF/Zod (veya TanStack Form). Backend kilidi: **Prisma + PostgreSQL**.
+- Veri/form/durum ekosistemi: **TanStack** (Router/Query/Table) + RHF/Zod (veya TanStack Form). Backend: **FastAPI + SQLAlchemy 2.0 / SQLModel + Alembic + PostgreSQL**.
```

Gerekçe: Repo backend'i Python/FastAPI + SQLAlchemy 2.0'dır (bkz. `numeronym-siniflandirma.md` §2 ORM satırı, `core-contract-pack.md` Alembic migration atıfları, `adr-K1-kernel-kimlik.md` stack kilidi). "Prisma" (Node/TS ORM) bu stack'te kullanılmaz; satırdaki "Prisma + PostgreSQL" hatalıdır ve `enterprise-standards-audit-2026-07-01.md` C1'de zaten boşluk olarak işaretlidir. "Backend kilidi" ifadesi "Backend" olarak yumuşatıldı çünkü SQLModel/SQLAlchemy alternatifi açık bırakılıyor; kesin kilidi insan tercih ederse "Backend kilidi:" öneki korunabilir.

---

## C2 — Altı ADR "Taslak" → "Kilitli" terfisi (insan onayı gerektirir)

| Alan | Değer |
|---|---|
| Dosya:satır | Aşağıdaki 6 ADR'ın **3. satırı** (`**Durum:** Taslak — 2026-07-01`) |
| Kanon mı | EVET — `AGENTS.md` §7 kanonik dosya listesinde ADR'ler ("docs/adr-*") yer alır |
| Priority | P1 |
| Sahip | **İnsan** (release owner / mimar onayı) |
| Neden ajan yapamaz | ADR statüsü "Taslak → Kilitli/Kabul" terfisi bir **karar**tır; `AGENTS.md` §7 gereği canon değişikliği + insan onayı ister. AI yalnız önerir. |
| Etki | Bu 6 ADR (5 primitif + kernel kimliği) "Taslak" kaldığı sürece bağladıkları sözleşmeler (`actor-party`, `capability`, `mode-profile`, `computation`, `pdp`, kernel stack) resmî olarak kilitli sayılmaz; ilgili `check-core-contract` zorlaması ve `plan-01` D1 primitif şeması bu terfiye bağlıdır. |

Terfi bekleyen ADR listesi (hepsi şu an `**Durum:** Taslak — 2026-07-01`, satır 3):

| # | ADR dosyası | Başlık | Mevcut (satır 3) | Önerilen (satır 3) |
|---|---|---|---|---|
| 1 | `docs/adr-A1-actor-party.md` | ADR-A1 — Actor / Party: Polimorfik Aktör Primitifi | `**Durum:** Taslak — 2026-07-01` | `**Durum:** Kilitli — 2026-07-01` |
| 2 | `docs/adr-A2-capability.md` | ADR-A2 — Capability / Entitlement: Yetenek ve Yetkilendirme Primitifi | `**Durum:** Taslak — 2026-07-01` | `**Durum:** Kilitli — 2026-07-01` |
| 3 | `docs/adr-A3-mode-profile.md` | ADR-A3 — Mode-Profile: İş Modeli Runtime Bileşim Primitifi | `**Durum:** Taslak — 2026-07-01` | `**Durum:** Kilitli — 2026-07-01` |
| 4 | `docs/adr-A4-computation.md` | ADR-A4 — Computation / Derivation: Türetilmiş Değer Primitifi | `**Durum:** Taslak — 2026-07-01` | `**Durum:** Kilitli — 2026-07-01` |
| 5 | `docs/adr-K1-kernel-kimlik.md` | ADR-K1 — Kernel Kimliği, Sınırı ve Stack Kilidi | `**Durum:** Taslak — 2026-07-01` | `**Durum:** Kilitli — 2026-07-01` |
| 6 | `docs/adr-P1-pdp.md` | ADR-P1 — PDP (Policy Decision Point): Merkezî Yetki-Karar Primitifi | `**Durum:** Taslak — 2026-07-01` | `**Durum:** Kilitli — 2026-07-01` |

Her ADR için diff aynı biçimdedir (yalnız satır 3 değişir):
```diff
--- a/docs/adr-A1-actor-party.md
+++ b/docs/adr-A1-actor-party.md
@@ -3 +3 @@
-**Durum:** Taslak — 2026-07-01
+**Durum:** Kilitli — 2026-07-01
```
(Aynı tek-satır değişikliği A2, A3, A4, K1, P1 için tekrarlanır.)

Gerekçe: Bu altı ADR `plan-02`/`plan-03` primitif paketinin çekirdeğidir ve sözleşme dosyaları (`actor-party-contract.md`, `capability-entitlement-contract.md`, `mode-profile-contract.md`, `computation-derivation-contract.md`, `pdp-policy-contract.md`, `core-contract-pack.md`) bunlara dayanır. "Taslak → Kilitli" terfisi kararı insan release owner'ındadır (mimari onay); AI bu kararı veremez. Terfi öncesi insan kontrolü: (a) her ADR'ın bağladığı sözleşme dosyası tamamlandı mı, (b) `check-core-contract` kapısı yazıldı mı (şu an hayalet — bkz. aşağıdaki not), (c) primitif şeması (`archetype.ts` / `plan-01` D1) merge edildi mi.

---

## Ek uyarı — Bu düzeltmeler bağımlı olduğu hayalet kapılar

Aşağıdaki üç CI kapısı **hâlâ yazılmamıştır** (2026-07-01 doğrulandı; `tools/agents/` altında dosya yok, `deploy.yml`'de adım yok). Bunlar canon değil (AI yazabilir) ama C2 ADR terfisi bunlara mantıken bağlıdır; bu yüzden burada bilgi olarak listelenir:

| Hayalet kapı | Nerede atıflı | Durum |
|---|---|---|
| `check-i18n.mjs` | `i18n-standard.md`, `00-standards-index.md`, `14-...checklist.md` | Sözleşme (`i18n-standards`, `g11n`) VAR; kapı YOK |
| `check-core-contract.mjs` | `core-contract-pack.md` §6, 5 primitif sözleşmesi DoD'u | Sözleşme (`i14y` vb.) VAR; kapı YOK |
| `check-scale-invariant.mjs` | `scale-invariant-directive.md` §6 | Yönerge VAR; kapı YOK |

Not: Bu üç kapının yazılması **ayrı iş kalemidir** (canon değil, AI önerebilir/yazabilir) ve bu insan-fix dosyasının kapsamı DIŞINDADIR. Buraya yalnızca C2'nin bağımlılığını görünür kılmak için eklendi.

---

## Sahiplik özeti

| Madde | Dosya | Sahip | Priority | Tür |
|---|---|---|---|---|
| C1 | `AGENTS.md:82` | İnsan | P0 | Canon içerik düzeltmesi (backend stack) |
| C2.1–C2.6 | 6 ADR (satır 3) | İnsan | P1 | Canon statü terfisi (Taslak→Kilitli) |

Tüm maddeler `AGENTS.md` §7 gereği yalnız insan onayıyla uygulanır. AI bu dosyayı öneri (AI-DRAFT) olarak üretti; uygulama ve merge insana aittir.
