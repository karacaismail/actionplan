# Core Contract Pack v1

Bu doküman `platform` monoreposunun normatif çekirdek sözleşmesidir. Her uygulama (dikey dilim) bu sözleşmeye uymak zorundadır. App sayfalarındaki "Kernel/Core Entegrasyonu" başlığı bu pakete dayanır ve buradaki checklist ile doğrulanır.

Son güncelleme: 2026-06-29
Versiyon: 1.0.0
Durum: Yürürlükte

---

## 1. Repo Kararı: Tek `platform` Monorepo

Tüm platform kodu tek bir private GitHub reposunda yaşar. Repo adı: `platform`. Ayrı repo açmak yasaktır; yeni bir uygulama yeni bir Python paketi / frontend workspace'i olarak bu repoya eklenir.

### Klasör İskeleti

| Dizin | Sorumluluk |
|---|---|
| `backend/` | FastAPI servisleri, GraphQL resolver'ları, SQLAlchemy modelleri, Alembic migration'ları, Celery task'ları |
| `frontend/` | React + Vite uygulaması; her dikey dilim `frontend/apps/<app-slug>/` altında ayrı workspace |
| `infra/` | Dockerfile'lar, Kubernetes manifest'leri, GitHub Actions workflow'ları, Hetzner + Debian konfigürasyonları |
| `tests/` | Çapraz-servis entegrasyon ve E2E testleri; her servisin kendi birim testleri `backend/<pkg>/tests/` altındadır |
| `docs/` | ADR'ler, sözleşme dokümanları, runbook'lar; bu dosya dahil |
| `scripts/` | Tek seferlik migration yardımcıları, local dev bootstrap, veri tohumlama araçları |

Backend paket adlandırma: `platform_<slug>` (örn. `platform_tenancy`, `platform_authn_authz`).
Frontend workspace adlandırma: `@platform/<slug>` (örn. `@platform/ui-surface`, `@platform/customer`).

Stack kısıtları (mutlak yasak):

- Next.js kullanılamaz.
- Supabase kullanılamaz.
- Üretim veritabanı olarak PostgreSQL dışı motor kullanılamaz.
- ORM olarak SQLAlchemy 2.0 / SQLModel dışı araç kullanılamaz.

---

## 2. Kernel Sözleşmeleri

Her sözleşme üç bölümden oluşur: amaç, arayüz taslağı / imza, uygulamanın nasıl tükettiği.

---

### 2.1 Tenant Context

**Amaç.** Her veritabanı sorgusu, her GraphQL resolver ve her arka plan görevi yalnızca kendi kiracısının verisini görür. Kiracı bağlamı eksikse istek reddedilir (fail-closed).

**Arayüz taslağı.**

```python
# backend/platform_tenancy/context.py

from contextvars import ContextVar
from uuid import UUID

_tenant_id: ContextVar[UUID | None] = ContextVar("tenant_id", default=None)

def get_tenant_id() -> UUID:
    tid = _tenant_id.get()
    if tid is None:
        raise TenantContextMissingError("Tenant bağlamı kurulmamış")
    return tid

def set_tenant_id(tenant_id: UUID) -> None:
    _tenant_id.set(tenant_id)

# FastAPI bağımlılığı
async def require_tenant(request: Request) -> UUID:
    """Her endpoint'e Depends(require_tenant) olarak enjekte edilir."""
    tid = request.headers.get("X-Tenant-ID")
    if not tid:
        raise HTTPException(status_code=401, detail="tenant_missing")
    try:
        uid = UUID(tid)
    except ValueError:
        raise HTTPException(status_code=422, detail="tenant_format_invalid")
    set_tenant_id(uid)
    return uid
```

**SQLAlchemy oturum kilitleme.**

```python
# Her SQLAlchemy oturumu açılırken tenant_id set edilir.
# Schema-per-tenant modunda:  SET search_path TO <tenant_schema>
# RLS modunda:                SET app.current_tenant = '<uuid>'
# Oturum fabrikası bu ayarı otomatik uygular; resolver doğrudan session.execute() çağırabilir.
```

**Uygulama tüketimi.** Dikey uygulama `from platform_tenancy import require_tenant` importu yapar ve tüm router'larında `Depends(require_tenant)` kullanır. Tenant ID'yi HTTP header'dan veya başka bir kaynaktan doğrudan okumak yasaktır.

