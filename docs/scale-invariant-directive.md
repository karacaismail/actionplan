# Scale-Invariant Yönergesi — Para/Sipariş/Stok Yazan Akışın Değişmez Koruma Zarfı

**Statü:** kanonik yönerge (ADR-K3 / `plan-03` §5 — C5 çözümü). **Kod karşılığı:** `core-contract-pack.md` §3.7 (`platform_scale_invariant`), §2.3 (`platform_outbox`), §2.5 (`platform_audit_log`) + CI kapısı `check-scale-invariant`.
**Neden var:** İki kez basılan "Öde" butonu, tekrar çalışan bir worker, olay yayımlamadan yazılan bir sipariş — bunlar tek app'te unutulabilir hatadır, 50 app'te kaçınılmaz felakettir. Bu yönerge korumayı *tercih* olmaktan çıkarır, *invariant* (değişmez doğruluk şartı) yapar. Stack: FastAPI + SQLAlchemy 2.0 + PostgreSQL; deploy Hetzner/Debian/AMD EPYC/Docker.

---

## 1. Amaç

Para, sipariş veya stok yazan **her** akışın — unutulamaz, kapatılamaz-sessizce, CI-zorlamalı biçimde — transactional outbox + idempotency + tamper-evident (kurcalama-belli) audit taşımasını garanti altına almak. Ana kural: bu koruma bir *bayrak* (opt-in flag) değil, akışın var olabilmesinin *ön şartı*dır. Koruma alınmaz — vardır; yalnızca gerekçeli, onaylı, süreli bir Waiver ile kapatılabilir (bkz. `docs/waiver-policy.md`).

## 2. Kapsam — hangi akışlar

Yönerge yalnızca **etiketli mutasyon** akışlarını bağlar. Aşağıdaki tablo, bir akışın kapsama girip girmediğini belirleyen etiketi verir; etiket ArcheType handler'ının `write_scope` alanında beyan edilir.

| Etiket | Kapsar | Örnek akış |
|---|---|---|
| `financial` | Para tahsil/iade/aktarım/mutabakat yazan mutasyon | Ödeme çekme, iade, cari hesap fişi |
| `order` | Sipariş/rezervasyon durumu yazan mutasyon | Sipariş oluştur, iptal, statü ilerlet |
| `inventory` | Stok/lot/rezervasyon miktarı yazan mutasyon | Stok düş, rezerve et, transfer |

Bir akış bu üç etiketten en az birini taşıyorsa yönerge zorunludur. Etiket, `financial|order|inventory` enum'ından seçilir; birden çok etiket taşıyabilir (ödeme + stok düşümü aynı işlemde).

## 3. Non-goals — neyi yapmaz

Yönerge her akışa dayatılmaz; aşağıdakiler kasıtlı kapsam dışıdır.

| Yapmaz | Neden |
|---|---|
| Salt-okuma (read/query) akışını yavaşlatmaz | Okuma para/veri yazmaz; outbox/idempotency gereksiz maliyet olur |
| Etiketsiz iç yardımcı akışı bağlamaz | Yalnız `financial\|order\|inventory` etiketli mutasyon zorunlu |
| İş mantığını (fiyat/vergi hesabı) tanımlamaz | O `platform_computation` (§3.5) işidir; bu yönerge yalnız *yazma zarfı* |
| Waiver'ı serbest bırakmaz | Kapatma gerekçeli + insan-onaylı + süreli; sessiz kapatma yasak |

## 4. Tanım — nedir / ne yapar / ne yapmaz

