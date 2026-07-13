# Metaframer URL Policy — Maturity-Level Kanonik Sözleşme ve Implementation Programı

**Sürüm:** 2.1.0  
**Tarih:** 2026-07-13  
**Durum:** Kanonik; ürün-katmanı URL mimarisinin tek otoritesi  
**Kapsam:** Metaframer ile üretilen private workspace, public site, admin/control-plane, GraphQL, developer API, webhook, asset, auth callback ve custom-domain yüzeyleri  
**Kardeş belge:** `docs/node.md` yalnız actionplan/planlama-katmanı kayıt terminolojisini tanımlar; ürün URL kuralları bu belgede yaşar  
**Implementation sınırı:** Bu repo plan, sözleşme, schema/gate önerisi ve handoff üretir. AI platformu yalnız `read-only-audit` eder; çalışan kernel/SDK/app kodunu faz sırasına göre yalnız insan geliştirici yazar (`human-developer-only`). Kanonik yasak: `docs/platform-product-code-write-prohibition-directive.md`.

**URLP-M1 durumu:** **Tamamlandı.** Makine-okunur tek kaynak `src/data/url-policy/registry.json`, Zod sözleşmesi `src/schemas/url-policy-registry.ts`, mühendislik standardı `src/data/standards/url-policy.json` ve bütün WBS/content düğümlerinin merkezi bağı `standardRefs.urlPolicyRef = "url-policy"` olarak kilitlidir. Bu tamamlanma actionplan sözleşme/registry katmanına aittir; platform runtime fazları §15 uyarınca hâlâ evidence-temelli ilerler.

**URLP execution handoff durumu:** **Tamamlandı (actionplan).** Faz 0–16'nın makine programı `src/data/url-policy/implementation-program.json`, Zod sözleşmesi `src/schemas/url-policy-implementation-program.ts`, execution directive'i `docs/url-policy-implementation-directive.md`, WBS atomları `urlp-00`–`urlp-16` ve bloklayıcı kapısı `qa:url-policy-implementation`dır. Bu kayıtlar implementation'ı yürütülebilir yapar; gerçek platform runtime'ı yalnız her fazın PR/CI/test/staging/drill evidence'ı ile `verified` olabilir.

---

## 0. Hüküm — tek URL şekli değil, tek URL politika çekirdeği

Metaframer bütün yüzeylere tek path kalıbı zorlamaz. Bunun yerine tek bir politika çekirdeği, yüzeye ve veri sınıfına göre birden fazla kanonik URL profili üretir:

```text
k-route-policy
├── Host Binding Resolver
├── Tenant Context Resolver
├── Route Registry
├── Route Projection Engine
├── Canonical URL Generator
├── Slug Profile Registry
├── Alias/Redirect Resolver
├── Locale Route Resolver
├── Facet URL Normalizer
└── Authorization Adapter
```

`k-route-policy` kaynak kimliklerinin sahibi DEĞİLDİR. Person, invoice, listing, product gibi aggregate'lar `public_id` değerlerini kendi bounded context'lerinde üretir ve saklar. URL çekirdeği yalnız tipli `ResourceRef` tüketir. Bütün entity'leri tek `resource_identity` tablosunda birleştirmek YASAKTIR.

### 0.1 Makine-okunur otorite zinciri

```text
docs/url-policy.md
  -> src/data/standards/url-policy.json
  -> src/data/url-policy/registry.json
  -> src/data/url-policy/implementation-program.json
  -> docs/url-policy-implementation-directive.md
  -> src/schemas/url-policy-registry.ts
  -> standardRefs.urlPolicyRef
  -> qa:url-policy
```

Markdown normatif gerekçeyi, standart dosyası uygulanabilir kuralları, registry kesin değer/FK'ları, Zod şekli ve CI ise drift korumasını taşır. Aynı karar ikinci bir JSON veya app-local config içinde yeniden tanımlanamaz.

URL çekirdeğinin ortak TypeScript runtime hedefi `packages/url-policy` ve paket adı
`@platform/url-policy`dır. Bu hedef, genel platform geliştirici SDK'sı olarak planlanan
`packages/sdk` / `@platform/sdk`nin yerine geçmez. Genel SDK URL primitive'lerini bu
paketten tüketir; URL contract'ını, normalizer'ı veya canonical generator'ı ikinci kez
uygulayamaz.

### 0.2 Kilitli varsayılanlar

```text
Workspace topology : https://{tenant}.metaframer.net/{app}/...
Private PII detail : /{app}/{collection}/{typedId}
Private search     : /{app}/{collection}?q=<validated-query>
Public detail      : /{locale}/{mount?}/{collection}/{typedId}/{asciiSlug}
Browser GraphQL    : POST /graphql
Machine reference : { kind, publicId }
Internal DB id     : UUIDv7; dışarı çıkmaz
Public id          : type prefix + random 128-bit Crockford Base32
Public locale      : prefix-always; varsayılan dil dahil
Public slug        : ASCII-first; site bazlı; tenant ilk publish'te onaylar
Unicode alias      : tenant opt-in; 308 ile ASCII canonical'a gider
```

### 0.3 Değişmezler

