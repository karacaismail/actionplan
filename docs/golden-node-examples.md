# Golden Düğüm Deseni — Referans Yapı

Sürüm: 1.0 · Tarih: 2026-06-29
Durum: Referans. Tam-donanımlı bir TaskNode'un **yapısını** gösterir.
İlgili: `src/schemas/task.ts` (şema = tek kaynak), `docs/adr-0027-engineering-standards.md`, `AGENTS.md`.

Bu doküman "golden düğüm" desenini tanımlar: tüm `standardRefs` dolu, her boyut için `applicability` gerekçeli, `evidence` bağlı ve 14 boyutu doldurulmuş örnek bir düğüm **iskeleti**. Amaç yapıyı ve her alanın anlamını göstermektir; **gerçek mock veri doldurulmaz** (alanların ne taşıyacağı açıklanır, içerik uydurulmaz). Çalışan golden düğüm ST-5'te (Golden Slice) gerçek değerlerle gelecektir.

---

## 1. "Golden Slice" Nedir

Golden Slice, sözleşmenin kendi kendini kanıtladığı **dogfooding** referansıdır: en az bir gerçek düğüm, bu repodaki tüm sözleşme alanlarını eksiksiz ve gerekçeli doldurur ve tüm CI kapılarından yeşil geçer. Diğer 445 düğüm bu desene göre olgunlaşır.

Golden bir düğüm şu beş koşulu birlikte karşılar:

1. **Tüm `standardRefs` çözülür** — 14 referans anahtarı geçerli bir standart/profil dosyasına işaret eder; `check-standards-coverage` yeşildir.
2. **Her boyut için `applicability` nettir** — boyut ya doludur ya `applies:false` + gerekçe taşır; jenerik dolgu yoktur; `check-dimension-applicability` yeşildir.
3. **`evidence` somuttur** — faz kapıları URL/dosya referansıyla desteklenir; metin iddiası değil.
4. **`waivers` disiplinlidir** — varsa her sapma gerekçeli + onaylı + süreli; `check-waivers` yeşildir.
5. **Kısa-kod ve yetki sınırı korunur** — `agentPolicy` kilitleri yerinde; boyutlar standardı kopyalamaz, referans verir.

Önemli: Golden düğüm standartların **metnini içermez**; onlara `standardRefs` ile bağlanır (altın kural, `AGENTS.md` Bölüm 2).

---

## 2. Golden Düğüm İskeleti (Yapı + Alan Açıklaması)

Aşağıdaki iskelet `TaskNodeSchema` (`.strict()`) yapısını izler. Değerler yerine **alanın ne taşıdığı** açıklanmıştır; yorum satırları (`//`) gerçek JSON'a girmez, yalnız burada alanı tarif eder. Gerçek bir golden düğüm bu iskeleti gerçek değerlerle (ST-5) doldurur.

