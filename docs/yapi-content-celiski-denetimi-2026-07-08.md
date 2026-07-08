# Actionplan yapi / content / celiski denetimi - 2026-07-08

> Güncellik notu (2026-07-08): Bu rapor önceki bir yerel snapshot'ın denetim kaydıdır. Güncel canonical gerçeklik: `src/schemas/task.ts` 17 üretim boyutu, `src/data/generated/meta.json` 467 düğüm, `npm run qa:content` exact-17 kapısı ve `docs/task-to-code-contract.md` handoff sözleşmesidir. Aşağıdaki eski 14-boyut/remote commit bulguları tarihsel kayıt olarak korunur.

## Kapsam

Bu rapor, `/Users/karaca/DEV/mimari/actionplan` reposunun mevcut yerel durumunda uretilmistir.
Denetim yeni gelistirme yapmaz; schema, generated node verisi, docs, standart kapilar ve ifade kalitesi uzerinden eksik/celiski arar.

Yerel durum:

- Branch: `codex/w5-measured-short`
- Remote `origin/main`: `2875a2cf4b3342eb18f4897333299ae3b973a4c6`
- Yerel worktree kirli; W10 temizligi ve onceki staged/unstaged katmanlar henuz commit/push edilmemis durumda.
- Schema dogrusu: `1.1.0`, 7 WBS seviyesi, 17 uretim boyutu. Eski 14 boyutlu dugumler lazy migration ile gecerlidir.

## Kisa karar

Kapilar yesil; fakat icerik yapisi "tamamlanmis teslimat sistemi" degil, agirlikli olarak plan ve denetim yuzeyi durumunda.

En kritik eksikler:

1. Gercek teslimat kaniti ve kod baglantisi buyuk olcude bos.
2. 7 dugumde `implementationStatus` ile `status/phase` birbiriyle uyumsuz.
3. Eski docs dosyalari guncel generated data ile celisiyor.
4. Terminolojide `work_unit/molekül` ve `*-x-molekul` artigi var; guncel schema `component/kum` diyor.
5. Exact-repeat kapilari gecilse de ifade kalitesi halen mekanik: cok tekrar eden kaliplar ve 268 adet rastgele 5 harfli generator token'i var.

## Gecen kapilar

Asagidaki kontroller mevcut yerel durumda yesil:

- `node tools/agents/check-dimension-semantics.mjs`
  - 467 node
  - 7802 filled card
  - semantic `FAIL 0`, `WARN 0`
- `node tools/agents/check-content.mjs`
  - forbidden marker `0`
  - out-of-bound content `0`
  - format ihlali `0`
  - repeat >=5 exact `0`
  - 14/17 dimension ihlali `0`
- `node tools/agents/check-weak-content.mjs`
  - short-items `56`
  - measuredShort `1`
  - generic `0`
  - empty-but-not-na `0`
  - missingRef `0`
  - semanticWarn `0`
  - consciousNa `44`
- `node tools/agents/check-data-quality.mjs`
  - owner `467/467`
  - valid team `9`
- `node tools/agents/check-ready-for-dev.mjs`
  - yesil, fakat sebep: development fazinda dugum yok.
- `node tools/agents/check-execution-readiness.mjs`
  - yesil, fakat sebep: done/dev+ dugum yok.
- `node tools/agents/check-execution-contract.mjs`
- `node tools/agents/check-core-contract.mjs`
- `node tools/agents/check-surface.mjs`
- `node tools/agents/check-event-semantics.mjs`

## Yapinin sayisal resmi

Generated node sayisi: `467`

Seviye dagilimi:

- app: `28`
- module: `178`
- archetype: `105`
- feature: `101`
- component: `18`
- work_unit: `18`
- micro_step: `19`

Durum/faz:

- `status=backlog`: `467`
- `phase=requirements`: `467`

Bu, veri setinin bugunku haliyle uretime hazir teslimat envanteri degil, plan ve gereksinim havuzu oldugunu gosterir.

## P0 bulgular

### 1. Kanit ve gercek kod baglantisi buyuk olcude bos

Alan doluluklari:

- `evidence` bos: `460/467`
- `traceability.repoPath` bos: `460/467`
- `traceability.testCommand` bos: `460/467`
- `traceability.deployTarget` bos: `447/467`
- `traceability.implementationStatus` bos/default: `447/467`
- `metrics` bos: `441/467`

Bu alanlar schema'da opsiyonel oldugu icin kapilar kirmiyor. Fakat urun teslimati acisindan kritik eksik burada: dugumlerin buyuk cogunlugu hangi repo dosyasina, hangi test komutuna, hangi deploy hedefine ve hangi kanita baglandigini soylemiyor.

### 2. State / traceability celiskisi var

7 dugumde `traceability.implementationStatus` ilerlemis gorunurken ana plan durumu halen `status=backlog`, `phase=requirements`.

Ornekler:

