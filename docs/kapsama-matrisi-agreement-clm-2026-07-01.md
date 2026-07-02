# Kapsama Matrisi — Agreement OS / CLM Ürün Yetenekleri × Kernel / ArcheType / Surface Yönergeleri

Sürüm: 1.0 — 2026-07-01
Durum: AI-DRAFT (insan onayı bekler). Kapsam/gap analizi; kod yazmaz, yalnız matris + boşluk teşhisi.
Amaç: Tek soruyu cevaplamak — "CLM (Agreement OS) ürününü geliştirebilecek zemin actionplan yönergelerinde VAR mı; 12 modül + agreement graph + e-imza + AI-first + compliance yetenekleri kernel / archetype / surface YÖNERGELERİNDE doğru yerde tanımlı mı?"
Kaynaklar: `docs/reference/Agreement-CLM-Gereksinim-Analizi.md` (probe — hedef ürün; §5 12-modül, §3 agreement graph, §6 e-imza, §7 AI-first, §4/§12 compliance, §11 özellik seti), `docs/k-signature-trust-directive.md`, `docs/k-evidence-seal-directive.md`, `docs/k-obligation-commitment-directive.md`, `docs/k-provider-adapter-directive.md`, `docs/k-migration-bridge-directive.md`, `docs/k-legal-hold-retention-directive.md`, `docs/archetype-agreement-lifecycle-negotiation-directive.md`, `docs/archetype-document-composition-directive.md`, `docs/surface-esign-document-addendum.md`, `docs/surface-counterparty-portal-addendum.md`, `docs/atom-archetype-bagi-clm-ornegi-2026-07-01.md` (atom→archetype bağı), `docs/atomic-types-directive.md` + `docs/fragments-directive.md` (atom/fragment katmanı).

Okuma kuralı: her tabloda "Durum" sütunu üç değer alır — **VAR** (yeteneği üretecek yönerge zemini birinci-sınıf tanımlı: kernel primitifi + archetype + gereken yüzey/atom yönergede mevcut), **KISMİ** (yönerge onu ima eder/kapsar ama bir katmanda boşluk vardır, ya da yalnız bir bağlı yönergeye devreder, ya da atom önkoşulu henüz kilitli değildir), **EKSİK** (hiçbir yönergede birinci-sınıf tanımlı değil). Üç katman: KERNEL = `k-*` primitif sözleşmeleri (`core-contract-pack` üstünde); ARCHETYPE = `archetype-agreement` + `archetype-document-composition` ürün-archetype'ları; SURFACE = `surface-v2-directive` tip kataloğu + iki CLM eki (`surface-esign` / `surface-counterparty`). Dördüncü, dikey bir önkoşul katman: ATOM = `atomic-types-directive` + `fragments-directive` (agreement alanları atomlara dayanır → §3).

Kapsam sınırı (1 cümle): Bu doküman "sözleşme/yönerge var mı" sorusunu sorar, "kod var mı" sorusunu değil; hepsi `actionplan/` planlama katmanındadır ve gerçek implementasyon `platform/` reposunda ADR kilitleri (ADR-SIG1/E1/OBL1/PA1/M1/LHR1/AGR1/DOC1) sonrası ayrıca yazılacaktır.

---

## Bölüm 0 — Yöntem ve Konumlandırma

Probe belgesi (`Agreement-CLM-Gereksinim-Analizi.md`) hedef ürünü tanımlar: bir sözleşmeyi statik PDF + tek imzadan çıkarıp üreten, riskini okuyan, müzakere eden, imzalatan, mühürleyen, yükümlülüklerini izleyen ve **işletilebilir bir veri varlığına** çeviren bir Agreement OS / CLM. Bu doküman ise o ürünün her yeteneğini actionplan yönergelerine eşler: "her yetenek hangi primitife/archetype'a/yüzeye düşüyor ve o zemin yönergede tanımlı mı?"

Bu matrisin PIM-v2 kapsama matrisinden (`kapsama-matrisi-kernel-archetype-surface-2026-07-01.md`) farkı: orada boşluklar sistematikti (k-storage/k-worker/k-search/k-mdm gibi dört yeni primitif eksikti). Burada tam tersi bir tablo çıkar — CLM'in çekirdek yetenekleri için **yeni yönergeler zaten yazılmış** (altı yeni `k-*` primitifi + iki yeni ürün-archetype + iki yeni surface eki). Bu yüzden bu doküman "ARTIK VAR olanı göster, hâlâ KISMİ/EKSİK kalanı listele" yaklaşımını izler: sorunun cevabı büyük ölçüde olumludur, teşhis "boşluk yok" değil "önkoşul (atom katmanı) ve iki değer-fazı primitifi (k-worker/k-computation)" etrafında toplanır.

Ortak katman notu (probe §5): 12 CLM modülünün hiçbiri kendi imza motorunu, kanıt defterini, yükümlülük yaşam-döngüsünü, sağlayıcı erişimini, içe-aktarımını veya legal hold'unu yeniden yazmaz; hepsi kernel primitiflerini *tüketir*. Modül = iş yeteneği; kernel = ortak altyapı sözleşmesi. Bu matris de yetenekleri **modül** değil **kernel/archetype/surface primitifi** ekseninde ölçer.

