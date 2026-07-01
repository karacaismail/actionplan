# Dosya 1 — Vibecoding Faz-Faz Eylem Planı

**Tarih:** 2026-07-01 · **Önkoşul:** `plan-00-kontrol-sentez` okundu. · **İlgili:** standart promptları `plan-02`, yeni yönergeler `plan-03`, ajan orkestrasyonu `plan-04`.

**Bu plan nedir:** 16 uygulamalık portföyü, kernel primitiflerinden başlayarak, dalga-dalga ve her dalgada Claude Code'a verilebilir tam promptla inşa etme planı.
**Ne yapar:** Sıralı, test-önce, sözleşme-önce, paralel-ajan uyumlu bir yol haritası verir.
**Ne yapmaz:** Bitmiş implementasyon kodu içermez. Kodu *ajanlar* prompt talimatıyla yazar; bu dosya mimari kararı, sırayı ve promptu verir. Ayrıca kendi başına hiçbir şeyi main branch'e yazmaz — her dalga PR + insan onayı ile kapanır.

---

## 1. "Vibecoding" bu bağlamda ne demek — ve ne demek değil

Sade tanım: **vibecoding**, geliştiricinin niyeti doğal dille anlatıp kodu bir AI ajanına yazdırdığı, insanın gözden geçirip onayladığı geliştirme biçimidir. Bu projede vibecoding'in dört şartı var:

