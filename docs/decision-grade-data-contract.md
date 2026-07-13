# Decision-Grade Data Contract — Karar Verisi Doğruluk Zinciri

**Sürüm:** 0.1 · **Tarih:** 2026-07-12 · **Durum:** AI-DRAFT (insan onayı bekler)
**Makine kontratı:** `src/data/standards/decision-grade-data.json` (decision-grade-data — zincir/boyut/event/para kuralları)
**Kapatır:** Revize gap listesi #3 — dış incelemenin ana sistem açığı tespiti: "veri türleri sayılmış, veri doğruluğu sistemi tanımlanmamış; yanlış runway/CAC/karşılık doğruymuş gibi sunulur."
**Konum:** Bu bir contract'tır (archetype değil): EVM'in TÜM veri-taşıyan modülleri buna uyar. `core-contract-pack` disiplinindedir; çelişkide kernel runtime sözleşmesi önceliklidir.

---

## 1. Amaç ve tehdit modeli

EVM, 50M ₺ ölçekli kararları besler. En tehlikeli hata modu yanlış veri değil, **doğru görünen yanlış veridir**: yanlış girilmiş bir maaş çarpanı, mutabakatsız bir banka bakiyesi veya sürümsüz bir formülle hesaplanmış CAC, dashboard'da aynı kesinlikte görünür. Bu contract her rakamın şu 12 soruya cevap verebilmesini zorlar: kaynağı ne, kim girdi, kim onayladı, hangi tarihte geçerliydi, ne zaman kaydedildi, sonradan değişti mi, hangi formülün hangi sürümüyle hesaplandı, aynı tutar muhasebe/banka/bütçede neden farklı, dönem kapandıktan sonra değişebilir mi, hangi belgeyle doğrulandı, düzeltme eski kurul raporunu değiştirir mi, dashboard toplamı ledger'la mutabık mı.

## 2. Çekirdek zincir (normatif)

```
Kaynak veri → Doğrulama → Onay → Mutabakat → Dönem kilidi → Hesaplama → KPI → Rapor → Yayınlanmış snapshot
(source)      (validate)   (approve) (reconcile)  (period lock)  (compute)   (KPI)  (report)  (published snapshot)
```

Her halka atlanabilir DEĞİLDİR; halkanın uygulanmadığı veri sınıfı için gerekçeli muafiyet kaydı gerekir (ör. operasyonel not verisi mutabakat gerektirmez). Muafiyet `waiver-policy` disiplinindedir.

## 3. Halka sözleşmeleri

### 3.1 Kaynak (provenance)

Her kayıt şu zarfı taşır: `source_kind` (EnumType: manual / import / api / event / derived), `source_ref` (import job / dış sistem / olay kimliği), `entered_by` (PartyRef — manuel ise kim), `evidence_ref` (AssetRef — fatura/ekstre/belge; zorunluluk sınıfa göre), `entered_at` (timestamptz). Kaynak hiyerarşisi çakışmada sıralıdır (tenant-konfigürasyonlu; varsayılan: reconciled > api/event > import > manual) — aynı gerçeğin iki kaynağı çelişirse yüksek kaynak kazanır, düşük kaynak `superseded` işaretlenir, ikisi de saklanır.

### 3.2 Çift zaman ekseni (bitemporal)

Her mali/parametrik kayıt iki zaman taşır: `effective_time` (gerçek dünyada ne zaman geçerli — "Mart maaşı") ve `transaction_time` (sisteme ne zaman yazıldı/değişti). Soru "Mart raporu Nisan'da nasıl görünüyordu?" her iki eksenle cevaplanabilir. `org-employment`'ın as-of kuralı bu contract'ın özel halidir; genel kural TÜM parametre ve mali kayıtlara uygulanır.

### 3.3 Doğrulama (validation)

Üç seviye: (a) atomik tip doğrulaması (Money kur zorunlu, Percentage aralık — atom kataloğu); (b) iş kuralı doğrulaması (bütçe satırı venture+dönem koordinatı, çakışan as-of penceresi reddi); (c) belge doğrulaması (`evidence_ref` zorunlu sınıflar: eşik üstü harcama, banka hareketi — eşik `KARAR BEKLİYOR`). Doğrulanmamış kayıt `unverified` bayrağıyla yaşayabilir ama KPI/rapor hattına **girmez** (aşağıda §3.7).

