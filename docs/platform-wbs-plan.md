# Platform Build-Out — WBS Düğüm Ağacı Spec

**Tarih:** 2026-06-28
**Durum:** Taslak (Prompt 4 çıktısı)
**Kapsam:** Bu doküman ayrı bir repo veya uygulama değildir. actionplan'ın JSON-as-DB veri modeline eklenecek TaskNode düğümlerinin spec'idir. Kod değiştirilmez; uygulama Prompt 4-impl adımında yapılır.

---

## 1. Amaç ve Kapsam

Platform build-out, 50+ enterprise uygulamanın üretileceği tenant-aware bir uygulama fabrikasıdır. Tek bir monolitik geliştirme değil; her tenant'a izole veritabanı şeması, RBAC katmanı, GraphQL sözleşmesi ve ayrı dağıtım hedefi sağlayan çok-kiracılı bir altyapıdır.

Bu spec'in amacı: söz konusu fabrikayı, actionplan'ın 7-seviyeli WBS hiyerarşisine (app → module → archetype → stone → molecule → element → atom) ve 7 waterfall fazına (requirements → test-plan → db-schema → development → test-qa → verification → release-maintenance) birebir uyan görev düğümleri olarak tanımlamaktır.

**Neden dikey dilim önce gelir:** Platform tamamlanmadan hiçbir tenant uygulaması üretime geçemez; ancak tüm platformu tek seferde teslim etmek de pratik değildir. Dikey dilim (vertical slice), seçilen bir örnek modül (Customer) üzerinden tüm katmanları — DB şeması, migration, GraphQL, React UI, seed veri, observability — production-grade biçimde gösterir ve kalan modüller için tekrarlanabilir bir kalıp (pattern) oluşturur.

**Teknoloji kararları (onaylı):**

- Backend: FastAPI + Strawberry GraphQL + PostgreSQL
- ORM: SQLAlchemy 2.0 / SQLModel; migration: Alembic
- Frontend: React + Vite + TanStack Router + TanStack Query
- Paketleme/CI: GitHub Actions, Docker, Docker Compose
- Hedef sunucu: Hetzner + Debian Linux + AMD EPYC
- Yasaklar: Next.js yasak, Supabase yasak, Prisma yasak (Python-native ORM tercih)

---

## 2. Şema Referansı

Aşağıdaki spec, `src/schemas/task.ts` (schemaVersion 1.0.0) ile birebir uyumludur. Alan adları, enum değerleri ve tip kısıtlamalar o dosyadan türetilmiştir. Uydurma alan yoktur.

**Kullanılan level enum değerleri:** app, module, archetype, stone, molecule, element, atom

**Kullanılan phase enum değerleri:** requirements, test-plan, db-schema, development, test-qa, verification, release-maintenance

**Kullanılan status enum değerleri:** backlog, todo, in-progress, blocked, review, done

**Kullanılan priority enum değerleri:** low, medium, high, critical

**Kullanılan state (maturity) enum değerleri:** taslak, aday, incelemede, dogrulanmis

**Kullanılan source.corpus enum değerleri:** content-source, oldatas, merged, synthetic

**effort.unit enum değerleri:** sp, h, d

---

## 3. Onaylanan WBS Kodu Aralığı

Mevcut app-level düğümlerde wbsCode 1–27 aralığı kullanılmaktadır (en yüksek: app-data-intelligence = 27). Platform kümesi için **wbsCode 30** rezerve edilir. Bu sayı mevcut hiçbir düğümle çakışmaz ve ileride 28, 29 aralığına başka kümeler eklenebilir.

---

## 4. Test-Önce Tasarım İlkesi

Bu spec, her ana düğüm için waterfall faz sırasını zorunlu olarak test planından başlatır. Geliştirme adımlarına geçmeden önce aşağıdaki test katmanlarının planlanmış olması kabul kriteridir:

1. **Unit testler** — servis katmanı, ORM modelleri, Pydantic şema doğrulama
2. **API/integration testler** — GraphQL resolver'ları, mutation'lar, PostgreSQL RLS davranışı
3. **Frontend smoke testleri** — React bileşen render, TanStack Query cache geçerliliği
4. **E2E testler** — Playwright ile tenant oturumu açma → veri yazma → çapraz tenant erişim reddi akışı
5. **A11y testleri** — axe-core ile WCAG 2.2 AAA ihlal sayısı = 0

Test döngüsü kuralı: başarısız test en fazla 6 kez yeniden çalıştırılır; 6'da da geçmezse human review görevi oluşturulur (ECA maxChainDepth = 6).

---

## 5. WBS Düğüm Ağacı

Aşağıda her düğüm için alan değerleri, spec notları ve izlenebilirlik bağları verilmektedir. Boyutlar (dimensions) ve ECA kuralları bu spec'te iskelet (skeleton) olarak bırakılmıştır; Prompt 4-impl'de swarm tarafından doldurulacaktır.

---

### 5.1 Kök Düğüm — app seviyesi

**Düğüm: platform-factory**

```
id:          platform-factory
wbsCode:     30
level:       app
title:       Platform Fabrikası
slug:        platform-factory
summary:     50+ enterprise uygulamanın üretileceği tenant-aware uygulama fabrikası.
             FastAPI + GraphQL + PostgreSQL (SQLAlchemy 2.0 / SQLModel / Alembic) backend;
             React + Vite + TanStack Router/Query frontend. Her tenant izole schema, RBAC
             ve dağıtım hedefi alır.
parentId:    null
order:       30
tags:        ["platform", "app", "fabrika", "multi-tenant", "enterprise"]
criticalPath: true
status:      backlog
priority:    critical
phase:       requirements
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["app-kernel", "app-layer1"]
blocks:      []   (fabrika tamamlanınca diğer app üretimleri açılır; bu bağ Prompt 4-impl'de doldurulur)
related:     ["app-backend", "app-platform-horizontal"]
effort:
  estimate:  240
  unit:      sp
  spent:     0
schedule:
  start:     null
  end:       null
  actualStart: null
  actualEnd:  null
source:
  corpus:    synthetic
  originalId: ""
  granularity: dag
  cluster:   platform
```

**phases — platform-factory:**

| Faz                  | status  | Temel kriterler (criteria)                                                                          |
|----------------------|---------|-----------------------------------------------------------------------------------------------------|
| requirements         | active  | Tenant izolasyon stratejisi ve RBAC kapsamı paydaş onayı; kabul kriterleri taslağı                 |
| test-plan            | pending | Unit/API/e2e/a11y test stratejisi onaylandı; tenant sızıntı test senaryoları yazıldı               |
| db-schema            | pending | PostgreSQL tenant şema kararı (schema-per-tenant vs row-level-security) kesinleşti; Alembic kurulu |
| development          | pending | Dikey dilim (Customer modülü) uçtan uca çalışır; lint ve tip kapıları yeşil                        |
| test-qa              | pending | E2e + axe AAA 0 ihlal; cross-tenant negatif testleri geçti                                         |
| verification         | pending | OWASP A01/A07 incelemesi tamamlandı; GraphQL depth/complexity limiti doğrulandı                    |
| release-maintenance  | pending | CI/CD pipeline devrede; Hetzner deploy runbook + geri-alma prosedürü doğrulandı                   |