1. **Deterministik stack.** Ajanın kararsız kalacağı alan minimuma iner. Sabit stack: Vite + React + TanStack Router/Query/Table + RHF/Zod (ön yüz); FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL (arka yüz); Strawberry GraphQL + REST (API). **Yasak:** Next.js, Supabase, Prisma (gerekçe: kullanıcı stack kararı + `core-contract-pack §1`).
2. **Sözleşme-önce.** Ajan boş sayfaya değil, bir ArcheType/Surface/Standard sözleşmesine karşı kod yazar. Sözleşme yoksa önce sözleşme (yönerge) yazılır — kod değil.
3. **Test-önce (test-first).** Test-first = önce başarısız (kırmızı) test yazılır, sonra testi yeşile getiren kod yazılır. Bu sıra bu projede zorunludur (`AGENTS.md`).
4. **Ajan önerir, insan onaylar, CI kapıları geçirir.** Aktör-açık: *ajan* PR açar (kod branch'i); *CI/CD* 13 konformans kapısını çalıştırır (`.github/workflows/deploy.yml`); *insan* inceler ve merge eder. Ajan main branch'e doğrudan yazamaz.

Ne demek **değil:** "ajan serbestçe main'e push eder" değil; "spec'siz üretim" değil; "test sonradan" değil; "framework'ü ajan seçer" değil. Bu dört yanlış, vibecoding'i enterprise'da çökerten şeylerdir.

---

## 2. Katmanlı omurga — iki eksen nasıl kesişir

Plan iki ekseni birlikte yürütür. Sade özet: **dış eksen** hangi ürünün ne zaman geleceğini (genişlik), **iç eksen** her ürünün altındaki çekirdeğin nasıl kurulacağını (derinlik) söyler. İç eksen dıştan önce gelir: primitifler kanıtlanmadan hiçbir uygulama "başladı" sayılmaz.

- **Dış eksen (portföy roadmap):** 16 uygulama, bağımlılık sırasına göre (§3). Her uygulama `core-enterprise-maturity-ladder`'daki L1→L2→L3 merdivenini kendi hızında tırmanır.
- **İç eksen (primitif-önce dalga zinciri):** Dalga 0→5+ (§4). Dalga 0-2 tüm portföyün ortak çekirdeğini kurar ve tek bir dikey dilimle kanıtlar; Dalga 3-4 çapraz-kesen standart ve operasyonu; Dalga 5+ uygulamaları teker teker açar.

Kesişim kuralı: **Bir uygulama, ihtiyaç duyduğu primitifler Dalga 1'de kilitlenip Dalga 2'de bir referans dilimle kanıtlanmadan Dalga 5+'ta sıraya giremez.** Böylece her yeni uygulama sıfırdan aktör/yetki/mod modeli yazmaz; kanıtlanmış primitifi tüketir.

---

## 3. Dış roadmap — 16 uygulama build sırası

Sıra rastgele değil; iki ölçüte göre: (a) uygulama kaç ortak primitifi *kanıtlıyor* (çok kanıtlayan önce gelir, sonrakiler tüketir), (b) teknik bağımlılık (harita/WebRTC/mail gibi ağır primitife bağlı olanlar sona). Tablodan önce sade özet: **Commerce (e-ticaret) referans uygulamadır** çünkü beş primitifin beşini birden zorlar; ondan sonra gelenler aynı primitifi yeniden kullanır.

| Aşama | Uygulama(lar) | Neden bu sırada | Zorladığı/kullandığı primitif | Hedef olgunluk |
|---|---|---|---|---|
| A | **Kernel + 5 primitif** | Her şeyin tabanı | Actor, Capability, Mode, Computation, PDP | — (altyapı) |
| B | **Commerce (e-ticaret)** | Referans dilim; 5 primitifi birden kanıtlar | Beşi + yüksek-trafik tüketici yüzeyi | L1→L2 |
| C | **PIM, MRP, Accounting** | Commerce'in ürün/hesap primitifini yeniden kullanır | Computation (fiyat/BOM/defter), Actor (tedarikçi) | L1 |
| C | **CRM, PMS** | Actor + Workflow + Mode ağırlıklı; yeni primitif az | Actor, Mode, PDP | L1 |
| D | **Fleetx, Teams-benzeri** | Ağır primitife bağlı (geo, WebRTC/SFU) — önce primitif terfisi | Geo (`scale-gis`), Media (WebRTC — terfi gerekli) | L1 |
| D | **Social, Drive, Email Suite** | Yüksek-trafik/stream + mail-transport primitifi | Realtime, Media, Mail-transport (terfi gerekli) | L1 |
| E | **IBYS, HRMS** | Devlet entegrasyonu + çok-ülke i18n/mevzuat | i18n derin, Devlet-API çerçevesi, Actor | L1→L2 |
| F | **CMS, Kariyer, QMS/CMMS** | Yüzey/içerik + kalite süreç ağırlıklı | Surface v2 (page-builder), Workflow, PDP | L1 |

Bu tablo bir *sıra önerisidir*, katı takvim değil. Aşama C-F içindeki uygulamalar birbirinden bağımsız olduğu için **paralel** ekip/ajanla yürütülebilir (bkz. §5 ve `plan-04`). Kritik olan A→B'nin seri olmasıdır.

Not — iki primitif "terfi" bekliyor: **Media (WebRTC/SFU)** ve **Mail-transport (SMTP/IMAP+DKIM)**. Bunlar bugün modüle gömülü (`s-comms`/Jitsi, `s-mail`/Mailcow); Fleetx/Teams/Email aşamasından (D) önce yeniden-kullanılabilir primitife çıkarılmalı (bkz. `plan-03` §primitif terfisi). Bu yüzden D aşaması C'den sonradır.

---

## 4. İç omurga — dalga dalga plan

Her dalga aynı iskeleti izler ve **yazılım geliştirme sıranıza** uyar: önce testler → sonra veri modeli/şema → sonra geliştirme yaklaşımı → sonra edge-case/risk → en son adımlar + tam prompt. Her dalga sonunda DoD (Definition of Done — bitti tanımı) ve hangi CI kapısının geçtiği yazılıdır.

Dalga penceresi (kabaca): D0 ≈ 1-2 hafta, D1 ≈ 3-5 hafta, D2 ≈ 4-6 hafta, D3 ≈ paralel 4-8 hafta, D4 ≈ paralel 3-6 hafta, D5+ ≈ app başına 4-10 hafta. Bunlar tek-kişi+ajan varsayımıdır; paralel ekip kısaltır.

---

### Dalga 0 — ADR kilidi + doküman hijyeni (KOD YOK)

**Amaç:** `plan-00 §4`'teki altı çelişkiyi (C1-C6) kapatmak ve beş primitifi ADR ile kilitlemek. **Ne yapar:** kararı sabitler, bayatı siler. **Ne yapmaz:** hiçbir üretim kodu yazmaz; yalnız doküman + şema-varsayılanı + ADR.

**Önce testler.** Bu dalgada "test" = doküman/şema konformans testleri. Yazılacak kırmızı testler: (1) repoda "prisma" geçen hiçbir aktif doküman/seed kalmadığını doğrulayan bir `check` (grep-tabanlı); (2) `surface.ts` a11y varsayılanının `"2.2-AA"` olduğunu doğrulayan vitest; (3) `surface.ts`'te i18n alanının şemada var olduğunu doğrulayan vitest.

**Sonra şema/veri modeli.** İki küçük şema değişikliği: `surface.ts` a11y varsayılanı `"2.2-AAA"`→`"2.2-AA"`; `surface.ts`'e `i18n` alanı (`locales[]`, `defaultLocale`, `rtl`, `messagesRef`). Beş primitif bu dalgada yalnız **ADR olarak** tanımlanır (şemaya Dalga 1'de girer).

**Geliştirme yaklaşımı.** Altı ADR taslağı yazılır ve kilitlenir: ADR-K1 (kernel kimliği + stack = FastAPI/SQLAlchemy), ADR-A1 (Actor/Party), ADR-A2 (Capability/Entitlement), ADR-A3 (Mode-Profile), ADR-A4 (Computation/Derivation), ADR-P1 (PDP). C1 (AGENTS.md) **insan** tarafından elle düzeltilir; ajan yalnız diff önerir.

**Edge-case & riskler.** (1) AGENTS.md canon olduğu için ajan onu düzenleyemez — bu bir *özellik*, bug değil; insan düzeltir. (2) WCAG varsayılanını düşürmek mevcut "yeşil" düğümleri etkileyebilir; düşürme testle birlikte gelmeli. (3) ADR'ler "öneri" değil "kilit" olmalı; yoksa Dalga 1 kayar.

