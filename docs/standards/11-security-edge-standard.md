# 11 — Security & Edge Standardı (Kenar Güvenlik)

Sürüm: 1.0 — 2026-07-01
Aile (`family`): devops · Öncelik: P1 (WAF/DDoS/rate-limit/CORS/headers) + P2 (E2EE)
Makine kontratı: `src/data/standards/edge-security.json` (PROMPT 3/14 ile üretilir; bu anlatı onu *anlatır*, kuralı yeniden tanımlamaz). E2EE hedefli-kapsam sözleşmesi ayrıca beyan edilir.
Referans (mevcut kaynaklar): `docs/standards/numeronym-siniflandirma.md §2` (WAF/DDoS/CDN/DNS "Kısmi — D4"), `plan-01` D4 (scale-invariant + kenar), `src/data/standards/observability.json` (`obs-audit-events`, `obs-pii-safe-logging`), `docs/pdp-policy-contract.md` (yetki kararı ayrı katman).
Stack: FastAPI + SQLAlchemy 2.0/SQLModel + PostgreSQL (BE); Vite + React (FE); Docker Compose + Hetzner/Debian baz (infra). YASAK: Next.js, Supabase, Prisma.

---

## 1. Amaç ve Kapsam Sınırı

Bu standart, uygulamanın *kenarını* (edge) — dış dünyaya bakan yüzeyini — güvenlik disiplinine bağlar: kötü-niyetli istekleri loglanabilir kılmak (WAF-ready), hacim saldırısını sönümlemek (DDoS/rate-limit), tarayıcı güven sınırlarını (CORS, security headers) sıkılaştırmak ve hassas veri için uçtan-uca şifreleme (E2EE) kapsamını beyan etmek. Kenar güvenlik, kimlik (`03`) ve yetki (`04`, PDP) katmanlarını *tamamlar*, onların yerine geçmez: rate-limit bir isteği hacim nedeniyle keser, PDP ise yetki nedeniyle; ikisi ayrı eksendir.

Kapsama giren: WAF-ready request logging, DDoS mitigation kancaları, rate limiting (tenant-aware), security headers, CORS policy, E2EE beyanı (hedefli). Kapsama girmeyen: yetki kararı (PDP), kimlik doğrulama (`03`), altyapı-kod provisyonu (IaC — ayrı `iac.json`), secret yönetimi detayı (IaC kapsamında; burada yalnız "düz-metin secret yasak" invariantı tekrarlanır).

## 2. WAF-Ready Logging

WAF (Web Application Firewall) katmanı önde olsun ya da olmasın, uygulama isteği WAF-analiz-edilebilir biçimde loglar; bu bölüm kötü-niyetli-istek görünürlüğünü tanımlar.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| edge-waf-ready-log | Her gelen istek yapısal JSON olarak (`obs-structured-logging` ile hizalı) loglanır: metod, yol, kaynak-IP, `user-agent`, `correlation_id`, status, süre. Bu format WAF/SIEM'in şüpheli-istek analizini besler. | must | middleware testi (istek log alanları) + review |
| edge-attack-signal-log | Şüpheli desenler (SQLi/XSS payload, path-traversal, anormal boyut) işaretlenerek loglanır; ham payload PII-güvenli (`obs-pii-safe-logging`) biçimde redakte edilir. Ham request body olduğu gibi loglanmaz. | must | integration (kötü istek işaretlenir + redakte) |
| edge-blocklist-hook | IP/pattern blocklist kancası vardır (WAF veya app-seviyesi); bloklanan istek loglanır ve 403 döner. Blocklist config-driven'dır, koda gömülmez. | should | integration (blocklist → 403 + log) |

## 3. DDoS Mitigation ve Rate Limiting

