# 17 Üretim Boyutu — Çalıştırılabilir Sözleşme Matrisi (v1, 2026-07-02)

**Statü:** kanonik — generator, CI kapıları ve prompt'ların İNSAN-OKUR tek kaynağı.
**Makine kaynağı:** semantik kurallar `tools/lib/dimension-semantics.mjs` (kapı + vitest + backfill aynı modülü import eder). Bu doküman o modülün gerekçeli aynasıdır; ikisi arasında fark bulunursa modül kazanır ve doküman düzeltilir.
**Sabit karar:** boyut sayısı 17'dir. Yeni boyut eklenmez (18. boyut adayları ADR filtresine gider); boyut silinmez/yeniden adlandırılmaz.

Terimler: must = dolu kartta TÜMÜ geçmek zorunda olan kavram aileleri. anyOf = en az 1'i geçmek zorunda. N/A = boyutun bu düğüme uygulanmadığının gerekçeli kaydı (`applicability[key] = {applies:false, reason}`); gerekçe boş veya jenerik olamaz (CI kapısı zorlar). Evidence = `evidence[]`/`traceability` üzerinden kanıt bağı.

## 0. Seviye zorunluluk matrisi

| Seviye | Varsayılan | İstisna |
|---|---|---|
| app / module / archetype / feature / component | 17 boyutun tamamı GÖRÜNÜR ve doldurulması beklenir | UI yüzeyi olmayan düğümde `wcag`/`mobileApps` gerekçeli N/A |
| work_unit / micro_step | 15 boyut görünür; `dataLifecycle`+`observability` varsayılan N/A | RİSK SİNYALİ varsa N/A İPTAL (bkz. §18 risk listesi) |

Açık `applies=false` kaydı (insan kararı) her zaman kazanır — ama reason zorunlu, jenerik olamaz ve kapıdan geçer.

## 1. Kompakt matris

| # | key | TR | Cevapladığı soru | Zorunlu seviye | must | anyOf | standardRefs |
|---|---|---|---|---|---|---|---|
| 1 | featureDefs | Özellik Tanımları | Bu birim NE yapar, sınırı ne? | tümü | kapsam/sınır + girdi-çıktı∨durum∨hata-yolu | non-goal, sözleşme, kabul | dataApiContractRef |
| 2 | security | Güvenlik Önlemleri | Kim, neye, hangi yetkiyle erişir? | tümü | tenant∨erişim∨PII∨yetki | audit, deny-by-default, RLS, maskeleme, secret | tenancyRef, authzRef, privacyRef |
| 3 | codeOptimization | Kod Optimizasyonu | Kod sağlığı nasıl korunur? | tümü | tip∨modüler∨karmaşıklık∨ölü-kod | lint, bölme, refactor bütçesi | codingStandardRef, shortCodeRef |
| 4 | securityOptimization | Güvenlik Optimizasyonu | Saldırı yüzeyi nasıl daraltılır? | tümü | secret∨en-az-ayrıcalık∨sertleştirme | rotasyon, CSP, rate-limit, bağımlılık taraması | edgeSecurityRef |
| 5 | performance | Performans | Hangi ölçülebilir hedefe, nasıl? | tümü | ölçülebilir hedef (p95/sayı/%) | index, cache, pagination, N+1, yük testi | qualityGateRef |
| 6 | mobileApps | Mobil Uyum | Mobil/extension'da nasıl çalışır? | UI'lı düğümler | mobil∨PWA∨extension∨responsive | offline, dokunma hedefi, Capacitor | uiComponentRef |
| 7 | wcag | WCAG 2.2 AAA | Erişilebilirlik nasıl kanıtlanır? | UI'lı düğümler | klavye∨odak∨kontrast∨ARIA | ekran okuyucu, axe kanıtı, hedef boyutu | a11yRef, uxStandardRef |
| 8 | deployment | Dağıtım | Nerede, nasıl, geri dönüşü ne? | tümü | çalışma hedefi (Swarm/K8s/shared/Pages) | health, rollback, config/sır, imaj | iacRef, releasePolicyRef |
| 9 | eca | ECA Kuralları | Hangi olay hangi eylemi tetikler? | tümü | olay-koşul-eylem | zincir sınırı/döngü, idempotency, onay | — (yapısal ecaRules[]) |
| 10 | aiAgents | AI Ajan Davranışı | AI neye izinli, neye yasaklı? | tümü | izin∨yasak eylem sınırı | insan onayı/step-up, kill-switch, sub_prompt güvensiz | aiGovernanceRef |
| 11 | testing | Testler & QA | Neyle, hangi kanıtla test edilir? | tümü | unit∨e2e∨entegrasyon∨journey | negatif senaryo, testing-loop, autonomous QA, kanıt | testingStandardRef, qualityGateRef |
| 12 | owasp | OWASP & Standartlar | Hangi tehdit sınıfına hangi kontrol? | tümü | tehdit sınıfı (injection/access/SSRF/LLM…) | ASVS, SBOM, girdi doğrulama, denetim izi | edgeSecurityRef |
| 13 | integration | Kernel/Core Entegrasyonu | Neyle, hangi sözleşmeyle konuşur? | tümü | kernel∨core∨modül∨sözleşme | olay veriyolu, bağımlılık yönü, tipli arayüz | dataApiContractRef, stateContractRef |
| 14 | moduleUsage | Modül Kullanımı | Diğer app'ler bunu nasıl tüketir? | tümü | tüketim yolu (API∨olay∨capability) | doğrudan-DB yasağı, Contract kapısı | dataApiContractRef |
| 15 | dataLifecycle | Veri Yaşam Döngüsü & Uyum | Veri ne kadar yaşar, nasıl ölür? | app..component + riskli atom | retention + PII/KVKK/veri sınıfı | silme/DSAR, yedek/restore, migration modu | privacyRef, dataNormalizationRef |
| 16 | observability | Gözlemlenebilirlik & Operasyon | Bozulunca nereden anlarız? | app..component + riskli atom | SLO/SLI + metrik | alarm, runbook, log/trace, on-call | observabilityRef |
| 17 | reliability | Dayanıklılık & Süreklilik | Hata anında ne olur? | tümü | failure mode + idempotency | retry/backoff, DLQ, circuit, RTO/RPO, degrade | releasePolicyRef |

