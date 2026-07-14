# Geliştirici Rehberi — actionplan

Bu rehber, actionplan'a bağlantı alan her geliştirici için tek kanonik başlangıç noktasıdır.
"Şimdi ne yapılır?" sorusunu adım adım yanıtlar.

AI yetki zinciri **Codex → PM → uzman ajanlar → Claude workers/slaves** biçimindedir. PM
akışı koordine eder; yalnız Codex sınırlı Claude worker çağrısı yapar ve nihai teslim kararını verir.

---

## 1. Buradan Başla

actionplan, uygulama kodu içermeyen, frontend-only bir WBS (Work Breakdown Structure) planlayıcısıdır.
Görevi, başka projenin enterprise-grade waterfall yol haritasını, geliştirici iş tanımlarını ve teslimat kanıtı disiplinini tutmaktır.
Gerçek uygulama kodu burada değil, ayrı implementation reposunda yaşar ve yalnız insan geliştirici tarafından yazılır. AI erişimi `read-only-audit`, ürün kodu yazarı `human-developer-only`dır. Kanonik hüküm: `docs/platform-product-code-write-prohibition-directive.md`.

**Rolünü seç.** Hangi rolde olduğuna karar ver ve aşağıdaki ilgili bölüme git.

| Rol | Birincil odak |
|---|---|
| Platform geliştirici (core/altyapı) | Core Contract, platform fabrika, auth, DB katmanı |
| App-module geliştirici (dikey dilim) | Customer, OrderOps vb. uygulama modülleri |
| QA / Güvenlik inceleyici | Acceptance criteria doğrulama, CI kapı sonuçları, güvenlik sınırları |
| Product / PM | Mileston takibi, öncelik değerlendirmesi, faz kapısı onayı |
| Dokümantasyon bakım ajanı (Codex/actionplan) | Eksik veya çelişkili dokümantasyonu düzelt, handoff'u yeterli hale getir; ürün/platform kodu yazma |
| Uzman/Claude worker | Dar bulguyu PM üzerinden Codex'e verir; platform salt-okunur, Git/PR yasak |

### Dokümantasyon bakım rolü

Codex/actionplan doc-maintainer bu rehberi takip ederek platform, kernel, SDK, app-core, module veya app kodu yazmaz. Bu rolün işi; kapsam, acceptance criteria, risk, rollback, referans, traceability, export ve handoff ifadelerini geliştirici için yeterli hale getirmektir.

Bu rehberdeki Claude, Cursor, Aider veya Agent Prompt adımları yalnız directive üretimidir. AI implementation workspace'e geçip kod, test, migration, Storybook/config, branch, commit veya PR üretmez; bunları insan geliştirici uygular.

Hangi rolde olursan ol, actionplan'ı tarayıcıda aç:
`https://karacaismail.github.io/actionplan/`

Derin link notu: /task/<id> URL'leri HTTP 404 kodu döndürür, ancak GitHub Pages'teki 404.html bir SPA olduğu için tarayıcıda doğru şekilde açılır. Crawler veya proxy araçlar bu linkleri kırık sayabilir. Güvenli başlangıç noktası daima köktür; uygulamadan Execution/Gantt/Tablo görünümüne geçerek istediğin göreve ulaş.

---

## 2. Görevini Bul

Rastgele bir WBS sayfasından başlama. Bağlamı anlamadan koda atlamak yanlış göreve çalışma riskini doğurur.

Doğru sıra şudur:

1. Execution veya Gantt görünümünü aç; aktif fazı gör.
2. `qa:waterfall` kapısı yeşilse requirements/backlog düğümleri geliştiriciye devredilebilir waterfall tanımı taşır. Bu aşamada `evidence[]`, `repoPath` ve `testCommand` boş olabilir; bunlar gerçek yürütme çıktısıdır.
3. Kod yazılacak iş arıyorsan yalnız `phase=development` düğümleri için `ready-for-dev` kapısını bekle. Requirements/test-plan/db-schema fazları da geliştirici işidir, fakat bu fazlarda çıktı kod değil; kapsam, test planı, şema kararı ve kanıt beklentisidir.
4. Düğümü aç, tüm alanları oku: `title`, `summary`, `level`, `phase`, `deliverables`, `acceptanceCriteria`, `risks`, `refs`, `dimensions`, `schedule`, `rollback`.
5. Bir bağımlılık varsa (`dependsOn` alanı) önce bağımlılığın durumunu doğrula.