Hacim saldırısı ve kötüye-kullanım rate-limit + throttle ile sönümlenir; bu bölüm istek-hızı sınırlarını tanımlar.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| edge-rate-limit | Her endpoint sınıfı için istek-hızı sınırı uygulanır (token-bucket/sliding-window); sınır aşımında 429 döner ve `Retry-After` + `RateLimit-*` header'ları set edilir. | must | integration (limit aşımı → 429 + header) |
| edge-rate-limit-tenant | Rate limit tenant-aware'dir: bir tenant'ın trafiği başka tenant'ın kotasını tüketmez; kimlik-öncesi (login) uçlar IP-bazlı, kimlik-sonrası uçlar tenant/actor-bazlı sınırlanır. | must | integration (tenant izolasyonlu kota) |
| edge-ddos-hook | DDoS sönümleme kancaları vardır: upstream (CDN/edge proxy) katmanına devredilebilir connection/rate limitleri app-config'te beyan edilir; app-seviyesi throttle son savunma hattıdır. | should | review + integration (throttle son hat) |
| edge-expensive-op-guard | Pahalı işlemler (export, rapor, arama) daha sıkı sınırlıdır ve gerekiyorsa async'e (queue) itilir; senkron pahalı-uç DDoS yüzeyi olamaz. | should | integration (pahalı uç sıkı limit) |

## 4. Security Headers

Tarayıcı güvenliği HTTP response header'larıyla sıkılaştırılır; bu bölüm zorunlu header setini tanımlar.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| edge-security-headers | Her yanıt şu header'ları taşır: `Strict-Transport-Security` (HSTS), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (veya CSP `frame-ancestors`), `Referrer-Policy`, `Content-Security-Policy`. Header seti merkezî middleware'de set edilir. | must | integration (yanıt header taraması) |
| edge-csp-strict | CSP `default-src 'self'` tabanlıdır; inline script/style `unsafe-inline` yerine nonce/hash ile açılır. `unsafe-eval` yasaktır. | should | integration (CSP ihlali raporlanır) |
| edge-no-server-leak | Yanıtlar sunucu/stack sürüm bilgisini sızdırmaz (`Server`, `X-Powered-By` header'ı çıkarılır); hata yanıtı stack-trace döndürmez. | must | integration (bilgi-sızıntısı header yok) |

## 5. CORS Policy

Çapraz-köken erişimi allowlist ile sıkı yönetilir; bu bölüm CORS güven sınırını tanımlar.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| edge-cors-allowlist | `Access-Control-Allow-Origin` açık allowlist'ten okunur; `*` wildcard credential'lı istekte yasaktır. İzinli origin'ler config-driven'dır. | must | integration (izinsiz origin reddedilir) |
| edge-cors-methods | İzinli metod/header'lar açıkça beyan edilir (geniş `*` yerine); preflight (`OPTIONS`) doğru yanıtlanır. | should | integration (preflight doğru) |
| edge-cors-credentials | `Allow-Credentials: true` yalnız belirli allowlist origin'lerle kombinlenir; wildcard origin + credential kombinasyonu yasaktır (tarayıcı da reddeder, sunucu da izin vermez). | must | integration (wildcard+credential yok) |

## 6. E2EE — End-to-End Encryption Beyanı (YENİ, Hedefli Kapsam)

E2EE tüm portföyde varsayılan-zorunlu değildir; yalnız gerçekten uçtan-uca şifreleme gereken veri sınıfları için hedefli uygulanır — bu bölüm o kapsamı ve invariantı beyan eder.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| edge-e2ee-scope | E2EE hedefli-kapsamdır: yalnız "uçtan-uca gizlilik gerektiren" olarak etiketlenmiş veri (ör. özel mesaj, hassas doküman) için uygulanır. Kapsam-dışı veri için "E2EE kapsam-dışı" açıkça beyan edilir; her yere dayatılmaz. | may | review (kapsam beyanı mevcut) |
| edge-e2ee-plaintext-invariant | E2EE-etiketli veri sunucuda düz-metin olarak asla saklanmaz/loglanmaz; envelope encryption (istemci-tarafı veya KMS-yönetimli anahtar) uygulanır. Plaintext'in DB'de bulunması blocker'dır. | must | integration (plaintext DB'de yok) |
| edge-e2ee-transport | Taşımada TLS zorunludur (transport encryption) — bu E2EE'nin *yerine geçmez*, tümleyicidir; E2EE-etiketli veri hem transport-şifreli hem uçtan-uca şifrelidir. | must | review + config (TLS zorunlu) |
| edge-secret-no-plaintext | Kenar-config'inde (ve repoda) düz-metin secret yasaktır; anahtar/sır env-injection veya vault'tan gelir (detay IaC standardında). Bu invariant `plan-01` D4 ile hizalı. | must | gitleaks (secret taraması yeşil) |