**Güvenlik sınırı.** Cross-tenant sorgu girişimi `TenantViolationError` fırlatır ve audit log'a yazılır. PostgreSQL RLS politikası `USING (tenant_id = current_setting('app.current_tenant')::uuid)` ile ikinci bir bariyer oluşturur.

---

### 2.2 Identity / AuthZ

**Amaç.** JWT tabanlı kimlik doğrulama ve tenant kapsamlı RBAC. Her GraphQL resolver yetki direktifleriyle korunur; direktif eksik resolver'lar CI'da reddedilir.

**Token yapısı.**

```
{
  "sub": "<user_uuid>",
  "tenant_id": "<tenant_uuid>",
  "roles": ["admin"],
  "exp": <unix_timestamp>,
  "jti": "<uuid>"
}
```

Algoritma: RS256 zorunlu. HS256 Bandit kuralı ve CI lint ile engellenir.
Access token ömrü: 15 dakika. Refresh token ömrü: 7 gün (rotation zorunlu).
Token boyutu hedefi: en fazla 1 KB. İzin listesi token'a gömülmez; runtime'da Redis önbelleğinden çözülür.

**GraphQL yetki direktifi.**

```python
# backend/platform_authn_authz/permissions.py

import strawberry
from strawberry.permission import BasePermission

class RequirePermission(BasePermission):
    """
    Kullanım:
        @strawberry.field(permission_classes=[RequirePermission("customer:write")])
        async def create_customer(...) -> CustomerType: ...
    """
    message = "Yetersiz yetki"

    def __init__(self, permission: str):
        self.permission = permission

    def has_permission(self, source, info, **kwargs) -> bool:
        user = info.context["user"]
        tenant_id = info.context["tenant_id"]
        return resolve_permission(user, tenant_id, self.permission)
```

**RBAC modeli.** Kullanıcıya tenant kapsamlı roller atanır: `admin`, `editor`, `viewer`, `custom`. Her rol bir izin setiyle eşleşir. İzin seti Redis'te `rbac:{tenant_id}:{role}` anahtarıyla önbelleklenir (TTL=300 saniye).

**Uygulama tüketimi.**

```python
from platform_authn_authz import RequirePermission, require_auth
# Her resolver'a:
#   permission_classes=[RequirePermission("resource:action")]
# Her FastAPI endpoint'e:
#   Depends(require_auth)
```

Özel yetki mantığı yazmak yasaktır. Yeni rol eklemek için `platform_authn_authz` paketine PR açılır.

---

### 2.3 Event Bus + Outbox

**Amaç.** Servisler arası güvenilir mesajlaşma. Veritabanı ve mesaj kuyruğu aynı transaction içinde yazılarak kayıp mesaj önlenir (transactional outbox pattern).

**Outbox tablo yapısı.**

```sql
CREATE TABLE platform_outbox (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    event_type  TEXT NOT NULL,
    payload     JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    status      TEXT NOT NULL DEFAULT 'pending'  -- pending | sent | failed
);
```

**Yayıncı arayüzü.**

```python
# backend/platform_events/publisher.py

class EventPublisher:
    async def publish(
        self,
        session: AsyncSession,
        event_type: str,
        payload: dict,
        tenant_id: UUID,
    ) -> None:
        """
        Outbox tablosuna yazma ve session.commit() çağrısı aynı transaction'dadır.
        Arka plan worker outbox'ı okuyarak Redis Streams'e iletir.
        """
```

**Tüketici arayüzü.**

```python
# backend/platform_events/consumer.py

class EventConsumer:
    async def subscribe(self, event_type: str, handler: Callable) -> None:
        """Redis Streams üzerinden mesaj tüketir."""
```

**Uygulama tüketimi.** Mutation başarıyla tamamlandıktan sonra `EventPublisher.publish()` çağrılır. Aynı transaction garantisi için `session` bağımlılığı geçirilir. Direkt Redis/Kafka çağrısı yapmak yasaktır.

---

### 2.4 ECA Runtime

**Amaç.** Event-Condition-Action kurallarını çalıştıran, actionplan ECA paketleriyle uyumlu runtime. Kural motoru tenant başına JSON kural deposundan okur.

