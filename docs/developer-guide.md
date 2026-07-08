# Geliştirici Rehberi — actionplan

Bu rehber, actionplan'a bağlantı alan her geliştirici için tek kanonik başlangıç noktasıdır.
"Şimdi ne yapılır?" sorusunu adım adım yanıtlar.

---

## 1. Buradan Başla

actionplan, uygulama kodu içermeyen, frontend-only bir WBS (Work Breakdown Structure) planlayıcısıdır.
Görevi, başka projenin enterprise-grade waterfall yol haritasını, geliştirici iş tanımlarını ve teslimat kanıtı disiplinini tutmaktır.
Gerçek uygulama kodu burada değil, ayrı implementation reposunda yaşar.
actionplan'daki her düğüm bir planlama nesnesidir; geliştirici burada işi anlar, waterfall fazını yürütür, kod gerekiyorsa ilgili implementation reposunda çalışır.

**Rolünü seç.** Hangi rolde olduğuna karar ver ve aşağıdaki ilgili bölüme git.

| Rol | Birincil odak |
|---|---|
| Platform geliştirici (core/altyapı) | Core Contract, platform fabrika, auth, DB katmanı |
| App-module geliştirici (dikey dilim) | Customer, OrderOps vb. uygulama modülleri |
| QA / Güvenlik inceleyici | Acceptance criteria doğrulama, CI kapı sonuçları, güvenlik sınırları |
| Product / PM | Mileston takibi, öncelik değerlendirmesi, faz kapısı onayı |
| AI ajan operatörü (Claude Code) | Developer Brief veya Agent Prompt al, üret, PR aç; main'e doğrudan push etme |

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

---

## 3. Yürütme Döngüsü

Her görev için döngü aynıdır. Aktörler ve sorumluluklar netdir; atlanacak adım yoktur.

### Adım 1 — Hazır görevi al

Waterfall handoff kapısı yeşil olan bir görev seç (bkz. Adım 2). Görev JSON'unu indir ya da tarayıcıda aç; `refs`, `deliverables`, `acceptanceCriteria`, `risks`, `schedule` ve `rollback` alanlarını not al.

### Adım 2 — Task exportlarını indir

Görev detay ekranındaki export butonlarını kullan:

- Developer Brief: insan geliştirici için kapsam, acceptance criteria, traceability, risk ve evidence özeti.
- Agent Prompt: Claude Code / Cursor Agent / Aider gibi kod ajanlarına verilecek sıkı sözleşme.
- Vobecoder Card: kısa, tek ekranlık yapıştırılabilir görev kartı.
- Evidence Patch: iş bitince actionplan'a geri yazılacak kanıt taslağı.
- Raw JSON: TaskNode'un tam verisi.

`repoPath` veya `testCommand` eksikse kod yazmaya başlama. Bu durumda Evidence Patch veya plan düzenlemesiyle traceability tamamlanır.

### Adım 3 — AI ajana ver (Claude Code)

Agent Prompt veya Developer Brief'i ilgili implementation reposunda Claude Code'a ver. Birincil workspace `implementation-workspace-manifest.md` içinde tanımlıdır:

```bash
cd /Users/karaca/DEV/mimari/platform
git checkout -b task/<task-id>-<slug>
```

Komut şablonu:

```
claude "Bu Agent Prompt'a göre task/<task-id> için kod üret.
Referanslar: <refs>
Acceptance Criteria: <liste>
Kısıt: Test-önce çalış; her AC için önce kırmızı test, sonra geçer kod."
```

AI ajanı main'e doğrudan push etmez. Üretir, PR açar; karar insana aittir.

### Adım 4 — Test-önce kodla (Core Contract + AC odaklı)

İlgili implementation reposunda çalış. Kod fazındaysan her acceptance criterion için önce başarısız testi yaz, sonra geçer kodu üret. Requirements/test-plan/db-schema fazındaysan çıktı kod değil; sözleşme, test planı, şema/migration kararı ve kanıt beklentisidir.

Backend stack: FastAPI + Strawberry GraphQL + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL.
Frontend stack: React + Vite + TanStack Router + TanStack Query.
Bu stack'in dışına çıkma. Next.js, Supabase, Prisma, Redux ve Flowbite yasaktır.

### Adım 5 — Uret / Eleştir / Islet ritueli (3'lu)

Her yeni modül veya kritik mantık bloğu için sırasıyla:

- Uret: AI ajanı kodu üretir; insan geliştiriciye sunar.
- Eleştir: insan geliştirici kodu okur, Core Contract ve güvenlik sınırlarıyla karşılaştırır, eksikleri listeler.
- Islet: AI ajanı eleştiriyi uygular; döngü, tüm AC'ler geçene kadar tekrar eder.

Bu ritüel, kalitesiz kodun PR'a ulaşmasını önler.

### Adım 6 — PR ac

Branch adı: `task/<task-id>-<slug>` (örnek: `task/PCT-042-customer-graphql-resolver`).

PR açıklaması zorunlu bölümler:

- Görev ID'si ve actionplan linki (kök + uygulama-içi navigasyon yolu)
- Acceptance Criteria eşleme tablosu (AC-1, AC-2 ... her biri "bu testfile:satir ile karşılandı" biçiminde)
- Risk ve rollback planı (tam olarak görev JSON'undaki `rollback` alanından kopyala)
- AI-üretim notu: hangi bölümlerin AI tarafından üretildiğini, insan incelemesinin kapsamını belirt

### Adım 7 — CI kapilari

Plan reposunda lokal eşdeğer kapı `npm run qa:ci`'dır. En sık kullanılan alt kapılar: `qa:content`, `qa:dimensions`, `qa:lint`, `qa:data`, `qa:waterfall`, `qa:ready`, `qa:exec`, `qa:vibecoding`, `qa:flow`.
Herhangi biri kırmızıysa merge edilmez. Kırmızı kapıyı geç; insan onayı beklemeden önce CI temiz olmalı.

### Adım 8 — Insan review ve merge

Bağımsız bir insan reviewcısı kodu inceler. AI ajanı review'u kendi kendine onaylayamaz. Onay sonrası insan main'e merge eder.

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

actionplan'ın kendisinde kod değişikliği yapılmaz. actionplan yalnızca planlama verisini tutar.

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
| `docs/kernel-sdk-app-delivery-sequence.md` | Kernel → SDK → app-core → app module → app assembly teslim sırası |
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

**AI ajanı bir şeyi yanlış ürettiyse kim karar verir?**
İnsan geliştirici. AI ajanı öneri üretir, PR açar; karar her zaman insana aittir. "Eleştir" adımını geç, doğrulama satırlarını PR'a ekle.

**OrderOps'u canlı pilot olarak kullanabilir miyim?**
Hayır. OrderOps bir build referans uygulamasıdır; canlı pilot değildir. Öğretici referans örnek olarak incelenebilir.
