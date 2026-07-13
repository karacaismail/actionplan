# AGENTS.md — Bu Repoda Çalışan AI Ajan(lar) İçin Bağlayıcı Çalışma Sözleşmesi

Sürüm: 1.2 · Tarih: 2026-07-13
Durum: Kanonik, bağlayıcı. Bu dosyayla çelişen her ajan davranışı geçersizdir.
Kapsam: `actionplan` reposunda çalışan tüm AI ajanları (tek ajan veya paralel swarm).

Bu dosya bir öğretici değildir; bir sözleşmedir. Aşağıdaki maddeler "öneri" değil "kural"dır. Bir kuralı çiğneyen değişiklik CI'da bloklanır ve merge edilmez.

---

## 0. Kalıcı Rol Sınırı — Dokümantasyon Bakımı

Codex, Claude, Cursor, Aider, Windsurf ve bu repo bağlamında çalışan başka hiçbir AI ajanı **proje, platform, kernel, SDK, app-core, module veya app geliştirmez**. AI erişimi `read-only-audit`, platform ürün kodu yazarı `human-developer-only`dır. AI'nın işi insan geliştiricinin tüketebileceği dokümantasyon ve directive sistemini yeterli seviyeye getirmektir.

Bağlayıcı yorum:
- Dokümanlardaki "kod yaz", "Claude Code'a ver", "Agent Prompt'u uygula" gibi eski ifadeler AI'ya yazma yetkisi vermez; insan geliştirici için directive'e dönüştürülür.
- `actionplan` doc-maintainer bu yönergeleri **uygulayıp ürün kodu üretmez**; yönergelerin eksik, çelişkili veya yetersiz kalan taraflarını düzeltir.
- "Devam et", "eksikleri tamamla" veya benzeri talimatlar bu repo bağlamında dokümantasyon/handoff yeterliliğini tamamlamak anlamına gelir; platform implementation'a geçiş izni değildir.
- Implementation repo okunacaksa bu yalnız açıkça istenen audit/kanıt doğrulama için salt-okunur yapılır; yazma, kod üretme, migration, test implementation veya app/module scaffold işi geliştirici sorumluluğudur.

Kanonik yasak: `docs/platform-product-code-write-prohibition-directive.md`; rol sözleşmesi: `docs/doc-maintainer-operating-boundary.md`. Platform ürün kodunu **yalnız insan geliştirici** yazar.

---

## 1. Bu Repo Nedir (ve Ne Değildir)

`actionplan` bir **WBS planlama + sözleşme katmanıdır**; çalışan ürün kodu burada **değildir**.

- İçerik tek doğruluk kaynağı (JSON-as-DB): `src/data/generated/nodes/*.json` (485 düğüm). Engine bu JSON'ları okur, React UI render eder.
- Gerçek ürün/uygulama kodu `platform` monoreposundadır. AI ajanları onu yalnız salt-okunur denetler; `actionplan` o kodu **planlar ve sözleşmeye bağlar**, ürün kodunu yalnız insan geliştirici yazar.
- 7 seviye (doğa metaforu): `app` (ada) → `module` (dağ) → `archetype` (kaya) → `feature` (taş) → `component` (kum) → `work_unit` (molekül) → `micro_step` (atom).
- 7 waterfall faz: `requirements` → `test-plan` → `db-schema` → `development` → `test-qa` → `verification` → `release-maintenance`.

Bunun pratik sonucu: **bir `.json` düğümünü düzenlemek "veri güncellemesi"dir, "kod yazmak" değildir.** Bir düğümde "migration var" yazıyorsa, kasıt o migration'ın `platform` monoreposunda yazılacağıdır; `actionplan`'da değil.

Ne YAPMAZSIN bu repoda:
- `platform` veya `projector`'a kod yazmazsın (ayrı repolar; bu repo plan+sözleşme katmanı).
- Dokümanların yönergelerini takip ederek hedef proje/platform geliştirmezsin; yönergeleri geliştirici için yeterli ve çelişkisiz hale getirirsin.
- Yeni `app` veya `module` üretmezsin/güncellemezsin (kapsam onayı insan yetkisindedir; bkz. Bölüm 4).
- Kanonik sözleşme dosyalarını insan onayı olmadan yeniden yazmazsın (bkz. Bölüm 7).

