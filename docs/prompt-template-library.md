# Prompt Şablon Kütüphanesi — Boyut (Dimension) Üretim Promptları

Sürüm: 1.0 · Tarih: 2026-06-29
Durum: Referans. `src/data/generated/nodes/*.json` içindeki gerçek `dimensions[<key>].prompt` desenini standartlaştırır.
İlgili: `src/schemas/task.ts` (14 boyut), `docs/adr-0027-engineering-standards.md` (standart referans deseni), `AGENTS.md` (altın kural).

Bu kütüphane, bir düğümün 14 üretim boyutundan her birini AI ile doldururken kullanılacak prompt şablonlarını tanımlar. Amaç: her boyut promptunun **somut, bağlama-özgü ve standart-bilinçli** olmasını sağlamak; jenerik çöp üretimini sözleşmeyle yasaklamak.

---

## 1. Ortak İskelet (Tüm Boyutlar İçin)

Mevcut düğümlerdeki `prompt` alanı tek bir gövde desenini izler. Her boyut promptu beş bloktan oluşur:

```
"<BOYUT_BAŞLIK_TR>" boyutunu bu görev için üret.
Bağlam: <id> — "<title>" (<level metaphor>; küme: <cluster>). Özet: <summary>. Etiketler: <tags>.
Çıktı: 3-5 madde, Türkçe, somut ve uygulanabilir. Generic ifade kullanma; her maddeyi bu görevin gerçek işleviyle ilişkilendir.
Güvenlik sınırı: AI maliyeti önemsizdir; güvenlik önceliklidir. AI app/module üretemez, app/module güncelleyemez, ruleset override edemez.
Kapsa: <BOYUTA_ÖZGÜ_KAPSAM>.
```

Blok açıklaması:

- **Başlık satırı** — Boyutun Türkçe başlığı (`DIMENSION_META[key].tr`) + sabit "boyutunu bu görev için üret." eki.
- **Bağlam** — Düğümün kimliği: `id`, `title`, seviye metaforu (modül/kaya, archetype/büyük taş, …), kümesi (`source.cluster`), `summary` ve `tags`. Bu blok promptu o düğüme bağlar; jenerikleşmeyi kırar.
- **Çıktı** — Her zaman sabit: 3-5 madde, Türkçe, somut. "Generic ifade kullanma" cümlesi zorunludur.
- **Güvenlik sınırı** — Her zaman sabit: AI'nin yetki sınırı (app/module üretemez/güncelleyemez, ruleset override edemez). Bu blok `AgentPolicy` kilidiyle hizalıdır.
- **Kapsa** — Boyuta özgü, ölçülebilir kapsam maddeleri. Bölüm 3'te her boyut için verilmiştir.

Şablonun yer-tutucuları (`<...>`) düğümün gerçek alanlarından doldurulur; elle uydurulmaz.

---

## 2. Standart-Bilinçli Prompt Deseni (Altın Kural Uyumu)

`AGENTS.md` Bölüm 2 ve ADR-0027: **standart yeniden yazılmaz, referans verilir.** Bu kural prompt'lara da yansır.

Bir boyut bir standart sözleşmesiyle ilişkiliyse, prompt o standardın **metnini içermez**; ona **işaret eder** ve üretilen maddenin standarda uymasını şart koşar. Ortak iskelete eklenecek isteğe bağlı blok:

```
Standart: Bu boyut <standardRefs.<key>> sözleşmesine tabidir. Üretilen maddeler o sözleşmeyle çelişemez; standardın metnini KOPYALAMA, ona uy. Bilinçli sapma varsa waivers[]'a gerekçeli + onaylı + süreli kayıt gerekir.
```

