# Enterprise SaaS Requirement Program — Phase 0 Preflight

**Rol:** Claude SLAVE worker (read-only analyst). Codex MASTER + nihai otorite.
**Faz:** 0 (preflight + gerçeklik envanteri). Faz 1'e geçilmez.
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

Bu belge yalnız envanterdir; hiçbir requirement'ı `validated`/`baselined` ilan etmez, hiçbir
generated JSON/app/module/node/queue değişikliği önermez. Kaynak araştırma metinleri kanonik
DEĞİLDİR; yalnız karar girdisidir.

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (Task tool yok; yalnız Bash/Read/Grep/Glob/Edit).
Bu nedenle 12 iş **sıralı** yürütüldü; paralellik iddia edilmez. Eşzamanlı analyst tavanı (≤8)
konu dışı kaldı çünkü hepsi tek-yazar olmayan salt-okunur envanter işidir.

- Yürütülen agent-task sayısı: **12/12** · Mod: **sequential (mechanism unavailable)** · Hepsi READ-ONLY.
- Tek yazar/entegrasyon adımı: yalnız bu dosya (`docs/enterprise-saas-requirement-program-preflight.md`).

| # | İş | Kapsam | Kanıt | Sonuç |
|---|---|---|---|---|
| A1 | repo/AGENTS | rol sınırı, kilitler | [`../AGENTS.md`](../AGENTS.md) | doc-maintainer = kod yazmaz; §4 kilitler okundu |
| A2 | kanonik kararlar | task→code, DoR | [`./task-to-code-contract.md`](./task-to-code-contract.md), [`./ready-for-dev-gate.md`](./ready-for-dev-gate.md) | seviye/faz sözleşmesi teyit |
| A3 | Waterfall/DoR/DoD | 7 faz, done kapısı | [`./enterprise-dod.md`](./enterprise-dod.md), [`./waterfall-developer-handoff.md`](./waterfall-developer-handoff.md) | test-önce + kanıtlı-done teyit |
| A4 | standards/gates | 15 standart, CI kapıları | [`./engineering-standards-index.md`](./engineering-standards-index.md), [`../.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | "referans ver, tekrarlama" + bloklayıcı kapılar teyit |
| A5 | generated JSON örneklem | 6+ node, 7 seviye | [`../src/data/generated/meta.json`](../src/data/generated/meta.json) + node'lar | 467 düğüm, hepsi backlog |
| A6 | implementation workspace ayrımı | ayrı checkout | [`./implementation-workspace-manifest.md`](./implementation-workspace-manifest.md), [`./kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md) | platform reposu ayrı; kod burada değil |
| V1 | source-authority validation | araştırma ≠ kanon | girdi docs §Durum satırları | DRAFT/karar-girdisi etiketi doğrulandı |
| V2 | terminology validation | metafor + şema terimleri | [`../src/schemas/task.ts`](../src/schemas/task.ts) | app..micro_step, WATERFALL_PHASES, maxChainDepth≤6 teyit |
| V3 | link-target validation | girdi docs'daki relative link'ler | `ls` çıktısı (aşağıda) | 9/9 hedef mevcut |
| V4 | generated-node prohibition | yazma önerisi yok | bu belge kapsamı | JSON/node yazımı ÖNERİLMEZ |
| V5 | dirty-worktree/allowed-files | `git status` | aşağıda | tracked temiz; yalnız 2 untracked input |
| V6 | claim/evidence validation | kanıtsız "tamam" yok | tüm satırlar link'li | doğrulanamayan iddia yok |

## Repository state

- HEAD: `6900d38b4fdc1007bd2f8e3931ee60a1a8bdb223`
- Branch: `codex/enterprise-saas-requirements-2026-07-13`
- Path (cwd): `/Users/karaca/DEV/mimari/actionplan-enterprise-saas`
- `git status --porcelain` (AUTO):
  - `?? docs/enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md`
  - `?? docs/enterprise-saas-waterfall-claude-multi-agent-directive.md`
- `git diff --stat` ve `git diff --cached --stat`: **boş** → izlenen (tracked) worktree TEMİZ.