**Kural formatı.**

```json
{
  "rule_id": "customer-welcome-email",
  "tenant_id": "<uuid>",
  "event": "customer.created",
  "conditions": [
    {"field": "payload.customer_type", "op": "eq", "value": "B2C"}
  ],
  "actions": [
    {"type": "send_email", "template": "welcome", "to": "{{payload.email}}"}
  ],
  "enabled": true
}
```

**Runtime arayüzü.**

```python
# backend/platform_eca/runtime.py

class ECARuntime:
    async def evaluate(
        self,
        event_type: str,
        payload: dict,
        tenant_id: UUID,
    ) -> list[ActionResult]:
        """
        1. Tenant'a ait etkin kuralları yükler (Redis önbelleği TTL=60s).
        2. Her kural için koşulları değerlendirir.
        3. Eşleşen kuralların aksiyonlarını sıraya alır.
        4. Her tetiklenme event_log tablosuna yazılır.
        """
```

**Uygulama tüketimi.** Event Bus'tan gelen her mesaj ECA runtime'a iletilir. Uygulama kendi kural motorunu yazmaz; kural tanımlarını GraphQL üzerinden platform ECA deposuna ekler.

---

### 2.5 Audit Log

**Amaç.** Tüm durum değiştiren işlemler append-only, değiştirilemez kayıt altına alınır. KVKK uyumu için en az 2 yıl saklanır.

**Tablo yapısı.**

```sql
CREATE TABLE platform_audit_log (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    actor_id     UUID,                    -- NULL ise sistem aksiyonu
    actor_type   TEXT NOT NULL,           -- 'user' | 'system' | 'agent'
    resource     TEXT NOT NULL,           -- 'customer', 'tenant', ...
    resource_id  UUID,
    action       TEXT NOT NULL,           -- 'create', 'update', 'delete', 'login_failed', ...
    old_value    JSONB,
    new_value    JSONB,
    ip_address   INET,
    trace_id     TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Değiştirilemezlik: UPDATE ve DELETE kısıtlanır.
REVOKE UPDATE, DELETE ON platform_audit_log FROM PUBLIC;
```

**Kayıt arayüzü.**

```python
# backend/platform_audit/logger.py

class AuditLogger:
    async def log(
        self,
        session: AsyncSession,
        action: str,
        resource: str,
        resource_id: UUID | None = None,
        old_value: dict | None = None,
        new_value: dict | None = None,
    ) -> None:
        """Actor ve tenant bilgisi contextvars'tan otomatik alınır."""
```

**Uygulama tüketimi.** Her durum değiştiren mutation veya endpoint `AuditLogger.log()` çağırır. Ham kayıt üretmek yasaktır; tüm kayıtlar bu sınıf üzerinden geçer.

---

### 2.6 Archetype Registry

**Amaç.** Platform, farklı iş modellerini (B2B, B2C, marketplace, SaaS) desteklemek için archetype soyutlaması kullanır. Her archetype, tenant başına aktif edilen özellik ve kural setini tanımlar.

**Registry arayüzü.**

```python
# backend/platform_archetype/registry.py

class ArchetypeRegistry:
    def register(self, archetype: ArchetypeDefinition) -> None:
        """Yeni archetype paketi ekler."""

    def get_for_tenant(self, tenant_id: UUID) -> ArchetypeDefinition:
        """Tenant'ın aktif archetype'ını döner; bulunamazsa DefaultArchetype."""

    def list_available(self) -> list[ArchetypeDefinition]:
        """Tenant'ın seçebileceği archetype listesi."""
```

**Uygulama tüketimi.** Dikey uygulama archetype farkına göre davranış değiştiriyorsa `ArchetypeRegistry.get_for_tenant()` kullanır. Archetype'ı doğrudan tenant config tablosundan okumak yasaktır.

---

### 2.7 Workflow Registry

**Amaç.** Çok adımlı iş süreçlerini (sipariş, onboarding, fatura) tanımlayan iş akışlarını merkezi depoda tutar ve ECA ile entegre çalıştırır.

**Registry arayüzü.**

