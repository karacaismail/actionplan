# Enterprise SaaS — Faz 5–11 Kabul Oracle'ları (Red/Green Checklist)

**Rol:** Claude SLAVE writer. Codex MASTER + nihai otorite.
**Faz:** Faz 5–11 için **test-önce kabul iskeleti** ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §3, §4). Faz 4.5 D1–D6 CLOSED sonrası yazıldı; kararlar kapandı fakat bu belge **karar kapanışını uyum/implementation kanıtı saymaz**.
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> Bu belge **docs-only kabul checklist'idir**, requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ve **executable gate değildir**. Buradaki "red/green" satırları **reviewer/CI'nin koşacağı** deterministik metin/link kontrolleridir; bu worker **yeni makine gate/test/kod yazmaz**, JSON/node/schema üretmez, commit/push/merge yapmaz. Sayı/ICP/jurisdiction/provider **uydurulmaz**; hepsi [`ledger`](./enterprise-saas-human-decision-queue.md)'daki iletilen insan kararına dayanır.

## Baseline snapshot (pre-D2–D6)

Aşağıdaki 8 SHA1, kapanış turundan **önceki** doküman baseline'ıdır (blob hash; Codex `git hash-object` ile teyit eder). **Kapanışta değişen dokümanların hash'i FARKLI beklenir; değişmeyenler AYNI kalmalıdır.** Bu tablo executable değildir; reviewer karşılaştırması içindir.

| SHA1 (pre-D2–D6) | Doküman | Kapanışta beklenen |
|---|---|---|
| `8f48f414faebf772b316b6ec46e850c432db367e` | [`capability-ontology`](./enterprise-saas-capability-ontology.md) | değişmedi → AYNI |
| `47e4de77aded99e1c27a41aa153155785253deb0` | [`human-decision-queue`](./enterprise-saas-human-decision-queue.md) | değişti (D2–D6) → FARKLI |
| `f885497dd542da324557a2e73cae449d91704696` | [`product-family-composition`](./enterprise-saas-product-family-composition.md) | değişti (kapanış senkron) → FARKLI |
| `918c2bf36fd38e4d6a0cc1679e7f50d73a9a54ae` | [`requirement-constitution`](./enterprise-saas-requirement-constitution.md) | değişmedi → AYNI |
| `28a27deeaedcded8d1adb113c6111fa2a41eb971` | [`requirement-program-preflight`](./enterprise-saas-requirement-program-preflight.md) | değişmedi → AYNI |
| `40e08a82ae799e975ac9e3f9096883ede44d690f` | [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) | değişti (§8/§9) → FARKLI |
| `face9bb440a31c4178e17d299819a3a6b39da760` | [`source-normalization-matrix`](./enterprise-saas-source-normalization-matrix.md) | değişmedi → AYNI |
| `e3a70b2d2c37d24d602ab7055d222021acc02c83` | [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) | değişmedi → AYNI |

## Kapanış-öncesi kırmızı oracle'lar (gözlemlendi, exit 1)

Kapanış turundan **önce** aşağıdaki yedi deterministik kontrol **RED** verdi (metin taraması hedef ifadeyi bulamadı → `exit 1`). Kapanış sonrası aynı kontroller GREEN'e döner; bu satır **tarihsel kanıttır**, yeniden koşulacak gate değildir.

