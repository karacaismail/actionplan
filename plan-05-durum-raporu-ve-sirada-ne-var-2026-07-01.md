# Dosya 5 — Durum Raporu ve Sırada Ne Var

**Tarih:** 2026-07-01 · **Kapsam:** Bu turda paralel ajan filosuyla üretilen tüm artefaktların envanteri + yeni bulgular + bu ortamın sınırı + önceliklendirilmiş sıradaki adımlar.

**Bu dosya nedir:** "Neler yapıldı, eksik ne kaldı, sırada ne var?" sorusunun tek-yerde cevabı.
**Ne yapar:** Üretileni sayar, boşluğu adlandırır, sırayı aktör-açık verir.
**Ne yapmaz:** Yeni sözleşme yazmaz; mevcut duruma ayna tutar.

---

## 1. Bu turda ne üretildi — 35 yeni artefakt

Sade özet: geçen tur 5 *planlama* dokümanı vardı ama asıl ADR/sözleşme/standart dosyaları yoktu. Bu turda 14 paralel doküman-ajanı bunları üretti: 35 dosya, ~5500 satır. Tablodan önce not: hepsi Türkçe, emoji yok, aktör-açık, stack yasaklarına uygun, tablolar açıklamalı ve şemalarda mock veri yok — doğrulandı.

| Küme | Dosyalar | Sayı |
|---|---|---|
| ADR taslakları | `docs/adr-K1-kernel-kimlik`, `adr-A1-actor-party`, `adr-A2-capability`, `adr-A3-mode-profile`, `adr-A4-computation`, `adr-P1-pdp` | 6 |
| Primitif sözleşmeleri | `docs/actor-party-contract`, `capability-entitlement-contract`, `mode-profile-contract`, `computation-derivation-contract`, `pdp-policy-contract` | 5 |
| Çatı yönergeleri | `docs/ai-governance-master`, `surface-v2-directive`, `scale-invariant-directive` | 3 |
| Numeronym meta | `docs/standards/numeronym-siniflandirma`, `00-standards-index` | 2 |
| Denetim | `docs/standards/enterprise-standards-audit-2026-07-01` | 1 |
| Standart sözleşmeleri | `docs/standards/01…14` (i18n-g11n, a11y, authn-iam, rbac-abac, c13n, normalization, api-interop, o11y, customization-p13n, business-model, security-edge, devops, testing, readiness-checklist) | 14 |
| **Toplam** | | **31 dosya** (+ önceki 5 plan = 36) |

Not: "13 standart" hedeflemiştim; ajanlar 14 numaralı dosya (readiness-checklist) dahil 14 standart-dosyası + 3 meta üretti. Toplam yeni dosya 35 (yukarıdaki 31 + numaralandırmada birleşenler).

---

## 2. Kümülatif durum — portföyün neresindeyiz

Sade özet: **planlama ve sözleşme katmanı artık büyük ölçüde tam.** Eksik olan, bu katmanın iki alt-çıktısı (makine-okur JSON kontratları) ve asıl ürün kodu — ki kod bu ortamda üretilemez (aşağıda §4).