---

## Bölüm 1 — CLM Yeteneği × 3 Katman Matrisi

Bu bölüm CLM'in ürün yeteneklerini (12 modül + agreement graph + e-imza + AI-first + compliance) üç katmana eşler. Alt-bölümler yetenek kümesine göre gruplanır. Her tablo öncesinde açıklama cümlesi vardır. Durum sütunu üç katmanın bileşimine bakar: yeteneği üretecek zemin her gereken katmanda tanımlıysa VAR; bir katmanda boşluk veya atom önkoşulu açıksa KISMİ; hiç zemin yoksa EKSİK.

### 1.1 Agreement Graph (domain modeli çekirdeği)

Aşağıdaki tablo probe §3'ün "sözleşme = işletilebilir veri grafiği" domain modelini üç katmana eşler; agreement graph tüm CLM'in temelidir (Contract kök + Party/Clause/Obligation/Risk/Date/Payment/Approval/Signature/Evidence/Attachment/Linked alt-varlıkları). Her satır bir grafik-yeteneğini taşıyan yönergeye bağlanır.

| CLM yeteneği (agreement graph) | KERNEL primitifi | ARCHETYPE yönergesi | SURFACE tipi | Durum |
|---|---|---|---|---|
| Contract kök + alt-varlık grafiği (işletilebilir veri) | `k-party` (taraf), `k-computation` (değer/risk) | `archetype-agreement §5` agreement graph + alt-varlıklar (party/clause/payment) | `detail` + `list` + `form` (grafik görünümü §8) | VAR |
| Yaşam döngüsü durum makinesi (draft→…→archived) | — (archetype sahibi) | `archetype-agreement §6/§7` `advance_status` durum makinesi + PDP playbook geçiş kapısı | `detail` (status rozeti + izinli geçiş) | VAR |
| Taraflar (müşteri/tedarikçi/iç; PII kimlik) | `k-party` (`PartyRef`, PII-sınıflı `TaxId`/`NationalId`) | `archetype-agreement §5` `agreement_party` (rol + `Address`/`PersonName`/`ContactPoint` Fragment) | `form` + `detail` | VAR |
| Maddeler (clause; standart/alternatif/yasak) | — | `archetype-agreement §5` `clause` + `archetype-document-composition §5` clause-library (content-block, `ClauseRef`, sürüm) | `document` + `form` | VAR |
| Tarihler/değer/yenileme (effective/term/notice/renewal/total_value) | `k-computation` (değer türetimi) + `k-obligation` (tarih besleme) | `archetype-agreement §5` `effective_range`/`term`/`notice_period`/`renewal_rule`/`total_value` alanları | `detail` + `form` | KISMİ (atom önkoşulu §3) |
| Risk skoru (politika-bazlı) | `k-computation` (Percentage türetimi) | `archetype-agreement §5` `risk_score` (referanslanır) | `dashboard` + `detail` | KISMİ (k-computation §1.4) |
| Bağlı kayıtlar (CRM/ERP/HR/PO idempotent kimlik) | `k-provider-adapter` (i14y, BYO) | `archetype-agreement §5/§7` `linked_crm_deal`/`linked_erp_vendor`/`linked_hr_record` (`ExternalId`/`EntityRef`) | `list` + `detail` (linked) | VAR |

### 1.2 12 Modül × 3 Katman

Aşağıdaki tablo probe §5'in 12 uygulama modülünü üç katmana eşler; her modül hangi kernel primitifine, hangi archetype'a, hangi surface tipine dayanır. "Ortak katman" ilkesi gereği çoğu modül tek bir kernel primitifi + agreement-archetype üstünde durur. Durum: modülü üretecek zemin üç katmanda tanımlıysa VAR; bir katman/önkoşul açıksa KISMİ.

