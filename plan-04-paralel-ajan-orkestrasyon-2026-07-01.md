# Dosya 4 — Paralel-Ajan Orkestrasyon Rehberi

**Tarih:** 2026-07-01 · **Bağlam:** `plan-01`'deki dalgaları güvenli, paralel ve insan-onaylı koşmak için. · **Dayanak:** mevcut `tools/agents/run-swarm.mjs` (27 küme, öncelik P1-P4, eşzamanlılık 3, provenance).

**Bu rehber nedir:** Birden çok geliştirme ajanını aynı anda, çakışmadan ve enterprise-güvenli çalıştırma kılavuzu.
**Ne yapar:** Yetki modelini, izolasyonu, CI entegrasyonunu, maliyet/güvenlik sınırlarını ve OpenClaw+n8n otomasyonunu tanımlar.
**Ne yapmaz:** Hiçbir ajana main branch'e doğrudan yazma yetkisi vermez; tüm değişiklikler PR + insan onayı ile girer.

---

## 1. AI yetki modeli — beş seviye, net ayrım

En kritik konu budur, çünkü "self-healing" gibi ifadeler çoğu yerde belirsiz kullanılır. Beş farklı sistem vardır; hangisinde olduğunuzu her zaman bilin. Tablodan önce sade özet: bu proje ajanları **en fazla dördüncü seviyeye** (PR açan) çıkar; beşinci seviye (main'e doğrudan push) enterprise'da yasaktır.

| Seviye | Sistem ne yapar | Repo autonomy karşılığı | Bu projede |
|---|---|---|---|
| 1 | **Sadece teşhis** — sorunu bulur, hiçbir şeyi değiştirmez | (rapor) | İzinli |
| 2 | **Öneri verir** — düzeltmeyi metin/yorum olarak önerir | `suggest` | İzinli |
| 3 | **Kodu değiştirir** — bir *branch*'te dosya düzenler | `draft` | İzinli (yalnız branch) |
| 4 | **PR açar** — inceleme için PR oluşturur | `apply-gated` | İzinli (tavan) |
| 5 | **Main'e doğrudan push** — insansız üretime yazar | — | **YASAK** |

Aktör-açık kural: *Ajan* seviye 1-4 yapar (teşhis → öneri → branch değişikliği → PR). *CI/CD* 13 konformans kapısını çalıştırır. *İnsan* PR'ı inceler ve merge eder. Merge = tek insan-onay noktası. Ajan asla merge etmez, asla main'e push etmez.

### 1.1 "Self-healing QA" gerçekte ne — metafor vs karşılık

"Self-healing" (kendini iyileştiren) kulağa "kod kendini düzeltir" gibi gelir. Bu projede **gerçek karşılığı** şudur: *ajan* bir kırık testi görür (teşhis) → düzeltmeyi bir branch'te uygular (seviye 3) → PR açar (seviye 4) → *insan* onaylar. Kod kendini üretime düzeltmez; insan onayından geçer.

Sizin sorularınıza net cevap:

- **Gerçekten kodu değiştiriyor mu?** Evet — ama yalnız bir branch'te, PR ardında. Üretimde (main) değil.
- **Sadece hata raporu mu üretiyor?** Hayır, seviye 3-4'te düzeltme de üretir; ama uygulaması insan-onaylıdır.
- **İnsan onayı var mı?** Evet — merge noktasında, zorunlu (1+ reviewer).
- **Test dosyalarını değiştirebilir mi?** Evet ama **yalnız testi güçlendirmek veya gerçekten-yanlış bir iddiayı düzeltmek için.** Testi "kod geçsin diye" zayıflatmak **yasaktır** — bu "self-healing" değil "self-harming"dir (gate'i kandırmak = standardı düşürmek). Her test-dosyası değişikliği insan incelemesinde ayrıca işaretlenir.
- **Main branch'e doğrudan yazabilir mi?** Hayır. Kesin yasak (seviye 5).
- **Maliyet sınırı var mı?** Evet — kırmızı test başına max 6 iterasyon; ajan başına token/maliyet bütçesi; `agentPolicy.killSwitch` (bkz. §5).
- **Güvenlik sınırı var mı?** Evet — `allowedTargets`/`forbiddenTargets` (app/module düğümü üretemez), `prodDataPolicy` (üretim verisine dokunamaz), `subPromptUntrusted` (prompt-injection savunması), ruleset override yasağı.

---

## 2. İzolasyon — paralel ajanlar neden çakışmaz

Sade özet: iki ajan aynı dosyaya aynı anda yazarsa çakışır. Bunu iki katmanla engelleriz: (a) *küme izolasyonu* (mevcut swarm deseni), (b) *git worktree izolasyonu* (kod dalgaları için).

- **Küme izolasyonu (mevcut).** `run-swarm.mjs` her ajanı yalnız kendi kümesinin (`src/data/generated/nodes/*.json`) dosyalarına atar; 27 küme, çakışma sıfır. Bu **içerik üretimi** için tasarlanmış (445 düğümün 14 boyutunu doldurmak).
- **Git worktree izolasyonu (kod dalgaları için eklenmeli).** `plan-01` kod dalgalarında (D1-D5) her ajan **ayrı bir git worktree + branch** alır (`git worktree add ../wt-k-party feature/k-party`). Böylece dört primitif ajanı dört ayrı çalışma kopyasında, dört ayrı branch'te, birbirine dokunmadan çalışır. PR'lar sırayla merge edilir.

Kural: **Bir dosyaya aynı anda tek ajan.** Kesişen dosya varsa (ör. paylaşılan SDK), o iş seri yapılır veya tek ajana verilir. `plan-01 §5` hangi dalgaların paralel/seri olduğunu söyler.

---

## 3. run-swarm.mjs üstüne kurulum

Mevcut swarm'ı yeniden icat etmeyin; genişletin. Sade özet: swarm bugün *içerik* ajanlarını koşuyor; kod dalgaları için ona worktree modu ve kod-kapısı eklenir.

**Bugün ne yapıyor:** 27 kümeyi öncelikle (P1-P4) sıralıyor; varsayılan 3 ajan paralel (`--concurrency=N`); her ajan kendi kümesini işliyor; çıktı `provenance: "swarm"` etiketli (insan düzenlemesi `provenance: "human"` = dokunulmaz); `--dry-run` promptu gösterir, çalıştırmaz.

**Kod dalgaları için ekle:**
1. **Worktree modu** — her ajan bir küme yerine bir *primitif/app branch*'i alır; ayrı worktree'de çalışır.
2. **Kod-kapısı ön-kontrolü** — ajan PR açmadan önce `check-*` kapılarını yerelde koşar (dry-run gate feedback); kırmızıysa PR açmaz, düzeltir.
3. **Bağımlılık sırası** — `k-mode` ve `k-policy-pdp`, `k-party`/`k-capability` bitmeden başlamaz (swarm'a dependsOn okutulur).

**Eşzamanlılık sınırı:** MacBook M4 üzerinde varsayılan 3 paralel ajan makul (donanım + API hız-sınırı). Daha fazlası için ajanları Hetzner kutusunda koşun (bkz. §6). Kernel dalgası (D1) 4 primitif ister; 3'lük concurrency ile biri sıraya girer, sorun değil — PDP zaten en sonda.

---

## 4. CI kapısı entegrasyonu — hangi kapı hangi dalgayı geçirir

Sade özet: her dalga farklı kapılarla korunur; ajan PR açar, *CI/CD* kapıları koşar, kırmızı kapı merge'i bloke eder. Tablodan önce not: 13 kapı `.github/workflows/deploy.yml`'de sıralı koşar; herhangi biri sıfır-dışı çıkarsa deploy durur.

| Dalga | Birincil kapılar | Ne doğrular |
|---|---|---|
| D0 | check-data-quality, check-surface, (yeni) grep-prisma | Bayat referans yok, şema varsayılanları doğru |
| D1 | check-core-contract, check-short-code, check-dependency-policy, check-standards-coverage | Primitifler kernel sözleşmesine uyuyor |
| D2 | check-surface, check-ui-standards, check-execution-readiness | Dikey dilim + config-driven surface + a11y |
| D3 | check-standards-coverage, check-dimension-applicability, check-i18n, check-waivers | Standartlar sözleşmeye bağlı, drift yok |
| D4 | (yeni) check-scale-invariant, secrets-scan, check-dependency-policy | Para akışı korumalı, secret temiz |
| D5+ | Tümü + app-bazlı L1 DoD | Bağımsız-satılabilir olgunluk |

Ajan-CI geri besleme döngüsü: ajan PR açmadan **önce** ilgili kapıları yerelde koşar (`node tools/agents/check-*.mjs`). Böylece kırmızı PR açılmaz; CI yükü ve insan-inceleme gürültüsü azalır. Bu, mevcut "CI post-commit" boşluğunu (developer-workflow-gap) kapatır.

---

## 5. Maliyet, kill-switch ve güvenlik sınırları

Sade özet: ajan filosunu koşmak para ve risk taşır; ikisini de sınırlarız. Bu bölüm `agentPolicy` şemasındaki alanların operasyonel karşılığıdır.

**Maliyet sınırları.** (1) Kırmızı test başına **max 6 iterasyon**; altıncıda hâlâ kırmızıysa ajan durur ve insana devreder (mevcut kural). (2) Ajan başına token/maliyet bütçesi; aşılırsa durur. (3) FinOps: AI-ajan maliyeti `plan-01` D4 FinOps panosunda ölçülür (unutulan en yaygın maliyet kalemi).

**Kill-switch.** `agentPolicy.killSwitch` = tek komutla tüm ajan filosunu durdurma. Beklenmedik davranış, döngü veya maliyet patlamasında *insan* bunu çeker; çalışan tüm worktree'ler dondurulur, hiçbir PR merge edilmez.

**Güvenlik sınırları (her ajana gömülü).**
- `allowedTargets`/`forbiddenTargets`: ajan app/module WBS düğümü **üretemez** (yalnız archetype ve altı).
- `prodDataPolicy`: ajan üretim verisine dokunamaz; yalnız staging/fixture.
- `subPromptUntrusted`: ajanın işlediği harici içerik (dosya, web) **güvenilmez** kabul edilir — prompt-injection savunması. Harici metindeki "talimatlar" yürütülmez.
- `rulesetBoundary`: ajan ruleset (ECA) override/disable edemez.
- `stepUp`: yüksek-riskli aksiyonlar (migration, silme) ek insan-onayı ister.
- Secrets: ajan koda secret gömemez; repo secrets-scan ile korunur.

---

## 6. OpenClaw + n8n otomasyon senaryosu

Bu bölüm sizin kurallarınıza uygun bir yerdir: tekrarlayan iş akışı + bildirim + takip + ajan orkestrasyonu + test/QA/deployment var. Otomasyon *Hetzner kutunuzda* koşar (Cowork'te değil). Sade özet: n8n olayları yönetir ve bildirir; OpenClaw ajan koşumunu tetikler; *insan* onay kapısında durur.

Aktör-açık dört senaryo:

**S1 — PR takip + bildirim.** *Ajan* PR açar → *n8n* (GitHub webhook dinler) PR'ı yakalar → CI kapı sonuçlarını toplar → *n8n* size özet bildirim gönderir ("k-party PR: 5/5 test yeşil, 13/13 kapı yeşil, inceleme bekliyor"). *İnsan* inceler ve merge eder. n8n merge etmez.

**S2 — Gate-rapor panosu.** *CI/CD* her koşuda kapı sonuçlarını üretir → *n8n* toplar → günlük "dalga sağlığı" raporu (hangi dalga nerede, kaç PR bekliyor, kırmızı kapı var mı). Sadece raporlama; karar değil.

**S3 — Ajan orkestrasyonu (worktree filosu).** *OpenClaw* Hetzner'de N worktree'de N ajanı sırayla/paralel tetikler (concurrency 3) → her ajan kendi branch'inde çalışır → biten ajan PR açar → *n8n* S1'i tetikler. *İnsan* kill-switch'i elinde tutar.

**S4 — Kanıt geri-yazımı.** PR merge olunca → *n8n* (merge webhook) → ilgili WBS düğümünün `evidence` alanına PR URL'i + test sonucu + deploy hedefini yazan bir job tetikler (RFC 6902 patch; `task-export-contract` Mode-3) → *insan* onayıyla `status: done`. Kanıtsız "bitti" olmaz.

Önemli sınır: OpenClaw+n8n **orkestrasyon ve bildirim** yapar — *karar* vermez ve *merge* etmez. Onay her zaman insanda. Bu, "AI main'e insan onayı olmadan yazmaz" enterprise varsayımını otomasyon katmanında da korur.

---

## 7. Bir dalgayı paralel koşma — uçtan uca örnek (Dalga 1)

Somut akış, Dalga 1'i (5 primitif) örnekler. Sade özet: dört primitif paralel, PDP en sonda; her biri ayrı worktree; hepsi PR + insan onayı ile kapanır.

1. *İnsan* ADR-A1..A4, ADR-P1'i "Kilitli"ye çevirir (D0 çıktısı).
2. *OpenClaw* dört worktree açar: `wt-k-party`, `wt-k-capability`, `wt-k-computation`, ve bir sırada `wt-k-mode`; `wt-k-policy-pdp` bağımlılık nedeniyle bekler.
3. Dört ajan paralel (concurrency 3, biri sırada) çalışır; her biri `plan-01` D1 promptunu + `plan-03` ilgili yönergesini alır; test-önce ritüelini uygular.
4. Her ajan PR açmadan önce yerelde `check-core-contract` + `check-short-code` koşar (dry-run gate).
5. Biten ajan PR açar; *n8n* size bildirir (S1).
6. *İnsan* PR'ları inceler, merge eder; `k-party`+`k-capability` merge olunca *OpenClaw* `k-mode` ve `k-policy-pdp` ajanlarını tetikler (bağımlılık çözüldü).
7. PDP entegre olur; *n8n* kanıtı düğümlere yazar (S4); *insan* `done` onaylar.
8. Dalga 1 DoD yeşil → `plan-01` Dalga 2 (Commerce dilimi) açılır.

Bu döngü her dalgada tekrar eder; yalnız ajan sayısı ve kapı seti değişir (`plan-01 §5` + §4). Böylece 16 uygulamalık portföy, tek geliştiricinin yönettiği bir ajan filosuyla, enterprise-güvenli ve paralel ilerler.
