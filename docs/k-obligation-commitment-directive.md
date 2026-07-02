# k-obligation Yönergesi — Yükümlülük/Taahhüt Yaşam Döngüsü Kernel Primitifi

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-OBL1)
**WBS düğümü:** `k-obligation`
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `atomik-netlestirme-2026-07-01.md` (Atom/Fragment/ArcheType kademe modeli; `EnumType`/`Duration`/`Recurrence`/`Money`/`Percentage`/`PartyRef`/`Range<date>` atomları), `atom-archetype-bagi-clm-ornegi-2026-07-01.md` §4 (CLM agreement-graph: `k-obligation` alan-alan atom eşlemesi ve "yükümlülük = ürünün asıl değer motoru" tezi), `k-worker-taskqueue-directive.md` (hatırlatma/eskalasyon taşıyan `Schedule`/`Job` motoru), `pdp-policy-contract.md` (yükümlülük ihlali → obligation/step-up policy-as-data referansı), `k-legal-hold-retention-directive.md` (kardeş CLM kernel primitifi deseni; `approval_ref` + append-only audit), `k-storage-dam-directive.md` (kanıt/ek binary referansı).
**İlişki:** Bu doküman `archetype-agreement`, `k-worker` ve `k-computation`'ın kardeşidir ve onlarla açıkça ayrışır: `archetype-agreement` "sözleşme metni/grafiği nedir?" sorusunu, `k-worker` "arka-plan işi güvenilir ve zamanında nasıl koşar?" sorusunu, `k-computation` "para/oran hesabı nasıl deterministik yapılır?" sorusunu yanıtlar; `k-obligation` ise **"sözleşmeden doğan bu zamansal taahhüt (ödeme vadesi, teslim, yenileme, ihbar, SLA, ceza) birinci-sınıf bir nesne olarak ne durumda, ne zaman uyarı üretmeli, ihlalde ne olmalı?"** sorusunu yanıtlar. `k-obligation`, agreement metninde gömülü kalan taahhütleri **izlenebilir, uyarı üreten, eskalasyonlu** nesnelere çevirir; bu, ürünün en somut değeridir — kaçan bir yenileme veya ihbar penceresi doğrudan **gelir kaçağıdır (revenue leakage)**. Bu doküman **kod yazmaz**; `k-obligation` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy 2.0/SQLModel modeli, Alembic migration, Strawberry tipi, PEP guard) ADR-OBL1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

**Stack:** FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL. Frontend: Vite + React + TanStack. Biçim: SCSS + token; ikonlar Phosphor. **YASAK:** Next.js, Supabase, Prisma, Redux, Flowbite, antd, MUI, Chakra, Mantine, react-markdown.

---

## 1. Amaç

