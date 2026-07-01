# DevOps & Altyapı Standardı — CI/CD · IaC-hazırlık · v12n · Secret · Backup/Restore

**Sürüm:** 1.0 — 2026-07-01
**Statü:** Anlatı standardı (ADR-0027 katmanı). **Kod karşılığı (hedef):** `src/data/standards/iac.json` (`StandardContractSchema`) + `src/data/standards/edge-security.json` + düğüm bağı `standardRefs` + CI kapısı `check-execution-readiness` (mevcut) genişletilir.
**Aile:** `devops`. **Öncelik:** IaC/CI-CD **P1**, v12n/secret **P2**, backup/restore hazırlık **P1**.
**Bağlam:** `plan-01` Dalga 4 (operasyon kası + kenar-güvenlik + scale-invariant); `enterprise-dod.md` §2.13 (Deployment) / §2.14 (Rollback); `enterprise-standards-audit-2026-07-01.md` §2 (IaC/v12n boşlukları). v12n (sanallaştırma/konteyner) bu standarda aittir.

---

## 1. Bu nedir / ne yapar / ne yapmaz

**Bu nedir?** Ürünün *üretime nasıl taşındığını, nasıl ayakta tutulduğunu ve nasıl geri alındığını* tek-kaynak, CI-zorlamalı bir sözleşmeye bağlayan mühendislik standardı. Terminoloji (ilk geçişte): **IaC** = infrastructure as code (altyapının kodla tanımı — bu repoda Docker Compose baz + env-validation olarak hazırlık seviyesinde); **v12n** = virtualization (sanallaştırma/konteynerleştirme); **CI/CD** = continuous integration / delivery (otomatik build-test-deploy hattı); **secret** = parola/anahtar/token gibi asla repoya girmeyecek gizli değer; **RTO/RPO** = recovery time/point objective (kurtarma süre/veri-kaybı hedefi).

**Ne işe yarar?** 50+ app'lik portföyde her app'in "kendi deploy'unu icat etmesini" engeller; deploy tekrarlanabilir, secret düz-metin dışında, backup/restore denenmiş olur. Bu standart olmadan bir app "enterprise-ready" (L3, `core-enterprise-maturity-ladder.md`) sayılmaz.

**Ne yapar?** Düğüm `standardRefs`'e IaC/edge-security referansıyla bağlanır; `check-execution-readiness` (+ önerilen `check-secrets`/gitleaks) kapısı uyumu denetler (secret taraması, env-validation, reproducible build, deploy dry-run).

**Ne yapmaz?** Gerçek altyapı-provisioning kodunu (Terraform/Ansible tam otomasyonu) bu depoda üretmez — burası plan+sözleşme katmanıdır; IaC *hazırlığını* (Docker Compose baz + env sözleşmesi + secret disiplini) tanımlar, platform reposunda uygulanır. K8s tam otomasyonu L3 çok-bölge için opsiyoneldir.

---

## 2. Kapsam ve stack kısıtı

Bu standart altı ekseni kapsar ve şu şekilde uygulanır: her eksen bir CI kapısına veya deployment checklist kalemine bağlanır. Aşağıdaki tablo eksenleri, önceliğini ve zorlama biçimini verir.

| Eksen | Ne kapsar | Priority | Zorlama |
|---|---|---|---|
| CI/CD | Otomatik build → test → staging deploy → prod deploy hattı | P0 | `deploy.yml` bloklayıcı kapılar |
| IaC-hazırlık | Docker Compose baz, env-validation, reproducible build | P1 | `check-execution-readiness` + deploy dry-run |
| v12n (konteyner) | Dockerfile/Compose, container-ready, reproducible image | P2 | hadolint + reproducible build testi |
| Secret management | Vault/env deseni; repoda secret yok | P2 | gitleaks (önerilen `check-secrets`) |
| Backup/Restore hazırlık | Yedek + belgelenmiş geri-yükleme; restore-drill | P1 | Restore-drill CI job |
| Deployment checklist | Yayın öncesi/sonrası doğrulama listesi | P1 | Release owner imzası + `release-policy.md` |

Stack kısıtı (mutlak): deploy hedefi **Hetzner + Debian + AMD EPYC + Docker**; üretim DB'si yalnız **PostgreSQL**; ORM yalnız SQLAlchemy 2.0 / SQLModel + Alembic. **Yasak:** Next.js, Supabase, Prisma. K8s yalnız L3 çok-bölge için opsiyonel; baz dağıtım Docker Compose'dur.

---

## 3. CI/CD — bloklayıcı kapı hattı

