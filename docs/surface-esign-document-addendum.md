# Surface v2 Eki — document + signing + signer-journey (e-imza & doküman yüzeyi) Deseni

Sürüm: 1.0 — 2026-07-01 · Durum: `surface-v2-directive.md`'yi genişleten normatif ek; çelişen tanımı geçersiz kılmaz, üç eksik yüzey tipini ekler.
Kaynak: `docs/surface-v2-directive.md` (§3 non-goal: doküman/print + e-posta-HTML; §14 açık soru), `docs/surface-spec.md`, `docs/surface-tree-metadataform-addendum.md` (biçim), `src/schemas/surface.ts`, `docs/k-signature-trust-directive.md` (§`signature_field`/`SignatureField`/§10 AI-sınırı), `docs/k-storage-dam-directive.md`, `docs/k-evidence-seal-directive.md`, `docs/reference/Agreement-CLM-Gereksinim-Analizi.md` (§5 Modül 2 E-Signature; §6 eIDAS seviyeleri; §10 `surface-esign`). Bu doküman *sözleşme/mimari tarif* verir — ürün kodu `platform` reposunda yazılır. Yüzey **çizmez** (ASCII/wireframe yok); her yüzeyi bileşen + hiyerarşi + prop + state + davranış + stil-token olarak **tanımlar**. Stack: Vite + React + TanStack Router/Query/Table + RHF/Zod; SCSS + token; Phosphor (`ph-*`). **Next.js, Supabase, Prisma, Redux, Flowbite, antd/MUI/Chakra/Mantine, react-markdown yasaktır.**

---

## 1. Amaç