| # | Kontrol (metin taraması) | Pre-closure | Post-closure |
|---|---|---|---|
| 1 | D2–D6 **CLOSED** kaydı var mı | RED (exit 1) | GREEN |
| 2 | Faz 4.5 **GO (docs-only)** ifadesi var mı | RED (exit 1) | GREEN |
| 3 | İlk aile **ICP** (Commerce OS + Türkiye ticaret) yazılı mı | RED (exit 1) | GREEN |
| 4 | İlk **jurisdiction = Türkiye** + counsel gate var mı | RED (exit 1) | GREEN |
| 5 | Hedef **pilot tier** (Controlled Paid Enterprise Pilot) var mı | RED (exit 1) | GREEN |
| 6 | **%99.9** availability eşiği (bağlamlı) yazılı mı | RED (exit 1) | GREEN |
| 7 | [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §8 "kararlar CLOSED" güncellemesi var mı | RED (exit 1) | GREEN |

## Faz 5 — Enterprise requirement domain kabul

- **Lane çıktısı:** 8 ayrı lane (5A strategy/commercial · 5B identity/tenant/org · 5C data/metadata · 5D security/privacy/compliance · 5E reliability/operations · 5F integration/extensibility · 5G UX/globalization/accessibility · 5H AI/data science) **ayrı çıktı veya açıkça ayrılmış bölüm** üretir; 8'den az = RED ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 5).
- **Candidate kayıt alanları:** her aday için `owner` · `dataAuthority` · `lifecycleAuthority` · `riskTier` · `test oracle` · `status` DOLU; herhangi biri boş → kayıt **`unresolved`** (RED, promote edilmez).
- **Provisional BC promotion test:** her `*`-provisional BC (Marketplace, B2B, Subscription, Service, Channel, Promotions, Recommerce, Classifieds, Supplier, Auction, Settlement, Compliance) tekil `owner`/`dataAuthority`/`lifecycleAuthority`/independent-policy testini **yeniden geçer**; geçemezse **demote** ([`composition`](./enterprise-saas-product-family-composition.md) §Commerce OS Card).
- **Kapsam sınırı:** çıktı yalnız **onaylanabilir candidate set / domain-completeness**; requirement listesi/backlog/node/schema/gate/implementation **DEĞİL**. Kapsamı Commerce OS + Türkiye ICP çerçeveler (D2/D4 CLOSED).
- **Stop-gate:** owner/authority/riskTier/test oracle belirsiz → `unresolved`; bu worker Faz 5'i **açmaz** (Codex ayrı dalgada).

## Faz 6 — Unknown-unknown probe programı kabul

En az **13** probe zorunlu; her probe alanları: `hypothesis` · `trigger` · `blastRadius` · `owner` · `method` · `fixture` · `expectedEvidence` · `timebox` · `result` · `decision` ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 6). **`result` uydurulmaz** — koşulmamış probe `unresolved` kalır; `confirmed/rejected/unresolved` yalnız gerçek kanıtla.