**deliverables:**
- Platform Fabrikası v1 üretim ortamı
- Tenant onboarding runbook
- Dikey dilim (Customer) referans uygulaması
- CI/CD pipeline + deployment prosedürü

**acceptanceCriteria:**
- Her tenant yalnızca kendi verisini okuyabilir (RLS veya schema-per-tenant kanıtı)
- GraphQL N+1 sorunu DataLoader ile çözülmüş (integration test kanıtı)
- WCAG 2.2 AAA axe-core 0 ihlal
- Alembic down migration çalışır; smoke test geçer
- p95 API yanıt süresi < 200 ms (seed veri ile yük testi kanıtı)

**risks:**
```
id: r-platform-factory-1
desc: "Çok-kiracılıkta veri sızıntısı — tenant_id filtresi eksik sorgu"
severity: critical
mitigation: "PostgreSQL RLS politikaları + integration testlerinde cross-tenant negatif assert"

id: r-platform-factory-2
desc: "Alembic migration geri-alma başarısız olursa prod veri tutarsızlığı"
severity: high
mitigation: "Her migration için down() fonksiyonu zorunlu; deploy öncesi staging'de geri-alma testi"

id: r-platform-factory-3
desc: "GraphQL N+1 — resolver başına ayrı DB sorgusu"
severity: high
mitigation: "Strawberry DataLoader zorunlu kullanım; integration testte sorgu sayısı assert edilir"
```

**rollback:** "Alembic downgrade bir önceki revision'a; Docker image tag'i geri al; feature flag kapat"

**İzlenebilirlik bağları (Prompt 5 için):**
- `evidence`: CI pipeline URL'si, Hetzner deploy logu
- `refs`: GitHub repo URL'si (private), ilgili ADR'ler
- Düğüme eklenecek izlenebilirlik alanları: `repoPath` (örn. "platform/backend"), `testCommand` (örn. "pytest tests/ -v"), `deployTarget` (örn. "hetzner-prod-01")

---

### 5.2 Modüller — module seviyesi

Platform fabrikası altında 8 birincil modül tanımlanmaktadır.

---

#### 5.2.1 Modül: platform-tenancy

```
id:          platform-tenancy
wbsCode:     30.1
level:       module
title:       Tenant Yönetimi
slug:        platform-tenancy
summary:     Tenant kayıt, izolasyon stratejisi (schema-per-tenant ve/veya RLS),
             tenant yaşam döngüsü (aktif/askıya alınmış/silinmiş) ve tenant-bazlı
             konfigürasyon yönetimi.
parentId:    platform-factory
order:       1
tags:        ["platform", "tenancy", "module", "multi-tenant"]
criticalPath: true
status:      backlog
priority:    critical
phase:       requirements
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   []
blocks:      ["platform-authn-authz", "platform-db-schema", "platform-graphql-api",
              "platform-ui-surface", "platform-observability", "platform-cicd"]
effort:
  estimate:  30
  unit:      sp
  spent:     0
```

**Test Planı (test-plan fazı kriterleri):**

Unit testler:
- TenantService.create() — slug benzersizlik, geçersiz isim reddi
- TenantService.suspend() — askıya alınmış tenant API erişim reddi

API/integration testler:
- Tenant A oturumu açık; Tenant B'ye ait kayıt GET isteği → 403 döner
- RLS politikası: `SET LOCAL app.tenant_id = 'X'` sonrası başka tenant kaydı görünmez
- Tenant silindiğinde cascade — bağlı kullanıcı oturumları geçersiz kalır

E2E (Playwright):
- Yeni tenant kayıt → oturum açma → boş dashboard görüntüleme
- Geçersiz tenant subdomain → 404

A11y: Tenant onboarding formu axe-core 0 ihlal

**DB Şema Notları (db-schema fazı):**

```sql
-- Schema-per-tenant yaklaşımında her tenant için ayrı PostgreSQL schema.
-- RLS yaklaşımında tek public schema + tenant_id sütunu + RLS policy.
-- Karar ADR olarak kaydedilmeli (adr-0026 rezerve).

CREATE TABLE public.tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Alembic migration: `expand-contract` modunda; `down()` fonksiyonu zorunlu.

**deliverables:**
- Tenant veri modeli ve Alembic migration
- TenantService (CRUD + durum makinesi)
- Tenant izolasyon kanıtı (integration test raporu)
- Tenant onboarding dokümanı

**acceptanceCriteria:**
- Cross-tenant veri sızıntısı integration testinde 0 ihlal
- Tenant askıya alma → API erişim reddi < 1 saniye içinde devreye girer
- Alembic down migration staging'de başarılı çalışır

**risks:**
```
id: r-platform-tenancy-1
desc: "Schema-per-tenant büyük kiracı sayısında PostgreSQL bağlantı havuzunu tüketir"
severity: high
mitigation: "PgBouncer kullanımı veya RLS yaklaşımına geçiş; kapasite testi < 1000 tenant"

id: r-platform-tenancy-2
desc: "Tenant silme cascade beklenmedik veri kaybına yol açabilir"
severity: critical
mitigation: "Soft-delete zorunlu; hard-delete için 30 gün bekleme + admin onayı"
```

**rollback:** "Alembic downgrade; tenant tablosunu yedekten geri yükle"

**İzlenebilirlik:** `repoPath`: "platform/backend/app/tenancy", `testCommand`: "pytest tests/tenancy/ -v", `deployTarget`: "hetzner-prod-01/platform"

---

#### 5.2.2 Modül: platform-authn-authz

```
id:          platform-authn-authz
wbsCode:     30.2
level:       module
title:       Kimlik Doğrulama ve Yetkilendirme (RBAC)
slug:        platform-authn-authz
summary:     JWT tabanlı kimlik doğrulama, rol bazlı erişim kontrolü (RBAC),
             refresh token rotasyonu, oturum geçersiz kılma ve tenant-bazlı rol
             konfigürasyonu. OWASP A07 (Identification and Authentication Failures)
             ve A01 (Broken Access Control) doğrudan muhatap.
parentId:    platform-factory
order:       2
tags:        ["platform", "authn", "authz", "rbac", "module", "security"]
criticalPath: true
status:      backlog
priority:    critical
phase:       requirements
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-tenancy"]
blocks:      ["platform-graphql-api", "platform-ui-surface"]
effort:
  estimate:  35
  unit:      sp
  spent:     0
