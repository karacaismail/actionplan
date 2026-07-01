# ArcheType ↔ Numeronym Standart Eşlemesi — Hangi Standart Hangi Yönergede Karşılanır

Sürüm: 1.0 — 2026-07-01
Durum: AI-DRAFT (insan onayı bekliyor). Bağlam: `docs/archetype-uretim-spec.md` (özellikle §12 sözleşme aileleri + §12.B FieldType + §12.E i18n zorunluluğu), `plan-03-yeni-yonergeler-2026-07-01.md` §3 (5 kernel primitifi), `docs/computation-derivation-contract.md`, `docs/standards/numeronym-siniflandirma.md`, `docs/standards/01-i18n-l10n-g11n-standard.md`, `docs/standards/05-c13n-canonicalization-standard.md`, `docs/standards/06-data-normalization-standard.md`, `docs/standards/00-standards-index.md`.

Amaç: `numeronym-siniflandirma.md`'de sınıflanan her numeronym standardının **ArcheType katmanında** hangi yönergeye/alana düştüğünü göstermek. Yani "bu standart, bir ArcheType sözleşmesinin hangi parçasıyla (bkz. archetype-uretim-spec §2 sözleşme-ailesi parçaları) karşılanır?" sorusunu cevaplar. Bu doküman yeni kural üretmez; mevcut standartları mevcut ArcheType alanlarına *bağlar* (`00-standards-index.md` §1 "Reference, Don't Duplicate").

---

## 1. En Kritik Ayrım — Archetype-Katmanı vs. Surface/Kernel-Katmanı

Bu bölüm eşlemenin kapsam sınırını netleştirir; karıştırılırsa "her standart bir ArcheType alanıdır" sanılır ve şema şişer.

Numeronym'lerin bir kısmı **veri sözleşmesi** (ArcheType) katmanında yaşar: bir alanın çevrilebilir olması (i18n-text), kanonikleşmesi (c13n), normalize edilmesi (n6n), türetilmesi (computation), izlenmesi (audit policy). Bunlar ArcheType sözleşmesinin parçalarıyla (fields · validation rules · semantic rules · audit policy · data retention) doğrudan eşlenir.

Diğer bir kısmı **çapraz-kesen** (cross-cutting) standarttır ve tek bir ArcheType alanına düşmez; ArcheType'a *dışarıdan* uygulanır veya ayrı bir kernel primitifinde/surface katmanında yaşar: a11y (WCAG — surface render katmanı), o11y (observability — runtime/log katmanı), authn (kimlik doğrulama — `k-iam`/kernel). Bunlar tablo boyunca **"surface/kernel katmanı"** olarak işaretlenir; ArcheType alanı değildir (ama ArcheType'ın audit/permission alanlarıyla *ilişkilenir*).

Üçüncü ayrım (`numeronym-siniflandirma.md` §1): iş modeli (B2B/B2C) ve araç/domain (REST/ERP) zaten standart-DEĞİL; bu tabloda yer almazlar — onlar Mode-Profile capability veya `data-api-contract` seçimidir.

---

## 2. Eşleme Tablosu — Standart × ArcheType Yönergesi/Alanı

Aşağıdaki tablo her numeronym standardını, karşılandığı ArcheType yönergesine/alanına ve karşılanma biçimine eşler. `durum` sütunu: **VAR** = ilgili ArcheType alanı/parçası archetype-uretim-spec'te (çoğunlukla §12) zaten tanımlı; **YENİ** = standart mevcut ama ArcheType alanına bağı bu eşlemeyle önerilir (insan onayına). "Katman" sütunu archetype (ArcheType alanı) veya surface/kernel (çapraz-kesen) ayrımını verir.

