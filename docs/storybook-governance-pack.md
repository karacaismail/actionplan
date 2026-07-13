# Storybook Governance Pack — İkinci Seviye Yönetişim Sözleşmeleri (v0.1)

Bu doküman, unknown-unknowns raporu §7'de listelenen 12 ikinci-seviye yönetişim sözleşmesini tek pakette normatif hale getirir. Mevcut Storybook (bileşenleri izole ortamda geliştirme, belgeleme ve test aracı) ve Master Component (merkezi yönetilen ortak UI bileşeni) yönergelerinin üzerine yönetişim katmanı ekler; onların kural metnini tekrarlamaz.

Tarih: 2026-07-12
Durum: Kabul edilmiş karar (insan onaylı)
Kaynak: `docs/storybook-unknown-unknowns-gap-report.md`
Bağlı: `docs/storybook-implementation.md`, `docs/storybook-master-component-integration-directive.md`, `ui-components.json` v1.2, `tools/agents/check-ui-delivery.mjs`

Okuma kuralı: Her sözleşme dört blok taşır — Amaç; Normatif kurallar; Kapattığı riskler (rapordaki U-kimlikleri); Makine karşılığı (`ui-components.json` şema alanı, ilgili kapı, CI sinyali). AGENTS.md altın kuralı gereği başka dosyadaki kural metni buraya kopyalanmaz, referans verilir. Bu belgede "içerik kapısı" `tools/agents/check-ui-delivery.mjs`'i, "implementation CI" implementation reposundaki storybook-ci hattını ifade eder.

---

## 1. Story Coverage Budget

**Amaç.** Story (bir bileşen durumunun izole render kaydı) kapsamını exhaustive Cartesian çarpım (tüm eksen kombinasyonlarının eksiksiz üretimi) yerine risk-temelli bütçeyle yönetmek; katalog ve CI (sürekli entegrasyon) maliyetini sürdürülebilir tutmak.

**Normatif kurallar.**

1. `storybook-master-component-integration-directive.md`'de tanımlı 7 çekirdek davranış state'i her bileşende exhaustive KALIR; bu bir invariant'tır (ihlal edilemez değişmez). AI üreticinin bu state'leri eksiltmesi YASAKTIR; içerik kapısı eksik state'i reddeder.
2. Sunum eksenleri — theme (tema), locale (dil-bölge ayarı), viewport (ekran görünüm alanı), density (arayüz yoğunluğu) — exhaustive üretilmez; AI üretici risk sınıfına göre pairwise (eksen çiftlerini en az bir kez kapsayan örnekleme) veya representative (temsilî örnek) seçim yapar ve seçimi story matrisinde beyan eder. ZORUNLUDUR.
3. `uiDelivery.coverageBudget.maxStories` (varsayılan 40) hesaplanan kombinasyonu sınırlar: içerik kapısı states × viewports × locales × themes çarpımını hesaplar ve bütçeyi aşan beyanı reddeder.
4. Bütçe yükseltme insan kararıdır ve `justification` (gerekçe) alanı ister; AI'nin veya otomasyonun gerekçesiz bütçe artırması YASAKTIR.
5. Tenant (kiracı) theme'leri ve Fragment (Address, ContactPoint gibi çok-alanlı değer tipi) alt-alan kombinasyonları aynı bütçeye tabidir. Her tenant için ayrı visual baseline (onaylı referans görüntü) tutmak YASAKTIR; canonical theme sınıfları ve seçilmiş görsel probe'lar kullanılır.
6. Story adedini tek başına kapsam metriği olarak raporlamak YASAKTIR; içerik kapısı state/interaction/negatif-senaryo kapsamını ayrıca değerlendirir.