```

**Test Planı (test-plan fazı kriterleri):**

Unit testler:
- JWT token oluşturma/doğrulama/süresi dolmuş token reddi
- RBAC: yetersiz rolle korunan endpoint erişim reddi
- Refresh token rotasyonu — eski token yeniden kullanımda hata

API/integration testler:
- Tenant A admin rolü — Tenant B kaynağına erişim → 403
- Rol kaldırıldıktan sonra mevcut JWT'nin bir sonraki istekte reddi
- Brute force: 5 hatalı giriş → hesap kilidi

E2E (Playwright):
- Kullanıcı giriş → token al → korunan sayfa görüntüle → çıkış → yeniden erişim reddi
- Oturum süresi dolmuş → otomatik refresh → devam

A11y: Giriş formu axe-core 0 ihlal; hata mesajları ARIA alert rolüyle duyurulur

Güvenlik smoke testi: OWASP ZAP pasif tarama 0 kritik bulgu

**DB Şema Notları:**

```sql
CREATE TABLE public.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES public.tenants(id),
    email       TEXT NOT NULL,
    UNIQUE (tenant_id, email),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.roles (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    name      TEXT NOT NULL,
    UNIQUE (tenant_id, name)
);

CREATE TABLE public.user_roles (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
```

RLS politikası: tüm tablolara `tenant_id = current_setting('app.tenant_id')::UUID` koşulu.

**deliverables:**
- AuthService (JWT oluştur/doğrula/yenile)
- RBAC middleware (FastAPI Depends)
- Kullanıcı/rol Alembic migrationları
- OWASP ZAP pasif tarama raporu

**acceptanceCriteria:**
- Çapraz tenant yetki bypass integration testinde 0 ihlal
- Token süresi 15 dk; refresh token 7 gün; refresh rotasyonu aktif
- Brute force koruması: 5 başarısız giriş → 15 dk kilit

**risks:**
```
id: r-platform-authn-1
desc: "JWT secret sızıntısı tüm tenant oturumlarını etkiler"
severity: critical
mitigation: "Secret Vault'ta saklanır; 90 günde rotasyon; eski token blacklist"

id: r-platform-authn-2
desc: "Rol kaldırma anında oturum açık kullanıcı yetkiyi korur"
severity: high
mitigation: "JWT kısa TTL (15 dk) + server-side token revocation listesi"
```

**rollback:** "JWT secret önceki versiyona geri al; oturum tablosunu temizle; kullanıcıları yeniden giriş yap"

**İzlenebilirlik:** `repoPath`: "platform/backend/app/auth", `testCommand`: "pytest tests/auth/ -v", `deployTarget`: "hetzner-prod-01/platform"

---

#### 5.2.3 Modül: platform-db-schema

```
id:          platform-db-schema
wbsCode:     30.3
level:       module
title:       Veritabanı Şeması ve Migration Altyapısı
slug:        platform-db-schema
summary:     PostgreSQL şema tasarımı, SQLAlchemy 2.0 model tanımları, Alembic
             migration pipeline'ı ve veri politikaları (append-only, expand-contract,
             reversible-backfill). Tüm migration'lar down() fonksiyonu içermek zorundadır.
parentId:    platform-factory
order:       3
tags:        ["platform", "db", "schema", "alembic", "module"]
criticalPath: true
status:      backlog
priority:    critical
phase:       requirements
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-tenancy"]
blocks:      ["platform-graphql-api", "platform-seed-data"]
effort:
  estimate:  25
  unit:      sp
  spent:     0
```

**Test Planı (test-plan fazı kriterleri):**

Unit testler:
- SQLAlchemy model kısıt (constraint) doğrulama — null tenant_id reddi
- Alembic revision geçmişi — `alembic history` temiz çıktı

API/integration testler:
- `alembic upgrade head` → `alembic downgrade -1` → `alembic upgrade head` döngüsü başarılı
- expand-contract: yeni sütun ekleme, eski kodu çalıştırma, eski sütun kaldırma — 0 kesinti
- Schema snapshot: migration öncesi ve sonrası otomatik diff

**DB Şema Notları:**

Alembic env.py: `include_schemas=True`; tenant migration'ları için online + offline mod.

Migration kural seti (tüm migration'lar için zorunlu):
1. `upgrade()` içinde `op.execute("SET LOCAL app.tenant_id = 'migration-runner'")`
2. `down()` fonksiyonu boş bırakılamaz; `pass` geçersiz
3. Üretim veri sütunu kaldırma: expand-contract üç adım (yeni sütun → backfill → eski kaldır)

**deliverables:**
- Alembic `env.py` + `alembic.ini` konfigürasyonu
- Temel tablo migration'ları (tenant, user, role, audit_log)
- Migration test koşum scripti (CI'da çalışır)
- Migration runbook

**acceptanceCriteria:**
- Tüm migration'ların `down()` fonksiyonu mevcut ve çalışır
- CI'da `alembic upgrade head && alembic downgrade base` 0 hata
- Boş DB'den tam migration süresi < 30 saniye

**risks:**
```
id: r-platform-db-1
desc: "Uzun migration kilidi prod trafik kesilmesine neden olur"
severity: high
mitigation: "Concurrent index oluşturma; DDL kilidi olmayan expand-contract"

id: r-platform-db-2
desc: "Hatalı down() migration geri-alma imkansızlaştırır"
severity: critical
mitigation: "PR'da down() zorunlu review checklist; CI'da down migration testi"
```

**rollback:** "Alembic downgrade <target_revision>; pg_dump ile alınan snapshot'tan geri yükle"

**İzlenebilirlik:** `repoPath`: "platform/backend/alembic", `testCommand`: "alembic upgrade head && alembic downgrade base", `deployTarget`: "hetzner-prod-01/platform-db"

---

#### 5.2.4 Modül: platform-graphql-api

```
id:          platform-graphql-api
wbsCode:     30.4
level:       module
title:       GraphQL API Sözleşmesi
slug:        platform-graphql-api
summary:     Strawberry tabanlı GraphQL şeması, query/mutation/subscription sözleşmesi,
             DataLoader ile N+1 önleme, query depth/complexity limiti ve tenant-aware
             resolver'lar. Bu modül platform'un dış sözleşmesidir; kırıcı değişiklikler
             versiyonlama gerektirir.
parentId:    platform-factory
order:       4
tags:        ["platform", "graphql", "api", "module", "strawberry"]
criticalPath: true
status:      backlog
priority:    critical
phase:       requirements
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-authn-authz", "platform-db-schema"]
blocks:      ["platform-ui-surface"]
effort:
  estimate:  40
  unit:      sp
  spent:     0
