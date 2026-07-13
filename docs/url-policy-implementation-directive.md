# Metaframer URL Policy Implementation Directive

**Program:** `URLP-00`–`URLP-16`  
**Sürüm:** 1.0  
**Tarih:** 2026-07-13  
**Durum:** Execution-ready handoff; runtime implementation kanıtı değildir  
**Kanonik karar kaynağı:** `docs/url-policy.md`  
**Makine sözleşmesi:** `src/data/url-policy/registry.json`  
**Hedef implementation reposu:** `/Users/karaca/DEV/mimari/platform`
**AI erişimi:** `read-only-audit`; ürün kodu yazarı `human-developer-only`  
**Kanonik yasak:** `docs/platform-product-code-write-prohibition-directive.md`

---

## 1. Amaç ve otorite sınırı

Bu belge, `docs/url-policy.md` içindeki maturity-level URL kararlarını `platform`
reposunda test-first ve küçük PR'larla uygulamak için yürütme sözleşmesidir. Yeni URL
kararı icat etmez; kanonik kararı test, dosya sınırı, kabul ölçütü, güvenlik senaryosu,
rollback ve evidence biçimine dönüştürür.

Bağlayıcı yorum:

- `actionplan` bir plan/sözleşme reposudur; burada platform runtime kodu yazılmaz.
- Bu belgenin veya actionplan QA kapılarının yeşil olması URL motorunun çalıştığı
  anlamına gelmez.
- Runtime yalnız `platform` reposundaki test, PR, CI, staging ve gerektiğinde operasyon
  drill evidence'ı ile doğrulanır.
- `docs/url-policy.md` ile bu belge çelişirse `docs/url-policy.md` geçerlidir; uygulama
  durur ve changeset insan onayına sunulur.
- `platform` gerçekliği değişmişse ajan önce salt-okunur audit yapar, dosya yollarını
  PR brief'inde düzeltir; kararı sessizce değiştirmez.

### 1.1 Doğrulanmış başlangıç gerçekliği

2026-07-13 salt-okunur denetiminde:

- Backend `apps/api/src/meta_api/app.py` içinde minimal FastAPI uygulaması, `/graphql`
  ping ve `/healthz` vardır.
- Frontend `apps/web/src/router.tsx` içinde TanStack Router ve yalnız `/` route'u vardır.
- `packages/ui` temel bileşen/token paketidir.
- URL policy kernel'i, SDK'sı, DB şeması, host binding resolver'ı, alias motoru,
  custom-domain control plane'i ve tenant URL yönetim Surface'i için çalışma kanıtı yoktur.
- PostgreSQL CI servisi tanımlıdır; fakat URL policy için migration/model kanıtı yoktur.
- Storybook runtime/config/preview varmış gibi kabul edilmez; Faz 15 başlamadan yeniden
  doğrulanır.

Bu liste başlangıç snapshot'ıdır; completion evidence değildir.

---

## 2. Program yürütme protokolü

Makine kaydındaki bağlayıcı alan adları şunlardır; bu belgeki her faz kartı bunların
insan-okur karşılığıdır: `allowedFiles`, `nonGoals`, `redTests`, `securityNegativeTests`,
`evidenceRequirements`, `rollback` ve `agentPrompt.stopConditions`. Tek doğruluk kaynağı
`src/data/url-policy/implementation-program.json`dır; başlık eşanlamlıları yeni alan
yaratmaz.

### 2.0 Paket sınırı

URL çekirdeğinin ortak TypeScript implementation hedefi `packages/url-policy`, workspace
paket adı `@platform/url-policy`dır. Bu paket, platformun ayrı genel geliştirici SDK
hedefinin yerine geçmez: URL invariantlarını, contract'ları ve deterministik generator
primitive'lerini sahiplenir; gelecekteki genel SDK onu dependency olarak tüketir ve URL
kurallarını yeniden tanımlayamaz. URLP fazlarında genel SDK altında paralel URL motoru
yazmak veya iki canonical generator tutmak yasaktır.

### 2.1 Zorunlu sıra

```text
URLP-00 -> URLP-01 -> URLP-02 -> URLP-03 -> URLP-04
                                      |
                                      v
URLP-05 -> URLP-06 -> URLP-07 -> URLP-08
   |          |          |          |
   +----------+----------+----------+
                         v
URLP-09 -> URLP-10 -> URLP-11 -> URLP-12 -> URLP-13
                                                |
                                                v
URLP-14 -> URLP-15 -> URLP-16 -> maturity exit
```

Bir fazın acceptance kriterleri ve evidence'ı tamamlanmadan ardılı development'a
alınmaz. Bağımsız test/contract alt-PR'ları paralel hazırlanabilir; merge sırası
değişmez. URLP-09 ve URLP-10 ayrı branch'lerde hazırlanabilir, fakat URLP-10 production
origin geçişi URLP-09 active-domain lifecycle kanıtı olmadan açılmaz.

### 2.2 Her fazın test-first döngüsü

1. Salt-okunur repo reality audit'i kaydet.
2. `test-plan` alt-PR'ında acceptance kriterine bağlı kırmızı test yaz.
3. Testin doğru nedenle kırmızı olduğunu terminal/CI çıktısıyla kanıtla.
4. Minimum implementation alt-PR'ını yaz; spekülatif kapsam ekleme.
5. Targeted testleri, sonra repo regression kapılarını çalıştır.
6. Security negatiflerini ve rollback'i doğrula.
7. İnsan review + CI sonrası merge et.
8. Gerçek PR/commit/CI/staging referanslarını actionplan WBS evidence'ına geri yaz.

Kırmızı test görülmeden production implementation başlatılamaz. Testin import hatası,
yanlış fixture veya ortam eksikliği nedeniyle kırmızı olması kabul edilmez; beklenen
business/contract invariant nedeniyle fail etmelidir.

### 2.3 Branch, PR ve boyut sözleşmesi

- Branch: `task/URLP-XX-<kebab-slug>`.
- Bir faz büyükse alt branch: `task/URLP-XXa-<contract|backend|frontend|migration>`.
- Main/master'a doğrudan push yasaktır.
- Her PR tek amaçlıdır, net değişiklik en çok 400 satır ve en çok 20 dosyadır.
- Limit aşılırsa faz daha küçük PR'lara bölünür; acceptance scope daraltılmaz.
- Her PR açıklaması `allowed-files`, en az bir `non-goal`, AC→test eşlemesi, risk,
  rollback, AI üretim notu ve gerçek evidence bağlantılarını taşır.
- CI/ruleset değişikliği gerektiğinde ayrı, insan-onaylı tooling PR'ı açılır; feature
  PR'ına gizlenmez.

### 2.4 Ortak yasaklar

- Kanonik politikada reddedilen eski kernel adını, birleşik tilde gramerini, private PII
  slug canonical'ını, numeric public ID'yi veya global kaynak-kimliği/slug-index tablosu
  üretmek.
- Component içinde string URL concatenate etmek.
- Host/token/path tenant uyuşmazlığında default tenant'a düşmek.
- Authorization'dan önce private resource varlığını veya canonical hedefini sızdırmak.
- Tenant config'ini çalıştırılabilir Python/JS veya serbest route template'i yapmak.
- GraphQL mutation, webhook, upload veya unsafe method'a SEO canonical redirect vermek.
- Test/PR/CI/staging/Storybook URL'si uydurmak.
- Bir sonraki fazın altyapısını "kolaylık" gerekçesiyle mevcut PR'a taşımak.

### 2.5 Ortak regression komutları

Platform checkout'ta, ilgili paketler mevcut oldukça:

```bash
cd apps/api && uv run --python 3.12 ruff check .
cd apps/api && uv run --python 3.12 pyright
cd apps/api && uv run --python 3.12 pytest -q
pnpm -r --if-present test
pnpm --filter @platform/web build
pnpm --filter @platform/web e2e
```

