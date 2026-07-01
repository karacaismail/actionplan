# 02 — a11y (Erişilebilirlik) Standardı (Anlatı)

Sürüm: 1.0 — 2026-07-01
Durum: Anlatı standardı (`docs/standards/00-standards-index.md` §3, satır 02). Mevcut boyut ve sözleşmeleri *tamamlar*, kural değerlerini kopyalamaz.
Kaynaklar (referans, kopya değil): Boyut `dimensions.wcag` (`src/schemas/task.ts`) · Sözleşmeler `src/data/standards/ui-components.json` + `src/data/standards/ux-interaction.json` · CI kapısı: `check-ui-standards` · Otomatik tarama: axe-core (jest-axe bileşen + Playwright e2e).

a11y (accessibility) repoda ayrı bir standart JSON'u değildir; `dimensions.wcag` boyutunda ve iki tasarım sözleşmesinin (`ui-components`, `ux-interaction`) kurallarında yaşar. Bu anlatı, o dağınık kuralları tek erişilebilirlik çatısı altında toplar, kural ID'leriyle referans verir ve taban seviyeyi netleştirir: WCAG 2.2 AA taban (zorunlu), AAA yüzey-bazlı hedef (plan-00 C3 kararı).

---

## 1. Purpose

Ürün klavye, ekran-okuyucu ve dokunmatik kullanıcılar dahil herkes tarafından kullanılabilir olmalıdır; erişilebilirlik sonradan eklenen bir cila değil, bileşen sözleşmesinin parçasıdır. Bu standart WCAG 2.2 AA'yı taban kabul eder ve `check-ui-standards` kapısı ile axe-core taraması üzerinden zorlar. AAA (ör. kontrast 7:1) belirli yüzeylerde hedeftir ama tüketici yüzeyinde genel-geçer zorunluluk değildir; genel-geçer zorunluluk AA'dır.

## 2. Scope

Bu standart React bileşen katmanını, form/etkileşim akışlarını, klavye navigasyonunu ve dokunmatik ergonomiyi kapsar. Kurallar iki sözleşmede yaşar; bu anlatı onları erişilebilirlik ekseninde toplar ve değerlerini tekrar yazmaz.

| Kapsam ekseni | Ne dahil | Referans kural |
|---|---|---|
| Odak görünürlüğü | görünür focus halkası, offset, kontrast | `ui-components/uic-focus-visible-7to1` |
| Dokunma hedefi | ≥44px hedef + ≥8px boşluk | `ui-components/uic-touch-target-44`, `ux-interaction/uxi-mobile-ergonomics-44` |
| ARIA rolleri | ikon-buton label, alert, aria-busy, describedby | `ui-components/uic-a11y-roles-per-component` |
| Klavye | tam klavye akışı, focus trap, Escape | `ux-interaction/uxi-keyboard-full` |
| Odak sırası | DOM sırası = okuma sırası, pozitif tabindex yasağı | `ux-interaction/uxi-focus-order-logical` |
| Form hatası | role=alert + aria-describedby + spesifik mesaj | `ux-interaction/uxi-inline-validation-rhf-zod` |
| Renk-dışı sinyal | renk + metin + ikon | `ux-interaction/uxi-status-not-color-only` |
| Hareket | prefers-reduced-motion saygısı | `ux-interaction/uxi-reduced-motion` |

## 3. Non-goals

Bu standart yeni bir bileşen kütüphanesi tasarlamaz; `ui-components` sözleşmesinin Radix-tabanlı headless primitiflerini tüketir. WCAG kriterlerinin metnini de yeniden yazmaz; boyut ve sözleşme kurallarına referans verir. AAA'yı her yüzeyde zorunlu kılmaz (plan-00 C3: AAA yüzey-bazlı hedef). İçerik erişilebilirliğini (ör. alt-text metninin *kalitesi*, kolay-okunur dil) editöryel süreçlere bırakır; bu doküman *mekanizmayı* (alt-text alanının varlığı, ARIA bağı) tanımlar.

## 4. Backend Requirements

Erişilebilirlik ağırlıkla frontend yüzeyidir; backend katkısı hata ve durum metinlerinin ekran-okuyucuya anlamlı ulaşmasını sağlamaktır. API hata gövdesi (`{code, message, trace_id, details}`) insan-okur ve spesifik bir `message` taşır; bu `message` frontend'de `role="alert"` bölgesine basılır. Ham stacktrace son kullanıcıya dönmez (bkz. `ux-interaction/uxi-empty-error-recovery`). Sunucu doğrulama hataları alan bazında döner ki frontend her hatayı ilgili input'a `aria-describedby` ile bağlayabilsin. i18n ile birlikte hata metni etkin locale'e çevrilir (bkz. `01-i18n-l10n-g11n-standard.md`).