```python
# backend/platform_workflow/registry.py

class WorkflowRegistry:
    def register(self, workflow: WorkflowDefinition) -> None:
        """Yeni iş akışı tanımı ekler."""

    def start(
        self,
        workflow_id: str,
        context: dict,
        tenant_id: UUID,
    ) -> WorkflowInstance:
        """Yeni iş akışı örneği başlatır; state platform_workflow_state tablosuna yazılır."""

    def advance(self, instance_id: UUID, event: str, payload: dict) -> WorkflowInstance:
        """Mevcut adımdan sonraki adıma geçirir."""
```

**Uygulama tüketimi.** İş akışı başlatmak için `WorkflowRegistry.start()` kullanılır. State doğrudan veritabanına yazmak yasaktır.

---

### 2.8 Migration Policy

**Amaç.** Veritabanı şema değişiklikleri geri alınabilir, adım adım (expand-contract) ve sıfır kesintili olmalıdır.

**Kurallar.**

| Kural | Açıklama |
|---|---|
| Expand-contract | Önce yeni kolon/tablo eklenir (expand), uygulama her ikisini yazarken okur, eski yapı kaldırılır (contract). Tek migration'da hem ekle hem sil yasaktır. |
| Reversible | Her migration'ın `downgrade()` fonksiyonu çalışır ve veri kaybetmez. CI'da `alembic downgrade -1` otomatik test edilir. |
| Rollback | Başarısız migration otomatik rollback tetikler; deploy durdurulur. |
| İndeks zorunluluğu | `tenant_id` içeren her tablo `(tenant_id, created_at DESC)` bileşik indeksine sahip olmalıdır. Migration lint bu indeksi kontrol eder. |
| Büyük tablo | 1 milyon satır üzeri tablo değişikliği için `CREATE INDEX CONCURRENTLY` ve `ALTER TABLE ... ADD COLUMN DEFAULT NULL` pattern'ı kullanılır. |
| Multi-tenant | Schema-per-tenant modunda Alembic orkestratörü her kiracı şemasına bağımsız migration uygular; başarısız kiracı migrasyonu diğerlerini durdurmaz. |

**Migration imza standardı.**

```python
# Alembic migration dosyası başlığı zorunlu alanlar:
# revision: str
# down_revision: str | None
# branch_labels: tuple | None
# depends_on: tuple | None
# Açıklama: tek cümle, ne değiştiğini açıklar

def upgrade() -> None: ...

def downgrade() -> None: ...  # Boş bırakmak yasaktır.
```

---

### 2.9 Observability

**Amaç.** Her istek izlenebilir, ölçülebilir ve loglanabilir olmalıdır. Farklı sinyaller tek bir correlation ID ile ilişkilendirilir.

**Üç sinyal ve araç.**

| Sinyal | Araç | Zorunlu alanlar |
|---|---|---|
| Structured log | structlog + JSON formatter | `trace_id`, `tenant_id`, `user_id`, `level`, `event`, `timestamp` |
| Metrik | Prometheus + OpenTelemetry | `tenant_id` label zorunlu; p95/p99 histogram her endpoint için |
| Trace | OpenTelemetry + Jaeger | Her span'da `tenant_id`, `user_id`, `db.statement` (sanitize edilmiş) |

**Correlation ID akışı.**

```
İstek gelir
  → X-Request-ID header yoksa UUID üretilir
  → trace_id olarak contextvars'a set edilir
  → Tüm log satırları, span'lar ve metrik etiketleri bu ID'yi taşır
  → Yanıt header'ında X-Request-ID olarak geri döner
```

**Arayüz taslağı.**

```python
# backend/platform_observability/context.py

from contextvars import ContextVar
import structlog

_trace_id: ContextVar[str] = ContextVar("trace_id", default="")

def get_logger(name: str) -> structlog.BoundLogger:
    return structlog.get_logger(name).bind(
        trace_id=_trace_id.get(),
        tenant_id=str(get_tenant_id()),
    )
```

**Uygulama tüketimi.** `from platform_observability import get_logger` ile logger alınır. `print()` veya standart `logging` doğrudan kullanımı yasaktır.

---

### 2.10 Module SDK

**Amaç.** Bir dikey uygulamanın (modülün) core'a bağlanmak için uygulaması gereken minimum arayüzü tanımlar.

**AppModule arayüzü.**