### 3.4 Onay (maker-checker)

Mali sınıf kayıtlarında hazırlayan ≠ onaylayan (`venture-core.approval`; DB kısıtı + PDP). Onay kapsam sınıfları: fiş (finance_lead), capex eşik-üstü (CEO step-up), parametre değişikliği (sınıf sahibi), yayın (CEO). Onaysız kayıt `draft` durumunda kalır ve türetim hattına girmez.

### 3.5 Mutabakat (reconciliation)

Aynı gerçeğin bağımsız kayıtları periyodik karşılaştırılır: ledger ↔ banka ekstresi (import), bütçe actual ↔ ledger toplamı, kampanya harcaması ↔ platform faturası, dashboard toplamı ↔ ledger (her render değil; günlük job + fark rozetle gösterilir). Mutabakat sonucu üç durumdan biri: `matched` / `explained_difference` (gerekçe kaydıyla — ör. yoldaki ödeme) / `unreconciled` (fark alarmı, E-kuralı). `unreconciled` veri KPI'da **güven düşük** işaretiyle gösterilir, kurul snapshot'ına gerekçesiz giremez.

### 3.6 Dönem kilidi (period lock)

`reporting_period.status=locked` sonrası o döneme yazım kapalıdır. Zorunlu düzeltme **restatement** yoludur: yeni kayıt `restates_ref` ile eskiyi işaret eder, dönem raporu yeni SÜRÜM alır, eski sürüm ve yayınlanmış snapshot DEĞİŞMEZ; fark "restatement notu" olarak yeni sürümde açıklanır. Cevap netleşir: *yanlış veri düzeltilirse eski yönetim kurulu raporu değişmez; düzeltilmiş yeni sürüm yayınlanır ve fark açıklanır.*

### 3.7 Hesaplama ve formül sürümü (computation + lineage)

Türetilmiş her değer (CAC, runway, karşılık, sapma) şu üçlüyü kaydeder: `formula_ref` + `formula_version` (KPI sözlüğü sürümlü — formül değişince eski hesaplar eski sürümle yeniden üretilebilir), `input_lineage[]` (hangi kayıtlardan — kayıt kimlikleriyle), `computed_at` + `as_of`. Determinizm değişmezi: aynı girdi + aynı formül sürümü + aynı as-of = aynı sonuç (`computation-derivation-contract` ile ortak). Girdi hattında `unverified`/`unreconciled` kayıt varsa çıktı `confidence` düşürülmüş olarak işaretlenir — UI bunu gizleyemez.

### 3.8 KPI → Rapor → Snapshot

KPI değerleri metrik sözlüğünden (formül sürümlü) üretilir; rapor KPI + bağlam metnidir; yayın `management_snapshot`'tır (payload hash'li, değişmez, sürümlü — `venture-core §4.1`). Export edilen dosya ile ekrandaki rakam aynı snapshot'tan gelir (ayrı sorgu = drift riski; yasak).

## 4. Veri sınıfı × halka matrisi

| Veri sınıfı (probe §Bölüm-5 taksonomisi) | Doğrulama | Onay | Mutabakat | Dönem kilidi | Lineage |
|---|---|---|---|---|---|
| Referans/master (maaş parametresi, kanal, CoA) | tip+as-of | sınıf sahibi | — | as-of pencere değişmezi | sürüm zinciri |
| İşlemsel mali (fiş, harcama, satınalma) | tip+belge | maker-checker | ledger/banka | locked sonrası restatement | kaynak zarfı |
| Olay (member.activated, sale.completed) | şema+idempotency | — (otomatik) | platform mutabakatı (P1) | — | olay kimliği |
| Türetilmiş (CAC, runway, karşılık) | girdi güveni | — (formül onayı ayrı) | dashboard↔ledger | as-of yeniden üretim | formül sürümü + girdi listesi |
| İçerik/rapor | — | yayın onayı | — | snapshot | kaynak KPI seti |
| Konfig/politika (PDP, ECA) | şema | step-up | — | sürümlü | değişiklik audit'i |

