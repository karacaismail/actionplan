# Atom / Micro Step Gap ve Unknown-Unknowns Raporu

**Tarih:** 2026-07-12  
**Proje:** `metaframer` · marka: meta-framer · teknik sınıf: meta-framework  
**Kapsam:** `actionplan` içindeki `micro_step` görevleri, atomik değer tipi sözleşmeleri ve salt-okunur `platform` implementation gerçeği.  
**Durum:** Analiz ve öneri. Kanonik sözleşmeleri değiştirmez, ürün kodu üretmez.

## 1. Yönetici hükmü

### Güncel kapanış durumu — 2026-07-12

Rapor sonrasında `actionplan` kapsamındaki P0 tanım ve kapı açıkları uygulanmıştır:

- 19/19 micro-step atomu `src/data/atom-definition-registry.json` içinde tanımlıdır.
- 16 demonstrasyon atomu `task-demonstration` olarak code-start dışına alınmıştır.
- Üç CRM atomu `task-micro-step` olarak invariant, failure mode, allowed-files, non-goals, side-effect/risk, rollback, pozitif/negatif/edge test, evidence roll-up ve reviewer taşır.
- 17 zorunlu atomik değer tipi `src/data/value-atom-registry.ts` içinde tam sözleşmeyle tanımlıdır.
- Her değer atomu tipli params, 13 boyut, registry sürüm/yürürlük zamanı, runtime adapter/parity fingerprint, migration/downgrade, test vektörleri ve retirement bilgisi taşır.
- `qa:atom` registry kapsamını ve semantik şema testlerini birlikte çalıştırır.
- Kapı çıktısı tanım tamamlığını readiness'ten ayırır: `definitions=PASS`; aktif aday yoksa `readiness=NO_CANDIDATES`.

Kapanmayan P0 sınıfı `platform` runtime implementasyonudur. Bu rapor/actionplan rolü ürün kodu yazmaz; TypeDecorator, gerçek migration, frontend widget ve kırmızı→yeşil runtime kanıtı implementation ekibinin ayrı teslimatıdır. Tanım zemini tamamlanmıştır, yazılım tamamlanmış sayılmaz.

Atom katmanı tanım bakımından güçlü, yürütülebilirlik bakımından zayıftır. Repoda iki ayrı “atom” kavramı vardır:

1. **WBS atomu — `micro_step`:** tek değişiklik, tek fixture veya tek sabit gibi en küçük iş birimi.
2. **Veri atomu — atomik değer tipi:** `Money`, `Measure`, `Range<T>`, `Identifier` gibi bölünemez ve parametreli bütün-değer sözleşmesi.

Bu iki kavram belgelerde ayırt edilse de şema, düğüm tipi, CI raporu ve kullanıcı arayüzü düzeyinde yeterince ayrıştırılmamıştır. Sonuç olarak bir `micro_step` görevini tamamlamak ile bir atomik değer tipini tanımlamak aynı “atom hazır” söylemine karışabilir.

Güncel veri gerçeği:

- 467 WBS düğümünün yalnız 19'u `micro_step` seviyesindedir.
- 19/19 `backlog`, 19/19 `requirements` fazındadır.
- 16/19 yalnız “örnek kırılımı” niteliğindedir.
- 19/19 gerçek `repoPath` ve `testCommand` bağından yoksundur.
- 19/19 `dependsOn` bağı taşımamaktadır.
- 17/19 evidence taşımamaktadır.
- Yalnız 1/19 kabul kriteri pozitif ve negatif davranışı birlikte yaklaşık olarak tarif eder.
- `standardRefs` boşluğu eski rapora göre kapanmıştır; 19/19 düğüm artık referans taşır. Ancak referansın bulunması, atomun uygulanabilir olduğunu kanıtlamaz.
- `platform` checkout'unda `Money`, `Measure`, `I18nText`, `Range<T>` veya bir atomik TypeDecorator kütüphanesinin uygulanmış olduğuna dair kaynak kod kanıtı bulunmamıştır.
- `ready-for-dev` kapısı “development fazında 0 düğüm, 0 ihlal” sonucu ile yeşildir. Bu bir hazır olma kanıtı değil, denetlenecek aktif düğüm bulunmadığını gösteren **vacuous pass** durumudur.