## 5. Frontend Requirements

React bileşenleri semantic HTML üzerine kurulur ve erişilebilir ad taşır; bu bölüm `uic-a11y-roles-per-component`, `uxi-keyboard-full` ve `uxi-focus-order-logical` kurallarının uygulama karşılığıdır.

Etkileşimli öğeler doğru elementle işaretlenir: buton için `<button>`, bağlantı için `<a>`, `<div onClick>` ile buton taklidi yasaktır. İkon-buton `aria-label` taşır. Modal/dialog açıldığında odak içine taşınır, içeride döngüsel tuzaklanır (focus trap) ve kapanınca tetikleyiciye geri döner; Escape açık katmanı kapatır. Dinamik içerik (bildirim, canlı sonuç) `aria-live` bölgesiyle duyurulur. Odak sırası DOM sırasına eşittir; pozitif `tabindex` (≥1) yasaktır. Görünür odak halkası her etkileşimli öğede korunur (`uic-focus-visible-7to1`); çıplak `outline: none` yasaktır.

## 6. Database Requirements

Erişilebilirlik veritabanı-yüzeyi ince ama gereklidir: medya varlıkları erişilebilir-metin alanı taşır. Görsel/medya tablosu bir `alt_text` alanı içerir (i18n bağlamında `i18n-text` olarak, bkz. `01` standardı); alt-text'siz kullanıcı-yüklemeli görsel yayın akışına giremez (alan zorunluluğu şema düzeyinde). Kullanıcı erişilebilirlik tercihleri (ör. reduced-motion tercihi, yüksek-kontrast tercihi) `user_preferences` tablosunda tutulur ve `prefers-reduced-motion` sistem sinyalini override edebilir (bkz. planlı `07-p13n` standardı). Bu tercihler kişisel veridir ve residency etiketi taşır.

## 7. API/OpenAPI Requirements

API sözleşmesi erişilebilir hata ve durum semantiğini taşır. Hata yanıtı alan-bazlı hata listesi döner (`details: [{field, message}]`) ki frontend her mesajı ilgili input'a `aria-describedby` ile bağlayabilsin. Durum/önem alanı (severity) makine-okur bir enum (`error|warning|info|success`) olarak döner; frontend bunu renk + metin + ikon üçlüsüne çevirir (`uxi-status-not-color-only`) — API yalnız renk kodu döndürmez. Uzun işlemler için işlem durumu (`pending|running|done`) döner ki UI `aria-busy` durumunu doğru yönetebilsin.

## 8. Security Requirements

Erişilebilirlik güvenliği zayıflatmaz: ARIA öznitelikleri güvenlik kontrolü yerine geçmez, yalnız sunumu iletir. Ekran-okuyucuya açılan hata metni hassas bilgi (token, stack, iç yol) sızdırmaz. Focus trap bir güvenlik sınırı değildir; yetkilendirme her zaman backend'de zorlanır (bkz. `dimensions.security`). CAPTCHA/anti-bot mekanizmaları erişilebilir bir alternatif (ör. sesli veya mantık-tabanlı) sunar; yalnız-görsel CAPTCHA klavye/ekran-okuyucu kullanıcısını dışlar ve kabul edilmez.

## 9. Multi-tenant Requirements

Erişilebilirlik taban seviyesi (WCAG 2.2 AA) tüm tenant'larda değişmezdir; bir tenant AA'nın altına inen bir tema seçemez. Tenant tema token'ları (bkz. `design-system`) kontrast eşiklerini korumak zorundadır: metin/arka-plan kontrastı AA (normal 4.5:1, büyük 3:1) altına düşen tenant paleti CI'da reddedilir. Tenant AAA'yı yüzey-bazlı hedefleyebilir (opt-in) ama AA tabanı düşüremez. Erişilebilirlik tercihleri (reduced-motion, kontrast) kullanıcı bazında izole tutulur; bir kullanıcının tercihi diğerine sızmaz.

## 10. Admin Panel Requirements

Yönetici paneli erişilebilirlik durumunu görünür kılar ve kendisi de bu standarda uyar. Panel şunları sağlar: tema kontrast doğrulama önizlemesi (seçilen palet AA geçiyor mu); alt-text eksik medya raporu; erişilebilirlik kapısı (`check-ui-standards` + axe) sonucunun görüntülenmesi; yüzey-bazlı AAA opt-in yönetimi. Panelin tüm etkileşimli öğeleri klavyeyle erişilebilir, ekran-okuyucuyla anlamlı ve ≥44px dokunma hedefli olmalıdır — yönetici yüzeyi erişilebilirlikten muaf değildir.

## 11. Test Requirements

Testler `check-ui-standards` kapısının ve axe-core taramasının yeşil olma koşulunu doğrular; her test bir kurala izlenir. Kural metinleri sözleşmelerdedir, burada tekrar edilmez.