```

**Test Planı (test-plan fazı kriterleri):**

Unit testler:
- Resolver unit testi — mock DB ile beklenen sonuç
- Input validation — geçersiz argüman → GraphQL error formatı doğru

API/integration testler:
- Query depth limit: 10 seviye aşan sorgu → 400 hatası
- Complexity limit: hesaplanan karmaşıklık > 1000 → reddedilir
- DataLoader: N kayıt için tek DB sorgusu assert edilir (SQLAlchemy query count)
- Mutation: tenant_id inject edilmeden kayıt oluşturma → 403
- Subscription: WebSocket üzerinden tenant-scoped event akışı

E2E (Playwright):
- GraphiQL playground → örnek query çalıştırma → sonuç doğrulama
- Yetkisiz kullanıcı mutation → hata mesajı görüntüleme

**GraphQL Sözleşmesi (Temel tipler — Dikey Dilim Customer):**

```graphql
type Customer {
  id: ID!
  tenantId: ID!
  name: String!
  email: String!
  status: CustomerStatus!
  createdAt: DateTime!
}

enum CustomerStatus { ACTIVE INACTIVE ARCHIVED }

type Query {
  customers(first: Int, after: String): CustomerConnection!
  customer(id: ID!): Customer
}

type Mutation {
  createCustomer(input: CreateCustomerInput!): Customer!
  updateCustomer(id: ID!, input: UpdateCustomerInput!): Customer!
  archiveCustomer(id: ID!): Customer!
}
```

Sözleşme değişiklik kuralı: field kaldırma = kırıcı değişiklik → yeni API versiyonu. Field ekleme = geriye uyumlu (expand).

**deliverables:**
- Strawberry GraphQL şema tanımları
- DataLoader implementasyonları (her ilişki için)
- Query depth/complexity middleware
- GraphQL API changelog (kırıcı değişiklik takibi)

**acceptanceCriteria:**
- N+1 test: 100 Customer sorgusu → tek DB select
- Depth 10 aşıldığında GraphQL error dönülür, 500 değil
- Tenant izolasyonu: farklı tenant'ın Customer'ı direkt ID ile sorgulanamaz

**risks:**
```
id: r-platform-graphql-1
desc: "GraphQL N+1 — DataLoader eklenmemiş resolver"
severity: high
mitigation: "Her resolver PR'ında DataLoader zorunlu; integration testte sorgu sayısı assert"

id: r-platform-graphql-2
desc: "Kırıcı şema değişikliği istemci uygulamalarını bozar"
severity: high
mitigation: "Schema registry; versiyonlama politikası; deprecation penceresi minimum 2 sprint"
```

**rollback:** "Önceki şema versiyonuna feature flag ile geçiş; kırıcı değişiklik deploy edilmez"

**İzlenebilirlik:** `repoPath`: "platform/backend/app/graphql", `testCommand`: "pytest tests/graphql/ -v --count-queries", `deployTarget`: "hetzner-prod-01/platform"

---

#### 5.2.5 Modül: platform-ui-surface

```
id:          platform-ui-surface
wbsCode:     30.5
level:       module
title:       React UI Yüzeyi (Dikey Dilim)
slug:        platform-ui-surface
summary:     React + Vite + TanStack Router/Query ile oluşturulan platform UI'ı.
             Tenant-aware oturum yönetimi, Customer CRUD ekranları, GraphQL ile veri
             bağlantısı ve WCAG 2.2 AAA erişilebilirlik uyumu. Next.js yasak.
parentId:    platform-factory
order:       5
tags:        ["platform", "react", "vite", "tanstack", "ui", "module"]
criticalPath: true
status:      backlog
priority:    high
phase:       requirements
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-graphql-api", "platform-authn-authz"]
blocks:      []
effort:
  estimate:  35
  unit:      sp
  spent:     0