**Nihai sonuç:** Meta-framework'ün Ada → Dağ → Kaya → Taş → Kum zinciri için atom tanım zemini artık tipli, testli ve parent kanıtına bağlıdır. Sıradaki gerçek eksik, bu tanımları implementation reposunda kod, migration, UI ve runtime evidence'a dönüştürmektir.

## 2. Kanonik tanımlar ve mevcut yönergeler

### 2.1 WBS atomu

`task-to-code-contract.md`, `micro_step` seviyesini “en küçük bölünemez adım; tek satır değişiklik, tek fixture, tek sabit” olarak tanımlar. Ayrı branch, PR veya deploy birimi değildir; üst `component` veya `feature` teslimatına katılır. Evidence üst kanıttan devralınabilir.

Bu tanımın güçlü yanı küçük değişiklik disiplinidir. Zayıf yanı “tek satır” ölçüsünün davranışsal atomiklik yerine metinsel küçüklüğe dönüşebilmesidir. Bir satır güvenlik politikası sistem çapında büyük etki yaratabilir; on satırlık saf bir doğrulayıcı ise tek davranışsal atom olabilir.

### 2.2 Veri atomu

`atomik-netlestirme-2026-07-01.md` atomu şu özelliklerle sınırlar:

- kimliği, bağımsız yaşam döngüsü ve ilişkisi yoktur;
- alt parçaları bağımsız iş alanı değildir;
- tek kanonik temsili ve bütün-değer eşitliği vardır;
- parametrelerle somutlaşır;
- motor ondan 13 sözleşme boyutunu türetir.

Karar sırası: kimlik varsa ArcheType; bağımsız anlamlı çok alan varsa Fragment; bütün-değer semantiği varsa Atom.

### 2.3 Tanımlanmış atomik geliştirme yönergeleri

| Kaynak | Tanımladığı disiplin | Güçlü taraf | Güncel yetersizlik |
|---|---|---|---|
| `task-to-code-contract.md` | Seviye, faz, branch, PR, evidence | WBS işi ile teslimatı bağlar | `micro_step` için dosya/test/parent sözleşmesini şemada zorlamaz |
| `atomik-netlestirme-2026-07-01.md` | Atom/Fragment/ArcheType ayrımı | Sınır testi nettir | Sınıflandırma kararı makine-okunur kayıt değildir |
| `atomic-types-directive.md` | 13 boyut, registry, backend/frontend, AI guardrail | Kurumsal atom sözleşmesi geniştir | 13 boyutun gerçek registry kaydı/şeması yoktur |
| `atomik-tip-gelistirici-yonergesi.md` | Beş testli geliştirici karar akışı | Uygulayıcıya iyi rehber verir | Çıktı formatı ve conformance artifact'i zorunlu değildir |
| `atomik-tip-katalogu-tam-2026-07-01.md` | A/B/C atom tip kataloğu | Eksik tipleri görünür kılar | Bazı durum etiketleri güncel şemaya göre eskidir |
| `fragments-directive.md` | Atom ile çok-alanlı kimliksiz kayıt sınırı | Address/PersonName/ContactPoint drift'ini önler | Polimorfik atom çözümü ve storage parity henüz yalnız sözleşmedir |
| `standards-applicability-matrix.md` | Atom seviyesinde N/A/devralma politikası | Gereksiz 17-boyut dolgusunu azaltır | “üst kanıt yeterli” bağının hangi parent/evidence olduğu tipli değildir |
| `check-atomic-types.mjs` | 17 ad, dört doküman ve node ref varlığı | En temel yapısal kaybı yakalar | Davranış, 13 boyut, params, registry sürümü, test ve implementation doğrulamaz |

### 2.4 Atomik tip için tanımlı 13 boyut

Yönergeler her veri atomu için şunları ister:

1. storage mapping,
2. validation,
3. parameterization,
4. canonicalization/collation,
5. compare/order,
6. equality/fuzzy matching,
7. indexability,
8. i18n,
9. null/empty/unknown/N-A,
10. serialization,
11. surface projection,
12. security class,
13. versioning/type promotion.