| Test tipi | Neyi doğrular | Bağlı kural |
|---|---|---|
| a11y (jest-axe) | bileşen taramasında kritik/serious ihlal = 0 | `uic-a11y-roles-per-component` |
| unit | ikon-buton aria-label, alert role, aria-describedby bağı | `uic-a11y-roles-per-component`, `uxi-inline-validation-rhf-zod` |
| unit | focus-visible halkası mevcut (outline:none tek başına yok) | `uic-focus-visible-7to1` |
| unit | dokunma hedefi ≥44px + ≥8px boşluk | `uic-touch-target-44`, `uxi-mobile-ergonomics-44` |
| unit | pozitif tabindex yok, odak sırası DOM sırası | `uxi-focus-order-logical` |
| unit | reduced-motion media query altında animasyon durur | `uxi-reduced-motion` |
| e2e | klavye-only navigasyon (Tab/Enter/Escape) tam akış | `uxi-keyboard-full` |
| e2e (axe) | Playwright axe taraması WCAG 2.2 AA 0 ihlal | tüm a11y kuralları |

## 12. Acceptance Criteria

Standart, `check-ui-standards` kapısı yeşil olduğunda ve axe-core taraması (jest-axe bileşen + Playwright e2e) WCAG 2.2 AA seviyesinde kritik/serious kategoride sıfır ihlal verdiğinde karşılanmış sayılır. Klavye-only e2e akışı tüm kritik yolları fare olmadan tamamlayabilmeli; her form hatası `role="alert"` ile duyurulup ilgili input'a bağlı olmalı; her etkileşimli öğe görünür odak halkasına ve ≥44px dokunma hedefine sahip olmalı; renk-dışı sinyal (metin + ikon) her durum bileşeninde bulunmalı. AA taban ihlali olan tek bir yüzey bile kabul edilmez.

## 13. Anti-patterns

Aşağıdaki desenler `ui-components` ve `ux-interaction` sözleşmelerinin `banned` listeleriyle hizalıdır ve `check-ui-standards` / axe tarafından reddedilir.

| Anti-pattern | Neden yanlış | Sözleşme `banned` karşılığı |
|---|---|---|
| `<div onClick>` ile buton/rol taklidi | Klavye+ARIA kırılır | `ui-components/div-soup-a11y` |
| Çıplak `outline: none` (eşdeğer halka yok) | Klavye kullanıcısı konumu kaybeder | `ui-components/bare-outline-none` |
| Sabit px genişlikle mobil kırılan düzen | Küçük ekranda erişilemez | `ui-components/fixed-px-width-layout` |
| Klavye tuzağı (Escape çıkmıyor) | WCAG 2.1.2 ihlali | `ux-interaction/keyboard-trap` |
| Pozitif tabindex (≥1) | Tahmin edilemez odak sıçraması | `ux-interaction/positive-tabindex` |
| Yalnız renkle durum iletme | Renk körü kullanıcı algılayamaz | `ux-interaction/color-only-status` |
| Ham stacktrace kullanıcıya | Çıkmaz + bilgi sızıntısı | `ux-interaction/raw-stacktrace-to-user` |
| Dokunmatikte hover-only etkileşim | Dokunma/odak alternatifi yok | `ux-interaction/hover-only-on-touch` |
| Onaysız otomatik/yanıp-sönen hareket | Vestibüler/nöbet riski | `ux-interaction/autoplay-motion-no-consent` |
| Emoji ile durum ikonu | Platforma göre değişir, erişilemez | `ui-components/emoji-in-ui` |

## 14. Examples

Bir düğüm bu standarda `ui-components` ve `ux-interaction` sözleşmelerine referansla bağlanır (`standardRefs.uiComponentRef`, `standardRefs.uxStandardRef`); erişilebilirlik kuralları kopyalanmaz. Doğru desen: ikon-buton `<button aria-label="Sil"><TrashIcon aria-hidden="true"/></button>` biçiminde erişilebilir ad taşır; erişilebilir adı olmayan tıklanabilir div (yalnız ikon-glyph içeren `<div onClick={del}>` kalıbı) yasaktır. Form hatası `<p role="alert" id="email-err">E-posta @ içermeli</p>` ile input'a `aria-describedby="email-err"` bağlanır; "Geçersiz" gibi belirsiz mesaj kabul edilmez. Durum bildirimi renk + metin + ikon üçlüsüyle verilir: kırmızı + "Hata:" + uyarı ikonu; yalnız kırmızı çerçeve yeterli değildir. Modal açılınca odak içine alınır, Escape ile kapanır ve odak tetikleyici butona döner.

## 15. Definition of Done