```jsonc
{
  // --- Kimlik & hiyerarşi ---
  "schemaVersion": "1.0.0",              // şema sürümü (sabit, default ile dolar)
  "id": "<kebab-case-id>",               // küçük-harf kebab-case; benzersiz düğüm kimliği
  "wbsCode": "<WBS kodu>",               // hiyerarşik WBS numarası
  "level": "archetype",                  // 7 seviyeden biri; golden örnek için archetype (kod yazılan en üst seviye)
  "title": "<insan-okur başlık>",
  "slug": "<url-slug>",
  "summary": "<bir-iki cümle özet>",
  "parentId": "<üst düğüm id veya null>",
  "order": 0,
  "icon": "ph-cube",                     // Phosphor ikon adı (emoji yasak)
  "tags": [],                            // serbest etiketler

  // --- Bağımlılık & ilişki ---
  "dependsOn": [],                       // önce bitmesi gereken düğüm id'leri (DAG; döngü yasak)
  "blocks": [],                          // bu düğümün beklettiği düğümler (çoğunlukla dependsOn tersi, türetilir)
  "related": [],                         // yalnız gezinme; sıralama/nedensellik taşımaz
  "refs": [],
  "criticalPath": false,

  // --- Planlama & izleme ---
  "status": "todo",                      // backlog|todo|in-progress|blocked|review|done
  "priority": "high",                    // low|medium|high|critical
  "owner": "<ekip üyesi kimliği>",       // DoR kilidi: golden'da boş OLAMAZ
  "assignees": [],
  "effort": { "estimate": 0, "unit": "d", "spent": 0 },  // waterfall'da "d" = adam-gün
  "progress": 0,
  "phase": "development",                // güncel aktif faz (7 waterfall fazından biri)
  "phases": {                            // 7 faz kapısı; her biri PhaseGate
    "requirements":        { "status": "passed", "criteria": [], "passed": true,  "notes": "<kim/ne zaman geçirdi>" },
    "test-plan":           { "status": "passed", "criteria": [], "passed": true,  "notes": "<...>" },
    "db-schema":           { "status": "passed", "criteria": [], "passed": true,  "notes": "<...>" },
    "development":         { "status": "active", "criteria": [], "passed": false, "notes": "<...>" },
    "test-qa":             { "status": "pending","criteria": [], "passed": false, "notes": "" },
    "verification":        { "status": "pending","criteria": [], "passed": false, "notes": "" },
    "release-maintenance": { "status": "pending","criteria": [], "passed": false, "notes": "" }
  },

  // --- Yürütme ---
  "milestone": "<milestone adı veya null>",
  "schedule": {                          // planlanan/gerçekleşen/baseline tarihler (ISO veya null)
    "start": null, "end": null, "actualStart": null, "actualEnd": null,
    "baselineStart": null, "baselineEnd": null
  },

  // --- Kalite & kabul ---
  "deliverables": [],                    // somut teslimat çıktıları (en az 1; DoR)
  "acceptanceCriteria": [],              // ölçülebilir kabul kriterleri (en az 1; DoR)
  "risks": [],                           // {id, desc, severity, mitigation}
  "rollback": "<geri-alma komutu/runbook ref>",
  "evidence": [],                        // faz kanıtları: URL veya dosya referansı (metin iddiası değil)

  // --- Otomasyon (YAPISAL — motor çalıştırır, düz metin değil) ---
  "ecaRules": [],                        // {id,event,when[],then,maxChainDepth<=6,requiresApproval}
  "agentPolicy": {                       // AI yetki sınırı kilidi (bkz. AGENTS.md Bölüm 4.4)
    "autonomy": "suggest",
    "allowedTargets": ["archetype"],     // AI yalnız archetype ve altını hedefleyebilir
    "forbiddenTargets": ["app", "module"],
    "forbiddenActions": ["generate-app","generate-module","update-app","update-module","override-ruleset","direct-prod-write","rewrite-history"],
    "rulesetBoundary": { "enforced": true, "canOverride": false, "backendOnly": true },
    "killSwitch": true
  },

  // --- 14 üretim boyutu ---
  // Her boyut: {key,title,status,items[],notes,prompt,provenance}. Golden'da her boyut
  // YA doludur (status: "filled", items somut) YA da applicability ile N/A işaretlidir.
  // items[] standardın METNİNİ içermez; ilgili standardRef'e uyar (altın kural).
  "dimensions": {
    "featureDefs":          { "key": "featureDefs",          "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<bağlama-özgü prompt>", "provenance": "swarm" },
    "security":             { "key": "security",             "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "codeOptimization":     { "key": "codeOptimization",     "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "securityOptimization": { "key": "securityOptimization", "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "performance":          { "key": "performance",          "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "mobileApps":           { "key": "mobileApps",           "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "wcag":                 { "key": "wcag",                 "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "deployment":           { "key": "deployment",           "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "eca":                  { "key": "eca",                  "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "aiAgents":             { "key": "aiAgents",             "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "testing":              { "key": "testing",              "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "owasp":                { "key": "owasp",                "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "integration":          { "key": "integration",          "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" },
    "moduleUsage":          { "key": "moduleUsage",          "title": "<...>", "status": "filled", "items": [], "notes": "", "prompt": "<...>", "provenance": "swarm" }
  },

  // --- İzlenebilirlik (plan ↔ gerçek kod) ---
  "traceability": {
    "repoPath": [],                      // platform monoreposundaki dosya/dizin yolu/yolları (DoR)
    "testCommand": [],                   // bu düğümü doğrulayan test komutu/komutları (DoR)
    "deployTarget": null,                // staging/prod hedefi
    "implementationStatus": "in-progress", // not-started|scaffolded|in-progress|implemented|verified
    "tenantStrategy": null,              // schema-per-tenant|rls|hybrid
    "auditLogRef": null
  },

  // --- Mühendislik standardı bağı (ADR-0027): REFERANS, kopya DEĞİL ---
  // Golden'da 14'ünün TAMAMI dolu; her biri gerçek bir standart/profil dosyasına çözülür.
  "standardRefs": {
    "techProfileRef":     "<tech-profiles.json içindeki profil id; ör. saas-app>",
    "architectureRef":    "architecture",        // -> src/data/standards/architecture.json
    "codingStandardRef":  "coding-standards",    // -> src/data/standards/coding-standards.json
    "shortCodeRef":       "short-code",          // -> src/data/standards/short-code.json
    "designSystemRef":    "design-system",       // -> src/data/standards/design-system.json
    "uiComponentRef":     "ui-components",        // -> src/data/standards/ui-components.json
    "uxStandardRef":      "ux-interaction",       // -> src/data/standards/ux-interaction.json
    "dataApiContractRef": "data-api-contract",    // -> src/data/standards/data-api-contract.json
    "stateContractRef":   "state-management",     // -> src/data/standards/state-management.json
    "testingStandardRef": "testing-strategy",     // -> src/data/standards/testing-strategy.json
    "qualityGateRef":     "quality-gates",        // -> src/data/standards/quality-gates.json
    "observabilityRef":   "observability",        // -> src/data/standards/observability.json
    "releasePolicyRef":   "release-versioning",   // -> src/data/standards/release-versioning.json
    "aiGovernanceRef":    "ai-governance"         // -> src/data/standards/ai-governance.json
  },

  // --- Boyut uygulanabilirliği (dimKey -> {applies, reason}) ---
  // applies:false ise reason ZORUNLU (check-dimension-applicability bloklar).
  // Boş bırakılan boyut "uygulanır" sayılır. N/A boyut JENERİK doldurulmaz.
  "applicability": {
    // ör. bir backend-only düğümde:
    // "wcag":       { "applies": false, "reason": "<bu düğüm UI yüzeyi içermez; erişilebilirlik N/A>" },
    // "mobileApps": { "applies": false, "reason": "<istemci yüzeyi yok; sunucu sözleşmesi düğümü>" }
  },

  // --- Standarttan bilinçli sapma (gerekçeli + onaylı + süreli) ---
  // Varsayılan: boş. Sapma varsa her kayıt scope+reason+approvedBy+date+expires taşır.
  "waivers": [
    // { "id": "<waiver-id>", "scope": "<standardRef veya dimKey>", "reason": "<neden>", "approvedBy": "<insan>", "date": "<ISO>", "expires": "<ISO>" }
  ],

  // --- Köken & governance ---
  "source": { "corpus": "merged", "originalId": "", "granularity": "", "cluster": "<küme adı>" },
  "state": "aday",                       // taslak|aday|incelemede|dogrulanmis
  "lastUpdated": "<ISO tarih>"
}
```