Boyut → ilgili standart referansı eşlemesi (prompt yazarken hangi `standardRef`'e bağlanacağın):

| Boyut (key) | Birincil standardRef | İkincil standardRef |
|---|---|---|
| featureDefs | dataApiContractRef | architectureRef |
| security | aiGovernanceRef | dataApiContractRef |
| codeOptimization | codingStandardRef | shortCodeRef |
| securityOptimization | codingStandardRef | observabilityRef |
| performance | observabilityRef | dataApiContractRef |
| mobileApps | uiComponentRef | uxStandardRef |
| wcag | uxStandardRef | designSystemRef |
| deployment | releasePolicyRef | observabilityRef |
| eca | aiGovernanceRef | architectureRef |
| aiAgents | aiGovernanceRef | architectureRef |
| testing | testingStandardRef | qualityGateRef |
| owasp | aiGovernanceRef | dataApiContractRef |
| integration | architectureRef | dataApiContractRef |
| moduleUsage | architectureRef | stateContractRef |

Not: Tüm boyutlar techProfileRef (tech-profile) ve shortCodeRef (kısa-kod) kilitlerine örtük tabidir; bunlar tekrar yazılmaz, kilit olarak varsayılır.

---

## 3. Boyut Bazlı Şablonlar (14 Boyut)

Aşağıda her boyut için iskeletin değişen iki parçası verilir: **Başlık** (sabit eki ile) ve **Kapsa** maddesi. Diğer bloklar (Bağlam/Çıktı/Güvenlik sınırı) Bölüm 1'deki ortak iskeletten alınır; ilgili `standardRef` Bölüm 2'deki eşlemeden bağlanır.

### 3.1 featureDefs — Özellik Tanımları
- Başlık: `"Özellik Tanımları" boyutunu bu görev için üret.`
- Kapsa: `net işlevsel kapsam, girdi/çıktı sözleşmesi, durum makinesi, hata yolları.`

### 3.2 security — Güvenlik Önlemleri
- Başlık: `"Güvenlik Önlemleri" boyutunu bu görev için üret.`
- Kapsa: `tenant izolasyonu (PostgreSQL RLS), PII sınıflandırma, rol bazlı erişim (least-privilege), değişmez audit kanıtı.`

### 3.3 codeOptimization — Kod Optimizasyonu
- Başlık: `"Kod Optimizasyonu" boyutunu bu görev için üret.`
- Kapsa: `tip güvenliği, ölü kod elemesi, modülerlik, kod bölme, döngüsel karmaşıklık sınırı.`

### 3.4 securityOptimization — Güvenlik Optimizasyonu
- Başlık: `"Güvenlik Optimizasyonu" boyutunu bu görev için üret.`
- Kapsa: `secret rotasyonu, sıkı CSP, rate-limit, en az ayrıcalık sertleştirme, bağımlılık taraması.`

### 3.5 performance — Performans Optimizasyonu
- Başlık: `"Performans Optimizasyonu" boyutunu bu görev için üret.`
- Kapsa: `bileşik indeks, önbellek, imleç sayfalama, N+1 önleme, ölçülebilir hedef (p95 gecikme).`

### 3.6 mobileApps — Mobil Uygulama Uyumu
- Başlık: `"Mobil Uygulama Uyumu" boyutunu bu görev için üret.`
- Kapsa: `iOS/Android (PWA veya Capacitor), Chrome extension yüzeyi, dokunma hedefi ≥44px, offline davranışı.`

### 3.7 wcag — WCAG 2.2 AAA
- Başlık: `"WCAG 2.2 AAA" boyutunu bu görev için üret.`
- Kapsa: `kontrast ≥7:1, tam klavye erişimi, ARIA rolleri/etiketleri, görünür odak sırası.`

### 3.8 deployment — Dağıtım
- Başlık: `"Dağıtım" boyutunu bu görev için üret.`
- Kapsa: `Docker Swarm servisi, Kubernetes (HPA + liveness/readiness probe + kaynak limiti), WordPress sınıfı shared hosting kısıtı/uyumu.`

### 3.9 eca — ECA Kuralları
- Başlık: `"ECA Kuralları" boyutunu bu görev için üret.`
- Kapsa: `backend/engine tarafında çalışan ruleset (UI yalnız güvenli yönetim yüzeyi, serbest JS/SQL/shell yok); döngü kırıcı maks 6, idempotency, tenant isolation, action allowlist, step-up; ruleset yetki katmanları (system kilitli / platform owner / tenant yalnız güvenli parametre).`

### 3.10 aiAgents — AI Ajan Davranışı
- Başlık: `"AI Ajan Davranışı" boyutunu bu görev için üret.`
- Kapsa: `AI yalnız ArcheType taslağı/prod-update önerisi üretebilir; app/module üretemez/güncelleyemez; ruleset override edemez; doğrudan prod write yapamaz. Admin akışı: prompt→draft→validation→diff→data-impact→dry-run→preview→approval→apply. sub_prompt güvenilmez; kill-switch; step-up; PII redaksiyon.`

### 3.11 testing — Testler & QA
- Başlık: `"Testler & QA" boyutunu bu görev için üret.`
- Kapsa: `unit + e2e + kullanıcı yolculuğu + AI-destekli Playwright + testing-loop (maks 6 tekrar, düzelmezse raporla) + autonomous QA ajanı.`

### 3.12 owasp — OWASP & Standartlar
- Başlık: `"OWASP & Standartlar" boyutunu bu görev için üret.`
- Kapsa: `OWASP Top 10:2025 ilgili maddeleri (+ AI yüzeyi varsa LLM Top 10: prompt injection, güvensiz çıktı), bu görevin tehdit yüzeyi.`

### 3.13 integration — Kernel/Core Entegrasyonu
- Başlık: `"Kernel/Core Entegrasyonu" boyutunu bu görev için üret.`
- Kapsa: `kernel/core/modüllerle entegrasyon: gerekli mi, hangi sözleşme/olay üzerinden, bağımlılık yönü.`

### 3.14 moduleUsage — Modül Kullanımı
- Başlık: `"Modül Kullanımı" boyutunu bu görev için üret.`
- Kapsa: `bu birimi hangi app'ler nasıl tüketir (doğrudan DB değil, olay/araç kapsamı/üretilen API üzerinden).`

---

## 4. Jenerik Üretimi Yasaklayan Kurallar

Bir prompt çıktısı aşağıdakilerden birini ihlal ediyorsa **geçersizdir** ve yeniden üretilir:

1. **Bağlamsızlık yasağı.** Madde, düğümün gerçek işleviyle ilişkilendirilmeden yazılmışsa reddedilir. "Güvenlik önlemleri alınmalıdır" gibi her düğüme uyan boş ifade geçersizdir; "bu düğümün `<X>` endpoint'inde tenant `<Y>` için RLS politikası" gibi somutluk şarttır.
2. **Standart kopyalama yasağı.** Madde, bir standart sözleşmesinin metnini tekrar ediyorsa reddedilir; bunun yerine ilgili `standardRefs.<key>`'e bağlanır (Bölüm 2). Standart metni tek yerde yaşar.
3. **Uygulanmayan boyutu doldurma yasağı.** Boyut bu düğüme uygulanmıyorsa madde uydurulmaz; `applicability[dimKey] = { applies: false, reason }` yazılır ve UI'da "N/A" gösterilir. Jenerik dolgu, `check-dimension-applicability` kapısının amacını boşa çıkarır.
4. **Yetki sınırı ihlali yasağı.** Çıktı, AI'nin app/module üretmesini/güncellemesini, ruleset override etmesini veya doğrudan prod write yapmasını önerirse reddedilir. Güvenlik sınırı bloğu her promptta sabittir.
5. **Madde sayısı sınırı.** Çıktı 3-5 maddedir; 2 madde "yetersiz", 6+ madde "kapsam taşması" (kısa-kod ruhuna aykırı). Az ve somut.
6. **Provenance dürüstlüğü.** AI üretimi `provenance: "swarm"`, insan onaylı `"human"`, kalıp `"template"` olarak işaretlenir; sahte "human" damgası vurulmaz.

Kural özeti: **somut yaz, standarda bağla, uygulanmıyorsa N/A de, sınırı aşma, kısa tut.**