**Adımlar.** 1) C1 diff'ini insana sun. 2) C2 seed düzeltmesi PR. 3) C3/C4 şema+test PR. 4) Altı ADR taslağını yaz, insan kilitler. 5) `plan-03`'teki primitif yönergelerini gözden geçir.

**Tam Claude Code promptu (D0):**

```
ROL: Sen bu reponun (actionplan) plan+sözleşme katmanında çalışan bir doküman/şema ajanısın. Ürün kodu YAZMIYORSUN.

BAĞLAM: plan-00-kontrol-sentez §4'te 6 çelişki (C1-C6) listelendi. Bu görevde C2, C3, C4'ü düzelt ve 6 ADR taslağı yaz. C1 (AGENTS.md) SANA YASAK — sadece önerilen tek satırlık diff'i çıktı olarak ver, dosyayı DEĞİŞTİRME.

İZİNLİ DOSYALAR: src/schemas/surface.ts, tests/**, tools/agents/seed-layer0.mjs, tools/agents/seed-frontend.mjs, docs/adr-*.md (yeni), src/data/generated/nodes/** (yeniden üretim).
YASAK DOSYALAR: AGENTS.md, docs/adr-0026-*, docs/adr-0027-*, src/data/standards/*.json (bunlara dokunma).

TEST-ÖNCE RİTÜELİ (zorunlu):
1. Önce kırmızı test yaz: (a) surface a11y default "2.2-AA" bekleyen vitest, (b) surface şemasında i18n alanı bekleyen vitest, (c) aktif dokümanlarda "prisma" (case-insensitive) geçmediğini doğrulayan bir check script.
2. Testleri çalıştır, kırmızı olduğunu göster.
3. Kodu/şemayı düzelt: surface.ts a11y default -> "2.2-AA"; surface.ts'e i18n{locales:string[], defaultLocale:string, rtl:boolean, messagesRef:string} ekle; seed dosyalarındaki "Prisma" -> "SQLAlchemy 2.0".
4. Testleri yeşile getir.

ADR TASLAKLARI: docs/adr-K1-kernel-kimlik.md, adr-A1-actor-party.md, adr-A2-capability.md, adr-A3-mode-profile.md, adr-A4-computation.md, adr-P1-pdp.md. Her ADR: Bağlam / Karar / Gerekçe / Sonuç / Alternatifler / Durum:Taslak. İçeriği plan-03'teki ilgili yönergeden al.

STACK KİLİDİ: FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL. Next.js/Supabase/Prisma YASAK. Emoji YASAK. Çıktı Türkçe.

MUTLAK SINIRLAR: app/module düğümü üretme/silme YOK; ruleset override YOK; main'e push YOK; kanıtsız "bitti" YOK. Sadece PR aç.

ÇIKTI: (1) C1 için önerilen AGENTS.md diff'i (uygulamadan), (2) açılan PR'ın dosya listesi, (3) kırmızı→yeşil test kanıtı, (4) 6 ADR dosyası.
```

**DoD + CI kapısı.** `check-data-quality` + yeni grep-check yeşil; `surface` konformans testi yeşil; 6 ADR "Taslak" statüsünde mevcut; C1 diff'i insana iletildi. **Paralelleştirme:** düşük — bu dalga seri ve küçük, tek ajan yeter. **İnsan-onay noktası:** C1 elle düzeltme + 6 ADR "Kilitli"ye çevirme (yalnız insan).

---

### Dalga 1 — Beş primitif sözleşmesi (şema + platform SDK iskeleti)

**Amaç:** Actor/Party, Capability/Entitlement, Mode-Profile, Computation/Derivation, PDP'yi *sözleşme + şema* düzeyinde hayata geçirmek. **Ne yapar:** beş primitifin veri modelini ve platform SDK arayüzünü kurar. **Ne yapmaz:** henüz bir ürün ekranı/iş akışı bitirmez — o Dalga 2'dir. Primitifler burada "boş ama doğru" iskelet olarak durur.

**Önce testler.** Her primitif için sözleşme testi (kırmızı): Actor polimorfizmi (aynı party bağlama göre buyer+seller+employee olabiliyor mu?), Capability gate (user ∩ capability ∩ plan → izin/yok), Mode-Profile geçiş validasyonu (B2C→B2B dry-run eksik-alan raporu üretiyor mu?), Computation derivation grafiği (fiyat = f(taban, indirim, vergi) yeniden-hesaplanıyor mu?), PDP karar (allow/deny + gerekçe + karar-logu). Bunlar `platform` monoreposunda pytest; `actionplan`'da şema-konformans vitest.

**Sonra şema/veri modeli.** Sıra: (1) `party` tablosu (polimorfik: person/organization + roller ayrı `party_role`), (2) `capability` + `entitlement` (plan↔capability↔actor), (3) `mode_profile` (tenant/channel bazlı aktif capability seti + geçiş kayıt), (4) `computation` (derivation node grafiği; girdi alanları→çıktı alanı, saf fonksiyon), (5) `policy` (PDP: policy-as-data, condition→effect, karar-logu tablosu). Tümü multi-tenant (RLS veya schema-per-tenant — ADR-0026 kararına uyar), audit alanlı, Alembic expand-contract migration'lı.