`FieldTypeSchema` geriye uyumluluk için tip adlarını enum olarak listeler ve eski `FieldSchema.params` alanı serbest kayıt biçimini korur. Yeni atom tanım yolu bu açığı `ValueAtomDefinitionSchema.params` discriminated union'ı ile kapatır: registry'deki Money, Range ve Identifier gibi atomlar yanlış, eksik veya tipe ait olmayan parametreyle parse olmaz. Eski serbest alan yeni atom tanımı veya readiness kanıtı sayılmaz.

## 3. Mevcut atomların kalite analizi

### 3.1 WBS `micro_step` envanteri

19 atomun üçü CRM pilotuna yakındır:

- `atom-crm-domain-blocklist`,
- `atom-crm-email-regex`,
- `atom-crm-score-range-check`.

Kalan 16 düğüm `app-*-x-atom` biçiminde demonstrasyon dalıdır. Bu düğümler gerçek bir dosya, fonksiyon, invariant veya test hedeflemediği için implementation backlog'u sayılmamalıdır.

### 3.2 Doluluk yanılsaması

Micro step düğümlerinde 17 üretim boyutunun “filled” olması, atomun hazır olduğu anlamına gelmemektedir. Örneğin saf backend atomunda mobil, WCAG, deployment ve ECA maddelerinin aynı anda doldurulması; atomun tek sorumluluğunu daraltmak yerine üst sistem gereksinimlerini yaprağa kopyalamaktadır.

Doğru model:

- atom yalnız doğrudan etkilediği boyutları taşır;
- uygulanmayan boyutlar gerekçeli N/A olur;
- devralınan boyut parent düğüm ve evidence kimliğiyle bağlanır;
- standart metni tekrarlanmaz, `standardRefs` ile referanslanır.

### 3.3 CI yeşili yanılsaması

`check-atomic-types` bugün şunları doğrular:

- 17 tip adının `archetype.ts` metninde geçmesi,
- dört yönerge dosyasının bulunması,
- `atomic-types` düğümünün yönergeye referans vermesi.

Şunları doğrulamaz:

- tip adının gerçekten `FieldTypeSchema` üyesi olarak parse edilmesi,
- her tipin zorunlu parametre şeması,
- 13 boyutun eksiksizliği,
- registry referansının sürüm kilidi,
- TypeDecorator veya eşdeğer runtime implementation,
- kırmızı→yeşil test vektörü,
- frontend/backend doğrulama paritesi,
- migration ve downgrade,
- güvenlik sınıfının PDP/maskeleme davranışı.

Bu nedenle “atomik tip katmanı yapı bütünlüğü tam” mesajı mevcut kapının kanıt gücünü aşmaktadır.

## 4. P0–P3 gap analizi

### P0 — Üretimi bloke eden açıklar

| Gap | Etki | Kapanma kanıtı |
|---|---|---|
| WBS atomu ile veri atomu aynı adla raporlanıyor | Yanlış “atom tamam” iddiası | `atomKind: task-micro-step | value-type` ayrımı veya eşdeğer tipli ayrım |
| Atomik tip registry'si yok | 13 boyut dokümanda kalır | Makine-okunur, şemalı ve versiyonlu field-type registry |
| `params` serbest sözlük | `Money`/`Range<T>` eksik veya yanlış parametreyle geçer | Discriminated union ile tip-bağlı params validation |
| Gerçek micro step'lerde repo/test bağı yok | Ajan hangi dosyada neyi değiştireceğini bilemez | Her aktif atomda `repoPath`, `allowedFiles`, `testCommand`, parent kimliği |
| CI kapısı varlık kontrolüyle yetiniyor | Sahte yeşil üretir | Negatif fixture'larla semantic conformance kapısı |
| Platform implementation kanıtı yok | Doküman tamam, ürün eksik kalır | TypeDecorator/runtime + test + migration + UI projection kanıt paketi |
| Vacuous pass ayrımı yok | 0 aday, 0 ihlal “hazır” sanılır | Kapı sonucu `PASS | FAIL | NOT_APPLICABLE | NO_CANDIDATES` |

### P1 — Güvenilirliği bozan açıklar

