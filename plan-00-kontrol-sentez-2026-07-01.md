# Plan Paketi — Kontrol, Sentez ve Kritik Bulgular

**Tarih:** 2026-07-01 · **Kapsam:** Mevcut üç eleştiri raporunun (`elestiri-01/02/03`) ve üç merceğin (UX, AI-First, yüksek-trafik) yapıldığının doğrulanması + sıradaki iş için beş-dosyalık uygulama paketinin haritası + depoda bulunan kritik çelişkiler.

Bu dosya paketin **giriş kapısıdır**. İki iş yapar: (1) "yukarıdakiler yapıldı mı?" sorusuna kanıtla cevap verir, (2) diğer dört dosyanın ne olduğunu ve hangi sırayla okunacağını söyler.

---

## 1. Kontrol — "yukarıdakiler yapıldı mı?"

Kısa cevap: **Evet, üç rapor da üretilmiş ve üç mercek de işlenmiş.** Aşağıdaki tablo dosya-kanıtını verir. Tablodan önce sade özet: raporlar bugün (2026-07-01) yazılmış, hepsi aynı sağlam iskeleti izliyor ve UX/AI-First/yüksek-trafik üçlüsü her raporda ayrı alt-başlık olarak var.

| Rapor | Dosya | Katman | İskelet tam mı? | Üç mercek işlenmiş mi? |
|---|---|---|---|---|
| Rapor 1 | `elestiri-01-archetype-2026-07-01.md` | ArcheType (veri/domain sözleşmesi) | Evet (9 bölüm: tanım→değerlendirme→kök-sebep→gap→tasarım→mercek→unknown-unknowns→ADR→aksiyon) | Evet (§6.1 AI-First ağır, §6.2 yüksek-trafik, §6.3 UX) |
| Rapor 2 | `elestiri-02-kernel-2026-07-01.md` | Kernel (Layer-0 çekirdek hizmetler) | Evet (aynı 9 bölüm) | Evet (§6.1 yüksek-trafik ağır, §6.2 AI-First, §6.3 UX) |
| Rapor 3 | `elestiri-03-surface-2026-07-01.md` | Surface (UI/API projeksiyonu) | Evet (aynı 9 bölüm) | Evet (§6.1 UX ağır, §6.2 AI-First, §6.3 yüksek-trafik) |
| İndeks | `elestiri-00-index-2026-07-01.md` | Üçünün ortak tezi + girdi denetimi | Evet | Evet (§3 mercek dağılım tablosu) |

Ek olarak raporlar iki girdiyi de **eleştirel süzgeçten** geçirmiş: yüklediğiniz `kernel-gap-analizi`'nin "5 ürün tamamen yok" iddiasının yanlış-negatif olduğunu (hepsi tasarımda var: `s-pim`, `s-isg`, `s-mail`, `s-comms`, `s-fleet`) ve ChatGPT'nin commerce cevabındaki doğru sinyali (Actor/Capability/Mode/Policy birinci-sınıf olmalı) yanlış reçeteden (stack şişkinliği, shared-hosting) ayırmış.

**Yapıldı sayılmayan tek şey — ve zaten sıradaki işin konusu:** Raporların teşhis ettiği beş çekirdek primitif henüz **koda/şemaya girmemiş**. `src/schemas/archetype.ts` taranınca Actor/Party, Capability, Mode-Profile, Computation/Derivation, PDP (Policy Decision Point — merkezî yetki kararı noktası) **bulunamadı**. Bunlar yalnızca `core-contract-pack` v2 ve `archetype-uretim-spec §12`'de *sözleşme taslağı* olarak duruyor. Yani teşhis yazıldı, tedavi yazılmadı. Bu paket tedaviyi planlıyor.

---

## 2. Bu paket ne içerir — beş dosya haritası

Sade özet: bir "kontrol" dosyası (bu), bir "ne yapılacak" planı, bir "standartları prompta çevir" paketi, bir "yönergeleri düzelt/oluştur" dosyası ve bir "ajanlarla nasıl koşulur" rehberi. Sıra önemlidir; her dosya bir öncekine dayanır.

| # | Dosya | Ne yapar | Kime hitap eder |
|---|---|---|---|
| 0 | `plan-00-kontrol-sentez` (bu dosya) | Kontrol + paket haritası + kritik çelişkiler | Karar verici (siz) |
| 1 | `plan-01-vibecoding-eylem-faz-faz` | Faz-faz (dalga-dalga) uygulama planı; her dalgada tam Claude Code promptu | Siz + geliştirme ajanları |
| 2 | `plan-02-numeronym-standart-prompt-paketi` | i18n/a11y/o11y… numeronym listesini sınıflandırıp prompt zincirine çevirir | Standartları uygulayacak ajanlar |
| 3 | `plan-03-yeni-yonergeler` | Mevcut WBS/core/app/surface/archetype yönergelerini uzlaştırır + 5 primitif için yeni yönerge | Mimari kararlar (siz) |
| 4 | `plan-04-paralel-ajan-orkestrasyon` | Dalgaları paralel ajanlarla, güvenli (PR-only, insan-onaylı) koşma rehberi | Operasyon (siz + CI/CD) |

---

## 3. Tek cümlelik teşhis

