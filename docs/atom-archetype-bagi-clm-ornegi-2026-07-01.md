# Atom → Archetype Bağı — CLM Örneğiyle Somutlaştırma

**Tarih:** 2026-07-01
**Durum:** AI-DRAFT (insan onayı bekler). Somut demonstrasyon; **kod ve kanonik şema yazmaz** — atomik tip kataloğunun CLM archetype'larını nasıl beslediğini alan alan gösterir.
**Kapsam:** `docs/atomik-tip-katalogu-tam-2026-07-01.md` (42 tip) ile `docs/atomik-primitif-katman-gap-2026-07-01.md`'nin (dört katman + 13 boyut) CLM ürününe uygulanmış hâli. Tez: **bir ArcheType, altındaki atomların sözleşmesinden daha güçlü olamaz.**
**Kaynak:** `src/schemas/archetype.ts` (`FieldSchema`, `RelationSchema`), `core-contract-pack.md §3.6/§3.15`, CLM ürün spesifikasyonu (agreement graph: Contract → Parties/Clauses/Obligations/Risks/Dates/Payments/Approvals/Signatures/Evidence/Attachments/Linked).

---

## 0. Bu belge nedir / ne yapar / ne yapmaz

**Nedir:** Atomik tip katmanının (Katman A/B/C/D) CLM archetype alanlarına birebir bağlanmasının somut haritası.

**Ne yapar:** Üç merkezi CLM archetype'ını (`archetype-agreement`, `k-obligation`, `k-signature`) alan alan atomik tipe eşler; her alanda motorun ne türettiğini ve o atom zayıf/yoksa CLM'de neyin kırıldığını gösterir; bir alan (Money) üstünden 13-boyut türetimini uçtan uca kanıtlar.

**Ne yapmaz:** Gerçek satır/mock veri üretmez (alan→tip yapısını gösterir, örnek değer değil); implementasyon kodu yazmaz; `FieldTypeSchema`'yı değiştirmez. Yeni app/module düğümü üretmez.

## 0.1 Tek cümle

CLM'in agreement-graph'ı ~20 alanının **çoğu bugün olmayan atomik tiplere** (Money-precision, DateRange, Term, Recurrence, PartyRef, ClauseRef, AssetRef, EnumType-alias) dayanır; atom katmanı kilitlenmeden bu archetype kurulursa, her alan eksik atomu `string`/`json`'a sıkıştırır ve ürünün asıl değeri (yükümlülük + yenileme + kanıt) sessizce çöker.

---

## 1. Bağ modeli — atom nasıl archetype'a akar

Bağ tek yönlü ve katmanlıdır: **atom → field → archetype → surface**. Bir alan bir atomik tipe `dependsOn` verir; ArcheType engine o atomun 13 sözleşme boyutundan DB kolonunu, doğrulamayı, API tipini, form widget'ını, arama indeksini ve i18n biçimini **türetir**. Aktör-açık: *insan* atomu ve archetype'ı onaylar; *ajan* taslağı önerir; *motor* atom sözleşmesinden projeksiyonu deterministik üretir; *CI* atom-conformance'ı zorlar.

Örnek zincir (bir alan): `Agreement.total_value` alanı → `Money` atomu (Katman B) → motor `numeric(p,s)+currency` kolonu + ISO-4217 doğrulama + para-input widget + minor-units arama indeksi + locale-para biçimi türetir. Atom `Money` yerine düz `number` ise motor yalnız "bir sayı" bilir; kalan her şeyi her archetype kendi içinde uydurur.

---

## 2. `archetype-agreement` — agreement graph, alan alan

Bu, CLM'in merkezi archetype'ıdır: sözleşmeyi "PDF" olmaktan çıkarıp işletilebilir veri grafiğine çevirir. Aşağıdaki tablo grafiğin her alanını atomik tipe, katmanına, motorun ondan türettiğine ve bugünkü duruma eşler. "Durum" atomun bugünkü hâlini yansıtır (VAR/KISMİ/EKSİK — bkz. katalog).