**Nedir:** Para/sipariş/stok yazan akışın etrafına sarılan, üç korumayı (outbox, idempotency, tamper-evident audit) atomik ve zorunlu kılan bir yazma zarfıdır.
**Ne yapar:** Yazma ile olay-yayımını tek transaction'da atomikleştirir (outbox); aynı isteğin tekrarını tek etkiye indirger (idempotency-key); her durum değişikliğini kurcalama-belli bir zincire yazar (audit hash-chain). Tutarlılık sınıfının (`strong|eventual`) açık beyanını dayatır.
**Ne yapmaz:** Serbest kod yolu bırakmaz — korumayı çağrı anında atlayan bir handler yazılamaz. Okuma yolunu sarmaz. Waiver'ı otomatik onaylamaz.

## 5. Invariant kuralları — alan | tip | amaç

Aşağıdaki üç yapı, `core-contract-pack.md` §3.7/§2.3/§2.5 ile birebir hizalıdır; bu yönerge onları *zorunluluk kuralı* olarak sabitler. Tablolar alan+tip+amaç verir; dolu örnek veri (mock) vermez.

**5.1 Yazma politikası (`WritePolicy` — `platform_scale_invariant/guard.py`).** Etiketli her handler bunu taşımak zorundadır; eksik alan CI'da bloklanır.

| Alan | Tip | Amaç |
|---|---|---|
| `write_scope` | enum(`financial\|order\|inventory`)[] | Akışın kapsam etiketi; kapsama alınmayı belirler |
| `idempotency_required` | bool (default `true`) | Aynı isteğin tekrarını tek etkiye indirger |
| `outbox_required` | bool (default `true`) | Yazma ile olay-yayımını atomikleştirir |
| `rate_limit_scope` | str (default `tenant`) | Komşu-tenant boğulmasını engeller |
| `consistency` | enum(`strong\|eventual`) | Tutarlılık sınıfı beyanı — **zorunlu, boş olamaz** |
| `waiver_ref` | UUID \| null | Kapatma yalnız geçerli Waiver kaydına referansla |

**5.2 Idempotency anahtarı (`platform_idempotency`).** Tekrar isteğini tek etkiye indirger.

| Alan | Tip | Amaç |
|---|---|---|
| `idempotency_key` | str (istemci üretir) | İsteğin tekilleştirme kimliği |
| `tenant_id` | UUID | Tekilleştirme tenant kapsamında (§2.1) |
| `request_hash` | str | Aynı anahtar+farklı gövde çakışmasını yakalar |
| `first_seen_at` | timestamptz | İlk görülme; TTL/temizlik için |
| `result_ref` | UUID \| null | İlk sonucun referansı; tekrar aynı sonucu döndürür |

**5.3 Tamper-evident audit zinciri (`platform_audit_log` üzerine hash-chain).** §2.5 append-only tablosu (REVOKE UPDATE/DELETE) üzerine kurcalama-belli zincir ekler.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID | Kaydın kimliği |
| `tenant_id` | UUID | Tenant kapsamı |
| `actor_id` / `actor_type` | UUID / enum(`user\|system\|agent`) | Kim yazdı — insan/motor/ajan ayrımı |
| `action` / `resource` / `resource_id` | str / str / UUID | Ne, neye yapıldı |
| `prev_hash` | str (hex) | Önceki kaydın `entry_hash`'i — zincir bağı |
| `entry_hash` | str (hex) | `hash(payload + prev_hash)` — bu kaydın mührü |
| `created_at` | timestamptz | Sıralama; zincir monotonik |

## 6. CI kapısı — `check-scale-invariant.mjs`

Ana kural makine-zorlamalıdır: etiketli bir mutasyon outbox/idempotency olmadan merge edilemez. Kapı bloklayıcıdır ve `.github/workflows/deploy.yml` `build` job'ında `node tools/agents/check-scale-invariant.mjs` olarak çalışır (bkz. `docs/ci-conformance-gates.md` deseni).