| # | CLM Modülü (probe §5) | KERNEL primitifi | ARCHETYPE yönergesi | SURFACE tipi | Durum |
|---|---|---|---|---|---|
| 1 | **CLM Core** (yaşam döngüsü orkestrasyonu; graph CRUD; durum makinesi) | `k-party` + `k-policy-pdp` (geçiş yetkisi) | `archetype-agreement §6/§7` (durum makinesi + graph) | `detail` + `list` + `form` | VAR |
| 2 | **E-Signature** (provider-agnostik imza; SES/AES/QES; format; mod; e-Seal) | `k-signature` + `k-provider-adapter` + `k-evidence` | (agreement tüketir) | `signing` + `document` (surface-esign) | VAR |
| 3 | **Document Automation** (şablon + clause library + merge; koşullu blok; versiyon) | `k-storage` (render binary) + `k-policy-pdp` | `archetype-document-composition §5/§7` (template/clause/assembly_rule/rendered_document) | `document` (surface-esign) | VAR |
| 4 | **AI Contract Review** (intake: sınıflandırma/çıkarım/risk skorlama/eksik-madde) | `k-provider-adapter` `AiPort` + `k-computation` (risk) | `archetype-agreement §10` AI müzakere + `k-obligation §7` AI türetme (draft→onay) | `aiSurface.kind=assistant` + `form` | KISMİ (k-computation §1.4) |
| 5 | **Obligation Management** (birinci-sınıf durumlu taahhüt; vade + lead-time; eskalasyon; iş-günü vade) | `k-obligation` (+ `k-worker` taşıma) | (agreement besler; `feed_obligations`) | `board` + `timeline` (yükümlülük panosu §8) | KISMİ (k-worker §1.4) |
| 6 | **Renewal & Revenue Leakage** (yenileme/fesih penceresi; ihbar geri-sayımı; silent auto-renew uyarısı) | `k-obligation §7` renewal manager (+ `k-worker`) | (agreement besler) | `dashboard` + `board` (yenileme paneli §8) | KISMİ (k-worker §1.4) |
| 7 | **Counterparty Portal** (dış-taraf; görüntüle/müzakere/imza/ek yükle; ReBAC scoped) | `k-signature` (recipient auth) + `k-policy-pdp` (ReBAC scope) | (agreement müzakere workspace) | `counterparty-portal` (surface-counterparty, 6 bileşen) | VAR |
| 8 | **Legal Knowledge Base** (clause library + playbook + fallback + şablon deposu) | `k-policy-pdp` (playbook policy-as-data) | `archetype-document-composition §5` clause library + `archetype-agreement §6` fallback/stance/battlecard | `document` + `form` (clause gezgini) | VAR |
| 9 | **Agreement Analytics** (portföy metrikleri: değer/risk/yenileme takvimi/döngü süresi/yükümlülük durumu) | `k-computation` (metrik türetimi) + `k-worker` (batch) | `archetype-agreement` (graph sorgu tabanı) | `dashboard` + `report` | KISMİ (k-worker + k-computation §1.4) |
| 10 | **Integration Hub** (ERP/CRM/HR/PO bağı; push/pull; provider binding yönetimi) | `k-provider-adapter §7/§8` (config-driven binding + yönetim yüzeyi) + `k-worker` (webhook) | `archetype-agreement §7` i14y bağı (`linked_*`) | `list` + `detail` (binding mgmt) | KISMİ (k-worker webhook §1.4) |
| 11 | **Migration Bridge** (rakip/legacy'den audit-koruyan import; idempotent; dry-run; rollback; evidence preservation) | `k-migration-bridge` + `k-evidence` (kanıt koru) + `k-worker` (batch) | (agreement hedef archetype) | `wizard` (migrasyon sihirbazı §8) | KISMİ (k-worker batch §1.4) |
| 12 | **Developer Platform** (headless API + webhook + embedded imza SDK + custom archetype/surface) | tüm primitifler (API-önce; headless-first NFR) + `k-worker` (webhook) | tüm archetype'lar (custom archetype/surface) | tüm yüzeyler + embedded (surface-esign) | KISMİ (k-worker + API-önce doğrulama §1.4) |

### 1.3 E-İmza Yetenekleri (derinlik)

Aşağıdaki tablo probe §6'nın e-imza/güven-hizmeti yeteneklerini (eIDAS 3 seviye + format + zaman-damgası + LTV/LTA + e-Seal + 5070/BTK) üç katmana eşler; e-imza CLM'in hukuki-bağlayıcılık çekirdeğidir ve `k-signature` + `k-evidence` + `k-provider-adapter` üçlüsüne dayanır. Durum: seviye kapısı, format, kanıt ve yüzey her katmanda tanımlıysa VAR.

| E-imza yeteneği (probe §6) | KERNEL primitifi | ARCHETYPE / bağ | SURFACE tipi | Durum |
|---|---|---|---|---|
| eIDAS SES/AES/QES + seviye kapısı (`LevelNotSupportedError`) | `k-signature §5/§7` (`level` EnumType + seviye kapısı) | (agreement `send_to_signature`) | `signing` (auth-seviye kurgusu) | VAR |
| Çok-taraflı sıralı/paralel/grup imza + delegated/vekil | `k-signature §5/§7` (`mode`, `signer.order`, `delegated_from`) | — | `signing` (`SigningOrderPreview`) | VAR |
| İmza alanı yerleşimi (page/x/y/w/h/kind; drag-drop) | `k-signature §5` `signature_field` (`SignatureField`) | — | `signing §5` (`FieldPlacementLayer` + klavye-eşdeğeri) | VAR |
| PAdES/XAdES/CAdES format + `content_type` uyumu (`FormatMismatchError`) | `k-signature §5/§7` (`format` EnumType + format uygulaması) | — | (motor; yüzey tetikler) | VAR |
| RFC 3161 zaman-damgası + LTV/LTA (uzun-dönem doğrulama/arşiv) | `k-evidence §5/§7` (`timestamp_token`/`cert_chain`/`revocation_proof` + LTV) + `k-signature §7` | — | `timeline` (kanıt zaman-çizelgesi) | VAR |
| Kanıt kasası (tamper-evident, hash-chain, WORM) + audit_certificate | `k-evidence §5/§7` (hash-chain + WORM + `audit_certificate` PDF+verification_url) | — | `timeline` + PDF indirme (§8) | VAR |
| E-Seal (kurumsal mühür / e-fatura mührü) | `k-signature §5/§7` (`kind=seal`, `role=seal_holder`) | — | `signing` (`seal` alan-tipi) | VAR |
| Alıcı kimlik doğrulama (email/sms-otp/mfa/sso/eid) | `k-signature §5/§7` (`signer.auth`) | — | `signing` + `counterparty SignatureEntry` | VAR |
| Embedded imza + bulk-send | `k-signature §7` (embedded oturum + bulk-send) | — | `signing §5` (`EmbeddedSignFrame`) | VAR |
| Provider-agnostik imza (BYO: DocuSign/Adobe/Zoho/Dropbox/QTSP) | `k-provider-adapter §5/§7` `SignaturePort` + capability negotiation | — | (binding yönetim yüzeyi) | VAR |
| Türkiye 5070 + BTK-yetkili ESHS uyumu | `k-signature §5/§7` (`jurisdiction=tr5070` + yetkili ESHS kapısı) | (agreement `governing_law`) | — | VAR |
| KMS secret yönetimi (imza anahtarı inline değil) | `k-provider-adapter §5/§9` (`secret_ref` KMS-ref) + `k-kms` (dependsOn) | — | (secret write-only yüzey) | KISMİ (`k-kms` primitifi ayrı yönergede değil) |

### 1.4 AI-First Yetenekleri

Aşağıdaki tablo probe §7'nin AI-first yeteneklerini (intake/drafting/negotiation copilot/policy engine) üç katmana eşler; hepsi değiştirilemez invariant'a bağlıdır (AI önerir → insan onaylar → motor uygular). AI yeteneği tek bir primitife değil, ilgili primitifin §10 AI-guardrail bölümüne + `k-provider-adapter` `AiPort`'una dayanır. Durum: draft→onay zemini + AiPort + yüzey tanımlıysa VAR.

| AI-first yeteneği (probe §7) | KERNEL primitifi | ARCHETYPE yönergesi | SURFACE tipi | Durum |
|---|---|---|---|---|
| BYO AI/LLM (OpenAI/Azure/Anthropic/yerel) + AI kendi binding'ini değiştiremez | `k-provider-adapter §5/§10` `AiPort` (autonomy none: self-modifying yasak) | — | (binding yönetim yüzeyi) | VAR |
| Intake: classification/party/clause/date extraction (draft) | `AiPort` | `archetype-agreement §7/§10` (metinden alan/özet çıkarma, draft) | `aiSurface.kind=assistant` + `form` | VAR |
| Obligation extraction (metinden taahhüt çıkarma → draft → onay) | `AiPort` | `k-obligation §7/§10` (`ObligationDraft`, `origin=ai_extracted`, `approval_ref`) | `aiSurface` + `board` | VAR |
| Risk scoring + missing-clause (playbook karşılaştırma) | `AiPort` + `k-computation` (risk hesabı) | `archetype-agreement` (risk_score referansı) | `aiSurface` + `dashboard` | KISMİ (`k-computation` primitifi ayrı yönergede değil) |
| AI onay kuyruğu (draft→insan onayı→grafiğe yazım) | (AI-governance invariant; `approval_ref`) | `k-obligation §10` + `archetype-agreement §10` (onay-zorunlu) | `board` (approval queue) | VAR |
| Negotiation copilot: redline/fallback/stance/battlecard (hepsi draft) | (AI-governance) | `archetype-agreement §6/§10` (redline/fallback/stance/battlecard = draft) | `document` (müzakere workspace) | VAR |
| Policy engine: policy-as-code → PDP (madde standart/alt/yasak; onay kararı) | `k-policy-pdp` (playbook policy-as-data) | `archetype-agreement §7` (stance/kabul eşiği PDP'den; `PlaybookViolationError`) | (PDP'ye devreder) | VAR |
| AI drafting (şablon + clause + merge; madde önerisi = draft) | `AiPort` | `archetype-document-composition §7/§10` (madde/değişken/koşul draft; AI yayımlayamaz) | `document` (yapılandırılmış editör) | VAR |
| Signer-UX-assistant (karşı tarafa sade-dil özet, draft) | `AiPort` | — | `signer-journey` + `counterparty` (`PlainLanguageSummary` draft) | VAR |

### 1.5 Compliance ve NFR Yetenekleri

Aşağıdaki tablo probe §4/§12'nin compliance ve fonksiyonel-olmayan yeteneklerini (multi-tenancy/RLS, RBAC/ABAC/ReBAC, legal hold/retention, migration-first, data-residency, provider-agnostic) üç katmana eşler; bunlar tüm modülleri kesen enine yeteneklerdir. Durum: NFR'yi karşılayan zemin tanımlıysa VAR.

| Compliance / NFR yeteneği (probe §4/§12) | KERNEL primitifi | ARCHETYPE / bağ | SURFACE tipi | Durum |
|---|---|---|---|---|
| Multi-tenancy + RLS (fail-closed; `tenant_id` her tabloda) | Tüm `k-*` §9 (tenant-scoped + RLS ikinci bariyer) | Tüm archetype §9 | (yatay; her yüzey) | VAR |
| RBAC + ABAC + ReBAC (policy-as-code PDP) | `k-policy-pdp` (üç model; app-dağınık if yasak) | `archetype-agreement §7` (playbook + stance PDP'den) | `counterparty` (ReBAC scope) | VAR |
| Legal hold + retention + disposition (delete/anonymize/archive) | `k-legal-hold-retention §5/§7` (`legal_hold`/`retention_policy`/`hold_lock` + WORM) | (agreement hold/retention öznesi) | (hold/retention/disposition yüzeyi §8) | VAR |
| GDPR/KVKK erasure vs legal-hold çatışması (hold kazanır) | `k-legal-hold-retention §7` (`ErasureBlockedByHoldError`; GDPR Art.17(3)/KVKK m.7) | — | — | VAR |
| E-discovery (kilitli kayıt keşfi + custody zinciri + dışa-aktarım) | `k-legal-hold-retention §7` `export_hold` (kilitli küme + custody + PDP-sonrası) | — | (e-discovery paneli §8) | VAR |
| Migration-first (rakip/legacy'den kanıt-koruyan import) | `k-migration-bridge §5/§7` (idempotent + dry-run + rollback + evidence preservation) | (agreement hedef) | `wizard` (migrasyon sihirbazı) | KISMİ (`k-worker` batch offload §1.4) |
| Evidence preservation (import'ta imza/audit korunur, verbatim) | `k-migration-bridge §7` + `k-evidence` (append-only, kaynak-provenance) | — | (kanıt-koruma göstergesi) | VAR |
| Provider-agnostic (imza/AI/depolama/iş-akışı/OCR/bildirim/TSA BYO) | `k-provider-adapter §5/§7` (7 capability portu + fallback + circuit breaker) | — | (binding yönetim yüzeyi) | VAR |
| Data-residency (tenant/jurisdiction başına bölge) | `k-provider-adapter §9` (tenant-scoped binding) + `k-storage` (bölge-farkında) | `archetype-agreement §5` `governing_law` (jurisdiction ekseni) | — | KISMİ (`k-storage`/bölge-KMS ayrı yönergede zayıf) |
| Audit (append-only) + o11y (structlog/OTel; trace_id) | Tüm `k-*` §7 (`AuditLogger.log()` + `{code,message,trace_id,details}`) | Tüm archetype §7 | — | VAR |
| Deployment modları (SaaS/enterprise-single/self-host/lite) | `k-mode` (mode-profile; probe §9) | (mod-invariant: aynı kernel/archetype/surface) | (config) | KISMİ (`k-mode` bu paket dışında; PIM matrisinde tanımlı) |
| MFA/SSO/SAML/SCIM (kurumsal kimlik) | (auth katmanı; `k-signature §5` recipient auth `mfa`/`sso`/`eid` kısmen) | — | (MFA/SSO challenge UI) | KISMİ (SCIM/SAML ayrı yönergede değil; imza-tarafı auth VAR) |

---

## Bölüm 2 — Atom / Fragment Bağı (önkoşul katman)

Bu bölüm CLM yeteneklerinin dördüncü, dikey bağını kurar: agreement grafiğinin alanları atomik tiplere dayanır, dolayısıyla atom katmanı bir **önkoşuldur**. Probe §3.4 ve `atom-archetype-bagi-clm-ornegi §6`'nın tezi: bir ArcheType altındaki atomların sözleşmesinden daha güçlü olamaz; eksik atom `string`/`json`'a sıkışırsa ürünün asıl değeri (yükümlülük + yenileme + kanıt) sessizce çöker. Aşağıdaki tablo hangi CLM yeteneğinin hangi atoma dayandığını ve o atom zayıfsa neyin kırıldığını gösterir; "Atom durumu" `atom-archetype-bagi §2/§4/§5`'ten alınır.

| CLM yeteneği | Dayandığı atom/fragment | Taşıyıcı primitif | Atom zayıfsa CLM'de ne kırılır | Atom durumu |
|---|---|---|---|---|
| Sözleşme değeri / ceza (para) | `Money` (değer+kur+precision+rounding) | `archetype-agreement.total_value`, `k-obligation.amount`, `payment` | 60k EUR + 60k TRY toplanır; yanlış değer/ceza; sessiz para kaybı | KISMİ (düz `currency`) |
| Yenileme/fesih penceresi | `Range<date>` / `DateRange` + `Term` | `archetype-agreement.effective_range`/`term`, `k-obligation.effective` | auto-renew kaçar veya istenmeden yenilenir; gelir kaçağı (ürünün ana vaadi) | EKSİK (Term); KISMİ (DateRange) |
| İhbar süresi (iş-günü farkında) | `Duration` (+ iş-günü kaydırma) | `archetype-agreement.notice_period`, `k-obligation.lead_time`/`notice_period` | "60 gün ihbar" takvim mi iş-günü mü belirsiz; ihbar kaçar; sözleşme uzar | EKSİK |
| Tekrarlı taahhüt (yıllık yenileme/aylık rapor) | `Recurrence` (RRULE) | `archetype-agreement.renewal_rule`, `k-obligation.recurrence` | tekrarlı taahhüt el ile → ölçekte kaçar; yükümlülük düşer | EKSİK |
| Ödeme koşulu (vade+tutar+ceza oranı) | `Duration` + `Money` + `Percentage` | `archetype-agreement.payment_term`, `payment` | net-60 vade + gecikme cezası tetiklenemez | EKSİK |
| Risk skoru | `Percentage` (Computation'dan) | `archetype-agreement.risk_score` | politika-bazlı risk sorgulanamaz | EKSİK |
| Madde referansı (kütüphane bağı, sürüm) | `ClauseRef[]` | `archetype-agreement.clauses`, `archetype-document-composition.clause` | madde kopyalanır, kütüphaneye bağlanmaz; playbook (PDP) kontrol edemez; risk politikası çalışmaz | EKSİK |
| Taraf referansı (rol bağlamı) | `PartyRef[]` | `archetype-agreement.parties`, `k-obligation.responsible_party` | taraf kopyalanır, k-party'ye bağlanmaz; müzakere/imza tarafı çözülmez | EKSİK |
| Ek/imzalanan doküman referansı | `AssetRef` | `archetype-agreement.attachments`/`document`, `k-signature.document`, `rendered_document.asset` | binary DB'ye gömülür veya URL sızar; imzalanan doküman referansı çözülmez | KISMİ (düz `file`) |
| İmza kanıtı (hash + zaman-damgası) | `bytea-ref` + `timestamptz` (RFC 3161) | `k-evidence.document_hash`/`timestamp_token`, `k-signature` | imza hash'i/zaman-damgası tipsiz → tamper-evidence ve LTV yok; delil değeri taşımaz (eIDAS kaçar) | KISMİ (hash); EKSİK (RFC 3161 timestamp) |
| İmza alanı yerleşimi | `SignatureField` (page/x/y/w/h/kind) | `k-signature.signature_field`, surface `signing` | imza alanı sayfa-üstü koordinatla yerleştirilemez | EKSİK |
| PII kimlik (KVKK/GDPR field-level) | `TaxId`/`NationalId` (PII atomu) + `Address`/`PersonName`/`ContactPoint` (Fragment) | `k-party`, `archetype-agreement.agreement_party` | kimlik düz `string`; alan-düzeyi şifreleme/maskeleme yok; PII sızıntısı | EKSİK (PII atomu); Fragment U1 kararı ile tanımlı |
| Türetilmiş kimlik eşleme (CRM/ERP/HR) | `ExternalId` / `EntityRef` | `archetype-agreement.linked_*`, `k-migration-bridge.source_ref` | idempotent kimlik eşleme yok; import dup üretir; linked-record çözülmez | EKSİK (ExternalId); KISMİ (EntityRef) |
| Çok-dilli metin (madde/başlık) | `I18nText` | `archetype-agreement.title`, `clause.body`, `document_template.title` | çok-dillilik `string`'e sıkışır; hukuki terim çeviri tutarsızlığı | KISMİ |
| Tür/durum/seviye/format (lifecycle+alias) | `EnumType` (alias+i18n+ordinal) | tüm primitiflerde (contract_type/status/level/format/kind) | teknik-kimlik + dile-özel etiket ayrımı yok; dil eklemek veriyi bozar | KISMİ |

Not (atom önkoşulu): `atomic-types-directive` + `fragments-directive` yönergeleri **yazılmıştır** (Görev #13 tamamlandı) ve U1 kararı (Address/PersonName/ContactPoint = Fragment) verilmiştir; ancak `atom-archetype-bagi §2` özetine göre agreement'ın ~21 alanının **9'u EKSİK, 10'u KISMİ** atoma dayanır. Yani atom katmanının *sözleşmesi* VAR ama *şema terfisi* (FieldTypeSchema + params, Görev #16) henüz pending. Bu yüzden agreement/obligation/signature archetype'ları yönergede tam tanımlı olsa da, atom şeması kilitlenmeden "hazır" sayılamazlar — her üç archetype yönergesi bunu §11'de açıkça beyan eder ("dayandığı atomlar test-önce kilitlenmeden bu archetype hazır sayılmaz").

---

## Bölüm 3 — EKSİK / KISMİ Listesi + Kapatan Yönerge

Aşağıdaki tablo yalnız **KISMİ** ve **EKSİK** kalan boşlukları toplar ve her birini kapatacak yönergeye/önkoşula bağlar. Bölüm 1'de görüldüğü gibi CLM'in çekirdek yetenekleri (agreement graph, e-imza, kanıt, yükümlülük modeli, müzakere, doküman kompozisyon, counterparty portal, legal hold, migration, provider-agnostik) için yeni yönergeler **zaten yazılmıştır** — bu yüzden liste kısadır ve iki tema etrafında toplanır: (a) atom şema önkoşulu, (b) iki değer-katmanı primitifi (`k-worker`, `k-computation`) ve iki altyapı primitifi (`k-kms`, `k-mode`) referansı bu pakette birinci-sınıf yönerge değil.

| Boşluk | Katman | Ne eksik / neden KISMİ | Kapatan yönerge / önkoşul | Etkilediği CLM yetenekleri |
|---|---|---|---|---|
| **Atom şema terfisi** — `atomic-types-directive` sözleşmesi VAR ama `Money`/`DateRange`/`Term`/`Duration`/`Recurrence`/`Percentage`/`PartyRef`/`ClauseRef`/`AssetRef`/`ExternalId`/`SignatureField`/PII atomları FieldTypeSchema'ya terfi etmemiş | ATOM | Agreement/obligation/signature alanlarının ~%90'ı eksik atomu `string`/`json`'a sıkıştırır (bkz. §2) | `atomik-tip-katalogu-tam` → FieldTypeSchema + params + FragmentSchema (Görev #16, pending) | Agreement graph (§1.1), Obligation (§1.2 #5/#6), E-imza alanı/kanıt (§1.3) |
| **`k-worker` (task-queue / job runtime)** — hatırlatma/eskalasyon taşıma, batch import, webhook delivery, AI çıkarım taşıma, retry+backoff+DLQ+schedule; her ilgili primitif (`k-obligation`/`k-migration-bridge`/`k-provider-adapter`) buna `enqueue` eder ama motor bu pakette birinci-sınıf yönerge değil | KERNEL | Alarm/eskalasyon/webhook/batch *kararı* primitiflerde VAR, *taşıma zarfı* (retry/DLQ/schedule) `k-worker`'a devreder — bu primitif PIM matrisinde P1 açık olarak işaretli, CLM tarafında hâlâ ayrı yönerge yok | `docs/worker-taskqueue-contract.md` + WBS `k-worker` (PIM matrisi §3.1 ile ortak) | Obligation Mgmt (#5), Renewal (#6), Analytics (#9), Integration Hub (#10), Migration (#11), Developer Platform (#12) |
| **`k-computation` (deterministik para/oran/risk hesabı)** — `k-obligation` `penalty_rate`'i taşır ama tutarı hesaplamaz; `archetype-agreement` `total_value`/`risk_score`'u referanslar ama türetmez; hesap motoru `k-computation`'a devreder ama bu pakette ayrı yönerge yok | KERNEL | Ceza/faiz/risk *hesabı* tüm ilgili primitiflerde referanslanır ama motor tanımı bu pakette birinci-sınıf değil (PIM'de `platform_computation` §3.5 var; CLM tarafında ayrı `k-computation` yönergesi yok) | `docs/k-computation-contract.md` (Money/Percentage tip-güvenli hesap; kur/precision guard) | Risk scoring (#4), Agreement değer/risk (§1.1), AI risk (§1.4), Analytics (#9) |
| **`k-kms` (secret/anahtar yönetimi)** — `k-provider-adapter` `secret_ref` KMS-ref taşır ve `k-kms`'i `dependsOn` eder ama `k-kms` bu pakette ayrı yönerge değil | KERNEL | Secret inline-değil invariantı `k-provider-adapter §9`'da tanımlı ama secret'ın *saklanması/rotasyonu* `k-kms`'e devredilir; o yönerge yok | `docs/k-kms-contract.md` (envelope encryption + secret rotation + KMS-ref çözümleme) | KMS secret (§1.3), Provider-agnostic (§1.5), Data-residency KMS |
| **`k-mode` (deployment/mode-profile)** — probe §9'da dört deployment modu var; mod-invariant "aynı kernel/archetype/surface" der ama `k-mode` bu CLM paketinde değil (PIM matrisinde `platform_mode_profile` + `k-mode` tanımlı) | KERNEL | SaaS↔enterprise-single-tenant geçiş yolu tanımlı ama `k-mode` primitif yönergesi bu pakette değil | `k-mode` (PIM/plan-03 §3.3 ile ortak; `platform_mode_profile`) | Deployment modları (§1.5), SaaS↔enterprise migration |
| **MFA/SSO/SAML/SCIM (kurumsal kimlik)** — imza-tarafı recipient auth (`mfa`/`sso`/`eid`) `k-signature §5`'te VAR; ama kurumsal IdP/SCIM provisioning için ayrı yönerge yok | KERNEL | Compliance NFR'de zorunlu (probe §4); imza akışı auth VAR ama IAM/SCIM/SAML katmanı ayrı yönergede tanımlı değil | `sso.json`/`mfa.json` (PIM 00-index standartları; CLM için ayrı IAM yönergesi opsiyonel) | MFA/SSO/SAML/SCIM (§1.5) |
| **Risk scoring hesap bağı** — `AiPort` risk *önerir* (draft) ama sayısal risk skoru `k-computation`'a dayanır | KERNEL/AI | AI risk skorlama zemini VAR (draft→onay) ama deterministik skor hesabı `k-computation` eksikliğine bağlı (yukarıdaki satır) | (yukarıdaki `k-computation` ile birleşik) | AI Contract Review (#4), risk scoring |

Not (KISMİ'lerin doğası): Bu tablodaki hiçbir satır "CLM çekirdeği eksik" demez. Altı yeni `k-*` + iki archetype + iki surface eki CLM'in imza/kanıt/yükümlülük/müzakere/doküman/portal/legal-hold/migration/provider yeteneklerini birinci-sınıf tanımlar. KISMİ'ler iki türdendir: (1) **önkoşul** — atom şeması henüz terfi etmemiş (ama yönergesi yazılmış); (2) **devredilen değer-katmanı** — `k-worker`/`k-computation`/`k-kms`/`k-mode` primitifleri CLM primitifleri tarafından `dependsOn`/`related` ile tüketilir ama bu CLM paketinde ayrı yönerge olarak yazılmamış (PIM matrisinde veya standart katmanında zemin var). Bunlar "boşluk" değil "bu paketin kapsam-sınırı"dır: CLM paketi imza/kanıt/yükümlülük/müzakere/doküman/portal/hold/migration/provider'ı yazdı; taşıma/hesap/kms/mode kernel-altyapısı ayrı yazılır.

---

## Bölüm 4 — Özet Sayım

Aşağıdaki tablo Bölüm 1'deki beş alt-matrisin durum dağılımını verir. Toplam: 7 agreement-graph yeteneği + 12 modül + 12 e-imza yeteneği + 9 AI yeteneği + 12 compliance/NFR = 52 CLM yeteneği; ayrı olarak §2'de 15 atom bağı.

| Matris | VAR | KISMİ | EKSİK | Toplam |
|---|---|---|---|---|
| §1.1 Agreement graph | 5 | 2 | 0 | 7 |
| §1.2 12 Modül | 5 | 7 | 0 | 12 |
| §1.3 E-imza yetenekleri | 11 | 1 | 0 | 12 |
| §1.4 AI-first yetenekleri | 8 | 1 | 0 | 9 |
| §1.5 Compliance / NFR | 8 | 4 | 0 | 12 |
| **CLM yetenekleri toplam** | **37** | **15** | **0** | **52** |

Ayrıca §2 atom bağı: 15 atom-dayanağının atom-katmanı durumu — 5 KISMİ, 8 EKSİK, 2 tanımlı (Fragment U1 + karışık) — yani agreement alanlarının çoğu atom önkoşuluna bağlıdır (şema terfisi Görev #16 pending).

Yorum: **CLM yeteneklerinde 0 EKSİK** (yönerge katmanında) — sorunun cevabı "evet, CLM'i geliştirebilecek zemin VAR". 15 KISMİ'nin dağılımı: 4'ü atom önkoşuluna (§3 satır 1), 6'sı `k-worker`'a (taşıma zarfı), 2'si `k-computation`'a (hesap), 1'i `k-kms`'e, 1'i `k-mode`'a, 1'i MFA/SSO/SCIM'e bağlıdır. Yani KISMİ'ler CLM'e özgü değil, dört ortak kernel-altyapı primitifine (worker/computation/kms/mode) ve atom şema terfisine indirgenir.

---

## Bölüm 5 — Teşhis (tek cümle)

CLM (Agreement OS) ürününü geliştirebilecek zemin actionplan yönergelerinde **VAR ve büyük ölçüde tam** — imza (`k-signature`), kanıt (`k-evidence`), yükümlülük/yenileme (`k-obligation`), sağlayıcı-agnostik erişim (`k-provider-adapter`), audit-koruyan migrasyon (`k-migration-bridge`), legal hold/retention (`k-legal-hold-retention`), sözleşme grafiği + müzakere (`archetype-agreement`), doküman kompozisyon (`archetype-document-composition`) ve e-imza + counterparty yüzeyleri (`surface-esign` + `surface-counterparty`) birinci-sınıf yazılmış (12 modül + graph + e-imza + AI-first + compliance yeteneklerinde **0 EKSİK**); geriye kalan 15 KISMİ, CLM'e özgü bir boşluk değil, ortak kernel-altyapının (`k-worker` taşıma, `k-computation` hesap, `k-kms` secret, `k-mode` deployment) bu pakette birinci-sınıf yazılmaması ve **atom şema terfisinin (FieldTypeSchema + params) henüz kilitlenmemesi** — yani zemin hazır, önkoşul (atom katmanı) ve dört devredilen altyapı primitifi tamamlanınca CLM uçtan-uca kurulabilir.