| Agreement alanı | Atomik tip | Katman | Motor türetimi (kritik) | Atom durumu |
|---|---|---|---|---|
| `id`, `tenant_id` | `uuid` | A | PK/FK; tenant RLS; string'e sıkıştırma yasak | KISMİ |
| `title` | `I18nText` | B | çok-dilli başlık; fallback; şema değişmeden dil ekleme | KISMİ |
| `contract_type` | `EnumType` (NDA/satış/kira/tedarik/iş) | B | teknik-kimlik sabit + dile-özel alias etiket (§12.E) | KISMİ |
| `status` | `EnumType` (+legal lifecycle) | B | draft→…→active→renewal→terminated; ordinal + deprecate | KISMİ |
| `parties` | `PartyRef[]` | C | k-party'ye tipli referans (müşteri/tedarikçi) + rol bağlamı | **EKSİK** |
| `effective_range` | `DateRange` | B | başlangıç-bitiş; çakışma/kapsama sorgusu; açık/kapalı uç | KISMİ |
| `term` | `Term` | B | "2 yıl münhasırlık"; yenileme hesabı tabanı | **EKSİK** |
| `notice_period` | `Duration` | A | "60 gün ihbar"; iş-günü farkındalığı | **EKSİK** |
| `renewal_rule` | `Recurrence` (RRULE) | B | yıllık auto-renew; sonraki tarih üretimi | **EKSİK** |
| `total_value` | `Money` | B | değer+kur+precision+rounding; float yasağı; empty≠zero | KISMİ (düz `currency`) |
| `payment_term` | `Duration` + `Money` + `Percentage` | A/B | net-60 vade + tutar + gecikme cezası oranı | **EKSİK** |
| `governing_law` | `EnumType`/jurisdiction | B | §3.15 jurisdiction ekseni; çok-yargı kuralı | KISMİ |
| `risk_score` | `Percentage` (Computation'dan) | B | politika-bazlı risk; yuvarlama; 0-100 taban | **EKSİK** |
| `clauses` | `ClauseRef[]` | C | clause-library maddesine referans; sürüm; standart/alternatif | **EKSİK** |
| `obligations` | `EntityRef` → `k-obligation` | C | yükümlülük grafiğine bağ (m2m) | KISMİ |
| `signatures` | `EntityRef` → `k-signature` | C | imza akışına bağ | KISMİ |
| `evidence` | `EntityRef` → `k-evidence` | C | kanıt kasasına bağ (append-only) | KISMİ |
| `attachments` | `AssetRef[]` | C | k-storage `digital_asset.id`+checksum; binary DB'de değil | KISMİ (düz `file`) |
| `linked_crm_deal` | `ExternalId`/`EntityRef` | C | CRM fırsatına idempotent kimlik eşleme | **EKSİK** |
| `linked_erp_vendor` | `ExternalId` | C | ERP tedarikçi kimliği (i14y) | **EKSİK** |
| `created_at`, `updated_at` | `timestamptz` | A | tz-aware instant; audit | KISMİ |

Özet: 21 alanın yalnız ~2'si (id/timestamp örtük) motorca güvenle türetilebilir; **9 alan EKSİK atoma, 10 alan KISMİ atoma** dayanır. Yani agreement archetype bugün kurulsaydı, alanların ~%90'ı eksik atomu `string`/`json`/`number`'a sıkıştırırdı.

---

## 3. Grafiğin alt-varlıkları — kendi archetype/fragment'leri

Agreement grafiği düz bir tablo değil; alt-varlıkları da atomik tiplere dayanan ayrı archetype/fragment'lerdir. Aşağıdaki tablo her alt-varlığı taşıyıcı atomlarına bağlar.

| Alt-varlık | Kritik atomik tipler | Neden önemli |
|---|---|---|
| **Party** (taraf) | `PartyRef`, `PersonName`, `Address`, `TaxId`, `NationalId`(PII), `Email`, `PhoneNumber` | Taraf kimliği + KVKK/GDPR field-level şifreleme (NationalId PII-yüksek) |
| **Clause** (madde) | `ClauseRef`, `I18nText`, `EnumType` (standart/alternatif/yasak) | Madde kütüphanesi + playbook (PDP) kontrolü; kopyalama yerine referans |
| **Payment** (ödeme) | `Money`, `DateRange`, `Duration`, `Percentage` | Vade + tutar + gecikme cezası; empty≠zero; kur karışımı reddi |
| **Signature** (imza) | `SignatureField`, `AssetRef`, `EnumType` (SES/AES/QES) | İmza alanı yerleştirme + render edilen doküman referansı |
| **Evidence** (kanıt) | `bytea-ref` (hash), `timestamp` (RFC 3161), `EnumType` | Tamper-evidence + LTV; hukuki delil değeri |
| **Attachment** (ek) | `AssetRef` | Binary k-storage'da; DB'de yalnız referans+checksum |
| **Linked** (bağlı kayıt) | `ExternalId`, `EntityRef` | CRM/ERP/HR/procurement bağı; idempotent kimlik |

---

## 4. `k-obligation` — yükümlülük archetype'ı, alan alan

Yükümlülük, ürünün asıl değer motorudur (yenileme + gelir kaçağı önleme). Alanlarının çoğu **temporal atomlara** dayanır ve bugün hepsi EKSİK. Aşağıdaki tablo alanları atomlarına eşler.

| Obligation alanı | Atomik tip | Motor türetimi | Atom durumu |
|---|---|---|---|
| `source_ref` | `EntityRef` → Agreement | yükümlülüğün kaynağı sözleşme | KISMİ |
| `kind` | `EnumType` (payment/delivery/renewal/notice/sla/penalty) | tür-bazlı politika | KISMİ |
| `title` | `I18nText` | çok-dilli görev metni | KISMİ |
| `due_at` | `timestamptz` + iş-günü | vade anı; iş-günü kaydırma | **EKSİK** (business-day) |
| `lead_time` | `Duration` | vade öncesi hatırlatma penceresi | **EKSİK** |
| `recurrence` | `Recurrence` (RRULE) | tekrarlı yükümlülük (aylık rapor, yıllık yenileme) | **EKSİK** |
| `amount` | `Money` | ödeme yükümlülüğü tutarı | KISMİ |
| `penalty_rate` | `Percentage` | gecikme/ihlal cezası | **EKSİK** |
| `responsible_party` | `PartyRef` | sorumlu taraf | **EKSİK** |
| `status` | `EnumType` (pending/upcoming/due/met/breached/waived) | yaşam döngüsü + eskalasyon | KISMİ |

---

## 5. `k-signature` — imza archetype'ı, alan alan

İmza, dokümanı hukuki bağlayıcılığa taşır ve `SignatureField` + kanıt atomlarına dayanır. Aşağıdaki tablo alanları atomlarına eşler.

| SignatureRequest alanı | Atomik tip | Motor türetimi | Atom durumu |
|---|---|---|---|
| `document_ref` | `AssetRef` (render edilmiş sözleşme) | k-storage referansı; imzalanan binary | KISMİ |
| `level` | `EnumType` (SES/AES/QES) | eIDAS seviyesi; QES sağlayıcı bağı | KISMİ |
| `format` | `EnumType` (PAdES/XAdES/CAdES) | doküman-tipi imza formatı | KISMİ |
| `signing_mode` | `EnumType` (sequential/parallel/group) | imza sırası akışı | KISMİ |
| `expires_at` | `timestamptz` + `Duration` | imza penceresi + hatırlatma | **EKSİK** (Duration) |
| `signer.order` | `integer` | sıralı imza indeksi | VAR |
| `signer.auth_method` | `EnumType` (email/sms-otp/mfa/sso/eid) | alıcı kimlik doğrulama | KISMİ |
| `signature_field` | `SignatureField` (page/x/y/w/h/kind) | alan yerleştirme (drag-drop) | **EKSİK** |
| `evidence.hash` | `bytea-ref`/`text` (SHA-256) | belge bütünlüğü; tamper-evidence | KISMİ |
| `evidence.timestamp` | `timestamp` (RFC 3161 TSA) | zaman damgası; LTV | **EKSİK** |

---

## 6. Atom zayıfsa ne kırılır — somut CLM senaryoları

Bu bölüm tezin kanıtıdır: her zayıf/eksik atom, CLM'de **belirli bir işlevi** kırar. Aşağıdaki tablo atom açığını gerçek CLM sonucuna bağlar; bu, "eksiksiz olmalı" gereksiniminin neden atom katmanından başladığını gösterir.

| Zayıf/eksik atom | CLM'de ne kırılır (somut) | Kimin parası/riski |
|---|---|---|
| `Money` düz `currency` | 60.000 EUR + 60.000 TRY toplanır; yuvarlama tutarsız → yanlış sözleşme değeri, yanlış ceza | Finans — sessiz para kaybı |
| `DateRange`/`Term` yok | Yenileme/fesih penceresi hesaplanamaz → auto-renew kaçar veya istenmeden yenilenir | Gelir kaçağı (revenue leakage — ürünün ana vaadi) |
| `Duration` yok (`integer` gün) | "60 gün ihbar" iş-günü mü takvim mi belirsiz → ihbar süresi kaçar | Hukuki — sözleşme istenmeden uzar |
| `Recurrence` (RRULE) yok | Yıllık yenileme/aylık rapor el ile → ölçekte kaçar | Operasyon — yükümlülük düşer |
| `ClauseRef`/`PartyRef` yok | Madde/taraf kopyalanır, kütüphaneye bağlanmaz → playbook (PDP policy engine) kontrol edemez | Hukuk — risk politikası çalışmaz |
| `AssetRef` düz `file` | Binary DB'ye gömülür veya URL sızar; imzalanan doküman referansı çözülmez | Güvenlik + maliyet |
| `bytea-ref`/`timestamp` yok | İmza hash'i/zaman damgası tipsiz → tamper-evidence ve LTV yok | Hukuki — audit certificate delil değeri taşımaz (eIDAS kaçar) |
| `NationalId`/`TaxId` PII-sınıfı yok | Kimlik `string`; alan-düzeyi şifreleme/maskeleme yok | KVKK/GDPR ihlali — PII sızıntısı |
| `Percentage` yok | Faiz/ceza/risk oranı `number`; 0-1 mi 0-100 mü belirsiz | Finans — yanlış ceza hesabı |
| `EnumType` alias/i18n yok | `status` düz string; dile-özel etiket ve deprecate yok | i18n — global kullanıcı yanlış etiket görür |

---

## 7. Türetim kanıtı — bir alandan (`Payment.amount : Money`) 13 boyut

Atom sözleşmesinin gücünü göstermek için tek alanı uçtan uca izleyelim. Aşağıdaki tablo, `Payment.amount` alanının `Money` atomuyla ne türettiğini, `Money` yerine düz `number` olsaydı ne olacağıyla karşılaştırır. Bu, gap raporunun 13 sözleşme boyutunu iş başında gösterir.

| Boyut | `Money` atomu ile (doğru) | Düz `number` ile (bugün) |
|---|---|---|
| storage-mapping | `numeric(p,s)` + `currency` kolonu | `float`/`numeric` — kur kaybolur |
| validation | kur ISO-4217 geçerli; precision zorlu | yok |
| parameterization | precision+scale+rounding tanımda | yok |
| null/empty/zero | empty (bilinmiyor) ≠ 0 (bedelsiz) | ayrım yok → yanlış toplama |
| compare/order | minor-units'te kesin karşılaştırma | float hatası |
| index | normalize minor-units aralık indeksi | ham sayı |
| i18n | locale-para biçimi (`1.234,56 ₺` / `€1,234.56`) | biçimsiz |
| serialization | `{amount:string, currency:string}` (OpenAPI) | tek sayı, kur yok |
| surface-projection | para-input + kur seçici widget | düz sayı input |
| security | genelde düşük; ama tutar hassas olabilir | sınıf yok |
| equality | değer+kur birlikte | yalnız sayı |
| computation | tip-güvenli çarpım; kur/boyut guard | `CurrencyMismatch` yakalanmaz |
| versioning | precision değişimi expand-contract | sessiz veri kayması |

Sonuç: **aynı alan**, atom sözleşmesi varken 13 boyutu deterministik türetir; atom zayıfken motor yalnız "bir sayı" bilir ve kalan 12 boyutu her archetype kendi içinde eksik/tutarsız uydurur. CLM'de bu, doğrudan para ve hukuki-delil hatasıdır.

---

## 8. Bağımlılık grafiği — CLM archetype'ları hangi atomlara `dependsOn`

Aşağıdaki tablo, üç CLM archetype'ının kilitlenmeden önce hangi atomların hazır olmasını gerektirdiğini toplar; bu, atomik kataloğun §9 inşa sırasını doğrudan CLM'e bağlar.

| CLM archetype | Zorunlu atomlar (kritik yol) |
|---|---|
| `archetype-agreement` | uuid, timestamptz, I18nText, EnumType, Money, DateRange, Term, Duration, Recurrence, Percentage, PartyRef, ClauseRef, AssetRef, EntityRef, ExternalId |
| `k-obligation` | Duration, Recurrence, DateRange, timestamptz(+business-day), Money, Percentage, PartyRef, EnumType, EntityRef |
| `k-signature` | AssetRef, EnumType, Duration, timestamptz, SignatureField, bytea-ref, PartyRef, integer |

Ortak kritik atomlar (üçünde de): `EnumType`, `Duration`, `timestamptz`, `PartyRef`, `EntityRef`. Bunlar **en yüksek kaldıraçlı** atomlardır — önce bunlar kilitlenirse üç CLM archetype'ı da hızla açılır. (Katalog §9 sırasıyla uyumlu: taban skaler → semantik → referans.)

---

## 9. Test-önce çıkarımı — agreement'tan önce yeşil olması gerekenler

Senin kuralın gereği (önce test, sonra şema, sonra geliştirme): agreement archetype'ı kurulmadan **önce**, dayandığı atomların test-vektörleri kırmızıdan yeşile geçmelidir. Aşağıdaki tablo CLM'i doğrudan koruyan atom testlerini verir.

| Atom testi | CLM'de koruduğu | Kabul |
|---|---|---|
| `Money` kur-karışımı reddi | sözleşme değeri/ceza toplaması | `CurrencyMismatchError` |
| `Money` empty≠zero | bedelsiz vs bilinmeyen tutar | ayrı saklanır |
| `DateRange` çakışma/kapsama | effective/renewal penceresi | doğru sorgu |
| `Recurrence` sonraki-tarih | auto-renew/hatırlatma | doğru üretim |
| `Duration` iş-günü | ihbar süresi | iş-günü kaydırma |
| `AssetRef` binary-DB yasağı | imzalanan doküman | yalnız referans+checksum |
| `NationalId` PII maske+checksum | taraf KVKK/GDPR | maskeli sunum; geçersiz reddi |

Bu testler yeşil olmadan `archetype-agreement` "hazır" sayılamaz; aksi halde motor eksik atomu türetemez ve §6'daki kırılmalar üretime sızar.

---

## 10. Tek cümlelik sonuç

CLM'in agreement-graph'ı, atomik kataloğun **en zorlayıcı probu**dur: yükümlülük, yenileme, para ve hukuki-kanıt işlevleri doğrudan bugün EKSİK olan atomlara (Money-precision, DateRange/Term/Recurrence, PartyRef/ClauseRef/AssetRef, bytea-ref/timestamp, PII-sınıflı kimlikler) dayanır — bu yüzden **önce atom katmanı test-önce kilitlenmeli**, CLM archetype fleet'i ancak o zaman sağlam kurulur.