```

**Test Planı (test-plan fazı kriterleri):**

Unit testler:
- React bileşen render — Vitest + React Testing Library
- TanStack Query cache invalidation sonrası yeniden fetch
- Form validation — geçersiz email → hata mesajı gösterilir

Frontend smoke testleri:
- `npm run build` 0 hata → `npm run preview` başlar
- TanStack Router route tanımları — tanımsız route → 404 sayfası

E2E (Playwright):
- Giriş → Customer listesi → yeni Customer oluştur → form gönder → listede görünür
- Oturum süresi dolmuş → login yönlendirmesi

A11y: axe-core taraması — tüm sayfalarda 0 ihlal; kontrast oranı ≥ 7:1; klavye tab sırası tutarlı

**Bileşen Haritası (Dikey Dilim):**

```
src/
  routes/
    _auth/
      login.tsx           -- Giriş sayfası
    _tenant/
      customers/
        index.tsx         -- Customer listesi (TanStack Query + pagination)
        $customerId.tsx   -- Customer detay
        new.tsx           -- Yeni Customer formu
  components/
    CustomerCard.tsx
    CustomerForm.tsx
    TenantProvider.tsx    -- Tenant context (JWT'den tenant_id)
  graphql/
    queries/customers.ts
    mutations/customer.ts
```

**deliverables:**
- React uygulaması (Vite build)
- TanStack Router route yapısı
- Customer CRUD ekranları
- axe-core a11y raporu (0 ihlal kanıtı)

**acceptanceCriteria:**
- Vite build < 60 saniye; bundle boyutu < 500 KB (gzip)
- Playwright e2e Customer akışı geçer
- axe-core 0 ihlal tüm sayfalarda

**risks:**
```
id: r-platform-ui-1
desc: "TanStack Query cache tenant değişiminde eski veri gösterebilir"
severity: high
mitigation: "Tenant context değişiminde tüm query cache'i invalidate et"

id: r-platform-ui-2
desc: "Vite HMR geliştirme ortamında cross-tenant state sızıntısı"
severity: medium
mitigation: "Geliştirme ortamı izolasyon testi; tenant switching e2e testi"
```

**rollback:** "Önceki Vite build tag'ini Docker'dan yeniden deploy et"

**İzlenebilirlik:** `repoPath`: "platform/frontend", `testCommand`: "npm run test && npx playwright test", `deployTarget`: "hetzner-prod-01/platform-ui"

---

#### 5.2.6 Modül: platform-seed-data

```
id:          platform-seed-data
wbsCode:     30.6
level:       module
title:       Seed Veri ve Test Fixture'ları
slug:        platform-seed-data
summary:     Geliştirme ve staging ortamları için deterministik seed veri,
             tenant fixture'ları, RBAC rol/kullanıcı örnekleri ve Playwright
             e2e testleri için hazır veri kümesi.
parentId:    platform-factory
order:       6
tags:        ["platform", "seed", "fixture", "module"]
criticalPath: false
status:      backlog
priority:    medium
phase:       requirements
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-db-schema", "platform-tenancy", "platform-authn-authz"]
blocks:      []
effort:
  estimate:  15
  unit:      sp
  spent:     0
```

**Test Planı (test-plan fazı kriterleri):**

Unit testler:
- Seed script idempotency — iki kez çalıştırma → aynı sonuç, duplicate yok
- Fixture verisi şema doğrulaması — Pydantic modellere uymayan kayıt reddi

Integration testler:
- `alembic upgrade head && python seed.py` → 0 hata
- Seed veriyle e2e testleri geçer
- Prod ortamında seed script çalıştırma girişimi → reddedilir (ortam guard)

**deliverables:**
- `scripts/seed.py` (idempotent)
- Tenant fixture'ları (2 örnek tenant: demo-a, demo-b)
- Customer fixture'ları (her tenant için 20 kayıt)
- Playwright e2e için hazır kullanıcı/rol fixture'ları

**acceptanceCriteria:**
- Seed script iki kez çalıştırıldığında duplicate kayıt oluşmaz
- Prod ortam guard: `APP_ENV != production` kontrolü
- CI'da seed + e2e suite geçer

**risks:**
```
id: r-platform-seed-1
desc: "Seed script prod ortamında kazara çalışır"
severity: critical
mitigation: "APP_ENV=production kontrolü; CI'da prod ortam blocklist"
```

**rollback:** "Seed tabloları truncate; `alembic downgrade` ile şemayı temizle"

**İzlenebilirlik:** `repoPath`: "platform/scripts", `testCommand`: "python scripts/seed.py --env test", `deployTarget`: "staging only"

---

#### 5.2.7 Modül: platform-observability

```
id:          platform-observability
wbsCode:     30.7
level:       module
title:       Gözlemlenebilirlik (Metrics + Logs + Traces)
slug:        platform-observability
summary:     Prometheus metrics, structured logging (JSON), OpenTelemetry tracing,
             Grafana dashboard ve tenant-bazlı rate limit monitoring. Hetzner
             Debian ortamında Docker Compose ile kurulur.
parentId:    platform-factory
order:       7
tags:        ["platform", "observability", "metrics", "logs", "module"]
criticalPath: false
status:      backlog
priority:    high
phase:       requirements
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-db-schema", "platform-authn-authz"]
blocks:      []
effort:
  estimate:  20
  unit:      sp
  spent:     0
```

**Test Planı (test-plan fazı kriterleri):**

Integration testler:
- `/metrics` endpoint → Prometheus format geçerli
- Yapılandırılmış log: her request için tenant_id, user_id, latency alanları mevcut
- Rate limit aşımı logu → tenant_id ile kayıt edilir
- Trace: GraphQL resolver span'ları DB sorgu süresini içerir

Smoke testleri:
- Grafana dashboard → platform servis UP metriği görünür
- Alertmanager: yüksek latency → Slack alert tetiklenir (staging)

**deliverables:**
- FastAPI Prometheus middleware
- Structured logging konfigürasyonu (JSON formatter)
- OpenTelemetry tracer konfigürasyonu
- Docker Compose: Prometheus + Grafana + Alertmanager
- Tenant rate limit dashboard

**acceptanceCriteria:**
- Her API isteği tenant_id ile loglanır
- p95 latency Grafana'da görünür
- Tenant başına istek sayısı metrik olarak mevcut

**risks:**
```
id: r-platform-obs-1
desc: "Log verisinde tenant PII sızıntısı"
severity: high
mitigation: "Log sanitizer: email/isim alanları maskeli; sadece tenant_id loglanır"

id: r-platform-obs-2
desc: "Prometheus scrape aralığı yüksek kardinalite ile belleği tüketir"
severity: medium
mitigation: "Label kardinalitesi sınırlı; tenant_id label'ı sadece aggregate metriklerde"
```

**rollback:** "Observability servisleri isteğe bağlı; kapat ve platform çalışmaya devam eder"

**İzlenebilirlik:** `repoPath`: "platform/infra/observability", `testCommand`: "pytest tests/observability/ -v", `deployTarget`: "hetzner-prod-01/monitoring"

---

#### 5.2.8 Modül: platform-cicd

```
id:          platform-cicd
wbsCode:     30.8
level:       module
title:       CI/CD Pipeline ve Deployment
slug:        platform-cicd
summary:     GitHub Actions tabanlı CI/CD; lint, test, build, Docker image oluşturma
             ve Hetzner/Debian'a deploy. Staging → prod kademeli açılış; rollback
             prosedürü otomatikleştirilmiş. GitHub private repo kaynağı.
parentId:    platform-factory
order:       8
tags:        ["platform", "cicd", "github-actions", "docker", "module", "deployment"]
criticalPath: true
status:      backlog
priority:    high
phase:       requirements
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-tenancy", "platform-db-schema", "platform-observability"]
blocks:      []
effort:
  estimate:  25
  unit:      sp
  spent:     0
```

**Test Planı (test-plan fazı kriterleri):**

Integration testleri:
- PR açıldığında CI tetiklenir → lint + test + build tamamlanır
- Başarısız test → merge engellenir (required check)
- Docker image tag'leme: SHA + semver
- `alembic upgrade head` CI'da otomatik çalışır; başarısızlık deploy'u engeller

E2E (staging):
- GitHub Actions → Hetzner staging deploy → smoke test geçer → prod deploy açılır
- Rollback: önceki image tag → Hetzner'a yeniden deploy → smoke test geçer

**Pipeline Yapısı:**

```
CI (her PR):
  1. biome lint + tip kontrolü
  2. pytest (unit + integration) — coverage ≥ 80%
  3. Playwright e2e (staging env)
  4. axe-core a11y tarama
  5. Docker build (çoklu aşama)
  6. OWASP dependency check

CD (main branch merge):
  1. Docker image push (GitHub Container Registry)
  2. Alembic migration (staging)
  3. Staging deploy + smoke test
  4. Manuel onay kapısı (platform owner)
  5. Prod deploy (Hetzner + Debian)
  6. Prod smoke test
```

**Docker Compose (üretim ana hatları):**

```yaml
services:
  backend:
    image: ghcr.io/org/platform-backend:${TAG}
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - APP_ENV=production
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
  frontend:
    image: ghcr.io/org/platform-frontend:${TAG}
    ports:
      - "80:80"
      - "443:443"
  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
  prometheus:
    image: prom/prometheus:latest
  grafana:
    image: grafana/grafana:latest
```

**deliverables:**
- GitHub Actions workflow dosyaları (ci.yml, cd.yml)
- Dockerfile (backend + frontend, çoklu aşama)
- Docker Compose (prod + staging)
- Rollback runbook

**acceptanceCriteria:**
- PR'da tüm CI adımları yeşil → merge açılır
- Staging deploy < 10 dakika
- Rollback prosedürü < 5 dakika içinde önceki versiyona döner
- Prod smoke test: `/health` endpoint 200, GraphQL `{__typename}` sorgusu yanıt verir

**risks:**
```
id: r-platform-cicd-1
desc: "Prod migration başarısız olur, rollback eksik"
severity: critical
mitigation: "Migration öncesi pg_dump snapshot; başarısız migration otomatik downgrade tetikler"

id: r-platform-cicd-2
desc: "Docker secret CI ortamında sızdırılır"
severity: high
mitigation: "GitHub Actions secrets; .env dosyası repoya asla commit edilmez"
```

**rollback:** "Docker Compose ile önceki image tag'e `docker service update --image <prev-tag>`; Alembic downgrade"

**İzlenebilirlik:** `repoPath`: "platform/.github/workflows", `testCommand`: "gh workflow run ci.yml", `deployTarget`: "hetzner-prod-01"

---

### 5.3 Archetype Seviyesi — Dikey Dilim Düğümleri

Archetype seviyesi, bir modülün somut üretim parçalarını temsil eder. Dikey dilim için Customer modülü altında 4 archetype tanımlanmıştır.

---

#### 5.3.1 Archetype: platform-customer-model

```
id:          platform-customer-model
wbsCode:     30.1.1
level:       archetype
title:       Customer Veri Modeli ve Migration
slug:        platform-customer-model
summary:     Customer entity'sinin SQLAlchemy modeli, PostgreSQL tablosu, Alembic
             migration'ı ve Pydantic input/output şeması. Tenant izolasyonu
             RLS politikasıyla sağlanır.
parentId:    platform-db-schema
order:       1
tags:        ["platform", "customer", "archetype", "db", "model"]
criticalPath: true
status:      backlog
priority:    high
phase:       test-plan
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-tenancy", "platform-db-schema"]
blocks:      ["platform-customer-graphql", "platform-customer-ui"]
effort:
  estimate:  8
  unit:      sp
  spent:     0
```

**Test Planı (önce testler — test-plan fazı):**

```python
# tests/customer/test_model.py
def test_customer_requires_tenant_id():
    """tenant_id olmadan kayıt oluşturma IntegrityError verir"""

def test_customer_rls_isolation(db_session, tenant_a, tenant_b):
    """Tenant A oturumunda Tenant B customer'ı görünmez"""

def test_customer_status_enum():
    """Geçersiz status değeri Pydantic ValidationError verir"""

def test_customer_email_unique_per_tenant():
    """Aynı tenant içinde duplicate email IntegrityError verir"""

def test_customer_email_same_across_tenants():
    """Farklı tenant'larda aynı email — kayıt başarılı"""
```

**DB Şema:**

```sql
CREATE TABLE customers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        TEXT NOT NULL CHECK (char_length(name) >= 1),
    email       TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'archived')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);