| Standart (numeronym) | ArcheType yönergesi / alanı | Nasıl karşılanır | Katman | Durum |
|---|---|---|---|---|
| **i18n** (internationalization) | `fields[].type = i18n-text` + §12.E çevrilebilirlik beyanı | ArcheType hangi alanının çevrilebilir (`locale→değer`) olduğunu açıkça beyan eder; beyanı olmayan ArcheType conformance test'ten geçemez (§12.E) | archetype | VAR |
| **l10n** (localization) | `fields[].type` (money/measure/i18n-text) + enum alias (§12.E) | Alan tipi biçimleme metadata'sını (money: kur/kesinlik/yuvarlama; measure: birim/dönüşüm) taşır; enum etiketi alias tablosundan locale'e göre çözülür | archetype | VAR |
| **m17n** (multilingualization) | `fields[].type = i18n-text` (çoklu-script alt-kapsam) | i18n-text `locale→değer` eşlemesi çoklu-script metni de taşır (NFC ile, bkz. c13n); ayrı alan değil, i18n-text'in genişletilmiş kullanımı | archetype | VAR |
| **t9n** (translation) | §12.E çeviri iş akışı + audit policy | Çeviri taslak→inceleme→yayın akışı i18n-text alanları üzerinde işler; enum/etiket değişimi alias-ekleme (append-only, spec §4 ruhu) | archetype | VAR |
| **g11n** (globalization) | ArcheType `tenant isolation policy` + `data retention policy` (residency ekseni) | locale≠currency≠tax≠residency ortogonalliği: residency etiketi tenant-isolation/retention parçasına düşer; ArcheType alan-tipi değil, sözleşme-politikası | archetype | YENİ |
| **c13n** (canonicalization) | `fields[]` kanonik kural + `validation rules` (UNIQUE/CHECK) | Bir alan kanonik biçime indirilir (slug/E.164/NFC/SKU); kanonik anahtar `validation rules` içindeki UNIQUE/CHECK ile zorlanır; kanonik fonksiyon idempotent (C13N-01) | archetype | YENİ |
| **n6n** (normalization) | `fields[]` normalize disiplini + `relations` (3NF) + EAV/attribute-set depolama | Bileşik alan alt-alanlara bölünür (ad/adres/para); 3NF `relations` ile kurulur (çok-değerli kolon yasak); esnek nitelikler §12.B attribute-set/EAV tipiyle depolanır | archetype | YENİ |
| **d10n** (denormalization) | `search/index rules` + `data retention policy` (read-model) | Kontrollü denormalizasyon ArcheType'ın ana gövdesine yazılmaz; ayrı read-model/projection olarak search/index parçasına düşer; kaynak daima 3NF normalize kalır (D10N-02) | archetype | YENİ |
| **computation** (derivation) | `fields[].derived = true` → Computation sözleşmesi (§12.A.4 / `k-computation`) | Türetilmiş alan (fiyat/vergi/BOM-patlama/skor) değeri kullanıcı girmez; girdilerden saf ifade grafiğiyle üretilir; ArcheType `fields` içinde `derived` işaretlenip Computation'a bağlanır | archetype | VAR |
| **provenance** (köken/soy) | `audit policy` (alan-düzeyi) + `k-mdm` golden-record/survivorship | Değerin nereden geldiği/nasıl değiştiği ArcheType `audit policy` ile izlenir; MDM golden-record + alan-düzeyi provenance (kaynak-sistem) `k-mdm` katmanında birleşir (PIM-v2 §MDM) | archetype + kernel | YENİ |
| **validation** (assertion) | `validation rules` + `semantic rules` | "Bu alan boş olamaz / toplam ≥ 0 / iş-kuralı tutarlı mı" doğrulaması ArcheType'ın validation+semantic rules parçalarıyla karşılanır; computation'dan ayrı eksen (doğrular vs. üretir, §12.A.4) | archetype | VAR |
| **a11y** (accessibility) | ArcheType alanı DEĞİL → Surface `a11y.wcag = 2.2-AA` render katmanı | ArcheType veri sözleşmesidir; erişilebilirlik onun projeksiyonu olan Surface'ta (WCAG 2.2 AA, `check-ui-standards`) karşılanır | surface/kernel | VAR |
| **o11y** (observability) | ArcheType alanı DEĞİL → runtime/log katmanı (`observability` std) | Structured log + trace_id + audit_events runtime katmanında; ArcheType yalnız `audit policy` ile buna *besleme* sağlar (kayıt-değişimi olayı), gözlemleme ArcheType alanı değildir | surface/kernel | VAR |
| **authn** (authentication) | ArcheType alanı DEĞİL → `k-iam` / kernel (kimlik doğrulama) | ArcheType kimliği *modeller* (Party) ama doğrulamaz; kimlik doğrulama `s-iam`/`k-iam` kernel primitifinde; ArcheType yalnız `permissions`/`ReBAC/ABAC policies` ile yetkiye bağlanır | surface/kernel | VAR |
| **authz** (authorization) | ArcheType `permissions` + `ReBAC/ABAC policies` → `k-policy-pdp` | Yetki kararı ArcheType'a gömülü değil; `permissions`/ABAC parçası PDP'ye (plan-03 §3.5) girdi verir; PDP çapraz-kesen karar noktasıdır | archetype + kernel | VAR |
| **c12n** (customization) | ArcheType `AI policy` / `linked capabilities` + tenant-editable parametreler | Tenant-özelleştirme ArcheType'ın tenant-güvenli parametreleriyle (spec §7 RulesetLayer tenant) ve Capability-gate ile sınırlanır; serbest kod değil, veri | archetype | YENİ |
| **p13n** (personalization) | ArcheType alanı DEĞİL → Surface/kullanıcı-tercih katmanı | Kullanıcı-bazlı kişiselleştirme (saved views) Surface ve `user_preferences` katmanında; ArcheType veri şeması buna kaynak olur ama p13n alanı taşımaz | surface/kernel | YENİ |
| **i14y** (interoperability) | ArcheType `linked surfaces` (API projeksiyonu) + `external ruleset bindings` | Dışa-açık API/webhook/idempotency ArcheType'ın Surface (API izdüşümü) ve dış-ruleset bağı üzerinden; ArcheType gövdesi değil, projeksiyonu | archetype + surface | YENİ |