1. Sıralı numeric ID hiçbir public URL, API veya machine ref'te kullanılmaz.
2. URL'deki kimlik `typedId`dir; slug veya insan adı kimlik değildir.
3. Private PII canonical URL'sine kişi adı, e-posta, telefon, kimlik numarası veya başka PII girmez.
4. Tenant route'un anlamını değiştiremez; yalnız doğrulanmış host/mount/locale/slug projeksiyonunu seçebilir.
5. App ve module doğrudan path string'i kaydetmez; sahipli `RouteContribution` sunar.
6. Route, menu ve Surface görünürlüğü capability + entitlement + PDP kararından sonra oluşur.
7. Alias yetkiyi bypass edemez; resource resolution ile authorization aynı tenant bağlamını kullanır.
8. ASCII ve Unicode biçimlerden yalnız biri canonical olabilir; ikisi birlikte 200 dönmez.
9. GraphQL mutation, webhook, upload ve başka unsafe method'lar SEO canonical redirect zincirine sokulmaz.
10. URL üreten frontend, backend, sitemap, e-posta, QR ve export aynı route registry/policy sürümünü tüketir.

---

## 1. Repo gerçekliği ve hedef durum

Bu sözleşme hedef mimaridir; çalışan implementation kanıtı değildir.

2026-07-13 platform gerçekliği:

- Frontend React 19 + **TanStack Router 1.x** kullanır; React Router değildir.
- Frontend route ağacında yalnız `/` vardır.
- Backend FastAPI + Strawberry GraphQL'dir.
- Backend yalnız `/graphql` ve `/healthz` sunar; GraphQL şeması yalnız `ping` taşır.
- Tenant middleware, HostBinding, app/module registry, URL generator, alias resolver, i18n runtime, TanStack Query, OpenSearch, listing, custom-domain ve SSR/prerender implementation'ı yoktur.

Bu nedenle belgede üç durum açık ayrılır:

```text
WORKING   çalışan kod + test/evidence mevcut
PLANNED   bu sözleşmede kilitli, implementation bekliyor
PROPOSED  insan kararı veya ayrı ADR bekliyor
```

Bu belgedeki URL mimarisi `PLANNED` durumundadır. Fazların exit evidence'ı oluşmadan `WORKING` yazılamaz.

---

## 2. Standart profili ve normatif dil

Tek bir “ideal URL standardı” yoktur. Metaframer URL Architecture Profile aşağıdaki standartların birleşimidir:

