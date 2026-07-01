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

---

## 3. Core Contract Pack v2 — Yeni Primitif Sözleşmeleri

Bu bölüm, v1 çekirdeğinin üzerine ~50 kurumsal uygulamayı (ERP, MES, PIM, e-ticaret, lojistik, üretim çizelgeleme, vergi/muhasebe) tek platformdan besleyebilmek için gereken 15 yeni kernel primitifini normatif sözleşmeye bağlar. v1'deki her şey (Tenant Context, Identity/AuthZ, Event Bus, ECA, Audit, Archetype/Workflow Registry, Migration Policy, Observability, Module SDK) yürürlüktedir; buradaki primitifler onların **üzerine oturur**, onları tekrarlamaz. Bir uygulama bir primitife dokunuyorsa, o primitifin sözleşmesine uymak zorundadır ve `check-core-contract.mjs` (v2'de genişletilecek) bunu doğrular.

Son güncelleme: 2026-07-01
Bölüm versiyonu: 2.0.0
Durum: Yürürlükte (v1 ile birlikte)

### 3.0 Neden Bu 15 Primitif? (Karar Gerekçesi)

v1, "her app güvenli, çok-kiracılı, izlenebilir bir dikey dilimdir" sözünü verir. Ama v1 tek başına şu soruları **cevaplayamaz**: Bir faturaya gap-free numara nasıl verilir? Bir lot geri çağrıldığında hangi seri numaralarına gittiği nasıl bulunur? B2C bir mağaza runtime'da B2B'ye nasıl döner ve bu dönüş nasıl geri alınır? Bir MES bir PLC'ye bağlantı koptuğunda offline nasıl çalışır? Vergi hesabı serbest Python koduyla mı, yoksa denetlenebilir bir ifade grafiğiyle mi yapılır? Bu 15 primitif, bu "kurumsal-ağır" soruların her birini **serbest kod yerine sözleşmeye** bağlar. Ortak felsefe: davranış veri (policy-as-data, computation grafiği, formül kaydı) olarak yaşar, motor onu deterministik uygular, insan onaylar.

Karar: bu primitiflerin **hiçbiri** app tarafında yeniden yazılamaz. Bir app "kendi numaralandırmamı yaparım", "kendi vergi hesabımı koda gömerim", "kendi PLC senkronumu yazarım" derse, bu bir sözleşme ihlalidir ve reddedilir. Sebep, ölçek: 50 app × kendi implementasyonu = 50 kez tekrarlanan hata yüzeyi (özellikle para, stok, uyum). Tek motor = tek yerde doğrulanan invariant.

### 3.0.1 Ortak AI-Güvenlik İnvariantı (Tüm v2 Primitiflerinde Geçerli)

Bu bölümdeki her primitif, aşağıdaki dört-aktör iş bölümünü **değiştirilemez** biçimde uygular. Bunu her sözleşmede tekrar ederiz çünkü ihlali sessizdir ve pahalıdır:

| Aktör | Yapabildiği | Yapamadığı (fail-closed) |
|---|---|---|
| **AI (öneri motoru)** | Öneri üretir, taslak/plan çıkarır, dry-run simüle eder, anomali işaretler | Prod veriye doğrudan yazamaz; ruleset/policy/formül/sequence'ı doğrudan değiştiremez; onay adımını atlayamaz |
| **İnsan (yetkili kullanıcı)** | AI taslağını inceler, düzeltir, **onaylar** veya reddeder | Kendi başına motoru bypass edip ham yazamaz (yine sözleşmeli endpoint'ten geçer) |
| **Motor (platform runtime)** | Onaylanmış kararı deterministik uygular, audit'ler, geri-alınabilir kılar | İnsan onayı olmadan AI taslağını uygulamaz |
| **CI (doğrulama)** | Sözleşme ihlallerini build'de yakalar (eksik audit, serbest kod, kapatılmış default-on) | — |

Kısaca: **AI önerir → insan onaylar → motor uygular.** Hiçbir v2 primitifi, bir AI çıktısının (LLM ajan dahil) insan onay kapısı olmadan üretim durumunu değiştirmesine izin veren bir yol açamaz. Bu bir çağrı-yolu (call-path) kuralıdır; her primitifin `*Draft` / `*Proposal` tipi ile `*Applied` tipi arasında zorunlu bir `approval_ref` (onaylayan kullanıcı + zaman + gerekçe) taşınır. Onay referansı olmayan apply çağrısı `ApprovalRequiredError` fırlatır ve audit'lenir.

---

### 3.1 Actor / Party (`platform_actor`)

**Ne olduğu (1 cümle).** Sistemdeki her "taraf"ı (kişi, kurum, sistem hesabı, marka) tek bir soyutlamada temsil eden ve bu taraflara zaman-aralıklı, bağlam-kapsamlı roller bağlayan kayıt defteri.

**Karar gerekçesi.** v1 Identity yalnızca "login olan kullanıcı"yı tanır. Ama bir ERP'de fatura kesen taraf bir kurum, o kurumun temsilcisi bir kişi, siparişi işleyen ise bir sistem entegrasyonudur; üstelik bir kişi "1 Ocak–31 Mart arası satın alma müdürü" gibi zamanla değişen roller taşır. Rolü kullanıcıya statik gömmek (v1 `roles: ["admin"]`) bu gerçekliği taşıyamaz. Bu yüzden `platform_actor`, **kim** (Party) ile **ne yapabildiği** (RoleBinding) arasına zaman ve bağlam ekseni koyar.

**Jargon.** *Party*: rol taşıyabilen herhangi bir varlık (person/organization/system/brand). *RoleBinding*: bir party'ye, belirli bir bağlamda (örn. şu tenant, şu departman, şu proje), belirli bir zaman aralığında verilen rol. *ReBAC*: ilişki-tabanlı erişim (Relationship-Based Access Control) — "X, Y'nin yöneticisidir" gibi kenarlardan yetki türetir.

**İmza taslağı.**

```python
# backend/platform_actor/models.py

from enum import Enum
from datetime import datetime

class PartyKind(str, Enum):
    PERSON = "person"
    ORGANIZATION = "organization"
    SYSTEM = "system"        # entegrasyon/robot hesabı
    BRAND = "brand"          # tek tenant altında çoklu marka

class Party(Base):
    __tablename__ = "platform_party"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(index=True)   # v1 tenant zorunlu
    kind: Mapped[PartyKind]
    display_name: Mapped[str]
    # kişi ise platform_identity.user_id ile 1:1 köprü (opsiyonel)
    identity_user_id: Mapped[UUID | None]

class RoleBinding(Base):
    __tablename__ = "platform_role_binding"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(index=True)
    party_id: Mapped[UUID]                 # kime
    role: Mapped[str]                      # hangi rol (k-authz izin setine eşlenir)
    scope: Mapped[dict]                    # bağlam: {"department": "...", "project": "..."}
    valid_from: Mapped[datetime]
    valid_to: Mapped[datetime | None]      # NULL = süresiz
```

```python
# backend/platform_actor/service.py

class ActorService:
    async def bind_role(self, draft: RoleBindingDraft, approval_ref: ApprovalRef) -> RoleBinding:
        """
        AI, org şemasından rol ataması ÖNERİR (draft). İnsan onaylar (approval_ref).
        Motor kaydeder ve k-authz ReBAC grafiğine kenar besler. Audit'lenir.
        """

    async def effective_roles(self, party_id: UUID, at: datetime) -> list[str]:
        """Verilen anda geçerli (valid_from<=at<valid_to) rolleri döndürür."""
```

**Tenant / AuthZ / Audit bağı.** Her Party ve RoleBinding `tenant_id` taşır (v1 §2.1 fail-closed). RoleBinding, v1 §2.2 RBAC izin setlerine **girdi**dir: k-identity login'i "kim olduğunu" doğrular, `platform_actor` "hangi bağlamda ne yapabildiğini" ReBAC olarak k-authz'a besler. Her `bind_role` / `revoke_role` v1 §2.5 audit'e `actor`+`resource=role_binding` ile yazılır.

**AI-güvenlik invariantı.** AI, org yapısından rol atamalarını yalnızca `RoleBindingDraft` olarak **önerir**; hiçbir rol AI tarafından doğrudan aktif edilemez. İnsan onayı (`approval_ref`) olmadan `bind_role` çağrısı `ApprovalRequiredError` fırlatır. AI yeni rol **tanımı** icat edemez; roller v1'deki gibi `platform_authn_authz` PR'ıyla eklenir.

**Katman.** Tenant katmanı (her tenant kendi party/rol grafiğine sahiptir; sistem-katman party'leri yalnızca platform işletmecisi tanımlar).

---

### 3.2 Capability / Entitlement (`platform_capability`)

**Ne olduğu (1 cümle).** Hangi capability'nin (yetenek) hangi plan/lisans altında açık olduğunu ve o capability'nin hangi ArcheType/Surface/Workflow/ECA'yı etkinleştirdiğini tanımlayan hak-yönetim (entitlement) katmanı.

**Karar gerekçesi.** 50 app tek platformda yaşayacaksa, "bu tenant bu özelliği görebilir mi?" sorusunun tek, denetlenebilir bir cevabı olmalı. Bunu her app kendi feature-flag'iyle çözerse, satış/lisans/faturalama tutarsızlaşır. `platform_capability`, ticari paketi (plan) teknik yeteneğe (capability) bağlar ve capability'yi somut çekirdek nesnelere (hangi archetype açılır, hangi surface render edilir) map'ler.

**Jargon.** *Capability*: platformun sunduğu adlandırılmış yetenek (örn. `mes.finite_scheduling`, `pim.variant_matrix`). *Entitlement*: bir tenant'ın belirli capability'lere sahip olma hakkı (genelde plan üzerinden). *Lisans-anahtarı*: entitlement'ı kriptografik olarak doğrulayan imzalı token.

**İmza taslağı.**

```python
# backend/platform_capability/models.py

class Capability(Base):
    __tablename__ = "platform_capability"
    key: Mapped[str] = mapped_column(primary_key=True)   # 'mes.finite_scheduling'
    layer: Mapped[str]        # 'system' | 'platform' | 'tenant'
    # bu capability neyi açar:
    unlocks_archetypes: Mapped[list[str]]
    unlocks_surfaces: Mapped[list[str]]
    unlocks_workflows: Mapped[list[str]]
    unlocks_eca_packs: Mapped[list[str]]

class PlanCapability(Base):
    __tablename__ = "platform_plan_capability"
    plan_key: Mapped[str] = mapped_column(primary_key=True)
    capability_key: Mapped[str] = mapped_column(primary_key=True)
```

```python
# backend/platform_capability/service.py

class CapabilityService:
    def is_enabled(self, tenant_id: UUID, capability: str) -> bool:
        """
        Tenant'ın planı × capability matrisinden çözer. Lisans-anahtarı imzası
        doğrulanır (fail-closed: imza geçersizse yetenek KAPALI sayılır).
        """

    def enabled_surfaces(self, tenant_id: UUID) -> set[str]:
        """UI shell'in hangi surface'leri render edebileceğini döndürür."""
```

**Tenant / AuthZ / Audit bağı.** `is_enabled` her zaman `tenant_id` ile çağrılır. Capability kapısı, v1 §2.2 izin kontrolünden **önce** gelir: kapalı capability için endpoint 404 (varlık gizlenir), yetkisi olmayan kullanıcı için 403. Entitlement değişiklikleri (plan yükseltme/düşürme) audit'lenir; hangi capability'nin ne zaman açıldığı iz bırakır.

**AI-güvenlik invariantı.** AI, "bu tenant şu capability'den faydalanır" **önerisi** üretebilir (upsell sinyali), ama entitlement'ı kendisi açamaz — plan/lisans değişimi insan onayından ve faturalama akışından geçer. AI, lisans-anahtarını üretemez veya imzalayamaz.

**Katman.** Üç katmanlı: `system` (platform çapında, işletmeci kontrolünde) → `platform` (paket seviyesi) → `tenant` (tenant'a atanmış efektif set). Alt katman üst katmanı genişletemez, yalnızca daraltır.

---

### 3.3 Policy Decision Point (`platform_pdp`)

**Ne olduğu (1 cümle).** Erişim ve iş kuralı kararlarının verildiği merkezî nokta; kararlar serbest kodla değil **policy-as-data** (veri olarak politika) ile ifade edilir, her karar audit'lenir ve önce simüle edilebilir.

**Karar gerekçesi.** v1 §2.2 "izin var mı?" sorusunu resolver başında çözer ama karar mantığı kod içine dağılır. Kurumsal uyum (SoD — görev ayrılığı, onay limitleri, jurisdiction kısıtları) merkezî, denetlenebilir ve **değiştirmeden test edilebilir** bir karar noktası ister. PDP, "neden izin verildi/reddedildi?"nin cevabını her zaman verebilen tek yer olur.

**Jargon.** *PDP*: Policy Decision Point — kararı veren bileşen; onu çağıran koda *PEP* (Enforcement Point) denir. *Policy-as-data*: kural, yürütülebilir kod değil, motorun yorumladığı bildirimsel veri (attribute + koşul). *İzin-simülasyonu*: bir politikayı prod'a uygulamadan "şu istekte ne olurdu?" diye kuru çalıştırma.

**İmza taslağı.**

```python
# backend/platform_pdp/engine.py

from dataclasses import dataclass

@dataclass(frozen=True)
class Decision:
    allow: bool
    reason: str                  # denetlenebilir gerekçe kodu
    obligations: list[str]       # ör. ["mask_field:iban", "require_2fa"]
    policy_version: str

class PolicyDecisionPoint:
    async def decide(self, subject: dict, action: str, resource: dict, context: dict) -> Decision:
        """
        Girdi tamamen VERİ (subject=party+roller, resource=archetype+attrs,
        context=jurisdiction+zaman). Motor policy-as-data setini değerlendirir.
        Serbest Python kuralı YAZILMAZ. Her karar audit'e Decision.reason ile yazılır.
        """

    async def simulate(self, policy_draft: PolicyDraft, samples: list[dict]) -> list[Decision]:
        """İzin-simülasyonu: taslak politikayı prod'a dokunmadan örnek isteklerde çalıştırır."""
```

**Tenant / AuthZ / Audit bağı.** PDP, v1 §2.2'yi **değiştirmez, güçlendirir**: `RequirePermission` PEP olarak PDP'yi çağırabilir. Her `decide` çağrısı `tenant_id`+`subject`+`reason` ile v1 §2.5 audit'e yazılır — bu, "erişim neden verildi" sorusunun tek kaynağıdır. `ArcheType.accessPolicy` alanı, PDP'nin ilgili archetype için değerlendireceği politika setine **girdi**dir.

**AI-güvenlik invariantı.** AI, mevcut kararları analiz edip politika **taslağı** önerebilir ve `simulate` ile etkisini gösterebilir; ancak aktif policy setini doğrudan değiştiremez. Politika yayımı insan onayı (`approval_ref`) ister. AI, `decide` sonucunu **override edemez**: motor kararı bağlayıcıdır, AI'ın "yine de izin ver" deme yolu yoktur.

**Katman.** Platform-katman motor + tenant-katman politika verisi. Sistem-katman "hard" politikalar (örn. cross-tenant yasağı) tenant tarafından gevşetilemez.

---

### 3.4 Mode-Profile (`platform_mode_profile`)

**Ne olduğu (1 cümle).** Bir tenant'ın runtime iş modelini (örn. B2C ↔ B2B) tanımlayan; aktif capability kümesini, surface/workflow versiyonlarını ve policy override'larını tek profilde toplayan ve profil geçişini geri-alınabilir bir ADMIN_FLOW ile yöneten katman.

**Karar gerekçesi.** Aynı platformdaki bir mağaza bugün B2C (son tüketici, sepet, kart), yarın B2B (bayi, teklif, vadeli ödeme, KDV muafiyeti) çalışabilmeli — hem de **veri yıkılmadan**. Bunu ayrı deploy'larla çözmek 50 app'te sürdürülemez. Mode-Profile, "hangi capability + hangi surface versiyonu + hangi policy override aktif" sorusunu tek, versiyonlanmış, geri-alınabilir bir nesneye bağlar. Kritik nokta: profil değişimi **konfigürasyon** değişimidir, şema/veri değişimi değil.

**Jargon.** *Mode/İş-modeli*: platformun bir tenant için davranış kalıbı (B2C, B2B, marketplace…). *ADMIN_FLOW*: yönetici işleminin geçmesi gereken kapı zinciri: preview → dry-run → approval → apply → rollback. *Override*: profilin, temel policy/versiyon üzerine koyduğu yerel fark.

**İmza taslağı.**

```python
# backend/platform_mode_profile/models.py

class ModeProfile(Base):
    __tablename__ = "platform_mode_profile"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(index=True)
    mode: Mapped[str]                     # 'b2c' | 'b2b' | 'marketplace' | ...
    active_capabilities: Mapped[list[str]]
    surface_versions: Mapped[dict]        # {"storefront": "3.2", "checkout": "2.1"}
    workflow_versions: Mapped[dict]
    policy_overrides: Mapped[dict]        # PDP'ye giren tenant-lokal farklar
    is_active: Mapped[bool] = mapped_column(default=False)
```

```python
# backend/platform_mode_profile/flow.py

class ModeSwitchFlow:
    async def preview(self, tenant_id: UUID, target: ModeProfileDraft) -> ModeDiff:
        """Neyin değişeceğini (capability/surface/policy farkı) gösterir; hiçbir şey uygulanmaz."""

    async def dry_run(self, tenant_id: UUID, target: ModeProfileDraft) -> DryRunReport:
        """Aktif verilere karşı simüle eder (örn. açık siparişler yeni modda geçerli mi)."""

    async def apply(self, tenant_id: UUID, target: ModeProfileDraft, approval_ref: ApprovalRef) -> ModeProfile:
        """
        SADECE insan onayından sonra. Profil aktive edilir; VERİ YIKILMAZ
        (kapatılan surface'in verisi saklanır). Önceki profil rollback için tutulur.
        """

    async def rollback(self, tenant_id: UUID, to_profile_id: UUID) -> ModeProfile:
        """Önceki profile geri döner; yine veri kaybı olmaz."""
```

**Tenant / AuthZ / Audit bağı.** Profil tümüyle `tenant_id` kapsamlıdır. Geçiş yalnızca `mode_profile:apply` iznine sahip party tarafından tetiklenebilir (v1 §2.2). ADMIN_FLOW'un her adımı (preview/dry-run/apply/rollback) v1 §2.5 audit'e yazılır; "kim, ne zaman, hangi moddan hangi moda, hangi gerekçeyle" iz bırakır. Aktif profil, §3.2 capability ve §3.3 PDP kararlarının **girdisi**dir.

**AI-güvenlik invariantı.** AI, "bu tenant B2B'ye geçmeye hazır" **önerisi** ve `preview`/`dry_run` raporu üretebilir; fakat `apply` yalnızca insan `approval_ref`'i ile çalışır. AI, aktif profili doğrudan değiştiremez ve rollback'i tetikleyemez (rollback de yetkili insan aksiyonudur). Veri yıkımı hiçbir aktör için mümkün değildir — kapatılan surface verisi arşivlenir, silinmez.

**Katman.** Tenant katmanı (runtime konfigürasyon), platform-katman motor ile yürütülür.

---

### 3.5 Computation / Derivation (`platform_computation`)

**Ne olduğu (1 cümle).** Türetilmiş alanları (fiyat, vergi, BOM maliyeti, bordro kalemi) serbest kod yerine **saf, yapısal bir ifade grafiği** ile tanımlayan ve bu grafiği tanımlı tetikleyicilerde (yazma anında / sorgu anında / batch) deterministik hesaplayan motor.

**Karar gerekçesi.** Fiyat, vergi, BOM ve bordro hesabı 50 app'in en riskli, en denetlenen alanıdır. Bunları app'lerin içine serbest Python olarak gömmek: (1) denetlenemez ("bu KDV neden %18 çıktı?"), (2) tekrarlanır, (3) yan-etki riski taşır. `platform_computation`, hesabı **veri olarak yapısal ifade grafiği** kılar: girdileri, operatörleri, sabitleri açıkça listelenir; motor onu saf (yan-etkisiz, deterministik) çalıştırır. Böylece her türetilmiş değer izlenebilir ve versiyonlanabilir olur.

**Jargon.** *Derivation/türetme*: başka alanlardan hesaplanan alan (kalıcı yazılabilir ya da anlık hesaplanabilir). *İfade grafiği*: hesabın düğüm-kenar temsili (girdi düğümleri → operatör düğümleri → sonuç); serbest fonksiyon değil. *Saf (pure)*: aynı girdiye hep aynı çıktı, dış duruma dokunmaz.

**İmza taslağı.**

```python
# backend/platform_computation/models.py

class ComputationDef(Base):
    __tablename__ = "platform_computation_def"
    key: Mapped[str] = mapped_column(primary_key=True)     # 'pricing.net_total'
    tenant_id: Mapped[UUID | None]        # NULL = platform profili (örn. standart KDV)
    profile: Mapped[str]                  # 'pricing' | 'tax' | 'bom' | 'payroll'
    graph: Mapped[dict]                   # saf yapısal ifade grafiği (kod DEĞİL)
    trigger: Mapped[str]                  # 'on_write' | 'on_query' | 'batch'
    version: Mapped[str]

class ComputationEngine:
    def evaluate(self, key: str, inputs: dict, tenant_id: UUID) -> ComputationResult:
        """
        Grafiği yorumlar. Yan etki YOK, dış çağrı YOK. Sonuç + kullanılan
        girdiler + graph.version izlenebilir döner (denetim için).
        Serbest Python evaluate YASAK; yalnızca whitelisted operatör düğümleri.
        """
```

**Tenant / AuthZ / Audit bağı.** Platform profilleri (`tenant_id=NULL`) tüm tenant'lara ortak taban sağlar; tenant kendi override'ını tanımlayabilir ama yalnızca izin verilen düğümlerle. Hesap **sonucu** doğrudan audit'lenmez (çok hacimli olur), fakat `ComputationDef` **değişiklikleri** ve versiyon geçişleri v1 §2.5 audit'e yazılır — "fiyat kuralı ne zaman, kim tarafından değişti" izlenir. Grafik, §3.6 Field-Types'ı (money/measure) girdi olarak alır.

**AI-güvenlik invariantı.** AI, mevcut fiyat/vergi verisinden ifade grafiği **taslağı** önerebilir (örn. "bu indirim merdiveni şu grafikle temsil edilebilir") ve örnek girdilerde çıktı gösterebilir; ancak aktif `ComputationDef`'i değiştiremez. Grafik yayımı insan onayı ister. AI, hesabı çalışma anında **override edemez**: motorun ürettiği türetilmiş değer bağlayıcıdır.

**Katman.** Platform-katman taban profilleri + tenant-katman override; sistem-katman "resmî" formüller (örn. yasal KDV tablosu) yalnızca işletmeci/uyum ekibince güncellenir.

---

### 3.6 Field-Types (`platform_fieldtypes`)

**Ne olduğu (1 cümle).** Kurumsal veride tekrar eden karmaşık alan tiplerini (para, ölçü, çok-dilli metin, coğrafya, öznitelik-seti) tek, doğrulanmış çekirdek tip kümesi olarak sunan kütüphane.

**Karar gerekçesi.** "Para"yı `float` ile tutan her app bir gün yuvarlama hatasıyla para kaybeder; birimi string tutan her app bir gün `kg` ile `lb` toplar; çok-dilli metni ayrı kolonlarla çözen her app locale eklerken şema değiştirir. Bu tipler 50 app'te sürekli tekrar eder ve **yanlış yapıldığında sessizce hasar** verir. `platform_fieldtypes`, bunları tek yerde, doğru (kesinlik, dönüşüm, locale çözümü) tanımlar; app yalnızca tipi kullanır.

**Jargon.** *EAV / attribute-set*: Entity-Attribute-Value — PIM'de ürün ailesi/varyantı için dinamik öznitelikler (renk, beden…) şema değiştirmeden tutulur. *PostGIS*: PostgreSQL'in coğrafi eklentisi. *i18n*: uluslararasılaştırma (çok-dil/çok-locale).

**İmza taslağı.**

```python
# backend/platform_fieldtypes/types.py

class Money(TypeDecorator):
    """value (Decimal) + currency (ISO-4217) + precision + rounding_mode.
       float YASAK; iç temsil Decimal. Kur bilgisi para değerinden ayrılamaz."""

class Measure(TypeDecorator):
    """value + unit (UCUM) + canonical dönüşüm. kg<->lb güvenli dönüşür;
       farklı boyut (uzunluk vs kütle) toplanamaz -> DimensionMismatchError."""

class I18nText(TypeDecorator):
    """locale -> değer eşlemesi (JSONB). Yeni locale eklemek ŞEMA değiştirmez.
       Çözümleme: istenen locale yoksa jurisdiction/fallback zinciri."""

class Geo(TypeDecorator):
    """PostGIS geometry/geography köprüsü; SRID zorunlu."""

class AttributeSet(TypeDecorator):
    """PIM aile/varyant için EAV; öznitelik şeması tenant tanımlı, değer tipli."""
```

**Tenant / AuthZ / Audit bağı.** Tipler kendileri tenant taşımaz ama içinde yaşadıkları model v1 §2.1 `tenant_id` zorunluluğuna tabidir. `I18nText` çözümlemesi §3.15 Jurisdiction bağlamını (locale ekseni) kullanır. `Money` ve `Measure`, §3.5 Computation grafiklerinin tip-güvenli girdisidir; hatalı boyut/kur karışımı **hesap anında değil tanım anında** reddedilir.

**AI-güvenlik invariantı.** AI, ham veriden alan tipi **önerisi** yapabilir (örn. "bu kolon aslında Money olmalı, currency ayrı tutulmalı"), ancak tip migrasyonu bir şema değişikliğidir ve v1 §2.8 Migration Policy + insan onayından geçer. AI, bir para değerini doğrudan yazamaz/dönüştüremez; dönüşüm motorun tip kurallarıyla yapılır.

**Katman.** Platform-katman kütüphane (tüm app'ler paylaşır); attribute-set şeması tenant katmanında tanımlanır.

---

### 3.7 Scale-Invariant (`platform_scale_invariant`)

**Ne olduğu (1 cümle).** Para veya kalıcı veri yazan **her** ArcheType'ta idempotency, outbox ve tenant-rate-limit koruma üçlüsünü **varsayılan açık (default-on) ve zorunlu** kılan; kapatmayı yalnızca açık bir Waiver ile mümkün kılan güvenlik zarfı.

**Karar gerekçesi.** İki kez basılan "Öde" butonu, tekrar çalışan bir worker, bir tenant'ın diğerlerini boğması — bunlar tek app'te unutulabilir hatalardır; 50 app'te **kaçınılmaz** hâle gelir. Doğru yaklaşım, bu korumaları opsiyonel bırakmak değil, **para/veri yazan her yerde varsayılan zorunlu** yapmaktır. Geliştirici korumayı almak için bir şey yapmaz; kapatmak için gerekçeli bir Waiver imzalar. Ayrıca her yazan ArcheType, tutarlılık sınıfını (strong/eventual) **açıkça beyan** etmek zorundadır — "sessiz eventual" yasaktır.

**Jargon.** *Idempotency*: aynı isteğin birden çok kez gelmesinin tek kez etki etmesi (idempotency-key ile). *Outbox*: v1 §2.3'teki transactional outbox (yazma ile event yayımını atomik kılar). *Tutarlılık sınıfı*: strong (hemen tutarlı) mı, eventual (sonunda tutarlı) mı — çağıranın bilmesi gereken sözleşme. *Waiver*: korumayı kapatma iznini gerekçeyle veren, audit'lenen istisna kaydı.

**İmza taslağı.**

```python
# backend/platform_scale_invariant/guard.py

class WritePolicy(BaseModel):
    idempotency_required: bool = True     # default-on
    outbox_required: bool = True          # default-on
    rate_limit_scope: str = "tenant"      # default-on, tenant başına
    consistency: str                      # 'strong' | 'eventual'  -> BEYAN ZORUNLU
    waiver_ref: UUID | None = None        # kapatma sadece Waiver ile

def scaled_write(policy: WritePolicy):
    """
    Para/veri yazan ArcheType handler'ına dekoratör. Eksikse CI hata verir:
    'yazan ArcheType scaled_write olmadan tanımlanamaz'. consistency beyanı yoksa reddedilir.
    """

class Waiver(Base):
    __tablename__ = "platform_scale_waiver"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    tenant_id: Mapped[UUID]
    disabled_guard: Mapped[str]           # 'idempotency' | 'outbox' | 'rate_limit'
    reason: Mapped[str]
    approved_by: Mapped[UUID]             # insan onayı zorunlu
```

**Tenant / AuthZ / Audit bağı.** Rate-limit varsayılan olarak `tenant` kapsamlıdır (bir tenant komşusunu etkileyemez). Outbox, v1 §2.3'ü kullanır; idempotency-key `tenant_id` ile birlikte tekilleştirilir. Her `Waiver` v1 §2.5 audit'e yazılır ve `approved_by` insan onayı taşır — "hangi koruma, hangi tenant'ta, neden, kimin onayıyla kapalı" iz bırakır.

**AI-güvenlik invariantı.** AI, bir Waiver **önerebilir** (örn. "bu batch iş için rate-limit gevşetilmeli") ama Waiver'ı kendisi onaylayamaz; `approved_by` bir insandır. AI, hiçbir koşulda default-on korumayı çağrı anında bypass eden bir kod yolu üretemez; CI, `scaled_write`'sız yazan ArcheType'ı build'de reddeder.

**Katman.** Platform-katman zarf (tüm yazan ArcheType'ları sarar); Waiver tenant katmanında ve zaman-sınırlıdır.

---

### 3.8 Sequence (`platform_sequence`)

**Ne olduğu (1 cümle).** Fatura, üretim emri, lot gibi kimliklerde **eşzamanlılığa dayanıklı ve boşluksuz (gap-free)** numaralandırmayı rezervasyon+commit modeliyle üreten, çok-bölgeli dağıtımda CAP tercihini açıkça beyan eden servis.

**Karar gerekçesi.** Fatura numarası atlanamaz (yasal), çakışamaz (tekil), sırasız olamaz — ama yüksek eşzamanlılıkta naïf bir `MAX+1` ya kilitlenir ya boşluk verir. Bunu her app kendi çözerse, en az biri yanlış çözer ve bu bir uyum ihlali olur. `platform_sequence`, boşluksuzluğu **rezervasyon+commit** ile sağlar (numara ayrılır, iş başarısızsa numara iade edilir/void'lenir ama iz kalır) ve çok-bölge senaryosunda tutarlılık-erişilebilirlik (CAP) tercihini gizlemez.

**Jargon.** *Gap-free*: numaralarda boşluk olmaması (1,2,3 — 1,3 değil). *Rezervasyon+commit*: önce numarayı ayır, iş kesinleşince onayla; iki-aşamalı. *CAP*: dağıtık sistemde tutarlılık (C) ve erişilebilirlik (A) arasında bölünme (P) anında yapılan seçim.

**İmza taslağı.**

```python
# backend/platform_sequence/service.py

class SequenceService:
    async def reserve(self, seq_key: str, tenant_id: UUID) -> Reservation:
        """
        Boşluksuz sıradan bir numara REZERVE eder (henüz kalıcı değil).
        Eşzamanlılık: PostgreSQL advisory-lock / dedicated counter satırı.
        """

    async def commit(self, reservation: Reservation) -> AssignedNumber:
        """İş kesinleşti; numara kalıcı bağlanır. Idempotent (§3.7)."""

    async def void(self, reservation: Reservation, reason: str) -> None:
        """İş iptal; boşluksuzluğu korumak için numara void kaydıyla iz bırakır (silinmez)."""

# Çok-bölge: SequenceDef.cap_mode = 'strong_single_region' | 'partitioned_by_region'
# 'partitioned': her bölge kendi prefix'li aralığından üretir (küresel gap-free'den vazgeçilir, AÇIKÇA).
```

**Tenant / AuthZ / Audit bağı.** Her sequence `tenant_id` kapsamlıdır (bir tenant'ın fatura serisi diğerinden bağımsız). `commit` ve `void` audit'lenir (özellikle void, uyum açısından kritik). Sequence, §3.7 idempotency'yi kullanır: aynı iş iki kez commit edilse bile tek numara bağlanır.

**AI-güvenlik invariantı.** AI, sequence yapılandırması **önerebilir** (örn. yıl-bazlı reset, bölge prefix'i) ama aktif sequence tanımını değiştiremez ve doğrudan numara atayamaz/void'leyemez. Numara üretimi ve void'leme motor + yetkili insan aksiyonudur; AI'ın "şu faturaya şu numarayı ver" yolu yoktur.

**Katman.** Platform-katman motor; sequence tanımı tenant katmanında; çok-bölge CAP tercihi sistem-katman kararıdır (deployment topolojisiyle sabitlenir).

---

### 3.9 Calendar + Capacity (`platform_calendar`)

**Ne olduğu (1 cümle).** İş merkezlerinin kapasite takvimini (vardiya, tatil, bakım) ve "iş-zamanı" aritmetiğini ('X iş günü sonra') tanımlayan; çizelgeleme ve teslim-tarihi hesabına girdi olan servis.

**Karar gerekçesi.** "5 iş günü sonra" takvim gününden farklıdır (hafta sonu, resmi tatil, tenant'a özel bakım penceresi). Teslim tarihi, üretim çizelgesi (§3.13 APS), SLA — hepsi doğru bir business-time modeli ister. Her app kendi tatil listesini tutarsa tutarsızlık ve yanlış teslim taahhüdü kaçınılmazdır. `platform_calendar`, iş-merkezi bazlı kapasite ve business-time'ı tek yerde çözer.

**Jargon.** *İş-merkezi (work center)*: kapasitesi olan üretim/hizmet kaynağı (makine, ekip). *Business-time*: iş takvimine göre zaman aritmetiği (tatilleri, vardiyaları hesaba katar). *APS*: Advanced Planning & Scheduling (§3.13).

**İmza taslağı.**

```python
# backend/platform_calendar/service.py

class CalendarService:
    async def capacity(self, work_center_id: UUID, day: date, tenant_id: UUID) -> CapacitySlot:
        """Vardiya + tatil + bakım düşülmüş net kapasiteyi döndürür."""

    async def add_business_days(self, start: datetime, days: int, calendar_id: UUID) -> datetime:
        """'X iş günü sonra'; hafta sonu/tatil/vardiya-dışı zamanı atlar."""

    async def is_working_time(self, ts: datetime, calendar_id: UUID) -> bool: ...

class CapacityCalendar(Base):
    __tablename__ = "platform_capacity_calendar"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    tenant_id: Mapped[UUID] = mapped_column(index=True)
    work_center_id: Mapped[UUID | None]
    shifts: Mapped[dict]          # gün -> vardiya pencereleri
    holidays: Mapped[list[date]]  # jurisdiction (§3.15) tatilleriyle beslenebilir
```

**Tenant / AuthZ / Audit bağı.** Takvimler `tenant_id` kapsamlıdır; resmi tatiller §3.15 Jurisdiction'dan (bölge ekseni) türetilip tenant override'ı ile birleşir. Kapasite/takvim değişiklikleri audit'lenir (teslim taahhüdünü etkilediği için). `add_business_days`, §3.13 APS ve teslim-tarihi hesaplarının deterministik girdisidir.

**AI-güvenlik invariantı.** AI, vardiya/kapasite **önerisi** (örn. "yoğun sezon için ek vardiya") üretebilir; ancak aktif takvimi değiştiremez — kapasite değişimi planlamayı ve taahhütleri etkilediğinden insan onayından geçer. AI, business-time hesabını override edemez; sonuç motorun takvimine bağlıdır.

**Katman.** Tenant katmanı (takvim verisi) + platform-katman aritmetik motoru.

---

### 3.10 Genealogy Graph (`platform_genealogy`)

**Ne olduğu (1 cümle).** Lot/seri numaralarının üretim soyağacını (hangi hammadde lotundan hangi yarı-mamul, ondan hangi bitmiş ürün seri) **değiştirilemez bir grafik** olarak tutan ve ileri/geri izleme ile geri-çağırmayı ölçekli grafik-sorguyla mümkün kılan servis.

**Karar gerekçesi.** Bir hammadde partisi kusurlu çıktığında, "bu partiden üretilen tüm bitmiş ürünler hangileri, hangi müşterilere gitti?" sorusunun **saniyeler içinde ve kesin** cevaplanması yasal ve etik zorunluluktur (gıda, ilaç, otomotiv). Bu, ilişkileri sonradan kurmaya çalışan bir raporla değil, üretim anında yazılan **değiştirilemez soyağacı grafiğiyle** çözülür. Her app kendi izlemesini tutarsa geri-çağırma güvenilmez olur.

**Jargon.** *Soyağacı (genealogy)*: bir çıktının hangi girdilerden türediğinin kayıt zinciri. *İleri izleme*: bu lot nerelere gitti. *Geri izleme*: bu ürün nelerden yapıldı. *Immutable*: yazıldıktan sonra değiştirilemez.

**İmza taslağı.**

```python
# backend/platform_genealogy/service.py

class GenealogyService:
    async def link(self, parent_lots: list[LotRef], child: LotRef, op: str, tenant_id: UUID) -> None:
        """
        Üretim adımında girdi lotlarını çıktı lotuna bağlar. Kenar IMMUTABLE:
        yazıldıktan sonra UPDATE/DELETE yok (audit tablosu gibi, §2.5 ruhu).
        """

    async def trace_forward(self, lot: LotRef) -> list[LotRef]:
        """Bu lot/seri nerelere gitti (geri-çağırma kapsamı)."""

    async def trace_backward(self, lot: LotRef) -> list[LotRef]:
        """Bu ürün nelerden yapıldı (kök-neden)."""

# Ölçek: kenarlar (tenant_id, parent_lot, child_lot) partition'lı; derin izleme
# recursive CTE / graf-indeksi ile; çok büyük grafikte batch-materialize desteklenir.
```

**Tenant / AuthZ / Audit bağı.** Grafik `tenant_id` kapsamlıdır; kenarlar değiştirilemez (v1 §2.5 audit felsefesiyle aynı — REVOKE UPDATE/DELETE). Geri-çağırma sorguları yetki gerektirir ve audit'lenir (kim, hangi lotu, ne zaman izledi). Lot kimlikleri §3.8 Sequence'ten üretilir.

**AI-güvenlik invariantı.** AI, geri-çağırma kapsamını **analiz edip önerebilir** ("bu lot şu müşterileri etkiliyor, öncelik sırası şu") ve rapor taslağı çıkarabilir; ancak soyağacı grafiğine kenar ekleyemez/değiştiremez (immutable + motor-yazımlı) ve resmi geri-çağırmayı başlatamaz — geri-çağırma kararı insan onayıyla verilir.

**Katman.** Tenant katmanı (üretim verisi), platform-katman grafik motoru.

---

### 3.11 Edge Gateway (`platform_edge`)

**Ne olduğu (1 cümle).** ISA-95 hiyerarşisinde Seviye-3 (MES) ile Seviye-1/2 (PLC/SCADA) arasındaki köprüyü OPC-UA/MQTT üzerinden kuran; bağlantı koptuğunda offline-first çalışan ve yeniden bağlanınca çakışma-çözümlü, idempotent senkronizasyon yapan ağ geçidi.

**Karar gerekçesi.** Fabrika sahasında ağ **kopar**; makine durmaz. MES buluttayken PLC yerelde çalışır. Bu köprüyü her MES app'i kendi başına yazarsa, offline davranış ve yeniden-senkron her seferinde farklı ve hatalı olur (çift işlem, kayıp telemetri). `platform_edge`, sahayla konuşmayı (OPC-UA/MQTT), offline tamponlamayı ve çakışma çözümünü tek, idempotent (§3.7) sözleşmede toplar.

**Jargon.** *ISA-95*: üretim otomasyonu katman modeli (L1 sensör/aktüatör, L2 SCADA, L3 MES, L4 ERP). *OPC-UA / MQTT*: endüstriyel iletişim protokolleri. *Offline-first*: bağlantı yokken de çalışıp sonra senkronlanacak biçimde tasarım. *PLC/SCADA*: saha kontrol donanımı/yazılımı.

**İmza taslağı.**

```python
# backend/platform_edge/gateway.py

class EdgeGateway:
    async def read_tag(self, node_id: str, protocol: str) -> TagValue:
        """OPC-UA/MQTT üzerinden saha etiketini okur (L1/L2)."""

    async def command(self, draft: CommandDraft, approval_ref: ApprovalRef) -> CommandResult:
        """
        Sahaya YAZMA (setpoint/başlat). İnsan onayı zorunlu; idempotency-key ile
        çift-komut engellenir (§3.7). Onaysız komut ApprovalRequiredError.
        """

    async def sync(self) -> SyncReport:
        """
        Offline tamponu buluta akıtır. Çakışma çözümü: last-write-wins DEĞİL;
        deterministik reconciler (zaman + kaynak-önceliği). Idempotent tekrar-güvenli.
        """
```

**Tenant / AuthZ / Audit bağı.** Her edge cihazı/hattı bir `tenant_id` (ve tesis) ile ilişkilidir. Sahaya yazan `command` yetki gerektirir ve v1 §2.5 audit'e yazılır (fiziksel dünyaya etki ettiği için kritik). Senkron olayları outbox (§2.3, §3.7) üzerinden akar; telemetri §3.12 KPI ve §3.13 APS'e beslenir.

**AI-güvenlik invariantı.** AI, telemetriden **öneri** üretebilir ("bu hatta setpoint düşürülmeli", "bakım gerekli") ama sahaya doğrudan **komut gönderemez**: `command` insan `approval_ref`'i olmadan çalışmaz. Bu, fiziksel güvenlik açısından en katı sınırdır — AI'ın PLC'ye yazma yolu kapalıdır.

**Katman.** Platform-katman gateway (edge runtime) + tenant/tesis katmanı bağlama.

---

### 3.12 KPI Registry (`platform_kpi`)

**Ne olduğu (1 cümle).** ISO 22400 tabanlı üretim KPI'larını (OEE ve bileşenleri) **versiyonlanmış, formül-tabanlı** olarak tek kayıt defterinde tanımlayan; böylece "aynı KPI'nın farklı app'te farklı hesaplanması" (drift) imkânsız kılan servis.

**Karar gerekçesi.** OEE (Genel Ekipman Etkinliği) gibi bir KPI, iki ayrı app'te iki farklı formülle hesaplanırsa yönetim iki farklı gerçeğe bakar. Bunu önlemenin tek yolu, formülü **kod içine değil merkezî, versiyonlu bir kayda** koymaktır. `platform_kpi`, ISO 22400 tanımlarını sistem-katman formül olarak tutar; hesaplayan herkes aynı formülün aynı versiyonunu kullanır.

**Jargon.** *KPI*: anahtar performans göstergesi. *OEE*: Overall Equipment Effectiveness = Kullanılabilirlik × Performans × Kalite. *ISO 22400*: üretim KPI'ları için uluslararası standart. *Drift*: aynı metriğin zamanla/yerine göre tutarsızlaşması.

**İmza taslağı.**

```python
# backend/platform_kpi/registry.py

class KpiDef(Base):
    __tablename__ = "platform_kpi_def"
    key: Mapped[str] = mapped_column(primary_key=True)     # 'oee', 'availability'
    standard_ref: Mapped[str]     # 'ISO-22400-2:OEE'
    formula: Mapped[dict]         # §3.5 Computation grafiği (kod DEĞİL)
    version: Mapped[str]
    layer: Mapped[str] = mapped_column(default="system")   # standart formül = system

class KpiService:
    async def compute(self, kpi_key: str, window: TimeWindow, scope: dict) -> KpiValue:
        """Kayıtlı formülün ilgili versiyonuyla hesaplar; formula_version sonuçla döner."""
```

**Tenant / AuthZ / Audit bağı.** Standart KPI formülleri sistem-katmandır ve tenant tarafından değiştirilemez (drift'i önleyen tam da budur); tenant yalnızca yeni **türev** KPI tanımlayabilir. Formül versiyon değişiklikleri audit'lenir. Girdi verisi §3.11 Edge telemetrisi ve §3.9 Calendar (planlı süre) ile beslenir; hesap motoru §3.5 Computation'dır.

**AI-güvenlik invariantı.** AI, yeni KPI veya eşik **önerebilir** ve trend yorumu yapabilir; ancak ISO 22400 standart formüllerini değiştiremez ve KPI değerini elle yazamaz. Formül değişimi (türev KPI dahi) insan onayı + versiyon artışıyla yayımlanır; AI override edemez.

**Katman.** Standart formüller sistem-katman; türev KPI'lar tenant katmanı.

---

### 3.13 APS Solver (`platform_aps`)

**Ne olduğu (1 cümle).** Sonlu-kapasite ve kısıtları dikkate alan üretim çizelgelemesini (OR-Tools sınıfı kısıt-optimizasyonu) batch olarak çözen; darboğaz analizi ve what-if senaryoları sunan, saf hesaptan (§3.5) ayrı tutulan çözücü.

**Karar gerekçesi.** "Bu 40 işi 6 makinede, kısıtlara (kapasite, sıra bağımlılığı, teslim tarihi) uyarak en iyi nasıl sıralarım?" sorusu bir **optimizasyon** problemidir, bir formül değil. Bunu §3.5 Computation'a (saf, deterministik ifade grafiği) sıkıştırmak yanlış olur — çözüm arama, iteratif ve ağırdır. Bu yüzden APS ayrı bir primitiftir: batch çalışır, çözücü (OR-Tools benzeri) kullanır, sonucu bir **öneri çizelge** olarak üretir.

**Jargon.** *APS*: Advanced Planning & Scheduling. *Sonlu-kapasite*: kaynakların gerçek kapasite limitine uyan planlama (sonsuz varsaymaz). *Kısıt-optimizasyonu*: kısıtlar altında bir amaç fonksiyonunu (örn. gecikmeyi minimize) eniyileme. *What-if*: "şu makine bozulursa/şu sipariş eklenirse plan nasıl değişir" senaryosu.

**İmza taslağı.**

```python
# backend/platform_aps/solver.py

class ApsSolver:
    async def schedule(self, request: ScheduleRequest) -> ScheduleProposal:
        """
        Sonlu-kapasite + kısıt optimizasyonu (OR-Tools sınıfı) BATCH çözer.
        Çıktı bir ÖNERİ (proposal); doğrudan uygulanmaz. Calendar (§3.9) kapasitesi girdi.
        """

    async def what_if(self, base: ScheduleProposal, change: ScenarioChange) -> ScheduleProposal:
        """Senaryo farkını hesaplar (ör. makine arızası, acil sipariş)."""

    async def bottlenecks(self, proposal: ScheduleProposal) -> list[Bottleneck]:
        """Darboğaz kaynaklarını raporlar."""
```

**Tenant / AuthZ / Audit bağı.** Çizelge istekleri `tenant_id` kapsamlıdır. Bir öneri çizelgenin **onaylanıp uygulanması** (üretim emirlerine dönüşmesi) yetki gerektirir ve audit'lenir. APS kapasiteyi §3.9 Calendar'dan, hedef teslimleri sipariş verisinden alır; sonucu üretim emirlerine (§3.8 Sequence numaralı) bağlar.

**AI-güvenlik invariantı.** APS'in kendisi bir optimizasyon motorudur ve çıktısı zaten bir **öneri**dir. AI (LLM ajanı) bu öneriyi zenginleştirebilir/açıklayabilir/what-if önerebilir, ama onaylanmamış bir çizelge üretime **uygulanamaz**: apply, insan `approval_ref`'i ister. AI, çözücü kısıtlarını gizlice gevşetip "daha iyi görünen" plan dayatamaz.

**Katman.** Platform-katman çözücü; çizelge verisi tenant katmanı.

---

### 3.14 Consumer-Surface Runtime (`platform_surface_runtime`)

**Ne olduğu (1 cümle).** Son-kullanıcıya dönük yüzeyleri (feed, video, harita, sohbet, page-builder, grid, storefront) çalıştıran; her surface'in projeksiyon-tabanlı (`projected`) mı yoksa özel (`custom`) mı render edileceğini beyan eden ve render/cache/Core Web Vitals sözleşmesini uygulayan runtime.

**Karar gerekçesi.** 50 app çok farklı tüketici deneyimleri sunacak (sosyal feed, video oynatıcı, harita, canlı sohbet, sürükle-bırak sayfa kurucu, veri ızgarası, mağaza vitrini). Bunların her biri sıfırdan yazılırsa performans (CWV), önbellekleme ve tutarlılık her app'te ayrı ayrı bozulur. `platform_surface_runtime`, ortak render/cache/performans zarfını sağlar; app yalnızca surface tipini ve render stratejisini seçer. Kritik ayrım: çoğu surface veriden **projekte** edilebilir (`projected`, standart yol); yalnızca gerçekten gereken yerde `custom` render'a düşülür.

**Jargon.** *Surface/yüzey*: kullanıcıya görünen render birimi. *renderStrategy: projected*: veriden şablonla otomatik üretilen görünüm (varsayılan, hızlı, tutarlı). *custom*: elle yazılmış özel render (yalnızca gerektiğinde). *CWV (Core Web Vitals)*: Google'ın kullanıcı-deneyimi performans metrikleri (LCP/INP/CLS).

**İmza taslağı.**

```python
# backend/platform_surface_runtime/runtime.py

class SurfaceKind(str, Enum):
    FEED = "feed"; VIDEO = "video"; MAP = "map"; CHAT = "chat"
    PAGE_BUILDER = "page_builder"; GRID = "grid"; STOREFRONT = "storefront"

class SurfaceDef(Base):
    __tablename__ = "platform_surface_def"
    key: Mapped[str] = mapped_column(primary_key=True)
    tenant_id: Mapped[UUID] = mapped_column(index=True)
    kind: Mapped[SurfaceKind]
    render_strategy: Mapped[str]     # 'projected' | 'custom'
    cache_policy: Mapped[dict]       # TTL / stale-while-revalidate / edge-cache

class SurfaceRuntime:
    async def render(self, surface_key: str, ctx: RenderContext) -> RenderResult:
        """
        projected: veriden şablonla üretir (tercih edilen).
        custom: onaylı özel render. CWV bütçesi (LCP/INP/CLS) zorlanır; aşarsa raporlanır.
        """
```

**Not.** Frontend tarafı v1 §3.4 (design token, bundle bütçesi, WCAG) ve §3.2 GraphQL/TanStack Query sözleşmesine tabidir; bu primitif backend-runtime kapsar. Aşağıdaki tablo `projected` ile `custom` tercihini özetler; kısaca: mümkün olan her yerde `projected`, zorunlu olan yerde `custom`.

| render_strategy | Ne zaman | Getiri | Bedel |
|---|---|---|---|
| `projected` | Surface veriden şablonla üretilebiliyorsa (çoğu grid/feed/storefront) | Tutarlı, hızlı, bakımı ucuz, CWV kontrollü | Sınırlı özelleştirme |
| `custom` | Gerçekten özel etkileşim/görsel gerekiyorsa | Tam esneklik | CWV ve bakım yükü app'e biner (CI bütçe zorlar) |

**Tenant / AuthZ / Audit bağı.** Surface tanımları `tenant_id` kapsamlıdır; hangi surface'lerin açık olduğu §3.2 Capability ile ve §3.4 Mode-Profile ile belirlenir. Görünürlük/erişim v1 §2.2 ve §3.3 PDP kararına tabidir (örn. maskeleme yükümlülüğü). Surface tanım değişiklikleri audit'lenir.

**AI-güvenlik invariantı.** AI, surface düzeni/içeriği **önerebilir** (page-builder taslağı, feed sıralaması önerisi) ve preview üretebilir; ancak yayımlanan (canlı) surface tanımını doğrudan değiştiremez — yayım insan onayından geçer. AI, CWV/cache sözleşmesini gevşetemez; bütçe motor+CI tarafından zorlanır.

**Katman.** Tenant katmanı (surface tanımı) + platform-katman runtime.

---

### 3.15 Jurisdiction (`platform_jurisdiction`)

**Ne olduğu (1 cümle).** Locale, Jurisdiction, Currency, Tax, Timezone ve Data-residency'yi **altı ayrı ortogonal eksen** olarak modelleyen; her isteğe (tıpkı v1 tenant bağlamı gibi) bir jurisdiction-context ekleyen ve veri-ikametgahı (data-residency) kurallarını zorlayan katman.

**Karar gerekçesi.** En sık ve en pahalı hata, bu altı şeyi tek "ülke/dil ayarı" sanmaktır. Oysa: dil (locale) İngilizce olabilir ama yargı-bölgesi (jurisdiction) Almanya, para birimi EUR, vergi rejimi AB-KDV, saat dilimi Europe/Berlin, ve verinin fiziksel olarak AB'de kalması (data-residency) gerekebilir — hepsi **bağımsız**. Bunları karıştıran her app bir gün yanlış vergi, yanlış saat ya da bir veri-ikametgahı ihlali üretir. `platform_jurisdiction`, altı ekseni ortogonal tutar ve her isteğe zorunlu bir bağlam olarak taşır (fail-closed).

**Jargon.** *Jurisdiction (yargı-bölgesi)*: hukukun uygulandığı bölge (vergi/uyum kurallarını belirler); ülkeden farklı olabilir (eyalet, ekonomik bölge). *Locale*: dil+biçim tercihi. *Data-residency (veri-ikametgahı)*: verinin fiziksel olarak hangi coğrafyada saklanması gerektiği. *Ortogonal*: eksenlerin birbirinden bağımsız değişebilmesi.

**İmza taslağı.**

```python
# backend/platform_jurisdiction/context.py

from contextvars import ContextVar

class JurisdictionContext(BaseModel):
    locale: str            # 'en-DE'      (dil/biçim)
    jurisdiction: str      # 'DE'         (hukuk bölgesi)
    currency: str          # 'EUR'        (ISO-4217)
    tax_regime: str        # 'EU-VAT'
    timezone: str          # 'Europe/Berlin'
    data_residency: str    # 'EU'         (fiziksel saklama zorunluluğu)

_jctx: ContextVar[JurisdictionContext | None] = ContextVar("jctx", default=None)

def require_jurisdiction(request: Request) -> JurisdictionContext:
    """
    v1 require_tenant gibi: her ilgili endpoint'e Depends olarak enjekte edilir.
    Eksikse fail-closed reddedilir. Altı eksen BAĞIMSIZ set edilir/doğrulanır.
    """

# backend/platform_jurisdiction/residency.py
def assert_residency(target_region: str, jctx: JurisdictionContext) -> None:
    """Veri yazılacak/işlenecek bölge, data_residency ile uyumsuzsa ResidencyViolationError."""
```

**Tenant / AuthZ / Audit bağı.** Jurisdiction bağlamı v1 §2.1 tenant bağlamının **yanında** taşınır (ikisi ayrıdır: bir tenant birden çok jurisdiction'da iş yapabilir). `data_residency` zorlaması, verinin yanlış bölgeye yazılmasını fail-closed engeller ve ihlal girişimi v1 §2.5 audit'e yazılır. Bu bağlam: §3.6 `I18nText` (locale), §3.5 tax computation (tax_regime), §3.9 Calendar (timezone/tatil) primitiflerine **girdi**dir.

**AI-güvenlik invariantı.** AI, jurisdiction eşlemesi **önerebilir** (örn. "bu müşteri adresi DE jurisdiction'ına işaret ediyor"), ancak vergi rejimini veya data-residency kuralını doğrudan değiştiremez ve residency zorlamasını gevşetemez. Yanlış bölgeye yazma, AI dahil hiçbir aktör için mümkün değildir; `assert_residency` motor tarafından uygulanır.

**Katman.** Platform-katman motor + istek-bazlı bağlam; data-residency politikaları sistem-katman (deployment topolojisiyle sabit) ve tenant tarafından gevşetilemez.

---

### 3.16 v2 Primitiflerinin Core Contract Checklist'ine Katkısı

Aşağıdaki maddeler, bir app ilgili v2 primitifini kullandığında §5 checklist'ine eklenir. Kısaca: her primitif, kendi "sözleşmeye uyuyor mu?" kanıtını CI'a taşır.

| # | Kalem | Doğrulama yöntemi |
|---|---|---|
| 13 | Rol atamaları `platform_actor.RoleBinding` üzerinden (statik `roles` gömme yok) | CI: statik analiz |
| 14 | Capability kapısı korunan surface/workflow için mevcut | CI: `is_enabled` çağrı taraması |
| 15 | Erişim kararları PDP üzerinden; serbest izin kodu yok | CI: policy-as-data lint |
| 16 | Mode geçişleri yalnızca ADMIN_FLOW ile; doğrudan profil UPDATE yok | CI: statik analiz + audit kontrolü |
| 17 | Türetilmiş alanlar (fiyat/vergi/BOM/bordro) `platform_computation` grafiğiyle; serbest hesap yok | CI: computation-def taraması |
| 18 | Para alanları `Money`, ölçüler `Measure`; `float` para yok | CI: tip taraması |
| 19 | Para/veri yazan ArcheType'lar `scaled_write` ile (waiver'sız kapatma yok) + consistency beyanı | CI: dekoratör + beyan kontrolü |
| 20 | Numaralandırma `platform_sequence` ile; app-içi `MAX+1` yok | CI: statik analiz |
| 21 | İş-günü/kapasite hesabı `platform_calendar` ile | CI: statik analiz |
| 22 | Lot/seri bağları `platform_genealogy` ile ve immutable | CI: UPDATE/DELETE yasağı testi |
| 23 | Saha komutları `platform_edge` üzerinden ve `approval_ref` ile | CI: onay-kapısı taraması |
| 24 | Üretim KPI'ları `platform_kpi` formülüyle; app-içi OEE hesabı yok | CI: statik analiz |
| 25 | Çizelgeleme `platform_aps` önerisiyle; onaysız uygulama yok | CI: apply-onay kontrolü |
| 26 | Surface'ler `platform_surface_runtime` ile; `render_strategy` beyan edilmiş | CI: surface-def taraması |
| 27 | Jurisdiction-context zorunlu; data-residency zorlaması aktif | CI: `require_jurisdiction` + residency taraması |
| 28 | Tüm v2 apply-yolları `approval_ref` (AI-güvenlik invariantı) taşıyor | CI: onay-referansı taraması |

Not: bu maddeler §6 `check-core-contract.mjs` script'ine v2 kontrolleri olarak eklenecektir; bir app yalnızca kullandığı primitiflerin maddelerinden sorumludur (kullanılmayan primitif maddesi otomatik "uygulanmaz" sayılır).