---

## 2. Altın Kural — Standardı YENİDEN YAZMA, REFERANS Ver

Bu reponun en önemli kuralı. (Kaynak: `docs/adr-0027-engineering-standards.md`.)

Mühendislik standartları (kodlama, tasarım, test, güvenlik, AI-yönetişim…) **tek-kaynak sözleşmelerdir** ve `src/data/standards/<id>.json` altında yaşar. Bir düğüm bu sözleşmelere **`standardRefs` anahtarı ile REFERANS verir**; içeriğini düğüme kopyalamaz.

Yasak (drift üreten anti-desen):
- Standart kuralının metnini bir düğümün `dimensions[...].items` veya `notes` alanına **kopyalamak**.
- İki düğümün çelişen standart söylemesi (ör. biri "Tailwind", diğeri "SCSS"). Faz 4'te bu fiilen oluştu; ADR-0027 bunu kalıcı olarak yasaklar.
- Serbest-metin "standart kartı" eklemek. 12+ yeni boyut kartı EKLENMEZ; UI şişer, drift artar.

Doğru (referans deseni):
- İlgili standardı `standardRefs.<...>Ref` ile bağla. Kanonik anahtar seti `src/schemas/task.ts` içindeki `StandardRefsSchema`'dır; çekirdek varsayılan ref'ler:
  - `techProfileRef` → `src/data/tech-profiles.json` (frontend tech profili; ADR-0026)
  - `architectureRef` → `src/data/standards/architecture.json`
  - `codingStandardRef` → `src/data/standards/coding-standards.json`
  - `shortCodeRef` → `src/data/standards/short-code.json`
  - `designSystemRef` → `src/data/standards/design-system.json`
  - `uiComponentRef` → `src/data/standards/ui-components.json`
  - `uxStandardRef` → `src/data/standards/ux-interaction.json`
  - `dataApiContractRef` → `src/data/standards/data-api-contract.json`
  - `stateContractRef` → `src/data/standards/state-management.json`
  - `testingStandardRef` → `src/data/standards/testing-strategy.json`
  - `qualityGateRef` → `src/data/standards/quality-gates.json`
  - `observabilityRef` → `src/data/standards/observability.json`
  - `releasePolicyRef` → `src/data/standards/release-versioning.json`
  - `aiGovernanceRef` → `src/data/standards/ai-governance.json`
  - `i18nRef` → `src/data/standards/i18n-standards.json`
- Bir boyut bu düğüme uygulanmıyorsa `applicability[dimKey] = { applies: false, reason: "<gerekçe>" }` yaz; jenerik dolgu üretme.
- Standarttan bilinçli sapman varsa `waivers[]`'a **gerekçeli + onaylı + süreli** kayıt ekle. Gerekçesiz/süresiz waiver geçersizdir (CI bloklar).

Tek cümlede: **kuralı tekrar etme, kurala işaret et.** Standardın metni tek yerde yaşar; düğüm yalnızca o yere bağlanır.

---

## 3. Test-Önce Zorunlu

Bu repoda davranış değiştiren repo/tooling kodu ancak açık talep olduğunda ve testsiz olmadan girer. Platform/product kodu bu repoda hiç yazılmaz.

- Yeni bir doğrulama/kapı/şema davranışı eklerken **önce kırmızı test** yaz, sonra implementasyonu yeşile getir.
- Şema (`src/schemas/*.ts`) değişiklikleri ilgili conformance/vitest testiyle birlikte gelir.
- Standart sözleşme JSON'ları (`src/data/standards/*.json`) `standard.ts` şemasına uyar ve conformance testinden geçer.
- "Önce kodu yazayım, testi sonra eklerim" bu repoda geçersizdir. (Düğüm fazları için aynı kural: `test-plan` kapısı geçilmeden `development` başlamaz — bkz. `docs/task-to-code-contract.md`.)

---

## 4. Kilitler (Bağlayıcı Sınırlar)

Bu kilitler ADR'lerle sabitlenmiştir; ajan bunları gevşetemez.

