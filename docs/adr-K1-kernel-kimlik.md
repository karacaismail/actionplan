# ADR-K1 — Kernel Kimliği, Sınırı ve Stack Kilidi

**Durum:** Kilitli — 2026-07-01 (insan onayı: ismail)

## Bağlam

Depoda "kernel" sözcüğü üç farklı şeyi karıştırıyor ve bu karışıklık, her istemi ilk okuyan ajanın yanlış stack ve yanlış sınır varsayması riskini doğuruyor. Birincisi, kernel = metadata-driven ArcheType motoru (kayıt tipi tanımlama + projeksiyon çekirdeği). İkincisi, `atonota/kernel` adlı ayrı bir CI/CD reposu — bu bir çalışma-zamanı çekirdeği değil, dağıtım hattıdır. Üçüncüsü, bayat bir `kernel-START-HERE.md` dokümanı hâlâ TypeScript/Prisma bir çekirdek tarif ediyor; oysa `plan-00 §4` (C1) bunun yasak stack olduğunu, `AGENTS.md:82`'nin bile yanlışlıkla "Prisma backend" dediğini işaretliyor. Ek olarak kernel'in tek bir "her şeyi yapan" bileşen gibi anılması, üç ayrı sorumluluğun (schema/worker/agent) tek isim altında ezilmesine yol açıyor; bu da ölçeklendirme ve güvenlik sınırlarını bulanıklaştırıyor. Bu ADR, kernel'in ne olduğunu, ne olmadığını ve hangi stack üzerinde durduğunu sabitler.

## Karar

- **Kernel = ArcheType motoru.** Kernel'in birincil kimliği, metadata-driven kayıt tipi tanımlama ve projeksiyon çekirdeğidir. İş-primitifleri (Actor, Capability, Mode, Computation, PDP) bu çekirdeğe ADR-A1..A4 ve ADR-P1 ile eklenir.
- **Stack kilidi:** Backend = FastAPI + SQLAlchemy 2.0 / SQLModel + Alembic + PostgreSQL. Prisma, Next.js ve Supabase yasaktır. Bu kilit `plan-01 §1` deterministik-stack şartıyla ve `core-contract-pack §1` ile aynıdır.
- **`atonota/kernel` ayrı kavramdır.** O repo CI/CD hattıdır (build/test/deploy orkestrasyonu); çalışma-zamanı ArcheType motoruyla aynı şey değildir ve öyle adlandırılmaz.
- **Üç sorumluluk ayrı adlandırılır:** (a) *schema* = ArcheType motoru (kayıt tipi + projeksiyon), (b) *worker* = job-runner/asenkron işlem çekirdeği, (c) *agent* = AI-ajan çalışma-zamanı. Bunlar tek "kernel" ismiyle karıştırılmaz; her biri kendi sınırıyla anılır.
- **Bayat dokümanlar silinir:** TS/Prisma tarif eden `kernel-START-HERE.md` ve benzeri dokümanlar aktif setten çıkarılır. Bu, `plan-01 D0` doküman hijyeni kapsamındadır.

## Gerekçe

Ajan-üretimi kod, okuduğu ilk sözleşmeye göre stack seçer; bu yüzden isim ve stack netliği tek günlük ama en yüksek getirili iştir (elestiri-02 §9). Kernel'i "ArcheType motoru" olarak sabitlemek, iş-primitiflerinin nereye oturacağını belirsizlikten çıkarır. Üç sorumluluğu ayırmak, worker maliyet-patlaması ve agent-runtime güvenliği gibi riskleri ayrı ele almayı mümkün kılar; tek isim altında bunlar görünmez kalırdı. `atonota/kernel`'i CI/CD olarak ayırmak, çalışma-zamanı ile dağıtım hattının farklı yaşam döngülerini korur.

## Sonuçlar

Olumlu:
- Ajanlar tek, tutarlı stack görür; yasak stack koduna uzanma riski düşer.
- İş-primitifleri (A1-A4, P1) için net bir "buraya oturur" çerçevesi doğar.
- schema/worker/agent ayrımı, ölçek ve güvenlik kararlarını bağımsız verilebilir kılar.

Olumsuz:
- `AGENTS.md:82` canon olduğu için ajan onu düzeltemez; C1 düzeltmesi **insan** eliyle yapılır, ajan yalnız diff önerir (bu bir kısıt, kusur değil).
- Bayat doküman silme, eski bağlantıları kıracağından ilgili referansların taranıp güncellenmesi gerekir.
- Üç ayrı isim, ekip alışkanlığı değişene dek kısa süreli terminoloji sürtünmesi yaratır.

## Değerlendirilen alternatifler

- **Kernel = ArcheType + orkestrasyon + job-runner (tek bileşen).** Reddedildi: sorumlulukları birleştirmek ölçek/güvenlik sınırlarını gizler.
- **Prisma/TS çekirdeğini korumak.** Reddedildi: kullanıcı stack kararına ve `core-contract-pack §1` yasak-listesine aykırı.
- **`atonota/kernel`'i çalışma-zamanı kerneli saymak.** Reddedildi: CI/CD ile runtime yaşam döngüleri farklı; karıştırmak dağıtım kararlarını runtime'a sızdırır.
- **Bayat dokümanı "arşiv" etiketiyle bırakmak.** Reddedildi: aktif sette kaldığı sürece ajan onu okuyabilir; silme daha güvenli.

## İlgili ADR / doküman

- `plan-03-yeni-yonergeler §6` (üretilecek yönerge dosyaları)
- `plan-00-kontrol-sentez §4` (C1 çelişkisi, `AGENTS.md:82`)
- `elestiri-02-kernel §8` (ADR-K1 kaynağı), `§9` (öncelikli aksiyon 1)
- `core-contract-pack §1` (stack yasak-listesi), `AGENTS.md`
- ADR-A1, ADR-A2, ADR-A3, ADR-A4, ADR-P1 (bu kernele oturan primitifler)