Kanonsel ilk dikey dilim Customer'dır: platform-customer-model, platform-customer-graphql, platform-customer-ui, platform-customer-seed sıralamasıyla ilerler. OrderOps ise build referans uygulamasıdır, canlı pilot değil; öğretici bir örnek olarak okunabilir.

### Teknik teslim sırası

Görev bulma sırası ile platformun teknik doğum sırası karıştırılmaz. Platform hattı bağlayıcı olarak şöyledir:

1. Kernel geliştirilir.
2. Kernel public sözleşmelerinden SDK geliştirilir.
3. SDK ile app'e özgü core module geliştirilir.
4. App-core sonrasında app'in ihtiyacı olan diğer module'ler geliştirilir.
5. App, hazır module'lerin release train/kompozisyon etiketi olarak paketlenir.

Bu sıranın ayrıntısı `docs/kernel-sdk-app-delivery-sequence.md` içindedir. App düğümü kod yazma yeri değildir; app-core module ve app module'leri implementation reposunda, task-to-code sözleşmesinin izin verdiği archetype ve alt seviyelerde kodlanır.

Meta-framework vizyonunu gerçek yazılıma çevirecek wave/PR/evidence kuyruğu `docs/meta-framework-implementation-development-plan.md` içindedir. Bu kuyruk actionplan içinde kod yazma izni vermez; implementation geliştiricisinin `platform` reposunda hangi sırayla PR açacağını ve hangi kanıtla kapatacağını tanımlar.

---

## 3. Yürütme Döngüsü

Her görev için döngü aynıdır. Aktörler ve sorumluluklar netdir; atlanacak adım yoktur.

UI / Master Component görevlerinde döngünün component-düzeyi karşılığı şudur: **red story test → component → Storybook review → E2E** — önce başarısız interaction/a11y story testi yazılır, component testi yeşile getirir, yayınlanmış Storybook preview'unda insan review'u alınır (visual diff dahil), son olarak Surface E2E'si ayrıca geçer. Story pass etti diye E2E atlanmaz; story'siz Master Component merge edilemez (`docs/storybook-implementation.md` §5-6, `enterprise-dod` §2.5, `ready-for-dev-gate` UI ek alanları).

### Adım 1 — Hazır görevi al

Waterfall handoff kapısı yeşil olan bir görev seç (bkz. Adım 2). Görev JSON'unu indir ya da tarayıcıda aç; `refs`, `deliverables`, `acceptanceCriteria`, `risks`, `schedule` ve `rollback` alanlarını not al.

### Adım 2 — Task exportlarını indir

Görev detay ekranındaki export butonlarını kullan:

- Developer Brief: insan geliştirici için kapsam, acceptance criteria, traceability, risk ve evidence özeti.
- Agent Prompt: PM üzerinden Codex'e verilecek `DIRECTIVE-ONLY`, read-only-audit ve insan handoff sözleşmesi.
- Vobecoder Card: kısa, tek ekranlık yapıştırılabilir görev kartı.
- Evidence Patch: iş bitince actionplan'a geri yazılacak kanıt taslağı.
- Raw JSON: TaskNode'un tam verisi.

`repoPath` veya `testCommand` eksikse kod yazmaya başlama. Bu durumda Evidence Patch veya plan düzenlemesiyle traceability tamamlanır.

### Adım 3 — Yetkili `DIRECTIVE-ONLY` handoff al