Bu (temiz sibling) worktree, iki kullanıcı-tarafından-sağlanan girdi dokümanı import edilmeden
önce temizdi; bu iki girdi yalnız **untracked** olarak eklenmiştir ve **değiştirilmemiştir**.
Bu preflight yalnız yeni izinli dosyaya yazar; kirli/izlenen kaynak worktree'ye veya iki girdiye
dokunmaz.

## Source authority table

| Katman | Otorite | Kanon mu? |
|---|---|---|
| Şema (TS tipleri) | [`../src/schemas/task.ts`](../src/schemas/task.ts) | Kanonik (insan-onaylı değişir) |
| İçerik DB | [`../src/data/generated/nodes/`](../src/data/generated/nodes) (467) + [`meta.json`](../src/data/generated/meta.json) | Kanonik veri |
| Standart sözleşmeleri | `../src/data/standards/*.json` + [`index`](./engineering-standards-index.md) | Kanonik; düğüm ref verir |
| Ajan sözleşmesi | [`../AGENTS.md`](../AGENTS.md), [`./doc-maintainer-operating-boundary.md`](./doc-maintainer-operating-boundary.md) | Kanonik/bağlayıcı |
| CI kapıları | [`../.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | Kanonik (kaynak kabul) |
| Enterprise SaaS girdi docs (2) | 2 untracked doc | **Kanon DEĞİL** — karar girdisi/DRAFT |

Araştırma metnindeki sayılar (`2.000–30.000 capability`, `50.000 AC`, `100 app`) ve vendor/protokol
adları requirement değildir; ancak kanıtlı portföy ihtiyacı doğrulanırsa kullanılabilir.

## Canonical contracts

- **7 seviye:** app→module→archetype→feature→component→work_unit→micro_step (doğa metaforu; `qa:wbs` zorlar).
- **7 faz:** requirements→test-plan→db-schema→development→test-qa→verification→release-maintenance;
  `phases[<önceki>].passed===true` olmadan sonraki faz `active` olamaz.
- **Test-önce:** oracle olmadan development yok; app/module kod yazma yeri değil (archetype+ kod yazar).
- **Standart:** yeniden yazma, `standardRefs.<...>Ref` ile referans ver (ADR-0027).
- **AI yetki kilidi:** `forbiddenTargets` default `["app","module"]`; `maxChainDepth` ≤ 6
  (kanıt: `task.ts:294`, `task.ts:254`).
- **Teslim sırası:** kernel→SDK→app-core→app module→app ([`./kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md)).

## Generated JSON read-only sample

[`meta.json`](../src/data/generated/meta.json): total **467**; byLevel module 178, archetype 105,
feature 101, app 28, micro_step 19, component 18, work_unit 18; **byStatus: backlog 467**.
Salt-okunur olarak incelenen 6 temsili düğüm (yazılmadı, önerilmedi):

| Seviye | Dosya | id | wbsCode | status |
|---|---|---|---|---|
| app | [`platform-factory.json`](../src/data/generated/nodes/platform-factory.json) | platform-factory | 9 | backlog |
| module | [`sus-llm-hata-katalogu.json`](../src/data/generated/nodes/sus-llm-hata-katalogu.json) | sus-llm-hata-katalogu | 10.1.1 | backlog |
| archetype | [`s-workforce.json`](../src/data/generated/nodes/s-workforce.json) | s-workforce | 18.7 | backlog |
| feature | [`tas-crm-lead-mgmt.json`](../src/data/generated/nodes/tas-crm-lead-mgmt.json) | tas-crm-lead-mgmt | 14.2.1.1 | backlog |
| work_unit | [`molekul-crm-score-weight-config.json`](../src/data/generated/nodes/molekul-crm-score-weight-config.json) | molekul-crm-score-weight-config | 14.2.1.1.1.1 | backlog |
| micro_step | [`atom-crm-score-range-check.json`](../src/data/generated/nodes/atom-crm-score-range-check.json) | atom-crm-score-range-check | 14.2.1.1.1.2.3 | backlog |

Not: Bu örnekleme yalnız gerçekliği doğrular; hiçbir node alanı yazılması/oluşturulması önerilmez.

## Implementation workspace boundary