```python
# backend/platform_sdk/module.py

from abc import ABC, abstractmethod
from fastapi import FastAPI

class AppModule(ABC):
    """
    Her dikey uygulama bu sınıfı miras alır ve metotları uygular.
    """

    @property
    @abstractmethod
    def slug(self) -> str:
        """Modül tanımlayıcısı. Örn: 'customer', 'invoice'. Benzersiz olmalıdır."""

    @property
    @abstractmethod
    def version(self) -> str:
        """Semantic version. Örn: '1.0.0'"""

    @abstractmethod
    def register_routes(self, app: FastAPI) -> None:
        """FastAPI router'larını uygulamaya ekler."""

    @abstractmethod
    def register_graphql(self) -> tuple:
        """(queries, mutations, subscriptions) demetini döner."""

    @abstractmethod
    async def on_startup(self) -> None:
        """Uygulama başladığında çalışır; DB bağlantısı, önbellek ısıtma vb."""

    @abstractmethod
    async def on_shutdown(self) -> None:
        """Uygulama kapanırken temizlik işleri."""

    def healthz(self) -> dict:
        """Sağlık kontrolü. Varsayılan: {"status": "ok", "module": self.slug}"""
        return {"status": "ok", "module": self.slug}
```

**Kayıt mekanizması.**

```python
# backend/platform_sdk/registry.py

class ModuleRegistry:
    _modules: dict[str, AppModule] = {}

    @classmethod
    def register(cls, module: AppModule) -> None:
        if module.slug in cls._modules:
            raise DuplicateModuleError(module.slug)
        cls._modules[module.slug] = module

    @classmethod
    def get_all(cls) -> list[AppModule]:
        return list(cls._modules.values())
```

**Uygulama tüketimi.**

```python
# backend/platform_customer/module.py

from platform_sdk import AppModule, ModuleRegistry

class CustomerModule(AppModule):
    slug = "customer"
    version = "1.0.0"

    def register_routes(self, app): ...
    def register_graphql(self): ...
    async def on_startup(self): ...
    async def on_shutdown(self): ...

ModuleRegistry.register(CustomerModule())
```

---

## 3. Core Standartları

### 3.1 API Hata Formatı

Tüm hata yanıtları aynı yapıyı kullanır. Farklı format üretmek yasaktır.

**HTTP hata yanıtı (FastAPI).**

```json
{
  "error": {
    "code": "tenant_missing",
    "message": "Kiracı bağlamı bulunamadı.",
    "trace_id": "01933a7b-1234-7abc-abcd-000000000001",
    "details": []
  }
}
```

**GraphQL hata yanıtı.**

```json
{
  "errors": [
    {
      "message": "Yetersiz yetki",
      "extensions": {
        "code": "FORBIDDEN",
        "trace_id": "01933a7b-1234-7abc-abcd-000000000001"
      }
    }
  ],
  "data": null
}
```

| Alan | Tip | Açıklama |
|---|---|---|
| `code` | string | Makine okunabilir hata kodu; snake_case |
| `message` | string | İnsan okunabilir Türkçe açıklama |
| `trace_id` | string | Correlation ID; her yanıtta zorunlu |
| `details` | array | Alan düzeyi validasyon hataları; `[{"field": "email", "message": "Geçersiz format"}]` |

HTTP durum kodları: 400 validasyon, 401 kimlik doğrulama yok, 403 yetki yok, 404 kaynak yok, 409 çakışma, 422 format hatası, 429 rate limit, 500 sistem hatası.

---

### 3.2 GraphQL Şema Standartları

| Kural | Uygulama |
|---|---|
| Versiyonlama | SDL kırıcı değişiklik tespiti CI'da schema-registry ile otomatik yapılır; kırıcı değişiklik deploy'u engeller |
| Naming | Query: `camelCase`. Tip: `PascalCase`. Field: `camelCase`. Enum değer: `SCREAMING_SNAKE_CASE` |
| Sayfalama | Cursor tabanlı (Relay Connection spec); `first/after` zorunlu; `offset/limit` yasaktır |
| Derinlik sınırı | Maksimum 7 seviye; aşımda 400 hatası |
| Üretim introspection | Devre dışı; yalnızca geliştirme ortamında açıktır |
| Resolver koruması | Her resolver en az bir `permission_classes` içerir; eksik direktif CI'da engellenir |
| Hassas alan | `@sensitive` direktifi ile işaretlenir; log'a ham değer yazılmaz |