CI/CD, main'e her merge'i denetleyen bloklayıcı kapı hattıdır ve şu şekilde uygulanır: her kapı `deploy` iş akışının `build` job'ında `node tools/agents/<kapı>.mjs` olarak koşar; biri sıfırdan farklı çıkış kodu döndürürse build durur ve dağıtım yapılmaz. Aşağıdaki tablo bu standarda doğrudan bağlı olan kapıları ve neyi zorladığını verir (tam katalog: `ci-conformance-gates.md`).

| Kapı | Ne zorlar | Dosya |
|---|---|---|
| `check-execution-readiness` | Yürütme hazırlığı, done-evidence, deploy-traceability (IaC/v12n buraya bağlanır) | `tools/agents/check-execution-readiness.mjs` |
| `check-dependency-policy` | Yasak paket, güvensiz sürüm, lisans, lockfile commit | `tools/agents/check-dependency-policy.mjs` |
| `check-tech-profile` | Stack manifesti, headless kilidi, global yasak-lib (next/redux/MUI…) | `tools/agents/check-tech-profile.mjs` |
| `check-secrets` (ÖNERİLEN — YENİ) | gitleaks: repoda düz-metin secret yok | `tools/agents/check-secrets.mjs` (henüz yok — `plan-01` D4) |

Not: `check-secrets` ve restore-drill job'ı bugün `deploy.yml`'de **koşmuyor** (`enterprise-standards-audit-2026-07-01.md` Ek); bu standart onları `plan-01` Dalga 4 iş kalemi olarak zorunlu-kapı hedefi yapar. CI/CD hattı yeşil olmadan hiçbir sürüm etiketlenmez (`release-policy.md`: tag/release insan tarafından atılır).

---

## 4. IaC-hazırlık (Docker Compose baz)