Bu sözleşme, platformdaki her sözleşmeden (agreement) doğan zamansal taahhüdün — ödeme vadesi, teslim, yenileme, ihbar, SLA, ceza, raporlama, milestone — sözleşme metninde gömülü bir cümle olmaktan çıkıp **birinci-sınıf, izlenebilir, durumlu bir nesneye** (`obligation`) dönüşmesini; her taahhüdün vadesinden önce (`lead_time`) hatırlatma, vadesinde uyarı ve ihlalde eskalasyon üretmesini sabitler. Hedef: 50 uygulamanın hiçbirinin kendi "ödeme vadesi geldi" bayrağını, kendi ad-hoc yenileme takvimini veya kendi ihbar-süresi hesabını yeniden yazmaması; taahhüt yaşam döngüsü tek bir kernel soyutlamasında yaşaması. Ürünün asıl vaadi buradadır: bir yenileme (auto-renew) veya fesih/ihbar penceresi sessizce kaçarsa, sözleşme istenmeden uzar veya bir gelir fırsatı kaybolur — bu doğrudan **gelir kaçağıdır**; `k-obligation` bu kaçağı, her taahhüdü zamanında görünür kılarak önler. Aktör-açık ifade: *ajan* sözleşme metninden yükümlülük *çıkarır ve önerir* (draft: metinden türetilmiş taahhüt adayı, eksik lead_time, yaklaşan yenileme kapsamı); *insan* (sözleşme/finans/hukuk sahibi) onaylar; *motor* onaylı taahhüdü, alarmını ve eskalasyonunu deterministik ve denetlenebilir uygular. Bir taahhüdün "yerine getirildi/ihlal edildi" (met/breached) olarak işaretlenmesi ve bir taahhütten feragat (waive) **yalnız insan onayıdır**; AI bir taahhüdü met/breached yapamaz, feragat edemez, doğrudan yürürlüğe koyamaz.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `obligation` çekirdek taahhüt kaydı (kaynak sözleşme referansı, tür, vade, lead_time, tekrar, tutar, ceza oranı, sorumlu taraf, geçerlilik penceresi, durum), (2) taahhüt türü taksonomisi (`kind`: payment/delivery/renewal/notice/sla/penalty/reporting/milestone), (3) taahhüt yaşam döngüsü durum makinesi (`status`: draft→pending→upcoming→due→met|breached|waived), (4) alarm/hatırlatma motoru: `lead_time` öncesi ve vadesinde hatırlatma tetikleme (`obligation_alert`), (5) ihlal eskalasyonu: vade geçince ve `grace_period` sonrası artan-şiddet uyarı zinciri, (6) yenileme/fesih penceresi yöneticisi (renewal manager): `effective` penceresi + `notice_period` ihbar vadesi + otomatik/manuel yenileme kararı adayı, (7) tekrarlı taahhüt üretimi (`recurrence` RRULE: aylık rapor, yıllık yenileme), (8) iş-günü farkında vade hesabı (takvim vs. iş-günü ayrımı), (9) AI ile sözleşme metninden yükümlülük türetme (extraction → draft → insan onayı), (10) `k-obligation` düğümünün WBS yerleşimi, çok-kiracılı izolasyon ve append-only audit zorunlulukları. Backend, frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Genel onay/imza iş akışını (approval workflow, çok-adımlı gate, saga/BPMN) *tanımlamaz* — bir taahhüdün insan onayı bir `approval_ref` referansıdır; onay akışının kendisi `platform_workflow`/`platform_approval` işidir; `k-obligation` yalnız onayın *sonucunu* (approval_ref dolu mu?) tüketir. (2) Para/oran *hesabını* yapmaz — gecikme cezası tutarı, faiz, vergi, para-birimi dönüşümü `k-computation`'ın işidir; `k-obligation` yalnız cezanın *tetikleneceği koşulu ve oranı* (`penalty_rate` Percentage) taşır, tutarı hesaplamaz (hesap sonucunu referanslar). (3) Hatırlatma/eskalasyonun fiziksel *taşınmasını* (e-posta/SMS/push gönderimi, retry, dead-letter, zamanlama) yapmaz — bunu `k-worker` yapar; `k-obligation` yalnız "şu taahhüt için şu anda hatırlatma üretilmeli" *kararını* verir ve `k-worker`'a bir iş *enqueue* eder; taşıma zarfı (retry/DLQ/backoff) worker'ındır. (4) Sözleşme metnini/grafiğini *tutmaz* — sözleşmenin kendisi `archetype-agreement`'tadır; `k-obligation` ona `source_ref` ile bağlanır, metni kopyalamaz. (5) Yetki kararı *vermez* — "bu aktör bu taahhüdü met/waive yapabilir mi?" kararı PDP'nindir (`k-policy-pdp`); bu primitif taahhüt *durumunu* uygular ama *yetkiyi* PDP'de bırakır. (6) Serbest kodla durum değişimi — hiçbir app doğrudan `UPDATE obligation SET status='met'` ile bir taahhüdü kapatamaz; met/breached/waive yalnız bu primitifin sözleşmeli servisinden ve `approval_ref` kontrolünden geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-obligation`, sözleşmeden (agreement) doğan her zamansal taahhüdü — ödeme vadesi, teslim, yenileme, ihbar, SLA, ceza, raporlama, milestone — birinci-sınıf, durumlu ve izlenebilir bir nesneye çeviren; her taahhüt için vade-öncesi hatırlatma, vade uyarısı ve ihlal eskalasyonu *kararını* üreten; yenileme/fesih penceresini ve ihbar vadesini yöneten kernel taahhüt yaşam-döngüsü katmanıdır. Taahhüt veri olarak saklanır; alarm/eskalasyon *kararı* burada, taşıma `k-worker`'da, para hesabı `k-computation`'da yaşar.

**Ne yapar:** Bir sözleşme/finans/hukuk sahibi tanımlar (veya AI çıkarımını onaylar), motor uygular. Bir taahhüt tanımlar (`obligation`: `source_ref` sözleşme, `kind`, `due_at` iş-günü farkında vade, `lead_time`, `recurrence`, `amount`, `penalty_rate`, `responsible_party`, `effective` penceresi, `status`); yaşam döngüsünü sürer (`draft→pending→upcoming→due→met|breached|waived`); `due_at - lead_time` anında ve vadesinde bir hatırlatma *kararı* üretip `k-worker`'a hatırlatma işi enqueue eder; vade `grace_period` ile geçtiğinde taahhüdü `breached` adayı yapar ve artan-şiddet eskalasyon zinciri (`obligation_alert` seviye yükseltme) tetikler; `recurrence` (RRULE) taşıyan taahhütten (aylık rapor, yıllık yenileme) bir sonraki örneği üretir; yenileme/fesih penceresini yönetir (renewal manager: `effective` bitişine `notice_period` kala ihbar uyarısı üretir, auto-renew/terminate kararını *aday* olarak sunar); AI'ın sözleşme metninden çıkardığı taahhüt taslağını (`ObligationDraft`) insan onayına taşır; her durum geçişini ve alarm kararını append-only audit'e yazar.

**Ne yapmaz:** Onay/imza *akışını* yürütmez (o `platform_workflow`/`platform_approval`; bu yalnız `approval_ref` sonucunu okur). Para/ceza *tutarını hesaplamaz* (`k-computation` işidir; bu yalnız `penalty_rate` oranını ve tetik koşulunu taşır). Hatırlatmayı fiziksel *göndermez/taşımaz* (e-posta/SMS/push, retry, DLQ `k-worker` işidir; bu yalnız "üret" kararını verip enqueue eder). Sözleşme metnini *tutmaz/kopyalamaz* (`archetype-agreement`'a `source_ref`). Yetki kararı *vermez* — bunu PDP yapar. Bir taahhüdü **AI eliyle met/breached/waive yapmaz** (bu insan kararı; onaysız kapatma `ApprovalRequiredError`). Yükümlülüğü *sessizce* kapatmaz veya düşürmez — her durum geçişi ve her alarm kararı audit'lenir (kaçan bir vade "unutuldu" olamaz; ya karşılandı, ya ihlal, ya feragat — hepsi izli). AI'ın türettiği taahhüdü *doğrudan yürürlüğe koymaz* (yalnız `draft`; insan onaylar).

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki iki tablo, `k-obligation` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır ve atomik kademe modeline (`atomik-netlestirme-2026-07-01.md`) oturur: `EnumType` alias+i18n+lifecycle taşıyan tek-değer atomu (kind/status), `timestamptz` + iş-günü taban skaler + iş-günü kaydırma parametresi (due_at), `Duration` süre atomu (lead_time/notice_period/grace_period), `Recurrence` RRULE kural atomu (recurrence), `Money` değer+kur+precision atomu (amount), `Percentage` oran atomu (penalty_rate), `PartyRef` referans-değer atomu (responsible_party), `Range<date>` parametreli aralık atomu (effective penceresi), `EntityRef` referans-değer atomu (source_ref → agreement). Sözleşme metni bu primitifte tutulmaz; taahhüt yalnız kaynağa referansı ve zamansal parametreleri taşır, metin `archetype-agreement`'ta kalır.

Bu tablo `obligation` çekirdek taahhüt kaydının alanlarını tanımlar. Aktör: sözleşme/finans/hukuk sahibi tanımlar (veya AI çıkarımını onaylar); motor okur, yaşam döngüsünü sürer ve alarm üretir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Taahhüdün benzersiz kimliği; `obligation_alert.obligation_id` bunu referanslar |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `source_ref` | `EntityRef` → agreement (NOT NULL) | Taahhüdün kaynağı sözleşme; `archetype-agreement`'a tipli referans (metin kopyalanmaz) |
| `clause_ref` | `ClauseRef` (nullable) | Taahhüdü doğuran madde (playbook/risk bağı); hangi maddeden çıktığı izlenir |
| `kind` | `EnumType`(payment, delivery, renewal, notice, sla, penalty, reporting, milestone) | Taahhüt türü; tür-bazlı alarm/eskalasyon/yenileme politikasını seçer |
| `title` | `I18nText` (NOT NULL) | Çok-dilli taahhüt metni (görev başlığı); ham string değil |
| `due_at` | `timestamptz` + iş-günü (NOT NULL) | Vade anı; `business_day_mode` ile iş-günü kaydırma (hafta sonu/tatil düzeltmesi) |
| `business_day_mode` | `EnumType`(calendar, business, next_business, prev_business) | Vade takvim mi iş-günü mü; ihbar/ödeme süresinin belirsizliğini kapatır |
| `lead_time` | `Duration` (nullable) | Vade öncesi hatırlatma penceresi (ör. "P7D"); `due_at - lead_time` = ilk uyarı anı |
| `grace_period` | `Duration` (nullable) | Vade sonrası tolerans; bu süre geçince taahhüt `breached` adayı olur |
| `recurrence` | `Recurrence` (RRULE, nullable) | Tekrarlı taahhüt kuralı (aylık rapor, yıllık yenileme); sonraki örnek üretimi |
| `amount` | `Money` (nullable) | Ödeme yükümlülüğü tutarı (değer+kur+precision); tutar burada tutulur, hesap `k-computation` |
| `penalty_rate` | `Percentage` (nullable) | Gecikme/ihlal cezası oranı; tetik koşulu burada, tutar hesabı `k-computation` |
| `responsible_party` | `PartyRef` (NOT NULL) | Sorumlu taraf (bizim taraf/karşı taraf/iç aktör); `k-party`'ye tipli referans |
| `effective` | `Range<date>` (nullable) | Taahhüdün geçerlilik penceresi (renewal/notice hesabı tabanı); açık-uç = süresiz |
| `notice_period` | `Duration` (nullable) | Yenileme/fesih için ihbar vadesi (ör. "P60D"); `effective` bitişinden geri sayılır |
| `renewal_mode` | `EnumType`(auto_renew, manual_renew, terminate, none) | Yenileme davranışı; `renewal` kind'ında pencere sonu kararının tabanı |
| `status` | `EnumType`(draft, pending, upcoming, due, met, breached, waived) | Yaşam döngüsü durumu; alarm/eskalasyon ve met/breached/waive geçişini yönetir |
| `origin` | `EnumType`(human, ai_extracted) | Taahhüdün kaynağı; `ai_extracted` ise `approval_ref` zorunlu (draft→onay) |
| `approval_ref` | UUID (nullable) | met/breached/waive veya AI-türetilmiş taahhüt için insan onayı (kim+zaman+gerekçe) |
| `waived_reason` | Text (nullable) | `waived` yapılırken gerekçe; audit için zorunlu |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son durum değişikliği zamanı |

Bu tablo `obligation_alert` alarm/eskalasyon kaydını tanımlar; bir taahhüt için üretilen her hatırlatma/eskalasyon kararını append-only tutar. Kayıt motor tarafından, vade/lead_time/grace kuralı tetiklendiğinde üretilir; fiziksel taşıma (gönderim) `k-worker`'a devredilir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Alarm kaydının benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `obligation_id` | UUID (FK → obligation.id) | Alarmı doğuran taahhüt |
| `alert_kind` | `EnumType`(reminder, due, overdue, escalation, renewal_notice) | Alarm türü; hatırlatma / vade / gecikme / eskalasyon / yenileme-ihbarı |
| `severity` | `EnumType`(info, warning, critical) | Şiddet; eskalasyon zincirinde artar (info→warning→critical) |
| `escalation_level` | Integer (NOT NULL, default 0) | Eskalasyon basamağı; her gecikme aşamasında yükselir |
| `trigger_at` | TIMESTAMPTZ (NOT NULL) | Alarmın tetiklenmesi gereken an (`due_at - lead_time`, `due_at`, `due_at + grace`) |
| `worker_job_ref` | UUID (nullable) | `k-worker`'a enqueue edilen taşıma işinin referansı (gönderim zarfı worker'da) |
| `dispatched_at` | TIMESTAMPTZ (nullable) | Taşıma işine devredildiği an (null = henüz enqueue edilmedi) |
| `acknowledged_by` | `PartyRef` (nullable) | Alarmı gören/kabul eden aktör; eskalasyonu durdurur |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

## 6. WBS / kernel yerleşimi

`k-obligation`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `k-party`, `k-tenancy`, `k-worker`, `k-policy-pdp` ile aynı `app-layer0` altındadır. Altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur (`task-to-code-contract` gereği: `module` sözleşme/şema taşır, kod alt `archetype`'ta yazılır). Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-obligation` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-obligation` | module | `k-tenancy`, `k-party`, `k-worker` | kernel/layer0 |

`dependsOn` gerekçesi: `k-obligation` kiracı bağlamına (`k-tenancy`) teknik olarak bağlıdır — bir taahhüt/alarm kiracısız var olamaz (tenant-scoped RLS hazır olmadan yazılamaz). `k-party`'ye bağlıdır çünkü `responsible_party` ve alarmın hedefi/ack'i `PartyRef` olarak çözülür (aktör kütüğü önce gelmeli). `k-worker`'a bağlıdır çünkü hatırlatma/eskalasyon *taşıması* (gönderim + retry + DLQ + zamanlama) worker'ın işidir; `k-obligation` alarm *kararını* üretir ve worker'a `enqueue` eder — yani taşıma altyapısı önce hazır olmalı. `related` ile (karar üretmeden) `archetype-agreement` (taahhüdün kaynağı; `source_ref`), `k-computation` (ceza/faiz tutarı hesabı), `k-policy-pdp` (met/waive yetkisi + ihlal → obligation policy-as-data), `k-legal-hold-retention` (kardeş CLM kernel deseni; append-only audit), `k-storage` (kanıt/ek binary referansı) düğümlerine bağlanır. Tüketici `archetype-agreement` bir sözleşme aktifleştiğinde ilgili taahhütleri bu primitife tanımlar; yani agreement grafiği `k-obligation`'ı besler, taahhüt yaşam döngüsü buradan yürür.

## 7. Backend gereksinimleri (alarm motoru + yenileme yöneticisi + türetme)

Aşağıdaki gereksinimler CLM Obligation Management + Renewal portunu bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir. Motor tarafı `platform_obligation` paketinde yaşar. Çekirdek imzalar: `create_obligation(source_ref, kind, due_at, responsible_party, ..., origin, approval_ref, tenant_id) -> Obligation` (taahhüdü tanımlar; `ai_extracted` origin'de `approval_ref` zorunlu); `evaluate_due(tenant_id, now) -> [AlertDecision]` (vadesi/lead_time'ı gelen taahhütler için alarm kararı üretir; idempotent); `mark_status(obligation_id, status, approval_ref) -> Obligation` (met/breached/waived; onaysız çağrı reddedilir); `roll_recurrence(obligation_id) -> Obligation` (RRULE taşıyan taahhütten sonraki örneği üretir, idempotent); `evaluate_renewal(tenant_id, now) -> [RenewalCandidate]` (yenileme/fesih penceresi yaklaşan sözleşmeler için ihbar uyarısı + karar adayı üretir); `escalate(obligation_id) -> ObligationAlert` (gecikmiş taahhüt için eskalasyon basamağını yükseltir).

- **İş-günü farkında vade (business-day aware due):** `due_at` yalnız bir `timestamptz` değil; `business_day_mode` ile hesaplanır — `calendar` (takvim günü), `business` (yalnız iş günü), `next_business`/`prev_business` (hafta sonu/tatil vadeyi kaydırır). "60 gün ihbar" belirsizliği (takvim mi iş-günü mü?) bu parametreyle kapanır; tatil takvimi tenant/jurisdiction kapsamlıdır. Vade hesabı deterministiktir ve testtir.
- **Alarm/hatırlatma motoru (karar, taşıma değil):** `evaluate_due` `due_at - lead_time` anında bir `reminder`, `due_at` anında bir `due` alarm *kararı* üretir (`obligation_alert` satırı); sonra bu kararı bir `k-worker` işine (`enqueue`) devreder ve `worker_job_ref`'i yazar. `k-obligation` mesajı **göndermez** — worker gönderir, retry/DLQ uygular. Alarm üretimi idempotenttir: aynı taahhüt için aynı `trigger_at` iki kez alarm üretmez (`(obligation_id, alert_kind, trigger_at)` tekil).
- **İhlal eskalasyonu (escalation):** `due_at + grace_period` geçtiğinde ve taahhüt `met`/`waived` değilse motor onu `breached` *adayı* yapar (kapanış insan onayı ister) ve `escalate` ile artan-şiddet zinciri tetikler: `escalation_level` yükselir, `severity` `info→warning→critical`'e çıkar, her basamak yeni bir `escalation` alarmı üretir ve (config'li) daha üst sorumluya (`PartyRef`) hedeflenir. Bir alarm `acknowledged_by` ile kabul edilirse eskalasyon durur. İhlal sessiz kalamaz.
- **Yenileme/fesih yöneticisi (renewal manager):** `evaluate_renewal` `effective` (`Range<date>`) bitişine `notice_period` kala bir `renewal_notice` alarmı üretir ve `renewal_mode`'a göre bir karar *adayı* sunar: `auto_renew` (yenileme adayı — onaya kadar uygulanmaz), `manual_renew` (kullanıcı kararı beklenir), `terminate` (fesih ihbarı adayı). İhbar vadesi kaçarsa (notice penceresi geçti, karar verilmedi) motor kritik bir uyarı üretir — bu, istenmeden uzayan sözleşmenin (silent auto-renew) veya kaçan fesih fırsatının **tek erken-uyarı noktasıdır** (gelir kaçağı önleme). Yenilemenin *uygulanması* (yeni dönem yazımı) insan onayı ister.
- **Tekrarlı taahhüt üretimi (recurrence):** `recurrence` (RRULE) taşıyan bir taahhüt (aylık rapor, yıllık yenileme) için `roll_recurrence` bir sonraki örneği (`due_at` ilerletilmiş) üretir; ölçek-değişmez ve idempotent (aynı periyot iki kez üretilmez). El ile tekrarlı taahhüt takibi ölçekte kaçar; motor bunu deterministik üretir.
- **AI türetme (extraction → draft → onay):** AI, `archetype-agreement` metninden yükümlülük *çıkarır* ve `origin=ai_extracted`, `status=draft` bir `ObligationDraft` üretir (kaynak madde `clause_ref` ile işaretli, güven skoru ile). Bu taslak **yürürlükte değildir**; bir insan (sözleşme/finans/hukuk sahibi) onaylayana (`approval_ref`) kadar alarm üretmez. Onaysız hiçbir AI-türetilmiş taahhüt aktifleşmez.
- **Durum geçişi (state machine):** `draft→pending→upcoming→due→met|breached|waived` yalnız `mark_status`/motor kuralıyla ilerler; `upcoming` (lead_time penceresi başladı), `due` (vade geldi) motor tarafından, `met`/`breached`/`waived` insan onayıyla (`approval_ref`) set edilir. Doğrudan `UPDATE ... SET status=...` **yasaktır** (bkz. §14 anti-pattern).
- **Audit:** Her durum geçişi, her alarm kararı ve her yenileme kararı `AuditLogger.log()` ile `actor` + `resource=obligation` yazılır ve append-only tutulur (v1 §2.5). Kim hangi taahhüdü ne zaman met/breached/waived yaptı, hangi alarm ne zaman üretildi — hepsi izlidir (kaçan vade "unutuldu" olamaz).
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar; CLM Obligation Management + Renewal yönetim ekranlarını bağlar. Bileşenler SCSS + token ile biçimlenir; ikonlar Phosphor'dur. Mock veri yasaktır — her şey runtime endpoint'inden gelir.

- **Yükümlülük takvimi/panosu:** Sözleşme sahibi için taahhüt listesi/takvimi: `kind`, `due_at`, `responsible_party`, `status` sütunlu; yaklaşan (`upcoming`), vadesi gelen (`due`) ve gecikmiş (`breached`) taahhütler renk/rozetle ayrışır; veri TanStack Query ile çekilir, hardcoded sözleşme/tenant referansı **yasak**.
- **Alarm/eskalasyon görünürlüğü:** Her taahhüdün üretilmiş alarmları (`obligation_alert`) — hatırlatma / vade / gecikme / eskalasyon — zaman çizgisinde; `severity` (info/warning/critical) görsel olarak ayrışır; gecikmiş taahhütte eskalasyon basamağı (`escalation_level`) ve "kabul et" (`acknowledged_by`) aksiyonu görünür (kabul eskalasyonu durdurur).
- **Yenileme yöneticisi paneli:** `effective` penceresi bitişi yaklaşan sözleşmeler; `notice_period` ihbar vadesine kalan süre geri sayımı; `renewal_mode` (auto_renew/manual_renew/terminate) ve motorun ürettiği karar *adayı* açıkça "taslak — onay bekliyor" olarak gösterilir. İhbar vadesi kaçmak üzere olan sözleşmeler kritik uyarıyla en üstte (gelir kaçağı erken-uyarısı).
- **met/breached/waive aksiyonları:** Bir taahhüdü "yerine getirildi" (met), "ihlal edildi" (breached) veya "feragat" (waived) işaretleme yalnız insan tarafından, `approval_ref` üreten bir onay adımıyla tetiklenir; `waived` için gerekçe (`waived_reason`) zorunlu; AI önerileri bu butonları tetikleyemez.
- **AI türetme görünürlüğü (guardrail):** AI'ın sözleşme metninden çıkardığı taahhüt taslakları (`origin=ai_extracted`, `status=draft`) "AI önerisi — onay bekliyor" rozetiyle, kaynak madde (`clause_ref`) vurgusuyla ve güven skoruyla ayrışır; yürürlükte değildir ve alarm üretmez; insan onayı butonu (kabul/düzelt/reddet) ile aktifleşir.
- **Erişilebilirlik + i18n:** WCAG 2.2 AA taban; dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1. Taahhüt tür/durum/alarm metinleri `I18nText`/`EnumType` alias üzerinden çok-dilli; ham string gömülmez; vade/geri-sayım locale'e göre biçimlenir.

## 9. Multi-tenant / RLS (tenant-scoped taahhüt/alarm)

Her `obligation` ve `obligation_alert` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). PostgreSQL RLS ile bir tenant başka tenant'ın taahhüt/alarm kaydını göremez veya etkileyemez: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Alarm üretimi ve eskalasyon tenant sınırını *genişletemez*: bir taahhüdün alarmı yalnız kendi tenant'ının aktörlerine hedeflenir; cross-tenant `responsible_party` veya cross-tenant `source_ref` referansı `TenantViolationError` fırlatır ve audit'lenir. `k-worker`'a enqueue edilen taşıma işi de taahhüdün `tenant_id`'sini taşır; hatırlatma komşu tenant'a sızamaz (noisy-neighbor/veri sızıntısı koruması). İş-günü/tatil takvimi tenant (veya jurisdiction) kapsamlıdır; bir tenant'ın tatil takvimi diğerinin vade hesabını etkilemez. Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) Bu primitif finansal ve hukuki sonuç doğurduğu için (kaçan yenileme = gelir kaybı, yanlış met/breached = sözleşme uyuşmazlığı) AI'ın autonomy'si dardır: AI taahhüt *önerir/çıkarır* ama hiçbirini met/breached/waive yapamaz ve doğrudan yürürlüğe koyamaz.

Bu tablo `k-obligation` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Sözleşme metninden yükümlülük *çıkarma* | `draft` | AI agreement metninden taahhüt çıkarır (`ObligationDraft`, `origin=ai_extracted`, `clause_ref`+güven skoru); **yürürlüğe koyamaz** |
| Eksik alan *önerme* (lead_time, notice_period) | `draft` | AI eksik hatırlatma/ihbar penceresi, tanımsız `business_day_mode` önerir; insan onaylar |
| Yaklaşan yenileme/ihbar *kapsamı önerme* | `draft` | AI pencereye giren sözleşmeleri işaretler (yenileme adayı taslağı); auto-renew'ü **uygulayamaz** |
| Taahhüt aktifleştirme (draft→pending) | onay-zorunlu | AI-türetilmiş taahhüt yalnız `approval_ref` ile aktifleşir; onaysız alarm üretmez |
| Taahhüdü met / breached işaretleme | `none` | met/breached insan (sözleşme/finans/hukuk) kararı; AI bir taahhüdü **kapatamaz** (`ApprovalRequiredError`) |
| Taahhütten feragat (waive) | `none` | Waive insan kararı; AI bir taahhütten **feragat edemez** (finansal/hukuki sonuç) |
| Yenilemeyi/feshi *uygulama* | `none` | Yeni dönem yazımı/fesih insan onayı; AI auto-renew'ü tek başına uygulayamaz |
| Ceza tetiği/oran değişimi | `none` | `penalty_rate`/tetik koşulu insan kararı; hesap `k-computation`, AI oranı değiştiremez |
| Karar-logu / audit değişimi | `none` | Audit append-only; AI değiştiremez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez. En kritik iki sınır: (1) **AI bir taahhüdü met/breached/waive yapamaz** — bu finansal/hukuki sonuç doğuran insan kararıdır; (2) **AI yenilemeyi/feshi tek başına uygulayamaz ve türettiği taahhüdü onaysız yürürlüğe koyamaz** — yalnız `draft` önerir. PDP kararı met/waive yetkisini ve erişimi belirler; AI PDP kararını override edemez.

## 11. Bağlama (archetype-agreement besler; k-worker taşır; k-computation hesaplar; PDP yetki; audit)

**`archetype-agreement` bağlama:** CLM'in merkezi archetype'ı `archetype-agreement`'ın kayıtları (sözleşme, madde, tarih, ödeme) `k-obligation`'ı *besler*: bir sözleşme aktifleştiğinde ilgili taahhütler (`kind`: payment/delivery/renewal/notice/sla/penalty/reporting/milestone) bu primitife tanımlanır ve `source_ref`/`clause_ref` ile sözleşmeye/maddeye bağlanır. Agreement metni orada kalır; `k-obligation` yalnız zamansal taahhüt *modelini* ve yaşam döngüsünü taşır. `atom-archetype-bagi-clm-ornegi §4`'te `k-obligation`'ın alan-alan atom eşlemesi (kind/due_at/lead_time/recurrence/amount/penalty_rate/responsible_party/status) doğrudan buraya düşer.

**`k-worker` bağlama:** `k-obligation` alarm *kararını* üretir (`obligation_alert`), fiziksel *taşımayı* `k-worker`'a devreder: hatırlatma/eskalasyon/yenileme-ihbarı gönderimi bir worker işine (`enqueue`) düşer, retry+backoff / dead-letter / zamanlama zarfı worker'ındır. `k-worker`'ın `Schedule` motoru, `evaluate_due`/`evaluate_renewal`'ı periyodik tetikleyen zamanlanmış iştir (ör. dakikalık/saatlik tarama). İki primitif ayrıdır: `k-obligation` "hangi taahhüt ne zaman uyarı üretmeli?" (model+karar), `k-worker` "o uyarıyı güvenilir ve tekrar-güvenli nasıl taşırım?" (yürütme zarfı).

**`k-computation` bağlama:** Gecikme cezası/faiz/vergi *tutarı* `k-computation`'ın işidir; `k-obligation` yalnız cezanın *tetikleneceği koşulu* (`status=breached`, `due_at + grace` geçti) ve *oranı* (`penalty_rate` Percentage) taşır. İhlal olduğunda tutar hesabı `k-computation`'a devredilir ve sonucu referanslanır; `k-obligation` para *hesaplamaz* (Money atomunun `amount` alanını tutar, aritmetiği yapmaz).

**PDP bağlama:** "Bu aktör bu taahhüdü met/breached/waive yapabilir mi, yenilemeyi onaylayabilir mi?" yetki kararı PDP'ye sorulur (`k-policy-pdp`). Ayrıca bir taahhüt ihlali bir PDP *obligation* (step-up/gate) doğurabilir (policy-as-data); `k-obligation` durum *mekaniğini* uygular ama *yetkiyi* PDP'de bırakır (tek doğruluk kaynağı). Durum kararı (breached mi?) ≠ yetki kararı (kapatmaya izinli mi?); ikisi ayrı katman.

**Audit bağlama:** Her durum geçişi (draft→…→met/breached/waived), her alarm kararı ve her yenileme kararı append-only audit'e yazılır (`k-legal-hold-retention`/`k-mdm` append-only deseniyle uyumlu). Kaçan bir vade sessizce "unutuldu" olamaz: bir taahhüt ya `met`, ya `breached`, ya `waived` ile kapanır ve kim-ne-zaman-neden bilgisi izlidir — bu, gelir kaçağı denetiminin ve uyuşmazlık kanıtının temelidir.

## 12. Test stratejisi

Aşağıdaki testler CLM Obligation Management + Renewal kabul kriterlerini ve `core-contract-pack` DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır.

Bu tablo `k-obligation` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | İş-günü vade: `next_business` mode hafta sonu/tatil vadesini doğru kaydırıyor; `calendar` kaydırmıyor | Birim |
| 2 | Alarm kararı: `due_at - lead_time` ve `due_at` anında `reminder`/`due` alarm üretiliyor, `k-worker`'a enqueue ediliyor (`worker_job_ref` yazılıyor) | Entegrasyon |
| 3 | Alarm idempotent: aynı taahhüt+`trigger_at` iki kez alarm üretmiyor (tekrar tarama tek etki) | Entegrasyon |
| 4 | Eskalasyon: `due_at + grace` geçince taahhüt `breached` adayı oluyor, eskalasyon basamağı/şiddeti yükseliyor; `acknowledged_by` eskalasyonu durduruyor | Entegrasyon |
| 5 | Yenileme: `effective` bitişine `notice_period` kala `renewal_notice` üretiliyor; `renewal_mode`'a göre karar adayı sunuluyor; ihbar kaçarsa kritik uyarı | Entegrasyon |
| 6 | Recurrence: RRULE taşıyan taahhütten sonraki örnek idempotent üretiliyor (aynı periyot iki kez üretilmiyor) | Entegrasyon |
| 7 | met/breached/waive onay-zorunlu: `approval_ref`'siz durum kapatma reddediliyor (`ApprovalRequiredError`); `waived` gerekçe istiyor | Entegrasyon |
| 8 | AI türetme: metinden çıkarılan taahhüt `origin=ai_extracted`+`status=draft`; onaysız alarm üretmiyor, onayla aktifleşiyor | Entegrasyon |
| 9 | AI guardrail: AI taahhüt met/breached/waive yapamıyor, yenilemeyi uygulayamıyor; yalnız `draft` öneriyor | Entegrasyon |
| 10 | Tenant izolasyonu: A tenant B'nin taahhüdünü/alarmını göremiyor/etkileyemiyor, cross-tenant `responsible_party`/`source_ref` reddediliyor (≥10 negatif case) | Entegrasyon (negatif) |
| 11 | Durum makinesi: doğrudan `UPDATE status` reddediliyor; geçiş yalnız `mark_status`/motor kuralıyla; geçersiz geçiş engelleniyor | Contract |
| 12 | Audit: her durum geçişi + alarm kararı append-only audit'e düşüyor (met/breached/waived izli) | Entegrasyon |
| 13 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |
| 14 | GraphQL/PEP koruması: her resolver/endpoint `permission_classes`/`Depends(require_tenant)` taşıyor | Contract |

## 13. Acceptance criteria

- Sözleşmeden doğan bir taahhüt birinci-sınıf `obligation` nesnesi olarak tanımlanıyor (`source_ref`/`kind`/`due_at`/`responsible_party`/`status`); `due_at` iş-günü farkında hesaplanıyor (takvim vs. iş-günü belirsizliği kapalı) (CLM Obligation Management kabul kriteri).
- `due_at - lead_time` anında hatırlatma, vadesinde uyarı alarm *kararı* üretiliyor ve `k-worker`'a taşıma için enqueue ediliyor; alarm üretimi idempotent (aynı `trigger_at` tek alarm).
- Vade `grace_period` ile geçince taahhüt `breached` adayı oluyor ve artan-şiddet eskalasyon zinciri tetikleniyor; alarm kabul edilince (`acknowledged_by`) eskalasyon duruyor; ihlal sessiz kalmıyor.
- Yenileme/fesih penceresi yönetiliyor: `effective` bitişine `notice_period` kala `renewal_notice` üretiliyor, `renewal_mode` karar adayı sunuluyor; ihbar vadesi kaçmak üzere ise kritik erken-uyarı üretiliyor (gelir kaçağı önleme).
- `recurrence` (RRULE) taşıyan taahhütten sonraki örnek deterministik ve idempotent üretiliyor (aylık rapor/yıllık yenileme el ile takip edilmiyor).
- AI sözleşme metninden yükümlülük çıkarıp `draft` (`origin=ai_extracted`) öneriyor; taslak yürürlükte değil ve `approval_ref` olmadan alarm üretmiyor.
- Taahhüdü met/breached/waive yapmak yalnız insan onayıyla (`approval_ref`); onaysız kapatma reddediliyor; `waived` gerekçe istiyor; AI hiçbirini yapamıyor (test-kanıtlı).
- Cross-tenant taahhüt/alarm erişimi ve cross-tenant referans en az 10 negatif test case ile reddediliyor ve audit'leniyor; alarm komşu tenant'a sızmıyor.
- Her durum geçişi ve alarm/yenileme kararı append-only audit'e düşüyor (met/breached/waived izli, kaçan vade "unutuldu" olamaz).
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.

## 14. Anti-patterns

- **Doğrudan durum yazma:** App'te `UPDATE obligation SET status='met'` ile taahhüdü kapatmak — YASAK; met/breached/waive yalnız `mark_status` + `approval_ref` kontrolünden.
- **App-özel vade bayrağı:** Bir ArcheType'ın kendi `payment_due`/`is_overdue` kolonunu açması — YASAK; `obligation` referansı zorunlu, tek taahhüt kaynağı.
- **Hatırlatmayı primitif içinde gönderme:** `k-obligation`'ın e-posta/SMS/push *göndermesi* — YASAK; alarm *kararı* burada, taşıma (retry/DLQ) `k-worker`'a `enqueue` edilir.
- **Cezayı primitif içinde hesaplama:** Gecikme cezası/faiz *tutarını* burada hesaplamak — YASAK; `k-obligation` `penalty_rate` oranını taşır, tutarı `k-computation` hesaplar.
- **Belirsiz vade (takvim/iş-günü):** `due_at`'i `business_day_mode` beyanı olmadan yorumlamak — YASAK; ihbar/ödeme süresinin takvim mi iş-günü mü olduğu açık olmalı.
- **Sessiz yenileme (silent auto-renew):** İhbar vadesini uyarısız geçirmek/kaçırmak — YASAK; `notice_period` kala `renewal_notice` + kaçış öncesi kritik uyarı zorunlu (gelir kaçağı).
- **Alarm çift-üretme:** Aynı taahhüt+`trigger_at` için tekrar taramada ikinci alarm üretmek — YASAK; alarm üretimi idempotent (`(obligation_id, alert_kind, trigger_at)` tekil).
- **Sessiz kapanış:** Bir taahhüdü audit'siz/`approval_ref`'siz met/waived yapmak — YASAK; kim-ne-zaman-neden izlenmeli.
- **AI'ın taahhüt kapatması:** AI'ın bir taahhüdü met/breached/waive yapması veya yenilemeyi uygulaması — YASAK; hepsi `autonomy: none`, insan kararı.
- **AI-türetilmişi doğrudan aktifleştirme:** AI çıkardığı taahhüdü `approval_ref`'siz `pending` yapıp alarm ürettirmek — YASAK; `draft` kalır, insan onaylar.
- **Metni kopyalama:** Sözleşme maddesini `k-obligation`'a kopyalamak — YASAK; `source_ref`/`clause_ref` ile `archetype-agreement`'a bağlanır.

## 15. Definition of Done

- §12'deki 14 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor; `obligation`/`obligation_alert` şeması §5 tablolarıyla uyumlu; durum-geçişi ve alarm audit'i append-only.
- Alarm/eskalasyon motoru `k-worker`'a taşıma işi enqueue ediyor (entegrasyon kanıtı); yenileme yöneticisi `notice_period` uyarısını ve karar adayını üretiyor; iş-günü vade hesabı deterministik ve testli.
- CLM uçtan-uca akış (sözleşme aktifleşir → taahhütler tanımlanır → lead_time hatırlatması → vade → ihlalde eskalasyon → yenileme penceresi ihbarı → met/waived kapanış) çalışıyor.
- ADR-OBL1 "Kilitli" statüsünde (insan onayı); `k-obligation` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-tenancy`, `k-party`, `k-worker`) ile mevcut.
- AI-guardrail testi: AI'ın met/breached/waive, yenileme-uygulama ve onaysız aktifleştirme denemeleri reddediliyor; yalnız `draft` (metinden türetme dahil) öneri üretilebiliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. CLM karşılığı (Obligation Management + Renewal & Revenue Leakage)