---

### 3.3 DB Migration ve Rollback Standardı

| Adım | Kural |
|---|---|
| Yeni migration | `alembic revision --autogenerate -m "<tek cümle açıklama>"` |
| Expand aşaması | Yeni kolon `nullable=True` veya default değerle eklenir |
| Contract aşaması | Eski kolon yalnızca tüm uygulama instance'ları yeni kolondan okuyorsa kaldırılır |
| Downgrade testi | CI'da `alembic upgrade head && alembic downgrade -1` otomatik çalışır |
| Üretim uygulama | `alembic upgrade head` deploy init container'ında çalışır; başarısız olursa deployment iptal edilir |
| Büyük tablo lock | `LOCK TABLE` gerektiren işlem maintenance window'da ve `pg_advisory_lock` ile korunarak yapılır |

---

### 3.4 UI Shell ve Design Token Kullanımı

| Kural | Uygulama |
|---|---|
| Token sistemi | Tüm renk, tipografi, aralık değerleri `--token-*` CSS custom property'si olarak tanımlıdır |
| Hard-coded değer | Hard-coded renk veya boyut yasaktır; CI ESLint `no-hardcoded-color` kuralıyla engellenir |
| Shell yükü | Her route ayrı async chunk; ana bundle (gzip) 150 KB sınırı; aşım CI'da build'i reddeder |
| Dokunmatik hedef | Minimum 44x44 CSS piksel (WCAG 2.5.8) |
| Kontrastı | Normal metin en az 4.5:1, büyük metin en az 3:1 (WCAG 2.2 AA) |
| Focus göstergesi | `focus-visible` 2px outline; tüm interaktif öğelerde zorunlu |
| Token kaynağı | `@platform/design-tokens` paketi; dikey uygulama bu paketi import eder, yerel token dosyası oluşturmaz |

---

### 3.5 Test Piramidi

| Katman | Araç | Kapsam hedefi | Çalışma zamanı |
|---|---|---|---|
| Birim | pytest / Vitest | >= %80 satır | Her commit |
| Entegrasyon | pytest + PostgreSQL testcontainer | Kritik akışlar | Her PR |
| E2E | Playwright | Kritik kullanıcı yolculukları | Her PR |
| Contract | Strawberry test client + SDL diff | %100 resolver | Her PR |
| Erişilebilirlik | axe-core | Sıfır critical bulgu | Her PR |
| Güvenlik | Bandit + npm audit | Sıfır critical | Her commit |

Kural: negatif test (yetkisiz erişim, geçersiz tenant) her pozitif test kadar zorunludur. Cross-tenant sızıntı senaryosu en az 10 test case ile kapsanır.

---

### 3.6 Güvenlik Kapısı Listesi (OWASP)

| OWASP kategori | Platform mekanizması | CI kapısı |
|---|---|---|
| A01 Broken Access Control | RLS + require_tenant + RequirePermission | Eksik direktif build'i kırar |
| A02 Cryptographic Failures | RS256 zorunlu, pgcrypto hassas kolon | Bandit HS256 kullanımını reddeder |
| A03 Injection | SQLAlchemy ORM parametreli sorgu zorunlu | Bandit ham SQL birleştirmeyi reddeder |
| A04 Insecure Design | Threat model belgesi + ADR | Her yeni modül threat model içermek zorunda |
| A05 Security Misconfiguration | DEBUG=False startup kontrolü, introspection kapalı | Startup guard eksik ise uygulama başlamaz |
| A07 Auth Failures | Refresh rotation + brute force kilit (5 hata = 15 dk) | Refresh reuse tüm oturumları kapatır |
| A09 Security Logging | structlog JSON, audit log append-only | Her 401/403 loglanır; eksik log CI'da uyarı |

---

### 3.7 Release ve Deploy Standardı