---

## 3. Alan Kümeleri — Golden Sayılmak İçin Hangi Bloklar Zorunlu

| Blok | Golden koşulu | İlgili kapı |
|---|---|---|
| `standardRefs` (14) | Hepsi dolu; her biri gerçek dosyaya çözülür | check-standards-coverage |
| `applicability` | Dolu olmayan her boyut için `applies:false` + reason | check-dimension-applicability |
| `dimensions` (14) | Uygulanan boyutlar `status:"filled"` + somut, prompt'lu | check-content / test:content |
| `waivers` | Varsa gerekçe + onay + süre tam | check-waivers |
| `agentPolicy` | Yetki sınırı kilitleri yerinde (app/module yasak) | check-ruleset |
| kısa-kod | Boyut/içerik kapsam taşmasız | check-short-code |
| `traceability` + `owner` + `acceptanceCriteria` | DoR alanları dolu | check-ready-for-dev |
| `evidence` | Geçmiş faz kapıları kanıtla desteklenmiş | check-execution-readiness |

---

## 4. Bu Desenle İlgili Kurallar (Hatırlatma)

1. **Referans, kopya değil.** `dimensions[...].items` bir standardın metnini tekrar etmez; ilgili `standardRefs.<key>`'e uyar. Drift yasaktır (`AGENTS.md` Bölüm 2).
2. **N/A dürüstlüğü.** Uygulanmayan boyut gerekçeyle `applies:false` işaretlenir; jenerik dolguyla "doldurulmuş" gösterilmez.
3. **Kanıt zorunlu.** Geçmiş faz kapıları (`passed:true`) `evidence` referansı olmadan geçersiz sayılır.
4. **Yetki sınırı.** Golden düğüm de AI'nin app/module üretmesine/güncellemesine veya ruleset override'ına kapı aralayamaz.
5. **Bu doküman veri değil desen.** Buradaki iskelet öğreticidir; gerçek golden düğüm değerleri ST-5'te `src/data/generated/nodes/` altında gelir. Bu dosyaya mock içerik yazılmaz.