**Geliştirme yaklaşımı.** Her primitif ayrı bir platform *modülü* (`AppModule` SDK'ya kayıt): `modules/party/`, `modules/capability/`, `modules/mode/`, `modules/computation/`, `modules/policy/`. Her modül: SQLAlchemy modeli + Alembic migration + Strawberry GraphQL tipi + REST + audit + ECA bağlama + test. PDP çapraz-kesen: diğer dördü ona sorar (`policy.evaluate(actor, action, resource, context)`).

**Edge-case & riskler.** (1) Actor polimorfizmi çok esnek olursa sorgu performansı düşer → rol tablosunu indeksle, sık sorguları materialize et. (2) Mode-Profile "tek tık" değil "validasyon+rollback'li kontrollü geçiş" olmalı; canlı sipariş varken mod değişimi veri bütünlüğünü bozmamalı. (3) Computation grafiği döngü içermemeli (DAG); döngü testte yakalanmalı. (4) PDP her istekte çağrılırsa gecikme artar → karar-cache + policy versiyonlama.

**Adımlar.** Beş modül *paralel* ajanla, her biri ayrı git worktree/branch (bkz. `plan-04`). PDP en son entegre edilir (diğerleri ona bağlı). Sıra içi: test → migration → model → API → audit → yeşil.

**Tam Claude Code promptu (D1 — her primitif için ayrı ajana, örnek: Actor/Party):**

```
ROL: Sen platform monoreposunda tek bir kernel modülü (party) yazan bir geliştirme ajanısın.

BAĞLAM: ADR-A1 (Actor/Party) kilitlendi. Amaç: aynı kişi/kurumun bağlama göre birden çok rol (buyer, seller, employee, supplier) taşıyabildiği polimorfik party modeli. plan-03 §Actor yönergesindeki şema tarifini uygula.

İZİNLİ DOSYALAR: platform/modules/party/**, platform/tests/party/**, platform/migrations/versions/*_party_*.py.
YASAK: diğer modüller, kernel SDK çekirdeği, main branch, ruleset dosyaları.

TEST-ÖNCE RİTÜELİ:
1. Kırmızı testler yaz: (a) bir party'ye 3 farklı rol atanabiliyor, (b) rol bağlam (tenant/channel) filtresiyle çözülüyor, (c) rol ekleme/çıkarma audit'e düşüyor, (d) tenant izolasyonu: A tenant B'nin party'sini göremiyor.
2. pytest ile kırmızı göster.
3. Uygula: SQLAlchemy 2.0 modeli (party, party_role), Alembic expand-contract migration (downgrade() zorunlu), Strawberry GraphQL tipi + resolver (DataLoader ile N+1 engelle), REST endpoint (Depends(require_tenant) + @RequirePermission), AuditLogger.log() her mutasyonda.
4. Testleri yeşile getir.

SÖZLEŞME UYUMU: core-contract-pack §2 (Tenant Context, AuthZ, Audit, Observability, Module SDK) zorunlu. Hata formatı {code,message,trace_id,details}. get_logger() kullan, print() yok.

STACK: FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL + Strawberry. Yasak: Next.js/Supabase/Prisma. Emoji yok. Türkçe yorum/commit.

MUTLAK SINIRLAR: app/module düğümü ÜRETME (bu bir kernel modülü impl'idir, WBS düğümü değil); ruleset override YOK; main'e push YOK; test dosyasını "geçsin diye" zayıflatma YOK (gate'i kandırma = testi düzeltmek değil zayıflatmak demektir, YASAK); kanıtsız bitti YOK. PR aç.

ÇIKTI: PR + kırmızı→yeşil kanıtı + migration downgrade testi + kapsam raporu.
```

(Aynı prompt iskeleti Capability, Mode-Profile, Computation, PDP için `plan-03`'teki ilgili yönergeyle doldurulur.)

**DoD + CI kapısı.** Beş modül testleri yeşil; migration downgrade otomatik test geçti; PDP diğer dörtten çağrılabiliyor; `check-core-contract`, `check-short-code`, `check-dependency-policy`, `check-standards-coverage` yeşil. **Paralelleştirme:** yüksek — 4 primitif paralel (PDP seri, en son). **İnsan-onay noktası:** her modül PR'ı için 1+ reviewer merge; PDP entegrasyonu insan onayı.

---

### Dalga 2 — İlk dikey dilim: Commerce "B2C→B2B mod anahtarı"

**Amaç:** Beş primitifin birlikte çalıştığını **tek bir uçtan-uca senaryoyla** kanıtlamak: bir e-ticaret tenant'ı B2C modundan B2B moduna kontrollü geçiş yapıyor. **Ne yapar:** primitifleri gerçek bir üründe pişirir, "motor çalışıyor" kanıtı üretir. **Ne yapmaz:** Commerce'in tüm özelliklerini bitirmez; yalnız mod-anahtarı dikey dilimini uçtan uca kapatır (schema→DB→RLS→API→surface→audit→test).

**Önce testler.** Kabul senaryosu (E2E, kırmızı): tenant B2B'ye geçmek istiyor → sistem dry-run yapıyor → eksik alanları raporluyor ("şirket cari hesabı zorunlu, min sipariş adedi yok, B2B fiyat listesi tanımsız") → insan onaylıyor → sistem eksikleri oluşturuyor → mod publish → B2B capability seti aktif (fiyat gizleme, RFQ, vadeli ödeme) → **canlı sipariş korunuyor** (veri kaybı yok) → rollback denenince B2C'ye dönüyor. Playwright + axe (a11y) + pytest entegrasyon.

**Sonra şema/veri modeli.** Yeni tablo yok denecek kadar az; primitifleri kullanır: `mode_profile` (B2C/B2B tanımları + capability setleri), `computation` (B2B fiyat listesi/hacim fiyatı), `party` (şirket cari hesabı), `policy` (fiyat görünürlüğü: B2B'de gizli, B2C'de açık), `capability` (rfq, net_terms, moq). Migration expand-contract; mod geçişi *veri yıkmaz*, capability bayraklarını değiştirir.

**Geliştirme yaklaşımı.** "Commerce Mode Orchestrator" bir servis: `preview()` (dry-run + eksik-alan raporu) → `validate()` → `apply-to-staging()` → `run-tests()` → `publish()` → `rollback()`. Ön yüz config-driven: `GET /runtime/tenant-capabilities` + `/runtime/navigation` + `/runtime/forms/product` endpoint'lerinden aktif yapıyı alır; React'te binlerce `if b2b else` yazılmaz. Surface `renderStrategy: projected` (şema-render) kullanır.

**Edge-case & riskler.** (1) Canlı sipariş/fatura varken mod değişimi — en kritik risk; geçiş *transaction* içinde, outbox+idempotency zorunlu (scale-invariant). (2) Rollback: publish sonrası geri dönüş; versiyonlu config + rollback testi olmadan mod-anahtarı felaket üretir. (3) Fiyat görünürlüğü PDP'ye bağlı; PDP yavaşsa PLP (ürün liste) yavaşlar → karar-cache. (4) B2B'de anonim kullanıcı fiyat görmemeli — PDP default-deny.

**Adımlar.** 1) E2E kabul testini kırmızı yaz. 2) Orchestrator servisini primitifler üstünde kur. 3) Runtime endpoint'leri + config-driven surface. 4) Rollback + versiyonlu config. 5) Yeşile getir + a11y AA + performans bütçesi (PLP p95 < hedef).