| # | Zorunlu probe | Kaynak (§6) |
|---|---|---|
| 1 | Tenant leakage / cross-tenant leak | [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §6 |
| 2 | Noisy neighbor | §6 |
| 3 | Provider outage / exit | §6 |
| 4 | Restore failure | §6 |
| 5 | Region / key loss | §6 |
| 6 | Plugin exfiltration | §6 |
| 7 | AI silent failure / drift | §6 |
| 8 | Agent / ECA runaway (depth>6, forbidden write, human-stop bypass) | §6 |
| 9 | Deletion-retention / legal-hold conflict | §6 |
| 10 | KPI reconciliation | §6 |
| 11 | Export / import round trip | §6 |
| 12 | Jurisdiction / regulated-role drift | §6 |
| 13 | Replay / idempotency | §6 |
| 14 | Metadata upgrade blast radius | §6 |

**Stop-gate:** probe sonucu (gerçek) olmadan yüksek-risk requirement `validated` OLAMAZ.

## Faz 7 — Waterfall baseline / traceability / test planı kabul

- Her requirement için zincir **eksiksiz**: `source → decision → baseline → AC → test level → test command placeholder → evidence type → release/rollback`; boş hücre → RED ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 7).
- `verification` (spec'e uygun mu?) ile `validation` (doğru ürün mü?) **ayrık**; validation authority yazılı.
- Baselined requirement değişirse `change request` + `impact analysis` + etkilenen testlerin yeniden onayı **zorunlu**.
- **No dev recommendation:** test oracle/db-schema geçmeden development **önerilmez**; placeholder komut ≠ koşulmuş test.

## Faz 8 — Standart/control crosswalk kabul

- Her satır **sürümlü referans**: `standard` · `version` · `controlId` · `applicability` · `requirementId` · `evidence` · `waiver`; standart metni node'a kopyalanmaz.
- **No compliance claim:** standarda atıf **uyumluluk iddiası DEĞİLDİR**; lisanslı/mevzuat yorumu insan uzman kararına bırakılır (Türkiye counsel).

## Faz 9 — Tutarlılık / dedup / adversarial review kabul

- Çıktı: `conflict ledger` · `cycle report` · `duplicate report` · `unresolved decisions`.
- Reviewer'lar ilk turu **birbirini görmeden** tamamlar; integration lane her bulguyu **`KATILIYORUM` / `KISMEN` / `KATILMIYORUM`** + repo kanıtı ile değerlendirir.
- **Stop-gate:** authority conflict veya dependency cycle varken **yayın yok**.

## Faz 10 — İnsan karar kapısı kabul

- **En fazla 10** karar; yalnız **gerçekten ürün yönünü değiştiren** kararlar (rutin/derive edilebilir olan hariç). Her karar: `options` · `trade-off` · `affected requirements` · `default-if-deferred` · `irreversible cost` · `recommended evidence`.
- Recommended evidence **öneridir**; somut ICP/jurisdiction/provider/sayı seçimi insan yetkisidir (AI seçmez).

## Faz 11 — Yayın/handoff kabul

- Çıktı: `dosya manifesti` · `link kontrolü` · `diff özeti` · `doğrulama sonuçları` · `readiness/kalan riskler`.
- **No publish:** sahte evidence / "enterprise tamam" / product implementation / kanıtsız node **yasak**; generated JSON/node/queue **ayrı, insan-onaylı sonraki dalga**. Bu worker commit/push/merge/deploy **yapmaz**.

## Global red/green kontroller (checklist, executable gate değil)

| Kontrol | Tür | Red koşulu |
|---|---|---|
| Allowed-files | AUTO (`git status` Codex'te) | 4 izinli md dışında değişiklik |
| No JSON/node/schema/gate/kod | AUTO | generated JSON/node/queue/schema/gate/kod üretimi |
| No commit/push/merge | MANUAL | worker VCS yazma işlemi |
| Relative link target (in-branch) | MANUAL/CHANGESET | kırık/absolute link |
| Sibling no broken link | AUTO | `adr-0029`/`reoc-*` Markdown link (untracked/not-in-branch) |
| Claim (kanıtsız sayı/"tamam") | AUTO | SLO/ICP/probe sonucu uydurma; "enterprise-ready/GA" kanıtsız |
| Karar ≠ implementation/baseline | AUTO/MANUAL | "CLOSED" → uyum/implementation kanıtı iddiası |

## Stop gate ve worker beyanı

- Bu belge **kabul checklist'idir, koşulan gate değildir**; "kırmızı→yeşil" yalnız reviewer/CI deterministik kontrol koştuğunda geçerlidir, aksi halde `MANUAL/CHANGESET`.
- **D1–D6 CLOSED** (bağlayıcı insan kararı) fakat kompozisyon kartları `candidate`; **implementation/baseline kanıtı YOKTUR**; residual validation açıktır (counsel, Faz 5 candidate, probe, traceability, provider drill, ölçülmüş SLO/COGS).
- **Faz 4.5 GO yalnız Faz 5 docs-only candidate analizi içindir.** Faz 5–11 yalnız Codex onayıyla ayrı, yetkili dalgalarda açılır.
- Yazılan izinli dosyalar yalnız 4 md; JSON/schema/gate/node/app/module/kod/test yok. Commit/push/PR/merge **yapılmadı**; sibling worktree değişmedi. Codex bağımsız doğrulamadan bu çıktı tamamlanmış sayılmaz.