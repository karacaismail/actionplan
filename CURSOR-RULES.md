# Cursor / Windsurf Talimatı — DIRECTIVE-ONLY

Bu dosya, Cursor/Windsurf'in actionplan yönergelerini hazırlarken uyması gereken KALICI
kurallardır. Platform erişimi `read-only-audit`, ürün kodu yazarı
`human-developer-only`dır. Kanonik yasak:
`docs/platform-product-code-write-prohibition-directive.md`.
Türkçe cevap ver; teknik terimi ilk geçtiği yerde kısaca açıkla.

Cursor/Windsurf platformda ürün kodu, test, migration, Storybook/config dosyası yazmaz;
branch, commit, push veya PR oluşturmaz. Çıktı yalnız actionplan içinde insan geliştiriciye
verilecek `DIRECTIVE-ONLY` handoff'tur.

---

## 1. Bağlam (aktörler açık)

- Amaç: tek bir "kernel" meta-framework. Jr geliştiriciler bununla ~18 enterprise SaaS ürünü kurar
  (ecommerce, MRP, accounting, PMS, CMS, social/video, drive/DAM, PIM, IBYS, HRMS, email suite,
  Teams-benzeri/Jitsi, AI-CRM, Fleetx, QMS/CMMS, kariyer/ilan). WordPress gibi indir-kur-çalıştır.
- Üç panel katmanı (birinci sınıf olmalı): (a) developer/kernel admin, (b) SaaS müşterisi süper-admin,
  (c) o müşterinin son kullanıcıları (tenant-scoped rol grupları).
- Sözleşme/plan reposu: `/Users/karaca/DEV/mimari/actionplan` (docs/ = yönergeler + gap analizi;
  tools/agents/ = CI kapıları; src/data/strings.json = kanonik etiketler).
- Dokümantasyon sitesi: bu reponun Vite/React tabanlı GitHub Pages yüzeyi (`/actionplan/docs/`).
- Kernel/platform KODU: platform reposunda yaşar ve yalnız insan geliştirici tarafından yazılır. AI yalnız salt-okunur audit yapar; actionplan içinde yönerge üretir.

## 2. Kanonik WBS sözlüğü — DEĞİŞTİRME

Teknik ad · metafor · anlam (büyükten küçüğe):

| Teknik ad | Metafor | Anlam |
|---|---|---|
| app | ada | SaaS ürün ailesi / portföy |
| module | dağ | bounded context / domain (paket sınırı) |
| archetype | kaya | domain entity + sözleşme (tablo, GraphQL, migration, policy, tenant/RLS, default surface) |
| feature | taş | user story / view / endpoint grubu |
| component | kum | React component / form section / tek endpoint |
| work_unit | molekül | tekil kod/test birimi (formatter, validator, hook, pure fn, Pydantic validator) |
| micro_step | atom | en küçük değişiklik + kural (tek satır, tek assertion, tek regex, permission rule) |

Komut dili: "crm **app** geliştir"=ada, "sales **module**"=dağ, "customer **archetype**"=kaya,
"lead scoring **feature**"=taş, "score card **component**"=kum, "email validator **work_unit**"=molekül,
"email regex **micro_step**"=atom.

Kaynak (tek doğruluk): `actionplan/src/data/strings.json` (levels.*.metaphor) +
`actionplan/docs/task-to-code-contract.md` + `projector/content-source/239-k-granulerlik.json`.

Kritik ayrım: "atom" WBS `micro_step` metaforudur; "atomic type / atomik tip" (Money, Phone)
ayrı bir domain-primitive kavramıdır — WBS micro_step ile karıştırma.

## 3. Stack — kesin sınırlar

İzinli:
- Frontend: **Vite + React + TanStack Router + TanStack Query**, headless Radix/React Aria, SCSS + token CSS.
- Backend: **FastAPI + SQLAlchemy 2.0 / SQLModel + Alembic (migration) + PostgreSQL**.

YASAK (asla önerme/kurma):
- **Next.js** (App Router vibecoding anti-pattern: RSC/use client sınırı belirsizlik üretir).
- **Supabase**.
- Styled-kit/framework: antd, MUI, Chakra, Mantine, Flowbite, Redux.

Ortam: yerel macOS (Apple M4); prod Hetzner Debian (AMD EPYC); deploy GitHub private repo'dan.
Hedef topoloji: tek-VPS Docker Compose → çok-replika (Swarm/K8s). "Shared hosting" iddiası dar; net yaz.

## 4. Güvenli AI akışı — ZORUNLU

- Sen (AI) platform kodu veya patch üretmez, taslak/PR açmazsın. Yalnız actionplan içinde yönerge ve insan handoff'u yazarsın.
- İnsan geliştirici directive'i uygular, test/PR/CI kanıtını üretir; insan reviewer inceler ve merge eder.
- Para/sipariş/stok yazan mutasyon: **transactional outbox + idempotent consumer** beyanı zorunlu
  (scale-invariant). "exactly-once teslimat" İDDİA ETME → at-least-once + idempotent tüketim.
- generated CRUD durum alanını DEĞİŞTİREMEZ; durum geçişi yalnız typed action / workflow ile.
- Sır (API key, parola) asla koda/JSON'a gömme → `secret_ref` (k-kms). Sızıntı = kırmızı.
- Tenant izolasyonu: her sorgu tenant-scoped (RLS); çapraz-tenant fail-closed.

## 5. İnsan geliştirici için test-önce directive sırası

1) Yazılacak kırmızı testleri tanımla → 2) DB şema/migration kararını tarif et →
3) minimum implementation adımlarını sırala → 4) edge-case/risk → 5) insanın çalıştıracağı komutlar.
AI bunları uygulamaz. Küçük PR + kanıt (evidence) insan geliştiricinin teslimidir. Komşuluk kuralı: bir seviye yalnız bir alt komşusuna bağlanır
(module doğrudan component'e bağlanamaz; arada archetype/feature olmalı).

## 6. Nerede ne var (önce oku)

- Yönergeler: `actionplan/docs/` — workflow-directive, k-kms-directive, archetype-*-directive
  (ledger, order-line-item, inventory-stock, messaging-thread, eav, taxonomy, tree-relation,
  variant-attribute-family, agreement-lifecycle), panel-tier-contract, surface-spec/v2,
  kernel-execution-contract-matrix, event-replay-projection-contract, scale-invariant-directive,
  core-contract-pack, atomic-types-directive, fragments-directive.
- Gap + öncelik + unknown-unknowns: `actionplan/docs/gap-2026-07-02-00-index.md` (+ 01/02/03/05).
- Kapılar (ne zorlanıyor): `actionplan/tools/agents/check-*.mjs`.

## 7. Başlamadan ÖNCE (güncel çalışma kuralı)

- Repo gerçekliğini `src/data/generated/meta.json`, kanonik docs/JSON sözleşmeleri ve bloklayıcı
  kapılardan yeniden doğrula; tarihsel PR veya düğüm sayısını güncel gerçeklik gibi kullanma.
- `AI-DRAFT` veya insan onayı bekleyen yönergeyi kilitli karar gibi sunma.
- Platform implementation kanıtı yoksa işi implemented/verified/done sayma; insan geliştirici için
  test + PR + CI + deploy + rollback + audit handoff'u üret. AI platform dosyalarına yazmaz.