### 4.1 Frontend HEADLESS kilidi (ADR-0026)
- Tüm ürün frontend'i **headless**: Radix çekirdek + zor-erişilebilirlikte React Aria. Stillenmiş bileşen kiti ürüne giremez.
- Ürün CSS = **SCSS + token**. Tailwind yalnızca araç (tooling) yüzeyinde serbest; ürün için değil.
- Yasak paketler (global): `next`, `redux`, `@reduxjs/toolkit`, `flowbite`, `antd`, `@ant-design/pro-components`, `@mui/material`, `@chakra-ui/react`, `@mantine/core`, `react-markdown`, `markdown-it`, `supabase`.
- Veri/form/durum ekosistemi: **TanStack** (Router/Query/Table) + RHF/Zod (veya TanStack Form). Backend kilidi: **FastAPI + SQLAlchemy 2.0 / SQLModel + Alembic + PostgreSQL** (Prisma yasak — bkz. `core-contract-pack §1`, `adr-K1-kernel-kimlik`).

### 4.2 UI standardı kilidi
- Yazı tipi **Roboto**; font-weight **≥ 300**; taban font boyutu **≥ 1rem**.
- İkon seti **Phosphor** (`ph-*`). **Emoji yasak.**
- Dokunma hedefi ≥ 44px; WCAG 2.2 AAA hedefi (kontrast ≥ 7:1, tam klavye, görünür odak).

### 4.3 Kısa-kod kilidi (`src/data/standards/short-code.json`)
- PR net değişiklik ≤ **400 satır**; tek PR ≤ 20 dosya.
- Kaynak dosya ≤ **300 satır**; fonksiyon döngüsel karmaşıklık ≤ **10**.
- Ölü kod, spekülatif soyutlama (YAGNI), derin kalıtım yasak. Her görev/PR `allowed-files` + en az bir `non-goal` bildirir.

### 4.4 AI yetki sınırı kilidi (`src/data/platform-product-code-write-policy.json`)
- AI platform üzerinde yalnız `read-only-audit` yapar ve actionplan içinde `DIRECTIVE-ONLY` handoff üretir.
- AI ürün kodu, test, migration, Storybook/config dosyası yazamaz; branch/commit/push/PR oluşturamaz.
- Platform ürün kodu yazarı `human-developer-only`dır.
- AI **app/module üretemez, app/module güncelleyemez**, ruleset'i devre dışı bırakamaz/override edemez, doğrudan prod write yapamaz, geçmişi rewrite edemez.
- `forbiddenTargets` varsayılanı `["app", "module"]`. Tetiklenen ECA zinciri maksimum derinliği **6**.

İlgili ADR'ler ve kanonik dokümanlar:
- `docs/adr-0026-tech-profiles.md` (frontend tech profili + headless kilidi)
- `docs/adr-0027-engineering-standards.md` (standart referans + applicability + waiver + kapı)
- `docs/task-to-code-contract.md` (seviye → teslimat, faz → eylem, karar ağacı)
- `docs/ready-for-dev-gate.md` (development fazı Definition of Ready)

---

## 5. Her Değişiklikte Hangi Kapılar Yeşil Olmalı

Bir değişikliği bitirmeden önce **yerelde** ilgili kapıları çalıştır. Bunlar CI'da da BLOKLAYICIdır; kırmızıyken merge olmaz.

Çekirdek (her değişiklikte):
- `pnpm typecheck` (veya `npm run typecheck`) — `tsc --noEmit`
- `pnpm test` — vitest (`vitest run`)
- `pnpm lint` — `biome check .`

Dokunduğun alana göre ek check-*.mjs kapıları (`tools/agents/`):