Aşağıdaki tablo, bu sözleşmenin CLM (Contract Lifecycle Management) Obligation Management + Renewal & Revenue Leakage Prevention gereksinimlerini `k-obligation` sözleşme öğelerine nasıl eşlediğini gösterir; her satır bir CLM yeteneğini kernel primitifine bağlar. Bu eksen, ürünün en somut değeridir: sözleşme metninde gömülü kalan taahhütleri izlenebilir kılıp kaçan yenileme/ihbar penceresini (gelir kaçağı) erkenden yakalar.

| CLM / Revenue-Leakage gereksinimi | k-obligation karşılığı |
|---|---|
| Obligation tracking: sözleşme taahhüdünü birinci-sınıf, durumlu nesneye çevir | §5 `obligation` (kind/due_at/status); §4 tanım; §11 agreement besler |
| Taahhüt türü taksonomisi (ödeme/teslim/yenileme/ihbar/SLA/ceza/rapor/milestone) | §5 `kind` EnumType; §7 tür-bazlı alarm/eskalasyon politikası |
| Vade + hatırlatma: vadeden önce uyar, kaçırma | §5 `due_at`+`lead_time`; §7 alarm motoru (`reminder`/`due`); §11 `k-worker` taşır |
| İş-günü farkında vade (takvim vs. iş-günü belirsizliği) | §5 `business_day_mode`; §7 iş-günü hesabı; §12 Test-1 |
| İhlal eskalasyonu: gecikmede artan-şiddet uyarı zinciri | §5 `obligation_alert`(severity/escalation_level); §7 `escalate`; §12 Test-4 |
| Renewal management: yenileme/fesih penceresi + ihbar vadesi | §5 `effective`/`notice_period`/`renewal_mode`; §7 renewal manager; §8 yenileme paneli |
| Revenue leakage önleme: sessiz auto-renew / kaçan fesih fırsatı erken-uyarı | §7 `evaluate_renewal` kritik uyarı; §1 amaç; §13 AC (gelir kaçağı) |
| Tekrarlı taahhüt (aylık rapor, yıllık yenileme) otomatik üretimi | §5 `recurrence` (RRULE); §7 `roll_recurrence` idempotent |
| Ödeme yükümlülüğü tutarı + gecikme cezası oranı | §5 `amount` Money + `penalty_rate` Percentage; §11 tutar hesabı `k-computation` |
| AI ile metinden yükümlülük çıkarma (extraction → onay) | §7 AI türetme (`ObligationDraft`, `origin=ai_extracted`); §10 `draft` autonomy |
| met/breached/waive = insan onaylı yaşam döngüsü kapanışı | §5 `status`/`approval_ref`; §7 `mark_status`; §10 autonomy none |
| Tenant izolasyon + alarm sızmama | §9 tenant-scoped RLS; alarm/taşıma tenant kapsamı |
| Denetim: her taahhüt izli (kaçan vade unutulamaz) | §7/§11 append-only audit; §13 AC (met/breached/waived izli) |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| OBL-01 | `obligation` çekirdek taahhüt kaydı tenant-kapsamlı (source_ref/kind/due_at/status) | Backend/Data | P0 | Integration | Taahhüt tenant izolasyonlu tanımlanır | kernel-team |
| OBL-02 | Taahhüt türü taksonomisi (payment/delivery/renewal/notice/sla/penalty/reporting/milestone) | Backend/Data | P1 | Integration | Tür-bazlı politika seçilir | kernel-team |
| OBL-03 | İş-günü farkında vade (`business_day_mode`) | Backend | P1 | Unit | Hafta sonu/tatil vadesi doğru kaydırılır | kernel-team |
| OBL-04 | Alarm motoru: `lead_time`/vade hatırlatma kararı + `k-worker` enqueue | Backend | P0 | Integration | Alarm üretilir ve taşımaya devredilir | kernel-team |
| OBL-05 | Alarm idempotent (aynı taahhüt+trigger tek alarm) | Backend | P1 | Integration | Tekrar tarama tek etki | kernel-team |
| OBL-06 | İhlal eskalasyonu (grace sonrası breached adayı + artan şiddet) | Backend | P0 | Integration | Gecikmede eskalasyon zinciri, ack durdurur | kernel-team |
| OBL-07 | Yenileme yöneticisi (`effective`+`notice_period`+`renewal_mode` karar adayı) | Backend/Compliance | P0 | Integration | İhbar vadesi uyarısı + kaçış kritik uyarısı | kernel-team |
| OBL-08 | Revenue leakage önleme: sessiz auto-renew/kaçan fesih erken-uyarı | Backend/Compliance | P0 | Integration | İhbar kaçmadan kritik uyarı üretilir | governance |
| OBL-09 | Tekrarlı taahhüt üretimi (`recurrence` RRULE, idempotent) | Backend | P1 | Integration | Sonraki örnek iki kez üretilmez | kernel-team |
| OBL-10 | met/breached/waive onay-zorunlu (`approval_ref`) | Backend/Compliance | P0 | Integration | Onaysız durum kapatma reddedilir | governance |
| OBL-11 | Ceza oranı taşınır, tutar `k-computation`'da (hesap ayrımı) | Backend | P1 | Contract | `k-obligation` para hesaplamaz | kernel-team |
| OBL-12 | Hatırlatma taşıma `k-worker`'da (gönderim/retry/DLQ ayrımı) | Backend | P1 | Integration | Primitif mesaj göndermez, enqueue eder | kernel-team |
| OBL-13 | Durum makinesi: doğrudan `UPDATE status` reddi, yalnız `mark_status` | Backend | P0 | Contract | Geçersiz/serbest geçiş engellenir | kernel-team |
| OBL-14 | Tenant-scoped RLS + cross-tenant taahhüt/alarm/referans reddi | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| OBL-15 | Durum geçişi + alarm kararı audit (append-only) | Security | P0 | Integration | Her met/breached/waived + alarm audit'e düşer | security-team |
| OBL-16 | AI metinden yükümlülük çıkarır (`draft`, `origin=ai_extracted`) | AI-Governance | P1 | Integration | AI-türetilmiş taahhüt onaysız aktifleşmez | governance |
| OBL-17 | AI met/breached/waive yapamaz, yenilemeyi uygulayamaz (autonomy none) | AI-Governance | P0 | Integration | AI durum kapatma/yenileme reddedilir | governance |
| OBL-18 | Yükümlülük = policy-as-data; met/waive yetkisi PDP'ye referans | Backend/API | P1 | Integration | Kapatma/erişim yetkisi PDP'den | kernel-team |
| OBL-19 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| OBL-20 | Strawberry resolver `permission_classes` + PEP `Depends` zorunlu | Backend/API | P1 | Contract | Korumasız resolver/endpoint yok | kernel-team |
| OBL-21 | Frontend yükümlülük panosu/takvim + yenileme paneli config-driven | Frontend | P1 | E2E | UI runtime verisinden; hardcoded sözleşme yok | ui-team |
| OBL-22 | WCAG 2.2 AA + i18n + vade/geri-sayım locale biçimi | Frontend/A11y | P2 | A11y(axe) | axe critical=0; draft/eskalasyon rozeti erişilebilir | ui-team |
| OBL-23 | `k-obligation` WBS düğümü doğru dependsOn (k-tenancy, k-party, k-worker) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |

---

*Kaynak yönerge: CLM Obligation Management + Renewal & Revenue Leakage Prevention. Kardeş sözleşmeler: `archetype-agreement` (taahhüdün kaynağı sözleşme; `source_ref`/`clause_ref`), `k-worker-taskqueue-directive.md` (hatırlatma/eskalasyon taşıma zarfı: retry/DLQ/zamanlama), `k-computation` (ceza/faiz/vergi tutarı hesabı), `pdp-policy-contract.md` (met/waive yetkisi + ihlal → obligation policy-as-data), `k-legal-hold-retention-directive.md` (kardeş CLM kernel deseni; append-only audit + approval_ref), `atomik-netlestirme-2026-07-01.md` (EnumType/Duration/Recurrence/Money/Percentage/PartyRef/Range<date> atomları), `atom-archetype-bagi-clm-ornegi-2026-07-01.md §4` (k-obligation alan-alan atom eşlemesi), `core-contract-pack.md §3.0.1` (AI guardrail). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez. Bir taahhüdü met/breached/waive yapma ve yenilemeyi uygulama yalnız insan kararıdır; AI yalnız önerir (metinden türetme dahil).*