**Tam Claude Code promptu (D2):**

```
ROL: Commerce dikey diliminde "mod orkestratörü" yazan geliştirme ajanısın. Dalga 1 primitifleri (party, capability, mode, computation, policy) HAZIR ve onları TÜKETİRSİN, yeniden yazmazsın.

BAĞLAM: Bir e-ticaret tenant'ının B2C->B2B kontrollü geçişini uçtan uca kur. Senaryo: preview(dry-run) -> eksik alan raporu -> insan onayı -> eksikleri oluştur -> publish -> capability seti değişir -> canlı sipariş korunur -> rollback mümkün.

İZİNLİ: platform/apps/commerce/mode/**, platform/apps/commerce/runtime/**, frontend/src/modules/commerce/**, ilgili testler.
YASAK: kernel primitif modüllerinin İÇİ (party/capability/mode/computation/policy impl'i — onları sadece ÇAĞIR), main branch, ruleset.

TEST-ÖNCE:
1. E2E kabul testi (Playwright): tam senaryo kırmızı.
2. Entegrasyon (pytest): preview eksik-alan raporu doğru; publish capability setini değiştiriyor; canlı sipariş sayısı geçiş öncesi=sonrası; rollback B2C'ye dönüyor.
3. a11y: axe ile WCAG 2.2 AA (AAA değil).

UYGULA: ModeOrchestrator(preview/validate/apply-staging/run-tests/publish/rollback). Runtime endpoint'leri (/runtime/tenant-capabilities, /runtime/navigation, /runtime/forms/product). Config-driven React (mode-aware navigation; hardcoded if-else YOK). Versiyonlu config + rollback. Mod geçişi transaction + outbox + idempotency (çift-tahsilat engelle).

STACK: FastAPI+SQLAlchemy+Strawberry (BE), Vite+React+TanStack (FE). Yasak: Next.js/Supabase/Prisma. Emoji yok. Türkçe.

MUTLAK SINIRLAR: primitif modüllerini değiştirme; main'e push yok; test zayıflatma yok; kanıtsız bitti yok. PR aç.

ÇIKTI: PR + E2E/entegrasyon/a11y kırmızı->yeşil kanıtı + "canlı sipariş korundu" kanıtı + rollback kanıtı + PLP p95 ölçümü.
```