---

## 3. Grup Bazında Kısa Gerekçe (Tablo-Sonrası Açıklama)

Bu bölüm tabloyu üç gruba özetler; her grubun ArcheType katmanındaki ağırlığını verir.

**i18n ailesi (i18n/l10n/m17n/t9n) → tek çıpa: i18n-text alan beyanı.** Dördü de aynı ArcheType mekanizmasına (`fields[].type = i18n-text` + §12.E beyan zorunluluğu) yaslanır; farkları biçimleme (l10n), script (m17n) ve iş akışı (t9n) katmanındadır. ArcheType'ın tek sorumluluğu: hangi alanın çevrilebilir olduğunu beyan etmek. Bu beyan `check-i18n` + conformance test ile bloklayıcıdır.

**Veri disiplini ailesi (c13n/n6n/d10n) → fields + validation + relations + EAV.** c13n bir alanın kanonik kimliğini üretir (validation rules'taki UNIQUE/CHECK ile zorlanır); n6n şemayı 3NF'e böler (relations) ve esnek nitelikleri §12.B EAV/attribute-set ile depolar; d10n ise ArcheType gövdesine değil, ayrı read-model/search-index parçasına düşer. Üçü de "değer üretmez, biçim/kimlik disiplini uygular" — bu yüzden computation'dan ayrı eksendir.

**Türetme ve köken (computation/provenance/validation) → fields.derived + audit policy + validation/semantic rules.** computation türetilmiş alan üretir (fiyat/vergi/skor), validation doğrular (assertion), provenance ise değerin soyunu/kaynağını `audit policy` (alan-düzeyi) + `k-mdm` golden-record ile izler. Üçü ArcheType'ın en denetlenen parçalarıdır ve spec §12 invariant'ı gereği geçmiş transaction immutable kalır.

**Çapraz-kesen (a11y/o11y/authn/p13n) → surface/kernel, ArcheType alanı değil.** Bunlar ArcheType veri sözleşmesinin dışında yaşar: a11y Surface render'da, o11y runtime log'da, authn `k-iam`'de, p13n kullanıcı-tercih katmanında. ArcheType onlara yalnız *besleme* (audit policy → o11y) veya *bağ* (permissions → authz/PDP) sağlar; kendi gövdesinde barındırmaz.

---

## 4. Özet — Archetype Katmanı Numeronym Kapsaması + standardRef Bağı

Bu bölüm ArcheType katmanının numeronym standartlarını ne ölçüde kapsadığını ve hangi ArcheType alanına hangi `standardRef`'in bağlandığını tek yerde verir.

**Kapsama özeti:** 17 numeronym standardından **11'i doğrudan ArcheType alanıyla** (i18n/l10n/m17n/t9n/g11n/c13n/n6n/d10n/computation/provenance/validation + authz/c12n/i14y kısmen) karşılanır; **4'ü çapraz-kesen** olup surface/kernel katmanında yaşar (a11y/o11y/authn/p13n) ve ArcheType'a yalnız audit/permission ile *ilişkilenir*. ArcheType katmanının en güçlü olduğu alanlar: veri disiplini (c13n/n6n), çevrilebilirlik (i18n ailesi) ve türetme/köken (computation/provenance/validation). En zayıf olduğu (çapraz-kesen bırakılan) alanlar: erişilebilirlik ve gözlemlenebilirlik — bunlar bilinçle ArcheType dışında tutulur.

Aşağıdaki tablo hangi ArcheType alanına (sözleşme-ailesi parçası) hangi `standardRef`/primitif bağlandığını verir; düğümler `standardRefs` ile bu sözleşmelere bağlanır (`00-standards-index.md` §1).

| ArcheType alanı (sözleşme parçası) | Bağlanan standardRef / primitif | Karşılanan numeronym |
|---|---|---|
| `fields[].type = i18n-text` + çevrilebilirlik beyanı | `standardRefs.i18nRef = i18n-standards` | i18n, l10n, m17n, t9n |
| `fields[]` kanonik kural + `validation rules` (UNIQUE/CHECK) | `standardRefs → c13n` | c13n |
| `fields[]` normalize + `relations` (3NF) + attribute-set/EAV | `standardRefs → n6n` (`data-normalization`) | n6n, d10n |
| `fields[].derived` → Computation sözleşmesi | `k-computation` (ADR-A4) | computation |
| `validation rules` + `semantic rules` | (yerleşik — assertion ekseni) | validation |
| `audit policy` (alan-düzeyi) + golden-record | `k-mdm` + `observability` (besleme) | provenance |
| `permissions` + `ReBAC/ABAC policies` | `k-policy-pdp` (ADR-P1), `authz-rbac-abac` | authz |
| `tenant isolation` / `data retention` (residency) | `standardRefs → g11n` | g11n |
| `AI policy` / tenant-editable + Capability-gate | `k-capability`, `c12n` | c12n |
| `linked surfaces` (API izdüşümü) + `external ruleset bindings` | `i14y` | i14y |
| (ArcheType dışı — Surface render) | `standardRefs → a11y` (Surface `a11y.wcag`) | a11y |
| (ArcheType dışı — runtime/log) | `observability` (o11y) | o11y |
| (ArcheType dışı — kernel kimlik) | `s-iam` / `k-iam` | authn |
| (ArcheType dışı — kullanıcı tercih) | `p13n` | p13n |

Sonuç: Bir ArcheType sözleşmesi, numeronym standartlarının veri-katmanı sorumluluğunu (çevrilebilirlik + kanonik/normalize + türetme + köken + yetki-bağı) `fields`/`validation`/`relations`/`audit`/`permissions` parçalarıyla karşılar; erişilebilirlik/gözlemlenebilirlik/kimlik-doğrulama gibi çapraz-kesen standartları ise bilinçle surface/kernel katmanına devreder ve onlara yalnız `standardRefs` + audit/permission bağıyla eklemlenir. "YENİ" işaretli satırlar (g11n/c13n/n6n/d10n/provenance/c12n/i14y bağları) insan onayı sonrası ilgili ArcheType alanının `standardRefs`'ine eklenir; drift üretmemek için kural değeri burada değil, ilgili `src/data/standards/*.json` sözleşmesinde tutulur.

---

Bağlı: `docs/archetype-uretim-spec.md` (§2 sözleşme-ailesi parçaları, §12 v2 aileleri + FieldType + i18n zorunluluğu), `docs/computation-derivation-contract.md` (türetilmiş alan sözleşmesi), `docs/standards/numeronym-siniflandirma.md` (7-aile sınıflandırması + MUST/SHOULD/NOT-FEATURE), `docs/standards/00-standards-index.md` (standart hub), `plan-03-yeni-yonergeler-2026-07-01.md` §3 (5 kernel primitifi: k-party/k-capability/k-mode/k-computation/k-policy-pdp), `docs/reference/PIM-v2-Gereksinim-Analizi.md` (MDM golden-record/provenance kaynağı).