> Meta-model **kayıt + projeksiyon + otomasyon**'u (ArcheType/Surface/ECA) sınıfının en iyisi düzeyinde tarif ediyor ve **yönetişim/standart/CI altyapısı olgun**; ama beş **iş-evreni primitifi** (Actor/Capability/Mode/Computation/PDP) hâlâ *sözleşmede taslak, kodda yok*, birkaç numeronym standardı eksik, ve en tehlikelisi **bir kaç doküman bayat** (aşağıda). Yani sıradaki iş "daha çok modül" değil; **primitifleri kilitle, bayatı temizle, standardı tamamla, ilk dikey dilimi kanıtla.**

---

## 4. Bulunan kritik çelişkiler — "her şeye eleştirel yaklaş" gereği

Bu bölüm paketin en yüksek-değerli kısmıdır: kod yazmadan önce düzeltilmezse **ajanlara yanlış kod ürettirecek** çelişkiler. Her satırda aktör-açık düzeltme sahibi var. Tablodan önce sade özet: en tehlikeli çelişki, her ajanın ilk okuduğu `AGENTS.md` dosyasının hâlâ yasak olan Prisma'yı "backend kilidi" diye göstermesidir.

| # | Çelişki | Kanıt (dosya:satır) | Risk | Çözüm | Sahip |
|---|---|---|---|---|---|
| C1 | `AGENTS.md` "Backend kilidi: **Prisma + PostgreSQL**" diyor; oysa karar SQLAlchemy 2.0 | `AGENTS.md:82` | Vibecoding ajanı ilk bu dosyayı okur → Prisma'ya uzanır → yasak stack kodu üretir | Satır 82'yi "Backend: FastAPI + SQLAlchemy 2.0 / SQLModel + Alembic + PostgreSQL" yap | **İnsan** (AGENTS.md canon; ajan düzenleyemez) |
| C2 | Seed script'lerinde "PostgreSQL/Prisma" kalıntısı | `tools/agents/seed-layer0.mjs:114,163`; `seed-frontend.mjs:828,879` | Üretilen düğüm içeriğine bayat stack sızar; okuyan yanılır | "Prisma" → "SQLAlchemy 2.0" düzelt, düğümleri yeniden üret | Ajan (PR açar) → İnsan onaylar |
| C3 | Surface şemasında `wcag` varsayılanı `"2.2-AAA"`; oysa `surface-spec` ADR-S5 "AA zorunlu, AAA yüzey-bazlı hedef" diyor | `src/schemas/surface.ts` (a11y.wcag default) vs `docs/surface-spec.md` ADR-S5 | Kendi CI erişilebilirlik kapınız tüketici yüzeyde AAA'yı geçemez → sürekli kırmızı veya sahte-waiver | Varsayılanı `"2.2-AA"` yap, AAA'yı yüzey-bazlı opsiyon bırak | Ajan (şema+test PR) → İnsan onaylar |
| C4 | Surface şemasında **i18n alanı yok**; oysa `i18n-standard` her yüzeyin locale/RTL beyan etmesini zorunlu kılıyor | `src/schemas/surface.ts` (i18n alanı bulunamadı) | Global 16 ürün için yüzey i18n'i sözleşmede görünmez → sonradan yamalanır | Surface şemasına `i18n{locales,defaultLocale,rtl,messagesRef}` ekle | Ajan (şema+test PR) → İnsan onaylar |
| C5 | Ölçek primitifleri (outbox, idempotency, tenant-rate-limit) "opt-in bayrak"; enterprise'da bazıları zorunlu-invariant olmalı | `elestiri-02-kernel §3.3` | Bayrak unutulursa çift-tahsilat/çift-mesaj; sessiz para hatası | "scale-invariant" sözleşmesi: para/sipariş yazan her akışta outbox+idempotency zorunlu | Ajan (yönerge PR) → İnsan onaylar |
| C6 | Beş primitif (Actor/Capability/Mode/Computation/PDP) sözleşmede taslak, kodda yok | `src/schemas/archetype.ts` (bulunamadı) vs `core-contract-pack` v2 | Portföyün yarısı (B2B/C2C mod geçişi, lisans, fiyat/BOM hesabı) bu primitifler olmadan imkânsız | Dalga 1'de beşini ADR ile kilitle + şemaya al (Dosya 1) | Ajan (draft) → İnsan onaylar |

C1 ve C3/C4 not: `AGENTS.md` kendi kuralında "AI canon dokümanları düzenleyemez" diyor. Bu yüzden C1'i **insan** elle düzeltmeli; ajan yalnızca tam diff'i önerir. Diğerleri şema+test değişikliği olduğundan ajan PR açabilir, insan merge eder.

---

## 5. Okuma sırası ve sıradaki adım

Sırayla okuyun: **bu dosya → Dosya 1 (plan) → Dosya 3 (yönergeler) → Dosya 2 (standart promptları) → Dosya 4 (orkestrasyon).** Gerekçe: önce ne yapılacağını (plan), sonra hangi sözleşmeye göre yapılacağını (yönergeler), sonra standartların nasıl uygulanacağını (promptlar), en son bunların ajanlarla nasıl koşulacağını (orkestrasyon) görürsünüz.

İlk somut aksiyon **Dalga 0**'dır (Dosya 1 §4): kod değil — beş primitifi ADR ile kilitlemek ve yukarıdaki C1–C4 bayatlığını temizlemek. Dalga 0 bitmeden kod dalgaları başlamamalı; aksi halde ajanlar bayat sözleşmeye kod üretir.