Bir komut henüz package/script olmadığı için çalışmıyorsa bu pass değildir. İlgili
fazın test-planında script/tooling prerequisite'i açık blocker yapılır ve insan-onaylı
tooling PR'ı ile çözülür.

### 2.6 Evidence ve WBS writeback

Her `URLP-XX` düğümüne yalnız gerçek çıktılar yazılır:

```json
{
  "type": "implementation-pr | ci-run | test-report | staging-smoke | security-drill | storybook-preview | rollback-drill",
  "ref": "gerçek URL veya repository-relative artifact",
  "commit": "tam commit SHA",
  "testCommand": "gerçekte çalıştırılan komut",
  "result": "pass | fail",
  "timestamp": "ISO-8601",
  "reviewer": "insan reviewer kimliği"
}
```

Kurallar:

- Requirements/test-plan aşamasında beklenen evidence yazılır; gerçekleşmiş gibi kayıt
  oluşturulmaz.
- `status=done` yalnız verification geçmiş ve zorunlu evidence doluysa mümkündür.
- Failed evidence silinmez; ardıl başarılı koşuyla birlikte korunur.
- Actionplan writeback ayrı plan-data PR'ıdır; platform runtime PR'ına karıştırılmaz.
- Bir fazın `implementationStatus` değeri, platform branch/PR gerçekliğiyle eşleşir.

### 2.7 Faz Agent Prompt kullanım kuralı

Aşağıdaki promptların tamamı `DIRECTIVE-ONLY`dır. Codex, Claude, Cursor veya başka AI
ajanı bunları hedef platform branch'inde uygulamaz; yalnız `read-only-audit` yaparak insan
geliştiricinin uygulayacağı test-first yönergeye dönüştürür. Branch, commit, PR, ürün kodu,
test, migration veya Storybook/config yalnız insan geliştirici tarafından üretilir. Her
prompt başlamadan önce fazın WBS export'u, insan hedef path'leri ve mevcut repo durumu
eklenir. Placeholder veya bulunmayan path sessizce gerçek kabul edilmez.

---

## 3. URLP-00 — Repo Reality ve Çelişki Temizliği

**Önkoşul:** İnsan onaylı kanonik `docs/url-policy.md`; temiz/izole platform worktree.  
**Kesin çıktı:** Mevcut route/host/tenant/API/router davranışlarının kanıtlı envanteri,
eski URL kararlarının aktif runtime/docs/config içinde bulunmadığını gösteren audit ve
fazlara ait kesin platform ownership haritası.  
**Hedef alan:** Platform kök docs, API/web mevcut entrypoint'leri; salt-okunur audit
script/fixture gerekiyorsa URL policy test alanı.  
**Allowed globs:**

```text
docs/url-policy/**
README.md
.github/workflows/**
apps/api/tests/url_policy/reality/**
apps/web/src/url-policy/**/*.reality.test.ts*
tools/url-policy/audit/**
```  
**Non-goals:** Resolver, DB modeli, middleware, route generator veya UI üretmek.

**Önce kırmızı testler:** Aktif kaynakta kanonik politikada reddedilen birleşik tilde
grameri, eski kernel adı, numeric public canonical veya global identity table önerisi;
React Router import'u; serbest string route concat için negatif fixtures. Audit testinin
bilinen fixture'ı yakaladığı gösterilir.

**Minimum implementation:** Exclusion'ları gerekçeli ve scope'lu olan deterministic
scanner; mevcut endpoint/router snapshot raporu; planned/working ayrımı. Whole-file
muafiyet yoktur.

**Kabul kriterleri:**

- `/graphql`, `/healthz`, `/` mevcut hali evidence ile kaydedilir.
- Planlanan path'ler varmış gibi raporlanmaz.
- Aktif eski karar varsa silme/migration ayrı PR'a bağlanır.
- Her URLP fazı için owner repo ve beklenen path sınıfı belirlenir.

**Güvenlik negatifleri:** Scanner code fence/tarihsel reddiyeyi active karar sanmaz;
gerçek source/config içindeki forbidden pattern'i muaf etmez; secret/env içeriğini rapora
kopyalamaz.

**Komutlar:**

```bash
git status --short
git remote -v
pnpm --filter @platform/web test -- reality
cd apps/api && uv run pytest tests/url_policy/reality
pnpm -r --if-present test
```

**Evidence:** Audit çıktısı, kırmızı→yeşil test run'ları, source inventory commit'i,
insan onaylı gap listesi.  
**Rollback:** Audit tooling/rapor commit'ini revert et; runtime değişmediğini doğrula.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_PLATFORM_WORKTREE_AND_MISSING_REMOTE`; salt-okunur audit tekrarlanabilir, fakat izole branch/PR implementation başlangıcı için worktree sahipliği ve remote/CI baseline çözülmelidir. Runtime implementation yapılmış değildir.

**Agent prompt:**

```text
URLP-00'ı platform reposunda uygula. Önce gerçek endpoint/router/config envanterini
çıkar, sonra eski kararları yakalayan kırmızı fixture testlerini yaz. Runtime davranışı
değiştirme. Whole-file exemption kullanma. Yalnız allowed-files içinde kal; gerçek
komut/commit/CI evidence'ı üret ve actionplan writeback taslağı hazırla.
```

---

## 4. URLP-01 — Platform URL Architecture Profile

**Önkoşul:** URLP-00 verified; kanonik karar/registry drift kontrolü yeşil.  
**Kesin çıktı:** Parse→validate→normalize→resolve→authorize→serialize sırasını ve
surface/reserved namespace/case/trailing-slash/query invariantlarını paylaşan versioned
architecture profile contract'ı.  
**Hedef alan:** Shared URL policy package contract ve backend parity fixture'ları.  
**Allowed globs:**

```text
packages/url-policy/src/profile/**
packages/url-policy/tests/profile/**
packages/url-policy/package.json
apps/api/src/meta_api/url_policy/profile/**
apps/api/tests/url_policy/profile/**
```  
**Non-goals:** Tenant-specific route üretmek; host çözmek; DB persistence.

**Önce kırmızı testler:** Reserved namespace, uppercase policy, trailing slash,
percent-encoding, duplicate/default/empty query ve double-decode vectors; SDK/Python
fixture parity testi.

**Minimum implementation:** Versioned immutable constants + parser/normalizer contract;
tenant override whitelist. Serbest config veya executable transform yoktur.

**Kabul kriterleri:** Aynı golden vector backend ve SDK'da aynı normalized sonucu verir;
unknown profile fail-closed; normalize idempotent; tenant invariant override edemez.

**Güvenlik negatifleri:** `%2F`, `%5C`, `%2E`, `%00`, `%252F`, dot segment, backslash,
oversized URL ve invalid percent sequence reddedilir veya tek normatif sonuca iner.

**Komutlar:**

```bash
pnpm --filter @platform/url-policy test -- profile
pnpm --filter @platform/url-policy typecheck
cd apps/api && uv run pytest tests/url_policy/profile
```