Uzman ajan bulguyu hazırlar, PM kapsam/evidence zarfını paketler ve Codex'e verir. Yalnız Codex
gerek görürse `claude_review` veya `claude_implement` ile tek sınırlı worker görevi açar;
`claude.ai / firstParty / max` doğrulanmazsa fail-closed durur. Worker platformu salt-okunur
denetler ve insan geliştirici için test-first directive üretir.

```bash
cd /Users/karaca/DEV/mimari/actionplan
# AI burada yalnız directive/handoff dosyası yazar; platforma geçmez.
```

Doğrudan CLI/model/provider komutu yoktur. PM, uzman ve Claude branch/push/PR yapmaz; platform
ürün kodunu yalnız insan geliştirici yazar, Actionplan teslimini Codex bağımsız doğrular.

### Adım 4 — İnsan geliştirici test-önce kodlar

İnsan geliştirici ilgili implementation reposunda çalışır. Kod fazındaysa her acceptance criterion için önce başarısız testi, sonra minimum geçer kodu yazar. AI bu dosyaları yazmaz; yalnız directive'i ve review checklist'ini actionplan içinde geliştirir.

Backend stack: FastAPI + Strawberry GraphQL + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL.
Frontend stack: React + Vite + TanStack Router + TanStack Query.
Bu stack'in dışına çıkma. Next.js, Supabase, Prisma, Redux ve Flowbite yasaktır.

URL, route, slug, canonical, redirect, locale path, custom domain, app mount veya kaynak linki içeren her görevde `docs/url-policy.md` + `src/data/url-policy/registry.json` + `standardRefs.urlPolicyRef` birlikte okunur. İnsan implementation'ı serbest path concat, app-local URL generator, sıralı public ID veya registry dışı prefix üretemez; AI yalnız bu kontrolleri directive'e yazar.

URL runtime implementation'ı için ayrıca `docs/url-policy-implementation-directive.md` ve `src/data/url-policy/implementation-program.json` zorunludur. Başlangıç düğümü `urlp-00`, son düğüm `urlp-16`dır; predecessor gerçek evidence ile verified olmadan sonraki faz development'a alınmaz. Her agent prompt programdaki allowedFiles/nonGoals/redTests/testCommands/evidenceRequirements/rollback/stopConditions alanlarını aynen taşır.

### Adım 5 — Yönerge / İnsan uygulaması / İnsan review ritüeli

Her yeni modül veya kritik mantık bloğu için sırasıyla:

- Yönerge: AI test planı, implementation sırası, security negatives ve rollback handoff'u üretir.
- Uygulama: İnsan geliştirici directive'i platform branch'inde kod ve test olarak uygular.
- Review: Bağımsız insan reviewer kodu, kanıtı ve Core Contract uyumunu inceler.

Bu ritüel, kalitesiz kodun PR'a ulaşmasını önler.

### Adım 6 — PR ac

Branch adı: `task/<task-id>-<slug>` (örnek: `task/PCT-042-customer-graphql-resolver`).

PR açıklaması zorunlu bölümler:

- Görev ID'si ve actionplan linki (kök + uygulama-içi navigasyon yolu)
- Acceptance Criteria eşleme tablosu (AC-1, AC-2 ... her biri "bu testfile:satir ile karşılandı" biçiminde)
- Risk ve rollback planı (tam olarak görev JSON'undaki `rollback` alanından kopyala)
- AI-directive notu: hangi plan/yönerge bölümlerinin AI tarafından hazırlandığını belirt; ürün kodu AI üretimi olarak işaretlenemez

### Adım 7 — CI kapilari

Plan reposunda lokal eşdeğer kapı `npm run qa:ci`'dır. En sık kullanılan alt kapılar: `qa:content`, `qa:dimensions`, `qa:lint`, `qa:data`, `qa:waterfall`, `qa:ready`, `qa:exec`, `qa:vibecoding`, `qa:flow`.
Herhangi biri kırmızıysa merge edilmez. Kırmızı kapıyı geç; insan onayı beklemeden önce CI temiz olmalı.

### Adım 8 — Insan review ve merge

Bağımsız bir insan reviewcısı kodu inceler. AI yalnız review checklist'i üretebilir; review'u onaylayamaz. Onay sonrası insan main'e merge eder.

### Adım 9 — Deploy ve dogrulama

Merge sonrası deploy otomatik tetiklenir (GitHub Actions → GitHub Pages). Deploy tamamlandıktan sonra production URL'de kritik akışı manuel olarak doğrula.

### Adım 10 — Kaniti plana geri yaz

Deploy doğrulandıktan sonra actionplan'daki ilgili düğümü güncelle. Bu adım için evidence-update-runbook.md belgesini izle. Bu adımı atlamak görevin planlayıcıda "done" sayılmamasına yol açar.

---

## 4. Gun-1 — Ilk 90 Dakika

Platforma yeni katılan bir geliştirici için somut adımlar:

**0–15 dakika: Ortam hazırlığı**

```bash
# Birincil implementation checkout'u.
cd /Users/karaca/DEV/mimari/platform

# Python ortamı (backend)
cd apps/api
uv run --python 3.12 pytest -q

# Node ortamı (frontend)
cd ../..
corepack enable
pnpm install

# Veritabanını kur (Docker ile)
make up
make health
```

**15–30 dakika: actionplan'da gorev sec**

actionplan'ı tarayıcıda aç: `https://karacaismail.github.io/actionplan/`
Execution, Gantt veya Tablo görünümünden owner/priority/criticalPath değerlerine göre sıradaki düğümü seç.
Requirements fazındaysa kapsam + AC + risk + rollback kontrolü yap; development fazındaysa `repoPath` ve `testCommand` dolu olmalı.

**30–60 dakika: Kirmizi test yaz**

Yalnız development fazındaysan branch aç:
```bash
git checkout -b task/<task-id>-<slug>
```

Göreve karşılık gelen test dosyasını oluştur. Henüz kod yok, test kırmızı olmalı:
```bash
# Backend için
pytest tests/unit/test_<modül>.py -v
# Beklenen: FAILED (henüz kod yok)

# Frontend için
pnpm test:surface
# Beklenen: FAILED
```

**60–90 dakika: Yesile getir, PR ac**

Minimum geçer kodu yaz; testleri yeşile getir. Fazla mühendislik yapma.
```bash
# Backend testleri yeşil mi?
pytest tests/unit/test_<modül>.py -v

# Frontend testleri yeşil mi?
pnpm test:surface

# Commit
git add -A
git commit -m "task(<task-id>): <kisa aciklama> — AC-1,AC-2 gecti"
git push origin task/<task-id>-<slug>
```

PR aç; açıklama şablonunu doldur (bkz. Adım 6). CI kapılarını bekle.

---

## 5. Branch ve PR Kurallari

Branch adı formatı kesinlikle şudur: `task/<task-id>-<slug>`

Örnekler:
- `task/PCT-042-customer-graphql-resolver`
- `task/PCT-055-customer-ui-list-screen`
- `task/PCT-018-auth-rbac-permission-matrix`

Main'e doğrudan push yasaktır. Sadece CI kapıları yeşil + insan onayı sonrası merge edilir.

PR açıklamasında şu bilgiler zorunludur:

- Görev ID'si ve actionplan linki (kökten navigasyon ile ulaşma yolu)
- Acceptance Criteria tablosu: her AC için karşılık gelen test dosyası ve satır numarası
- Risk değerlendirmesi ve rollback talimatı (görev JSON'undan birebir)
- AI-üretim notu: AI'ın ürettiği bölümler ve insan inceleme kapsamı

---

## 6. Hangi Seviyede Kod Yazilir

actionplan'ın kendisinde ürün/platform kod değişikliği yapılmaz. AI ajanları platformda yalnız `read-only-audit` yapar; aşağıdaki kod konumlarını yalnız insan geliştirici değiştirir (`human-developer-only`).

Kod şu hiyerarşiye göre yazılır:

- Kernel/backend katmanı (auth, DB, tenant izolasyonu, event/outbox, audit, observability, module registry): implementation reposunun `apps/api/platform_*` paketlerinde.
- SDK katmanı: implementation reposunun `packages/sdk` dizininde; kernel public sözleşmelerinden türetilir, elle drift ettirilmez.
- App'e özgü core module: implementation reposunda `apps/api/platform_<app_slug>_core` ve gerektiğinde `apps/web/src/apps/<app_slug>` altında.
- App'in diğer module'leri (Customer, OrderOps vb.): app-core sonrasında `apps/api/platform_<app_slug>_<module_slug>` ve ilgili frontend projection altında.
- Shared UI kütüphaneleri: implementation reposunun `packages/ui` dizininde.

Hangi seviyede kod yazılıp yazılmayacağı task-to-code-contract.md, kernel-sdk-app-delivery-sequence.md ve core-contract-pack.md belgelerinde tanımlanmıştır. Bu sözleşmeleri ihlal eden PR CI'da reddedilir.

---

## 7. Diger Belgelere Baglanti

Bu rehber, actionplan ekosisteminin genel bakışıdır. Ayrıntılar için:

| Belge | Amaç |
|---|---|
| `docs/task-to-code-contract.md` | Görev JSON alanı ile kod konumu / test türü eşlemesi |
| `docs/doc-maintainer-operating-boundary.md` | actionplan doc-maintainer rol sınırı: dokümantasyon bakım işi ile implementation coding ayrımı |
| `docs/platform-product-code-write-prohibition-directive.md` | Codex/Claude/Cursor için platform read-only-audit ve human-developer-only yazma yasağı |
| `docs/kernel-sdk-app-delivery-sequence.md` | Kernel → SDK → app-core → app module → app assembly teslim sırası |
| `docs/meta-framework-implementation-development-plan.md` | Meta-framework implementation için wave/PR/evidence kuyruğu |
| `docs/core-contract-pack.md` | Platform core katmanının mimari sözleşmesi |
| `docs/task-export-contract.md` | Developer Brief export JSON şeması |
| `docs/evidence-update-runbook.md` | PR merge sonrası kanıtı plana geri yazma ritüeli |
| `docs/ready-for-dev-gate.md` | Definition of Ready kapısı kriterleri |
| `docs/waterfall-developer-handoff.md` | Bu repo kapsamındaki go/no-go kararı ve geliştirici başlangıç sözleşmesi |

---

## 8. Sikca Sorular

**actionplan'daki bir görevin kodunu bulamıyorum, nerede?**
Görev `requirements`, `test-plan` veya `db-schema` fazındaysa kod henüz beklenmez; önce faz çıktısını üret. `development` fazındaki görevlerde `traceability.repoPath` implementation reposu içindeki yolu işaret eder.

**Bir kapı sürekli kırmızı; ne yapmalıyım?**
CI logunu oku, hangi kontrol başarısız olduğunu bul. `check-data-quality` genellikle eksik alan, `check-execution-readiness` genellikle eksik bağımlılık gösterir. Sorunu görev JSON'unda çöz, ardından tekrar dene.

**AI directive'i yanlışsa kim karar verir?**
İnsan geliştirici veya reviewer. AI yalnız directive'i düzeltir; platform kodu veya PR üretmez.

**Codex/actionplan bu rehbere göre platformu geliştirecek mi?**
Hayır. Codex, Claude, Cursor ve diğer AI ajanları yalnız dokümantasyon, sözleşme, export, gap raporu ve handoff içeriğini yeterli hale getirir. Platform/kernel/SDK/app/module kodunu yalnız insan geliştirici yazar.

**OrderOps'u canlı pilot olarak kullanabilir miyim?**
Hayır. OrderOps bir build referans uygulamasıdır; canlı pilot değildir. Öğretici referans örnek olarak incelenebilir.
