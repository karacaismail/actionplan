# Developer Workflow Gap Analizi — Durum Raporu

**Tarih:** 2026-06-29 (DX1-DX5 sonrası güncellendi)
**Kapsam:** actionplan — "görev sayfasından gerçek ürün koduna geçiş" boşluk analizi ve KAPATMA DURUMU
**Durum:** main; tüm kapılar yeşil. Bu belge iki bağımsız analizi (Claude + ChatGPT) tek çelişkisiz rapora birleştirir ve her boşluğun GÜNCEL durumunu işaretler.

## Durum etiketleri

- **KAPANDI** — plan/doküman/kapı/UI tarafı üretildi ve main'e sevk edildi.
- **AÇIK (yürütme)** — actionplan'ın işi değil; gerçek platform kodunun yazılması (planlama değil, uygulama adımı).
- **AÇIK (girdi/opsiyonel)** — küçük; senin GitHub kurulumun gerekiyor ya da opsiyonel UI iyileştirmesi.

> Özet: Boşlukların **plan tarafı DX1-DX5'te kapatıldı**. Geriye kalan tek esas katman, **platform kodunun yazılması** (Wave 0 — yürütme). Bu doküman bunu açıkça ayırır; "tamamlandı mı?" sorusunun cevabı her madde için aşağıdadır.

---

## 1. Kısa Sonuç

actionplan "NE yapılacak"ı 437 düğüm + 14 boyutla tanımlar. "NASIL yapılacak" boşluğu (görevden koda giden döngü, görev↔kod sözleşmesi, Core Contract, giriş noktası) **DX1-DX5'te yazıldı ve sevk edildi**: 7 kanonik runbook, `check-ready-for-dev` kapısı ve task-detayındaki "Şimdi ne yapılır?" paneli. Açık kalan tek esas katman, Core Contract'ın **gerçek kod iskeletine** dönüşmesidir (platform monorepo) — bu bir planlama boşluğu değil, planın yürütülmesidir.

---

## 2. Mevcut Durum Ölçümü