| Adım | Kural |
|---|---|
| Branch | `feature/<slug>` veya `fix/<slug>`; doğrudan `main` commit yasaktır |
| PR | En az 1 reviewer, CI tüm adımlar yeşil, kapsam hedefi sağlanmış |
| Versiyonlama | Semantic versioning; kırıcı değişiklik = major bump |
| Build | Docker multi-stage; üretim image <=150 MB |
| Deploy | Hetzner + Debian + Docker; GitHub private repo'dan otomatik deploy |
| Migration | Init container'da `alembic upgrade head`; başarısız = rollback |
| Healthz | `/healthz` liveness, `/ready` readiness; her modül uygulamalıdır |
| Smoke test | Deploy sonrası 10 kritik GraphQL sorgusu çalışır; başarısızlık önceki sürüme döner |
| Canary | Büyük değişikliklerde %5 trafik yeni sürüme yönlendirilir; hata oranı >%0.1 ise otomatik rollback |

---

## 4. "Hello Platform" — Minimum Çalışan İskelet

Bu bölüm, platform'u sıfırdan ayağa kaldırmak için minimum bileşenleri tarif eder. Dosya oluşturulmaz; ne yapılacağı açıklanır.

### Adım 1. Repo ve Paket Yapısı

`platform` monorepo oluştur. `backend/platform_tenancy/`, `backend/platform_authn_authz/`, `backend/platform_observability/`, `backend/platform_sdk/` paketleri için dizin yapısını kur. Her paket `__init__.py` ve `pyproject.toml` içerir. `frontend/apps/shell/` workspace'ini ekle.

### Adım 2. Temel FastAPI Uygulaması

`backend/main.py` içinde FastAPI uygulaması oluştur. Lifespan event'inde tüm `AppModule` instance'larını `ModuleRegistry`'den alarak `register_routes()` ve `on_startup()` çağır. `/healthz` endpoint'ini ekle; tüm kayıtlı modüllerin `healthz()` yanıtlarını birleştirerek döner.

### Adım 3. TenantContext Middleware

`require_tenant` bağımlılığını FastAPI global middleware olarak değil, yalnızca tenant gerektiren endpoint'lerde `Depends(require_tenant)` olarak ekle. Global middleware yaklaşımı `/healthz` gibi ortak endpoint'leri kırar.

### Adım 4. İlk Tenant-Aware Sorgu

`backend/platform_customer/` paketi içinde `Customer` SQLAlchemy modeli oluştur; `tenant_id` UUID kolonu ve `(tenant_id, created_at DESC)` bileşik indeksi zorunludur. Alembic migration yaz (expand pattern). Strawberry GraphQL tipi ve `CustomerQuery` resolver'ı oluştur; resolver `require_tenant` ve `RequirePermission("customer:read")` ile korunur. `CustomerModule`'u `ModuleRegistry`'ye kaydet.

### Adım 5. React Shell

`frontend/apps/shell/` içinde Vite + React projesi oluştur. TanStack Router ile iki route tanımla: `/` (dashboard) ve `/customers`. `@platform/design-tokens` paketini import et. TanStack Query ile GraphQL `CustomerList` sorgusunu bağla. Route loader'da sorgu prefetch et.

### Adım 6. Doğrulama

`/healthz` endpoint'ini çağır; tüm modüller `"status": "ok"` döndürmeli. `CustomerList` GraphQL sorgusunu geçerli JWT ve `X-Tenant-ID` header ile çağır; kayıtlar dönmeli. Geçersiz tenant ile aynı sorguyu tekrar çağır; 401 dönmeli. React shell'de `/customers` rotasını aç; liste render edilmeli.

---

## 5. Bir App'in Core'a Bağlanma Checklist'i

App sayfasındaki "Kernel/Core Entegrasyonu" maddesi, aşağıdaki tüm kalemler tamamlandığında doğrulanmış sayılır.

| # | Kalem | Doğrulama yöntemi |
|---|---|---|
| 1 | `AppModule` miras alınmış ve `ModuleRegistry`'ye kayıtlı | `ModuleRegistry.get_all()` modülü içeriyor |
| 2 | Tüm endpoint'lerde `Depends(require_tenant)` var | CI: `check-core-contract.mjs` tenant guard taraması |
| 3 | Tüm GraphQL resolver'larında `permission_classes` var | CI: Strawberry şema analizi |
| 4 | Her SQLAlchemy modelinde `tenant_id` kolonu ve indeksi var | Alembic migration lint |
| 5 | `AuditLogger.log()` tüm mutasyon endpoint'lerinde çağrılıyor | CI: statik analiz |
| 6 | Loglar `get_logger()` ile üretiliyor; `print()` yok | CI: Bandit + grep kuralı |
| 7 | Migration'ların `downgrade()` fonksiyonu dolu ve CI'da test edilmiş | `alembic downgrade -1` CI adımı |
| 8 | `/healthz` ve `/ready` endpoint'leri uygulanmış | Kubernetes readiness probe testi |
| 9 | Frontend token'ları `@platform/design-tokens` paketinden alıyor | ESLint `no-hardcoded-color` |
| 10 | Negatif test (cross-tenant sızıntı) en az 10 case ile yazılmış | pytest raporu |
| 11 | OWASP A01/A03/A05 CI kapıları geçilmiş | CI özeti |
| 12 | Modülün threat model belgesi `docs/` altında mevcut | PR inceleme kuralı |