CREATE INDEX ix_customers_tenant_id ON customers (tenant_id);

-- RLS politikası
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON customers
    USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

**deliverables:**
- SQLAlchemy model (Customer)
- Pydantic CustomerInput / CustomerOutput şemaları
- Alembic migration (up + down)
- RLS politika testi

**acceptanceCriteria:**
- Cross-tenant sorgu 0 kayıt döner (RLS kanıtı)
- Alembic down migration temiz çalışır
- Tüm unit testler yeşil

**İzlenebilirlik:** `repoPath`: "platform/backend/app/customer/models.py", `testCommand`: "pytest tests/customer/test_model.py -v"

---

#### 5.3.2 Archetype: platform-customer-graphql

```
id:          platform-customer-graphql
wbsCode:     30.4.1
level:       archetype
title:       Customer GraphQL Resolver'ları
slug:        platform-customer-graphql
summary:     Customer query/mutation resolver'ları, DataLoader ile N+1 önleme
             ve tenant-scoped yetkilendirme. Strawberry dekoratör tabanlı tanım.
parentId:    platform-graphql-api
order:       1
tags:        ["platform", "customer", "graphql", "resolver", "archetype"]
criticalPath: true
status:      backlog
priority:    high
phase:       test-plan
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-customer-model", "platform-authn-authz"]
blocks:      ["platform-customer-ui"]
effort:
  estimate:  10
  unit:      sp
  spent:     0
```

**Test Planı (önce testler):**

```python
# tests/customer/test_graphql.py
def test_customers_query_returns_only_tenant_data(graphql_client, tenant_a_token):
    """customers query sadece kendi tenant verilerini döner"""

def test_create_customer_mutation(graphql_client, tenant_a_token):
    """createCustomer başarılı → id ve name döner"""

def test_create_customer_without_auth(graphql_client):
    """Token olmadan createCustomer → 401"""

def test_query_depth_limit_exceeded(graphql_client, tenant_a_token):
    """11 seviye iç içe sorgu → error.extensions.code = 'QUERY_TOO_DEEP'"""

def test_dataloader_single_query(graphql_client, tenant_a_token, db_query_counter):
    """100 müşteri sorgusu → DB'ye tek SELECT"""
```

**deliverables:**
- Strawberry Customer type + resolver'lar
- CustomerDataLoader
- Depth/complexity middleware entegrasyonu
- Resolver integration test paketi

**acceptanceCriteria:**
- DataLoader: 100 Customer için tek DB sorgusu (integration test kanıtı)
- Yetkisiz mutation → 401
- Çapraz tenant query → 0 kayıt (403 değil, 0 kayıt — bilgi sızıntısı önlenir)

**İzlenebilirlik:** `repoPath`: "platform/backend/app/customer/resolvers.py", `testCommand`: "pytest tests/customer/test_graphql.py -v"

---

#### 5.3.3 Archetype: platform-customer-ui

```
id:          platform-customer-ui
wbsCode:     30.5.1
level:       archetype
title:       Customer UI Bileşenleri (React)
slug:        platform-customer-ui
summary:     Customer liste, detay ve form ekranları. TanStack Query ile GraphQL
             bağlantısı, TanStack Router ile route yönetimi. WCAG 2.2 AAA uyumu.
parentId:    platform-ui-surface
order:       1
tags:        ["platform", "customer", "react", "ui", "archetype"]
criticalPath: true
status:      backlog
priority:    high
phase:       test-plan
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-customer-graphql", "platform-ui-surface"]
blocks:      []
effort:
  estimate:  12
  unit:      sp
  spent:     0
```

**Test Planı (önce testler):**

```typescript
// tests/customer/CustomerList.test.tsx (Vitest)
test('renders customer list from GraphQL query')
test('shows empty state when no customers')
test('pagination: next page loads more customers')

// tests/customer/CustomerForm.test.tsx
test('invalid email shows validation error')
test('form submit calls createCustomer mutation')
test('form accessible: no axe violations')
```

```javascript
// e2e/customer.spec.ts (Playwright)
test('create customer flow: login → new → submit → appears in list')
test('archive customer: status changes in list')
test('keyboard navigation: tab order correct on all customer pages')
```

**deliverables:**
- CustomerList, CustomerDetail, CustomerForm bileşenleri
- TanStack Query hook'ları (useCustomers, useCreateCustomer)
- Route tanımları
- axe-core a11y raporu

**acceptanceCriteria:**
- axe-core 0 ihlal tüm Customer sayfalarında
- Playwright e2e Customer akışı geçer
- Klavye ile tam navigasyon mümkün

