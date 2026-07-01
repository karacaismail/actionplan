# 03 — AuthN / AuthZ / IAM Standardı (Kimlik Doğrulama ve Kimlik Yönetimi)

Sürüm: 1.0 — 2026-07-01
Aile (`family`): engineering · Öncelik: P0 (kimlik) + P1 (SSO/MFA alt-uzmanlıkları)
Makine kontratı (SSO/MFA yeni sözleşmeleri): `src/data/standards/sso.json`, `src/data/standards/mfa.json`, `src/data/standards/oidc.json` (PROMPT 3 ile üretilir; bu anlatı onları *anlatır*, kuralı yeniden tanımlamaz).
Referans (mevcut kaynaklar): `docs/enterprise-dod.md §2.2` (Auth/Authz DoD), `src/schemas/task.ts` `dimensions.security` + `dimensions.owasp`, WBS 13.5 `s-iam` düğümü, `docs/pdp-policy-contract.md` (yetki kararı PDP'de).
Stack: FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL (BE); Vite + React + TanStack (FE). YASAK: Next.js, Supabase, Prisma.

---

## 1. Amaç ve Kapsam Sınırı

Bu standart "sen kimsin?" (authentication) ve "kimliğin nasıl yönetilir?" (identity & access management) katmanını sözleşmeye bağlar; "ne yapabilirsin?" (authorization) kararını **vermez** — o karar PDP primitifine (`k-policy-pdp`, `docs/pdp-policy-contract.md`) delege edilir. AuthN token/oturum üretir ve doğrular; PDP o token'ın taşıdığı aktör-kimliğini *girdi* alıp `allow/deny` üretir. Bu ayrım normatiftir: kimlik doğrulama katmanına yetki mantığı gömmek anti-pattern'dir (§10).

Kapsama giren: JWT (RS256) token akışı, refresh rotasyonu, OAuth2/OIDC, SSO (SAML/OIDC — YENİ), MFA (TOTP/WebAuthn — YENİ), tenant-aware kimlik bağlamı, oturum yönetimi ve IAM servis sınırı. Kapsama girmeyen: yetki kararı (PDP), rol→izin matrisi uygulaması (bkz. `04-rbac-abac-permission-standard.md`), otomasyon tetikleme (ECA/ruleset).

## 2. AuthN — Token ve Kimlik Doğrulama

Bu bölüm kimlik doğrulamanın somut token disiplinini tanımlar; her kural bir CI kapısı veya testle zorlanır.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| authn-jwt-rs256 | Access token asimetrik imzayla (RS256/ES256) üretilir; HS256 paylaşımlı-sır ve `alg:none` yasaktır. Doğrulama public-key ile yapılır, imzasız/süresi geçmiş token 401 döner. | must | unit (imza+exp doğrulama) + review |
| authn-token-lifetime | Access token kısa ömürlüdür (≤15 dk); uzun oturum refresh token ile sürer. Süre değeri config'ten okunur, koda gömülmez. | must | unit (exp claim) + integration |
| authn-refresh-rotation | Her refresh kullanımında yeni refresh üretilir ve eskisi iptal edilir (rotation + reuse-detection). Kullanılmış refresh'in tekrar kullanımı tüm oturum zincirini iptal eder. | must | integration (reuse → 401 + zincir iptali) |
| authn-oauth2-oidc | Üçüncü-taraf kimlik OAuth2 authorization-code + PKCE ile alınır; OIDC `id_token` claim'leri (iss, aud, exp, nonce) doğrulanır. Implicit flow yasaktır. | must | integration (code→token + id_token claim) |
| authn-password-policy | Parola argon2id (veya bcrypt cost≥12) ile hash'lenir; düz-metin/geri-döndürülebilir saklama yasaktır. Min uzunluk + breach-list kontrolü uygulanır. | must | unit (hash algoritması) + review |
| authn-token-storage-fe | Frontend token'ı `httpOnly` + `Secure` + `SameSite` cookie'de tutar; `localStorage`'da hassas token saklamak yasaktır (XSS sızıntısı). | should | e2e + review |

## 3. SSO — Single Sign-On (YENİ sözleşme: `sso.json`)

SSO, kurumsal müşterinin kendi kimlik sağlayıcısıyla (IdP) tek girişle oturum açmasını sağlar; bu bölüm SAML ve OIDC federasyonunu tanımlar.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| sso-protocol-support | SSO iki protokolü destekler: OIDC (birincil, `authorization-code + PKCE`) ve SAML 2.0 (SP-initiated). Her tenant kendi IdP'sini `idp_config` ile bağlar. | should | integration (IdP login → yerel session) |
| sso-assertion-validation | SAML assertion imzası IdP metadata public-key ile doğrulanır; imzasız/süresi geçmiş/audience-uyumsuz assertion reddedilir. OIDC `id_token` `iss`/`aud`/`nonce` doğrulanır. | must | integration (bozuk assertion → red) |
| sso-jit-provisioning | İlk SSO girişinde kullanıcı just-in-time provision edilir; IdP claim'lerinden (`email`, `groups`) yerel Party + rol eşlemesi yapılır. Rol eşlemesi PDP policy'sine girdi olur, yetkiyi burada hesaplamaz. | should | integration (yeni kullanıcı + rol map) |
| sso-tenant-scoped | Bir tenant'ın IdP'siyle açılan oturum yalnız o tenant kapsamında geçerlidir; çapraz-tenant SSO oturumu yasaktır (tenant izolasyonu). | must | integration (çapraz-tenant → red) |

## 4. MFA — Multi-Factor Authentication (YENİ sözleşme: `mfa.json`)

MFA, parola ötesinde ikinci faktör zorunlu kılar; bu bölüm TOTP ve WebAuthn faktörlerini ve step-up akışını tanımlar.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| mfa-factor-types | MFA en az iki faktör tipi sunar: TOTP (RFC 6238) ve WebAuthn/FIDO2 (donanım/platform authenticator). SMS-OTP yalnız düşük-güvenlik fallback'i olarak işaretlenir, birincil değildir. | should | integration (TOTP + WebAuthn doğrulama) |
| mfa-enforcement | MFA zorunluysa ikinci faktör olmadan oturum tamamlanmaz; birinci faktör (parola) geçse bile `mfa_required` durumu oturumu yarım tutar ve API erişimini reddeder. | must | integration (2. faktör yok → giriş reddedilir) |
| mfa-step-up | Hassas eylem (para transferi, yetki değişimi, tenant geçişi) için step-up MFA istenir; mevcut oturum yeterli değilse eylem öncesi yeniden faktör doğrulaması yapılır. Bu eylemin *izinli* olup olmadığı yine PDP'ye sorulur. | should | integration (step-up karar-logu) |
| mfa-recovery | Kurtarma kodları tek-kullanımlık ve hash'li saklanır; kullanılmış kod tekrar kabul edilmez. Kurtarma akışı da audit'lenir. | must | unit (tek-kullanım) + audit |
| mfa-factor-storage | MFA faktörleri (`mfa_factors` tablosu) tenant+user-scoped saklanır; TOTP secret şifreli (envelope) tutulur, düz-metin yasaktır. | must | review + migration |

## 5. Tenant-Aware Kimlik ve IAM Servis Sınırı

IAM, kimliğin hangi tenant bağlamında geçerli olduğunu ve servis sınırını tanımlar; bu bölüm çok-kiracılık kimlik izolasyonunu netleştirir.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| iam-tenant-context | Her doğrulanmış istek `tenant_id` bağlamı taşır (token claim + request context); `tenant_id` olmayan kimlikli istek 403 döner. Tenant bağlamı PDP'ye ve RLS'e girdi olur. | must | integration (tenant'sız → 403) |
| iam-identity-boundary | Kimlik+kimlik-yönetimi tek servis sınırında (`platform/kernel/authn`) toplanır; kimlik verisi (credential, session, mfa_factor) iş modüllerine sızmaz. Party (aktör kimliği) `k-party` primitifinden okunur. | should | review (bounded-context) |
| iam-cross-tenant-isolation | Bir tenant'ın kullanıcısı başka tenant'ın kimlik/oturum verisine erişemez; PostgreSQL RLS (`tenant_id`) ile zorlanır. Çapraz-tenant kimlik sızıntısı blocker'dır. | must | integration (RLS izolasyon) |
| iam-audit-trail | Kimlik olayları (login, logout, MFA challenge, SSO callback, credential değişimi) değişmez audit event'e yazılır (`actor`, `tenant_id`, `action`, `result`, `correlation_id`); bu akış `observability` standardının `obs-audit-events` kuralına bağlanır. | must | audit (kritik olay → değişmez kayıt) |

## 6. Oturum Yönetimi

Oturum, token'ın yaşam döngüsünü ve eşzamanlılık sınırlarını yönetir; bu bölüm timeout ve iptal kurallarını tanımlar.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| session-timeout | Oturum idle-timeout (ör. 30 dk hareketsizlik) ve absolute-timeout (ör. 12 saat) taşır; süre dolunca token geçersizleşir ve yeniden kimlik gerekir. | must | integration (timeout → 401) |
| session-concurrent-limit | Eşzamanlı oturum sayısı politika ile sınırlıdır; sınır aşılınca en eski oturum iptal edilir veya yeni oturum reddedilir (config'e göre). | should | integration (limit aşımı) |
| session-revocation | Logout, parola değişimi veya güvenlik olayı oturumu anında iptal eder (refresh reuse-detection ile); iptal edilmiş token 401 döner. | must | integration (revoke → 401) |

## 7. Backend Sözleşmesi (FastAPI + SQLAlchemy + Alembic)

Backend, kimlik doğrulamayı FastAPI dependency katmanında ve SQLModel persistansında uygular; imzalar bu şekilde kurulur.

- **Doğrulama dependency:** `Depends(authenticate())` gelen isteğin token'ını doğrular ve `Actor(party_id, tenant_id, roles, capabilities)` bağlamını üretir. Bu dependency **yetki vermez** — üretilen `Actor`, yetki için PDP'ye (`04` standardındaki `require(...)`) girdidir.
- **Persistans:** `credential`, `session`, `idp_config`, `mfa_factors` tabloları SQLModel model + Alembic migration ile tanımlanır; hepsi tenant-scoped ve RLS'lidir. TOTP secret ve refresh token hash'li/şifreli saklanır.
- **OIDC/SAML:** OIDC discovery + JWKS doğrulama; SAML SP metadata + assertion imza doğrulaması. IdP entegrasyonu tenant-config'ten okunur, koda gömülmez.
- **Hata taksonomisi:** Kimlik hataları standart zarf (`{code, message, trace_id}`) döner; 401 (kimlik yok/geçersiz) ile 403 (kimlik var, yetki yok — PDP kararı) ayrı tutulur.

## 8. Frontend Sözleşmesi (Vite + React + TanStack)

Frontend, kimlik akışını yönetir ama yetki *hesaplamaz*; bu bölüm login/session/MFA yüzeyini tanımlar.

- **Login + session akışı:** Login formu (RHF/Zod), OAuth2/OIDC redirect + callback, SSO IdP seçimi; token `httpOnly` cookie'de tutulur, TanStack Query ile oturum durumu (`/me`) çözülür.
- **MFA challenge UI:** İkinci faktör ekranı (TOTP kod girişi, WebAuthn prompt); step-up akışında hassas eylem öncesi challenge gösterilir.
- **Yetki yansıtma:** Frontend'in gösterdiği/gizlediği aksiyon backend PDP kararını *yansıtır* (bkz. `04` permission-aware rendering); frontend token'a bakıp yetki hesaplamaz. Optimistic frontend gizleme güvenlik değildir — her mutasyon backend'de yeniden doğrulanır (§10).

## 9. Test Stratejisi

Kimlik katmanı beş test sınıfıyla doğrulanır; DoD bunları zorunlu tutar.

1. **AuthN doğruluğu:** Geçerli kimlik token üretir; imzasız/süresi geçmiş token 401 döner (RS256 doğrulama).
2. **Refresh rotation + reuse:** Refresh rotasyonu yeni token üretir; kullanılmış refresh reuse-detection ile tüm zinciri iptal eder.
3. **SSO/MFA:** SSO callback yerel session üretir; MFA olmadan giriş reddedilir; step-up hassas eylemde tetiklenir.
4. **Tenant izolasyonu:** Çapraz-tenant kimlik/oturum erişimi RLS ile reddedilir (blocker testi).
5. **Audit + timeout:** Kimlik olayları değişmez audit'e yazılır; idle/absolute timeout token'ı geçersizleştirir.

## 10. Anti-Patterns (Kaçınılacaklar)

- **Kimlik katmanına yetki gömmek:** AuthN dependency içinde `if role == admin` yazmak. → Yetki PDP'de; AuthN yalnız `Actor` üretir.
- **Optimistic frontend yetkiyi güvenlik sanmak:** Butonu gizleyip API'da doğrulamamak. → Frontend yansıtır, backend PEP her mutasyonu yeniden doğrular.
- **HS256 / `alg:none`:** Paylaşımlı-sır veya imzasız token. → RS256/ES256 asimetrik imza zorunlu.
- **`localStorage`'da token:** XSS ile çalınabilir. → `httpOnly` + `Secure` cookie.
- **MFA'yı birincil parolaya bağlamak:** Parola geçince MFA'yı atlamak. → `mfa_required` oturumu yarım tutar.
- **Tenant'sız kimlik:** `tenant_id` bağlamı olmadan istek geçirmek. → Her kimlikli istek tenant-scoped.
- **Prisma/Supabase auth:** Yasak stack. → FastAPI + SQLAlchemy + kendi/OIDC IdP.

## 11. Definition of Done (DoD)

- JWT RS256 + refresh rotation + reuse-detection implemente; token config-driven, koda gömülü süre yok.
- OAuth2/OIDC (PKCE) + SSO (SAML/OIDC, JIT provisioning) + MFA (TOTP/WebAuthn, step-up) çalışıyor; `sso.json`/`mfa.json`/`oidc.json` sözleşmeleri `StandardRefsSchema` ile bağlı.
- Tenant-aware kimlik + RLS izolasyonu test-kanıtlı; çapraz-tenant sızıntı blocker olarak yakalanıyor.
- Kimlik olayları değişmez audit'e (`obs-audit-events`) yazılıyor.
- Yetki kararı PDP'ye delege; kimlik katmanında yetki mantığı yok (anti-pattern review yeşil).
- 5 test sınıfı yeşil; `check-standards-coverage` yeşil.

## 12. Requirement-ID Tablosu

İzlenebilirlik için her normatif gereksinim tekil ID taşır; test ve PR'lar bunları referanslar.

| ID | Requirement | Layer | Priority | TestType | AC (Acceptance Criteria) | Owner |
|---|---|---|---|---|---|---|
| IAM-R01 | Access token RS256/ES256 asimetrik imza; HS256/`alg:none` yasak | backend | P0 | unit | İmzasız/süresi geçmiş token 401 döner | IAM ekibi |
| IAM-R02 | Access token ≤15 dk; süre config-driven | backend | P0 | unit | Token exp claim config değerine eşit | IAM ekibi |
| IAM-R03 | Refresh rotation + reuse-detection | backend | P0 | integration | Kullanılmış refresh tüm zinciri iptal eder | IAM ekibi |
| IAM-R04 | OAuth2 authorization-code + PKCE; OIDC id_token claim doğrulaması | backend | P1 | integration | code→token + id_token claim doğru | IAM ekibi |
| IAM-R05 | Parola argon2id/bcrypt(cost≥12); düz-metin yasak | backend | P0 | unit | Hash algoritması doğrulanır | IAM ekibi |
| IAM-R06 | SSO OIDC + SAML 2.0; assertion/id_token imza doğrulaması | backend | P1 | integration | Bozuk assertion reddedilir | IAM ekibi |
| IAM-R07 | SSO JIT provisioning; IdP claim→Party+rol map (yetki PDP'de) | backend | P1 | integration | Yeni kullanıcı + rol eşlemesi oluşur | IAM ekibi |
| IAM-R08 | MFA TOTP + WebAuthn; SMS-OTP yalnız fallback | backend | P1 | integration | TOTP+WebAuthn faktörü doğrulanır | IAM ekibi |
| IAM-R09 | MFA enforcement; 2. faktör olmadan oturum tamamlanmaz | backend | P1 | integration | İkinci faktör yok → giriş reddedilir | IAM ekibi |
| IAM-R10 | Step-up MFA hassas eylemde; eylem izni PDP'ye sorulur | backend | P1 | integration | Step-up karar-logu üretilir | IAM ekibi |
| IAM-R11 | Tenant-aware kimlik; tenant'sız istek 403 | backend | P0 | integration | `tenant_id` yok → 403 | IAM ekibi |
| IAM-R12 | Çapraz-tenant kimlik/oturum izolasyonu (RLS) | backend | P0 | integration | Çapraz-tenant erişim reddedilir | IAM ekibi |
| IAM-R13 | Kimlik olayları değişmez audit event'e yazılır | backend | P1 | audit | Kritik olay değişmez kayıt üretir | IAM ekibi |
| IAM-R14 | Oturum idle + absolute timeout; revocation anında | backend | P1 | integration | Timeout/revoke sonrası token 401 | IAM ekibi |
| IAM-R15 | Frontend token httpOnly+Secure cookie; localStorage yasak | frontend | P1 | e2e | Hassas token localStorage'da değil | Frontend ekibi |
| IAM-R16 | Yetki kararı PDP'ye delege; AuthN'de yetki mantığı yok | backend | P0 | review | Anti-pattern review yeşil | IAM ekibi |
| IAM-R17 | Stack FastAPI+SQLAlchemy+Alembic+PostgreSQL; Next/Supabase/Prisma yasak | backend | P0 | review | `check-dependency-policy` yeşil | IAM ekibi |