| Neye dokunduysan | Çalıştır |
|---|---|
| `standardRefs` | `node tools/agents/check-standards-coverage.mjs` (her ref çözülmeli) |
| `applicability` | `node tools/agents/check-dimension-applicability.mjs` (`applies:false` ⇒ gerekçe) |
| `uiDelivery` / UI-impact içerik | `node tools/agents/check-ui-delivery.mjs` (UI adayı ⇒ sözleşme; backend-only ⇒ gerekçeli N/A; bkz. `docs/storybook-master-component-integration-directive.md`) |
| `waivers` | `node tools/agents/check-waivers.mjs` (gerekçe + onay + süre) |
| kısa-kod / boyut bütçesi | `node tools/agents/check-short-code.mjs` |
| bağımlılık / paket | `node tools/agents/check-dependency-policy.mjs` |
| UI standardı | `node tools/agents/check-ui-standards.mjs` |
| tech profili / Surface | `node tools/agents/check-tech-profile.mjs`, `node tools/agents/check-surface.mjs` |
| düğüm içeriği | `node tools/agents/check-content.mjs`, `npm run test:content` |
| veri kalitesi / DAG | `node tools/agents/check-data-quality.mjs` |
| yürütmeye hazırlık | `node tools/agents/check-execution-readiness.mjs`, `node tools/agents/check-ready-for-dev.mjs` |
| ruleset | `node tools/agents/check-ruleset.mjs` |

CI'da ayrıca e2e + axe (`pnpm test:e2e`) ve `build` koşar. Tam BLOKLAYICI kapı listesi `.github/workflows/deploy.yml`'dedir; ajan o listeyi kaynak kabul eder.

Kural: **kırmızı kapıyı "sonra düzeltirim" diye bırakma.** Değişiklik, dokunduğu kapılar yeşil olduğunda tamamlanmış sayılır.

---

## 6. İzole Dosya Yazımı + Küçük PR

Özellikle paralel swarm'da çakışmayı önlemek için:

- **Her ajan yalnız kendi shard'ına yazar.** Başka ajanın dosyasına dokunma; üst üste yazma çakışması üretme.
- Migration/toplu-yeniden-yazma çalıştırma. Güncel node sayısı `src/data/generated/meta.json` içinden okunur; default'lu lazy migration sayesinde eski JSON'lar dosyaya dokunmadan parse olur, bir dosya yalnız gerçek değer atanınca yazılır.
- Her PR **küçük ve tek-amaçlı**: kısa-kod bütçesine uy (≤ 400 satır net, ≤ 20 dosya). Aşan iş atomik PR'lara bölünür.
- Her görev/PR `allowed-files` listesini ve en az bir `non-goal`'ı bildirir; listede olmayan dosyaya dokunma.
- Sokete-bağlı çalışmada (socket-drop) yazılmış dosyalar diske düşer; onları harvest et, kaybetme.

---

## 7. Kanonik Dokümanlar ve Düzenleme Yetkisi

Aşağıdaki dosyalar **kanonik sözleşmedir**; içerikleri tek doğruluk kaynağıdır:

- `docs/adr-0026-tech-profiles.md`, `docs/adr-0027-engineering-standards.md` (ADR'ler)
- `docs/task-to-code-contract.md`, `docs/ready-for-dev-gate.md` (kanonik kurallar)
- `docs/doc-maintainer-operating-boundary.md` (actionplan doc-maintainer rol sınırı)
- `docs/platform-product-code-write-prohibition-directive.md` (AI platform yazma yasağı; human-developer-only)
- `src/schemas/*.ts` (şema = TS tiplerinin tek kaynağı)
- `src/data/standards/*.json` + `src/data/tech-profiles.json` (standart sözleşmeleri)

Yetki sınırı: Bu kanonik dosyaları ve bu `AGENTS.md`'yi yalnız **Kullanıcı/Admin (insan onayı)** değiştirebilir. AI ajan bunları doğrudan yeniden yazamaz; yalnız değişiklik **önerebilir** (changeset). Bir standardı güncellemek istiyorsan, kuralı düğüme kopyalamak yerine standart sözleşmesinde değişiklik öner ve insan onayına sun.

Standartların gezinme indeksi `docs/engineering-standards-index.md` altında toplanmıştır; standart listesi için bu dosyanın Bölüm 2'si yerine o hub'ı, `src/schemas/task.ts` içindeki `StandardRefsSchema`'yı ve `src/data/standards/` dizinini kaynak al.

---

Son söz: Bu repoda iyi ajan, **ürün/platform kodu yazmayan, dokümantasyon-handoff içeriğini yeterli yapan, çok referans veren ve kapsamını dar tutan** ajandır. Standardı tekrar etme; ona bağlan. Kapsamı büyütme; küçük PR aç. Kapıyı atlama; yeşile getir.