## 5. Global analitik ve deney boyutları

Tek `locale` alanı global ürün analizi için YETERSİZDİR: dil, pazar, para ve bölge ayrı soruların cevaplarıdır ve tek alana sıkıştırılamaz. Karar verisi taşıyan analitik/deney kayıtları şu boyutları AYRI AYRI izler: UI dili; içerik dili; format locale'i; pazar; fatura ülkesi; ödeme para birimi; saat dilimi; veri bölgesi; sözleşme dili; uygulama sürümü; çeviri sürümü.

Normatif kurallar: (1) analytics event adları ÇEVRİLMEZ — event ad sözlüğü dil-bağımsızdır; (2) UI metni event key olarak KULLANILMAZ (metin değişince anahtar kırılır, seri kopar); (3) gelir raporlarında orijinal para ve normalize para AYRI tutulur — normalizasyon kuru ve tarihi lineage'a yazılır (§3.7); (4) günlük cohort sınırı kullanıcının/işletmenin saat dilimine göre tanımlanır — sunucu UTC günü cohort tanımının yerine geçemez; (5) consent farklılıkları nedeniyle pazarlar arası analitik kapsam eşit olmayabilir — bu fark gizlenmez, raporda kapsam notu olarak beyan edilir; (6) çeviri değişikliği conversion'ı değiştirebileceği için localization sürümü (çeviri sürümü) ölçülür ve event'e bağlanır; (7) A/B testleri metin uzunluğu, anlam ve kültürel algı açısından locale bazında yeniden değerlendirilir; (8) bir pazarda başarılı onboarding'in diğer pazarda kontrol grubu olarak kullanılması her zaman geçerli değildir — pazarlar arası genelleme ayrı hipotez olarak test edilir.

## 6. Ne yapar / ne yapmaz

**Yapar:** her rakamı kaynağına, onayına, formül sürümüne ve mutabakat durumuna kadar izlenebilir kılar; "data-sense UI"nin güven göstergelerine (tazelik, güven, lineage — Data-Sense Surface Contract P1) veri temelini sağlar. **Yapmaz:** veriyi kendisi doğrulamaz/onaylamaz (insan+kural yapar; contract yalnız zarf ve akışı zorlar); performans için halkaları kısaltmaz (mutabakat job'ı asenkrondur ama sonucu görünür olmak zorundadır); AI'a hiçbir halkada otonom yazım vermez (AI anomali/fark ÖNERİSİ üretir).

## 7. Test stratejisi (test-önce)

Zorunlu senaryolar: (1) kaynak zarfı eksik mali kayıt reddedilir; (2) unverified kayıt KPI'ya sızmaz (negatif); (3) locked döneme yazım reddedilir, restatement yolu eski snapshot'ı değiştirmeden yeni sürüm üretir (hash sabitliği kanıtı); (4) formül sürümü değişince eski dönem eski sürümle yeniden üretilir (determinizm); (5) mutabakat farkı alarm üretir ve KPI confidence düşer; (6) export=ekran aynılığı (aynı snapshot kaynağı); (7) maker=checker reddi; (8) çelişen çift kaynakta hiyerarşi kuralı + iki kaydın da korunması; (9) global boyut setinin (UI dili, pazar, saat dilimi, veri bölgesi, çeviri sürümü…) tek locale alanına indirgenmesi ve çevrilmiş event adı / UI metninden türetilmiş event key negatif testte reddedilir.

## 8. DoD

17 boyut kartı (bu contract'ın düğümünde `security`/`dataLifecycle`/`reliability` risk sinyaliyle zorunlu); tüm EVM modül yönergeleri bu contract'a `dependsOn` verir; CI'da conformance testi (zarf alanları şema kontrolü); `KARAR BEKLİYOR`: belge-zorunluluğu eşiği, kaynak hiyerarşisi tenant-varsayılanı, restatement onay zinciri.