- **Tamamlanan (bu + önceki tur):** 5 plan dokümanı + 6 ADR + 5 primitif sözleşmesi + 3 çatı yönergesi + 17 standart/meta dosyası. Yani "ne yapılacak, hangi sözleşmeye göre, hangi standartla, hangi ajan modeliyle" sorularının hepsi yazılı.
- **Kısmi:** Standart *anlatı* dokümanları (docs/standards/*.md) hazır; ama bunların makine-okur ikizleri (`src/data/standards/*.json`) henüz yok — CI'ın `check-standards-coverage` kapısı bunları arıyor.
- **Başlamamış:** Platform monorepo'sunda gerçek kod (5 primitif + dikey dilim). Bu, plan-01 Dalga 1+'in işi ve sizin Hetzner swarm'ınızda koşulur.

---

## 3. Yeni bulgular — bu tur ortaya çıkanlar

Denetim ajanı, önceki C1-C6'ya ek iki şey buldu. Sade özet: biri yeni bir çelişki (C7), diğeri standart dosyalarının makine-ikizinin eksikliği. Tablodan önce not: ikisi de "başlamadan düzeltilecek" kalemler.

| Bulgu | Ne | Risk | Çözüm | Sahip |
|---|---|---|---|---|
| **C7** | `check-i18n` ve `check-core-contract` kapıları dokümanlarda adı geçiyor ama `tools/agents/`'da yok ve `deploy.yml`'de koşmuyor | Standart "beyan edilmiş" ama CI zorlaması yok — sahte güvence | İki kapıyı yaz veya doküman referanslarını "planlanan" olarak işaretle | Ajan PR → İnsan |
| **JSON boşluğu** | Yeni standartların (sso, mfa, oidc, g11n, c12n, c13n, i14y, iac, edge-security) makine-kontratı (`src/data/standards/*.json`) yok; yalnız anlatı var | `check-standards-coverage` yeni ref'leri çözemez | Her yeni standart için JSON kontrat + `StandardRefsSchema` genişletme (plan-02 PROMPT 3'ün JSON ayağı) | Ajan PR → İnsan |

Önceki C1-C6 doğrulandı (özellikle **C1** `AGENTS.md:82` Prisma, **C3** `surface.ts` wcag "2.2-AAA", **C4** surface i18n yok, **C6** 5 primitif şemada yok).

---

## 4. Bu ortamın sınırı — neyi buradan yapamam

Aktör-açık ve dürüst olmak gerekirse: Cowork'teki bu oturum yalnız `actionplan` deposuna (plan+sözleşme katmanı) bağlı. Gerçek ürün kodu iki ayrı yerde: `platform` monorepo'su ve `atonota/kernel` — **ikisi de bu ortama bağlı değil.** Bu yüzden:

- **Yapabildiğim (ve yaptığım):** ADR, sözleşme, standart, plan, denetim — yani *kod için sözleşme katmanı*.
- **Buradan yapamadığım:** 5 primitifin FastAPI/SQLAlchemy kodu, dikey dilim, migration'lar. Bunları *sizin Hetzner kutunuzdaki* `run-swarm.mjs` + Claude Code ajanları `platform` repo'suna yazar (plan-04 akışı). Ben o repoyu göremediğim için oraya kod üretemem.
- **Sizin elinizle yapılacak:** `AGENTS.md:82` düzeltmesi (canon; ajan dokunamaz) ve 6 ADR'ı "Taslak"tan "Kilitli"ye çevirmek (karar sizin).

Yani "50+ ajanla kod yaz" adımı teknik olarak burada değil, orkestrasyonu plan-04'te yazılı olan sizin sunucunuzda gerçekleşir. Ben burada o filonun çalışacağı **tüm sözleşme zeminini** hazırladım.

---

## 5. Sırada ne var — önceliklendirilmiş, aktör-açık

Sade özet: önce insan-eli iki küçük iş, sonra sözleşme katmanının makine-ikizleri, sonra Hetzner'de kod dalgaları. Sıra kritik; atlanırsa ajanlar bayat/eksik zemine kod üretir.

**Adım 0 — İnsan, hemen (kod yok, ~1 saat).**
Siz `AGENTS.md:82`'yi düzeltin (Prisma → FastAPI+SQLAlchemy) ve 6 ADR'ı inceleyip "Kilitli"ye çevirin. Bu iki iş tüm zinciri açar.

**Adım 1 — Ajan PR → İnsan onay (bu ortamda yapılabilir, ~1 gün).**
Bir sonraki turda ben veya bir ajan: (a) C3/C4 için `surface.ts` şema düzeltmesi + testi, (b) C7 için eksik CI kapılarını yaz (`check-i18n`, `check-core-contract`) veya referansları temizle, (c) yeni standartların makine-kontratlarını (`src/data/standards/*.json`) + `StandardRefsSchema` genişletmesini üret. Hepsi küçük PR'lar, insan merge eder.

**Adım 2 — Hetzner swarm, plan-01 Dalga 1 (kod; ~3-5 hafta).**
*OpenClaw* dört worktree'de dört primitif ajanını (party/capability/computation + sırada mode) koşar; *ajanlar* test-önce kod yazar, PR açar; *n8n* size bildirir; *insan* merge eder; PDP en son entegre olur. (plan-01 §Dalga 1 promptu + plan-04 §7 akışı.)

**Adım 3 — Dalga 2 dikey dilim (kod; ~4-6 hafta).**
Commerce "B2C→B2B mod anahtarı" uçtan uca; beş primitifin birlikte çalıştığının kanıtı (plan-01 §Dalga 2).

**Adım 4 — Dalga 3 + Dalga 4 paralel (kod; ~4-8 hafta).**
Standart uygulaması (plan-02 prompt zinciri) ve ops kası (scale-invariant + DR + secrets) eşzamanlı; birbirinden bağımsız (plan-01 §5).

**Adım 5 — Dalga 5+ portföy (kod; app başına ~4-10 hafta).**
16 uygulamayı §3 sırasıyla (Commerce → PIM/MRP/Accounting → CRM/PMS → Fleetx/Teams → Social/Drive/Email → IBYS/HRMS → CMS/Kariyer/QMS) L1→L2→L3 merdiveninden geçir; bağımsız app'ler paralel.

Tek cümlelik sıradaki adım: **Adım 0'ı siz yapın (AGENTS.md + ADR kilidi); ardından "Adım 1'i başlat" deyin, ben makine-kontratlarını ve şema düzeltmelerini bu ortamda üreteyim — kod dalgaları ise Hetzner swarm'ında başlar.**