**DoD + CI kapısı.** E2E senaryo yeşil; canlı-veri-korunumu kanıtlı; rollback çalışıyor; a11y AA geçti; `check-surface`, `check-ui-standards`, `check-execution-readiness` yeşil. **Paralelleştirme:** orta — BE orchestrator ve FE runtime iki ajanla paralel, tek E2E'de buluşur. **İnsan-onay noktası:** dry-run onayı senaryonun *içinde* (ürün davranışı); PR merge insan.

---

### Dalga 3 — Eksik numeronym standartları (çapraz-kesen)

**Amaç:** `plan-02`'deki numeronym paketini uygulamak — mevcut 15 standardın kapsamadığı boşlukları (g11n stratejisi, c12n özelleştirme, c13n kanonikleştirme, i14y birlikte-çalışabilirlik, p13n kişiselleştirme, n6n/d10n normalizasyon, v12n, SSO/MFA, E2EE, IaC, kenar-güvenlik) standart sözleşmesine bağlamak. **Ne yapar:** eksik standartları reponun mevcut 15-standart sistemine (`src/data/standards/*.json` + `standard.ts`) ekler; yeni bir paralel taksonomi kurmaz. **Ne yapmaz:** her app'i tek tek standarda uydurmaz — o Dalga 5+'ta app-bazlı olur; burada yalnız *sözleşme + CI kapısı* kurulur.

**Önce testler.** Her yeni standart için `check-standards-coverage` genişletmesi: standart JSON'u `standard.ts` şemasına uyuyor mu, en az 3 kural + severity + check alanı var mı, ilgili düğümler `standardRefs.<yeni>Ref` ile bağlanabiliyor mu. i18n zaten var; onun *surface* tarafındaki eksik alanı (Dalga 0'da eklendi) test edilir.

**Sonra şema/veri modeli.** `standard.ts` `family` enum'u yeterli (`engineering|design|testing|devops|ai|data|governance`); yeni standartlar bu ailelere düşer (ör. c13n→data, i14y→engineering, SSO/MFA→governance/security, IaC→devops). `StandardRefsSchema`'ya yeni ref anahtarları eklenir (opsiyonel, geriye-uyumlu).

**Geliştirme yaklaşımı.** `plan-02`'deki PROMPT 1 (sınıflandır) → PROMPT 2 (denetle) → PROMPT 3 (sözleşme paketi) → PROMPT 4-14 (uygula) zinciri. Kritik düzeltme: **iş modelleri (B2B/B2C/C2C…) standart DEĞİL, Mode-Profile capability'sidir** — repo bunu zaten doğru ayırıyor; yeni standartlar bu hatayı tekrarlamaz.

**Edge-case & riskler.** (1) Standart *enflasyonu*: 50 numeronym'in hepsini standart yapmak sistemi boğar — bir kısmı "araç/ekosistem terimi" (CDN/DNS/CLI) olarak *standart değil* işaretlenmeli. (2) Mevcut standartla çakışma: SSO/MFA'yı ayrı standart mı yoksa mevcut security dimension'a mı bağlamak — `plan-02` kapsama haritası karar verir. (3) i18n zaten 15. standart; tekrar üretme.

**Adımlar.** `plan-02` prompt zincirini sırayla koş. Her standart ayrı küçük PR. Standartlar bağımsız olduğu için **yüksek paralellik** (her ajan bir standart ailesi).

**Tam Claude Code promptu (D3):** Bu dalganın promptları ayrı bir dosyada tam yazılı — `plan-02-numeronym-standart-prompt-paketi`. Oradaki PROMPT 1'den başlayıp 14'e kadar sırayla verilir. Burada tekrar edilmez (tek-kaynak ilkesi).

**DoD + CI kapısı.** Eksik standartlar `src/data/standards/`'ta sözleşme olarak var; `check-standards-coverage` genişledi ve yeşil; hiçbir iş-modeli standart olarak eklenmedi (kapsama haritası doğrulandı). **Paralelleştirme:** yüksek. **İnsan-onay noktası:** her standart sözleşmesi P0/P1/P2 önceliğiyle insan onayı (standart = kalıcı sözleşme).

---

### Dalga 4 — Operasyon kası + kenar-güvenlik + scale-invariant

**Amaç:** Raporların "ops'ta zayıf" dediği boşluğu kapatmak: DR (felaket-kurtarma), yedek/geri-yükleme tatbikatı, SLO/incident playbook, FinOps, secrets/Vault, ve `plan-00 C5`'teki scale-invariant zorlaması. **Ne yapar:** üretimi ayakta tutan ve KVKK yükümlülüğünü karşılayan operasyon sözleşmelerini kurar. **Ne yapmaz:** yeni ürün özelliği eklemez; görünmez ama zorunlu altyapıyı kurar.

**Önce testler.** (1) Restore-drill testi: yedekten geri-yükleme otomatik senaryosu (aylık CI job). (2) scale-invariant testi: para/sipariş yazan bir akış outbox+idempotency olmadan merge edilemiyor (CI kapısı reddediyor). (3) Secrets taraması: repoda düz-metin secret yok (gitleaks benzeri). (4) Rate-limit + WAF-ready log testi.