**Evidence:** Golden corpus artifact'i, iki runtime parity raporu, contract PR/CI.  
**Rollback:** Profile version'ını geri alma; yayımlanmış version'ı inplace değiştirmeme.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-00`; bu faz bağımsız
`packages/url-policy` paketinin en küçük workspace scaffold'unu ve profile sözleşmesini
birlikte kurar. Paket kurulumu bu fazın allowed globs sınırları dışına taşamaz.

**Agent prompt:**

```text
URLP-01 için versioned architecture profile contract'ını test-first kur. Canonical
normalization corpus'unu TS ve Python'da aynı sonuçla çalıştır. Tenantın değiştiremeyeceği
invariantları kodla; resolver/DB/UI ekleme. Eksik workspace/package foundation'ını
allowed-files dışına taşırmadan blocker olarak raporla.
```

---

## 5. URLP-02 — Kernel Şemaları ve Contract Parity

**Önkoşul:** URLP-01 verified; shared package/backend contract taşıma yolu onaylı.  
**Kesin çıktı:** `RouteDefinition`, `RouteRef`, `ResourceRef`, `HostBinding`,
`RouteProjection`, `ResolvedLocation`, `SlugProfile`, `RouteAlias`, `FacetDefinition`
için versioned TS/Pydantic şemaları ve parity corpus'u.  
**Hedef alan:** Kernel URL contract paketi + generated/public consumer types.  
**Allowed globs:**

```text
packages/url-policy/src/contracts/**
packages/url-policy/tests/contracts/**
packages/url-policy/src/generated/**
apps/api/src/meta_api/url_policy/contracts/**
apps/api/tests/url_policy/contracts/**
```  
**Non-goals:** Persistence, resolver veya UI; global resource identity tablosu.

**Önce kırmızı testler:** Unknown enum/kind/profile; duplicate route/prefix; invalid typed
ID; reserved path; malformed template; extra fields; TS↔Pydantic golden fixture drift.

**Minimum implementation:** Strict schemas, stable serialization ve explicit schema
version. Generated output source contract'tan türetilir; iki elle yazılmış drift eden
model tutulmaz.

**Kabul kriterleri:** Dokuz contract pozitif/negatif corpus'u paylaşır; unknown alanlar
policy'ye göre reddedilir; schema generation deterministic; registry örnekleri parse olur.

**Güvenlik negatifleri:** Prototype/pollution anahtarları, oversized values, unknown
surface, executable template, prefix spoof ve internal DB ID alanı reddedilir.

**Komutlar:**

```bash
pnpm --filter @platform/url-policy test -- contracts
cd apps/api && uv run pytest tests/url_policy/contracts
git diff --exit-code packages/url-policy/src/generated
```

**Evidence:** Schema corpus, generation diff=0, test/CI ve public API review.  
**Rollback:** Yeni schema version consumer yoksa revert; consumer varsa compatibility
adapter + deprecation, destructive rollback yok.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-01`.

**Agent prompt:**

```text
URLP-02'de dokuz URL contract'ını önce negatif/parity testleriyle tanımla. Pydantic
source ile generated TS çıktısının deterministikliğini kanıtla. Persistence ve resolver
yazma; global identity modeli kurma. Her schema kararını url-policy registry'sine bağla.
```

---

## 6. URLP-03 — Host ve Tenant Resolution

**Önkoşul:** URLP-02 verified; tenant/auth contract owner'ı ve DB foundation hazır.  
**Kesin çıktı:** Trusted-proxy normalization sonrası exact `HostBinding`, host/path/token
tenant agreement ve unknown/mismatch durumunda fail-closed `TenantContext`.  
**Hedef alan:** API kernel middleware/resolver, persistence ve integration tests.  
**Allowed globs:**

```text
apps/api/src/meta_api/url_policy/host/**
apps/api/src/meta_api/url_policy/tenant/**
apps/api/src/meta_api/middleware/**
apps/api/src/meta_api/db/url_policy/**
apps/api/migrations/*url_policy_host*
apps/api/tests/url_policy/host/**
apps/api/tests/url_policy/tenant/**
apps/api/tests/integration/url_policy/**
```  
**Non-goals:** Certificate issuance, login handoff, canonical slug veya frontend route.

**Önce kırmızı testler:** Host A/token B; host A/path B; unknown/deactivated/detached
domain; spoofed forwarded host; Unicode/Punycode mismatch; default tenant fallback;
tenant olmadan cache key.

**Minimum implementation:** Exact host lookup, trusted proxy allowlist, ordered candidate
agreement, typed error ve tenant-context-bound cache namespace. DB migration upgrade ve
downgrade içerir.

**Kabul kriterleri:** Unknown/mismatch hiçbir tenant verisine ulaşmaz; exact binding tek
active tenant verir; lifecycle status uygulanır; resolved tenant olmadan downstream
handler/cache çalışmaz.

**Güvenlik negatifleri:** Host header injection, comma-separated forwarded host,
untrusted proxy, port/case/IDNA confusion, stale binding, cache poisoning ve timing ile
tenant enumeration.

**Komutlar:**

```bash
cd apps/api && uv run pytest tests/url_policy/host tests/url_policy/tenant tests/integration/url_policy
cd apps/api && uv run pyright
```

**Evidence:** Migration upgrade/downgrade, mismatch matrix, cache-key assertion, CI.  
**Rollback:** Middleware feature flag ile shadow/off; migration downgrade yalnız veri
kaybı yoksa; active bindings export edilmeden table drop yok.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-02_AND_DB_TENANT_FOUNDATION`.

**Agent prompt:**

```text
URLP-03 host/tenant resolution'ı fail-closed uygula. Önce cross-tenant ve forwarded-host
negatiflerini kırmızı yaz. Exact HostBinding ve aday agreement dışında fallback üretme.
Certificate/auth/slug kapsamına girme. Migration rollback ve tenant-cache evidence'ı ver.
```

---

## 7. URLP-04 — App/Module Route Registry SDK

**Önkoşul:** URLP-02 verified; URLP-03 TenantContext contract'ı stable.  
**Kesin çıktı:** App/module ownership'li `RouteContribution` registry, collision/reserved
namespace/capability gate ve custom app default mount sözleşmesi.  
**Hedef alan:** Kernel registry + shared package contribution API.  
**Allowed globs:**

```text
packages/url-policy/src/registry/**
packages/url-policy/src/sdk/**
packages/url-policy/tests/registry/**
apps/api/src/meta_api/url_policy/registry/**
apps/api/tests/url_policy/registry/**
```  
**Non-goals:** Runtime app/module üretmek; tenantın RouteDefinition değiştirmesi; UI menu.

**Önce kırmızı testler:** Duplicate route ID; static/dynamic collision; reserved path;
global catch-all; module owner-app dışı mount; capability/access policy eksik; unknown
renderer/version.

**Minimum implementation:** `contributeRoutes()` typed API, deterministic registry
compile, immutable ownership ve startup validation. Capability-disabled route resolve
olmaz.

**Kabul kriterleri:** App namespace ve module ownership kanıtlı; collision CI'ı kırar;
custom app yalnız `/apps/{custom-app-key}` altında; uninstall route'u yanlış kaynağa
yeniden tahsis etmez.

**Güvenlik negatifleri:** Catch-all route hijack, reserved auth/admin takeover, capability
bypass, duplicate-normalized path ve malicious module manifest.

**Komutlar:**

```bash
pnpm --filter @platform/url-policy test -- registry
cd apps/api && uv run pytest tests/url_policy/registry
```

**Evidence:** Collision fixtures, compiled registry snapshot, malicious manifest tests.  
**Rollback:** Contribution version disable/tombstone; eski path başka module'e verilmez.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-02`; URLP-03 interface stable olmalı.

**Agent prompt:**

```text
URLP-04 RouteContribution registry'sini test-first kur. Namespace, ownership,
capability ve collision kurallarını startup/CI'da zorla. App/module scaffold etme ve
catch-all kabul etme. Uninstall/tombstone davranışını negatif testle kanıtla.
```

---

## 8. URLP-05 — Public ID ve Bounded-Context Sahipliği

**Önkoşul:** URLP-02 contracts ve prefix registry verified; bounded-context owner'ları
insan tarafından atanmış.  
**Kesin çıktı:** Her aggregate'in sahip olduğu random 128-bit typed public ID üretimi,
prefix registry ve cross-app `ResourceRef`; internal UUID dışarı sızmaz.  
**Hedef alan:** Shared kernel ID primitive + ilgili bounded-context entegrasyon noktaları.  
**Allowed globs:**

```text
packages/url-policy/src/identity/**
packages/url-policy/tests/identity/**
apps/api/src/meta_api/url_policy/identity/**
apps/api/tests/url_policy/identity/**
```  
**Non-goals:** Merkezi resource tablosu; authorization; bütün domainleri bu fazda migrate.

**Önce kırmızı testler:** Prefix mismatch, düşük entropy/sequential ID, internal UUID
serialization, unknown kind, collision retry, `person=employee=user` varsayımı ve global
identity persistence fixture'ı.

**Minimum implementation:** CSPRNG 128-bit Crockford Base32 codec, typed prefix validator,
per-aggregate unique constraint helper ve `ResourceRef`. Prefix authorization sayılmaz.

**Kabul kriterleri:** `p_ usr_ emp_ org_ co_ inv_ po_ wo_ prd_ lst_ rpt_` üyeleri ayrı
ve unique; entropy/property testi; DB/internal ID API/URL/export'ta yok; same Party farklı
surface'lerde aynı `p_` ref kullanabilir.

**Güvenlik negatifleri:** Guessable timestamp/counter, case/confusable prefix, truncated
entropy, tenant-crossing ref, public ID ile authorization bypass.

**Komutlar:**

```bash
pnpm --filter @platform/url-policy test -- identity
cd apps/api && uv run pytest tests/url_policy/identity
```

**Evidence:** Entropy/property raporu, serialization scan, uniqueness/collision testleri.  
**Rollback:** Codec version korunur; yayımlanmış ID rewrite edilmez; yeni producer feature
flag ile durdurulur.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-02_AND_CONTEXT_OWNERSHIP`.

**Agent prompt:**

```text
URLP-05 typed public ID primitive'ini önce entropy, sızıntı ve tür ayrımı testleriyle
kur. Aggregate sahipliğini koru; global identity table oluşturma. Authorization'ı ID
codec'e gömme. Domain rollout'unu URLP-14'e bırak ve yalnız gerçek evidence bildir.
```

---

## 9. URLP-06 — Slug, Canonical ve Alias Motoru

**Önkoşul:** URLP-01 normalization, URLP-02 contracts, URLP-05 public ID verified;
alias persistence foundation hazır.  
**Kesin çıktı:** ASCII-first ve optional Unicode profilleri, locale/version pinned slug,
canonical comparator, scoped alias history, loop/orphan/tombstone kontrolü.  
**Hedef alan:** Kernel slug/canonical/alias + shared canonical generator.  
**Allowed globs:**

```text
packages/url-policy/src/slug/**
packages/url-policy/src/canonical/**
packages/url-policy/src/alias/**
packages/url-policy/tests/slug/**
packages/url-policy/tests/canonical/**
packages/url-policy/tests/alias/**
apps/api/src/meta_api/url_policy/slug/**
apps/api/src/meta_api/url_policy/canonical/**
apps/api/src/meta_api/url_policy/alias/**
apps/api/src/meta_api/db/url_policy/alias/**
apps/api/migrations/*route_alias*
apps/api/tests/url_policy/slug/**
apps/api/tests/url_policy/canonical/**
apps/api/tests/url_policy/alias/**
```  
**Non-goals:** Public renderer/SEO; arbitrary tenant transliteration code; PII private slug.

**Önce kırmızı testler:** NFC/idempotency, Turkish transliteration golden vectors,
confusables/mixed script, byte budget, old/wrong slug, ASCII+Unicode double-200, alias
loop/chain/orphan/reassignment, private PII slug ve POST redirect.

**Minimum implementation:** Versioned `SlugProfile`, deterministic pipeline, one-hop
canonical target, unique normalized alias ve authorization-aware resolve ordering.

**Kabul kriterleri:** `canonicalize(canonicalize(x))=canonicalize(x)`; public ID resolve
edildikten ve visibility kontrolünden sonra safe GET/HEAD 308; profile upgrade existing
URL'yi otomatik rewrite etmez; alias başka kaynağa verilmez.

**Güvenlik negatifleri:** Bidi/zero-width/confusable, encoded separator, open redirect,
alias auth bypass, private existence leak, long chain DoS ve stale host target.

**Komutlar:**

```bash
pnpm --filter @platform/url-policy test -- slug canonical alias
cd apps/api && uv run pytest tests/url_policy/slug tests/url_policy/canonical tests/url_policy/alias
```

**Evidence:** Unicode/golden corpus, alias migration drill, one-hop redirect matrix,
backend/SDK parity.  
**Rollback:** Canonical profile version geri seçilir; alias history korunur; destructive
alias delete yerine retire/tombstone.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-01_02_05_AND_DB_FOUNDATION`.

**Agent prompt:**

```text
URLP-06 slug/canonical/alias motorunu property ve güvenlik corpus'u önce olacak şekilde
uygula. ASCII-first default'u, Unicode opt-in'i ve one-hop history'yi koru. Private PII
slug, unsafe-method redirect veya arbitrary tenant code ekleme. Profile/alias rollback
drill evidence'ı üret.
```

---

## 10. URLP-07 — FastAPI ve GraphQL Edge Entegrasyonu

**Önkoşul:** URLP-03 resolver, URLP-04 registry ve URLP-06 canonical motoru verified;
auth/capability/PDP contract'ları hazır.  
**Kesin çıktı:** `request-id -> trusted-proxy -> host-binding -> tenant -> auth -> route ->
capability -> PDP -> handler -> response policy` sırasını zorlayan FastAPI edge;
same-origin `/graphql` korunur.  
**Hedef alan:** API app factory, middleware ve integration tests.  
**Allowed globs:**

```text
apps/api/src/meta_api/app.py
apps/api/src/meta_api/middleware/url_policy/**
apps/api/src/meta_api/url_policy/edge/**
apps/api/tests/url_policy/edge/**
apps/api/tests/integration/url_policy/**
```  
**Non-goals:** GraphQL field hiyerarşisini UI path'e eşlemek; developer REST API açmak;
SSO/control-plane UI.

**Önce kırmızı testler:** Middleware order, spoofed proxy/host, host-token mismatch,
unauthorized canonical leak, GraphQL mutation redirect, upload/webhook redirect,
tenant header trust, error envelope tenant disclosure.

**Minimum implementation:** Typed request context, explicit middleware order, safe-method
canonical adapter, trusted proxy allowlist ve response cache/security headers.

**Kabul kriterleri:** `/graphql` same-origin çalışır; mutation redirect almaz; unknown host
fail-closed; authorization canonical target'tan önce; mevcut `/healthz` contract'ı bilinçli
değişiklik yoksa korunur.

**Güvenlik negatifleri:** Host/header injection, tenant confusion, cache poisoning,
method confusion, open redirect, verbose exception ve GraphQL GET cache/index leakage.

**Komutlar:**

```bash
cd apps/api && uv run pytest tests/url_policy/edge tests/integration/url_policy
cd apps/api && uv run pytest tests/test_health.py
cd apps/api && uv run ruff check .
cd apps/api && uv run pyright
```

**Evidence:** Middleware-order assertion, HTTP matrix, GraphQL mutation negative, CI.  
**Rollback:** Edge feature flag/shadow middleware; current `/graphql` ve `/healthz`
smoke'larıyla geri dönüş doğrulanır.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-03_04_06_AND_AUTH_PDP`.

**Agent prompt:**

```text
URLP-07'de FastAPI edge sırasını integration testleriyle kilitle. Canonical redirect'i
yalnız safe method ve authorization sonrasında uygula. GraphQL-first `/graphql` sınırını
ve health contract'ını koru. REST, SSO veya UI kapsamına girme.
```

---

## 11. URLP-08 — TanStack Router ve Typed Navigation

**Önkoşul:** URLP-02 SDK contracts, URLP-04 registry ve URLP-06 generator verified;
URLP-07 edge endpoint contract'ı stable.  
**Kesin çıktı:** Tek `urlFor(RouteRef)`, typed params/search, capability-gated route tree,
loaders/error boundaries ve frontend/backend canonical parity.  
**Hedef alan:** Web URL policy adapter/router ve shared package consumption.  
**Allowed globs:**

```text
apps/web/src/router.tsx
apps/web/src/url-policy/**
apps/web/src/routes/**
apps/web/src/**/*.url-policy.test.ts*
apps/web/e2e/url-policy/**
```  
**Non-goals:** React Router eklemek; public SSR seçmek; tenant control-plane UI; component
içinde string concat.

**Önce kırmızı testler:** Invalid/missing params, normalized search drift, unauthorized
route menu/deep-link, string concat lint/architecture test, wrong canonical, refresh/deep
link, removed module ve expired entitlement.

**Minimum implementation:** SDK-backed `urlFor`, typed route definitions, validated
search schema, route context/loaders ve canonical link adapter. Route masking yalnız UI
state içindir.

**Kabul kriterleri:** Bütün yeni navigation `RouteRef` kullanır; backend/SDK/web golden
vectors eşleşir; capability-disabled route görünmez ve deep-link açılmaz; existing `/`
regression geçer.

**Güvenlik negatifleri:** Client-side auth-only güveni, open redirect search param,
prototype params, malformed encoding, stale entitlement ve route masking identity bypass.

**Komutlar:**

```bash
pnpm --filter @platform/web test -- src/url-policy
pnpm --filter @platform/web build
pnpm --filter @platform/web e2e -- e2e/url-policy
```

**Evidence:** Parity corpus, deep-link E2E, architecture/string-concat gate, build/CI.  
**Rollback:** New route tree/generator feature flag; existing root route smoke; generated
links old/new compare-only log'u.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-02_04_06_07`.

**Agent prompt:**

```text
URLP-08'i gerçek TanStack Router stack'inde test-first uygula. Tek urlFor(RouteRef),
validated search ve capability-gated tree kur. React Router veya string concat ekleme.
Backend/SDK/web parity ve deep-link E2E evidence'ı olmadan tamamlandı deme.
```

---

## 12. URLP-09 — Custom Domain ve TLS Control Plane

**Önkoşul:** URLP-03 HostBinding lifecycle ve URLP-07 edge verified; DNS/ACME provider,
secrets ve operasyon owner'ı insan tarafından seçilmiş.  
**Kesin çıktı:** requested→verified→certificate-pending→active→renewal-warning→suspended→
detached→tombstoned lifecycle; DNS proof, IDNA, global uniqueness, takeover koruması ve
canonical host switch.  
**Hedef alan:** API domain control plane, worker/provider adapter, infra/runbook tests.  
**Allowed globs:**

```text
apps/api/src/meta_api/url_policy/domains/**
apps/api/src/meta_api/url_policy/certificates/**
apps/api/src/meta_api/db/url_policy/domains/**
apps/api/migrations/*host_binding*
apps/api/tests/url_policy/domains/**
apps/api/tests/url_policy/certificates/**
infra/url-policy/domains/**
```  
**Non-goals:** Wildcard `{app}.{customDomain}` otomatik açmak; provider secret'i code'a
yazmak; tenant URL ayar UI'sı.

**Önce kırmızı testler:** Duplicate hostname, stale TXT, takeover after detach/transfer,
invalid Punycode, public suffix confusion, cert issue/renew fail, preview indexability,
canonical switch partial failure.

**Minimum implementation:** Provider interface, verification nonce, state machine,
idempotent jobs, audit trail, exact binding activation ve tombstone grace.

**Kabul kriterleri:** Unverified host trafik almaz; cert active olmadan canonical switch
yok; global hostname unique; detach sonrası takeover blocked; renewal alert/drill var.

**Güvenlik negatifleri:** DNS rebinding, CNAME dangling, IDN homograph, wildcard scope,
secret leakage, replayed proof, domain transfer race ve ACME abuse/rate limit.

**Komutlar:**

```bash
cd apps/api && uv run pytest tests/url_policy/domains tests/url_policy/certificates
cd apps/api && uv run pytest tests/integration/url_policy/test_domain_lifecycle.py
cd infra && ./url-policy/test-acme-lifecycle.sh
```

**Evidence:** Sandbox provider integration, issue/renew/fail drill, takeover test, audit
event ve runbook review.  
**Rollback:** Canonical host önce eski verified binding'e döner; cert/binding tombstone
korunur; DNS instruction ve cache TTL planı uygulanır.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-03_07_AND_PROVIDER_DECISION`.

**Agent prompt:**

```text
URLP-09 custom-domain lifecycle'ını provider-neutral ve test-first kur. DNS proof,
certificate failure ve takeover negatiflerini önce yaz. Verification/cert olmadan active
veya canonical yapma. Secret/gerçek domain evidence'ı uydurma; sandbox drill ve rollback
kanıtı sun.
```

---

## 13. URLP-10 — Session, SSO ve Origin Modeli

**Önkoşul:** URLP-03 tenant resolution, URLP-07 edge, URLP-09 domain lifecycle verified;
auth/session owner'ı ve threat model onaylı.  
**Kesin çıktı:** Tenant-subdomain host-only session, app-subdomain/custom-domain auth
handoff, exact callback registry, OIDC+PKCE, CSRF/SameSite, revocation, rotating refresh
chain ve step-up policy.  
**Hedef alan:** Auth/session kernel + web callback adapter.  
**Allowed globs:**

```text
apps/api/src/meta_api/auth/**
apps/api/src/meta_api/url_policy/origin/**
apps/api/tests/auth/**
apps/web/src/auth/**
apps/web/src/url-policy/origin/**
apps/web/e2e/auth/**
```  
**Non-goals:** Altı ay yaşayan tek bearer token; wildcard callback; cross-domain shared
cookie; IdP seçimini gizlice yapmak.

**Önce kırmızı testler:** Wildcard/open callback, missing PKCE/state/nonce, CSRF,
SameSite downgrade, logout sonrası refresh reuse, host A token B, custom-domain mix-up,
step-up bypass ve stolen refresh replay.

**Minimum implementation:** Exact origin/callback registry, short access token + rotating
refresh family, reuse detection/revocation, one-time signed handoff ve sensitive action
step-up.

**Kabul kriterleri:** Altı aylık kullanıcı deneyimi rotasyonlu zincirle sağlanır; tek
token altı ay yaşamaz; logout/revocation bütün originlerde etkili; app/custom domain
production ancak matrix yeşilse enable edilir.

**Güvenlik negatifleri:** Login CSRF, open redirect, token in URL/Referer, cookie domain
overbreadth, session fixation, refresh race/replay ve callback host injection.

**Komutlar:**

```bash
cd apps/api && uv run pytest tests/auth
pnpm --filter @platform/web test -- src/auth src/url-policy/origin
pnpm --filter @platform/web e2e -- auth
```

**Evidence:** Threat-model review, auth matrix, revocation/replay drill, browser E2E.  
**Rollback:** New origin topology disable; sessions revoke/rotate; host-only suite path'e
geri dön; callback records retire.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-03_07_09_AND_AUTH_FOUNDATION`.

**Agent prompt:**

```text
URLP-10 origin/session modelini threat-model ve kırmızı abuse testleriyle uygula. Exact
callback, PKCE ve rotating refresh chain kullan. Tek 6 aylık token, wildcard callback
ve shared cross-domain cookie üretme. App/custom-domain rollout'u matrix kanıtına bağla.
```

---

## 14. URLP-11 — i18n/L10n Route ve Slug Entegrasyonu

**Önkoşul:** URLP-01 profile, URLP-06 slug/canonical, URLP-08 router verified; supported
locale/content fallback product kararı onaylı.  
**Kesin çıktı:** BCP 47 registry, public `prefix-always`, content/UI/format/route locale
ayrımı, locale-specific canonical/hreflang graph ve version-pinned transform.  
**Hedef alan:** Shared locale resolver, backend canonical locale, web route adapter.  
**Allowed globs:**

```text
packages/url-policy/src/locale/**
packages/url-policy/tests/locale/**
apps/api/src/meta_api/url_policy/locale/**
apps/api/tests/url_policy/locale/**
apps/web/src/url-policy/locale/**
apps/web/src/url-policy/locale/**/*.test.ts*
apps/web/e2e/locale/**
```  
**Non-goals:** Eksik çeviriyi yanlış locale'de sessiz 200 yapmak; UI metinlerini çevirmek;
runtime ICU/CLDR upgrade'ini otomatik URL rewrite yapmak.

**Önce kırmızı testler:** Invalid/deprecated BCP47, default locale prefix eksikliği,
Turkish text'in English slug diye folding'i, missing translation 200, hreflang cycle/orphan,
locale removal ve transform version drift.

**Minimum implementation:** Normalized locale registry, explicit content availability,
prefix resolver, hreflang graph builder ve pinned Unicode/ICU/CLDR metadata.

**Kabul kriterleri:** `/tr` ve `/en` ayrı content varyantı; default public locale prefix
taşır; missing translation policy açık status/redirect verir; workspace UI locale URL
identity'sine karışmaz.

**Güvenlik negatifleri:** Locale path traversal, mixed-script locale/slug, header-driven
cache poisoning, unauthorized translation variant ve hreflang host injection.

**Komutlar:**

```bash
pnpm --filter @platform/url-policy test -- locale
cd apps/api && uv run pytest tests/url_policy/locale
pnpm --filter @platform/web test -- src/url-policy/locale
pnpm --filter @platform/web e2e -- locale
```

**Evidence:** Locale golden graph, missing-translation matrix, version pin manifest,
backend/web parity.  
**Rollback:** Locale projection retire + one-hop redirects; transform version korunur;
old canonical alias history silinmez.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-01_06_08_AND_LOCALE_DECISION`.

**Agent prompt:**

```text
URLP-11 locale routing'i prefix-always ve content availability testleriyle kur. UI,
format, route ve content locale'lerini ayır. İngilizce slug'ı Türkçe folding olarak
üretme. Unicode/ICU version drift ve locale removal rollback'ini kanıtla.
```

---

## 15. URLP-12 — Listing, Facet, Query ve OpenSearch Parity

**Önkoşul:** URLP-02 FacetDefinition, URLP-03 tenant context, URLP-08 validated search ve
URLP-11 locale verified; GraphQL search/OpenSearch foundation mevcut.  
**Kesin çıktı:** Tek normalized facet state'in TanStack Router, TanStack Query key,
GraphQL `SearchInput`, OpenSearch compiler ve canonical URL'yi aynı semantikle beslemesi.  
**Hedef alan:** Shared facet compiler, API search adapter, web search adapter.  
**Allowed globs:**

```text
packages/url-policy/src/facets/**
packages/url-policy/tests/facets/**
apps/api/src/meta_api/search/**
apps/api/tests/search/**
apps/web/src/search/**
apps/web/src/url-policy/facets/**
apps/web/e2e/search/**
```  
**Non-goals:** URL paramını doğrudan OpenSearch field/DSL yapmak; her facet URL'sini SEO
landing sayfası yapmak; tenant filter'ı UI'a bırakmak.

**Önce kırmızı testler:** Repeated-key OR, cross-key AND, stable sort, duplicate/default/
empty cleanup, label-vs-ID drift, mapping version mismatch, mandatory tenant filter
eksikliği, cache-key parity ve query cardinality bomb.

**Minimum implementation:** Versioned facet registry, deterministic normalizer/compiler,
mandatory backend tenant filter ve shared canonical serialization. SEO landing ayrı typed
definition'dır.

**Kabul kriterleri:** Beş consumer aynı golden state/hash'i kullanır; arbitrary field/DSL
injection yok; tenant filter kaldırılamaz; cardinality/crawl budget ölçülür.

**Güvenlik negatifleri:** Cross-tenant search leakage, DSL injection, expensive query
abuse, cache poisoning, hidden unauthorized facet count ve stale index mapping.

**Komutlar:**

```bash
pnpm --filter @platform/url-policy test -- facets
cd apps/api && uv run pytest tests/search
pnpm --filter @platform/web test -- src/search src/url-policy/facets
pnpm --filter @platform/web e2e -- search
```

**Evidence:** Five-way parity corpus, cross-tenant negative, cardinality benchmark,
mapping-version test.  
**Rollback:** New facet registry version disable; previous compiler retained; index/query
mapping birlikte geri alınır.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-02_03_08_11_AND_SEARCH_FOUNDATION`.

**Agent prompt:**

```text
URLP-12'de tek normalized facet state ve five-way parity'yi önce golden/negative testle
kur. URL field'ını OpenSearch DSL yapma; tenant filter backend'de mandatory olsun.
Cardinality ve cross-tenant evidence olmadan fazı kapatma.
```

---

## 16. URLP-13 — Public Renderer ve SEO

**Önkoşul:** URLP-06 canonical, URLP-08 router, URLP-11 locale ve URLP-12 search verified;
SSR veya deterministic prerender yaklaşımı insan tarafından seçilmiş.  
**Kesin çıktı:** Server-readable public page, doğru HTTP status, canonical/hreflang,
sitemap, robots, JSON-LD, preview noindex ve soft-404/crawl-budget kontrolü.  
**Hedef alan:** Web public renderer/build pipeline ve API render data contract.  
**Allowed globs:**

```text
apps/web/src/public/**
apps/web/src/seo/**
apps/web/src/routes/public/**
apps/web/e2e/seo/**
apps/web/vite.config.ts
apps/web/package.json
```  
**Non-goals:** Mevcut Vite SPA'yı evidence olmadan SEO-ready saymak; bütün facets'i
indexlemek; custom host'u canonical doğrulaması olmadan kullanmak.

**Önce kırmızı testler:** JS kapalı content, wrong status/soft-404, duplicate canonical,
hreflang mismatch, preview index, custom-host drift, sitemap unauthorized/deleted item,
facet crawl explosion ve JSON-LD URL mismatch.

**Minimum implementation:** Seçilmiş tek renderer adapter, server status/meta üretimi,
typed sitemap/robots/JSON-LD ve host/locale canonical integration.

**Kabul kriterleri:** HTML response'ta içerik ve doğru status vardır; bir sayfada tek
canonical; custom domain active binding'den gelir; preview noindex; deleted policy 404/410;
sitemap/canonical parity.

**Güvenlik negatifleri:** SEO metadata injection, private listing index/sitemap leak,
host-header canonical poisoning, JSON-LD XSS ve cache vary omission.

**Komutlar:**

```bash
pnpm --filter @platform/web test -- seo
pnpm --filter @platform/web build
pnpm --filter @platform/web e2e -- seo
```

**Evidence:** Rendered HTML artifact, status/meta E2E, sitemap audit, Lighthouse/SEO review
ve custom-domain staging smoke.  
**Rollback:** Renderer/canonical switch feature flag; previous public renderer; sitemap
publication stop ve CDN purge runbook.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-06_08_11_12_AND_RENDERER_DECISION`.

**Agent prompt:**

```text
URLP-13 için SSR veya deterministic prerender kararını teyit et, sonra server-readable
content ve status testlerini kırmızı yaz. SPA smoke'u SEO evidence sayma. Canonical,
hreflang, sitemap, preview noindex ve private leak negatiflerini gerçek render ile kanıtla.
```

---

## 17. URLP-14 — App ve Doğa-Metaforu Entegrasyon Dalgaları

**Önkoşul:** URLP-04 registry, URLP-05 IDs, URLP-07 edge, URLP-08 navigation ve ilgili
domain bounded context mevcut; her dalga için insan kapsam onayı.  
**Kesin çıktı:** Party/person→CRM→HRMS→ERP/finance→MRP→e-commerce admin→public storefront→
marketplace listing→custom apps→third-party modules sırasıyla manifest/route/capability/
access/URL profile entegrasyonu; Ada→Atom yükümlülükleri traceable.  
**Hedef alan:** İlgili domain API/web packages; her dalga ayrı PR/release train.  
**Allowed globs:**

```text
apps/api/src/meta_api/apps/**/routes/**
apps/api/tests/apps/**/routes/**
apps/web/src/apps/**/routes/**
apps/web/e2e/apps/**/routes/**
```  
**Non-goals:** Olmayan app/module scaffold etmek; on dalgayı tek PR'a almak; kernel
contract'ı domain PR'ında değiştirmek.

**Önce kırmızı testler:** Her dalga için canonical private/public örnek, capability/PDP,
cross-app `ResourceRef`, removed module/deep-link, internal ID/PII leak ve route ownership.

**Minimum implementation:** Yalnız mevcut bounded context'in manifest/contribution ve
typed navigation adaptasyonu. Ada namespace/mount; Dağ contribution; Kaya kind/exposure;
Taş use-case route; Kum `RouteRef`; Molekül resolver behavior; Atom negatif invariant.

**Kabul kriterleri:** Dalga sırası/bağımlılık korunur; her context registry'de sahipli;
private person ID-only; direct cross-context JOIN/import yok; uninstall URL'yi başka
resource'a taşımaz; dalga-specific E2E yeşil.

**Güvenlik negatifleri:** Cross-app authorization bypass, shared Party data overexposure,
module route hijack, PII slug/log, missing entitlement ve stale deep-link.

**Komutlar:**

```bash
cd apps/api && uv run pytest tests/apps/routes
pnpm --filter @platform/web test -- app-routes
pnpm --filter @platform/web e2e -- app-routes
```

**Evidence:** Her dalga için ayrı PR/CI, route inventory diff, access matrix, E2E ve
actionplan roll-up.  
**Rollback:** Yalnız ilgili contribution/feature flag retire edilir; kernel ve önceki
dalga korunur; URL'ler tombstone/redirect policy'ye göre kalır.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-04_05_07_08_AND_DOMAIN_EXISTENCE`; app/module
üretme yetkisi bu belgeyle verilmez.

**Agent prompt:**

```text
URLP-14'ü tek bir onaylı domain dalgasında uygula. Önce o context'in route/access/PII/
uninstall testlerini yaz. Ortak kernel'i değiştirme, olmayan app/module üretme, dalga
sırasını atlama. Ada'dan Atom'a sorumluluğu ref ile taşı ve gerçek E2E evidence'ı yaz.
```

---

## 18. URLP-15 — Tenant URL Yönetim Surface'i ve Storybook

**Önkoşul:** URLP-08 typed navigation, URLP-09 domain lifecycle, URLP-11 locale ve URLP-13
SEO verified; tenant policy mutation API/PDP hazır; Storybook gerçekliği yeniden audit
edilmiş.  
**Kesin çıktı:** Domain, app mount, site-level ASCII/Unicode profile, Unicode alias,
locale, vanity alias, SEO landing ve migration preview için approval-gated yönetim
Surface'i; tüm reusable UI Master Component ve Storybook sözleşmesine bağlıdır.  
**Hedef alan:** Web tenant admin Surface, shared UI master components, stories ve API
control-plane mutations.  
**Allowed globs:**

```text
apps/api/src/meta_api/url_policy/control_plane/**
apps/api/tests/url_policy/control_plane/**
apps/web/src/apps/admin/url-policy/**
apps/web/src/**/*.url-policy.stories.tsx
apps/web/e2e/url-policy/control-plane/**
packages/ui/src/components/url-policy/**
packages/ui/src/components/url-policy/**/*.stories.tsx
packages/ui/.storybook/**
packages/ui/package.json
```  
**Non-goals:** Storybook'u yalnız galeri yapmak; backend-only parçaya sahte story;
tenantın RouteDefinition/encoding/auth sırası/reserved path değiştirmesi; preview olmadan
activate.

**Önce kırmızı testler:** UI başlamadan Master/local kararı ve story matrix review;
component interaction/a11y tests; permission-denied, loading, empty, collision, partial
certificate, migration diff, approval, rollback ve concurrent edit stories; unauthorized
mutation E2E.

**Minimum implementation:** `draft -> validate -> collision-report -> redirect-plan ->
preview -> approve -> activate -> monitor -> finalize` state UI; typed API; Master
Component'ler için gerçek export tüketen stories; local karmaşık state için consumer story.

**Zorunlu Storybook matrisi:**

- Default, loading, empty, error, permission denied ve readonly.
- Invalid domain/IDNA, verification pending/failed, certificate warning/failed.
- Mount/alias collision, locale removal, ASCII↔Unicode migration preview.
- Keyboard-only, visible focus, axe, 44px target, Roboto ≥300 ve taban ≥1rem.
- Representative viewport/locale/theme; data-dense listte large fixture/performance state.
- Interaction testleri approve/activate ayrımını ve step-up gereğini doğrular.

**Kabul kriterleri:** UI etkili her component `uiDelivery`/story/test/evidence bağı taşır;
Storybook build/test/axe/visual yeşil; published preview insan review alır; permission/PDP
serverda zorlanır; approval ve migration olmadan activate mümkün değildir.

**Güvenlik negatifleri:** Hidden control ile privilege escalation, stale preview approve,
CSRF, IDOR, domain takeover UI race, secret/token story fixture'a sızması, unsafe HTML/
hostname render ve cached admin data cross-tenant leak.

**Komutlar:**

```bash
cd apps/api && uv run pytest tests/url_policy/control_plane
pnpm --filter @platform/ui storybook:build
pnpm --filter @platform/ui storybook:test -- url-policy
pnpm --filter @platform/ui storybook:a11y -- url-policy
pnpm --filter @platform/ui test -- url-policy
pnpm --filter @platform/web test -- url-policy-admin
pnpm --filter @platform/web e2e -- url-policy-control-plane
```

Bu script'ler platformda henüz yoksa pass sayılmaz; Storybook foundation/tooling ayrı,
test-first ve insan-onaylı küçük PR ile kurulmadan UI development başlamaz.

**Evidence:** Storybook preview URL, story interaction/axe/visual sonuçları, insan review,
API/PDP testleri, browser E2E ve activation/rollback drill.  
**Rollback:** Policy version rollback preview üzerinden; UI feature flag; activation geri
alındığında redirect/alias history korunur; Storybook baseline bilinçli approve edilir.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-08_09_11_13_AUTH_PDP_AND_STORYBOOK_AUDIT`.

**Agent prompt:**

```text
URLP-15 tenant URL control plane'i Storybook-first uygula. Önce Master/local kararını,
story matrix'i ve başarısız interaction/a11y testlerini review'a sun. Gerçek component
export'u tüketen stories, typed API ve approval-gated activation kur. Storybook mevcut
değilse varmış gibi URL/evidence yazma; foundation blocker'ını ayrı PR ile çöz.
```

---

## 19. URLP-16 — Fuzz, Migration, Canary ve Retirement

**Önkoşul:** URLP-00–15 gerekli topolojilerde verified; observability, rollback owner ve
canary tenant onayı mevcut.  
**Kesin çıktı:** Edge/proxy/FastAPI/shared package/TanStack differential fuzz; shadow resolution,
compare-only, dual generation/read, internal canary, selected tenant, public canonical
switch, monitoring ve eski policy retirement.  
**Hedef alan:** Cross-package fuzz/conformance, migration tooling, observability/runbooks.  
**Allowed globs:**

```text
packages/url-policy/tests/fuzz/**
apps/api/tests/url_policy/fuzz/**
apps/web/src/url-policy/**/*.fuzz.test.ts
apps/web/e2e/url-policy/rollout/**
tools/url-policy/**
infra/url-policy/observability/**
.github/workflows/url-policy.yml
docs/url-policy/runbooks/**
```  
**Non-goals:** Big-bang switch; fuzz failure ignorelist'i gerekçesiz büyütmek; old alias/
tombstone history'yi silmek; kanıtsız maturity ilanı.

**Önce kırmızı testler:** Tüm güvenlik corpus'u, parser differential, host/tenant/cache
matrix, alias cycle/orphan, locale/facet cardinality, detached domain, cert failure,
removed module, entitlement loss, service-worker scope ve backup-restore drift.

**Minimum implementation:** Reproducible seeded fuzz harness, normalized differential
oracle, shadow compare telemetry, policy-versioned cache keys, kill switch ve staged
rollout controller/runbook.

**Kabul kriterleri:** Parserlar aynı normatif sonucu verir veya request fail-closed;
cross-tenant leak 0; compare mismatch bütçesi sıfıra iner; canary rollback drill geçer;
old policy ancak traffic/alias/consumer inventory sıfırlandıktan sonra retire edilir.

**Güvenlik negatifleri:** `%2F`, `%5C`, `%2E`, `%00`, `%252F`, fullwidth slash,
backslash, dot segments, bidi, zero-width, confusables, invalid Punycode, oversized URL,
host spoof, cache poisoning, open redirect, double decode ve PII Referer/log leakage.

**Komutlar:**

```bash
pnpm --filter @platform/url-policy test -- fuzz
cd apps/api && uv run pytest tests/url_policy/fuzz
pnpm --filter @platform/web test -- url-policy/fuzz
pnpm --filter @platform/web e2e -- url-policy-rollout
pnpm url-policy:maturity-gate
```

**Evidence:** Seed/corpus artifact, differential report, shadow/canary dashboards, mismatch
zero report, rollback drill, retirement approval ve post-switch monitoring window.  
**Rollback:** Kill switch → previous canonical generator/profile → CDN/cache purge → alias
one-hop restore → affected tenant notification; data-destructive rollback yok.  
**Başlangıç durumu/blocker:** `BLOCKED_BY_URLP-00_TO_15`; yalnız canary/ops evidence ile
development'tan rollout'a geçer.

**Agent prompt:**

```text
URLP-16'yı big-bang yapma. Önce seeded differential fuzz ve failure fixtures yaz; sonra
shadow, compare-only, dual generation/read ve canary sırasını uygula. Her aşamada kill
switch/rollback drill ve telemetry evidence'ı üret. Mismatch veya cross-tenant risk varken
canonical switch/retirement yapma.
```

---

## 20. Program-level WBS ve durum kuralları

Her faz için tek üst WBS düğümü ve gerektiğinde test-plan/development/test-qa Atomları
bulunur. Önerilen ID'ler değişmez:

```text
URLP-00  reality-audit
URLP-01  architecture-profile
URLP-02  kernel-contracts
URLP-03  host-tenant-resolution
URLP-04  route-registry-sdk
URLP-05  public-id-bounded-context
URLP-06  slug-canonical-alias
URLP-07  fastapi-graphql-edge
URLP-08  tanstack-router
URLP-09  custom-domain-tls
URLP-10  session-sso-origin
URLP-11  locale-routing
URLP-12  facet-search-parity
URLP-13  public-renderer-seo
URLP-14  app-integration-waves
URLP-15  tenant-control-plane
URLP-16  fuzz-migration-rollout
```

Durum semantiği:

- `planned`: Bu directive/registry var; runtime çalışma başlamadı.
- `ready`: Önkoşul, owner, allowed-files, AC, risk, test command ve rollback dolu.
- `in-progress`: Platform branch/PR vardır; test-first evidence bağlıdır.
- `blocked`: Somut prerequisite/decision/external state eksiktir.
- `verified`: PR merge + CI + faza özgü verification evidence tamamdır.
- `done`: Release-maintenance ve WBS evidence writeback tamamdır.

Belge veya schema varlığı `implemented`, `verified` veya `done` üretmez.

---

## 21. Program maturity exit kapısı

Program yalnız aşağıdakilerin tamamı gerçek evidence ile karşılandığında biter:

- URL üreten tek kernel/SDK yolu vardır; string concat gate'i yeşildir.
- Backend, SDK, web, sitemap ve export canonical parity kanıtlıdır.
- Unknown host, host/token/path mismatch ve tenantless cache fail-closed'dur.
- Private PII canonical URL, logs, analytics ve Referer'da yoktur.
- Random typed public ID ve bounded-context sahipliği uygulanmıştır.
- Public locale `prefix-always`; onboarding default ASCII-first; Unicode alias opt-in'dir.
- Alias/redirect one-hop, loop/orphan/tombstone ve unsafe-method kuralları çalışır.
- Route ownership/capability/PDP/module isolation CI ve E2E ile korunur.
- Custom-domain verification/certificate/takeover/transfer/renewal lifecycle'ı drill
  edilmiştir.
- Session/SSO origin matrix, revocation, PKCE, CSRF ve step-up testleri geçmiştir.
- Facet state Router/Query/GraphQL/OpenSearch/canonical parity'sine ve mandatory tenant
  filter'a sahiptir.
- Public renderer doğru status/content/canonical/hreflang/sitemap/robots/JSON-LD üretir.
- URLP-14 domain dalgaları kendi evidence'ıyla tamamlanmıştır; olmayan app/module için
  sahte completion yoktur.
- URLP-15 Storybook build/test/axe/visual, preview ve insan review evidence'ı taşır.
- Tüm desteklenen topolojilerde cross-tenant negatif E2E vardır.
- Differential fuzz, shadow, canary ve rollback drill yeşildir.
- Eski policy consumer/traffic inventory sıfır ve retirement insan onaylıdır.
- Her URLP WBS düğümünde gerçek PR/CI/test/staging/drill evidence writeback'i vardır.

Bu koşullardan biri eksikse doğru ifade şudur:

```text
URL policy sözleşmesi/handoff'u hazır; runtime maturity implementation tamamlanmadı.
```

"Bitti", "tam implementasyon" veya "maturity-level hazır" denemez.

---

## 22. Son handoff kontrol listesi

Implementation operatörü her faz başlangıcında şu listeyi kopyalar ve doldurur:

```text
[ ] Doğru URLP fazı ve predecessor evidence doğrulandı.
[ ] Platform worktree/branch temiz ve task/URLP-XX-* dalında.
[ ] Allowed-files ve non-goal PR brief'inde.
[ ] Current repo paths salt-okunur doğrulandı; hayali path yok.
[ ] Kırmızı test doğru invariant nedeniyle fail etti.
[ ] Minimum implementation yalnız faz kapsamına girdi.
[ ] Targeted + regression + security negatifleri geçti.
[ ] Rollback veya failure drill çalıştırıldı.
[ ] PR/CI/staging/Storybook referansları gerçek ve erişilebilir.
[ ] İnsan review kaydı var.
[ ] Actionplan WBS evidence writeback PR'ı hazırlandı.
[ ] Sonraki faz, mevcut faz verified olmadan development'a alınmadı.
```