## 2. Boyut detayları

Her boyut için: kapsam dışı, evidence türleri, N/A gerekçe örneği, kötü/iyi örnek.

### 1. featureDefs
Kapsam dışı: teknik optimizasyon, güvenlik detayı (kendi boyutları var). Evidence: kabul kriteri ↔ test eşlemesi. N/A: yok — her düğümün tanımı olmalı. Kötü: "Gerekli özellikler tanımlanır." İyi: "Lead skorlama bileşeni p95 200ms altında skor katkı dökümü gösterir; girdi: etkinlik akışı, çıktı: 0-100 skor."

### 2. security
Kapsam dışı: OWASP tehdit kataloğu (owasp'ta), sertleştirme (securityOptimization'da). Evidence: izolasyon e2e testi, authz testi, auditLogRef. N/A: yok. Kötü: "Güvenlik önlemleri alınır." İyi: "İletişim kayıtları tenant-scoped RLS ile izole; PII alanları maskeli; komşu-tenant negatif testi zorunlu."

### 3. codeOptimization
Kapsam dışı: çalışma-zamanı performansı (performance'ta). Evidence: lint/karmaşıklık kapısı çıktısı. N/A: saf doküman/karar düğümünde gerekçeli. Kötü: "Kod optimize edilir." İyi: "Skorlama motoru engine/UI ayrımıyla bölünür; döngüsel karmaşıklık ≤10 lint kapısıyla zorlanır."

### 4. securityOptimization
Kapsam dışı: erişim modeli (security'de). Evidence: bağımlılık tarama raporu, secret tarama kapısı. N/A: saf doküman düğümünde gerekçeli. Kötü: "Sıkılaştırma yapılır." İyi: "Webhook imza anahtarı 90 günde rotasyon; egress allowlist; npm audit + SBOM CI'da."

### 5. performance
Kapsam dışı: ölçüsüz iyileştirme sözü. Evidence: yük testi çıktısı, p95 ölçümü. N/A: statik doküman düğümünde gerekçeli. Kötü: "Hızlı olmalı." İyi: "Liste ucu keyset pagination; p95 300ms hedefi; sipariş sorgusunda bileşik indeks (tenant_id, created_at)."

### 6. mobileApps
Kapsam dışı: masaüstü-yalnız iç araçlar (N/A ile). Evidence: cihaz/PWA test kanıtı. N/A örneği: "Kernel/backend primitifi; DOM/CSS yüzeyi yok." Kötü: "Mobil uyumlu olur." İyi: "Sipariş listesi PWA offline taslak destekler; dokunma hedefi ≥44px; Capacitor köprüsüyle iOS/Android."

### 7. wcag
Kapsam dışı: UI'sız backend düğümleri (N/A ile). Evidence: axe-core raporu (ihlal 0). N/A örneği: "Mimari karar kaydı; kendi UI yüzeyi yok." Kötü: "Erişilebilir olacak." İyi: "Form alanları label↔input bağlı; klavye gezinme sırası tanımlı; kontrast ≥7:1; axe AAA 0 ihlal kanıtı."

### 8. deployment
Kapsam dışı: uygulama içi mimari. Evidence: deploy doğrulaması, rollback tatbikatı. N/A: yok (doküman düğümünde bile yayın hedefi beyanı beklenir — en az "GitHub Pages"). Kötü: "Deploy edilir." İyi: "Docker Swarm + healthcheck; config env-injected; rollback: önceki imaj etiketi ≤5 dk."

### 9. eca
Kapsam dışı: serbest metin kural anlatısı (yapısal `ecaRules[]` esastır). Evidence: kural simülasyon çıktısı. N/A: kuralı olmayan saf içerik düğümünde gerekçeli. Kötü: "Otomasyon kuralları eklenir." İyi: "order.status=paid → stok rezervasyonu; maxChainDepth 6; dış etki step-up onaylı."

### 10. aiAgents
Kapsam dışı: genel AI vizyonu. Evidence: AgentPolicy kaydı, deny testi. N/A: yok (sınır beyanı her düğümde). Kötü: "AI destekler." İyi: "AI yalnız ArcheType taslağı önerir; app/module mutasyonu deny; kill-switch + sub_prompt güvensiz."

### 11. testing
Kapsam dışı: test felsefesi anlatısı. Evidence: testCommand, CI koşu çıktısı, kırmızı→yeşil kanıt. N/A: yok. Kötü: "Testler yazılır." İyi: "Skor hesaplayıcı unit + sipariş akışı Playwright journey; negatif: komşu-tenant 0 satır; testing-loop maks 6."

### 12. owasp
Kapsam dışı: genel güvenlik önlemi (security'de). Evidence: tarama raporu, pentest bulgusu. N/A: saf doküman düğümünde gerekçeli. Kötü: "OWASP'a uyulur." İyi: "A01: capability deny-by-default testi; A03 injection: parametreli sorgu + zod; LLM01 prompt injection: sub_prompt karantina."

### 13. integration
Kapsam dışı: dış SaaS entegrasyonları pazarlaması. Evidence: sözleşme (contract) testi. N/A: bağımsız doküman düğümünde gerekçeli. Kötü: "Sistemlerle entegre olur." İyi: "Party ArcheType'ını kernel'den tüketir; olaylar outbox üzerinden 'order.created' yayını; bağımlılık yönü: yalnız aşağı."

### 14. moduleUsage
Kapsam dışı: kendi iç mimarisi. Evidence: tüketici sözleşme testi. N/A: app-seviyesi ("ürün ailesi" beyanına döner). Kötü: "Diğer modüller kullanabilir." İyi: "CRM, Commerce'e müşteri segmentini capability-scoped API'yle açar; doğrudan tablo erişimi yasak."

### 15. dataLifecycle
Kapsam dışı: veri modeli tasarımı (db-schema fazında). Evidence: retention job kanıtı, restore tatbikat kaydı, DSAR e2e. N/A örneği: "Kalıcı veri üretmeyen saf hesaplama adımı" (risksiz atom). Kötü: "Veriler düzenli temizlenir." İyi: "İletişim kaydı (kişisel veri) retention 24 ay → anonimleştirme; DSAR 30 gün; günlük yedek + aylık restore tatbikatı; migration append-only."

### 16. observability
Kapsam dışı: ürün analitiği/KPI (metrics[] alanında). Evidence: dashboard linki, alarm konfigi, runbook dosyası. N/A örneği: "Tek seferlik migration adımı; kalıcı servis yüzeyi yok" (risksiz atom). Kötü: "Loglara bakılır." İyi: "SLO p95 400ms / %99.9; RED metrikleri + correlation-id'li yapısal log; alarm error-budget'a bağlı; runbook belirti→teşhis→müdahale."

### 17. reliability
Kapsam dışı: proje riski (risks[] alanında). Evidence: kaos/yük testi çıktısı, rollback kanıtı. N/A: yok — en küçük adımın bile hata modu vardır. Kötü: "Sistem sağlamdır." İyi: "Failure mode: webhook kaynağı düşer → retry 5 + backoff → DLQ; idempotency anahtarı {tenant}:{event}; RTO 30 dk / RPO 15 dk; degrade: skor servisi düşerse son skor gösterilir."

## 18. Risk sinyali listesi (atom N/A iptali)

Aşağıdaki izlerden biri id/title/summary/tags'te varsa `work_unit`/`micro_step` düğümünde `dataLifecycle`+`observability` varsayılan N/A İPTAL edilir (dolu içerik beklenir):

PII, KVKK, GDPR, kişisel veri, tenant, auth, kimlik/identity, payment/ödeme, finance/finans, order/sipariş, inventory/envanter/stok, webhook, queue/kuyruk, worker, cron, job, background, migration, göç, backfill, restore, backup/yedek, DLQ/dead-letter, retry, idempotency, outbox, saga, stream, AI, prompt, LLM, public API, external/dış entegrasyon.

Makine kaynağı: `RISK_SIGNAL` — `src/engine/audit.ts` + `tools/lib/score.mjs` (birebir ayna).

## 19. Generator sözleşmesi

Generator'lar (`gen-items`, `fill-dimensions`, `gen-prompts`, `backfill-day2-dimensions`) şu kurallara uyar: mevcut dolu kartı EZMEZ (yalnız eksik ekleme modu: `--only-day2` / backfill); `--dry-run/--apply/--only-risk/--levels/--refresh` parametreleri; ürettiği her kart must+anyOf semantiğinden yazım ÖNCESİ geçer; provenance `swarm` + promptVersion damgası taşır; kanonik seviye adları kullanır (stone/molecule/element/atom yalnız tarihsel metafor olarak docs'ta geçebilir, kodda geçemez).