| Katman | Dayanak | Metaframer'daki işlevi |
|---|---|---|
| URI syntax | [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html) | Bileşenler, reserved karakterler, percent-encoding |
| URI ownership | [RFC 8820 / BCP 190](https://www.rfc-editor.org/rfc/rfc8820.html) | Route alanının platform sahibi tarafından yönetimi |
| URI templates | [RFC 6570](https://www.rfc-editor.org/rfc/rfc6570.html) | Makine-okunur route template yaklaşımı |
| Browser URL | [WHATWG URL](https://url.spec.whatwg.org/) | Parse/serialize ve host davranışı |
| IRI | [RFC 3987](https://www.rfc-editor.org/rfc/rfc3987.html) | Unicode path/IRI sınırı |
| Unicode normalization | [UAX #15](https://www.unicode.org/reports/tr15/) | NFC |
| Unicode güvenliği | [UTS #39](https://www.unicode.org/reports/tr39/) | Confusable/mixed-script/default-ignorable denetimi |
| IDN | [UTS #46](https://www.unicode.org/reports/tr46/) + IDNA2008 | Unicode domain → ASCII host işlemi |
| Locale | BCP 47 / RFC 5646 + RFC 4647 | Dil etiketi ve seçim/fallback |
| HTTP/redirect | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) | 300/301/307/308/404/410 semantiği |
| Cookie | [RFC 6265](https://www.rfc-editor.org/rfc/rfc6265.html) | Host/domain/path cookie sınırı |
| Custom-domain TLS | [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555.html) | ACME ownership/certificate lifecycle |
| Frontend routing | [TanStack Router](https://tanstack.com/router/latest/docs/framework/react/start/overview) | Typed path/search params, loaders, navigation |
| Backend edge | [FastAPI proxy guide](https://fastapi.tiangolo.com/advanced/behind-a-proxy/) | Trusted forwarded headers ve `root_path` |
| Public SEO | Google Search canonical/hreflang/faceted-navigation rehberleri | Indexability ve crawl-budget |
| Faceted search | [OpenSearch faceted search](https://docs.opensearch.org/latest/tutorials/faceted-search/) | Keyword aggregation ve facet semantics |

Belgede `MUST/MUST NOT`, `SHOULD/SHOULD NOT`, `MAY` RFC 2119 anlamında kullanılır. Standartlar syntax ve protokol davranışını verir; ASCII-first, `prefix-always`, app mount ve reserved namespace kararları Metaframer kurum profilidir.

---

## 3. Terminoloji ve kimlik katmanları

### 3.1 Kimlik dörtlüsü

| Katman | Örnek | Değişir mi? | Sahibi |
|---|---|---:|---|
| `dbId` | internal UUIDv7 | Hayır | Bounded context DB |
| `publicId` | `p_7JQ4R8M2...` | Hayır | Bounded context |
| `slug` | `kirmizi-calisma-masasi` | Evet | Route projection |
| `ResourceRef` | `{kind:"person", publicId:"p_..."}` | Hayır | Kernel protokolü |

Kurallar:

- `dbId` DB/FK içindir; URL/API/export/log paylaşımına sızmaz.
- `dbId` index locality için UUIDv7 olabilir.
- `publicId` prefix + random 128-bit Crockford Base32 gövdesidir; zaman bilgisi sızdırmaz.
- Prefix tür sinyalidir, permission değildir.
- Kısa ikinci discriminator varsayılan değildir; iki paralel public kimlik yolu açılmaz.
- Slug kaynak kimliğini değiştirmez.

### 3.2 İlk prefix ailesi

```text
p_      person/party
usr_    user/login identity
emp_    employment
org_    organization
co_     company/customer organization projection
inv_    invoice
po_     purchase order
wo_     work order
prd_    product
lst_    listing
rpt_    published report artifact
```

Prefix registry global tekildir. Aynı prefix ikinci resource kind'a atanamaz; kaldırılan prefix tombstone olarak saklanır.

### 3.3 Party ve app projection

Person/Party bir kez tanımlanır. App segmenti kimliği değil Surface bağlamını seçer:

```text
/hrms/people/p_7JQ4R8M2
/crm/contacts/p_7JQ4R8M2
```

Aynı `p_` kaydı iki app'te farklı alan, action ve permission projection'ıyla gösterilebilir. Employment ayrı kayıttır:

```text
/hrms/employees/emp_91KX2P
```

`person = employee = user` birleştirmesi yasaktır.

---

## 4. Surface sınıfları ve URL profilleri

### 4.1 Surface taksonomisi

| Surface | Örnek | Renderer | Index |
|---|---|---|---|
| `workspace` | tenant CRM/HRMS/ERP | SPA | noindex |
| `admin` | tenant/platform control-plane | SPA | noindex |
| `public` | mağaza, marketplace, CMS | SSR/prerender | policy-based |
| `graphql` | browser/internal data | API | noindex |
| `developer-api` | dış API | API | noindex |
| `webhook` | provider callback | API | noindex |
| `asset` | CDN/media | static | asset policy |
| `auth-callback` | OIDC/OAuth dönüşü | API/redirect | noindex |

Surface'i bilinmeyen route register edilemez.

### 4.2 Private workspace — restricted/PII

Kanonik:

```text
/{app}/{collection}/{typedId}
/hrms/people/p_7JQ4R8M2
/crm/contacts/p_7JQ4R8M2
```

Arama:

```text
/hrms/people?q=ahmet+kara
```

Davranış:

- Kişi adı canonical path'te yoktur.
- Ayrı `/people/ahmet-kara` lookup route'u yoktur.
- Query external input olarak TanStack Router schema'sında doğrulanır.
- Arama sonucu tenant + PDP/ReBAC/ABAC filtresinden sonra oluşur.
- Aynı isimli kişiler UI'da ayırt edici, yetkiyle görünür alanlarla listelenebilir.
- Sonuç href'i daima ID-only canonical'dır.
- `Cache-Control: private, no-store` ve `X-Robots-Tag: noindex, nofollow` varsayılandır.
- URL/access log'da display name tutulmaz.

### 4.3 Private workspace — URL-safe business record

Yalnız `urlExposure = internal-readable` ve slug kaynağı `privacyClass = public|internal-safe` ise:

```text
/{app}/{collection}/{typedId}/{slugOrBusinessCode}
/erp/invoices/inv_7H2K9M/2026-000184
/mrp/work-orders/wo_1X2A7B/metal-kasa-uretimi
```

Slug dekoratiftir. Yanlış slug, authorization sonrasında doğru canonical'a 308 olabilir. Sınıflandırılmamış resource varsayılan olarak `restricted` kabul edilir ve ID-only kullanır.

### 4.4 Public/indexlenebilir record

Kanonik:

```text
/{locale}/{mount?}/{collection}/{typedId}/{slug}
/tr/ilan/lst_8X3F4Q/3-1-daire-kadikoy
/tr/urun/prd_2M4Z7N/kirmizi-calisma-masasi
/en/product/prd_2M4Z7N/red-work-desk
```

Kurallar:

- Locale varsayılan dil dahil her zaman bulunur.
- `typedId` kimliktir; slug dekoratiftir.
- Resolver ID'yi slug'dan önce ve bağımsız çözer.
- Yanlış/eski slug görünür kayda çözülürse 308 ile güncel canonical'a gider.
- Her locale ayrı content varyantıdır; İngilizce slug Türkçe slug'ın ASCII-fold edilmiş biçimi değildir.
- Her locale sayfası self-canonical + tüm yayınlanmış varyantlara hreflang taşır.
- Eksik çeviri başka locale path'i altında sessiz 200 dönmez.

### 4.5 Public vanity page

Az sayıda yönetilen CMS/landing route'u slug-only olabilir:

```text
/tr/hakkimizda
/tr/iletisim
```

Arkasında stable page ID bulunur. Vanity path reserved namespace/collision gate'inden geçer; alias identity değildir.

### 4.6 API ve operasyon yüzeyi

```text
POST /graphql
GET  /healthz
GET  /.well-known/...
POST /webhooks/{provider}/{version}
```

- Browser GraphQL workspace hostunda same-origin çalışır.
- UI resource hierarchy GraphQL field hierarchy'yi belirlemez.
- Developer REST API yalnız ayrıca sözleşme/ADR ile eklenirse `/api/v1/...` altında yaşar.
- GraphQL query/mutation slug kabul etmez; typed public ID/ResourceRef kullanır.

---

## 5. Tenant, host ve multi-app topolojisi

### 5.1 Varsayılan: tenant-subdomain + suite-path

```text
https://acme.metaframer.net/crm/...
https://acme.metaframer.net/hrms/...
https://acme.metaframer.net/erp/...
```

Bu varsayılan aynı tenantın app'lerini tek origin altında tutar; cookie/CORS/CSP, Odoo-benzeri app geçişi ve ortak shell daha basittir.

### 5.2 Desteklenen projeksiyonlar

| Mod | Örnek | Varsayılan kullanım |
|---|---|---|
| tenant-subdomain suite | `acme.metaframer.net/crm` | Production default |
| tenant-path | `app.metaframer.net/t/acme/crm` | Dev/preview/on-prem fallback |
| tenant custom-domain suite | `panel.acme.com/crm` | White-label workspace |
| app-subdomain | `crm.acme.metaframer.net` | Zoho mode, opt-in |
| app-specific custom-domain | `crm.acme.com` | Exact verified binding |
| public custom-domain | `www.acme.com/tr/...` | Public canonical site |

Her hostname ayrı HostBinding kaydıdır. `{app}.{customDomain}` wildcard olarak otomatik açılmaz. Tenant/app/host adayları uyuşmazsa fail-closed olur.

### 5.3 Custom app ve module

Custom app varsayılan mount:

```text
/apps/{custom-app-key}
```

Module yalnız sahip app namespace'i altında katkı sunabilir:

```text
/crm/reports
/erp/e-invoice
```

Module şu namespace'leri alamaz:

```text
/*
/{anything}
/api
/graphql
/auth
/admin
/assets
/static
/webhooks
/.well-known
/apps
/t
```

### 5.4 Single-tenant ve multi-tenant

- Single-tenant deploy HostBinding'i tek tenant'a sabitler; `default tenant` kod fallback'i kullanmaz.
- Multi-tenant request HostBinding/session/path adaylarını çapraz doğrular.
- Aynı binary/deploy her iki modu destekleyebilir; isolation policy deployment manifestinde açık seçilir.

---

## 6. Route ve host sözleşmeleri

### 6.1 RouteDefinition

```ts
interface RouteDefinition {
  routeId: string;
  ownerApp: string;
  ownerModule?: string;
  surface:
    | "public"
    | "workspace"
    | "admin"
    | "graphql"
    | "developer-api"
    | "webhook"
    | "asset"
    | "auth-callback";
  pathTemplate: string;
  paramsSchemaRef: string;
  querySchemaRef?: string;
  requiredCapability?: string;
  accessPolicyRef: string;
  indexabilityPolicyRef: string;
  cachePolicyRef: string;
  renderer: "spa" | "ssr" | "prerender" | "api";
  version: number;
}
```

Tenant RouteDefinition değiştiremez.

### 6.2 RouteContribution

App/module serbest `register_routes(app)` ile path eklemez:

```python
def contribute_routes(self) -> list[RouteContribution]:
    ...
```

Registry katkıyı ownership, capability, reserved segment, static/dynamic collision, access policy ve version açısından doğruladıktan sonra FastAPI/TanStack projeksiyonlarını üretir.

### 6.3 HostBinding

```ts
interface HostBinding {
  bindingId: string;
  hostnameAscii: string;
  hostnameUnicode?: string;
  tenantId?: string;
  appId?: string;
  surface: RouteSurface;
  mode:
    | "platform-shared"
    | "tenant-subdomain"
    | "tenant-path"
    | "app-subdomain"
    | "custom-domain";
  canonical: boolean;
  verificationStatus: "pending" | "verified" | "failed";
  certificateStatus:
    | "not-required"
    | "pending"
    | "active"
    | "renewal-warning"
    | "failed";
  lifecycleStatus:
    | "draft"
    | "active"
    | "suspended"
    | "detached"
    | "tombstoned";
}
```

### 6.4 RouteProjection

```ts
interface RouteProjection {
  routeId: string;
  hostBindingId: string;
  appMount?: string;
  collectionAlias?: string;
  localeMode: "none" | "prefix-always";
  canonicalSlugProfileRef?: string;
  unicodeAliasEnabled: boolean;
  canonical: boolean;
  migrationState:
    | "stable"
    | "draft"
    | "migration-pending"
    | "dual-read"
    | "retiring";
}
```

### 6.5 ResourceRef ve ResolvedLocation

```ts
interface ResourceRef {
  kind: string;
  publicId: string;
}

interface ResolvedLocation {
  tenantId: string;
  appId?: string;
  routeId: string;
  surface: RouteSurface;
  locale?: string;
  resourceRef?: ResourceRef;
  canonicalUrl: string;
  redirect?: RedirectDecision;
}
```

---

## 7. Slug, Unicode ve transliteration

### 7.1 Site-level seçim

Public slug policy doğrulanmış public site/HostBinding bazında seçilir. Collection veya kayıt bazında canonical profile seçilemez.

Onboarding'de `public-ascii-v1` önseçilidir. Tenant ilk production publish'te seçimi açıkça onaylar. Tenant publish öncesi `public-unicode-v1` seçebilir. Publish sonrası değişim migration programıdır.

### 7.2 ASCII-first canonical

```text
Kaynak:    Kırmızı Çalışma Masası
Canonical: /tr/urun/prd_2M4Z7N/kirmizi-calisma-masasi
```

Transliteration evrensel değildir; locale+version ile saklanır:

```text
tr-ascii-v1
ru-latn-platform-v1
ja-latn-platform-v1
ar-latn-platform-v1
```

Tenant kendi Python/JS transformunu çalıştıramaz.

### 7.3 Unicode canonical seçeneği

```text
/tr/urun/prd_2M4Z7N/kırmızı-çalışma-masası
/ja/product/prd_91JQ2P/赤い作業机
```

NFC + UTS #39 profile zorunludur. Unicode path ile Unicode domain aynı işlem değildir: domain IDNA/UTS #46, path UTF-8/WHATWG/IRI ile işlenir.

### 7.4 Unicode alias opt-in

ASCII canonical sitede tenant açarsa:

```text
/tr/urun/prd_2M4Z7N/kırmızı-çalışma-masası
  → 308
/tr/urun/prd_2M4Z7N/kirmizi-calisma-masasi
```

Alias kapalıysa Unicode varyant üretilmez. Alias açmak canonical profile'ı değiştirmez.

### 7.5 SlugProfile

```ts
interface SlugProfile {
  id: string;
  version: number;
  mode: "ascii" | "unicode";
  normalization: "NFC";
  sourceLocaleRequired: boolean;
  separator: "-";
  maxSerializedBytes: number;
  transliterationProfileRefs: Record<string, string>;
  unicodeSecurityProfileRef: string;
}
```

Slug karakter sayısıyla değil serialize edilmiş byte bütçesiyle sınırlandırılır. Transform/Unicode/ICU/CLDR sürümü değişince mevcut slug otomatik yeniden üretilmez.

---

## 8. Alias, redirect ve deletion

### 8.1 Merkezi alias kaydı

```text
route_alias
────────────────────────────
tenant_id
host_binding_id
locale
normalized_path
route_id
resource_kind
resource_public_id
alias_kind
redirect_status
canonical_target
created_at
retired_at
```

`alias_kind`:

```text
historical-slug
manual-vanity
unicode-alias
migrated-host
migrated-mount
tombstone
```

Unique constraint:

```text
UNIQUE(host_binding_id, locale, normalized_path)
```

### 8.2 Redirect kararı

- Public GET/HEAD eski slug/host/mount: 308.
- Geçici locale/root yönlendirmesi: 302/307 policy'ye göre.
- Unsafe method: otomatik SEO redirect yok; doğru endpoint veya açık hata.
- Resolver zinciri tek atlamaya normalize edilir.
- Döngü gate'i bloklayıcıdır.
- Alias başka resource'a yeniden tahsis edilmez.
- Silinen public resource policy'ye göre 404 veya 410 verir; legal hold/soft-delete doğrudan public görünürlüğü belirlemez.

### 8.3 Canonical host

Aynı public içerik platform domaini ve custom domainde iki 200 üretmez. Bir HostBinding canonical'dır; diğerleri 308 veya preview/noindex verir.

---

## 9. Request resolution ve güven sınırı

### 9.1 Resolution sırası

```text
1. Raw URL parse
2. Scheme/host/port canonicalization
3. Trusted proxy doğrulaması
4. Exact HostBinding çözümü
5. Tenant candidate çözümü
6. Session/token tenant claim cross-check
7. Tenant-path candidate cross-check (yalnız ilgili mode)
8. Surface belirleme
9. Locale çözümü
10. RouteDefinition eşleştirme
11. Capability/entitlement
12. PDP/ReBAC/ABAC
13. Typed params + search validation
14. Resource resolution
15. Canonical URL kararı
16. Redirect/render/API kararı
17. Tenant-safe cache/log/audit
```

### 9.2 FastAPI middleware sırası

```text
request-id
→ trusted-proxy
→ host-binding
→ tenant-context
→ authentication
→ route-context
→ capability
→ PDP
→ GraphQL/handler
→ cache/security/canonical headers
```

Forwarded headers yalnız allowlist proxylerden kabul edilir. `X-Forwarded-Host` ve tenant header internet girdisi olarak güvenilir değildir. `root_path` yalnız gerçek stripped-prefix topolojisinde kullanılır.

### 9.3 Cookie ve SSO

- Varsayılan tenant-subdomain suite-path host-only session kullanır.
- Geniş `.metaframer.net` session cookie varsayılan değildir.
- App-subdomain ve custom-domain farklı originlerdir.
- Central auth `auth.metaframer.net`, exact callback registry, OIDC/OAuth + PKCE kullanır.
- Custom domain platform cookie'sini paylaşmaz; kısa ömürlü auth code ile kendi host-only sessionını kurar.
- Wildcard redirect URI yasaktır.
- 6 aylık oturum, tek uzun token değil rotating refresh-chain + revocation + hassas işlem step-up modelidir.

---

## 10. i18n/L10n route politikası

Dört locale kavramı ayrıdır:

```text
uiLocale
contentLocale
formattingLocale
routeLocale
```

Workspace:

- Route locale taşımaz.
- UI locale çözüm sırası: user preference → tenant default → Accept-Language → system default.
- Para, vergi, jurisdiction ve timezone locale'den türetilmez.

Public:

- Route locale `prefix-always`dır.
- BCP 47 internal değeridir; URL serializer lowercase presentation kullanabilir.
- Her yayınlanmış locale varyantı self-canonical + reciprocal hreflang taşır.
- Locale kaldırma redirect/sitemap/hreflang migration'ı ister.

---

## 11. Listing, facets, TanStack Query ve OpenSearch

### 11.1 Facet URL

```text
/tr/ilanlar?city=istanbul&room=3-1&room=4-1&sort=price-asc
```

Kilitli semantik:

- Aynı facet key değerleri OR.
- Farklı facet key'ler AND.
- Çoklu değer repeated-key ile serialize edilir.
- Key ve value sırası canonical olarak normalize edilir.
- Duplicate/default/empty değerler çıkarılır.
- URL UI label değil stable facet ID taşır.
- URL alanı doğrudan OpenSearch field veya DSL'e çevrilmez.

### 11.2 FacetDefinition

```ts
interface FacetDefinition {
  facetId: string;
  urlKey: string;
  valueType: string;
  operators: string[];
  multiValue: boolean;
  searchField: string;
  visibilityPolicyRef: string;
  seoEligibility: "never" | "approved-landing-only";
  version: number;
}
```

Tek normalized state şunları besler:

```text
TanStack Router search
TanStack Query cache key
GraphQL SearchInput
OpenSearch request compiler
Canonical URL
```

Beş ayrı normalizer yazılması yasaktır.

### 11.3 Facet SEO

Rastgele facet kombinasyonları indexlenmez. SEO değeri olan kombinasyon ayrı `LandingPageDefinition` olarak onaylanır:

```text
/tr/istanbul/satilik/3-1-daireler
```

Landing'in kendi stable ID'si, canonical, content, sitemap ve lifecycle'ı vardır. Dynamic filter URL'leri varsayılan noindex/crawl policy'sine tabidir.

---

## 12. Tenant özelleştirme sınırı

### 12.1 Tenant yönetebilir

- Doğrulanmış custom domain.
- App'in doğrulanmış host üzerindeki mount projection'ı.
- Public site locale listesi ve default locale.
- Site-level ASCII veya Unicode canonical slug profile.
- ASCII site için Unicode alias opt-in.
- Manual vanity alias.
- Onaylı SEO landing pages.
- Facet label/sıra/görünürlük policy'si; operator anlamı değil.

### 12.2 Tenant yönetemez

- Route ID ve route param/query semantiği.
- Percent-encoding/Unicode normalization.
- Reserved namespaces.
- Host verification/certificate gereksinimi.
- Tenant resolution/authorization sırası.
- API/GraphQL identity semantiği.
- Facet AND/OR ve OpenSearch DSL.
- Minimum security/rate-limit sınırları.
- Arbitrary transliteration kodu.
- PII'yi slug token'a açmak.

### 12.3 Policy değişiklik workflow'u

```text
draft
→ validate
→ collision report
→ redirect plan
→ preview
→ approve
→ activate
→ monitor
→ finalize
```

Canonical host, locale mode, app mount veya slug profile değişikliği normal “Save” değildir; migration kaydıdır.

---

## 13. Custom-domain control plane

Lifecycle:

```text
requested
→ dns-verification-pending
→ verified
→ certificate-pending
→ active
→ renewal-warning
→ suspended
→ detached
→ tombstoned
```

Zorunlu davranış:

- TXT/CNAME ownership proof.
- UTS #46/IDNA normalize edilmiş ASCII hostname.
- Global exact-host uniqueness.
- ACME issuance ve renewal.
- Host allowlist.
- Canonical host switch planı.
- OAuth callback allowlist güncellemesi.
- Domain transfer/deletion audit'i.
- Detached domain için takeover grace/tombstone.
- Preview host `noindex`.
- Wildcard/custom-app subdomain ayrı doğrulama ve sertifika yetkisi olmadan açılmaz.

---

## 14. App, module, Surface ve doğa metaforları

| Seviye | URL sorumluluğu |
|---|---|
| Ada / `app` | Stable app key, default mount, domain-binding capability, route namespace |
| Dağ / `module` | Sahip app altında RouteContribution; global root alamaz |
| Kaya / `archetype` | Resource kind, public-ID policy, URL exposure, slug/privacy profile |
| Taş / `feature` | Use-case route, capability, access, cache ve indexability |
| Kum / `component` | Yalnız tipli RouteRef; string URL concat yok |
| Molekül / `work_unit` | Tek resolver/generator/alias/facet davranışı + test paketi |
| Atom / `micro_step` | Tek parser/normalizer/collision/negative-test invariantı |

Surface contract aşağıdaki bağları taşır:

```text
routeRef
surfaceClass
renderer
accessPolicyRef
cachePolicyRef
indexabilityPolicyRef
localePolicyRef
```

App manifest aşağıdakileri beyan eder:

```text
routes_contributed[]
public_mounts[]
reserved_subnamespaces[]
domain_binding_capabilities[]
url_policy_range
slug_profiles_supported[]
```

---

## 15. Çok fazlı implementation programı

Her faz ayrı küçük PR/agent pack/evidence üretir. Sonraki faz, öncekinin gate'i geçmeden başlamaz.

Bu bölüm karar sırasının özetidir. Bağlayıcı execution alanları, exact allowed-files,
non-goals, kırmızı testler, komutlar, security negatifleri, evidence, rollback ve agent
stop koşulları `src/data/url-policy/implementation-program.json` içindedir; insan-okur
uygulama kartları `docs/url-policy-implementation-directive.md` içindedir. Her fazın WBS
atomu aynı sıra numarasıyla `urlp-00`–`urlp-16` olarak yaşar.

### Faz 0 — Repo gerçekliği ve yanlış varsayımlar

- React Router referanslarını TanStack Router gerçekliğiyle düzelt.
- WORKING/PLANNED/PROPOSED ayrımı.
- GraphQL-first/opsiyonel REST sınırı.
- Tek-formül, merkezi resource identity ve private PII slug anti-patternlerini kaldır.

**Exit:** Tek kanonik doküman; kanıtsız implementation iddiası yok.

### Faz 1 — URL Architecture Profile

- Normatif standart yığını.
- Surface/reserved namespace/case/trailing slash/query kuralları.
- Parse → validate → normalize → resolve → authorize → serialize sırası.

**Exit:** Tenantın değiştirebildiği/değiştiremediği alanlar makine-okunur taslakta.

### Faz 2 — Kernel şemaları ve kırmızı testler

- RouteDefinition, RouteRef, ResourceRef, HostBinding, RouteProjection, ResolvedLocation, SlugProfile, RouteAlias, FacetDefinition.
- Duplicate/unknown/collision schema testleri önce kırmızı.

**Exit:** JSON/Zod/Pydantic schema parity ve ilk contract test paketi.

### Faz 3 — Host/Tenant resolution

- Exact host, tenant-subdomain, tenant-path ve custom-domain çözümü.
- Token/session/path/host tenant agreement.
- Unknown host fail-closed.

**Exit:** Cross-tenant negatif testler ve tenant-aware cache key evidence.

### Faz 4 — App/Module Route Registry SDK

- RouteContribution API.
- Namespace, capability, reserved route ve collision gate.
- Custom app/module mount kuralları.

**Exit:** Capability olmadan route/menu görünmez; catch-all contribution reddedilir.

### Faz 5 — Public ID ve bounded context

- Prefix registry.
- Random typed public ID.
- ResourceRef.
- Party/person/employee/user ayrımı.

**Exit:** Internal ID sızıntı testi ve cross-app direct-import/JOIN yasağı.

### Faz 6 — Slug/Canonical/Alias

- ASCII-first + Unicode option/alias.
- NFC/UTS39/locale-versioned transliteration.
- Alias/loop/tombstone/byte-budget.

**Exit:** Idempotency/property/golden vector testleri.

### Faz 7 — FastAPI/GraphQL edge

- Trusted proxy, HostBinding, tenant, auth, capability, PDP middleware sırası.
- Same-origin `/graphql`.
- Unsafe-method redirect yasağı.

**Exit:** Spoofed host/forwarded header/tenant mismatch integration tests.

### Faz 8 — TanStack Router

- Tek `urlFor(RouteRef)`.
- Typed path/search params ve loaders.
- Capability-gated route tree.
- String URL concat lint.

**Exit:** Frontend/backend canonical parity ve deep-link E2E.

### Faz 9 — Custom domain/TLS

- DNS proof, IDNA, ACME, renewal, takeover, canonical switch.

**Exit:** Domain lifecycle ve failure-drill evidence.

### Faz 10 — Session/SSO/origin

- Host-only cookie, app-subdomain/custom-domain handoff, OIDC/PKCE exact callbacks.
- Rotating refresh-chain ve step-up.

**Exit:** CSRF, callback abuse, logout/revocation ve cross-origin testleri.

### Faz 11 — i18n/L10n

- BCP47, prefix-always, hreflang, content/UI/format/route locale ayrımı.
- Slug transform version pinning.

**Exit:** Locale graph, missing translation ve migration testleri.

### Faz 12 — Listing/facet/search

- Facet registry ve tek normalizer.
- TanStack Query/GraphQL/OpenSearch parity.
- Tenant mandatory filter ve mapping version.

**Exit:** Cross-tenant search leakage 0; facet cardinality budget.

### Faz 13 — Public renderer/SEO

- SSR veya deterministic prerender kararı ve implementation'ı.
- Status, canonical, hreflang, sitemap, robots, JSON-LD, soft-404.

**Exit:** Server-readable public page ve custom-domain SEO evidence.

### Faz 14 — App entegrasyon dalgaları

Sıra:

1. Party/person
2. CRM
3. HRMS
4. ERP/finance
5. MRP
6. E-commerce admin
7. Public storefront
8. Marketplace listing
9. Custom apps
10. Third-party modules

**Exit:** Her app manifest/route/capability/access/URL profile beyanı tamam.

### Faz 15 — Tenant URL control plane

- Domain, mount, locale, slug profile, Unicode alias, vanity, SEO landing ve migration preview UI.

**Exit:** Policy değişikliği approval/migration olmadan activate edilemiyor.

### Faz 16 — Fuzz, migration ve rollout

- Edge/proxy/router differential fuzz.
- Shadow/dual-read/canary/canonical switch/retirement.

**Exit:** Maturity exit kriterleri §18'i karşılar.

---

## 16. Test matrisi

### 16.1 Unit/property

- URL parse/serialize idempotency.
- Slug canonicalization idempotency.
- ASCII transliteration golden vectors.
- Unicode NFC/UTS39 vectors.
- Typed public ID entropy/prefix.
- Route collision/reserved namespace.
- Alias loop/tombstone.
- Facet normalization.
- Locale/host normalization.

### 16.2 Güvenlik korpusu

```text
%2F
%5C
%2E
%00
%252F
fullwidth slash
reverse solidus
dot segments
bidi controls
zero-width/default-ignorable
Latin/Cyrillic/Greek confusables
invalid punycode
oversized serialized URL
```

### 16.3 Integration

- Host → tenant → route → resource.
- Host/token/path tenant mismatch.
- Capability-disabled route.
- PDP-filtered private search.
- GraphQL same-origin.
- Custom-domain verification/certificate.
- Public canonical redirect.
- Private ID-only PII route.
- Public typedId/ASCII slug.
- Unicode alias opt-in.
- Cross-app Party navigation.
- Router search → Query key → GraphQL → OpenSearch parity.

### 16.4 E2E topology

```text
tenant-subdomain + suite-path
tenant-path
tenant custom-domain + suite-path
app-subdomain
app-specific custom-domain
single tenant
multi tenant
```

---

## 17. Unknown unknowns ve zorunlu risk kayıtları

- Detached custom domainin DNS CNAME'inin kalması.
- Domainin üçüncü kişiye devrinden sonra eski tenant binding'i.
- Wildcard DNS/certificate yetki sınırı.
- Public suffix/eTLD+1 yanlış hesabı.
- OAuth callback wildcard veya host injection.
- Referer/history/analytics üzerinden PII veya signed-token sızıntısı.
- Service worker'ın yanlış origin/path scope'u.
- App/module uninstall sonrası deep-link davranışı.
- Entitlement kaybı sonrası route tombstone.
- Locale kaldırma sonrası hreflang/canonical drift.
- Slug profile/Unicode/ICU upgrade sonrası collision.
- OpenSearch mapping ile facet registry drift'i.
- Search query'de zorunlu tenant filter unutulması.
- CDN/internal cache key'de tenant/locale/auth/policy-version eksikliği.
- Preview domainin indexlenmesi.
- Platform/custom-domain çift canonical.
- Alias authorization bypass.
- 308'in POST/upload/webhook'a uygulanması.
- Edge ve app'in encoded slash/double-decode farkı.
- GraphQL GET query'lerinin cache/index yüzeyine açılması.
- Mobile universal/app links.
- E-posta/QR/webhook'ta eski hostların kalması.
- Backup restore sonrası binding/certificate drift'i.
- Legal hold kaydının 404/410 davranışı.

Her risk owner, detection signal, test/drill ve rollback/containment taşımadan “kapsandı” sayılmaz.

---

## 18. Maturity exit kriterleri

URL sistemi ancak aşağıdaki koşulların tamamında maturity-level kabul edilir:

- URL üreten tek kernel/SDK yolu vardır.
- Frontend/backend/sitemap/export canonical parity kanıtlıdır.
- Unknown host ve tenant mismatch fail-closed'dur.
- Private PII canonical URL'de ve URL logunda yoktur.
- Public locale prefix-always çalışır.
- Public onboarding default ASCII-firsttir; site-level seçim kayıtlıdır.
- Unicode alias yalnız tenant opt-in'dir.
- Route ownership/capability/module isolation CI ile korunur.
- Custom-domain verification/certificate/takeover lifecycle'ı tamamdır.
- GraphQL-first sınırı korunur.
- Facet cardinality/crawl budget ölçülür.
- Alias orphan/loop/tombstone metrikleri izlenir.
- App/module uninstall eski URL'yi başka resource'a yönlendirmez.
- Policy değişikliği preview + collision + migration + approval olmadan aktive edilemez.
- Edge/proxy/FastAPI/TanStack differential fuzz paketi yeşildir.
- Her topoloji için cross-tenant negatif E2E kanıtı vardır.

---

## 19. AI directive ve insan implementation çalışma sözleşmesi

1. AI faz atlamaz; insanın yazacağı kırmızı test/contract, implementation ve evidence sırasını directive'te tanımlar.
2. AI platform runtime kodu yazmaz; yalnız actionplan içinde `DIRECTIVE-ONLY` agent pack/handoff üretir.
3. İnsan geliştirici `platform` implementation'ında tek PR'a bütün motoru sıkıştırmaz.
4. Mevcut çalışan `/`, `/graphql`, `/healthz` davranışını evidence olmadan değiştirme.
5. React Router API'si kullanma; gerçek stack TanStack Router'dır.
6. Serbest path concat, app-başına URL generator veya module catch-all üretme.
7. Global `resource_identity` tablosu kurma; bounded-context public ID sahipliğini koru.
8. Private PII slug'ı “insan okunabilirlik” gerekçesiyle geri getirme.
9. Tenant config'i router/compiler koduna dönüştürme; yalnız tipli RouteProjection üret.
10. İnsan kaynaklı exit evidence yoksa status'u WORKING/verified yapma.

Bu sözleşmeyle çelişen eski `slug~typedId`, private isim-disambiguation route'u, merkezi resource identity veya `k-route-identity` ifadeleri tarihsel taslak kabul edilir; kanonik karar bu belgedir. <!-- url-policy-exempt: tarihsel reddiye — geçersiz kılınan eski kararlar alıntı olarak geçer -->