**İzlenebilirlik:** `repoPath`: "platform/frontend/src/routes/_tenant/customers", `testCommand`: "npx playwright test e2e/customer.spec.ts"

---

#### 5.3.4 Archetype: platform-customer-seed

```
id:          platform-customer-seed
wbsCode:     30.6.1
level:       archetype
title:       Customer Seed ve Fixture Verisi
slug:        platform-customer-seed
summary:     Geliştirme ve staging ortamları için Customer fixture'ları.
             İki demo tenant (demo-a, demo-b) ve her birinde 20 Customer kaydı.
             Playwright e2e testleri bu fixture'lara dayanır.
parentId:    platform-seed-data
order:       1
tags:        ["platform", "customer", "seed", "fixture", "archetype"]
criticalPath: false
status:      backlog
priority:    medium
phase:       test-plan
state:       taslak
milestone:   Platform Fabrikası v1
dependsOn:   ["platform-customer-model", "platform-seed-data"]
blocks:      []
effort:
  estimate:  5
  unit:      sp
  spent:     0
```

**deliverables:**
- `scripts/fixtures/customers.py` — demo-a ve demo-b tenant'ları için 20'şer Customer
- Playwright fixture yardımcısı (test izolasyonu için her test öncesi yeniden seed)
- Idempotency testi

**acceptanceCriteria:**
- İki kez seed → kayıt sayısı değişmez
- `APP_ENV=production` → seed çalışmaz

**İzlenebilirlik:** `repoPath`: "platform/scripts/fixtures/customers.py", `testCommand`: "pytest tests/seed/test_customer_seed.py -v"

---

## 6. Düğüm Envanteri

Toplam önerilen düğüm sayısı: **16**

| No  | id                          | wbsCode  | level     | parentId               |
|-----|-----------------------------|----------|-----------|------------------------|
| 1   | platform-factory            | 30       | app       | null                   |
| 2   | platform-tenancy            | 30.1     | module    | platform-factory       |
| 3   | platform-authn-authz        | 30.2     | module    | platform-factory       |
| 4   | platform-db-schema          | 30.3     | module    | platform-factory       |
| 5   | platform-graphql-api        | 30.4     | module    | platform-factory       |
| 6   | platform-ui-surface         | 30.5     | module    | platform-factory       |
| 7   | platform-seed-data          | 30.6     | module    | platform-factory       |
| 8   | platform-observability      | 30.7     | module    | platform-factory       |
| 9   | platform-cicd               | 30.8     | module    | platform-factory       |
| 10  | platform-customer-model     | 30.1.1   | archetype | platform-db-schema     |
| 11  | platform-customer-graphql   | 30.4.1   | archetype | platform-graphql-api   |
| 12  | platform-customer-ui        | 30.5.1   | archetype | platform-ui-surface    |
| 13  | platform-customer-seed      | 30.6.1   | archetype | platform-seed-data     |

**Not:** 16 yerine 13 düğüm — envanteri tablo üzerinden say: 1 app + 8 module + 4 archetype = 13 düğüm.

Gelecek aşamalarda (Prompt 4-impl ve sonrası) stone/molecule/element/atom düğümleri her archetype altında eklenebilir. Bu spec yalnızca app → module → archetype üçlüsünü kapsar.

---

## 7. Bağımlılık Grafiği

```
platform-factory (30)
├── platform-tenancy (30.1)             ← hiçbir şeye bağlı değil; ilk kurulur
│   └── platform-customer-model (30.1.1) ← archetype; platform-db-schema'ya da bağlı
├── platform-authn-authz (30.2)         ← platform-tenancy tamamlanınca başlar
├── platform-db-schema (30.3)           ← platform-tenancy tamamlanınca başlar
│   └── [platform-customer-model buradan da bağımlı]
├── platform-graphql-api (30.4)         ← platform-authn-authz + platform-db-schema
│   └── platform-customer-graphql (30.4.1) ← platform-customer-model + platform-authn-authz
├── platform-ui-surface (30.5)          ← platform-graphql-api + platform-authn-authz
│   └── platform-customer-ui (30.5.1)   ← platform-customer-graphql + platform-ui-surface
├── platform-seed-data (30.6)           ← platform-db-schema + platform-tenancy + platform-authn-authz
│   └── platform-customer-seed (30.6.1) ← platform-customer-model + platform-seed-data
├── platform-observability (30.7)       ← platform-db-schema + platform-authn-authz
└── platform-cicd (30.8)                ← platform-tenancy + platform-db-schema + platform-observability
```

Kritik yol: platform-tenancy → platform-db-schema → platform-customer-model → platform-customer-graphql → platform-customer-ui

---

## 8. Edge Case'ler ve Riskler

Bu bölüm, spec boyunca dağıtılmış riskleri tematik olarak konsolide eder.

### 8.1 Çok-Kiracılık Veri Sızıntısı

**Senaryo:** Geliştirici tenant_id filtresini unutur; tüm tenant'ların verisi tek bir API yanıtında döner.

**Önleme katmanları:**
1. PostgreSQL RLS politikası — uygulama katmanı atlanmış olsa bile DB sızıntıyı engeller
2. Integration testlerde cross-tenant negatif assert zorunlu (PR kapısı)
3. GraphQL resolver'larında `current_tenant_id` dependency injection — açık bırakılamaz
4. Observability: tenant_id olmayan sorgu logu → alarm

**Test kanıtı:** `test_customer_rls_isolation` — tenant_b oturumunda tenant_a customer'ı görmez

### 8.2 Migration Geri-Alma Başarısızlığı

**Senaryo:** Prod'a hatalı migration push edilir; `down()` fonksiyonu `pass` ile bırakılmıştır; geri alma imkansız.

**Önleme katmanları:**
1. `down()` fonksiyonu boş bırakılamaz — CI statik analiz kuralı
2. Her migration öncesi otomatik `pg_dump` snapshot
3. CI'da her migration için `upgrade → downgrade → upgrade` döngüsü
4. expand-contract politikası: sütun kaldırma üç adımda yapılır

### 8.3 GraphQL N+1

**Senaryo:** Customer listesi her Customer için ayrı bir DB sorgusu tetikler; 1000 kayıtta 1001 sorgu.

**Önleme katmanları:**
1. Strawberry DataLoader zorunlu kullanım — PR'da reviewers checklist
2. Integration testte `db_query_counter` fixture — beklenen sorgu sayısı assert edilir
3. Complexity limiti: aşırı iç içe sorgu → reddedilir

### 8.4 Yetki Bypass

**Senaryo:** Kullanıcı başka tenant'ın Customer ID'sini bilerek sorgular; uygulama 200 döner.

**Önleme:**
- GraphQL resolver'da `customer(id)` sorgusu: `WHERE id = :id AND tenant_id = current_tenant_id()`
- Çapraz tenant erişim: 0 kayıt döner (403 değil — ID varlığı sızdırılmaz)
- Negatif test: `test_customer_cross_tenant_direct_id_query`