Ürün/platform kodu bu repoda DEĞİL. Hedef checkout: `platform` (`/Users/karaca/DEV/mimari/platform`,
`local-checkout-no-remote-configured`, default branch `master`), kökler `apps/api`, `apps/web`,
`packages/sdk`, `packages/ui`, `infra` ([`./implementation-workspace-manifest.md`](./implementation-workspace-manifest.md)).
Doc-maintainer bu checkout'a geçip kod/migration/scaffold/test **üretmez**; yalnız handoff
yeterliliğini belgeler. actionplan `.json` düzenlemek "veri", "kod yazmak" değildir.

## Contradictions and dispositions

| # | Gözlem | Disposition |
|---|---|---|
| C1 | Girdi directive "kod yaz/Claude Code'a ver" ifadeleri içerir | Bu ifadeler implementation geliştiricisine yöneliktir; doc-maintainer uygulamaz (AGENTS §0). Çelişki yok, kapsam sınırı. |
| C2 | [`./enterprise-dod.md`](./enterprise-dod.md) "actionplan stack: … Tailwind" der; [`../AGENTS.md`](../AGENTS.md)/manifest ürün için SCSS+token, Tailwind yalnız tooling | Tutarlı okuma: Tailwind actionplan **tooling** yüzeyi; ürün frontend SCSS. Terim netliği MANUAL/CHANGESET adayı (yeni gate önermez). |
| C3 | Girdi docs sayısal hedefler (8k capability vb.) | Kanon değil; yalnız kanıtlı ihtiyaçta kullanılır (MANUAL karar). |
| C4 | Girdi docs relative link'leri (`../src/schemas/task.ts` vb.) | V3'te tümü çözüldü; kırık yok. |

Çözülmemiş authority çatışması veya dependency cycle iddiası **yok** (bu fazda graph analizi
yapılmadı; DAG doğrulaması `qa:data` kapısının işi — AUTO, bu worker koşmadı).

## Allowed-files manifest

- Yazılan (tek): `docs/enterprise-saas-requirement-program-preflight.md`.
- **Non-goals:** iki girdi doc'u değiştirmek; `docs/README.md`; herhangi JSON/generated/queue/node/
  schema/gate/workflow/package/kaynak kod/test; commit/push/PR/deploy; cwd dışı path.
- Dokunulmayan girdiler (untracked, değişmemiş): `docs/enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md`,
  `docs/enterprise-saas-waterfall-claude-multi-agent-directive.md`.

## Deterministic checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 headings (bu dosya) | AUTO (oracle metin taraması) | 10/10 başlık mevcut — reviewer/CI teyidine açık |
| Relative link target (9 hedef) | AUTO (`ls`) | 9/9 mevcut: engineering-standards-index, enterprise-dod, kernel-sdk-app-delivery-sequence, README, ready-for-dev-gate, standards/14-enterprise-readiness-checklist, task-to-code-contract, waterfall-developer-handoff, src/schemas/task.ts |
| Worktree temizliği | AUTO (`git status`/`git diff`) | tracked temiz; yalnız 2 untracked input |
| Terminology (metafor+şema) | MANUAL/CHANGESET | task.ts atomları teyit; ürün-stack terim netliği reviewer matrisi |
| Dedup / DAG / traceability | MANUAL/CHANGESET | bu fazda makine grafiği koşulmadı; `qa:data`/`qa:waterfall` AUTO kapıları Codex tarafında |
| Claim/evidence | MANUAL | her satır link'li; kanıtsız tamamlanma dili kullanılmadı |

Not: Yukarıdaki AUTO satırları bu worker'ın koşabildiği kontrollerdir. Repo CI kapıları
(`qa:*`, `npm test`, e2e) bu worker tarafından **koşulmadı**; onlar Codex'in bağımsız doğrulamasına aittir.

## Stop-gate decision

- Kirli izlenen worktree'ye yazma: **İHLAL YOK** (tracked temiz; yalnız izinli yeni dosya yazıldı).
- Temiz sibling worktree yok → DUR koşulu: **tetiklenmedi** (worktree temizdi).
- Generated JSON/app/module/node yazımı: **önerilmedi**.
- Kanıtsız "enterprise tamam / hazır" iddiası: **yok**.

**Faz 0 GO/NO-GO:** Faz 1'e geçiş kararı Codex'e aittir. Bu worker envanteri tamamladı ve durur;
Faz 1 (kaynak iddia normalizasyonu) yalnız Codex onayıyla ayrı, yetkili bir dalgada başlar.