| Ne zorlar | Yeşil koşul |
|---|---|
| `write_scope` etiketli her handler `WritePolicy` (`scaled_write` dekoratörü) taşır | Etiketli handler outbox+idempotency zarfı olmadan tanımlanmamış |
| `consistency` beyanı dolu (`strong\|eventual`) | Etiketli hiçbir yazma sınıf-beyansız değil ("sessiz eventual" yok) |
| Kapatma yalnız geçerli Waiver ile | `waiver_ref` boş değilse `check-waivers` (gerekçe+onay+süre) geçiyor |
| Audit çağrısı mutasyonda mevcut | Her etiketli handler `AuditLogger.log` çağırıyor (§2.5); ham audit yazımı yok |

Reddetme mesajı örneği: `financial etiketli handler 'charge_payment' scaled_write olmadan tanımlanamaz`. Kapı sıfırdan farklı çıkış koduyla build'i durdurur; GitHub Pages/deploy yapılmaz.

## 7. Backend deseni

Aktör-açık desen: *geliştirici* etiketi ve `scaled_write` zarfını yazar; *motor* korumayı deterministik uygular; *CI* eksik zarfı bloklar; *insan* Waiver'ı onaylar.

- **Transactional outbox:** Domain kaydı ile `platform_outbox` satırı **aynı** `session.commit()` içinde yazılır (§2.3). Arka plan worker outbox'ı okuyup Redis Streams/kuyruğa iletir. Böylece "sipariş yazıldı ama stok olayı yayımlanmadı" dual-write hatası imkânsızlaşır.
- **Idempotency-key:** İstemci `Idempotency-Key` header'ı gönderir; motor `(idempotency_key, tenant_id)` ile tekilleştirir. İlk istek işlenir ve `result_ref` saklanır; tekrar isteği yeniden işlemez, saklı sonucu döndürür. Sequence commit'i de bu mekanizmayı kullanır (§3.8): aynı iş iki kez commit edilse bile tek numara bağlanır.
- **Audit hash-zinciri — async-yaz / senkron-doğrula:** Kayıt yazımı **asenkron** (yazma yolunu yavaşlatmaz): `entry_hash = hash(payload + prev_hash)` hesaplanıp append-only tabloya eklenir. Doğrulama **senkron** ve periyodiktir: bir denetleyici zinciri baştan yürüyüp her `entry_hash`'i yeniden hesaplar; bir kaydın alanı değişmiş/silinmişse zincir kopar ve alarm üretir. Yazma hızlı, kurcalama gizlenemez.

## 8. Test stratejisi

Aşağıdaki üç test, üç korumanın gerçekten çalıştığını kanıtlar; ArcheType DoD'sinin parçasıdır.

1. **Çift-tahsilat engeli (outbox + idempotency):** Aynı `financial` isteği ardışık iki kez gönderilir → tek tahsilat, tek outbox olayı üretilir; ikinci istek saklı sonucu döndürür. İkinci bir kez daha (worker retry simülasyonu) → yine tek etki.
2. **Idempotency tekrar → tek-etki:** N eşzamanlı özdeş istek (yarış koşulu) → yalnız biri yan-etki yaratır; diğerleri aynı `result_ref`'e düşer; stok bir kez düşer.
3. **Audit bozulma yakalama:** Yazılmış bir audit kaydının alanı doğrudan DB'de değiştirilir (test-only) → senkron doğrulayıcı zincir kopmasını (`entry_hash` uyuşmazlığı) yakalar ve raporlar. Ek: silinen bir kayıt `prev_hash` boşluğuyla tespit edilir.

## 9. Acceptance criteria

- Üç kapsam etiketinin (`financial|order|inventory`) her biri için en az bir referans handler `scaled_write` ile tanımlı ve `check-scale-invariant` yeşil.
- Bölüm 8'deki üç test yeşil (çift-tahsilat, idempotency yarışı, audit bozulma).
- `consistency` beyanı etiketli tüm handler'larda dolu; "sessiz eventual" örneği yok.
- Kapatılan tek bir koruma bile varsa, ona bağlı geçerli bir Waiver (`check-waivers` geçen: gerekçe+onay+süre) mevcut.
- Audit zinciri baştan sona doğrulanabiliyor; kasıtlı bozma testte yakalanıyor.

