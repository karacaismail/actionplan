# ADR-A4 — Computation / Derivation: Türetilmiş Değer Primitifi

**Durum:** Kilitli — 2026-07-01 (insan onayı: ismail)

## Bağlam

Fiyat, vergi, BOM-patlama (ürün ağacı açılımı) ve bordro gibi *türetilmiş* değerler, bugün her modülde ayrı ve çoğu zaman denetlenemez biçimde hesaplanıyor: kimi yerde serbest kod, kimi yerde SQL, kimi yerde ön-yüzde tekrarlanan formül. Bu dağınıklık üç sorun doğurur. Birincisi, aynı hesap (örneğin fiyat = f(taban, indirim, vergi)) birden çok yerde farklı yazılırsa sonuçlar tutarsızlaşır. İkincisi, serbest JS/SQL hesap hattı denetlenemez ve güvenlik açığı taşır — girdiden çıktıya giden yol görünmez. Üçüncüsü, computation sık sık validation ile karıştırılır; oysa validation "değer doğru mu?" sorar, computation "değeri üret" der — ikisi farklı sorumluluktur. `plan-00 §4` (C6) beş primitifin kodda olmadığını; `plan-03 §3.4` ise Computation/Derivation'ın türetilmiş değerleri saf-fonksiyon derivation grafiği (DAG) olarak modellemesi ve hesap hattını görünür kılması gerektiğini işaretler. Bu ADR, türetmeyi yapısal, yeniden-hesaplanabilir ve denetlenebilir yapar.

## Karar

- **Computation/Derivation primitifi tanımlanır.** Türetilmiş değerler (fiyat, vergi, BOM-patlama, bordro) saf-fonksiyon derivation grafiği olarak modellenir; girdi alanlarından çıktı alanı yeniden-hesaplanabilir ve denetlenebilir biçimde üretilir.
- **Yapı DAG'dır (döngüsüz).** Serbest JS/SQL değildir; hesap hattı yapısaldır (güvenlik ve denetlenebilirlik için). Bütün graf döngüsüz olmalıdır; döngü testte engellenir.
- **Validation'dan ayrıdır.** Validation "değer doğru mu?" sorar; computation "değeri üret" der. İkisi karıştırılmaz.
- **Sözleşme şekli (alanlar):**
  - `computation`: `id`, `output_field`, `inputs[]`, `expr_kind` (formula | lookup-table | graph), `version`, `deterministic` (bool).
  - `derivation_edge`: `computation_id`, `depends_on_field_or_computation`. Çok-seviyeli BOM için `graph` kind (çok-seviyeli patlama).
- **WBS yerleşimi:** Kernel primitifi. Yeni düğüm `k-computation`, seviye `module`, altında archetype. Bağımlılık (`dependsOn`): `k-schema`.
- **Bağlama:** ArcheType "computed field"ları buna referans verir. Tüketiciler: Commerce (pricing), MRP (BOM-patlama + routing maliyeti), Accounting (defter türetme), HRMS (bordro).
- **AI guardrail:** AI computation ekleyebilir (`autonomy: draft`) ama versiyon + insan onayı zorunludur; döngü (cycle) üretmesi testte engellenir.

## Gerekçe

Türetmeyi saf-fonksiyon DAG olarak modellemek, aynı hesabın tek yerden tanımlanmasını ve tüm tüketiciler (Commerce/MRP/Accounting/HRMS) tarafından tutarlı kullanılmasını sağlar. `deterministic` alanı ve saf-fonksiyon kısıtı, aynı girdinin her zaman aynı çıktıyı vermesini garanti eder — muhasebe ve yasal doğruluk için gereklidir. Yapısal ifade (formula/lookup-table/graph) serbest JS/SQL'in denetlenemez ve güvensiz doğasını ortadan kaldırır; hesap hattı görünür ve denetlenebilir olur. Versiyonlama, eski hesabın eski değeri korumasını sağlar (geriye dönük fatura yeniden-hesaplanınca değişmez). DAG kısıtı, sonsuz döngü ve tanımsız türetmeyi baştan engeller; BOM'un çok-seviyeli patlaması `graph` kind ile ifade edilir.

## Sonuçlar

Olumlu:
- Hesap tek yerde tanımlanır; tüm tüketiciler tutarlı sonuç alır.
- Determinizm ve versiyonlama, denetlenebilir ve geriye-uyumlu türetme verir.
- Yapısal ifade, serbest kod/SQL'in güvenlik ve denetlenebilirlik borcunu ortadan kaldırır.

Olumsuz:
- Yapısal ifade, serbest koddan daha kısıtlıdır; çok özel hesaplar `graph` kind ile ifade edilmeli, bazen daha fazla modelleme gerektirir.
- DAG döngüsüzlüğü her değişimde doğrulanmalı; büyük graflarda doğrulama maliyeti oluşur.
- Versiyonlama, eski hesap sürümlerinin saklanmasını gerektirir; depolama ve yaşam döngüsü yönetimi ek yük getirir.

## Değerlendirilen alternatifler

- **Serbest JS/SQL hesap hattı.** Reddedildi: denetlenemez, güvensiz; girdi→çıktı yolu görünmez.
- **Hesabı her modülde tekrar yazmak.** Reddedildi: aynı formül farklı yerlerde ayrışır; tutarsız sonuç.
- **Computation'ı validation ile birleştirmek.** Reddedildi: "üret" ile "doğrula" farklı sorumluluklardır; birleştirme ikisini de bulanıklaştırır.
- **Genel iş-kuralı motoruna (ECA/ruleset) devretmek.** Reddedildi: ECA otomasyondur (event→action); computation saf türetmedir. Karıştırmak determinizm ve DAG garantisini kaybettirir.

## İlgili ADR / doküman

- `plan-03-yeni-yonergeler §3.4` (Computation/Derivation yönergesi — içerik kaynağı)
- `plan-00-kontrol-sentez §4` (C6), `plan-01 D2` (Commerce pricing), Dalga 5+ (MRP BOM)
- `core-contract-pack` v2 (Computation sözleşme taslağı)
- ADR-A3 (Mode-Profile — B2B fiyat listesi computation'ı tüketir), ADR-P1 (PDP — computation'dan ayrı: yetki vs türetme)
- Sözleşme dokümanı: `computation-derivation-contract.md` (üretilecek)