| Gap | Etki | Gerekli atom |
|---|---|---|
| Null semantiği yalnız `required` ile temsil ediliyor | unknown, empty, zero ve N/A karışır | `at-value-state-semantics` |
| Canonicalization sonucu sürümlü değil | Aynı değer zamanla farklı eşleşir | `at-canonicalization-version-pin` |
| Registry update politikası eksik | ISO/CLDR/UCUM değişimi geçmiş veriyi bozar | `at-registry-effective-dating` |
| Type promotion compatibility matrisi yok | string→enum/Money precision göçü veri kaybettirir | `at-type-promotion-compatibility` |
| Equality ile fuzzy match ayrımı tipli değil | Dedup yanlış kayıt birleştirir | `at-equality-vs-match-policy` |
| Parent evidence roll-up bağı tipli değil | Atom tamamlanır, üst teslimat kanıtsız kalır | `at-parent-evidence-rollup` |
| Risk seviyesi değişikliğin etkisinden türemiyor | Tek satırlık auth/migration değişikliği düşük risk sanılır | `at-change-impact-classification` |
| Backend/frontend parity hash'i yok | Aynı atom iki yüzeyde farklı doğrulanır | `at-validation-contract-parity` |

### P2 — Ölçek ve geliştirici deneyimi açıkları

- Atom seçimi kararının makine-okunur gerekçesi yoktur.
- Bir atomun “fazla büyük” olduğunu ölçen davranışsal bölünebilirlik kontrolü yoktur.
- `allowedFiles` ve `nonGoals` atom seviyesinde zorunlu değildir.
- Generated atomların provenance, prompt version ve human approval zinciri tek kayıt halinde değildir.
- Bir atomun hangi üst feature/component branch'inde yaşayacağı açık alan değildir.
- Tip kullanım telemetrisi yoktur; hangi atomun kaç ArcheType alanında kullanıldığı bilinmez.
- Deprecated tiplerin (`currency`, gevşek `number/json`) yeni kullanımı ratchet ile engellenmez.

### P3 — Dokümantasyon ve isimlendirme açıkları

- Eski katalog “Katman D atom” derken güncel netleştirme bu yapıları Fragment'e taşır; tarihsel belgelerde durum farkı belirginleştirilmelidir.
- `EntityRef` kavramı şemada çoğunlukla `relation` adıyla temsil edilir; yönerge/enum adları bire bir değildir.
- Enumda `enum` ve `enum-alias`, `file` ve `asset-ref`, `currency` ve `money` birlikte yaşar; deprecation ve yeni kullanım yasağı makinece görünür değildir.
- `micro_step` kabul kriteri şablonu pozitif/negatif/test adı biçimini zorlamaz.

## 5. Eksik atom backlog'u

### 5.1 Önce kurulması gereken meta-atomlar

| Önerilen ID | Tek davranış | Negatif test |
|---|---|---|
| `at-wbs-atom-kind-discriminator` | Görev atomu ile değer atomunu ayır | Ayrımsız `atom` kaydı reddedilir |
| `at-wbs-micro-step-parent-required` | Micro step yalnız work_unit/component parent'a bağlanır | app/module parent reddedilir |
| `at-wbs-micro-step-file-test-bind` | Aktif atom dosya + test komutu taşır | development adayı eksik bağla reddedilir |
| `at-wbs-micro-step-positive-negative-ac` | En az bir pozitif ve bir negatif AC test adına bağlanır | yalnız “çalışır” AC'si reddedilir |
| `at-wbs-example-atom-quarantine` | Demonstrasyon atomları code-start dışında kalır | örnek atom development'a geçemez |
| `at-wbs-parent-evidence-rollup` | Atom sonucu parent evidence paketine bağlanır | sahipsiz evidence reddedilir |
| `at-gate-no-candidates-state` | 0 aday sonucu PASS değil NO_CANDIDATES olur | vacuous green reddedilir |

### 5.2 Atomik değer tipi registry atomları

| Önerilen ID | Tek davranış | Negatif test |
|---|---|---|
| `at-fieldtype-contract-schema` | Her atom 13 boyutlu tipli sözleşme taşır | eksik boyut parse olmaz |
| `at-fieldtype-params-discriminated` | Params atom tipine göre doğrulanır | Money currency-set olmadan reddedilir |
| `at-fieldtype-registry-version-pin` | Dış registry ref + version zorunludur | sürümsüz UCUM/CLDR ref reddedilir |
| `at-fieldtype-deprecation-ratchet` | Deprecated tipe yeni alan açılamaz | yeni `currency`/gevşek `json` kullanımı reddedilir |
| `at-fieldtype-runtime-implementation-ref` | Sözleşme runtime adapter yoluna bağlanır | implementation ref olmayan “implemented” olamaz |
| `at-fieldtype-test-vector-ref` | Her tip pozitif/negatif/edge vector taşır | yalnız happy-path tip reddedilir |
| `at-fieldtype-parity-fingerprint` | Backend ve frontend aynı sözleşme hash'ini kullanır | farklı hash build'i kırar |
| `at-fieldtype-migration-matrix` | Kaynak→hedef tip terfisi açıkça sınıflanır | bilinmeyen destructive terfi reddedilir |