Surface v2 yönergesi doküman/print ve e-posta-HTML yüzeylerini bilinçli olarak birinci-sınıf tip yapmadı (`surface-v2-directive §3` non-goal; `§14` DoD'da "doküman/print + e-posta-HTML yüzey konumu" açık soru olarak işaretli). Oysa CLM domain'i imzalanacak bir *doküman* üretir (`archetype-document-composition`), o dokümana imza/paraf/tarih *alanları yerleştirir* (`k-signature.signature_field`) ve imzacıya bir *imza yolculuğu* sunar (embedded imza; `Agreement-CLM §5 Modül 2 E-Signature`, `§10 surface-esign` = "imza akışı kurgu + alan yerleşim editörü + embedded imza deneyimi"). Bu üç iş, mevcut 24 tipin hiçbirine tam oturmaz: `detail`/`report` dokümanı gösterir ama imza-alanı yerleştiremez; `form` alan doldurur ama sayfa-üstü koordinat-yerleşimi + imza sırası taşımaz. Amaç: bu üç yüzeyi (`document`, `signing`, `signer-journey`) `SurfaceTypeSchema`'ya ekleyerek CLM E-Signature UI'ını sözleşmeye bağlamak — davranış sözleşmesi, a11y, i18n/RTL, PDP-kapısı, AI-guardrail ve WBS yerleşimiyle.

## 2. Kapsam

Üç yeni yüzey tipi (`document`, `signing`, `signer-journey`) + bir paylaşılan atom (`SignatureField` alan-aracı) + bir signer-UX-assistant deseni (AI sade-dil özet, draft). Aktör açıklığı: *geliştirici* yüzey tipini + parametrelerini beyan eder; *sistem/SDUI* dokümanı `archetype-document-composition` çıktısından render eder; *AI* alan yerleşimini ve signer-özetini yalnız *taslak* önerir (uygulamaz); *insan* (doküman sahibi/imzalayan) imzaya-gönderme, sıra, QES-seviye ve nihai konumu onaylar; *motor* (`k-signature`) onaylı akışı deterministik yürütür; *CI* a11y/i18n/PDP kapılarını ölçüp bloklar. Render-varsayılanı: `document`/`signer-journey` → `renderStrategy: projected` (şema/doküman-projeksiyonu yeterli); `signing` → `renderStrategy: custom` (koordinat-yerleşim editörü + embedded sağlayıcı oturumu jenerik projeksiyona sığmaz), **yönetişim (izin/audit/i18n/a11y) korunarak**. CLM karşılığı: `Agreement-CLM` Modül 2 (E-Signature) + Özellik 8/10/11 (SES/AES/QES, çok-taraflı, embedded+bulk-send) → `signing`; Özellik 6 (doküman kompozisyonu) render'ı → `document`; Counterparty imza-yolculuğu önizlemesi → `signer-journey`.

## 3. Non-goals

Yeni bir `renderStrategy`, `i18n`, `perf` veya `aiSurface` bloğu **eklemez** — mevcut `SurfaceContractSchema` alanlarını tüketir. İmza *motorunu* tanımlamaz: SES/AES/QES seviye kapısı, PAdES/XAdES/CAdES format, RFC 3161 zaman-damgası, sağlayıcı seçimi `k-signature` + `k-provider-adapter` tarafındadır; yüzey yalnız akışı *kurar* ve *tetikler*, imzayı kendi atmaz. Kanıt (`evidence_record`, hash-chain, LTV) *üretimini* tanımlamaz; o `k-evidence` portudur, yüzey yalnız kanıt-durumunu görselleştirir/bağlar. Doküman *derlemesini* (şablon + clause + merge + versiyonlama) tanımlamaz; o `archetype-document-composition`'dadır, yüzey derlenmiş çıktıyı render eder. Binary'yi kendi tutmaz; doküman/imzalı-çıktı `k-storage`'da `AssetRef` ile yaşar. PDP *politikasını* yazmaz; imzaya-sokma/talep-görme izni `k-policy-pdp`'nindir, yüzey kararı yalnız *tüketir*. Print-CSS/yazdırma ve e-posta-HTML şablon yüzeyini bu ekte açmaz (ayrı takip; `surface-v2 §14` açık sorusunun yalnız doküman-render+imza kısmını kapatır).

## 4. document surface

**Nedir?** `archetype-document-composition` çıktısı derlenmiş sözleşme/dokümanın çok-sayfa render + önizleme yüzeyi; imza öncesi "ne imzalanacak" görünümü. **Ne yapar?** Doküman asset'ini (`k-storage` `AssetRef`; PDF/HTML) sayfalı, yakınlaştırılabilir, aranabilir gösterir; sayfa gezinir, madde/clause çapasına derin-link verir, imzalı-çıktı ile fark (redline) gösterebilir. **Ne yapmaz?** Dokümanı *derlemez* (şablon+merge `archetype-document-composition`); imza *alanı yerleştirmez* (o `signing`); binary'yi *tutmaz* (referanslar).

Aşağıdaki tablo `document` yüzeyinin bileşen/prop/state/davranış eksenlerini tanımlar.

| Eksen | Sözleşme (bileşen / prop / state / davranış) |
|---|---|
| Bileşen | `DocumentSurface` — TanStack Query ile `AssetRef` çözer; sanallaştırılmış sayfa-penceresi (yalnız görünür sayfalar render); alt bileşenler: `DocumentToolbar` (zoom/sayfa/ara/indir), `DocumentPageList` (sayfa şeridi), `DocumentPage` (tek sayfa raster/vektör), `ClauseAnchorNav` (madde çapası), `RedlineOverlay` (opsiyonel fark katmanı) |
| Prop | `assetRef` (`k-storage` doküman referansı), `archetypeRef` (`archetype-document-composition` kaynağı), `renderMode` (`pdf`/`html`), `zoom` (init ölçek), `anchorsRef` (madde/clause çapaları), `compareRef` (opsiyonel imzalı-çıktı; redline), `readOnly:bool` |
| State | `currentPage`, `zoomLevel`, `searchQuery`+`searchHits[]`, `loadedPages[]` (lazy raster), `renderError`, `compareMode:bool` |
| Etkileşim | sayfa gezin (klik/klavye); zoom (buton + `Ctrl`/`Cmd`+wheel eşdeğeri klavye kısayolu); metin-arama → eşleşmeye kaydır+vurgula; madde çapasına derin-link (rota `#clause-id`); redline aç/kapa; indir (yalnız PDP izniyle) |
| renderStrategy | `projected` (varsayılan) — doküman-viewer projeksiyonu yeterli; marka-özel/yüksek-hacim (500+ sayfa, özel anotasyon) `custom`, yönetişim korunarak |
| a11y (WCAG 2.2 AA) | viewer `role="document"`; sayfa gezinim klavyeyle tam (`PageUp`/`PageDown`/`Home`/`End`); PDF metin-katmanı seçilebilir + ekran-okuyucuya açık (yalnız raster değil); zoom 400%'e kadar içerik-kaybı yok (WCAG 1.4.4/1.4.10 reflow); arama-vurgusu renk + kontur (yalnız renkle değil); odak sayfa-değişiminde görünür-kalır |
| i18n / RTL | araç-çubuğu etiketi/tooltip `messagesRef` tek-kaynak; `rtl:auto` → araç-çubuğu + sayfa-şeridi + zoom-oku yön-çevrilir; doküman *içeriği* dil yönünü kendi taşır (RTL doküman render'ı bozulmaz); sayfa-no/oran locale-biçimli |
| state (empty/loading/error) | `empty`: "doküman henüz derlenmedi/boş" afordansı (derleme `archetype-document-composition`'a yönlendirir); `loading`: sayfa-iskeleti (skeleton) + ilk sayfa öncelikli, CLS yok; `error`: "doküman yüklenemedi + yeniden-dene" (`onRetry`, renk-bağımsız metin), asset-404 ile render-hatası ayrışır |

## 5. signing surface

**Nedir?** İmza akışını *kuran* yüzey: doküman önizlemesi üstüne imza/paraf/tarih/onay-kutusu/ek alanlarını **sürükle-bırak** yerleştiren editör + imza sırası/mod kurgusu + embedded imza oturumu + test-imza. **Ne yapar?** `SignatureField` atomunu (sayfa + normalize x/y/w/h + tür) yerleştirir; imzacıları + sıra (sequential/parallel/group) + kimlik-doğrulama seviyesini kurar; embedded imza oturumunu (`k-provider-adapter` token) iframe/API ile gömer; AI'ın önerdiği alan-yerleşimini (draft) insana onaylatır. **Ne yapmaz?** İmzayı *atmaz* (motor `k-signature`, sağlayıcı `k-provider-adapter`); seviye/format *kapısını* uygulamaz (`k-signature`); kanıt *yazmaz* (`k-evidence`); PDP kararını *vermez* (`k-policy-pdp` — imzaya-sokma izni oradan).

Aşağıdaki tablo `signing` yüzeyinin bileşen/prop/state/davranış eksenlerini tanımlar.

| Eksen | Sözleşme (bileşen / prop / state / davranış) |
|---|---|
| Bileşen | `SigningSurface` (`renderStrategy: custom`) — üzerinde `DocumentSurface`'i taban-katman kullanır; alt bileşenler: `FieldPalette` (yerleştirilebilir alan-tipleri paleti), `FieldPlacementLayer` (sayfa-üstü drop hedefi + yerleşmiş alanlar), `SignatureField` (tek yerleşmiş alan atomu), `SignerPanel` (imzacı + sıra + mod + auth-seviye), `SigningOrderPreview` (sıra akış-şeması), `EmbeddedSignFrame` (gömülü sağlayıcı oturumu), `TestSigningBar` (sahte-imza denemesi) |
| Prop | `requestRef` (`k-signature` `signature_request`), `documentAssetRef` (`k-storage`), `signers[]` (`{partyRef, order, mode, authLevel}`), `fieldSchema` (yerleştirilebilir alan-tipleri), `mode` (`build`/`embedded`/`test`), `providerBindingRef` (`k-provider-adapter` embedded token kaynağı), `pdpDecisionRef` (imzaya-sokma izni) |
| Alan-tipi (SignatureField) | `signature`→imza alanı · `initial`→paraf · `date`→tarih (imza-anı auto-doldurur) · `checkbox`→onay-kutusu (kabul beyanı) · `attachment`→ek-yükleme alanı (imzacı belge ekler) — her tip `SignatureField(page, x, y, w, h, kind)` bileşiğine oturur; alan-tipi→bileşen eşlemesi config-driven (`fieldSchema`; `if kind==='x'` koda-gömülü dallanma **yasak**); kernel atomu `field_kind` (`signature/initial/date/seal/text`) üstüne yüzey `checkbox`/`attachment` alan-aracını ekler, `seal` (e-Mühür) tüzel-imza akışında sunulur |
| State | `placedFields[]` (`{id, signerId, page, x, y, w, h, kind}`), `selectedFieldId`, `dragState` (kaynak-palet/hedef-sayfa/geçerli-mi), `activeSignerId`, `orderMode` (`sequential`/`parallel`/`group`), `aiSuggestedFields[]` (draft; onaylanmadıkça bağlayıcı değil), `embeddedSession` (token/durum), `testResult` |
| Etkileşim | palet→sayfa sürükle-bırak yerleştir; alan seç→taşı/boyutlandır/sil/imzacıya-ata; **AI alan-yerleşimi öner** (draft rozetiyle) → insan tek-tek/toplu onaylar-veya-düzeltir → onaylı alan `signature_field.placement`'a yazılır; imza-sırası kur → `SigningOrderPreview` akışı gösterir; **embedded imza** (`EmbeddedSignFrame` iframe/API; sağlayıcı-oturumu token'ı `k-provider-adapter`'dan); **test-imza** (`mode='test'` sahte imzacı, kanıt/asset yazmaz — yalnız akış doğrulama); imzaya-gönder (yalnız PDP izni + insan onayı) |
| AI-guardrail | AI alan-yerleşimini *önerir/otomatik-tespit eder* (`SignatureFieldDraft`; imza-satırı/isim-alanı sezimi) → **insan onaylar**, AI doğrudan yazamaz; `aiSurface.humanApproval: true` + `aiSurface.pdpGated: true` **zorunlu**; AI QES-seviye/imzaya-gönderme *seçemez* (yalnız draft/preview; `k-signature §10` sınırı); insan onayı olmadan hiçbir alan/sıra bağlayıcı değil |
| renderStrategy | `custom` (varsayılan) — koordinat-yerleşim + embedded sağlayıcı-oturumu jenerik projeksiyona sığmaz; **yönetişim korunur** (aynı `permissions` + audit + `i18n` + `a11y`; `custom`, denetimden muaf değil) |
| a11y (WCAG 2.2 AA) | sürükle-bırak alan-yerleşimine **klavye eşdeğeri zorunlu** (WCAG 2.5.7): palet→"alan ekle" komutu + ok-tuşuyla konum-nudge + `Enter` yerleştir + boyut klavyeyle ayarlanır; yerleşmiş alan `role="group"` + `aria-label` (tür + imzacı + sayfa/konum metinle: "İmza alanı, İmzacı 2, Sayfa 3"); embedded iframe `title` + odak-yönetimi + iframe'e/den klavye-geçişi; alan-tipi ikon **+ metin etiket** (yalnız renk/şekil değil); odak sürükle-sonrası görünür-kalır |
| i18n / RTL | palet/panel/komut etiketi `messagesRef` tek-kaynak; `rtl:auto` → palet + panel + sıra-akış yön-çevrilir; **alan koordinatı doküman-uzayında kalır** (RTL UI alanın sayfa-üstü x/y'sini çevirmez — imza fiziksel konumdur); tarih-alanı biçimi CLDR-locale; imzacı-adı/ünvan `messagesRef` değil, `k-party` verisinden |
| state (empty/loading/error) | `empty`: "henüz alan yerleştirilmedi" + ilk-alan afordansı (veya AI-öneri çağrısı); `loading`: doküman+alan-şeması gelene dek iskelet, embedded oturum açılırken spinner, CLS yok; `error`: doküman/oturum çekilemezse "yüklenemedi + yeniden-dene"; sağlayıcı-oturumu hatası (`k-provider-adapter` down) metinsel + yeniden-dene; imzaya-gönder reddi (PDP/seviye) alan-üstü metinsel |

## 6. signer-journey surface

**Nedir?** İmzacının (çoğu kez karşı taraf/dış kullanıcı) göreceği imza-yolculuğunun **önizlemesi**: hoş-geldin → doküman-oku → alanları-doldur → imzala → tamamlandı akışının doküman-sahibine gösterilen simülasyonu; ayrıca signer'a sunulan sade-dil özet (AI draft). **Ne yapar?** İmza sırasındaki her adımı imzacı gözünden önizler; imzacının göreceği alan-sırası + zorunlu-alanları + auth-adımını gösterir; signer-UX-assistant sade-dil özetini (doküman ne diyor; draft, otoriter değil) render eder. **Ne yapmaz?** Gerçek imzayı *tetiklemez* (önizleme; gerçek akış `signing` embedded); AI özetini *otorite* kılmaz (yalnız yardımcı taslak — hukuki metin bağlayıcı olan); PDP-kapısını *atlamaz* (imzacı yalnız yetkili olduğu talebi önizler).

Aşağıdaki tablo `signer-journey` yüzeyinin bileşen/prop/state/davranış eksenlerini tanımlar.

| Eksen | Sözleşme (bileşen / prop / state / davranış) |
|---|---|
| Bileşen | `SignerJourneySurface` — adım-adım imzacı-akışı önizler; alt bileşenler: `JourneyStepper` (hoş-geldin/oku/doldur/imzala/bitti adımları), `SignerDocumentView` (imzacı-görünümü doküman; `DocumentSurface` taban), `SignerFieldChecklist` (imzacının doldurması gereken zorunlu alanlar), `PlainLanguageSummary` (AI sade-dil özet, draft rozetli), `AuthStepPreview` (SES/AES/QES kimlik-doğrulama adımı önizleme), `CompletionPanel` (tamamlandı + kanıt/indir bağı) |
| Prop | `requestRef` (`k-signature` `signature_request`), `signerRef` (`signer`; kimin gözünden), `documentAssetRef`, `summaryRef` (AI özet kaynağı; draft), `authLevel` (`ses`/`aes`/`qes`), `previewOnly:bool` (varsayılan `true`), `pdpDecisionRef` |
| State | `currentStep`, `completedSteps[]`, `requiredFieldsRemaining[]`, `summaryExpanded:bool`, `summaryDraftAck:bool` (kullanıcı "bu bir taslak özet" bildirimini gördü), `authStepPreview` |
| Etkileşim | adım gezin (ileri/geri; klavye); doküman oku (`DocumentSurface`); zorunlu-alan checklist'ini takip et; sade-dil özeti aç/kapa (her zaman "AI taslağı, bağlayıcı değil; asıl metin sözleşme" ibaresiyle); auth-adımı önizle (gerçek kimlik-doğrulama `signing` embedded'de); tamamlanınca kanıt/indir bağı (yalnız PDP izniyle) |
| AI-guardrail | `PlainLanguageSummary` AI üretimi **draft**'tır; her görünümde "sade-dil özet — taslak, hukuki bağlayıcılığı yok; bağlayıcı olan sözleşme metnidir" ibaresi zorunlu-görünür; özet imza kararını *yönlendirmez*, yalnız *okumayı kolaylaştırır*; `aiSurface.humanApproval: true` + `aiSurface.pdpGated: true` **zorunlu**; AI imzacı adına hiçbir alanı doldurmaz/imzalamaz |
| renderStrategy | `projected` (varsayılan) — adım-akış + doküman + özet projeksiyonu yeterli; marka-özel counterparty-deneyimi gerekirse `custom` (yönetişim korunarak; `surface-counterparty` ile hizalı) |
| a11y (WCAG 2.2 AA) | `JourneyStepper` `aria-current="step"` + adım-durumu metinle (yalnız renk değil); doküman-görünümü §4 a11y'yi devralır; sade-dil özet `role="note"` + "taslak" ibaresi ekran-okuyucuya açık; checklist liste-semantiği + klavye-erişilebilir; adım-geçişinde odak yeni-adım başına taşınır; kimlik-doğrulama önizlemesi zaman-sınırı dayatmaz (WCAG 2.2.1 — gerçek OTP süresi `signing`'de, önizlemede değil) |
| i18n / RTL | adım/checklist/ibare `messagesRef` tek-kaynak; `rtl:auto` → stepper + checklist + doküman-UI yön-çevrilir; AI özet imzacının locale'inde üretilir (draft; `messagesRef` değil, üretim çıktısı — ama "taslak" ibaresi `messagesRef`); tarih/imza-anı locale-biçimli |
| state (empty/loading/error) | `empty`: "bu talepte imzacı adımı yok/tamamlanmış" afordansı; `loading`: adım+doküman+özet gelene dek iskelet, özet-üretimi indeterminate (özet gelmeden akış bloklanmaz), CLS yok; `error`: talep/doküman çekilemezse "yüklenemedi + yeniden-dene"; özet-üretimi başarısızsa akış yine ilerler (özet opsiyonel-degrade), metinsel not |

## 7. SignatureField alan-aracı + signer-UX-assistant deseni

**Nedir?** Bir tip değil, `signing` (ve önizleme olarak `signer-journey`) yüzeylerine gömülü iki paylaşılan öğe: (a) `SignatureField` alan-aracı — doküman sayfası üstüne normalize-koordinatla yerleştirilen imza/paraf/tarih/onay/ek alanı atomu; (b) signer-UX-assistant — imzacıya sunulan AI sade-dil özet (draft). **Ne yapar?** (a) `k-signature.signature_field.placement` (`SignatureField(page, x, y, w, h, kind)`) değerini UI'da düzenlenebilir/klavye-gezilebilir kılar; (b) doküman metnini imzacıya sade özetler (taslak). **Ne yapmaz?** (a) koordinat-anlamını *değiştirmez* (normalize x/y/w/h doküman-uzayı; UI-RTL bunu çevirmez); (b) özeti *otorite* kılmaz (bağlayıcı olan sözleşme metni; AI yalnız draft).

Aşağıdaki tablo `SignatureField` alan-aracı + signer-UX-assistant deseninin eksenlerini tanımlar.

| Eksen | Sözleşme (bileşen / prop / state / token) |
|---|---|
| Bileşen | `SignatureField` (tek yerleşmiş alan) + `FieldPalette` (yerleştirilebilir tipler) + `PlainLanguageSummary` (AI özet, draft) |
| Prop | `placement` (`{page, x, y, w, h, kind}`; normalize/oran), `signerRef`, `required:bool`, `kind` (`signature`/`initial`/`date`/`checkbox`/`attachment`/`seal`), `draft:bool` (AI önerisi mi; onaylanmadıkça bağlayıcı değil), `summaryRef` (özet; draft) |
| Stil / token | alan-tipi **ikon (`ph-*`) + metin etiket + kenar-şekli** ile (renk-körü-güvenli; yalnız renkle ayrılmaz); `field-border`/`field-fill`/`field-radius`/`field-selected-ring`/`drag-ghost-opacity`/`grid-snap`/`motion` token'ları; draft-alan farkı **kesikli-kenar + "AI taslağı" rozet** (yalnız renk değil); spacing: alan iç-dolgu `space-2`, palet öğe-aralığı `space-3`; imzacı-renk-kodu **+ imzacı-no etiketi** (renk-körü) |
| Koordinat kuralı | `placement` **normalize** (0..1 oran; sayfa-boyutundan bağımsız); UI-RTL alan x/y'sini **çevirmez** (imza fiziksel konumdur, akış-yönü değil); grid-snap opsiyonel; taşma-koruma (alan sayfa-sınırında kalır) |
| a11y (WCAG 2.2 AA) | alan `role="group"` + `aria-label` (tür+imzacı+konum metinle); sürükle-bırağa **klavye eşdeğeri** (ekle/nudge/boyut/ata/sil komutları; WCAG 2.5.7); draft-alan durumu metinle ("AI önerisi — onay bekliyor"); özet `role="note"` + "taslak, bağlayıcı değil" ekran-okuyucuya açık |
| i18n / RTL | alan-tipi etiketi + komut `messagesRef`; `rtl:auto` → palet/panel hizası çevrilir, **alan koordinatı çevrilmez**; tarih-alanı biçimi CLDR; AI özet locale'de (draft çıktı), "taslak" ibaresi `messagesRef` |
| state (empty/loading/error) | `empty`: "alan yok" + ekle/AI-öner afordansı; `loading`: alan-şeması/özet gelene dek iskelet, özet indeterminate (akış bloklanmaz), CLS yok; `error`: "yerleşim/özet alınamadı + yeniden-dene", özet-hatası akışı bozmaz (opsiyonel-degrade), metinsel |

## 8. WBS / surface yerleşimi

Üç tip Surface primitif ailesine girer; `document`/`signer-journey` `renderStrategy: projected`, `signing` `renderStrategy: custom` (yönetişim-korumalı). WBS düğümleri surface primitif ailesi altında doğar; CLM E-Signature domain düğümü `surface-esign` (level `archetype`; `Agreement-CLM §10` = "imza akışı kurgu + alan yerleşim editörü + embedded imza deneyimi") bunları taşır ve `linkedSurfaces`/`dependsOn` ile `k-signature` + `k-storage` + `archetype-document-composition`'a bağlar. Yeni düğümler: `k-surface-document`, `k-surface-signing`, `k-surface-signer-journey` (seviye `archetype`, `parentId: k-surface`, `dependsOn: k-surface`); `signing` ek olarak `dependsOn: k-signature` + `related: k-provider-adapter` (embedded), `k-evidence` (kanıt-durumu görselleştirme); `document` `dependsOn: k-storage` + `related: archetype-document-composition`. `SignatureField` alan-aracı + signer-UX-assistant ayrı düğüm değil, `k-surface-signing`'in alt-yeteneği (`refines`). `SurfaceTypeSchema` enum'ı `document` + `signing` + `signer-journey` ile genişler (mevcut 24 tip → 27); `layout` enum'ına `document` (sayfa-akışı) eklenir; mevcut tipler ve alanlar geriye-dönük korunur.

## 9. Test

Aşağıdaki testler `check-surface` CI kapısında zorunludur; bir yüzey bunları geçmeden merge edilemez.

| # | Test | Ne doğrular |
|---|---|---|
| 1 | Tip-şema uyumu | `document` + `signing` + `signer-journey` `SurfaceTypeSchema`'ya uyar; `layout` += `document`; katalog validasyonu yeşil (27 tip) |
| 2 | Custom yönetişim-korunumu | `signing` (`renderStrategy: custom`) `permissions` + `a11y` + `i18n` + audit alanlarını yine de zorunlu tutar |
| 3 | Alan-yerleşim klavye-eşdeğeri | sürükle-bırak alan-yerleşimine klavye-eşdeğeri (ekle/nudge/boyut/ata/sil) çalışır; alan `role="group"` + konum metinle (axe + Playwright; WCAG 2.5.7) |
| 4 | AI alan-önerisi draft→onay | AI önerdiği alanlar `draft`; insan onaylamadan `signature_field.placement`'a yazılmaz; AI QES/send seçemez |
| 5 | Alan-tipi config-driven | `signature/initial/date/checkbox/attachment` alan-tipi→bileşen eşlemesi `fieldSchema`-driven; koda-gömülü `if kind` yok |
| 6 | Embedded imza + test-imza | embedded oturum (`k-provider-adapter` token) iframe/API ile açılır, `title`+odak-yönetimi var; `mode='test'` sahte-imza kanıt/asset yazmaz |
| 7 | signer-UX-assistant draft | AI sade-dil özet her görünümde "taslak, bağlayıcı değil" ibaresiyle; özet-hatası akışı bloklamaz (opsiyonel-degrade); `role="note"` |
| 8 | AI-surface PDP kapısı | üç yüzeyde de `aiSurface` tanımlıysa `pdpGated: true` olmadan validasyondan geçmez; imzaya-sokma PDP kararına bağlı |
| 9 | Koordinat RTL-değişmez | `rtl:auto` palet/panel/stepper yön-çevirir ama `SignatureField` koordinatı (x/y) doküman-uzayında kalır; pseudo-loc taşmayı yakalar |
| 10 | State davranışı | üç yüzeyde de empty/loading/error beyanlı; CLS yok; doküman lazy-sayfa iskeleti + özet indeterminate çalışır |
| 11 | Doküman a11y | `document` viewer `role="document"`; PDF metin-katmanı seçilebilir + ekran-okuyucuya açık; zoom 400% reflow içerik-kaybı yok |

## 10. Acceptance criteria

(1) `SurfaceTypeSchema` `document` + `signing` + `signer-journey` ile 27 tipe genişledi, `layout` enum'ına `document` eklendi; (2) üç yüzey `renderStrategy` varsayılanıyla (`document`/`signer-journey`: `projected`; `signing`: `custom`), `a11y.wcag: 2.2-AA` tabanıyla tanımlı; (3) §9'daki 11 test yeşil; (4) `signing` alan-yerleşimine klavye-eşdeğeri (WCAG 2.5.7) + alan `role="group"` + normalize-koordinat sağlıyor; (5) alan-tipi (`signature/initial/date/checkbox/attachment`) → bileşen eşlemesi config-driven (`fieldSchema`; `if kind` yasak); (6) AI alan-yerleşimi + signer-özet **draft**, insan onaylar, AI QES/send/otorite değil (`aiSurface.humanApproval` + `pdpGated: true`); (7) embedded imza (`k-provider-adapter`) iframe/API + test-imza (asset/kanıt yazmaz) tanımlı; (8) `signing` `custom` yönetişim (izin/audit/i18n/a11y) koruyor; (9) mevcut 24 tip + alanlar geriye-dönük bozulmadı; (10) `Agreement-CLM` Modül 2 (E-Signature) + Özellik 6/8/10/11 karşılığı izlenebilir; `surface-v2 §14` doküman+imza açık sorusu kapatıldı.

## 11. Anti-patterns

Sürükle-bırak alan-yerleşimini yalnız fare ile sunmak (klavye-eşdeğeri zorunlu; WCAG 2.5.7). Alan-tipi→bileşen eşlemesini `if kind === 'signature'` ile koda gömmek (`fieldSchema`-driven olmalı). `SignatureField` koordinatını UI-RTL ile çevirmek (imza fiziksel konum; normalize x/y doküman-uzayı, akış-yönü değil). AI önerdiği alanı insan onayı olmadan `signature_field.placement`'a yazmak (draft→onay zorunlu). AI'a QES-seviye/imzaya-gönderme seçtirmek veya AI-özeti otorite göstermek ("bu özet bağlayıcı" — hayır, sözleşme metni bağlayıcı). `signing`'i `custom` yaptığı için yönetişimden (izin/audit/i18n/a11y) kaçmak. Dokümanı yüzeyde *derlemek* (`archetype-document-composition` tek-kaynak) veya binary'yi tabloya gömmek (`k-storage` `AssetRef`). Kanıtı yüzeyde üretmek/imzayı yüzeyde atmak (`k-evidence`/`k-signature` tek-kaynak). PDF'i yalnız raster gösterip metin-katmanını atlamak (ekran-okuyucu çöker). Embedded iframe'i `title`/odak-yönetimi olmadan gömmek. AI sade-dil özetini "taslak, bağlayıcı değil" ibaresiz sunmak (imzacı yanılır). Doküman/özet gelmeden akışı bloklamak (özet opsiyonel-degrade; CLS'siz iskelet).

## 12. DoD (Definition of Done)

`SurfaceTypeSchema` 27 tipe + `layout` `document`'e genişledi; üç tip + bir alan-aracı/assistant deseni sözleşmesi bu ekle tanımlı; §9'daki 11 test yeşil; `check-surface` kapısı yeni tipleri + alan-yerleşim-klavye-eşdeğerini + config-driven alan-eşlemeyi + AI-draft-onay kapısını + AI-PDP kapısını + doküman-a11y'yi zorluyor; `signing` klavye-eşdeğeri + `role="group"` + normalize-koordinat, `document` `role="document"` + PDF-metin-katmanı + reflow, `signer-journey` "taslak" ibareli AI özet + `aria-current` stepper kanıtlı; AI alan-yerleşimi + signer-özet draft→insan-onay (test-4/7 ile kanıtlı); embedded imza + test-imza (asset/kanıt-yazmaz) çalışıyor; WBS düğümleri (`k-surface-document`, `k-surface-signing`, `k-surface-signer-journey`) `k-surface` altında açıldı, `surface-esign` `linkedSurfaces`/`dependsOn` ile `k-signature` + `k-storage` + `archetype-document-composition`'a bağlandı; mevcut 24 tip geriye-dönük bozulmadı; `Agreement-CLM` Modül 2 + Özellik 6/8/10/11 + `surface-v2 §14` (doküman+imza) izlenebilir.

## 13. Requirement-ID tablosu

Aşağıdaki tablo bu ekin gereksinimlerini izlenebilir kılar; her satır `check-surface` kapısına ve §9 testlerine bağlanır.

| ID | Requirement | Layer | Priority | TestType | AcceptanceCriteria | CLM | Owner |
|---|---|---|---|---|---|---|---|
| SRFES-01 | `SurfaceTypeSchema` += `document`,`signing`,`signer-journey` (27 tip); `layout` += `document` | schema | P0 | unit (Zod) | Katalog validasyonu 27 tip için yeşil | Modül 2 | Ajan PR → İnsan |
| SRFES-02 | `document`: `AssetRef` çok-sayfa render + zoom + arama + madde-çapası | surface | P0 | integration | Test-11 yeşil; PDF metin-katmanı açık | Öz. 6 | Ajan PR → İnsan |
| SRFES-03 | `document` a11y (`role=document` + metin-katmanı + 400% reflow) | a11y | P0 | axe + Playwright | Test-11 yeşil; reflow içerik-kaybı yok | Öz. 6 | Ajan PR → İnsan |
| SRFES-04 | `signing`: doküman-üstü sürükle-bırak alan-yerleşim editörü (`SignatureField`) | surface | P0 | integration | Test-3 yeşil; normalize-koordinat yazılır | Öz. 8/10 | Ajan PR → İnsan |
| SRFES-05 | Alan-yerleşim klavye-eşdeğeri + alan `role=group` + konum-metin | a11y | P0 | axe + Playwright | Test-3 yeşil; WCAG 2.5.7 eşdeğeri var | Öz. 8 | Ajan PR → İnsan |
| SRFES-06 | Alan-tipi→bileşen config-driven (`signature/initial/date/checkbox/attachment`; `if kind` yasak) | surface | P0 | unit | Test-5 yeşil; koda-gömülü dallanma yok | Öz. 8 | Ajan PR → İnsan |
| SRFES-07 | İmza sırası önizleme (sequential/parallel/group) + `SigningOrderPreview` | surface | P1 | integration | Sıra akış-şeması beyanlı; mod-farkı görünür | Öz. 10 | Ajan PR → İnsan |
| SRFES-08 | Embedded imza (`k-provider-adapter` token; iframe/API) + `title`/odak | surface | P1 | integration | Test-6 yeşil; embedded oturum a11y açık | Öz. 11 | Ajan PR → İnsan |
| SRFES-09 | Test-imza (`mode=test`; sahte imzacı, asset/kanıt yazmaz) | surface | P1 | integration | Test-6 yeşil; test akışı yan-etkisiz | Öz. 11 | Ajan PR → İnsan |
| SRFES-10 | AI alan-yerleşimi öner (draft) → insan onaylar; AI QES/send seçemez | ai-guardrail | P0 | integration | Test-4 yeşil; draft onaysız yazılmaz | Modül 2 | İnsan (canon) |
| SRFES-11 | `signer-journey`: adım-akış önizleme + signer-UX-assistant (AI özet draft) | surface | P1 | integration | Test-7 yeşil; "taslak" ibaresi zorunlu | Modül 7 | Ajan PR → İnsan |
| SRFES-12 | AI sade-dil özet draft + "bağlayıcı değil" ibaresi + opsiyonel-degrade | ai-guardrail | P0 | integration | Test-7 yeşil; özet-hatası akışı bloklamaz | Modül 7 | İnsan (canon) |
| SRFES-13 | AI-surface PDP kapısı (`aiSurface.pdpGated: true` zorunlu) | ai-guardrail | P0 | integration | Test-8 yeşil; pdpGated:false geçmiyor | Modül 2 | Ajan PR → İnsan |
| SRFES-14 | `signing` `custom` yönetişim (izin/audit/i18n/a11y) korur | governance | P0 | integration | Test-2 yeşil; custom alanları atlamıyor | Modül 2 | Ajan PR → İnsan |
| SRFES-15 | i18n/RTL: UI yön-çevirir ama `SignatureField` koordinatı değişmez | i18n | P1 | pseudo-loc | Test-9 yeşil; koordinat doküman-uzayında | Öz. 8 | Ajan PR → İnsan |
| SRFES-16 | State (empty/loading/error) üç yüzeyde beyanlı; CLS yok; özet-degrade | ux | P1 | integration | Test-10 yeşil; lazy-sayfa iskeleti çalışır | Öz. 6/8 | Ajan PR → İnsan |
| SRFES-17 | WBS: `k-surface-document/signing/signer-journey` `k-surface` altında; `surface-esign` bağlı | wbs | P1 | review | Düğümler açık; `linkedSurfaces`/`dependsOn` mevcut | Modül 2 | Ajan PR → İnsan |

---

*Bağlı dokümanlar: `docs/surface-v2-directive.md` (genişletilen yönerge; §3 non-goal + §14 açık soru) · `docs/surface-tree-metadataform-addendum.md` (izlenen biçim) · `docs/surface-spec.md` (kanonik spec) · `docs/k-signature-trust-directive.md` (`signature_field`/`SignatureField`/§10 AI-sınırı) · `docs/k-storage-dam-directive.md` (doküman `AssetRef`) · `docs/k-evidence-seal-directive.md` (kanıt) · `docs/reference/Agreement-CLM-Gereksinim-Analizi.md` (§5 Modül 2 E-Signature; §6 eIDAS; §10 `surface-esign`/`surface-counterparty`) · `docs/ci-conformance-gates.md` (`check-surface` kapısı). Bağlı düğümler: `k-surface`, `surface-esign`, `surface-counterparty`, `k-surface-document`, `k-surface-signing`, `k-surface-signer-journey`, `k-signature`, `k-storage`, `k-evidence`, `k-provider-adapter`, `k-policy-pdp`, `archetype-document-composition`. Şema hedefi: `src/schemas/surface.ts` (`SurfaceTypeSchema` += 3 tip, `layout` += `document`).*