**Sonra şema/veri modeli.** Yeni tablo azdır: `outbox` (transactional event), `idempotency_key`, `audit` (tamper-evident: hash zinciri). Backup/restore veri modeli değil süreç; SLO/incident doküman + ölçüm.

**Geliştirme yaklaşımı.** scale-invariant: para/sipariş/stok yazan her akışta outbox+idempotency **zorunlu-invariant** (bayrak değil). Audit tamper-evident: her kayıt önceki kaydın hash'ini taşır. Secrets: ortam-değişkeni + Vault deseni; repoda secret yok. Kenar: rate-limit header, CORS politikası, güvenlik başlıkları, DDoS azaltma kancaları. Deploy: Hetzner/Debian/Docker Compose baz + IaC (deploy tekrarlanabilir).

**Edge-case & riskler.** (1) DR "yazılı ama denenmemiş" olursa işe yaramaz — restore-drill *otomatik ve periyodik* olmalı. (2) scale-invariant'ı geç eklemek = mevcut akışları geri-uyumlu kılmak zor; erken (Dalga 4) doğru. (3) Audit hash-zinciri performansı — async yaz, senkron doğrula. (4) FinOps: AI-ajan maliyeti dahil ölçülmeli (bkz. `plan-04` maliyet sınırı).

**Adımlar.** 1) scale-invariant CI kapısı (para akışı outbox'suz merge edilemesin). 2) outbox+idempotency+audit-hash primitifleri. 3) Restore-drill CI job. 4) Secrets/Vault + kenar-güvenlik. 5) SLO/incident playbook + FinOps panosu.

**Tam Claude Code promptu (D4):**

```
ROL: Platform operasyon/güvenlik kası kuran bir altyapı ajanısın.

BAĞLAM: plan-00 C5 (scale opt-in) + raporların ops boşluğu. Amaç: para/sipariş/stok yazan akışlarda outbox+idempotency ZORUNLU-invariant; tamper-evident audit; restore-drill; secrets/Vault; kenar-güvenlik.

İZİNLİ: platform/kernel/scale/**, platform/kernel/audit/**, .github/workflows/**, infra/** (IaC), ilgili testler.
YASAK: ürün app modülleri, main branch, ruleset.

TEST-ÖNCE:
1. Kırmızı: para yazan örnek akış outbox olmadan CI'da reddediliyor mu (scale-invariant gate).
2. idempotency: aynı idempotency_key ile iki istek tek etki.
3. audit: kayıt zinciri hash doğrulaması bozulmayı yakalıyor.
4. restore-drill: yedekten geri-yükleme senaryosu yeşil.
5. secrets: repoda düz-metin secret yok.

UYGULA: outbox tablosu + transactional publish; idempotency_key; audit hash-zinciri (async yaz, senkron doğrula); check-scale-invariant.mjs (CI kapısı); restore-drill.yml (periyodik CI); Vault/env-secret deseni; rate-limit + güvenlik başlıkları + CORS; Docker Compose + IaC (Hetzner/Debian/AMD EPYC).

STACK: FastAPI+SQLAlchemy+PostgreSQL. Deploy: Hetzner/Debian/Docker. Yasak: Next.js/Supabase/Prisma. Emoji yok. Türkçe.

MUTLAK SINIRLAR: main'e push yok; test zayıflatma yok; secret'ı koda gömme yok; kanıtsız bitti yok. PR aç.

ÇIKTI: PR + 5 kırmızı->yeşil kanıtı + yeni CI kapıları + restore-drill job + SLO/incident playbook taslağı.
```

**DoD + CI kapısı.** scale-invariant kapısı aktif ve para akışını koruyor; restore-drill periyodik yeşil; audit tamper-evident; secrets temiz; SLO/incident/FinOps yazılı. **Paralelleştirme:** orta — scale, audit, secrets, kenar ayrı ajanlarla. **İnsan-onay noktası:** güvenlik/DR sözleşmeleri insan onayı zorunlu (yüksek risk).

---

### Dalga 5+ — Portföy genişleme (app-by-app, olgunluk merdiveni)

**Amaç:** §3'teki dış roadmap sırasıyla uygulamaları teker teker L1→L2→L3 merdiveninden geçirmek. **Ne yapar:** kanıtlanmış primitif+standart+ops üstünde her uygulamayı bağımsız-satılabilir çekirdekten (L1) enterprise'a (L3) taşır. **Ne yapmaz:** her uygulamayı aynı anda L3 yapmaz; her app kendi hızında tırmanır (invoice L3 iken inventory L1 olabilir).

**Önce testler / şema / yaklaşım / edge-case:** Her uygulama Dalga 2'nin *deseni*ni tekrarlar (dikey dilim, test-önce, config-driven surface, primitif-tüketen). Fark: uygulamaya özel ArcheType'lar + Surface tipleri + Workflow'lar. Ağır-primitif uygulamalar (Fleetx/Teams/Email) önce ilgili primitif terfisini (geo/media/mail) bekler.

**Yaklaşım — her uygulama için standart döngü (bu 7 adım her app'te tekrar eder):**

1. Uygulamanın ArcheType'larını `plan-03` archetype yönergesine göre tanımla (sözleşme, kod değil).
2. Test-planı: kabul senaryoları kırmızı.
3. DB şema + RLS + migration.
4. Dikey dilim geliştirme (primitifleri tüket, config-driven surface).
5. Edge-case + performans bütçesi + a11y AA.
6. L1 DoD (multi-tenant, RBAC, i18n-ready, Docker, testler) → insan graduation onayı.
7. L2/L3'e capability/observability/DR ekleyerek tırman.

**Tam Claude Code promptu (D5+ — app başına parametreli şablon):**

```
ROL: <APP> uygulamasında bir dikey dilim yazan geliştirme ajanısın. Kernel primitifleri + Dalga 3 standartları + Dalga 4 ops kası HAZIR; onları TÜKETİRSİN.

BAĞLAM: <APP> için <DIKEY_DILIM> senaryosunu L1 olgunluğunda uçtan uca kur. ArcheType sözleşmeleri plan-03'e göre <APP>'in modülünde tanımlı.

İZİNLİ: platform/apps/<APP>/**, frontend/src/modules/<APP>/**, ilgili testler, <APP> migration'ları.
YASAK: kernel primitif içi, diğer app'ler, main, ruleset.

TEST-ÖNCE: kabul senaryosu (E2E) + entegrasyon (pytest) + a11y (axe, WCAG 2.2 AA) kırmızı; sonra yeşil.

UYGULA: <APP> ArcheType'ları -> DB+RLS+migration -> config-driven surface (renderStrategy: projected; tüketici yüzey ise plan-03 surface-v2 tiplerini kullan) -> primitif tüketimi (party/capability/mode/computation/policy) -> audit -> observability.

L1 DoD: multi-tenant RLS, RBAC, i18n-ready, temel audit, Docker-Compose, unit+e2e testler, bağımsız-satılabilir izolasyon (app-distribution-contract).

STACK: FastAPI+SQLAlchemy+Strawberry / Vite+React+TanStack. Yasak: Next.js/Supabase/Prisma. Emoji yok. Türkçe.

MUTLAK SINIRLAR: kernel primitif değiştirme yok; main'e push yok; test zayıflatma yok; kanıtsız bitti yok. PR aç.

ÇIKTI: PR + kırmızı->yeşil + L1 DoD checklist + performans/a11y ölçümü.
```

**DoD + CI kapısı.** App L1 DoD yeşil + graduation onayı; sonraki merdiven için `core-enterprise-maturity-ladder` L2/L3 kriterleri. **Paralelleştirme:** çok yüksek — bağımsız app'ler ayrı ekip/ajanla eşzamanlı (bkz. §5). **İnsan-onay noktası:** her merdiven atlaması (L1→L2→L3) çift-kapı: CI yeşil + release-owner imzası.

---

## 5. Kritik yol ve paralelleştirme haritası

Sade özet: ilk üç dalga **seri** (birbirine bağlı), sonraki dalgalar **büyük ölçüde paralel**. Bu ayrım, kaç ajanı aynı anda koşabileceğinizi belirler. Tablodan önce not: seri kısmı hızlandırmanın yolu ajan sayısı değil, ADR kararlarını hızlı kilitlemektir.

| Dalga | Öncekine bağlı mı? | Paralellik | Neden |
|---|---|---|---|
| D0 (ADR+hijyen) | — | Düşük (1 ajan) | Kararlar seri kilitlenir; küçük iş |
| D1 (5 primitif) | D0 (ADR kilidi) | Yüksek (4 paralel + PDP seri) | 4 primitif bağımsız; PDP diğerlerine bağlı |
| D2 (dikey dilim) | D1 (primitifler) | Orta (BE+FE 2 ajan) | Tek senaryoda buluşur |
| D3 (standartlar) | D0; D2 ile paralel olabilir | Yüksek | Standartlar birbirinden bağımsız |
| D4 (ops+güvenlik) | D1; D2 ile paralel olabilir | Orta | scale/audit/secrets/kenar ayrı |
| D5+ (portföy) | D2+D3+D4 | Çok yüksek | Bağımsız app'ler eşzamanlı |

Kritik yol: **D0 → D1 → D2** zorunlu seridir (primitif kanıtı bu zincirdedir). D3 ve D4, D2 ile *paralel* başlayabilir (D0 bittiği an). D5+ ancak D2+D3+D4 tabanı hazırken açılır ama içinde app'ler sonuna kadar paralel gider.

Ajan sayısı önerisi (tek geliştirici + ajan filosu): D1'de 4-5, D3'te 3-4, D5+'ta app başına 1-2, toplam eşzamanlı 3'lük `run-swarm` concurrency ile sıraya alınır (donanım sınırı; bkz. `plan-04`). Paralel ajanların çakışmaması için her ajan **ayrı git worktree/branch** kullanır — orkestrasyon detayları `plan-04`'te.