Standart şu koşullar birlikte sağlandığında tamamlanır: ilgili düğümler `standardRefs.uiComponentRef` ve `standardRefs.uxStandardRef` ile bağlı ve `dimensions.wcag` boyutu WCAG 2.2 AA tabanını taşıyor; `check-ui-standards` kapısı yeşil; axe-core taraması (bileşen + e2e) AA seviyesinde sıfır kritik/serious ihlal; §11 test tablosundaki her satır için en az bir test mevcut ve geçiyor; klavye-only e2e akışı tüm kritik yolları kapsıyor; AAA yalnız yüzey-bazlı hedef olarak (opt-in) işaretli, taban AA'nın altına inilmemiş; hiçbir WCAG kriteri veya kural değeri bu anlatıda tekrar tanımlanmamış (drift yok), yalnız boyut ve sözleşmelere referans verilmiş.

---

## Requirement-ID Tablosu

Aşağıdaki tablo bu anlatının gereksinimlerini izlenebilir ID'lere böler. Her satır bir gereksinimi, katmanı, önceliğini (P0 sistemsiz çalışmaz, P1 enterprise zorunlu, P2 global zorunlu, P3 opsiyonel), test tipini, kabul kriterini ve sahibini taşır. "Bağlı kural" olan gereksinimler ilgili sözleşmeye referanstır; kural değeri burada tekrar edilmez.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| A11Y-01 | Semantic HTML + doğru element (div-buton yasağı) (ref: `uic-a11y-roles-per-component`) | Frontend | P1 | a11y | jest-axe kritik/serious 0 | frontend-owner |
| A11Y-02 | Tam klavye navigasyonu + focus trap + Escape (ref: `uxi-keyboard-full`) | Frontend | P1 | e2e | Klavye-only tüm akış tamam | frontend-owner |
| A11Y-03 | Görünür focus halkası (ref: `uic-focus-visible-7to1`) | Frontend | P1 | unit | outline:none tek başına yok | frontend-owner |
| A11Y-04 | ARIA rolleri: aria-label/aria-busy/role=alert (ref: `uic-a11y-roles-per-component`) | Frontend | P1 | unit | Etiketsiz ikon-buton yok | frontend-owner |
| A11Y-05 | Form hatası duyurusu: role=alert + aria-describedby (ref: `uxi-inline-validation-rhf-zod`) | Frontend+API | P1 | unit | Hata input'a bağlı ve okunur | frontend-owner |
| A11Y-06 | Kontrast AA (normal 4.5:1, büyük 3:1) taban | Frontend+Design | P1 | e2e | axe kontrast ihlali 0 | design-owner |
| A11Y-07 | Ekran-okuyucu uyumu (aria-live dinamik duyuru) | Frontend | P1 | a11y | Canlı bölge duyuruluyor | frontend-owner |
| A11Y-08 | Mobil dokunma hedefi ≥44px + ≥8px boşluk (ref: `uic-touch-target-44`, `uxi-mobile-ergonomics-44`) | Frontend | P1 | unit | Hedef <44px yok | frontend-owner |
| A11Y-09 | axe-core CI taraması (WCAG 2.2 AA) bileşen + e2e | Frontend+CI | P0 | a11y | Kapı kırmızı→yeşil | qa-owner |
| A11Y-10 | Renk-dışı durum sinyali (renk+metin+ikon) (ref: `uxi-status-not-color-only`) | Frontend | P1 | unit | Yalnız-renk durum yok | frontend-owner |
| A11Y-11 | Odak sırası DOM sırası, pozitif tabindex yasağı (ref: `uxi-focus-order-logical`) | Frontend | P1 | unit | tabindex≥1 yok | frontend-owner |
| A11Y-12 | prefers-reduced-motion saygısı (ref: `uxi-reduced-motion`) | Frontend | P2 | unit | reduced-motion'da animasyon durur | frontend-owner |
| A11Y-13 | Medya alt_text alanı (alt-text'siz yayın yok) | Database+Frontend | P2 | conformance | Alt-text alanı zorunlu | data-owner |
| A11Y-14 | Tenant tema AA taban koruması (AAA yüzey-bazlı opt-in) | Multi-tenant | P1 | e2e | AA-altı palet reddedilir | platform-owner |

---

Bağlı: `src/data/standards/ui-components.json` (bileşen a11y kuralları), `src/data/standards/ux-interaction.json` (etkileşim a11y kuralları), `src/schemas/task.ts` `dimensions.wcag` (WCAG boyutu), `docs/standards/00-standards-index.md` (klasör indeksi), `docs/standards/numeronym-siniflandirma.md` §2 (a11y sınıflandırması), `plan-00-kontrol-sentez-2026-07-01.md` C3 (AAA→AA taban kararı), `docs/standards/01-i18n-l10n-g11n-standard.md` (hata metni çevirisi), `tools/agents/check-ui-standards.mjs` (CI kapısı).
