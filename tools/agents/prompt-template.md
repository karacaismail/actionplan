<!--
  Per-cluster bespoke içerik üretim prompt'u (swarm ajanı).
  run-swarm.mjs bu dosyayı okur; {{CLUSTER}} ve {{CLUSTER_TR}} yer tutucularını doldurur.
  Her ajan TEK bir cluster'ı işler → izole dosya yazımı, çakışma yok.
-->
Proje kökü: bulunduğun dizin (actionplan reposu). JSON-as-DB: `src/data/generated/nodes/*.json`.

BAĞLAM: `source.cluster === "{{CLUSTER}}"` ({{CLUSTER_TR}}) düğümleri şu an JENERİK şablon içerikle dolu (tüm düğümlerde neredeyse aynı maddeler). GÖREVİN bunu her düğüme ÖZGÜ, benzersiz, gerçek, kurumsal (enterprise-grade) TÜRKÇE içerikle DEĞİŞTİRMEK. Kopyala-yapıştır kalıp YASAK — her düğüm kendi gerçek işlevine göre farklı yazılmalı.

KESİN KURALLAR:
- SADECE `source.cluster === "{{CLUSTER}}"` olan node JSON dosyalarını düzenle. Kod/config/index/navigation/meta veya başka cluster'a DOKUNMA.
- `node tools/reindex.mjs` ÇALIŞTIRMA (orkestratör en sonda bir kez çalıştırır). Kurulum yapma. Emoji yok.
- Şema: her düğümde `dimensions` 14 anahtar + `phases` 7 anahtar KORUNMALI. Şema-dışı alan ekleme. Geçerli JSON yaz.

ADIMLAR:
1. Bu cluster'ın düğüm listesini çıkar:
   `for f in src/data/generated/nodes/*.json; do node -e "const n=require('./'+process.argv[1]);if(n.source&&n.source.cluster==='{{CLUSTER}}')console.log(n.id+' :: '+n.title)" "$f"; done`
2. HER düğüm için dosyayı OKU (`title`, `summary`, `tags`) → düğümün NE olduğunu anla.
3. 14 boyutu O DÜĞÜME ÖZGÜ yaz. Her `dimensions[key]`: `{ "key", "title", "status": "filled", "items": [2-4 SOMUT madde], "notes": "" }`. Boyut rehberi (hepsi düğüme özel olmalı):
   - **featureDefs**: düğümün net işlevsel kapsamı, girdi/çıktı sözleşmesi.
   - **security**: bu düğümün GERÇEK tehdit yüzeyi (ör. yetki düğümü→policy template/least-privilege; veriyolu→poison message/SSRF; tenant→RLS+SET LOCAL).
   - **codeOptimization / securityOptimization / performance**: düğüme özel (ör. realtime→backpressure; ledger→bileşik indeks).
   - **mobileApps**: iOS/Android (PWA/Capacitor) + Chrome extension — düğüm bağlamında.
   - **wcag**: WCAG 2.2 AAA (kontrast 7:1, klavye, ARIA) — düğümün UI yüzeyi varsa somut.
   - **deployment**: Docker Swarm + Kubernetes (HPA/probe/limit) + WordPress sınıfı shared hosting kısıtı.
   - **eca**: düğümün GERÇEK olayına özel Event-Condition-Action kuralı + döngü kırıcı (maks zincir 6).
   - **aiAgents**: AI önerir/motor uygular, capability-gated, sub_prompt untrusted; düğüme özel davranış.
   - **testing**: unit + e2e + user journey + AI-destekli Playwright + testing-loop (maks 6, düzelmezse raporla) + autonomous QA.
   - **owasp**: OWASP Top 10:2025 (+ AI ilgiliyse LLM Top 10) — düğümün açık yüzeyine özel maddeler.
   - **integration**: bu düğümün kernel/core/modüller/app'lerle GERÇEK entegrasyonu (gerekli mi, nasıl).
   - **moduleUsage**: bu düğümü hangi app'ler nasıl kullanır (modül değilse kısa).
4. `phases` (requirements, test-plan, db-schema, development, test-qa, verification, release-maintenance): her birine düğüme özgü 1-3 `criteria` (DoD). Test-önce: `test-plan` fazı `db-schema`/`development`'tan önce `passed`/`active` olmalı. Gerçekçi `status` (pending/active/passed/failed).
5. PM alanları: `acceptanceCriteria` (2-4), `deliverables` (2-3), `risks` (1-2: {id,desc,severity,mitigation}), `effort` ({estimate,unit:'sp',spent}), `progress`, `status`, `phase`, `state` ('aday'/'incelemede') — düğüme uygun ayarla.
6. KORU: `id, wbsCode, parentId, level, dependsOn, blocks, related, source, tags, title, slug, summary, schemaVersion`.

Bitince: kaç düğümü benzersiz içerikle yazdığını + 2 örnek (id → bir security maddesi) tek paragraf raporla.
