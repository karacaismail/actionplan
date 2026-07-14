# Dosya 5 — 2026-07-01 Tarihsel Durum Raporu

> **ARCHIVED-HUMAN-HANDOFF** — bu belge güncel yürütme planı değildir.
> Yetki zinciri: `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM ardıl koordinasyon yetkilisidir. AI erişimi
> `read-only-audit`, platform yürütücüsü `human-developer-only`dır.

Bu dosya 2026-07-01 tarihindeki planlama/sözleşme çıktılarını kaydeder. Eski swarm, model,
sunucu ve sonraki-adım talimatları kaldırılmıştır. Güncel kararlar gerçek repo, kanonik JSON ve
CI kanıtına dayanır.

## 1. Tarihsel artefakt özeti

O turda şu anlatı katmanları hazırlanmıştı:

| Küme | Tarihsel kapsam |
|---|---|
| ADR taslakları | kernel kimliği, Actor/Party, Capability, Mode-Profile, Computation, PDP |
| Primitif sözleşmeleri | actor, entitlement, mode, derivation ve policy karar zarfları |
| Çatı yönergeleri | AI governance, Surface v2, scale invariant |
| Numeronym kaynakları | sınıflandırma, audit ve standard taslakları |

Bu sayımlar yalnız tarihsel doküman üretimini gösterir; schema, runtime, deployment veya ürün
hazırlığı kanıtı değildir.

## 2. Tarihsel gap'lerin bugünkü yorumu

- Anlatı standardının bulunması makine-okunur JSON ve CI enforcement anlamına gelmez.
- ADR taslağının bulunması kararın kilitli veya runtime'ın implemented olduğu anlamına gelmez.
- Platform path'i yazılmış olması gerçek branch, PR, test veya deployment evidence değildir.
- Seed/jeneratör kaynağı güncel kanonik node'ları güvenle yeniden üretebildiğini ayrıca
  kanıtlamalıdır.

Güncel kernel sonucu `NO-GO`dur: 41 kernel düğümünün runtime evidence alanı boştur ve veri
düzlemi zinciri implementation kanıtı taşımamaktadır. Kanonik ayrıntı:
`docs/kernel-readiness-gap-analysis-2026-07-14.md`.

## 3. Güncel yetki ve yürütme ayrımı

| Rol | Yetki |
|---|---|
| Codex | kapsam, öncelik, rollback, Git/PR ve nihai teslim kararı |
| PM | Codex sonrasında sıra, bağımlılık ve evidence koordinasyonu |
| Uzman ajanlar | salt-okunur alan bulgusu ve acceptance önerisi |
| Claude worker/slave | yalnız Codex'in sınırlı çağrısında ara çıktı |
| İnsan geliştirici | onaylanmış handoff'u platform reposunda test-first uygular |

AI aktörleri platformda branch, commit, PR, test, migration veya ürün kodu yazmaz. Provider
ve hesap doğrulaması sağlanmayan Claude çağrısı fail-closed durur.

## 4. Güvenli devam sırası

1. Actionplan'da kanonik docs/JSON/task-page tutarlılığını test-first düzelt.
2. Base execution queue'daki predecessor evidence'i doğrula.
3. Kernel veri düzlemi için yalnız bir sonraki insan geliştirici packet'ini aç.
4. İnsan geliştirici kırmızı test → implement → test → PR/CI/evidence sırasını izler.
5. Codex kanıtı bağımsız doğrulamadan status veya completion ilerlemez.

Bugünkü ilk kernel artışı hâlâ `KDP-01` ArcheType storage sözleşmesidir; fakat yalnız base
queue sırası, insan queue-order kararı, tenancy/schema portları ve temiz worktree kanıtı
sağlanınca code-start değerlendirilebilir.

## 5. Rollback sınırı

Bu arşiv dosyalarının geri alınması yalnız doküman tarihini geri getirir; runtime rollback
değildir. Platform rollback'i insan geliştiricinin PR kapsamı, migration downgrade, deploy
runbook'u ve gözlemlenmiş evidence ile ayrı planlanır.