| Metrik | ChatGPT Raporu (eski — geçersiz) | Güncel (main) |
|---|---|---|
| Toplam düğüm | 437 | 437 |
| Owner dolu | 411/437 | 437/437 |
| Evidence/traceability | 0 | done'lar + pilotlar kanıtlı; 18+ düğümde traceability |
| Schedule dolu | kısmen | 437/437 |
| Rollback dolu | 13 | 437/437 |
| quality-lint | kırmızı | yeşil |
| Kapılar | — | check-content/ruleset/surface/data-quality/execution-readiness/**ready-for-dev** hepsi yeşil |

ChatGPT raporundaki owner-411, evidence-0, lint-kırmızı verileri merge öncesidir ve **geçersizdir**.

---

## 3. Ana Boşluklar — Durum

### 3a. Yürütme Döngüsü — **KAPANDI**
"Görevi al → branch → modülü bul → kod → test → PR → kapılar → evidence → sonraki görev" döngüsü artık `docs/developer-guide.md` içinde uçtan uca yazılıdır; ayrıca task-detayındaki **"Şimdi ne yapılır?" paneli** her sayfada faza göre bu adımı gösterir.

### 3b. Kod-Üretim Promptları — **KAPANDI (sözleşme)**
Düğüm promptlarının içerik-üretim olduğu, kod-üretim talimatının ayrı olduğu `docs/task-export-contract.md`'de tanımlandı (Agent Prompt modu: allowed/forbidden files, beklenen çıktı, zorunlu testler). Panel branch/repo/test ipucunu verir. (Promptların düğümlere ayrıca gömülmesi opsiyonel; sözleşme nettir.)

### 3c. Giriş Noktası / Signpost — **KAPANDI**
`docs/developer-guide.md` "ilk gün" rehberini (repo, ortam, ilk PR) içerir; panel "Geliştirici Rehberi" linkiyle `edu-baslangic-rotasi`'na yönlendirir; o düğüm de rehbere bağlandı.

### 3d. Geri-Yazma Döngüsü — **KAPANDI (yöntem)**
`docs/evidence-update-runbook.md` evidence güncelleme formatını/adımını tanımlar; `check-execution-readiness` (done-evidence) kanıtsız "done"u engeller. (Tarayıcıdan otomatik write-back UI'si opsiyonel; ritüel + format tanımlı.)

### 3e. Görev↔Kod Semantik Sözleşmesi — **KAPANDI**
`docs/task-to-code-contract.md`: seviye→teslimat (app=kapsam/kod yok, module=bounded context, archetype+altı=kod görevi), faz→eylem, ve düğüm→platform dizin yolu eşlemesi.

---

## 4. En Kritik Boşluk: Kernel/Core — **SPEC KAPANDI / KOD AÇIK (yürütme)**

`docs/core-contract-pack.md` 10 çekirdek sözleşmeyi (tenancy/authz/event-bus/ECA/audit/registry/migration/observability/module-SDK) + stub imzalarını + repo kararını (platform monorepo) + "Hello Platform" iskelet tarifini **spec olarak tanımlar**.

**Açık kalan:** bu sözleşmenin **gerçek kod stub'ları** (AppBase, JWTMiddleware, AppFactory.bootstrap, TenantContext) henüz yazılmadı — çünkü platform monorepo'su henüz inşa edilmedi. Bu, actionplan'ın (planlayıcı) işi değildir; **planın yürütülmesidir** (Wave 0). `check-ready-for-dev` kapısı, uygulama bağı (repoPath/testCommand) olmadan bir düğümün development fazına geçmesini engelleyerek bu sırayı zorlar.

---

## 5. Çözülen Çelişki: İlk Dikey Dilim — **KAPANDI**

- **Kanonik ilk dikey dilim:** Customer (auth → DB → GraphQL → UI tam referans).
- **OrderOps'un rolü:** öğretici örnek (ikinci dilim).

`build-referans-uygulama` düğümüne bu not eklendi; iki rapor arasındaki tek gerçek çelişki kapatıldı.

---

## 6. Unknown-Unknowns — Durum Tablosu

| # | Bilinmeyen | Durum | Kapatan / Not |
|---|---|---|---|
| 1 | Repo konumu | KAPANDI | core-contract-pack (platform monorepo + dizin) + developer-guide |
| 2 | Seviye/kodlama anlamı | KAPANDI | task-to-code-contract (seviye→teslimat) |
| 3 | Prompt ↔ gereksinim karışması | KAPANDI | task-export-contract + task-to-code-contract; panel |
| 4 | Core/Kernel iskeleti | SPEC KAPANDI / **KOD AÇIK (yürütme)** | core-contract-pack spec; kod = platform repo |
| 5 | Export agent sözleşmesi | KAPANDI | task-export-contract (3 mod) |
| 6 | Definition of Ready | KAPANDI | ready-for-dev-gate.md + check-ready-for-dev kapısı |
| 7 | Evidence geri-yazma ritüeli | KAPANDI | evidence-update-runbook + done-evidence kapısı |
| 8 | Deep-link 404 | BİLİNİYOR (dokümante) | developer-guide: kökten gez; 404 status ama tarayıcı render eder (GitHub Pages SPA). Otomatik 200 = HashRouter (büyük değişiklik, ertelendi) |
| 9 | "Bugün ne yapmalıyım?" kuyruğu | KISMEN | ready-for-dev kapısı + panel + Yürütme görünümü kapsar; ayrı "ready queue" görünümü = opsiyonel iyileştirme |
| 10 | Ekip→GitHub eşlemesi | AÇIK (girdi) | CODEOWNERS var; team-id→GitHub-handle eşlemesi senin GitHub org/takım kurulumunu gerektirir |
| 11 | Modül↔kod bağımlılığı | KAPANDI | task-to-code-contract (deps→import/migration sırası) |
| 12 | 50+ uygulama dalga planı | KAPANDI | §7d (Wave 0-4) |
| 13 | Uygulama durum makinesi | KAPANDI | §7e (aşağıda tanımlandı) |
| 14 | İlk gün rehberi | KAPANDI | developer-guide.md |

---

## 7. Kapatma — DURUM (DX1-DX5'te sevk edildi)

### 7a. Belgeler — hepsi ÜRETİLDİ ✓

| Belge | Durum |
|---|---|
| `docs/developer-guide.md` | ✓ main'de |
| `docs/task-to-code-contract.md` | ✓ main'de |
| `docs/core-contract-pack.md` | ✓ main'de |
| `docs/task-export-contract.md` | ✓ main'de |
| `docs/ready-for-dev-gate.md` | ✓ main'de |
| `docs/evidence-update-runbook.md` | ✓ main'de |

### 7b. CI Kapısı — ÜRETİLDİ ✓ (kapsam uyarlandı)

`tools/agents/check-ready-for-dev.mjs` üretildi ve CI + `npm test` + `qa:ready` script'ine bağlandı. Zorladığı: **development fazındaki düğüm → traceability.repoPath + testCommand + implementationStatus (≠ not-started)**.

> Uyarlama notu: Bu kapının ilk taslağında geçen "Core Contract stub dosyalarının VARLIĞINI kontrol et" maddesi, dosyalar **platform monorepo'sunda** yaşadığı için actionplan CI'sında uygulanamaz; o kontrol platform reposunun CI'sına aittir (`check-core-contract.mjs`, platform repo kurulunca). actionplan tarafı, planın uygulamaya hazır olduğunu (repoPath/testCommand) doğrular.

### 7c. UI Paneli — ÜRETİLDİ ✓
Task-detayında "Şimdi ne yapılır?" paneli (seviye/faz-duyarlı yönerge, kod yazılır/yazılmaz, branch/repo/test ipucu, DoR-eksik uyarısı, Geliştirici Rehberi linki).

### 7d. Dalga Planı (50+ Uygulama) — TANIMLANDI ✓

| Dalga | Kapsam | Giriş Koşulu | Çıkış Eşiği |
|---|---|---|---|
| Wave 0 | platform core + Customer referans | Core Contract spec'i tam (✓) | Customer production'da, kapılar yeşil, evidence dolu |
| Wave 1 | 3 uygulama (AppFactory türevleri) | CustomerApp referansı kopyalanabilir | 3 app için alpha kanıtı |
| Wave 2 | 10 uygulama | Wave 1 kapıları geçti | her app enterprise-ready skor ≥ 3.0 |
| Wave 3 | 25 uygulama | Wave 2 production kanıtı | otonom smoke test döngüsü |
| Wave 4 | 50+ uygulama | Wave 3 stabil | her app durum makinesi izleniyor |

### 7e. Uygulama Durum Makinesi — TANIMLANDI ✓ (gap 13)

Her uygulama/dikey dilim şu durumlardan geçer; geçişler kanıt-zorunludur:

| Durum | Anlamı | Geçiş koşulu (sonraki duruma) | actionplan alan karşılığı |
|---|---|---|---|
| candidate | Aday; sadece plan | DoR sağlandı (owner+refs+schedule+AC+rollback) | status=backlog |
| ready-for-dev | Kodlanabilir | repoPath+testCommand+implementationStatus atandı (check-ready-for-dev yeşil) | phase=test-plan, traceability dolu |
| scaffolded | İskele kuruldu | ilk testler kırmızı + Core Contract'a bağlandı | implementationStatus=scaffolded |
| in-progress | Geliştiriliyor | birim+entegrasyon testleri yeşil | phase=development, implementationStatus=in-progress |
| implemented | Kod tamam | e2e+a11y+güvenlik+perf kapıları yeşil | phase=test-qa |
| verified | Kanıtlı | evidence dolu + verification fazı passed | phase=verification, status=done |
| production | Yayında | deploy kanıtı + rollback testli | release-maintenance, evidence: deploy URL |

Bu makine `status`, `phase` ve `traceability.implementationStatus` alanlarının birleşiminden türetilir; ileride `check-state-machine.mjs` ile (platform repo evidence'ıyla birlikte) zorlanabilir.

---

## 8. Sonuç

"Nasıl" boşluğunun **plan tarafı kapatıldı**: yürütme döngüsü yazıldı (3a), kod-üretim sözleşmesi tanımlandı (3b), giriş noktası eklendi (3c), geri-yazma ritüeli belgelendi (3d), görev↔kod semantiği yazıldı (3e), Core Contract spec'lendi (4), durum makinesi + dalga planı tanımlandı (7d/7e). İlk-dilim çelişkisi çözüldü (5).

**Açık kalan tek esas katman:** Core Contract'ın gerçek **kod iskeletine** dönüşmesi (platform monorepo, Wave 0). Bu bir planlama eksiği değil; planın **yürütülmesidir** — ve yeni kapılar (`check-ready-for-dev`, `check-execution-readiness`) kanıtsız/hazırlıksız ilerlemeyi engelleyerek bu yürütmeyi disipline eder.

Küçük açık maddeler: deep-link 200 (HashRouter — ertelendi, §6.8), ekip→GitHub handle eşlemesi (senin org kurulumun, §6.10), opsiyonel "ready queue" görünümü (§6.9).

---

*Bu belge DX1-DX5'te üretildi ve main'e sevk edildi. Bir sonraki gerçek adım: platform monorepo iskeletini Core Contract v1'e göre kurmak (Wave 0).*