## 10. Anti-patterns

| Anti-pattern | Neden yanlış | Doğrusu |
|---|---|---|
| Opt-in bayrağı açmayı unutmak (`enable_idempotency=false` varsayılan) | Bir app unutur → prod'da çift-tahsilat; tam da bu yönergenin engellediği felaket | Koruma default-on invariant; kapatmak Waiver ister |
| Sessiz eventual (tutarlılık sınıfı beyan edilmez) | "Ekranda para tuttu ama defterde yok" | `consistency` beyanı zorunlu; boşsa CI reddeder |
| Outbox'ı ayrı transaction'da yazmak | Yazma commit olur, olay yayımı düşerse dual-write | Domain kaydı + outbox aynı `session.commit()` |
| Ham `INSERT audit` yazmak | Hash-zinciri atlanır; kurcalama gizlenebilir | Yalnız `AuditLogger.log` üzerinden; §2.5 |
| Waiver'ı ajanın onaylaması | Denetim otoritesi kaybolur | `approved_by` insandır; AI yalnız *önerir* |

## 11. Definition of Done

- `check-scale-invariant.mjs` yazıldı, `deploy.yml`'a bloklayıcı adım olarak eklendi, `docs/ci-conformance-gates.md` matrisine işlendi.
- `WritePolicy`, `platform_idempotency`, `platform_audit_log` hash-chain alanları §5 tablolarıyla uyumlu; Alembic migration expand-contract ve downgrade çalışıyor.
- Bölüm 8 üç testi yeşil; Bölüm 9 acceptance criteria karşılandı.
- AI-guardrail testli: `scaled_write`'sız etiketli handler CI'da reddediliyor; ajan Waiver onaylayamıyor (`approved_by` insan).
- `core-contract-pack.md` §3.7 ve §7 invariant listesi (15-17) bu yönergeyle çelişmiyor; `plan-03` §5 C5 çözümü kapandı.

## 12. Requirement-ID tablosu

Her kural bir izlenebilir kimliğe bağlanır; kapı/test bu kimliği referans alır.

| ID | Gereksinim | Zorlayan |
|---|---|---|
| SCV-1 | Para/sipariş/stok yazan akış `financial\|order\|inventory` etiketi taşır | `check-scale-invariant` |
| SCV-2 | Etiketli her yazma transactional outbox taşır (yazma+olay atomik) | `check-scale-invariant` + Test-1 |
| SCV-3 | Etiketli her yazma idempotency-key ile tekilleştirilir | `check-scale-invariant` + Test-2 |
| SCV-4 | Her durum değişikliği tamper-evident audit zincirine yazılır | `check-scale-invariant` + Test-3 |
| SCV-5 | Tutarlılık sınıfı (`strong\|eventual`) açıkça beyan edilir | `check-scale-invariant` |
| SCV-6 | Koruma kapatma yalnız gerekçeli+onaylı+süreli Waiver ile | `check-waivers` |
| SCV-7 | Rate-limit varsayılan tenant kapsamlıdır (noisy-neighbor koruması) | `check-scale-invariant` |
| SCV-8 | AI hiçbir default-on korumayı bypass eden kod yolu üretemez; Waiver'ı onaylayamaz | CI + AI-guardrail testi |

---

*Bağlı: `docs/core-contract-pack.md` §3.7 (`platform_scale_invariant`) / §2.3 (outbox) / §2.5 (audit) — kod karşılığı; `docs/waiver-policy.md` — kapatma mekanizması; `docs/ci-conformance-gates.md` — kapı kataloğu deseni; `plan-03-yeni-yonergeler-2026-07-01.md` §5 — C5 kararı; `elestiri-02-kernel-2026-07-01.md` §3.3 — kök-sebep (opt-in bayrak riski).*