## 7. Backend Sözleşmesi (FastAPI + SQLAlchemy)

Kenar güvenlik FastAPI middleware zincirinde ve config katmanında uygulanır; imzalar bu şekilde kurulur.

- **Middleware zinciri:** İstek sırasıyla request-logging (WAF-ready) → rate-limit → CORS → security-headers middleware'lerinden geçer; her biri config-driven'dır (`edge-config`), koda gömülü sabit yoktur.
- **Rate-limit store:** Sayaç dağıtık-uyumlu store'da (ör. Redis) tutulur; tenant/actor/IP anahtarıyla token-bucket uygulanır. Sınır aşımı 429 + standart header döner.
- **E2EE:** E2EE-etiketli alanlar envelope encryption ile şifreli-blob olarak (`encrypted` kolon) saklanır; şifre çözme yalnız yetkili istemci/anahtar-sahibi tarafında olur. Sunucu plaintext görmez/loglamaz.
- **Hata + log:** Kenar-red kararları (429/403) `obs-audit-events` ve WAF-ready log'a yazılır; ham payload redakte edilir.

## 8. Frontend/Edge Sözleşmesi (Vite + React + Edge Proxy)

Frontend statik-asset güvenliğini ve E2EE istemci-tarafını yönetir; edge proxy transport ve cache disiplinini taşır.

- **Static asset:** Build çıktısı immutable-hash'li servis edilir; `Cache-Control` doğru set edilir (statik asset uzun cache, HTML no-cache). CSP ile yalnız `'self'` + izinli kaynaklar yüklenir.
- **E2EE client:** E2EE-etiketli veri istemci-tarafında şifrelenip gönderilir/çözülür (Web Crypto); anahtar sunucuya düz-metin gitmez.
- **CDN/edge:** Statik asset + cache-header CDN'e devredilebilir; dinamik/kimlikli yanıt cache'lenmez. Bu, `numeronym-siniflandirma §2` "CDN Kısmi" satırını tamamlar.

## 9. Test Stratejisi

Kenar güvenlik beş test sınıfıyla doğrulanır; DoD bunları zorunlu tutar.

1. **WAF-ready log:** Kötü-niyetli istek işaretlenip PII-güvenli loglanır; ham body olduğu gibi loglanmaz.
2. **Rate-limit/DDoS:** Sınır aşımı 429 + `Retry-After`/`RateLimit-*` header döner; tenant kotası izole; pahalı uç sıkı sınırlı.
3. **Security headers:** Yanıt HSTS/nosniff/frame/CSP/referrer header'larını taşır; sürüm-sızıntısı header'ı yok.
4. **CORS:** İzinsiz origin reddedilir; wildcard+credential kombinasyonu yok; preflight doğru.
5. **E2EE + secret:** E2EE-etiketli veri DB'de plaintext değil (blocker testi); gitleaks düz-metin secret bulmaz (yeşil).

## 10. Anti-Patterns (Kaçınılacaklar)

- **Rate-limit'i yetki sanmak:** Hacim sınırını yetki kararı yerine koymak. → Rate-limit hacim ekseni; yetki PDP'de.
- **Ham request body loglamak:** PII/sır sızdırmak. → PII-güvenli redakte (`obs-pii-safe-logging`).
- **CORS `*` + credential:** Güven sınırını açmak. → Açık allowlist + credential yalnız belirli origin.
- **Düz-metin secret repoda:** Anahtar/sır kod deposunda. → env-injection/vault; gitleaks kapısı.
- **E2EE'yi her yere dayatmak:** Gereksiz karmaşıklık. → Hedefli kapsam + "kapsam-dışı" beyanı.
- **E2EE plaintext'i loglamak/saklamak:** Gizlilik ihlali. → Envelope encryption; sunucu plaintext görmez.
- **Stack sürümünü sızdırmak:** `Server`/`X-Powered-By` + stack-trace yanıtı. → Bilgi-sızıntısı header'ı kaldır, hata zarfı sabit.

## 11. Definition of Done (DoD)