IaC bu depoda tam-otomasyon değil, hazırlık seviyesindedir ve şu şekilde uygulanır: altyapı elle-tıklama ile değil, sürümlenmiş Docker Compose + env sözleşmesi ile tanımlanır; app tek başına `docker compose up` ile ayağa kalkar (bu aynı zamanda L1 kriteri L1-6'dır). Aşağıdaki tablo IaC-hazırlık kalemlerini ve DONE koşulunu verir.

| Kalem | Ne zaman DONE | Doğrulama |
|---|---|---|
| Docker Compose baz | app+kernel modülleri tek Compose dosyasıyla ayağa kalkar | `docker compose up` standalone kurulum |
| Reproducible build | Aynı commit → aynı imaj (pinned base image, lockfile) | Reproducible build testi |
| Env-validation | Tüm gerekli env değişkenleri başlangıçta doğrulanır; eksikse fail-fast | Env-validation testi (eksik env → başlatma reddi) |
| Health check | `/health` endpoint mevcut; load balancer kullanır | Health endpoint JSON `status: "ok"` |
| Zero-downtime hazırlık | Rolling/blue-green stratejisi belgeli (`release-versioning`) | Deploy dry-run |

IaC-hazırlık, Hetzner/Debian/AMD EPYC hedefine göre yazılır; base image Debian-slim pinlenir, secret imaja gömülmez (§6). Tam Terraform/Ansible otomasyonu platform reposunun işidir; bu sözleşme onun ön koşullarını (reproducible + env-validated + secret-free) tanımlar.

---

## 5. v12n (sanallaştırma / konteyner)

v12n, `numeronym-siniflandirma.md`'de ayrı düğümü olmayan ama bu standarda ait olan sanallaştırma/konteyner eksenidir ve şu şekilde uygulanır: uygulama container-ready olur, imaj reproducible ve minimal-yüzeyli üretilir. Aşağıdaki tablo v12n kalemlerini ve DONE koşulunu verir.

| Kalem | Ne zaman DONE | Doğrulama |
|---|---|---|
| Dockerfile lint | Dockerfile hadolint kurallarına uyar | hadolint raporu (0 kritik) |
| Minimal base image | Debian-slim / distroless; gereksiz paket yok | image inspect + boyut bütçesi |
| Non-root çalışma | Container root olarak çalışmaz | Dockerfile `USER` beyanı |
| Reproducible image | Pinned digest + lockfile → deterministik imaj | Reproducible build testi |
| Container-ready config | Config env'den; imaj ortamdan bağımsız | 12-factor config testi |

Not: v12n için ayrı `v12n.json` standardı üretilmez; bu eksen `iac.json` içinde kural olarak taşınır (`enterprise-standards-audit-2026-07-01.md` §6 "Do Not Implement Yet: v12n ayrı standart — şimdilik"). K8s topolojisi yalnız L3 çok-bölge için değerlendirilir.

---

## 6. Secret management (repoda secret YOK)

Secret disiplini bu standardın en katı kuralıdır ve şu şekilde uygulanır: hiçbir parola/anahtar/token repoya düz-metin girmez; secret'lar ortam-değişkeni veya Vault deseniyle enjekte edilir. Aşağıdaki tablo secret kurallarını ve zorlama biçimini verir.

| Kural | Ne garanti eder | Zorlama |
|---|---|---|
| Repoda düz-metin secret yok | Git geçmişinde parola/anahtar bulunmaz | gitleaks (önerilen `check-secrets` kapısı) |
| Env-injection / Vault | Secret runtime'da enjekte edilir, imaja gömülmez | Deploy dry-run + image inspect |
| Rotasyon hazırlığı | Secret döndürülebilir (kod değişmeden) | Env sözleşmesi + rotasyon runbook |
| `.env.example` var, `.env` yok | Şablon commit'li, gerçek değer değil | gitignore + gitleaks |

Bu kural `dependency-policy` (lockfile) ve `check-tech-profile` ile birlikte "repo güvenli" tabanını oluşturur. Secret sızıntısı P0 blocker'dır: gitleaks kırmızıysa merge açılmaz.

---

## 7. Backup / Restore hazırlık

Backup tek başına yetmez; denenmemiş restore işe yaramaz — bu yüzden şu şekilde uygulanır: otomatik yedek + belgelenmiş geri-yükleme + periyodik restore-drill zorunludur. Aşağıdaki tablo backup/restore kalemlerini, olgunluk seviyesini ve doğrulamayı verir.

| Kalem | Ne zaman DONE | Olgunluk | Doğrulama |
|---|---|---|---|
| Otomatik yedek | PostgreSQL düzenli yedeklenir (pg_dump/WAL) | L2 | Yedek dosyası + zamanlama kanıtı |
| Belgelenmiş restore | Geri-yükleme adımları runbook'ta | L2 | Runbook restore bölümü |
| Restore-drill | Yedekten geri-yükleme en az bir kez test edilmiş | L2 | Restore testi logu |
| DR tatbikatı | Felaket senaryosu tatbik; RTO/RPO ölçülü | L3 | DR tatbikat raporu (`core-enterprise-maturity-ladder` L3-2) |
| Migration snapshot | Alembic migration öncesi DB snapshot | L1 | `requireSnapshot: true` kanıtı |

Backup/restore, `enterprise-dod.md` §2.14 (Rollback) ile kenetlidir: uygulama-katmanı rollback (Alembic `downgrade()`) + veri-katmanı restore ayrı ayrı denenmiş olmalıdır. Restore-drill CI job'ı `plan-01` Dalga 4'te otomatik ve periyodik hedeflenir.

---

## 8. Deployment checklist

Yayın bir tek-adım değil, denetlenebilir bir kontrol listesidir ve şu şekilde uygulanır: her sürüm öncesi ve sonrası aşağıdaki kalemler işaretlenir; release owner imzalamadan prod deploy yapılmaz (`release-policy.md`). Aşağıdaki tablo checklist kalemlerini, evresini ve kim sorumlu olduğunu verir.

| # | Kalem | Evre | Sorumlu |
|---|---|---|---|
| 1 | Tüm bloklayıcı CI kapıları yeşil | pre-deploy | CI (makine) |
| 2 | Migration `upgrade()`+`downgrade()` dolu, dry-run geçti | pre-deploy | Geliştirici |
| 3 | Secret gitleaks temiz; env-validation geçti | pre-deploy | CI |
| 4 | DB snapshot alındı (`requireSnapshot`) | pre-deploy | Motor/otomasyon |
| 5 | Staging deploy doğrulandı; `/health` OK | pre-deploy | Release owner |
| 6 | Rollback prosedürü + owner atanmış | pre-deploy | Release owner |
| 7 | Prod deploy (blue-green/rolling); zero-downtime | deploy | Otomasyon |
| 8 | Post-deploy smoke test + SLO/alert aktif | post-deploy | Release owner |
| 9 | Sürüm etiketlendi (SemVer); release notu yayınlandı | post-deploy | Release owner (insan) |

Bu checklist, `enterprise-dod.md` §2.13 (Deployment) davranışsal kriterlerini operasyonel bir imza listesine indirger. Kalem 9 insan işidir: AI etiket/release atamaz.

---

## 9. Multi-tenant ve ölçek bağı

Deploy ölçek-değişmezliği (scale-invariance) taşımalıdır ve şu şekilde uygulanır: para/sipariş/stok yazan her akış outbox + idempotency invariant'ı ile deploy edilir (bayrak değil). Ortam yeni tenant/bölge eklendikçe deploy topolojisi değişmez; `adr-0026-tech-profiles` RLS/schema-per-tenant kararına göre aynı imaj çok-tenant hizmet verir. L3 çok-bölge (K8s) residency (`k-jurisdiction`) ile tutarlı olmalıdır ("TR verisi TR'de"). Bu bağ `plan-01` Dalga 4 scale-invariant kapısıyla zorlanır.

---

## 10. AI guardrail

Dört-aktör iş bölümü burada da geçerlidir ve şu şekilde uygulanır: **AI önerir → insan onaylar → motor uygular.** AI deploy manifesti/Compose/env sözleşmesi *önerisi* (`autonomy: draft`) üretebilir; ama prod deploy'u tetikleyemez, sürüm etiketleyemez, secret ekleyemez/okuyamaz, main branch'e push edemez, `deploy.yml` kapısını devre-dışı bırakamaz. Restore/rollback kararı insan release owner'ındır. AI'ın ürettiği her infra değişikliği PR olarak açılır, insan reviewer merge eder.

---

## 11. Bağlama (diğer standartlar/primitifler)

Bu standart yalnız değildir; şu şekilde uygulanır: mevcut standart ve primitiflerin operasyon yüzünü tamamlar. Aşağıdaki tablo bağlantıları ve her birinin katkısını verir.

| Bağ | Katkı |
|---|---|
| `release-versioning` (standart) | SemVer + feature-flag + blue-green/canary stratejisi |
| `dependency-policy` (standart) | Lockfile + yasak paket + lisans (secret tabanının parçası) |
| `observability` (standart) | Deploy sonrası SLO/alert/dashboard doğrulaması |
| `edge-security.json` (kardeş — WAF/DDoS/CDN/DNS) | Kenar güvenlik; rate-limit + CORS + security headers |
| `k-scale-invariant` (primitif) | Outbox + idempotency deploy invariant'ı |
| `k-jurisdiction` (primitif) | L3 çok-bölge residency zorlaması |

Kenar-güvenlik (WAF/DDoS/rate-limit/CDN/DNS) bu standardın kardeşidir ve ayrı `edge-security.json` sözleşmesinde yaşar (`plan-02` PROMPT 14); bu doküman ona referans verir, kuralını tekrar yazmaz.

---

## 12. Test / doğrulama stratejisi

Altyapı da test-önce doğrulanır ve şu şekilde uygulanır: her operasyon davranışı otomatik bir kontrole bağlanır. Aşağıdaki tablo doğrulama kümesini numara, kontrol ve tür ile verir.

| # | Kontrol | Tür |
|---|---|---|
| 1 | Reproducible build: aynı commit → aynı imaj digest | CI build testi |
| 2 | Env-validation: eksik env → başlatma reddi (fail-fast) | Integration |
| 3 | gitleaks: düz-metin secret yok | CI (check-secrets) |
| 4 | hadolint: Dockerfile 0 kritik ihlal | CI lint |
| 5 | Restore-drill: yedekten geri-yükleme çalışıyor | CI job (periyodik) |
| 6 | Deploy dry-run: staging deploy + `/health` OK | Integration/E2E |
| 7 | Migration downgrade: `alembic downgrade -1` sonrası app çalışıyor | Integration |
| 8 | Zero-downtime: rolling/blue-green sırasında istek düşmez | E2E (staging) |

---

## 13. Acceptance criteria

- AC-1: App tek başına `docker compose up` ile ayağa kalkıyor; env-validation eksik env'de fail-fast veriyor.
- AC-2: Reproducible build kanıtlı; aynı commit aynı imajı üretiyor.
- AC-3: gitleaks temiz; repoda düz-metin secret yok; secret runtime'da enjekte ediliyor.
- AC-4: Restore-drill en az bir kez çalışmış; geri-yükleme runbook'ta belgeli.
- AC-5: Migration `upgrade()`+`downgrade()` dolu; downgrade sonrası app çalışıyor.
- AC-6: Deployment checklist 9 kalemi işaretli; prod deploy release owner imzasıyla yapılıyor.
- AC-7: Zero-downtime deploy (blue-green/rolling) staging'de doğrulandı.

---

## 14. Anti-patterns (yasak desenler)

- **Repoda düz-metin secret:** Parola/anahtar/token commit etmek — P0 blocker, yasak.
- **Denenmemiş restore:** "Yedek var" deyip restore'u hiç test etmemek — DR'ı ölü metin yapar.
- **Elle-tıklama deploy:** Sürümlenmemiş, tekrarlanamaz manuel deploy — reproducible ilkesini bozar.
- **Migration'sız DDL:** Production'da doğrudan ALTER/DROP — `enterprise-dod` §2.3 ihlali.
- **`downgrade()` boş bırakmak:** Rollback yolu olmayan migration — geri-alınamaz deploy.
- **Yasak stack:** Next.js/Supabase/Prisma ile deploy — mutlak yasak.
- **AI'ın prod deploy/etiket atması:** Onay/imza kapısını atlamak — fail-closed ihlali.

---

## 15. DoD (Definition of Done)

§12'deki 8 kontrolün tamamı yeşil; `iac.json` (+ `edge-security.json` kardeş) sözleşmesi üretildi ve `StandardRefsSchema`'ya opsiyonel ref eklendi; `check-secrets`/gitleaks kapısı `deploy.yml`'e eklendi ve yeşil; restore-drill CI job'ı çalışıyor; deployment checklist 9 kalemi belgeli; hiçbir düz-metin secret repoda yok; Docker Compose baz Hetzner/Debian/AMD EPYC hedefine göre reproducible; `check-execution-readiness` yeşil; PR açıldı, insan reviewer merge etti (main'e doğrudan push yok, insan tag atar).

---

## 16. Requirement-ID tablosu

Aşağıdaki tablo bu standardın izlenebilir gereksinimlerini kimliklendirir; her satır bir gereksinim, katmanı, önceliği, test türü, ilgili acceptance criteria ve sahibiyle eşlenir.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| DVI-01 | Docker Compose baz; app standalone ayağa kalkar | Infra | P0 | Integration | AC-1 | DevOps geliştirici |
| DVI-02 | Env-validation: eksik env → fail-fast | Infra | P0 | Integration | AC-1 | DevOps geliştirici |
| DVI-03 | Reproducible build (pinned image + lockfile) | Infra | P1 | CI build | AC-2 | DevOps geliştirici |
| DVI-04 | gitleaks/check-secrets: repoda secret yok | Infra | P0 | CI | AC-3 | DevOps geliştirici |
| DVI-05 | Secret env-injection / Vault deseni | Infra | P1 | Integration | AC-3 | DevOps geliştirici |
| DVI-06 | hadolint: Dockerfile 0 kritik; non-root; minimal base | Infra | P2 | CI lint | AC-2 | DevOps geliştirici |
| DVI-07 | Otomatik yedek (PostgreSQL pg_dump/WAL) | Infra | P1 | Integration | AC-4 | DevOps geliştirici |
| DVI-08 | Restore-drill CI job (periyodik) | Infra | P1 | CI job | AC-4 | DevOps geliştirici |
| DVI-09 | Migration downgrade çalışıyor | Backend | P0 | Integration | AC-5 | Backend geliştirici |
| DVI-10 | Migration öncesi DB snapshot (`requireSnapshot`) | Infra | P1 | Integration | AC-5 | DevOps geliştirici |
| DVI-11 | CI/CD hattı: build→test→staging→prod bloklayıcı | Infra | P0 | CI | AC-6 | DevOps geliştirici |
| DVI-12 | Deployment checklist 9 kalemi + owner imzası | Governance | P1 | Manuel+CI | AC-6 | Release owner |
| DVI-13 | Zero-downtime deploy (blue-green/rolling) | Infra | P1 | E2E | AC-7 | DevOps geliştirici |
| DVI-14 | Health check `/health` endpoint | Backend | P1 | Integration | AC-1 | Backend geliştirici |
| DVI-15 | scale-invariant deploy (outbox+idempotency invariant) | Infra | P1 | Integration | AC-6 | DevOps geliştirici |
| DVI-16 | L3 çok-bölge residency tutarlılığı (K8s opsiyonel) | Infra | P2 | Integration | AC-6 | DevOps geliştirici |

---

*Kardeş sözleşme: `edge-security.json` (WAF/DDoS/CDN/DNS — kenar güvenlik). İlgili: `release-versioning` (SemVer/blue-green), `dependency-policy` (lockfile/secret tabanı), `observability` (deploy-sonrası SLO), `enterprise-dod.md` §2.13/§2.14, `core-enterprise-maturity-ladder.md` (L2 backup, L3 DR), `ci-conformance-gates.md` (kapı kataloğu), `plan-01` Dalga 4. Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız anlatı standardıdır — `iac.json` makine sözleşmesi ile birlikte merge edilir. Çelişki halinde `enterprise-dod.md` (deployment) önceliklidir; bu doküman hizalanır. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır.*