- `app-core-operations`: `implementationStatus=in-progress`, fakat `status=backlog`, `phase=requirements`
- `customer`: `implementationStatus=scaffolded`, fakat `status=backlog`, `phase=requirements`
- `molekul-crm-score-weight-config`: `implementationStatus=in-progress`, fakat `status=backlog`, `phase=requirements`
- `m-crm-sales`: `implementationStatus=in-progress`, fakat `status=backlog`, `phase=requirements`
- `product`: `implementationStatus=scaffolded`, fakat `status=backlog`, `phase=requirements`
- `s-crm`: `implementationStatus=in-progress`, fakat `status=backlog`, `phase=requirements`
- `tas-crm-lead-mgmt`: `implementationStatus=in-progress`, fakat `status=backlog`, `phase=requirements`

Bu teknik olarak warning; semantik olarak celiski. Ya plan state'i ilerletilmeli ya da traceability durumlari geri cekilmeli.

### 3. Docs katmaninda eski gerceklikler guncel data ile celisiyor

Guncel generated data `467` node ve yesil kalite kapilari gosterirken bazi docs eski metrikleri tasiyor.

Ornek eski/yaniltici alanlar:

- `docs/eylem-plani-derinlestirme-master.md`: 422 node / 14 boyut / eski weak-page sayilari
- `docs/next-30-days-plan.md`: eski owner/ref bosluk sayilari
- `docs/governance-plan.md`: 14 boyut vurgusu
- `docs/dimension-migration-runbook.md`: tarihsel lazy migration bilgisi; baglamsiz okunursa guncel 17 boyut standardiyla karisiyor
- `docs/PENDING-HUMAN-FIXES-2026-07-01.md`: tarihsel pending listesi; bugunku durumla karismamasi icin archive/stale isareti gerekir
- `docs/.fuse_hidden*`, `docs/zz-scratch.txt`, `docs/drafts/*`: repo geneli grep/okuma yapan insan veya agent icin gurultu uretiyor

## P1 bulgular

### 4. 31 dugum halen 14 boyutlu

Schema bunu bilerek kabul ediyor: eski 14 boyutlu dugumler lazy migration ile valid.
Fakat "tum uretim dugumleri 17 boyut dolu" gibi bir iddia varsa bu dogru degil.

Eksik boyutlar:

- `dataLifecycle`: 31 dugumde eksik/skeleton
- `observability`: 31 dugumde eksik/skeleton
- `reliability`: 31 dugumde eksik/skeleton
- `mobileApps`: 22 dugumde eksik/skeleton
- `wcag`: 22 dugumde eksik/skeleton

Ornek 14 boyutlu/eksik dugumler:

- `app-backend-x-atom`
- `app-backend-x-molekul`
- `app-build-x-atom`
- `app-build-x-molekul`
- `app-content-collaboration-x-atom`
- `app-content-collaboration-x-molekul`
- `app-crosscut-x-atom`
- `app-crosscut-x-molekul`
- `app-customer-revenue-x-atom`
- `app-customer-revenue-x-molekul`

### 5. WBS terminolojisi tutarsizligi var

Schema dogrusu:

- `app = ada`
- `module = dag`
- `archetype = kaya`
- `feature = tas`
- `component = kum`
- `work_unit = molekul`
- `micro_step = atom`

Bulunan drift:

- `work_unit/molekül` prompt artigi: `18` node
- `*-x-molekul` id/title artigi: en az `16` node
- `tas/kum` prompt kisa yolu: `95` node
- `modul/kaya` prompt kisa yolu: `149` node

Ornek:

- `src/data/generated/nodes/app-backend-x-molekul.json`
  - id: `app-backend-x-molekul`
  - title: `Work_unit - Backend ornek kirilimi`
  - prompt: `work_unit/molekül`

Bu, bugunku WBS sozluguyle celisiyor. Eger eski "work_unit" artik "component/kum" veya baska bir seviye ise migration karari verilmesi gerekiyor.

### 6. Plain `refs[]` boslugu devam ediyor

`missingRef=0` sonucu standart referans kapisinin yesil oldugunu gosteriyor; bu iyi.
Ancak plain `refs[]` alani hala `87` dugumde bos.

Bu alan teknik olarak ayni sey degil:

- `standardRefs`: standart sozlesme kapsami
- `refs[]`: kaynak, ADR, corpus veya insan-okunur dayanak baglantisi

Bu yuzden "standart kapsami tamam" dogru; "tum kaynak/provenance referanslari tamam" dogru degil.

### 7. Deliverable / acceptance / risk bosluklari var

- `deliverables` bos: `16` dugum
- `acceptance` bos: `1` dugum (`geo-map-surface`)
- `risks` bos: `8` dugum

Risk bos olan ornekler:

- `fe-eng-standards`
- `geo-map-surface`
- `golden-slice-ref`
- `std-ci-gates`
- `std-contracts`
- `std-docs`
- `std-schema-foundation`
- `std-ui-surfacing`

## P2 bulgular

### 8. Mekanik ifade kaliplari hala yogun

Exact duplicate kapisi geciyor; fakat yakin anlamli/kalip tekrar borcu devam ediyor.

Sayilan kaliplar:

- `girdi/çıktı sözleşmesi`: `440` node
- `erişilebilirlik `: `449` node
- `ölçülebilir hedef `: `428` node
- `dağıtım `: `263` node
- `durum akışı ve hata yolu`: `91` node
- `OWASP tehdidi `: `52` node
- `ASVS/NIST/SBOM`: `67` node
- `unit, entegrasyon ve e2e Playwright journey`: `39` node

Bu, icerigin dogru ama insan okumasinda jenerik/kalipli hissedilmesine yol acar.

### 9. Rastgele generator token'lari var

`dimensions.*.items` icinde 268 adet rastgele 5 harfli token tespit edildi.
Bu token'lar 82 node'a dagilmis durumda.

Kalip dagilimi:

- `kabul sınırı <token>:`: `91`
- `kod sağlığı <token>:`: `66`
- `sertleştirme <token>:`: `60`
- `performans deneyi <token>:`: `51`

Ornekler:

- `kabul sınırı xqbvw:`
- `kod sağlığı kzhaf:`
- `sertleştirme xfdmk:`
- `performans deneyi dvptt:`

Bunlar anlam tasimiyor; muhtemelen duplicate azaltmak icin uretilmis yapay farklastirma izleri. Content kalitesi acisindan temizlenmeli.

### 10. AI yetki siniri maddelerde asiri tekrar ediyor

`AI app/module üretemez`, `ruleset override edemez` gibi cumleler cok sayida prompt/item icinde tekrarlaniyor.
Bu guvenlik niyeti dogru olabilir; fakat her dugumde ayni metni tasimak yerine policy/standardRef uzerinden merkezilestirmek daha temiz olur.

### 11. Ingilizce / kod-dil yogunlugu bazi dugumlerde yuksek

Code-switching teknik alanlarda normaldir; fakat bazi node'larda okuma akisini bozacak kadar yogun.
Ilk ornekler:

- `cc-obs-deep`
- `k-capability`
- `build-enterprise-readiness`
- `cc-resolver-ops`
- `edu-u14`
- `platform-customer-seed`
- `scale-cache`

Bu dugumler teknik terimleri koruyarak daha Turkce ve okunabilir hale getirilebilir.

### 12. Fixture relation warning'leri var

`check-archetype-relation.mjs` yesil bitti ama 3 dangling fixture warning verdi:

- `customer -> user`
- `product -> product-category`
- `product -> supplier`

Bu bugunku kapida kirmiyor; fakat demo/fixture relation semantigi icin takip edilmeli.

## Cikarim

Repo artik semantik WARN/FAIL ve generic/empty kalite kapilarinda temiz gorunuyor. Ancak kalite kapilari daha cok "kotu veri yok" diyor; "teslimata baglanmis, kaynakli, tutarli, insan-okunur is sistemi tamam" demiyor.

Bir sonraki temizlik sirasi su olmali:

1. State/traceability celiskisi: 7 node icin `implementationStatus` ile `status/phase` hizalanmali.
2. `work_unit/molekül` ve `*-x-molekul` migration karari verilmeli.
3. 268 generator token'i temizlenmeli.
4. Eski docs ya archive/stale olarak isaretlenmeli ya da guncel metriklere cekilmeli.
5. Evidence/repoPath/testCommand boslugu icin yeni bir delivery-readiness standardi acilmali.
6. 31 adet 14-boyutlu dugum icin "lazy migration kabul mu, production 17-fill zorunlu mu?" karari netlestirilmeli.

## Uygulama eki - 2026-07-08

Bu rapordaki deterministik eksikler ayni turda kapatildi.

Kapatilanlar:

- 31 adet 14-boyutlu dugum 17 boyuta tamamlandi.
- 268 rastgele generator token'i temizlendi.
- `work_unit/molekül`, `module/dağ`, `molekül/hücre`, `taş/kum` prompt drift'i temizlendi.
- 7 state/traceability drift'i `implementationStatus=not-started` ile hizalandi; planli repo/test alanlari korunup sahte ilerleme yazilmadi.
- Bos `refs[]` alani kalan 87 dugum kanonik sozlesme dokumanlarina baglandi.
- Bos `deliverables`, `acceptanceCriteria`, `risks` alanlari tamamlandi.
- 5 tarihsel/stale docs dosyasina guncellik notu eklendi.
- `task-to-code-contract.md` seviye tablosu kanonik WBS sozluguyle hizalandi.
- `ready-for-dev-gate.md` evidence checklist celiskisi duzeltildi: `evidence[]` yalniz gercek kanit icindir.
- Yeni day-2 kartlarin `observabilityRef` standart baglari dolduruldu.

Son yerel metrikler:

- Generated node: `467`
- 17 boyutlu node: `467/467`
- semantic FAIL: `0`
- semantic WARN: `0`
- generator token: `0`
- plain `refs[]` bos: `0`
- deliverables bos: `0`
- acceptance bos: `0`
- risks bos: `0`
- state-machine drift warning: `0`
- weak-content top40Avg: `2.861`

Bilincli acik kalan:

- `evidence[]` bos: `460`. Bu backlog/requirements durumundaki dugumler icin sahte kanitla doldurulmadi. `evidence[]` yalniz test/deploy/audit gibi acilip dogrulanabilir gercek ciktinin URL/yol/referansi oldugunda yazilacak.