### 5.3 İlk gerçek dikey dilim atomları

İlk uygulama dilimi bütün kataloğu birden üretmemelidir. En yüksek kaldıraçlı sıra:

1. `decimal` storage + kesin aritmetik,
2. `Money` params + currency mismatch,
3. Money null/empty/zero ayrımı,
4. Money kanonik serialization,
5. Money security/audit sınıfı,
6. Money migration/downgrade,
7. Money UI projection ve backend/frontend parity,
8. conformance kapısında eksik boyut ve yanlış params negatif fixture'ları.

Bu dilim tamamlanmadan Measure, Range, I18nText veya kimlik atomlarına paralel genişleme yapılmamalıdır; aksi halde zayıf registry ve params modeli çoğalır.

## 6. Unknown-unknowns analizi

### U1 — Atomiklik değişiklik büyüklüğü müdür, davranış sınırı mıdır?

“Tek satır” ölçüsü güvenilir değildir. Bir RLS policy satırı onlarca tenant'ı etkileyebilir. Atomiklik için değişen satır sayısından önce tek invariant, tek failure mode ve tek rollback sınırı ölçülmelidir.

### U2 — Kanonikleştirme algoritması değişince geçmiş eşitlik ne olur?

Email/phone/adres normalize algoritması güncellenirse aynı ham değer farklı canonical değer üretebilir. Versiyon alanı ve re-canonicalization migration'ı yoksa dedup sonuçları sessizce değişebilir.

### U3 — Registry'nin “as-of” zamanı nedir?

Bugünkü ISO/CLDR/UCUM verisiyle geçmiş işlem doğrulanırsa tarihsel olarak geçerli değer reddedilebilir. Registry sürümü yanında effective-from/effective-to veya işlem-zamanı çözümü gerekebilir.

### U4 — Parametre değişikliği tip değişikliği midir?

`Money.precision=2 → 4`, `Range.bounds=[) → []` veya Identifier checksum algoritması değişimi enum tipini değiştirmez ama semantiği değiştirir. Migration motorunun bunu type promotion olarak görüp görmeyeceği açık değildir.

### U5 — Fuzzy equality finansal veya kimlik atomuna sızarsa ne olur?

Katalog equality/fuzzy boyutunu birlikte anıyor. Para, IBAN ve NationalId için fuzzy eşleşme yasak olmalı; PersonName/Address gibi Fragment'lerde ise skorlu matching olabilir. Tek ortak boyut yanlış güvenlik varsayımı doğurabilir.

### U6 — Şifreleme sonrası index ve uniqueness nasıl korunur?

PII atomlar maskelenip şifrelenirken exact lookup, uniqueness ve tenant-scoped dedup için deterministic token/HMAC gibi ayrı bir arama temsili gerekebilir. Bu temsil rotation ve silme politikasını karmaşıklaştırır.

### U7 — Offline istemcinin eski atom sözleşmesiyle yazması ne olur?

Mobil istemci registry v2 ile oluşturulmuş veriyi registry v3 backend'e gönderdiğinde kabul, dönüştürme veya yeniden-onay davranışı tanımlı değildir. Parity yalnız aynı build için değil, desteklenen sözleşme penceresi için ele alınmalıdır.

### U8 — Generated API şeması atom parametrelerini kaybediyor mu?

GraphQL scalar veya OpenAPI schema yalnız `string/number` gösterirse precision, registry ve security semantiği istemciye taşınmaz. Contract round-trip testi olmadan metadata kaybı fark edilmeyebilir.

### U9 — Atom kullanımından kaldırıldığında veri kim temizler?

Bir FieldType deprecated olsa bile milyonlarca kayıtta yaşayabilir. Katalog kaydı, runtime adapter, migration ve historical reader farklı hızlarda emekliye ayrılırsa eski audit kayıtları okunamaz hale gelebilir.