- WAF-ready structured logging (kötü-istek işaretli, PII-güvenli) çalışıyor; blocklist kancası config-driven.
- Rate-limit tenant-aware (429 + standart header); DDoS son-savunma throttle + pahalı-uç async-itme mevcut.
- Security headers (HSTS/nosniff/frame/CSP/referrer) merkezî middleware'de; sürüm-sızıntısı kapatıldı.
- CORS allowlist-driven; wildcard+credential yok; preflight doğru.
- E2EE hedefli-kapsam beyan edildi; E2EE-etiketli veri DB'de plaintext değil (test-kanıtlı); düz-metin secret yok (gitleaks yeşil).
- Kenar-red kararları audit + WAF-log'a yazılıyor; PDP/kimlik katmanıyla çakışma yok (ayrı eksen).
- 5 test sınıfı yeşil; `check-execution-readiness` yeşil.

## 12. Requirement-ID Tablosu

İzlenebilirlik için her normatif gereksinim tekil ID taşır; test ve PR'lar bunları referanslar.

| ID | Requirement | Layer | Priority | TestType | AC (Acceptance Criteria) | Owner |
|---|---|---|---|---|---|---|
| SEC-R01 | WAF-ready structured request logging (metod/yol/IP/corr-id/status) | backend | P1 | integration | İstek log alanları tam ve yapısal | Platform güvenlik |
| SEC-R02 | Şüpheli desen işaretlenir + PII-güvenli redakte; ham body loglanmaz | backend | P1 | integration | Kötü istek işaretli + redakte | Platform güvenlik |
| SEC-R03 | Blocklist kancası config-driven → 403 + log | backend | P2 | integration | Bloklanan istek 403 + loglanır | Platform güvenlik |
| SEC-R04 | Rate-limit token-bucket → 429 + `Retry-After`/`RateLimit-*` | backend | P1 | integration | Limit aşımı 429 + header döner | Platform güvenlik |
| SEC-R05 | Rate-limit tenant-aware (kota izolasyonu) | backend | P1 | integration | Tenant kotası başka tenanta sızmaz | Platform güvenlik |
| SEC-R06 | DDoS son-savunma throttle; pahalı uç async'e itilir | backend | P1 | integration | Pahalı uç sıkı sınırlı/async | Platform güvenlik |
| SEC-R07 | Security headers (HSTS/nosniff/frame/CSP/referrer) merkezî | backend | P1 | integration | Yanıt zorunlu header'ları taşır | Platform güvenlik |
| SEC-R08 | CSP `default-src 'self'`; `unsafe-eval` yasak | fullstack | P1 | integration | CSP ihlali raporlanır | Platform güvenlik |
| SEC-R09 | Sürüm/stack sızıntısı header'ı yok; stack-trace yanıtı yok | backend | P1 | integration | Bilgi-sızıntısı header'ı yok | Platform güvenlik |
| SEC-R10 | CORS allowlist-driven; izinsiz origin reddedilir | backend | P1 | integration | İzinsiz origin CORS-reddi alır | Platform güvenlik |
| SEC-R11 | CORS wildcard+credential kombinasyonu yasak | backend | P1 | integration | Wildcard+credential yok | Platform güvenlik |
| SEC-R12 | E2EE hedefli-kapsam beyanı; kapsam-dışı açıkça işaretli | governance | P2 | review | Kapsam beyanı mevcut | Platform güvenlik |
| SEC-R13 | E2EE-etiketli veri DB'de plaintext değil (envelope encryption) | backend | P2 | integration | Plaintext DB'de yok (blocker) | Platform güvenlik |
| SEC-R14 | TLS zorunlu (transport); E2EE'yi tümler, yerine geçmez | infra | P1 | review | TLS config zorunlu | Platform güvenlik |
| SEC-R15 | Repoda/config'te düz-metin secret yasak | infra | P1 | gitleaks | gitleaks taraması yeşil | Platform güvenlik |
| SEC-R16 | Kenar-red kararları audit + WAF-log'a yazılır | backend | P1 | audit | 429/403 kararı loglanır | Platform güvenlik |
| SEC-R17 | Stack FastAPI+SQLAlchemy+PostgreSQL; Next/Supabase/Prisma yasak | infra | P1 | review | `check-dependency-policy` yeşil | Platform güvenlik |