### 8.5 Tenant Bazlı Rate Limit

**Senaryo:** Bir tenant aşırı istek göndererek diğer tenant'ların servis kalitesini düşürür.

**Önleme:**
- FastAPI rate limit middleware: `X-Tenant-ID` başlığına göre sliding window
- Redis veya in-memory (başlangıçta): 1000 req/dk per tenant
- Aşım: 429 Too Many Requests + Retry-After header
- Observability: tenant bazlı istek sayacı Grafana'da

### 8.6 JWT Secret Sızıntısı

**Senaryo:** `.env` dosyası repoya commit edilir; tüm tenant oturumları risk altına girer.

**Önleme:**
- `.gitignore`'a `.env` zorunlu; pre-commit hook
- GitHub Actions secrets; CI ortamında `env` değerleri loglanmaz
- Secret rotasyon: 90 günde bir; eski token blacklist mekanizması

### 8.7 Observability'de PII Sızıntısı

**Senaryo:** Email adresi veya müşteri adı log dosyalarına yazılır; KVKK ihlali.

**Önleme:**
- Log formatter: belirlenen alanlar otomatik maskelenir (email → `***@***.***`)
- Yapılandırılmış log şeması: sadece izin verilen alanlar (`tenant_id`, `user_id`, `latency_ms`, `status_code`) loglanır
- Log sanitizer unit testi: email içeren payload → logda maskelenmiş görünür

---

## 9. İzlenebilirlik Bağları (Prompt 5 Hazırlığı)

Her düğümde aşağıdaki alanlar Prompt 5-impl'de doldurulacaktır. Bu spec, hangi değerlerin bekleneceğini önceden tanımlar.

### 9.1 Beklenen İzlenebilirlik Alanları

Mevcut `TaskNodeSchema` alanları ile örtüşen değerler:

```
evidence:      [string]  -- CI pipeline URL, deploy log URL, axe-core rapor URL
refs:          [string]  -- GitHub repo URL, ADR numarası, Grafana dashboard URL
rollback:      string    -- Geri-alma komutu veya runbook URL'si
metrics:       [{key, target}]  -- "p95_latency_ms → <200", "test_coverage → >=80%"
```

Mevcut şemada doğrudan karşılığı olmayan ancak evidence içine string olarak eklenebilecek değerler:

```
repoPath:      "platform/backend/app/customer"    -- evidence[0] olarak
testCommand:   "pytest tests/customer/ -v"         -- evidence[1] olarak
deployTarget:  "hetzner-prod-01/platform"          -- evidence[2] olarak
```

### 9.2 Örnek Doldurulmuş evidence Alanı

```json
"evidence": [
  "repoPath:platform/backend/app/customer",
  "testCommand:pytest tests/customer/ -v",
  "deployTarget:hetzner-prod-01/platform",
  "ci:https://github.com/org/platform/actions/runs/12345",
  "a11y:axe-core 0 violations — 2026-07-15"
]
```

Bu format, mevcut `evidence: z.array(z.string())` şemasıyla tam uyumludur. Prompt 5-schema aşamasında `repoPath`, `testCommand`, `deployTarget` alanları `TaskNodeSchema`'ya eklenirse bu değerler doğrudan taşınır.

---

## 10. Veri Modeline Ekleme Yaklaşımı

Bu spec'teki düğümler Prompt 4-impl adımında actionplan'ın `src/data/generated/nodes/` dizinine JSON dosyaları olarak eklenecektir.

### 10.1 Önerilen Yaklaşım: Generator Script

Sabit bir ingest kaynak dosyası yerine, mevcut paternle uyumlu bir generator scripti tercih edilir. Gerekçe:

- Mevcut kodta `src/data/generated/nodes/` zaten script çıktısı olarak oluşturulmuş görünmektedir (dosya adı kalıpları ve `"corpus": "synthetic"` değeri bunu desteklemektedir)
- 13 düğüm için ayrı ayrı JSON dosyası yazmak yerine tek bir kaynak YAML/JSON → validation → dosyalar üretimi daha güvenilirdir

Önerilen akış (Prompt 4-impl için):

```
platform-wbs-plan.md (bu dosya)
        ↓
scripts/generate-platform-nodes.ts (veya .py)
  - Bu spec'teki düğüm tanımlarını alır
  - Her düğüm için TaskNodeSchema.parse() doğrulaması yapar
  - makeSkeletonDimensions() + makeSkeletonPhases() ile iskelet doldurur
  - src/data/generated/nodes/platform-*.json dosyalarını yazar
        ↓
src/data/generated/nodes/platform-factory.json
src/data/generated/nodes/platform-tenancy.json
... (13 dosya)
```

Bu yaklaşım:
- Şema doğrulamasını garanti eder (uydurma alan sızmaz)
- `schemaVersion: "1.0.0"` tutarlılığını sağlar
- Gelecekte spec değişikliğinde tek yerden güncellenir

### 10.2 Alternatif: Manuel JSON Dosyaları

Eğer Prompt 4-impl generator script yazmak istemiyorsa, bu spec'teki her düğüm tablosunu doğrudan JSON'a dönüştürmek yeterlidir. Zorunlu kontrol: her dosyayı `TaskNodeSchema.parse()` ile doğrulama.

---

## 11. Açık Kararlar ve Çelişkiler

### 11.1 Schema-per-Tenant vs Row-Level Security

Bu spec her ikisini de geçerli seçenek olarak tutmaktadır. Karar bir ADR (adr-0026 rezerve) olarak kaydedilmelidir. Tavsiye:

- 50'den az tenant: schema-per-tenant (güçlü izolasyon, basit migration)
- 50+ tenant: RLS (ölçeklenebilirlik, ancak uygulama katmanı hatalarına karşı dikkat)

Platform build-out başlangıcı RLS ile gidebilir; ihtiyaç halinde migrate edilir.

### 11.2 wbsCode 30.1.1 parentId Tutarsızlığı

`platform-customer-model` (30.1.1) iki modüle bağlıdır: `platform-db-schema` (mantıksal ebeveyn) ve `platform-tenancy` (bağımlılık). Mevcut şemada `parentId` tekil bir değerdir. Çözüm: `parentId: "platform-db-schema"`, `dependsOn: ["platform-tenancy"]`. Bu spec bu çözümü uygulamıştır.

### 11.3 ECA Kuralları

Bu spec'te ECA kuralları iskelet olarak bırakılmıştır. Prompt 4-impl'de mevcut node'lardaki ECA kalıpları (ai-generation-deny, status-changed-notify, progress-complete) aynen platform düğümlerine de uygulanmalıdır.

---

*Son güncelleme: 2026-06-28. Prompt 4-impl bu spec'i esas alarak düğümleri oluşturacaktır.*