### U10 — Parent rollback atomun etkisini gerçekten geri alabilir mi?

Micro step ayrı rollback taşımıyor. Ancak dış webhook, notification veya ödeme side-effect'i üreten küçük değişiklik parent rollback ile geri alınamaz. “Üst rollback yeterli” yalnız reversible local change için geçerli olmalıdır.

### U11 — AI'ın ürettiği test aynı yanlış varsayımı tekrar ederse ne olur?

Test ve implementasyon aynı prompt/sözleşme hatasından üretilebilir. Kritik atomlarda independent reviewer, property-based test, metamorphic test veya dış standardın resmi vektörleri gereklidir.

### U12 — Atom patlaması ve aşırı soyutlama nerede durur?

Her küçük doğrulama ayrı micro step yapılırsa WBS yönetilemez; her semantik varyant ayrı FieldType yapılırsa registry patlar. Parametre ile yeni tip arasındaki karar için reuse count, farklı storage/validation/security davranışı ve migration bağımsızlığı eşiği gerekir.

## 7. Önerilen kapı modeli

Yeni atom kapısı dört ayrı sonucu raporlamalıdır:

- `PASS`: aday var ve tüm kontroller geçti.
- `FAIL`: aday var ve ihlal bulundu.
- `NO_CANDIDATES`: denetlenecek aktif atom yok.
- `NOT_APPLICABLE`: değişiklik atom kapsamına girmiyor.

Bir `micro_step` code-start adayı için minimum DoR:

1. parent `work_unit` veya `component`,
2. tek invariant ve tek failure mode,
3. `repoPath` ve dar `allowedFiles`,
4. çalıştırılabilir `testCommand`,
5. pozitif + negatif AC ve test isimleri,
6. gerekli `dependsOn` veya gerekçeli bağımsızlık,
7. doğrudan standard refs,
8. risk/side-effect/rollback sınıfı,
9. parent evidence roll-up hedefi,
10. human reviewer.

Bir atomik değer tipi için minimum DoR:

1. atom/Fragment/ArcheType sınıflandırma gerekçesi,
2. tipli params,
3. 13 boyutun tamamı,
4. registry ref + version/effective-time,
5. runtime adapter ref,
6. pozitif/negatif/edge test vector,
7. migration ve backward-reader stratejisi,
8. backend/frontend serialization parity,
9. security ve tenant davranışı,
10. deprecation/retirement planı.

## 8. Sıralı kapanış planı

### Wave 0 — Sözcük ve kapı doğruluğu

- WBS atomu ile atomik değer tipini makinece ayır.
- `NO_CANDIDATES` sonucunu kapılara ekle.
- 16 demonstrasyon atomunu code-start dışına karantinaya al.

### Wave 1 — Şemalı atom registry'si

- 13 boyutlu `FieldTypeContract` taslağını test-önce tanımla.
- `params` alanını discriminated union yap.
- registry version/effective-time ve deprecation ratchet ekle.

### Wave 2 — Gerçek micro step sözleşmesi

- Parent, allowed-files, test-map, negative-vector ve evidence-rollup alanlarını ekle.
- `micro_step` DoR kapısını negatif fixture'larla kanıtla.

### Wave 3 — Money golden slice

- Önce kırmızı test vektörleri.
- Decimal + Money runtime adapter.
- Migration/downgrade.
- API serialization + UI projection parity.
- Parent evidence paketi.

### Wave 4 — Kontrollü genişleme

- Measure, Range, I18nText ve Identifier sırasıyla.
- Her yeni tipte aynı conformance ve retirement modeli.
- Kullanım telemetrisiyle gerçekten gereken tipleri öncele.

## 9. Rapor kabul kriterleri ve sonraki karar

Bu raporun önerdiği iyileştirme tamamlanmış sayılmaz; aşağıdaki kanıtlar oluştuğunda atom zemini güvenilir kabul edilir:

- Aktif gerçek micro step sayısı sıfırdan büyüktür ve %100'ü parent/repo/test/negative-AC bağı taşır.
- Demonstrasyon atomlarının hiçbiri code-start adayı değildir.
- `check-atomic-types` yanlış params, eksik boyut, sürümsüz registry ve eksik runtime ref fixture'larında kırmızıdır.
- Kapılar 0 aday durumunu yeşil başarı olarak raporlamaz.
- En az bir Money golden slice kırmızı→yeşil test, migration downgrade, API/UI parity ve parent evidence paketiyle doğrulanmıştır.
- `platform` implementation kanıtı olmadan “atom katmanı tamam” veya “meta-framework hazır” denmez.

**Önerilen ilk karar:** Önce Wave 0 + Wave 1 için insan onaylı changeset hazırlanmalı; gerçek Money implementasyonu ancak şemalı registry ve güçlendirilmiş atom kapısı hazır olduktan sonra implementation ekibine açılmalıdır.

### 9.1 Uygulanan tanım sertleştirmesi — 2026-07-12

Bu raporun Wave 0/1 şema zemini uygulanmıştır:

- `src/schemas/atom.ts` ile `task-micro-step` ve `value-type` ayrılmıştır.
- WBS atomu invariant/change/failureMode, allowedFiles/nonGoals, sideEffect/risk, rollback, pozitif-negatif test, evidence roll-up ve reviewer olmadan tam sayılmaz.
- Değer atomu tipli params, 13 boyut, registry version/effective date, backend/frontend adapter fingerprint, migration/backward reader/downgrade, test vektörleri ve retirement sözleşmesi taşır.
- `TaskNode.atomDefinition` geriye uyumlu eklenmiş; yanlış WBS seviyesine task atomu bağlamak reddedilmiştir.
- `qa:atom`, aktif micro step'lerde tam tanımı zorlar ve aday yoksa `NO_CANDIDATES` raporlar.

Bu sertleştirme platform runtime implementasyonu değildir. Mevcut 19 atomun tanım işi tamamlanmıştır; üç yürütülebilir CRM atomu hedef `platform` dosyaları ve kırmızı testler gerçekten oluşturulduğunda `todo/test-plan` durumuna alınmalıdır. 16 demonstrasyon atomu promotion kriterleri karşılanmadan yürütmeye açılamaz.

### 9.2 Gap kapanış matrisi

| Gap | Durum | Kanıt |
|---|---|---|
| WBS atomu / değer atomu ayrımı | Kapandı | `AtomDefinitionSchema` kind union |
| 19 micro-step tanım eksikliği | Kapandı | `atom-definition-registry.json`, 19/19 |
| Demonstrasyonların code-start riski | Kapandı | 16 `task-demonstration` + promotion criteria |
| Micro-step dosya/test/negative/evidence sözleşmesi | Kapandı | Üç yürütülebilir CRM atomu + schema tests |
| 13 boyutlu değer atom registry'si | Kapandı | `VALUE_ATOM_REGISTRY`, 17/17 |
| Tip-bağlı params | Kapandı | `ValueAtomParamsSchema` discriminated union |
| Registry sürümü/effective-time | Kapandı | Registry-dependent atom testleri |
| Backend/frontend parity tanımı | Tanım kapandı | Adapter refs + contract fingerprint |
| Vacuous PASS | Kapandı | `NO_CANDIDATES` durumu |
| Semantik atom CI | Kapandı | `qa:atom` conformance testleri |
| Platform runtime adapterları | Açık — implementation kapsamı | Hedef ref var; gerçek kaynak/test henüz yok |
| Migration/UI/e2e runtime evidence | Açık — implementation kapsamı | Gerçek PR/CI/deploy kanıtı bekleniyor |

## 10. Kanıt kaynakları

- `AGENTS.md`
- `src/schemas/task.ts`
- `src/schemas/archetype.ts`
- `src/data/generated/nodes/*.json`
- `tools/agents/check-atomic-types.mjs`
- `tools/agents/check-fragments.mjs`
- `tools/agents/check-ready-for-dev.mjs`
- `tools/agents/check-vibecoding-ready.mjs`
- `docs/task-to-code-contract.md`
- `docs/standards-applicability-matrix.md`
- `docs/atomik-netlestirme-2026-07-01.md`
- `docs/atomic-types-directive.md`
- `docs/atomik-tip-gelistirici-yonergesi.md`
- `docs/atomik-tip-katalogu-tam-2026-07-01.md`
- `docs/fragments-directive.md`
- Salt-okunur implementation kontrolü: `../platform`
