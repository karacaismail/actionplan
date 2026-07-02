# Surface v2 Eki — counterparty-portal Deseni (Karşı Taraf / Dış-Taraf Portalı)

Sürüm: 1.0 — 2026-07-01 · Durum: `surface-v2-directive.md`'yi genişleten normatif ek; çelişen tanımı geçersiz kılmaz, bir eksik tip ailesini (dış-taraf portalı) ve onun bileşen sözleşmelerini ekler.
Kaynak: `docs/surface-v2-directive.md` (§4 taksonomi, §5 renderStrategy, §7 AI-guardrail, §8 WCAG, §9 i18n/RTL, §10 state), `docs/surface-tree-metadataform-addendum.md` (ek biçimi), `docs/surface-spec.md`, `src/schemas/surface.ts`, `docs/reference/Agreement-CLM-Gereksinim-Analizi.md` (Modül 7 Counterparty Portal + Faz 6), `docs/reference/PIM-v2-Gereksinim-Analizi.md` (#40 marka-portalı deseni), `docs/k-signature-trust-directive.md` (§5/§7 alıcı kimlik-doğrulama), `docs/adr-P1-pdp.md` (PDP kapısı), `docs/actor-party-contract.md` (dış `PartyRef`), `docs/capability-entitlement-contract.md` (dış entitlement). Bu doküman *sözleşme/mimari tarif* verir — ürün kodu `platform` reposunda yazılır. Yüzey **çizmez** (ASCII/wireframe yok); her bileşeni prop + state + davranış + stil parametresi + token olarak **tanımlar**. Stack: Vite + React + TanStack Router/Query/Table + RHF/Zod, SCSS + tasarım-token, Phosphor ikon; **Next.js, Supabase, Prisma, Redux, Flowbite, antd, MUI, Chakra, Mantine, react-markdown yasaktır**.

---

## 1. Amaç

Surface v2 kataloğu (22 tip) Admin-Surface (iç operasyon), Consumer-Surface (anonim/geniş kitle) ve Shop-Surface (fabrika sahası) ailelerini taşır; ama **davetli-tek-karşı-taraf** (invited counterparty) desenini birinci-sınıf olarak adlandırmaz. Bu, ne anonim tüketici ne iç operatördür: sözleşmenin *karşı tarafıdır* — tenant-dışı ama belirli bir agreement'a (veya birkaçına) davet edilmiş, kimliği bilinen, kapsamı katı biçimde sınırlı bir aktör. CLM Modül 7 (`Counterparty Portal`, Faz 6) bu tarafın belgeyi gördüğü, yorumladığı, ek belge yüklediği ve imzaladığı güvenli portalı gerektirir; PIM-v2'nin #40 marka-portalı (dış markanın kendi ürün verisini yönettiği kapsamlı-kısıtlı yüzey) aynı deseni farklı domainde uygular. Amaç: bu deseni — `counterparty-portal` tip ailesi + altı bileşen sözleşmesi (portal shell, document viewer, comment thread, upload, signature entry, status tracker) — davranış sözleşmesi, PDP-kapısı, dış-kimlik-doğrulama, a11y, i18n/RTL, state ve WBS yerleşimiyle sabitlemektir. Bir cümlede: **karşı taraf kapsamlı iş yapar (görür, yorumlar, yükler, imzalar) ama iç veri sızıntısı sıfırdır.**

## 2. Kapsam

Bu ek şunu kapsar: (a) `counterparty-portal` bir dış-taraf yüzey ailesi olarak (varsayılan `renderStrategy: custom` — dış-tema, minimal shell, gömülü imza jenerik projeksiyona tam sığmaz; yönetişim korunarak), (b) altı bileşen sözleşmesi (`CounterpartyPortalShell`, `DocumentViewer`, `CommentThread`, `EvidenceUpload`, `SignatureEntry`, `StatusTracker`) — her biri prop + state + davranış + spacing/color-token + responsive + a11y, (c) dış erişim modeli: magic-link / davetli erişim (`k-signature` recipient auth ile hizalı), PDP-gated limited-scope, iç-veri-sızıntısı-yok invariantı, (d) AI-guardrail: karşı tarafa yalnız minimal AI özet (draft), otonom eylem yok. *Aktör açıklığı:* iç sözleşme sahibi (hukuk/satış/procurement) karşı tarafı davet eder ve kapsamı tanımlar; sistem magic-link/oturum kurar, PDP dış aktörün her isteğini kapsam-simülasyonundan geçirir; karşı taraf yalnız kendisine verilen belgede/aksiyonlarda çalışır; AI karşı tarafa yardımcı taslak-özet sunar (uygulamaz); CI kapsam-sızıntısını + a11y'yi + i18n'i bloklar.

## 3. Non-goals

Bu ek şunları **kapsamaz**: (1) İç işbirliği yüzeyi — Teams/Slack-benzeri iç ekip sohbeti, iç yorum-mention, iç panoya erişim `conversation`/`board` gibi Admin/Consumer tiplerinde kalır; counterparty portal iç kanala açılmaz. (2) Tam uygulama erişimi — karşı taraf tenant'ın uygulamasına (liste/detail/dashboard/ayarlar) giremez; portal yalnız davet edildiği agreement'ın izin-verilen kesitini gösterir. (3) Kimlik/oturum kurma mantığı — magic-link üretimi, token TTL, recipient auth yöntemi (email/sms-otp/mfa/sso/eid) `k-signature` (§5 `signer.auth`, §7) ve IAM/AuthN katmanında yaşar; portal bu oturumu *tüketir*, kendisi kurmaz. (4) Erişim/kapsam kararının kendisi — bir dış aktörün bir belgeyi görüp göremeyeceği/imzalayıp imzalayamayacağı kararı PDP'nindir (`k-policy-pdp`); portal `permissions[]` ile *danışır*, kararı yüzeyde taklit etmez (görsel-gizleme yetki-gizleme değildir). (5) İmza motoru — SES/AES/QES seviye, PAdES/XAdES/CAdES, RFC 3161, kanıt yazımı `k-signature` + `k-evidence` işidir; `SignatureEntry` yalnız imza-atma deneyimini (embedded oturum) sunar, imzayı kendisi üretmez. (6) Yüklenen belgenin binary saklanması — `k-storage`'a `AssetRef` olarak yazılır; portal referansı taşır, binary'yi gömmez. (7) Yeni bir `i18n`/`perf`/`aiSurface` bloğu — mevcut `SurfaceContractSchema` alanları tüketilir.

## 4. counterparty-portal surface ailesi

**Nedir?** Tenant-dışı ama davetli-ve-kimliği-bilinen bir karşı tarafın, belirli bir agreement'ın izin-verilen kesitine PDP-kapılı, kapsamı-sınırlı eriştiği dış-taraf yüzey ailesidir; anonim tüketici (`storefront-plp`/`pdp`) ile iç operatör (`detail`/`board`) arasındaki üçüncü aktör sınıfıdır. **Ne yapar?** Karşı tarafa yalnız davet edildiği belge(ler)i ve aksiyonları gösterir (görüntüle → yorumla → ek belge yükle → imzala → durumu izle); her istek dış-kimlik oturumu (magic-link / recipient auth) ve PDP kapsam-simülasyonundan geçer; dış-tema minimal shell içinde çalışır; iç veriyi (diğer tenant kayıtları, iç yorumlar, portföy metrikleri, diğer karşı taraflar, iç kullanıcı kimlikleri) **hiçbir koşulda** göstermez. **Ne yapmaz?** İç uygulamaya/iç kanala erişmez; kapsamı genişletemez (davet-dışı belge/aksiyon `PDP-deny`); imza/kanıt üretmez (`k-signature`/`k-evidence`'a devreder); oturumu kendisi kurmaz (IAM/`k-signature` recipient auth'u tüketir); AI'a otonom eylem yaptırmaz (yalnız draft özet).

Aşağıdaki tablo `counterparty-portal` ailesinin aile-düzeyi sözleşmesini (tip, render, kapsam-kapısı, kimlik, sızıntı-koruması) tanımlar; alt bileşenler §5'te ayrı ayrı sözleşmelenir.

| Eksen | Sözleşme (aile-düzeyi) |
|---|---|
| Tip / aile | `counterparty-portal` — dış-taraf (invited counterparty) yüzey ailesi; `CounterpartyPortalShell` kök, altında beş bileşen (viewer/comment/upload/signature/status) |
| renderStrategy | `custom` (varsayılan) — dış-tema minimal shell, gömülü imza deneyimi, kapsam-katı veri projeksiyonu jenerik SDUI'a tam sığmaz; **yönetişim korunur** (aynı `permissions`/audit/`i18n`/`a11y`) — custom, denetimden muaf değildir |
| Kapsam kapısı (PDP) | Her veri/aksiyon `permissions[]` ile PDP'ye danışır; dış aktörün her isteği kapsam-simülasyonundan geçer; davet-dışı kaynak/aksiyon `PDP-deny` (yüzeyde görünmez + backend reddeder); ReBAC ("bu agreement'ın karşı tarafı") ilişkisi izni belirler |
| Dış kimlik (auth) | Magic-link / davetli erişim; recipient auth `k-signature §5 signer.auth` ile hizalı (`email`/`sms_otp`/`mfa`/`sso`/`eid`); portal oturumu *tüketir*, kurmaz; token TTL + tek-kullanım IAM/`k-signature`'da; süre dolumu → "bağlantı süresi doldu, yeniden-davet iste" (yeni token insan/iç-akış onayı) |
| Sızıntı koruması (invariant) | İç veri sızıntısı **yok**: yanıt yalnız davet-kapsamındaki alanları taşır; iç yorum/iç kullanıcı-kimliği/diğer-karşı-taraf/portföy-metriği/diğer-tenant kaydı asla serileştirilmez; alan-düzeyi kapsam backend'de enforce (yüzeyde gizleme *değil*); dış PII (karşı-taraf `PartyRef`) tenant-scoped |
| Dış-tema (c12n) | `techProfileRef` + dış-tema token seti; tenant beyaz-listeli marka-token'ı (logo/renk) uygular ama AA kontrast korunur; iç navigasyon/iç-menü render edilmez (yalnız portal-kapsamı) |
| a11y (WCAG 2.2 AA) | Aile tabanı `a11y.wcag: 2.2-AA`; karşı taraf bilinmeyen bağlamda (kendi cihazı/AT'si) → klavye-tam, ekran-okuyucu-dolaşılabilir, renk-bağımsız durum; `wcagAspirational` raporlanır |
| i18n / RTL | `i18n.locales` karşı-taraf-locale'ini içerir (farklı olabilir); `defaultLocale` davet-locale'inden türetilir; `rtl: auto` (karşı taraf ar-EG/he-IL olabilir → tüm shell yön-çevrilir); etiket/durum `messagesRef` tek-kaynak (portalda çeviri tekrar yazılmaz) |
| aiSurface (guardrail) | Opsiyonel `aiSurface.kind: assistant` (yalnız özet); `pdpGated: true` **zorunlu**; `humanApproval: true`; karşı tarafa yalnız belge/madde AI-özeti (draft) — otonom eylem (imza/yorum-gönderme/onay) **yok** |
| state (empty/loading/error) | `empty`: davet-kapsamı boş → "görüntülenecek belge yok / iç taraf hazırlıyor"; `loading`: belge/durum iskeleti, CLS yok; `error`: "yüklenemedi + yeniden-dene" (`onRetry`, renk-bağımsız); `expired`: oturum-süresi → yeniden-davet afordansı |

## 5. Bileşen sözleşmeleri (ÇİZME, TANIMLA)

Bu bölüm altı portal bileşenini *çizmeden* prop + state + davranış + spacing/color-token + responsive + a11y ekseninde tanımlar. Her bileşen `CounterpartyPortalShell` içinde çalışır; hiçbiri iç kanala/iç veriye açılmaz; hepsi PDP-kapsamı içinde davranır. Bileşenler config-driven'dır: `if module === 'x'` gibi koda-gömülü dallanma yasak, davranış kontrattan okunur.

### 5.1 CounterpartyPortalShell (portal shell)

**Nedir?** Dış-taraf oturumunun kök kabuğu; minimal dış-tema iskeleti (üst-bar + kapsam-göstergesi + içerik alanı), oturum/kapsam bağlamını alt bileşenlere sağlar. **Ne yapar?** Recipient auth oturumunu doğrular (tüketir), davet-kapsamını yükler, alt bileşenleri kapsam-props'uyla besler, dış-temayı uygular, oturum-süresi/çıkış davranışını yönetir. **Ne yapmaz?** İç navigasyon/iç-menü/iç-arama render etmez; oturumu kurmaz; kapsamı genişletmez.

Aşağıdaki tablo shell bileşeninin sözleşmesini tanımlar.

| Eksen | Sözleşme |
|---|---|
| Prop | `sessionRef` (recipient auth oturumu; salt-tüket), `invitationScopeRef` (davet edilen agreement kesiti + izin seti), `partyRef` (dış `PartyRef`; karşı taraf kimliği), `themeRef` (dış-tema token seti), `localeRef` (davet-locale) |
| State | `sessionState` (`valid`/`expired`/`revoked`), `scopeState` (`loading`/`ready`/`empty`), `activePane` (viewer/comment/upload/signature/status) |
| Davranış | Oturum doğrula → kapsam yükle → paneli monte et; oturum `expired`/`revoked` → içerik yerine yeniden-davet/çıkış afordansı; kapsam-dışı derin-link → `PDP-deny` + kapsam köküne yönlendir; çıkışta oturum bağlamı temizlenir |
| Spacing / token | `portal-shell-pad` (dış-tema iç boşluk), `portal-topbar-h`, `portal-content-gap`; iç yoğunluk token'ı **kullanılmaz** (dış-tema ayrı skala) |
| Color token | `portal-bg`/`portal-surface`/`portal-accent` (marka beyaz-listeli); AA kontrast korunur; iç tema-token sızdırılmaz |
| Responsive | Tek-kolon mobil-öncelikli (karşı taraf telefonda açabilir); ≥`bp-md` içerik + yan-durum iki-kolon; üst-bar yapışkan; 320px+ |
| a11y | `role` landmark iskeleti (`banner`/`main`); tek mantıksal tab-sırası; skip-link; oturum-uyarısı `aria-live`; odak panel değişiminde yönetilir |

### 5.2 DocumentViewer (document viewer)

**Nedir?** Karşı tarafa davet edilen belgenin (sözleşme PDF'i / madde metni) salt-görüntüleme yüzeyi. **Ne yapar?** `k-storage`'daki `AssetRef`'i (kapsam-içi) sayfalı/kaydırmalı gösterir, madde/bölüm çıpasına derin-link verir, yorum/imza alanı çıpalarını işaretler, zoom/sayfa-gezinim sağlar. **Ne yapmaz?** İç sürüm-geçmişini/iç redline-yazarını/iç risk-skorunu göstermez (kapsam-dışı); belgeyi düzenlemez (salt-okuma); kapsam-dışı belgeyi çözmez.

Aşağıdaki tablo viewer bileşeninin sözleşmesini tanımlar.

| Eksen | Sözleşme |
|---|---|
| Prop | `documentRef` (kapsam-içi `AssetRef`), `pageAnchors[]` (madde/bölüm çıpası), `annotationRefs[]` (yorum/imza-alanı işaretleri; yalnız karşı tarafa görünür kesit), `readOnly:true` (sabit) |
| State | `currentPage`, `zoom`, `activeAnchor`, `loadState` (`loading`/`ready`/`error`) |
| Davranış | Sayfa/kaydırma gezinim; çıpaya git (yorum/imza alanına derin-link); işaret tıklaması → ilgili yorum-thread veya imza-alanı; kapsam-dışı sayfa/asset istenmez |
| Spacing / token | `viewer-page-gap`, `viewer-toolbar-h`, `viewer-anchor-inset`; işaret rozetleri renk **+ şekil/etiket** (renk-körü-güvenli) |
| Color token | `viewer-canvas-bg`/`viewer-anchor`/`viewer-anchor-active`; imza-alanı işareti yalnız renkle ayrılmaz |
| Responsive | Mobilde tek-sayfa + pinch-zoom eşdeğeri (buton zoom klavye/dokunma); geniş ekranda yan çıpa-listesi; toolbar sıkışınca taşma-menüsü |
| a11y | Belge metnine ekran-okuyucu erişimi (görsel-PDF için metin eşdeğeri/etiket); zoom/sayfa klavyeyle; çıpa listesi `role="list"` + klavye-erişilebilir; salt-görsel işaret metinle de bildirilir |

### 5.3 CommentThread (comment thread)

**Nedir?** Karşı tarafın belge/madde üzerine yorum bıraktığı ve iç tarafın *dış-görünür* yanıtını gördüğü konu-başlıklı (threaded) yorum yüzeyi. **Ne yapar?** Kapsam-içi thread'leri listeler, karşı tarafın yeni yorumunu optimistic-gönderir (başarısızlıkta rollback), madde-çıpasına bağlar, okundu/çözüldü durumunu gösterir. **Ne yapmaz?** İç-yalnız yorumları/iç-mention'ları/iç-yazar-kimliğini göstermez (yalnız dış-görünür kesit); iç kullanıcıyı @-mention edemez; kapsam-dışı thread'e yazamaz.

Aşağıdaki tablo comment-thread bileşeninin sözleşmesini tanımlar.

| Eksen | Sözleşme |
|---|---|
| Prop | `threadRefs[]` (kapsam-içi + dış-görünür thread'ler), `anchorRef` (bağlı madde/bölüm), `authorParty` (dış `PartyRef`; gönderen karşı taraf), `visibilityScope:external` (sabit; yalnız dış-görünür) |
| State | `composerValue`, `sendState` (`idle`/`optimistic`/`error`), `threadFilter` (açık/çözüldü), `unreadIds[]` |
| Davranış | Yeni yorum optimistic ekranda → backend onayı → kalıcı; başarısızsa rollback + yeniden-dene; madde-çıpasına bağla; çözüldü işareti (iç taraf çözer, karşı taraf görür); iç-yazar adı yerine rol/kurum etiketi (iç kimlik sızmaz) |
| Spacing / token | `thread-item-gap`, `thread-indent` (yanıt girintisi), `composer-pad`; RTL'de girinti yön-çevrilir |
| Color token | `thread-own`/`thread-other`/`thread-resolved`; durum yalnız renkle değil etiketle (renk-körü-güvenli) |
| Responsive | Mobilde tam-genişlik thread + yapışkan composer; geniş ekranda belge yanında panel; uzun thread sanallaştırılır |
| a11y | Thread `role="list"`; yeni yorum `aria-live="polite"`; composer `<label>` bağlı + hata `aria-describedby`; klavyeyle gönder; çözüldü durumu metinsel |

### 5.4 EvidenceUpload (upload)

**Nedir?** Karşı tarafın ek belge (karşı-imza kanıtı, ekli sözleşme, destekleyici doküman) yüklediği güvenli yükleme yüzeyi. **Ne yapar?** Dosya seçer/sürükler, tür/boyut doğrular, `k-storage`'a `AssetRef` olarak yükler (kapsam-içi), yükleme ilerlemesini/hatasını gösterir, yüklenen eki agreement'ın izin-verilen ek-slotuna bağlar. **Ne yapmaz?** Binary'yi tabloya gömmez (`k-storage` referansı); iç ek-deposuna/kapsam-dışı slota yazmaz; yüklenen dosyayı sunucu-taraflı tarama olmadan "güvenli" saymaz (backend doğrular).

Aşağıdaki tablo upload bileşeninin sözleşmesini tanımlar.

| Eksen | Sözleşme |
|---|---|
| Prop | `uploadSlotRef` (kapsam-içi ek-slot; nereye yazılacağı PDP-izinli), `accept[]` (izin-verilen tür), `maxSize`, `partyRef` (yükleyen dış taraf) |
| State | `files[]` (kuyruk), `uploadState` (`idle`/`uploading`/`done`/`error`), `progressById`, `validationErrors[]` |
| Davranış | Seç/sürükle → istemci tür/boyut ön-doğrulama → `k-storage`'a yükle (`AssetRef`) → slota bağla; başarısızsa yeniden-dene; kapsam-dışı slot istenmez; yükleme sonrası viewer/status'a yansır; sunucu-taraflı tarama/doğrulama zorunlu (istemci güveni yetmez) |
| Spacing / token | `upload-zone-pad`, `upload-item-gap`, `progress-h`; sürükle-alanı odak-görünür |
| Color token | `upload-zone`/`upload-zone-active`/`upload-error`; hata renk **+ metin** |
| Responsive | Mobilde dosya-seç butonu (sürükle yerine); geniş ekranda sürükle-alanı; kuyruk listesi tek-kolon |
| a11y | Sürükle-alanına **klavye/buton eşdeğeri** zorunlu (WCAG 2.5.7 pointer-alternatifi); `<input type=file>` etiketli; ilerleme `role="progressbar"` + metin; hata `aria-describedby` |

### 5.5 SignatureEntry (signature entry)

**Nedir?** Karşı tarafın kendisine atanan imza/paraf/tarih alanını doldurduğu ve imzayı attığı imza-atma yüzeyi (`k-signature` embedded oturumunun portal kesiti). **Ne yapar?** Karşı tarafın recipient-auth adımını (email/sms-otp/mfa/sso/eid) netçe gösterir, imza-alanına götürür, gömülü imza oturumunu (`k-signature` embedded) açar, imza-sonucu/durumu yansıtır. **Ne yapmaz?** İmzayı kendisi üretmez (`k-signature` orkestre eder); QES seviyesini/imza sırasını seçmez (iç taraf + `k-signature` kararı); kanıt yazmaz (`k-evidence`); karşı taraf yerine AI imza atamaz.

Aşağıdaki tablo signature-entry bileşeninin sözleşmesini tanımlar.

| Eksen | Sözleşme |
|---|---|
| Prop | `signatureRequestRef` (`k-signature` talebi; kapsam-içi), `signerRef` (bu karşı tarafın `signer` kaydı; sıra/auth/alan), `authMethod` (`email`/`sms_otp`/`mfa`/`sso`/`eid`; `k-signature §5`), `fieldPlacements[]` (bu imzacıya ait alanlar) |
| State | `authState` (`pending`/`verified`/`failed`), `signState` (`awaiting`/`in_session`/`signed`/`declined`), `activeField` |
| Davranış | Auth adımını göster/doğrula (başarısız → imza reddi + audit); imza-alanına götür; embedded `k-signature` oturumu aç; imza/paraf/tarih doldur → gönder → `signed`; `declined` gerekçesi kaydedilir; QES'te nitelikli-araç/eid akışı ayrıştırılır; imzayı daima **gerçek karşı taraf (insan)** atar |
| Spacing / token | `sig-field-inset`, `sig-step-gap`, `auth-step-pad`; imza-alanı odak-görünür |
| Color token | `sig-field`/`sig-field-active`/`sig-signed`/`sig-declined`; durum yalnız renkle değil metin+ikonla |
| Responsive | Mobilde tam-ekran imza adımı (parmakla imza eşdeğeri + klavye/yazılı ad); geniş ekranda belge yanında imza paneli; auth adımı tek-kolon |
| a11y | Auth adımı ve imza-alanı klavyeyle erişilebilir; her adım `<label>`/`aria-label`; imza-durumu `aria-live`; QES/eid akışı ekran-okuyucuyla izlenebilir; imza-alanı yalnız renkle işaretlenmez |

### 5.6 StatusTracker (status tracker)

**Nedir?** Karşı tarafa sözleşme sürecinin *dış-görünür* durumunu (nerede, sırada kim, ne bekleniyor) gösteren adım/durum izleyici. **Ne yapar?** Yaşam döngüsünün karşı-tarafa-açık adımlarını (görüntülendi → yorumlandı → imza-bekliyor → imzalandı → tamamlandı) gösterir, karşı tarafın sıradaki eylemini vurgular, tarih/vade (ihbar/imza son-tarihi) bilgisini locale-biçimli sunar. **Ne yapmaz?** İç iş-akışı adımlarını/iç onay-zincirini/iç risk-durumunu göstermez (yalnız dış-görünür kesit); iç aktör kimliklerini ifşa etmez (rol/kurum etiketi).

Aşağıdaki tablo status-tracker bileşeninin sözleşmesini tanımlar.

| Eksen | Sözleşme |
|---|---|
| Prop | `lifecycleRef` (dış-görünür durum kesiti), `steps[]` (karşı-tarafa-açık adımlar), `nextActionRef` (karşı tarafın sıradaki eylemi), `deadlineRef` (imza/ihbar son-tarihi; opsiyonel) |
| State | `currentStep`, `pendingAction` (var/yok), `refreshState` (`fresh`/`stale`/`error`) |
| Davranış | Adım ilerleyişini göster; sıradaki eylem karşı tarafta ise vurgula + ilgili panele derin-link (imza/yorum/upload); iç-yalnız adımlar gösterilmez; durum güncellemesi (iç taraf ilerletince) yansır; iç aktör adı yerine rol etiketi |
| Spacing / token | `tracker-step-gap`, `tracker-connector-w`, `deadline-pad`; RTL'de adım yönü çevrilir |
| Color token | `step-done`/`step-current`/`step-pending`; adım durumu renk **+ ikon/etiket** (renk-körü-güvenli); vade-yakını yalnız renkle uyarmaz |
| Responsive | Mobilde dikey adım-listesi; geniş ekranda yatay stepper; uzun akış kaydırılabilir |
| a11y | Stepper `role="list"` + geçerli adım `aria-current="step"`; durum metinle de okunur ("imza bekleniyor, son-tarih 5 gün"); derin-link klavye-erişilebilir; vade metinsel |

## 6. Dış erişim modeli (magic-link + PDP + sızıntı-koruması)

Bu bölüm portalın güvenlik-çekirdeğini sabitler: dış aktör nasıl kimliklenir, kapsamı nasıl sınırlanır ve iç veri sızıntısı nasıl sıfırlanır. Üç invariant bloklayıcıdır; hiçbiri yüzeyde taklit edilemez (görsel-gizleme gerçek koruma değildir).

**Magic-link / davetli erişim.** Karşı taraf anonim kayıt olmaz; iç taraf belirli bir agreement'a davet eder ve sistem tek-kullanımlık/TTL'li magic-link (veya recipient auth akışı) üretir. Kimlik-doğrulama yöntemi `k-signature §5 signer.auth` ile hizalıdır (`email` bağlantı, `sms_otp` tek-kullanımlık kod, `mfa` çok-faktör, `sso` kurumsal oturum, `eid` elektronik kimlik — QES için). Portal bu oturumu **tüketir**, kurmaz; token üretimi/TTL/tek-kullanım/iptal IAM + `k-signature` katmanındadır. Süre dolumu/iptal → içerik yerine "bağlantı süresi doldu / erişim iptal edildi, yeniden-davet iste" afordansı; yeni token yalnız iç-akış/insan onayıyla üretilir (karşı taraf kendi kendine yenileyemez).

**PDP-gated limited-scope.** Karşı tarafın her veri okuma ve her aksiyonu (`permissions[]` üzerinden) PDP kapsam-simülasyonundan geçer; erişim ReBAC ilişkisiyle ("bu aktör bu agreement'ın karşı tarafıdır") belirlenir. Davet-dışı belge/alan/aksiyon `PDP-deny` alır — hem yüzeyde görünmez hem backend reddeder. Kapsam alan-düzeyindedir: karşı taraf agreement'ın yalnız izin-verilen kesitini (belirli belge, dış-görünür yorumlar, atanmış imza-alanı, izin-verilen ek-slotu) görür; iç alanlar yanıta hiç serileştirilmez.

**İç-veri-sızıntısı-yok (invariant).** Portal yanıtları yalnız davet-kapsamındaki veriyi taşır. Şunlar **asla** dış yanıta girmez: diğer tenant kayıtları, iç-yalnız yorumlar/mention'lar, iç kullanıcı kimlikleri (ad yerine rol/kurum etiketi), portföy/analitik metrikleri, diğer karşı taraflar, iç risk-skorları, iç iş-akışı adımları, iç sürüm-geçmişi. Bu, yüzeyde gizleme *değil* backend'de alan-düzeyi kapsam enforcement'ıdır; SDUI güven-sınırı korunur (`dangerouslySetInnerHTML` yasak, dış girdi enjeksiyon-güvenli). Dış `PartyRef` PII'si tenant-scoped ve field-level korunur.

Aşağıdaki tablo üç invariantı test-kancasına bağlar.

| Invariant | Kural | Test kancası |
|---|---|---|
| Magic-link / recipient auth | Oturum `k-signature §5 signer.auth` ile hizalı; TTL/tek-kullanım/iptal IAM'de; portal tüketir | §7 Test-2 |
| PDP-gated limited-scope | Her veri/aksiyon PDP kapsam-simülasyonundan geçer; davet-dışı `PDP-deny`; ReBAC ilişkisi | §7 Test-3 |
| İç-veri-sızıntısı-yok | Yanıt yalnız kapsam-içi alan; iç veri asla serileştirilmez; alan-düzeyi backend enforcement | §7 Test-4 |

## 7. AI guardrail (autonomy seviyesi)

Karşı taraf portalında AI **minimaldir** ve `surface-v2-directive §7` + CLM AI-invariantına bağlıdır: **kullanıcı niyet söyler → AI önizler/önerir (uygulamaz) → insan onaylar → motor uygular.** Karşı tarafa sağlanan tek AI yeteneği belge/madde **özeti**dir (draft); AI karşı taraf adına hiçbir otonom eylem yapamaz. `aiSurface` tanımlıysa `pdpGated: true` **zorunludur** (özet de yalnız kapsam-içi belgeden üretilir; kapsam-dışı içerik özetlenemez).

Aşağıdaki tablo portaldaki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Belge/madde özeti *önerme* | `draft` | AI yalnız kapsam-içi belgenin öz/madde özetini karşı tarafa gösterir; karar-metni değil, yardımcı taslak; `pdpGated:true` |
| Yorum taslağı *önerme* | `draft` | AI karşı tarafa yorum taslağı önerebilir; **göndermeyi karşı taraf (insan) yapar** — AI yorum gönderemez |
| İmza atma | `none` | AI karşı taraf yerine imza atamaz; nitelikli imzayı (QES) daima gerçek karşı taraf (insan) atar |
| Ek yükleme / slota yazma | `none` | AI karşı taraf adına belge yükleyemez/slota yazamaz |
| Onay / durum ilerletme | `none` | AI süreç adımını ilerletemez/onaylayamaz; durum yalnız insan+motor eylemiyle değişir |
| Kapsam/izin değişimi | `none` | AI dış aktörün kapsamını/iznini genişletemez; kapsam kararı PDP + iç insan |

Mutlak sınırlar: AI karşı taraf adına imza/yorum/upload/onay yapamaz; kapsamı genişletemez; kapsam-dışı içeriği özetleyemez; oturum/token üretemez. AI en fazla `draft` özet/taslak seviyesindedir; canlı-veri ve kapsam korunumu invarianttır. PDP kararı erişimi belirler; AI PDP kararını override edemez.

## 8. WBS / surface yerleşimi

`counterparty-portal` ailesi kernel Surface primitif ailesi altında `k-surface`'ın kardeş dış-yüzey modülü olarak doğar; `k-surface-consumer` (dış/geniş-kitle) ile aynı `app-kernel` altında, ama semantiği farklıdır (davetli-tek-karşı-taraf ≠ anonim kitle). Yeni düğüm: `k-surface-counterparty` (seviye `module`, `parentId: app-kernel`, `dependsOn: k-surface`); CLM domain düğümü `s-clm` (level `archetype`, parent `app-customer-revenue`) bunu `linkedSurfaces` ile tüketir ve `k-signature` (imza/recipient-auth) + `k-policy-pdp` (kapsam) + `k-storage` (ek/belge) düğümlerine `related` ile bağlanır. `SurfaceTypeSchema` enum'ı `counterparty-portal` ile genişler (25 tip; `surface-tree-metadataform-addendum` ile 24'e çıkan katalog üstüne +1); mevcut tipler ve alanlar geriye-dönük korunur.

Aşağıdaki tablo yeni düğümün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | parentId | dependsOn | related | Küme |
|---|---|---|---|---|---|
| `k-surface-counterparty` | module | `app-kernel` | `k-surface` | `k-surface-consumer`, `k-signature`, `k-policy-pdp`, `k-storage`, `s-clm` | kernel/layer0 |

`dependsOn` gerekçesi: portal, Surface üst-kontratının (`k-surface`, `SurfaceContractSchema`) beyan/render/i18n/a11y çekirdeğine teknik olarak bağlıdır. `related` ile (karar üretmeden): `k-signature` (recipient auth + embedded imza + kanıt-devri), `k-policy-pdp` (kapsam-kapısı), `k-storage` (belge/ek `AssetRef`), `k-surface-consumer` (dış-tema/custom-render deseni kardeşi), `s-clm` (portalı tüketen CLM domaini, Modül 7 / Faz 6). CLM Counterparty Portal modülü (`Agreement-CLM-Gereksinim-Analizi §5 #7`) kendi `dependsOn`'unda dolaylı olarak bu yüzeyi + `k-signature`'ı tüketir.

## 9. Test

Aşağıdaki testler `check-surface` CI kapısında zorunludur; portal bunları geçmeden merge edilemez. Testler tip-şema uyumu, dış-kimlik, PDP-kapsam, sızıntı-koruması, bileşen-a11y, i18n/RTL, state ve AI-guardrail eksenlerini kapsar.

| # | Test | Ne doğrular |
|---|---|---|
| 1 | Tip-şema uyumu | `counterparty-portal` `SurfaceTypeSchema`'ya uyar (25 tip); katalog validasyonu yeşil; `renderStrategy: custom` varsayılan |
| 2 | Dış-kimlik (magic-link/recipient auth) | Oturum `k-signature §5 signer.auth` ile hizalı; TTL/iptal/tek-kullanım enforce; süre-dolumu yeniden-davet afordansı; portal oturumu kurmaz (tüketir) |
| 3 | PDP-gated kapsam | Davet-dışı belge/alan/aksiyon `PDP-deny` (yüzey+backend); ReBAC ilişkisi izni belirler; kapsam-dışı derin-link reddedilir (≥10 negatif case) |
| 4 | İç-veri-sızıntısı-yok | Dış yanıt yalnız kapsam-içi alan taşır; iç yorum/iç-kimlik/portföy-metrik/diğer-karşı-taraf/diğer-tenant asla serileştirilmez (negatif; alan-düzeyi) |
| 5 | Bileşen davranışı | viewer salt-okuma + çıpa-link; comment optimistic+rollback; upload `k-storage` `AssetRef`; signature embedded `k-signature`; status dış-görünür kesit |
| 6 | Bileşen a11y | Shell landmark + skip-link; upload sürükleye klavye-eşdeğeri (2.5.7); imza-alanı klavye+`aria-live`; stepper `aria-current`; durum renk-bağımsız (axe + Playwright) |
| 7 | i18n / RTL | `rtl: auto` tüm shell + thread-girinti + stepper yön-çevirir (karşı taraf farklı locale); `messagesRef` tek-kaynak; pseudo-loc taşmayı yakalar |
| 8 | State davranışı | empty/loading/error/expired beyanlı; CLS yok; oturum-süresi `expired` yeniden-davet; upload/comment iskeleti çalışır |
| 9 | AI-guardrail | AI yalnız `draft` özet/taslak; AI karşı taraf adına imza/yorum-gönderme/upload/onay reddedilir; `pdpGated:true` yoksa validasyon başarısız; kapsam-dışı özet reddedilir |

## 10. Acceptance criteria

(1) `SurfaceTypeSchema` `counterparty-portal` ile genişledi (25 tip), varsayılan `renderStrategy: custom`, `a11y.wcag: 2.2-AA` tabanıyla tanımlı; (2) altı bileşen (`CounterpartyPortalShell`/`DocumentViewer`/`CommentThread`/`EvidenceUpload`/`SignatureEntry`/`StatusTracker`) prop+state+davranış+token+responsive+a11y ile bu ekle sözleşmeli; (3) §9'daki 9 test yeşil; (4) dış-kimlik `k-signature §5 signer.auth` ile hizalı, portal oturumu tüketiyor (kurmuyor); (5) PDP-gated limited-scope: davet-dışı `PDP-deny`, ReBAC ilişkisi izni belirliyor; (6) iç-veri-sızıntısı-yok invariantı alan-düzeyi backend'de enforce (yüzeyde gizleme değil); (7) upload sürükleye klavye-eşdeğeri + imza-alanı `aria-live` + stepper `aria-current` + durum renk-bağımsız; (8) AI yalnız `draft` özet, otonom eylem yok, `pdpGated:true` zorunlu; (9) i18n/RTL karşı-taraf-locale'i yön-çeviriyor, `messagesRef` tek-kaynak; (10) mevcut tipler + alanlar geriye-dönük bozulmadı; (11) CLM Modül 7 (Counterparty Portal) / Faz 6 karşılığı izlenebilir; (12) WBS düğümü `k-surface-counterparty` `app-kernel` altında `dependsOn: k-surface` ile açıldı, `s-clm` `linkedSurfaces` ile bağlandı.

## 11. Anti-patterns

Karşı tarafı iç kanala/iç panoya/Teams-benzeri iç işbirliğine açmak (portal yalnız davet-kapsamı; iç kanal `conversation`/`board`'da kalır). Kapsam-kararını yüzeyde görsel-gizlemeyle taklit etmek (gerçek koruma PDP + backend alan-düzeyi enforcement; görsel-gizleme yetki-gizleme değildir). İç veriyi (iç yorum/iç-kullanıcı-kimliği/portföy-metrik/diğer-karşı-taraf/diğer-tenant) dış yanıta serileştirmek (sızıntı; yalnız kapsam-içi alan). Portalın kendi oturumunu/token'ını üretmesi (magic-link/recipient auth IAM + `k-signature`'da; portal tüketir). İmzayı portalda üretmek/QES seçmek (`k-signature` orkestre eder; imzayı insan atar). Yüklenen binary'yi tabloya gömmek (`k-storage` `AssetRef`). Upload sürükleyi yalnız fareyle sunmak (klavye/buton eşdeğeri zorunlu; WCAG 2.5.7). Durum/imza/adımı yalnız renkle bildirmek (renk-körü çöker; renk + ikon/etiket). Etiket/enum'ı portalda çevirmek (`messagesRef` tek-kaynak; drift). AI'a karşı taraf adına otonom eylem (imza/yorum/upload/onay) yaptırmak (yalnız draft özet; `pdpGated:true`). `if module === 'clm' else` gibi koda-gömülü dallanma (config-driven kontrattan okunur). SDUI'a dış girdiyi enjeksiyon-güvensiz gömmek (`dangerouslySetInnerHTML` yasak).

## 12. DoD (Definition of Done)

`SurfaceTypeSchema` `counterparty-portal` ile 25 tipe genişledi (varsayılan `renderStrategy: custom`, `a11y.wcag: 2.2-AA`); altı bileşen sözleşmesi bu ekle tanımlı; §9'daki 9 test yeşil; `check-surface` kapısı yeni tipi + dış-kimlik-hizalamasını + PDP-kapsam + sızıntı-koruması + bileşen-a11y'yi (upload klavye-eşdeğeri, imza `aria-live`, stepper `aria-current`, renk-bağımsız durum) + i18n/RTL'yi zorluyor; dış-kimlik `k-signature §5 signer.auth` ile hizalı, portal oturumu tüketiyor; iç-veri-sızıntısı-yok invariantı ≥10 negatif case ile alan-düzeyi enforce; AI yalnız `draft` özet + `pdpGated:true` + otonom-eylem-yok kanıtlı; WBS düğümü `k-surface-counterparty` `app-kernel` altında `dependsOn: k-surface` ile açıldı, `s-clm` `linkedSurfaces` ile bağlandı; mevcut tipler geriye-dönük bozulmadı; CLM Modül 7 / Faz 6 (Counterparty Portal) + PIM #40 marka-portalı deseni karşılığı izlenebilir.

## 13. Requirement-ID tablosu

| ID | Requirement | Layer | Priority | TestType | AcceptanceCriteria | CLM/PIM | Owner |
|---|---|---|---|---|---|---|---|
| SRFCP-01 | `SurfaceTypeSchema` += `counterparty-portal` (25 tip); varsayılan `renderStrategy: custom` | schema | P0 | unit (Zod) | Katalog validasyonu 25 tip için yeşil | CLM #7 | Ajan PR → İnsan |
| SRFCP-02 | Altı bileşen sözleşmesi (shell/viewer/comment/upload/signature/status) prop+state+davranış+token | surface | P1 | integration | Test-5 yeşil; bileşenler kontrattan davranır | CLM #7 / PIM #40 | Ajan PR → İnsan |
| SRFCP-03 | Dış-kimlik: magic-link/recipient auth `k-signature §5 signer.auth` ile hizalı; portal tüketir | auth | P0 | integration | Test-2 yeşil; TTL/iptal enforce; oturum kurulmaz | CLM #7 / Faz 6 | Ajan PR → İnsan |
| SRFCP-04 | PDP-gated limited-scope: davet-dışı `PDP-deny`; ReBAC ilişkisi izni belirler | governance | P0 | integration (neg) | Test-3 yeşil; ≥10 negatif kapsam case reddedilir | CLM #7 / Faz 6 | Ajan PR → İnsan |
| SRFCP-05 | İç-veri-sızıntısı-yok: yanıt yalnız kapsam-içi alan; alan-düzeyi backend enforcement | security | P0 | integration (neg) | Test-4 yeşil; iç veri asla serileştirilmez | CLM #7 | Ajan PR → İnsan |
| SRFCP-06 | Upload `k-storage` `AssetRef` + sunucu-taraflı tarama; klavye-eşdeğeri (2.5.7) | surface | P1 | integration + axe | Test-5/6 yeşil; binary tabloya gömülmez | CLM #7 | Ajan PR → İnsan |
| SRFCP-07 | SignatureEntry embedded `k-signature` oturumu; imzayı insan atar; kanıt `k-evidence` | surface | P0 | integration | Test-5 yeşil; portal imza/kanıt üretmez | CLM #7 / k-signature | Ajan PR → İnsan |
| SRFCP-08 | Bileşen a11y: shell landmark + upload klavye + imza `aria-live` + stepper `aria-current` + renk-bağımsız | a11y | P0 | axe + Playwright | Test-6 yeşil; WCAG 2.2 AA | CLM #7 | Ajan PR → İnsan |
| SRFCP-09 | i18n/RTL: karşı-taraf-locale shell+thread+stepper yön-çevirir; `messagesRef` tek-kaynak | i18n | P1 | pseudo-loc | Test-7 yeşil; `rtl: auto` doğru türer | CLM #7 | Ajan PR → İnsan |
| SRFCP-10 | State (empty/loading/error/expired) beyanlı; CLS yok; oturum-süresi yeniden-davet | ux | P1 | integration | Test-8 yeşil; expired afordansı çalışır | CLM #7 | Ajan PR → İnsan |
| SRFCP-11 | AI minimal: yalnız `draft` özet; otonom eylem yok; `pdpGated:true` zorunlu | ai-guardrail | P0 | integration | Test-9 yeşil; AI karşı-taraf-eylemi reddedilir | CLM #7 | Ajan PR → İnsan |
| SRFCP-12 | WBS: `k-surface-counterparty` `app-kernel` altında `dependsOn: k-surface`; `s-clm` bağlı | wbs | P1 | review | Düğüm açık; `linkedSurfaces` bağı mevcut | CLM #7 / Faz 6 | Ajan PR → İnsan |

---

*Bağlı dokümanlar: `docs/surface-v2-directive.md` (genişletilen yönerge) · `docs/surface-tree-metadataform-addendum.md` (kardeş ek; biçim kaynağı) · `docs/surface-spec.md` (kanonik spec) · `docs/reference/Agreement-CLM-Gereksinim-Analizi.md` (Modül 7 Counterparty Portal + Faz 6) · `docs/reference/PIM-v2-Gereksinim-Analizi.md` (#40 marka-portalı deseni) · `docs/k-signature-trust-directive.md` (§5/§7 recipient auth + embedded imza) · `docs/adr-P1-pdp.md` (PDP kapısı) · `docs/actor-party-contract.md` (dış `PartyRef`) · `docs/capability-entitlement-contract.md` (dış entitlement) · `docs/ci-conformance-gates.md` (`check-surface` kapısı). Bağlı düğümler: `k-surface`, `k-surface-consumer`, `k-surface-counterparty`, `k-signature`, `k-policy-pdp`, `k-storage`, `s-clm`. Şema hedefi: `src/schemas/surface.ts` (`SurfaceTypeSchema` += `counterparty-portal`).*