---

## 6. Makine Doğrulaması: `check-core-contract.mjs`

Bu script ileride `scripts/check-core-contract.mjs` olarak yazılacaktır. Aşağıdaki kontrolleri gerçekleştirmelidir.

| Kontrol | Yöntem |
|---|---|
| Tenant guard varlığı | `backend/**/*.py` dosyalarında `@router.*` veya `async def` içeren satırların `require_tenant` veya `Depends(require_tenant)` içerip içermediğini kontrol et; içermeyenleri listele |
| Resolver koruması | Strawberry şema SDL'ini parse et; `permission_classes` içermeyen field tanımlarını raporla |
| `tenant_id` kolon varlığı | Tüm SQLAlchemy model dosyalarını tara; `tenant_id` kolonu olmayan `Base` alt sınıflarını listele |
| Migration downgrade | `downgrade()` gövdesi `pass` olan migration dosyalarını tespit et |
| Hardcoded renk | `frontend/**/*.tsx` ve `frontend/**/*.css` dosyalarında `#[0-9a-fA-F]{3,6}` ve `rgb(` pattern'larını ara; `var(--token-` olmayan renk kullanımlarını raporla |
| Logger kullanımı | `backend/**/*.py` dosyalarında `print(` çağrılarını tespit et |
| Bundle boyutu | Vite build çıktısında gzip sonrası 150 KB sınırını aşan chunk'ları raporla |
| Audit log çağrısı | Mutation endpoint'lerinde (HTTP POST/PUT/PATCH/DELETE veya GraphQL mutation) `audit_logger.log` çağrısı eksikse listele |

Script çıkış kodu: tüm kontroller geçilirse 0, herhangi biri başarısız olursa 1. CI pipeline'ında `npm run check-contract` adımı olarak çalışır ve başarısızlık deploy'u engeller.

---

## Notlar ve Çelişki Kaydı

Mevcut platform-content JSON'larından türetilen çelişki veya belirsizlikler:

1. **Schema-per-tenant / RLS geçiş eşiği.** `platform-tenancy.json` ADR-0026 50 kiracı eşiği belirtiyor. Bu sözleşme o eşiği tekrar eder; eşik değişirse ADR-0026 güncellenmeli ve bu dosyanın 2.1 bölümü revize edilmeli.

2. **Redis Streams / RabbitMQ / Kafka.** platform-factory, platform-events ve platform-customer-graphql JSON'larında üç farklı mesajlaşma altyapısı yer alıyor. Bu sözleşme Event Bus için birincil araç olarak Redis Streams'i kullanıyor (basitlik ve mevcut Redis bağımlılığıyla uyum). Kafka entegrasyonu yüksek hacimli event akışı için ileride eklenebilir; bu durumda EventPublisher arayüzü transport-agnostic kalacak şekilde tasarlandığından uygulama değişikliği gerekmez.

3. **Observability backend.** platform-tenancy JSON'ı OpenTelemetry + Jaeger, platform-customer-graphql Prometheus ifade ediyor. Bu sözleşme her ikisini de içerir: metrik Prometheus, trace OpenTelemetry + Jaeger, log structlog.

4. **GraphQL istemci (Apollo / urql / TanStack Query).** platform-ui-surface JSON'ı her ikisini de anıyor. Bu sözleşme TanStack Query'yi GraphQL sorgularının state yönetim katmanı olarak, urql veya Apollo'yu transport olarak kullanmayı önerir; nihai seçim frontend ADR'ine bırakılmış olup bu sözleşme transport katmanını soyutlar.