Risk sınıfı × kapsam tablosu (rapor §8'den; kanonik):

| Risk | Story/test kapsamı |
|---|---|
| Critical | exhaustive invariant states + pairwise presentation + manuel a11y + cross-browser + E2E |
| High | tüm davranış state'leri + pairwise theme/locale/viewport + visual/a11y/E2E |
| Medium | zorunlu states + representative theme/locale/viewport + interaction/a11y |
| Low | render + temel state + consumer integration testi |

**Çelişki notu.** `uic-story-matrix-required` kuralındaki "tüm variant×size kombinasyonları" ifadesinin exhaustive-Cartesian OKUNMASI bu sözleşmeyle iptal edilmiştir. Kanonik okuma budur: davranış state'leri exhaustive, sunum eksenleri bütçeli örneklemedir.

**Kapattığı riskler:** U0, U16, U18, U19, U23; Fragment cross-field patlaması.

**Makine karşılığı:** `uiDelivery.coverageBudget.{maxStories, samplingStrategy, justification}`; kapı: içerik kapısı kombinasyon hesabı; sinyal: `BUDGET_EXCEEDED`.

## 2. Fixture Fidelity Contract

**Amaç.** Fixture'ların (story için hazırlanan örnek veri) gerçek şema ve gizlilik sözleşmesine bağlı kalmasını sağlamak; temiz-küçük mock verinin sahte güven üretmesini engellemek.

**Normatif kurallar.**

1. AI üreticinin fixture'ı elle yazması YASAKTIR; fixture'lar versioned contract factory'den (şema tanımından fixture üreten sürümlenmiş kod) üretilir. ZORUNLUDUR.
2. Happy-path yanında malformed (bozuk), partial (eksik), stale (bayat), permission-filtered (yetkiyle kırpılmış), high-volume (yüksek hacimli) ve migration-old (eski şema sürümlü) fixture aileleri bulunur; critical/high bileşenlerde tamamı ZORUNLUDUR, medium/low'da en az malformed + partial.
3. `uiDelivery.fixtureContract.fingerprintRef` (fixture'ın üretildiği şemanın parmak izi referansı) critical/high bileşenlerde ZORUNLUDUR; içerik kapısı beyansız teslimi reddeder.
4. `containsRealData=true` YASAKTIR: gerçek müşteri/tenant verisi, görseli veya marka varlığı fixture'a kopyalanamaz; içerik kapısı bu değeri gören teslimi bloklar.
5. Atomik değer tipleri (Money, Range, Identifier) için sözleşme fingerprint'i değiştikten sonra eski serializer'lı fixture kullanmak YASAKTIR; widget paritesi ancak güncel fingerprint ile iddia edilebilir.

**Kapattığı riskler:** U1; atomik-değer widget paritesi.

**Makine karşılığı:** `uiDelivery.fixtureContract.{factoryRef, fingerprintRef, families, containsRealData}`; kapı: içerik kapısı beyan bütünlüğü; sinyal: `FIXTURE_DRIFT` (fingerprint-beyanı-yok hali içerik kapısında, çalışma-zamanı drift'i implementation CI'da).

## 3. Visual Baseline Governance

**Amaç.** Visual baseline güncellemesini tek kişinin gerekçesiz kabulüne kapatmak; regresyonun "kasıtlı değişiklik" diye meşrulaşmasını önlemek.

**Normatif kurallar.**

1. `approvedBy` ≠ `reviewer` ZORUNLUDUR: baseline onayında component owner ile design reviewer farklı insanlardır; aynı kişinin iki rolü doldurması YASAKTIR.
2. Her baseline güncellemesi `reason` + `taskRef` taşır; ikisi olmadan güncelleme YASAKTIR.
3. İnsan reviewer her diff'i `diffTaxonomy` ile sınıflandırır: bugfix / intentional-design / token-wide / environment-noise / content-only. Sınıfsız kabul YASAKTIR.
4. Toplu kabul ("accept all") yüksek-riskli ayrı bir aksiyondur; insan onaylayıcı ayrı gerekçe ve etki kapsamı beyanıyla yapar. AI'nin toplu kabul yapması YASAKTIR.
5. Güncel şema/token sürümüne rağmen yenilenmemiş baseline'ı implementation CI tespit eder ve `BASELINE_STALE` üretir; critical/high'ta merge bloklanır.

**Kapattığı riskler:** U2, U25.

**Makine karşılığı:** `uiDelivery.visualBaseline.{approvedBy, reviewer, reason, taskRef, diffTaxonomy}`; kapı: içerik kapısı alan bütünlüğü; sinyal: `BASELINE_STALE` (implementation CI).

## 4. Storybook Security & Publishing

**Amaç.** Yayınlanan Storybook'un PII (kişisel tanımlayıcı bilgi), secret (gizli anahtar/token) veya yayınlanmamış ürün bilgisi sızdırmasını engellemek.

**Normatif kurallar.**

1. Her publish (katalog yayını) bir erişim sınıfı taşır: public / organization-private / VPN-only. Sınıfsız publish YASAKTIR; varsayılan organization-private.
2. Erişim kontrolünü implementation CI publish sınıfına göre uygular; public sınıfı yalnız güvenlik ekibinin insan onayı açar.
3. Publish öncesi fixture sanitization (hassas veri temizleme) ve secret/PII scan implementation CI'da ZORUNLUDUR; scan geçmeden publish YASAKTIR.
4. Retention (saklama süresi) ve silme politikası publish sınıfına bağlıdır (bkz. sözleşme 11).
5. MDX (Markdown+JSX dokümantasyon biçimi) içeriği trusted-author (güvenilir yazar) sınırına tabidir; dış embed/iframe ve güvensiz HTML YASAKTIR; preview CSP (Content Security Policy — tarayıcı içerik güvenlik başlığı) ile servis edilir.

**Kapattığı riskler:** U4, U29.

**Makine karşılığı:** `uiDelivery.publish.{class, securityReviewRef}`; kapı: içerik kapısı sınıf beyanı, implementation CI scan; sinyal: `SECURITY_REVIEW_REQUIRED`.

## 5. Master Component Federation

**Amaç.** Master Component sürecinin merkezi darboğaza ve API şişmesine dönüşmesini engellemek; hiçbir bileşeni sahipsiz bırakmamak.

**Normatif kurallar.**

1. Local-first ZORUNLUDUR: her yeni bileşen local (tek ürün kapsamında) doğar; doğrudan Master olarak açmak YASAKTIR.
2. Promotion (Master'a terfi) eşiği: ikinci gerçek tüketici + insan API review olmadan terfi YASAKTIR. Erken terfi Kum riskidir (API donması); geç terfi kopya çoğaltır — kararı design-system ekibi verir.
3. Design-system ekibi contribution SLA (katkıya yanıt süresi taahhüdü) tanımlar ve tutar; SLA aşımı escalation (üst kademeye taşıma) üretir.
4. Her Master Component owner federation'a tabidir: CODEOWNERS (dosya sahipliği tanım dosyası) kaydı + yedek owner ZORUNLUDUR. Owner'sız bileşende içerik kapısı `OWNER_MISSING` üretir; baseline onayı YASAKTIR.
5. Escape-hatch (Master'ı geçici bypass eden local çözüm) kullanımı insan review'u ister; kayıtsız bypass YASAKTIR.
6. İçerik kapısı prop-count/variant budget uygular; bütçe aşımı otomatik geçmez, insan API review'una düşer.

**Kapattığı riskler:** U5, U20, U24; Kum yanlış-sınıflandırma.

**Makine karşılığı:** `uiDelivery.ownership.{owner, backupOwner, codeownersRef}`, `uiDelivery.apiBudget.{maxProps, maxVariants}`; kapı: içerik kapısı; sinyal: `OWNER_MISSING`.

## 6. Consumer Version Parity

**Amaç.** Review edilen UI ile yayınlanan UI'nin aynı bileşen sürümü olduğunu kanıtlamak; monorepo/paket sürüm kaymasını görünür kılmak.

**Normatif kurallar.**

1. Storybook preview'da dört bilgi birlikte görünür: package version, commit SHA, consumer lockfile (tüketicinin bağımlılık kilit dosyası) çözümü ve component contract fingerprint. Eksik gösterim YASAKTIR.
2. Implementation CI, composed Storybook (birleştirilmiş katalog) sürümü ile consumer lockfile sürümü ayrıştığında `VERSION_MISMATCH` üretir; release kapısında bloklar.
3. Package composition (yayınlanmış katalogları birleştirme özelliği) kullanan her katalogda sürüm-çözümleme testi ZORUNLUDUR.
4. Her Ada (ürün ailesi örneği) tükettiği Master Component katalog sürümünü kilitler; kilitsiz tüketim YASAKTIR.

**Kapattığı riskler:** U7; Ada katalog sürümü uyumsuzluğu.

**Makine karşılığı:** `uiDelivery.versionParity.{packageVersion, commitSha, lockfileRef, contractFingerprint}`; kapı: implementation CI parity testi; sinyal: `VERSION_MISMATCH`.

## 7. Deterministic Rendering

**Amaç.** Görsel testleri ortam gürültüsünden (font, saat, animasyon, rastgelelik) arındırmak; flaky (kararsız sonuç veren) testin maskelenmesini engellemek.

**Normatif kurallar.**

1. Implementation CI sabit browser image (sürümü sabitlenmiş tarayıcı konteyner imajı) kullanır; serbest tarayıcı sürümü YASAKTIR.
2. Implementation CI font preload, timezone/locale/clock freeze (saat ve yerel ayar dondurma), animation disable ve deterministic seed/ID uygular. ZORUNLUDUR.
3. Flaky testi retry (otomatik yeniden deneme) ile geçirmek YASAKTIR; implementation ekibi root-cause (kök neden) analizi yapar.
4. Flaky story karantinaya alınır; implementation CI `FLAKY_QUARANTINED` üretir. Karantina süresi sınırlıdır (varsayılan 14 gün); süre sonunda insan karar verir: düzelt veya story'yi kaldır. Süresiz karantina YASAKTIR.

**Kapattığı riskler:** U10.

**Makine karşılığı:** implementation CI determinizm konfigürasyonu (şema alanı yok, toolchain sorumluluğu); sinyal: `FLAKY_QUARANTINED`.

## 8. Manual Accessibility Review

**Amaç.** Otomatik a11y (erişilebilirlik) taramasının kapsamadığı klavye akışı, screen reader (ekran okuyucu) anlamı ve zoom davranışını insan review'uyla kapatmak.

**Normatif kurallar.**

1. Critical/high bileşenler ve her Surface (sayfa-düzeyi kompozisyon) için manuel klavye + screen-reader + zoom-reflow (büyütmede yeniden akış) matrisi ZORUNLUDUR; review'u a11y-yetkin insan reviewer yürütür.
2. `uiDelivery.manualA11yReviewRef` bu review'un kanıt referansıdır; critical/high'ta beyansız teslimde içerik kapısı `MANUAL_A11Y_REQUIRED` üretir.
3. Otomatik axe (axe-core tabanlı otomatik erişilebilirlik tarayıcısı) yalnız ilk bariyerdir; axe-pass'i tam a11y kanıtı saymak YASAKTIR.
4. Sayfa-düzeyi a11y (landmark, skip-link, focus restoration) story ile kapanmaz; app-shell (gerçek uygulama kabuğu) E2E'si (uçtan uca test) olmadan critical Surface'in done sayılması YASAKTIR.

**Kapattığı riskler:** U11, U30.

**Makine karşılığı:** `uiDelivery.manualA11yReviewRef`; kapı: içerik kapısı; sinyal: `MANUAL_A11Y_REQUIRED`.

## 9. Performance Story Profile

**Amaç.** Veri-yoğun bileşenlerin küçük fixture'la sahte güven vermesini engellemek; performans kanıtını görsel kanıttan ayırmak.

**Normatif kurallar.**

1. AI üretici veri-yoğun bileşeni `dataDense=true` olarak beyan eder; DataGrid/chart/tree/kanban sınıfı bileşende beyansız teslimi içerik kapısı reddeder.
2. dataDense bileşenlerde hacim profilleri (küçük/orta/production ölçeği) + virtualization (yalnız görünür satırları render etme) story'si + container-width fixture'ları (dar parent kapsayıcı senaryoları) + interaction latency (etkileşim gecikmesi) ölçümü ZORUNLUDUR.
3. `uiDelivery.performanceProfileRef` critical/high dataDense bileşenlerde ZORUNLUDUR.
4. Performans kanıtı Storybook görsel testinden ayrı, implementation CI'ın gerçek tarayıcıda yaptığı ölçümdür; visual-pass'i performans kanıtı saymak YASAKTIR. Mock provider ile geçen hook story'sini gerçek provider bileşimi kanıtı saymak da YASAKTIR (Molekül hook gerçeği).

**Kapattığı riskler:** U12, U13; Molekül hook gerçeği.

**Makine karşılığı:** `uiDelivery.{dataDense, performanceProfileRef}`; kapı: içerik kapısı beyan kontrolü; ölçüm: implementation CI.

## 10. Addon Allowlist & Supply Chain

**Amaç.** Storybook addon'larının (eklenti) build ve tarayıcı bağlamında kod çalıştırma gücünü kontrol altında tutmak; tedarik zinciri (supply chain) sızıntısını engellemek.

**Normatif kurallar.**

1. Addon allowlist (izinli eklenti listesi) ZORUNLUDUR; liste dışı addon kurulumu YASAKTIR. Listenin sahibi toolchain owner'dır; ekleme ADR (Architecture Decision Record — mimari karar kaydı) ister.
2. Implementation CI addon sürümlerini lockfile ile sabitler ve SBOM (Software Bill of Materials — bileşen envanteri) + provenance (köken/imza kanıtı) üretir. ZORUNLUDUR.
3. Implementation CI addon'lara egress (dışa ağ çıkışı) politikası uygular; tanımsız dış çağrı YASAKTIR.
4. Deneysel Storybook/test API'sini kanonik sözleşmeye gömmek YASAKTIR; bu paket ürün gereksinimini tanımlar, kesin addon/paket/sürüm seçimi toolchain ADR + lockfile'da yaşar.

**Kapattığı riskler:** U9, U28.

**Makine karşılığı:** toolchain ADR + lockfile (implementation reposu); içerik kapısı allowlist-dışı addon beyanını `SECURITY_REVIEW_REQUIRED` sinyaline düşürür.

## 11. Preview Retention & Evidence

**Amaç.** Geçmiş release kanıtının kaybolmasını ve süresiz preview birikiminin maliyet/veri riskini aynı anda önlemek.

**Normatif kurallar.**

1. Release baseline kanıtı kalıcıdır; silinmesi YASAKTIR.
2. PR preview sürelidir; implementation CI süre dolunca otomatik siler (süre değeri UU-K3 kararıyla kesinleşir).
3. Evidence manifesti append-only'dir (yalnızca eklenebilir); geçmiş kaydı değiştirmek veya silmek YASAKTIR.
4. Hassas preview'ı güvenlik ekibi erken sildirebilir; ancak audit ref (denetim referans kaydı) manifestte korunur. Referanssız silme YASAKTIR.

**Kapattığı riskler:** U26.

**Makine karşılığı:** `uiDelivery.evidence.{manifestRef, retentionClass}`; yürütme: implementation CI retention işi.

## 12. Break-glass UI Delivery

**Amaç.** Storybook/vendor kesintisinde veya acil production hotfix'inde teslimatın bloke olmamasını, ama her kapı atlamasının kayıtlı ve telafili kalmasını sağlamak.

**Normatif kurallar.**

1. Break-glass (acil durumda kalite kapılarını bilinçli atlama yetkisi) yalnız tanımlı insan yetkilisince kullanılır (yetki sahibi UU-K9 kararıyla kesinleşir); AI'nin break-glass kullanması YASAKTIR.
2. Her kullanım kayıtlıdır: `uiDelivery.breakGlass.{used, auditRef, remediationTaskRef}` ZORUNLUDUR; kayıtsız kapı atlaması YASAKTIR.
3. Kullanım, otomasyonun açtığı telafi-evidence görevini tetikler: atlanan kanıtları sorumlu ekip tanımlı süre içinde tamamlar.
4. Güvenlik/kalite sorumlusu break-glass kullanımını periyodik denetler; örüntüleşen kullanım kötüye-kullanım incelemesi açar.

**Kapattığı riskler:** U22; U6'nın kesinti bağlamı (story kanıtı üretilemezken teslimat).

**Makine karşılığı:** `uiDelivery.breakGlass.{used, auditRef, remediationTaskRef}`; kapı: içerik kapısı kayıt bütünlüğü; telafi görevini otomasyon açar.

---

## 13. CI sinyal taksonomisi

Rapor §9'daki 8 sinyalin üretim yeri ve etkisi. FIXTURE_DRIFT iki halde iki ayrı tarafta üretilir.

| Sinyal | Üreten taraf | Etki |
|---|---|---|
| `BUDGET_EXCEEDED` | actionplan içerik kapısı (`check-ui-delivery.mjs`) | Tüm risk sınıflarında bloklar; çözüm insan onaylı bütçe kararıdır |
| `SECURITY_REVIEW_REQUIRED` | actionplan içerik kapısı | Publish'i bloklar (tüm sınıflar) |
| `MANUAL_A11Y_REQUIRED` | actionplan içerik kapısı | Critical/high bloklar; medium/low warning |
| `OWNER_MISSING` | actionplan içerik kapısı | Critical/high bloklar (baseline onayı dahil); medium/low warning |
| `FIXTURE_DRIFT` (fingerprint beyanı yok) | actionplan içerik kapısı | Critical/high bloklar; medium/low warning |
| `FIXTURE_DRIFT` (çalışma zamanı: fingerprint ≠ gerçek şema) | implementation storybook-ci | Critical/high bloklar; medium/low warning |
| `BASELINE_STALE` | implementation storybook-ci | Critical/high bloklar; diğerleri warning |
| `VERSION_MISMATCH` | implementation storybook-ci | Release kapısında bloklar (tüm sınıflar) |
| `FLAKY_QUARANTINED` | implementation storybook-ci | Warning; karantina süresi aşılırsa bloklar |

## 14. İnsan kararı bekleyen sorular (UU-K listesi)

Rapor §11'in 12 sorusu. Karar insanındır; önerilen varsayılan, karar gelene kadar AI üreticinin ve kapıların çalışma zeminidir.

- UU-K1 — Visual regression hizmeti cloud mu self-hosted mı? Önerilen varsayılan: self-hosted-öncelikli + vendor-neutral evidence (kanıt biçimi hiçbir servise bağımlı olmaz).
- UU-K2 — Preview'lar public, organization-private, VPN-only mı? Önerilen varsayılan: organization-private; public yalnız sanitize edilmiş ve güvenlik-onaylı katalog için.
- UU-K3 — Hangi evidence ne kadar saklanır? Önerilen varsayılan: release evidence kalıcı, PR preview 30 gün, hassas preview 7 gün + kalıcı audit ref.
- UU-K4 — Critical bileşenlerde zorunlu browser matrisi? Önerilen varsayılan: her PR'da Chromium; critical'da nightly Firefox + WebKit.
- UU-K5 — Master onay yetkisi merkezi mi federated mı? Önerilen varsayılan: federated owner + promotion anında merkezi API review.
- UU-K6 — PR başına story/visual zaman-maliyet bütçesi? Önerilen varsayılan: changed-story selection ile yalnız etkilenen story'ler; PR hedefi 10 dakikanın altı + aylık maliyet alarmı.
- UU-K7 — Representative locale/theme/tenant seti? Önerilen varsayılan: default + Turkish casing + pseudo-long + RTL + complex-plural locale seti; canonical theme sınıfları.
- UU-K8 — Manuel screen-reader review'u kim, hangi sıklıkta yapar? Önerilen varsayılan: a11y-yetkin ikinci reviewer, her critical release öncesi.
- UU-K9 — Break-glass yetkisi kimde? Önerilen varsayılan: nöbetçi teknik lider + ikinci insan onayı, kullanım başına audit.
- UU-K10 — Addon allowlist ve yeni addon onayı kimde? Önerilen varsayılan: toolchain owner, ADR zorunlu.
- UU-K11 — Figma/design registry ile code registry nasıl eşlenir? Önerilen varsayılan: ortak component kimliği + token registry; runtime doğruluk kaynağı kod tarafıdır.
- UU-K12 — Fixture factory'nin schema/privacy owner'ı kim? Önerilen varsayılan: factory sahipliği şema/kernel ekibinde, privacy onayı güvenlik ekibinde.

## 15. Dalga planı ve kabul

Rapor §12'nin beş dalgası iki repoya ayrışır: actionplan sözleşme/şema/kapı tanımını, implementation reposu çalışan mekanizmayı üretir. Sözleşme/şema/kapı katmanının UU-0 kısmı bu paketle bu turda kapanmıştır.

| Dalga | Kapsam (rapor §12) | actionplan tarafı | implementation tarafı |
|---|---|---|---|
| UU-0 Güvenlik ve kapsam bütçesi | coverage budget, security/publishing, sanitization, allowlist, baseline governance | Sözleşmeler 1, 3, 4, 10 — bu turda kapandı | Sanitization + secret/PII scan araçları, publish altyapısı |
| UU-1 Gerçeklik paritesi | fixture fingerprint, provider factory, version parity, app-shell harness, permission backend linkage | Şema alanları bu pakette (sözleşme 2, 6) | Fingerprint üretimi, ortak provider factory, parity testleri, harness |
| UU-2 Determinizm ve maliyet | font/time/random/motion freeze, changed-story selection, shard/cache, maliyet dashboard | Yalnız sinyal sözleşmesi (bölüm 13, sözleşme 7) | Determinizm konfigürasyonu, seçim/shard/cache, dashboard |
| UU-3 İnsan review ve erişilebilirlik | manual a11y matrix, owner federation, review SLA, diff taxonomy, break-glass | Süreç sözleşmeleri bu pakette (3, 5, 8, 12) | SLA takibi, review tooling, break-glass otomasyonu |
| UU-4 Legacy ve ölçek | orphan/duplicate/freshness audit, performance profiles, representative matrix, deprecation closure | Şema alanları (sözleşme 9) + UU-K7 kararı | Audit kapıları, performans ölçümü, migration takibi |

Kabul: Rapor §13'teki 12 kriter kapanış checklist'idir; metni burada tekrarlanmaz, referans verilir. Bu paket kriterlerin "sözleşme tanımlı" yarısını kapatır; "mekanizma çalışıyor" yarısı implementation reposunun evidence'ına bağlıdır. Bir kriter ancak her iki yarı da kanıtlandığında kapanmış sayılır.

---

## 16. Kök-Entegrasyon Eki (v0.2 — 2026-07-12): Rol Modeli, Registry Katmanı ve Dürüst Migration

Bu ek, kök-entegrasyon denetiminin (`docs/storybook-root-integration-gap-report.md`) P0/P1 bulgularını pakete bağlar. Rapordaki kural ve gerekçe metni buraya kopyalanmaz; kanonik analiz için rapor §3 (eksikler), §5 (registry aileleri) ve §8-§10 (kapatma planı, tamamlanma tanımı, hüküm) referanstır.

### 16.1 uiArtifactRole — beş-rol modeli

Her düğüm beş rolden birini taşır: `produces-ui`, `changes-ui-contract`, `governs-ui`, `consumes-ui`, `no-ui`. `impact` alanı tek başına bu ayrımı taşıyamaz: Storybook'u ANLATAN bir doküman/ADR düğümü `governs-ui`'dir ve UI üreticisi DEĞİLDİR — "Storybook kelimesi geçiyor, öyleyse UI teslimatı" biçimindeki kelime-temelli yanlış sınıflamayı bu rol ayrımı kapatır (kaynak: root-integration raporu §3 "Classifier yanlış problemi çözüyor"). `check-ui-delivery` adaylığı yalnız `produces-ui` ve `changes-ui-contract` rollerinden doğar; diğer üç rol sözleşme taşımaya zorlanmaz.

### 16.2 Registry katmanı — `src/data/storybook/` altındaki 16 kanonik aile

Rapor §5 tablosunun özeti (ad → önlediği risk); zorunlu içerik alanları için rapor kanoniktir:

- `master-components.json` → sahte/duplicate master
- `story-catalog.json` → serbest, doğrulanmayan storyRef
- `ui-artifact-roles.json` → kelime-temelli yanlış sınıflama
- `surface-component-map.json` → kökten uca kopukluk
- `field-widget-map.json` → atomların UI karşılığının kaybı
- `component-consumers.json` → sessiz breaking change
- `story-coverage-policy.json` → kontrolsüz Cartesian patlaması veya eksik kapsam
- `fixture-contracts.json` → sahte ve güvensiz fixture
- `evidence-manifest.json` → uydurma URL/evidence
- `visual-baseline-governance.json` → accept-all ve baseline aklama
- `publish-security-policy.json` → preview veri sızıntısı
- `addon-allowlist.json` → supply-chain riski
- `version-compatibility.json` → lokal-CI ve federation drift'i
- `deprecation-migrations.json` → sonsuz deprecated component
- `ownership.json` → owner'sız katalog
- `legacy-ratchet.json` → baseline bypass ve çift kaynak

Foreign-key ilkesi: `masterComponentRefs` serbest string DEĞİLDİR; her referans `master-components.json` içindeki bir kayda çözülmek zorundadır. Orphan referans ve duplicate id `check-storybook-registry` kapısında reddedilir (şema: `src/schemas/storybook-registry.ts`; kapı kaydı: `docs/ci-conformance-gates.md`).

### 16.3 Dürüst migration — MIGRATION_INCOMPLETE ve ratchet tamper-guard

Sıfır-sözleşmeli corpus PASS veremez. Corpus'ta açık-kararsız düğüm veya legacy warning varken `check-ui-delivery` sonucu `MIGRATION_INCOMPLETE`'tir (exit 0, ama asla "PASS" yazmaz); `PASS` yalnız 467/467 düğüm açık karar taşıdığında ve 0 legacy warning kaldığında yazılır. Ratchet baseline'ı tamper-guard taşır: `originChecksum` origin snapshot'ını mühürler, güncel `allowedWarnings` yalnız origin listesinin alt kümesi olabilir (monotonic azalma); ihlalde `RATCHET_TAMPERED` kapıyı kırar (gerekçe: rapor §3 "Ratchet delinmeye açık").

### 16.4 Kapsam sınırı

Registry İSKELETLERİ bu turda kuruldu; kayıtlar implementation/migration dalgalarında dolar. `platform` içinde çalışan Storybook YOKTUR: actionplan kapıları "plan sözleşmesi mevcut" kanıtı sunar, "Storybook çalışıyor" kanıtı SUNAMAZ (rapor §10). Bu ek, bölüm 1-15'teki hiçbir sözleşmeyi değiştirmez; onların corpus'a ve registry'ye bağlanma yolunu tanımlar.
