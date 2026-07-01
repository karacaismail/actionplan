# Standart Uygulanabilirlik Matrisi — Hangi Standart/Boyut Hangi Seviyeye Uygulanır

**Sürüm:** 1.0 · **Tarih:** 2026-06-29
**Durum:** Kanonik, bağlayıcı. ADR-0027 (mühendislik standardı işletim katmanı) ve task-to-code-contract'ın türevidir; bu ikisiyle çelişen bir madde geçersizdir.
**Kapsam:** `src/data/standards/*.json` altındaki 15 standart sözleşme, `src/schemas/task.ts` içindeki 14 üretim boyutu ve 7 seviyeli WBS hiyerarşisi.

---

## Önsöz — Bu Matris Neden Var

ADR-0027 dört yapısal boşluktan birini "per-node uygulanabilirlik yok → her boyut her düğüme doldurulup jenerik çöp üretiyor" diye tanımlar. Çözüm iki katmanlıdır: makine tarafında `applicability[dimKey] = {applies, reason}` alanı (CI kapısı `check-dimension-applicability` ile zorlanır); insan tarafında ise bu matris. Matris, bir düğümü açan geliştiriciye ya da AI ajana "bu seviyede, bu yüzey sınıfında hangi standardı zorunlu say, hangisini öner, hangisini gerekçeli N/A işaretle" sorusunu tek bakışta yanıtlar.

Temel ayrımı baştan koy: standart referansı (`standardRefs`) ile üretim boyutu (`dimensions` + `applicability`) iki farklı eksendir. Standart, "hangi mühendislik sözleşmesiyle üretilecek" sorusunu (kodlama kuralı, design-system, test stratejisi) yanıtlar; düğüm ona REFERANS verir, içeriğini kopyalamaz. Boyut ise "bu düğümde hangi üretim disiplini doldurulacak" (güvenlik, performans, WCAG) sorusunu yanıtlar; uygulanmıyorsa gerekçeli N/A işaretlenir. Bu doküman her iki ekseni de seviye ve yüzey sınıfına göre tablolar.

Üç kademeli işaret kullanılır:

- **Z (Zorunlu):** Bu seviye/yüzefte standart veya boyut doldurulmuş/referanslanmış olmalı; eksikse kapı kırmızı. Boyut için `applies=true` ve içerik beklenir.
- **Ö (Önerilen):** Beklenir ama bloklayıcı değildir; atlanırsa gerekçe (waiver veya applicability.reason) iyi pratiktir, zorunlu değildir.
- **N/A (Uygulanmaz):** Bu seviye/yüzefte anlamsızdır. Boyut ekseninde `applies=false` SET edilirse gerekçe (reason) ZORUNLUdur (`check-dimension-applicability` zorlar). Standart ekseninde ilgili `standardRefs` alanı boş bırakılır (lazy; `check-standards-coverage` boş ref'i serbest sayar).

---

## 1. Yüzey Sınıfı Nedir

Seviye tek başına standardı belirlemez; düğümün **yüzey sınıfı** da belirler. Aynı archetype seviyesinde saf-backend bir veri modeli ile bir React UI bileşeni farklı standart setine tabidir. Yüzey sınıfı `standard.appliesTo` alanında da taşınır (boş = hepsi).

| Yüzey sınıfı | Tanım | Tipik örnek |
|---|---|---|
| backend | Sunucu tarafı; veri modeli, migration, resolver, servis. DOM/CSS yok. | `platform-customer-model`, `platform-authn-authz` |
| frontend-ui | Kullanıcıya görünen arayüz; React bileşeni, hook, CSS, etkileşim. | `platform-customer-ui` |
| api-contract | Dışa açılan sözleşme yüzeyi; GraphQL tip, REST şema, olay sözleşmesi. | `platform-customer-graphql` |
| data-schema | Kalıcılık katmanı; tablo, ilişki, RLS, tenant izolasyonu. | `platform-db-schema` |
| infra-ops | Dağıtım/işletim; CI/CD, observability, container, release. | `platform-cicd`, `platform-observability` |
| doc-governance | Yalnız belge/kapsam/sözleşme taşır; çalışan kod yok. | `app` ve `module` düğümleri, ADR düğümleri |

Bir düğüm birden fazla yüzefe dokunabilir (ör. archetype hem data-schema hem api-contract). O durumda dokunduğu her yüzefin zorunlu standartları birleşik uygulanır.

---

## 2. Standart × Seviye Matrisi

Satır: 15 standart sözleşme (dosya adı `src/data/standards/<id>.json`; düğüm bağı `standardRefs.<key>`). Sütun: 7 WBS seviyesi. Hücre: Z/Ö/N/A.

Okuma kuralı: app ve module düğümleri `doc-governance` yüzefidir (task-to-code-contract §1: "kapsam ve sözleşme yöneticisidir, kod yazan değil"). Bu yüzden onlarda kod-üretim standartları Ö/N/A'ya düşer; sözleşme/mimari standartları Z kalır. archetype ve altı somut kod + test taşıdığı için kod standartları Z olur.

| Standart (dosya) | standardRefs anahtarı | app | module | archetype | stone | molecule | element | atom |
|---|---|---|---|---|---|---|---|---|
| architecture | architectureRef | Z | Z | Z | Ö | Ö | N/A | N/A |
| coding-standards | codingStandardRef | N/A | Ö | Z | Z | Z | Z | Ö |
| short-code | shortCodeRef | N/A | Ö | Z | Z | Z | Z | Ö |
| quality-gates | qualityGateRef | Ö | Z | Z | Z | Ö | Ö | N/A |
| design-system | designSystemRef | N/A | Ö | Z | Z | Z | Ö | N/A |
| ui-components | uiComponentRef | N/A | Ö | Z | Z | Z | Ö | N/A |
| ux-interaction | uxStandardRef | N/A | Ö | Z | Z | Ö | N/A | N/A |
| data-api-contract | dataApiContractRef | N/A | Z | Z | Z | Ö | N/A | N/A |
| state-management | stateContractRef | N/A | Ö | Z | Z | Z | Ö | N/A |
| observability | observabilityRef | Ö | Z | Z | Ö | N/A | N/A | N/A |
| testing-strategy | testingStandardRef | Ö | Z | Z | Z | Z | Z | Ö |
| release-versioning | releasePolicyRef | Z | Z | Z | Ö | N/A | N/A | N/A |
| ai-governance | aiGovernanceRef | Z | Z | Z | Ö | Ö | N/A | N/A |
| i18n-standards | i18nRef | Z | Z | Z | Ö | Ö | Ö | N/A |
| dependency-policy | (ref alanı yok; repo geneli) | Z | Z | Z | Ö | Ö | Ö | N/A |
| tech-profiles | techProfileRef | Z | Z | Z | Ö | Ö | N/A | N/A |

Notlar:

- `tech-profiles` standart dosyalarında değil `src/data/tech-profiles.json` içindedir; `techProfileRef` o id havuzuna çözülür (`check-standards-coverage` bunu ayrı havuz olarak doğrular). Yine de seviye uygulanabilirliği açısından bir standart gibi davranır.
- `dependency-policy` için düğüm üzerinde ayrı bir `standardRefs` anahtarı YOKtur; bu standart repo geneli `check-dependency-policy` kapısıyla zorlanır (allowlist/lisans/lockfile). Matriste seviye disiplinini göstermek için bırakılmıştır; düğüme ref olarak SET edilmez.
- app/module satırlarında `architecture`, `release-versioning`, `ai-governance`, `tech-profiles` Z kalır: bunlar sözleşme/kapsam kararıdır (bounded-context sınırı, release train, AI yetki seti, headless-lock profili) ve kod yazılmadan da bağlayıcıdır.
- `i18n-standards`, çevrilebilir metin veya locale/currency/timezone/jurisdiction taşıyan HER seviye ve yüzey sınıfına (app/module/archetype/surface) uygulanır. app/module'de Z'dir çünkü desteklenen locale seti, RTL politikası, fallback zinciri, para/tarih biçimlendirme ve tax-legal-localization + data-residency kararları kapsam düzeyinde alınır; bu politika alt seviyelere miras kalır. archetype'ta Z (çevrilebilir metin ve locale-farkında biçimlendirme somut yüzeyde doğar). stone/molecule/element'te Ö (çevrilebilir string taşıyan bir alt yüzey de aynı politikaya tabidir). Saf-backend sabit veya kullanıcıya görünmeyen/locale taşımayan atom'da N/A: gerekçe olarak "çevrilebilir metin veya locale-farkında değer yok; i18n üst frontend-ui/surface düğümünde kanıtlanır" yazılır. surface yüzeyi `techProfileRef` gibi seviye-üstü bağlanır; taşıdığı çevrilebilir metin için i18n politikasını devralır.
- atom seviyesinde çoğu standart N/A'dır çünkü atom "tek satır değişiklik, tek sabit"tir (task-to-code-contract §1); kanıtı ve standardı üst düğümden devralır. Yalnız `coding-standards`/`short-code`/`testing-strategy` Ö kalır (tek satır da kodlama kuralına uymalı).

---

## 2.1 Yeni Primitifler × Uygulanabilirlik

Bu oturumda eklenen çekirdek primitifleri (kernel + P0 domain) hangi seviyede/yüzeyde doğduklarını ve hangi standart eksenine bağlandıklarını tek bakışta verir. Bunlar standart sözleşmesi değil, çekirdek düğüm/alan primitifleridir; standart uygulanabilirliği §2/§3 kurallarını izler. Tipik seviye = primitifin en doğal doğduğu WBS seviyesi.

| Primitif | Tipik seviye / yüzey | Ne taşır | Baskın standart ekseni | Not |
|---|---|---|---|---|
| Actor | archetype (backend) | Kimlik/rol/özne modeli; PDP girdisi | architecture, data-api-contract | AI üretemez/override edemez; insan onayı (bkz. eca-directive) |
| Capability | archetype (backend) | İzin/yetenek atomu; PDP değerlendirir | architecture, ai-governance | AI yalnız taslak önerir |
| PDP (Policy Decision Point) | archetype / module (backend) | Yetki kararı motoru (permit/deny) | architecture, testing-strategy | AI politika değiştiremez |
| Mode-Profile | module / archetype | Çalışma-modu/özellik profili anahtarı | architecture, tech-profiles | AI üretemez/override edemez |
| Computation | archetype (backend) | Saf hesap/formül birimi; deterministik | coding-standards, testing-strategy | scale-invariant birimlerle çalışır |
| field-types | archetype / stone (data-schema) | Tipli alan taksonomisi (locale/currency/unit dahil) | data-api-contract, i18n-standards | locale/currency alanları i18n'e tabi |
| scale-invariant | archetype / stone | Ölçek/birim-bağımsız değer tipi | coding-standards, data-api-contract | birim dönüşümü kayıpsız |
| sequence | archetype (backend) | Sıra/numaralandırma üreteci (jurisdiction-farkında olabilir) | data-api-contract | i18n/jurisdiction biçimini devralır |
| calendar-capacity | module / archetype | Takvim + kapasite/vardiya modeli | data-api-contract, i18n-standards | timezone/locale takvimi i18n'e tabi |
| genealogy | archetype (data-schema) | Soy-ağacı/izlenebilirlik (lot/batch) grafiği | data-api-contract, testing-strategy | append-only izlenebilirlik |
| edge-gateway | module (infra-ops) | Kenar/ağ geçidi köprüsü (OT/IoT sınırı) | architecture, observability | data-residency sınırına dikkat |
| kpi-registry | module / archetype | KPI/metrik tanım kayıt defteri | observability, data-api-contract | tek-kaynak metrik sözleşmesi |
| aps (advanced planning-scheduling) | module / archetype | İleri planlama-çizelgeleme motoru | architecture, testing-strategy | calendar-capacity + computation tüketir |
| jurisdiction | module (backend) | Yargı-alanı/vergi/yasal-yerelleştirme + data-residency politikası | i18n-standards, dependency-policy | AI değiştiremez; tax-legal-localization kaynağı |

Kural: bu primitifler doğdukları seviyenin yüzey sınıfına ait Z standart setini (§2, §5) devralır. locale/currency/timezone/jurisdiction taşıyan primitifler (field-types, sequence, calendar-capacity, jurisdiction) ek olarak `i18n-standards` (Z) kapsamındadır. Actor/Capability/PDP/Mode-Profile/jurisdiction politikaları AI tarafından üretilemez veya override edilemez; yalnız taslak önerilir, insan onaylar (claude-ai-archetype-eca-directive.md).

---

## 3. Boyut Ailesi × Seviye Matrisi

ADR-0027 14 boyutu altı aileye (`DIMENSION_FAMILY`, `src/schemas/task.ts`) atar. Bu matris aile düzeyinde uygulanabilirliği seviyeye göre verir; aile içindeki tekil boyutların düğüm-bazlı N/A kararı §4'teki disiplinle verilir.

Aile → boyut eşlemesi (kaynak: `DIMENSION_FAMILY`):

| Aile | İçindeki boyutlar |
|---|---|
| functional | featureDefs, moduleUsage, integration |
| runtime-quality | security, securityOptimization, performance, mobileApps, wcag, owasp |
| engineering | codeOptimization |
| operations | deployment |
| automation | eca, aiAgents |
| verification | testing |

Aile × seviye:

| Aile | app | module | archetype | stone | molecule | element | atom |
|---|---|---|---|---|---|---|---|
| functional | Z | Z | Z | Z | Ö | Ö | N/A |
| runtime-quality | Ö | Ö | Z | Z | Ö | Ö | N/A |
| engineering | N/A | Ö | Z | Z | Z | Ö | Ö |
| operations | Ö | Z | Z | Ö | N/A | N/A | N/A |
| automation | Ö | Ö | Z | Ö | Ö | N/A | N/A |
| verification | Ö | Z | Z | Z | Z | Z | Ö |

Okuma kuralı:

- **functional** (özellik tanımı, modül kullanımı, entegrasyon) app/module/archetype'ta Z'dir çünkü "ne inşa ediliyor" bu seviyelerde tanımlanır. element/atom'da N/A: tekil bir CSS kuralında "özellik tanımı" anlamsızdır.
- **runtime-quality** (güvenlik, performans, mobile, WCAG, OWASP) app/module'de Ö (kapsam kararı), archetype/stone'da Z (somut yüzey burada doğar). Bu ailenin tekil boyutları yüzefe göre sık N/A olur — §4'e bakınız.
- **engineering** (kod optimizasyonu) app'te N/A (kod yok), kod taşıyan her seviyede Z/Ö. atom'da bile Ö: tek satır da gereksiz karmaşıklık taşımamalı (short-code felsefesi).
- **operations** (deployment) module'de Z (release train üyeliği), archetype'ta Z (en küçük deploy birimi — task-to-code-contract §4). molecule ve altı N/A: bağımsız deploy edilmezler.
- **automation** (ECA, AI ajan) archetype'ta Z (ECA kuralları ve agentPolicy burada anlam kazanır), element/atom'da N/A.
- **verification** (testing) test-önce felsefe gereği neredeyse her yerde zorunlu; yalnız atom'da Ö (üst test yeterli).

---

## 4. N/A Disiplini — Gerekçeli "Uygulanmaz" Nasıl Yazılır

N/A keyfi değildir. Boyut ekseninde `applicability[dimKey].applies=false` SET edilirse `reason` ZORUNLUdur; `check-dimension-applicability` (BLOKLAYICI) gerekçesiz N/A'yı kırmızı yapar. Amaç ADR-0027'deki "jenerik dolgu yerine N/A disiplini" ilkesidir: uygulanmayan boyut "N/A" gösterilir, jenerik çöple doldurulmaz.

### 4.1 Saf-backend atom: wcag + mobileApps N/A

Bir saf-backend atom (ör. bir Pydantic doğrulayıcı, bir SQL sabiti) kullanıcıya görünen yüzey üretmez. WCAG (erişilebilirlik) ve mobileApps (iOS/Android/Chrome ext uyumu) boyutları bu düğümde anlamsızdır. Doğru kayıt:

```json
"applicability": {
  "wcag": { "applies": false, "reason": "Saf-backend doğrulayıcı; kullanıcıya görünen DOM/CSS yüzeyi yok. Erişilebilirlik üst frontend-ui düğümünde kanıtlanır." },
  "mobileApps": { "applies": false, "reason": "Sunucu tarafı sabit; istemci platformu (iOS/Android/ext) yüzeyi yok." }
}
```

Bu kayıt yalnızca bir değer SET ettiği için ilgili düğüm dosyasına yazılır (lazy migration — dimension-migration-runbook.md). Diğer boyutlar dosyada görünmese de varsayılan `applies=true` ile uygulanır sayılır.

### 4.2 Doküman düğümü (app/module/ADR): deployment + birçok runtime boyutu N/A

doc-governance yüzefindeki bir düğüm (app, module veya bir ADR düğümü) çalışan kod taşımaz; kapsam ve sözleşme taşır. deployment boyutu (Swarm/Kubernetes/shared hosting uyumu) bu düğümde doğrudan anlamsızdır — deploy birimi archetype'tır (task-to-code-contract §4). Doğru kayıt:

```json
"applicability": {
  "deployment": { "applies": false, "reason": "Doküman/kapsam düğümü; bağımsız deploy birimi değil. Deploy archetype seviyesinde gerçekleşir." },
  "performance": { "applies": false, "reason": "Kod yüzeyi yok; p95/throughput hedefi alt archetype düğümlerinde ölçülür." }
}
```

### 4.3 N/A yazma kuralları

- Gerekçe (reason) somut olmalı: "uygulanmaz" gibi boş tekrar değil; NEDEN uygulanmadığı + kanıtın NEREDE üretildiği yazılmalı.
- N/A bir boyutu sonsuza dek kapatmaz; düğümün yüzefi değişirse (ör. backend atom'a bir CLI çıktısı eklenirse) `applies` yeniden `true` yapılır.
- Standart ekseninde N/A için ayrı bir flag yoktur: ilgili `standardRefs.<key>` alanı boş bırakılır. `check-standards-coverage` boş ref'i serbest (lazy) sayar; yalnız SET edilmiş ama çözülemeyen ref kırmızı olur.
- N/A ile waiver karıştırılmamalıdır: N/A "bu boyut burada anlamsız" demektir; waiver "uygulanması GEREKEN bir standarttan bilinçli, onaylı, süreli sapma" demektir. Bir standardı atlamak istiyorsan ama o seviyede Z ise, N/A değil waiver kullan (check-waivers zorlar).

---

## 5. Seviye + Yüzey Birleşik Karar Tablosu

Bu tablo §2 ve §3'ü tek bir operasyonel görünümde birleştirir: bir düğümü açtığında seviye ve yüzefe göre zorunlu standart/boyut setini verir.

| Seviye | Yüzey sınıfı | Zorunlu (Z) standartlar | Zorunlu (Z) boyut aileleri | Tipik N/A boyutlar |
|---|---|---|---|---|
| app | doc-governance | architecture, release-versioning, ai-governance, tech-profiles | functional | deployment, wcag, mobileApps, performance, owasp |
| module | doc-governance | architecture, data-api-contract, observability, release-versioning, dependency-policy | functional, operations, verification | wcag, mobileApps (kapsam değil yüzey) |
| archetype | backend / data-schema | architecture, coding-standards, short-code, data-api-contract, quality-gates, testing-strategy | functional, runtime-quality, engineering, automation, verification | wcag, mobileApps (saf-backend ise) |
| archetype | frontend-ui | coding-standards, design-system, ui-components, ux-interaction, state-management, testing-strategy | runtime-quality (wcag dahil), engineering, verification | (azı) — wcag/mobileApps burada Z |
| archetype | api-contract | data-api-contract, coding-standards, quality-gates, testing-strategy | functional, runtime-quality, verification | wcag, mobileApps |
| stone | (üst archetype yüzefini devralır) | coding-standards, short-code, testing-strategy + üst yüzey standartları | engineering, verification + üst aileler | üst yüzefe bağlı |
| molecule | (üst stone yüzefini devralır) | coding-standards, short-code, testing-strategy | engineering, verification | runtime-quality çoğu Ö'ye düşer |
| element | (üst molecule yüzefini devralır) | coding-standards, testing-strategy | engineering, verification | functional, automation, operations |
| atom | (üst element yüzefini devralır) | (Ö) coding-standards, testing-strategy | (Ö) engineering, verification | neredeyse tümü N/A; üst kanıt yeterli |

Kurallar:

- **Devralma:** stone ve altı, üst archetype'ın yüzey sınıfını ve dolayısıyla zorunlu standart setini devralır. Bir frontend-ui archetype altındaki molecule de design-system + ui-components Z setine tabidir.
- **Birleşim:** bir archetype iki yüzefe dokunuyorsa (data-schema + api-contract) her ikisinin Z seti birleşik uygulanır.
- **app/module istisna:** bu iki seviyede kod-üretim standartları (coding-standards, design-system, ui-components) Z DEĞİLdir; sözleşme/mimari standartları Z'dir. Doğrudan development fazına girip bu seviyelerde kod yazmak task-to-code-contract §6 Uyarı 1'e göre yanlıştır.

---

## 6. CI Bağı — Bu Matris Nasıl Zorlanır

Matris insan-okunur disiplindir; makine tarafı üç BLOKLAYICI kapıyla bağlanır (hepsi `src/data/generated/nodes` altındaki 445 düğümü tarar):

| Kapı (tools/agents) | Ne zorlar | Matristeki karşılığı |
|---|---|---|
| check-standards-coverage | SET edilen her `standardRefs.<key>` gerçek bir `src/data/standards/<id>.json` (veya techProfileRef için tech-profiles.json id'sine) çözülmeli. Boş ref serbest. | §2 — Z işaretli standardın ref'i doğru çözülmeli; dangling ref kırmızı. |
| check-dimension-applicability | `applicability` anahtarı geçerli bir boyut anahtarı olmalı; `applies=false` ise `reason` zorunlu. | §3, §4 — N/A gerekçeli olmalı. |
| check-waivers | Her waiver id/scope/reason + approvedBy + date dolu; expires varsa geçerli ve geçmişte değil. | §4.3 — Z standardından sapma N/A değil waiver ile yapılır. |

Bu kapılar `deploy.yml` içinde çalışır (ADR-0027 §5). Matris bir öneri değil, bu kapıların insan tarafındaki referans tablosudur: kapı kırmızı olduğunda hangi seviyede ne beklendiğini bu doküman açıklar.

---

## Çelişki Bildirimi

Bu matris ADR-0027 ve task-to-code-contract'ın türevidir; o iki dokümanla çelişen bir madde saptanırsa kaynak dokümanlar önceliklidir ve bu matris güncellenir. Seviye tanımları (`WBS_LEVELS`), boyut anahtarları (`DIMENSION_KEYS`), boyut aileleri (`DIMENSION_FAMILY`) ve standart referans anahtarları (`StandardRefsSchema`) tek kaynak olarak `src/schemas/task.ts`'dedir; bu dosya değişirse matris yeniden hizalanmalıdır.

*Son güncelleme: 2026-06-29. Bir sonraki güncelleme yalnızca yeni standart eklendiğinde, yeni boyut/aile tanımlandığında veya yeni WBS seviyesi geldiğinde yapılmalıdır.*
