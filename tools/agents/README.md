# Agent Swarm — tarihsel shard handoff önizlemesi

Bu dizindeki eski swarm tanımları tarihsel shard envanteridir. Repo içinden doğrudan Claude,
alt-ajan veya paralel writer çalıştırılmaz. `run-swarm.mjs` yalnız salt-okunur handoff önizlemesi
üretir; non-dry çağrı `FAIL-CLOSED` ve exit 2 ile durur.

## Kalıcı yetki

- Operasyonel zincir `Codex → PM → uzman ajanlar → Claude workers/slaves` biçimindedir.
- PM shard sırası ve evidence paketini koordine eder; Claude çağıramaz.
- Yalnız Codex tek, sınırlı `claude_review` veya `claude_implement` görevi açabilir.
- Köprü her çağrıda `claude.ai / firstParty / max` doğrular; API/provider fallback yoktur.
- Claude alt görev devredemez, branch/worktree/commit/push/PR işlemi yapamaz.

## İzinli önizleme
```bash
node tools/agents/run-swarm.mjs --dry-run
node tools/agents/run-swarm.mjs --dry-run --priority=1
node tools/agents/run-swarm.mjs --dry-run kernel scale
```

Önizleme dosya, prompt, log veya generated JSON yazmaz; yalnız seçilen shard ve prompt boyutunu
stdout'a verir. Gerçek worker görevi Codex tarafından allowed-files/non-goals/test/rollback ile
ayrı kanaldan açılır ve sonuç bağımsız repo/test denetiminden geçer.

## Dosyalar
- `shards.json` — cluster → düğüm sayısı + öncelik.
- `prompt-template.md` — per-cluster bespoke prompt (`{{CLUSTER}}` / `{{CLUSTER_TR}}`).
- `run-swarm.mjs` — fail-closed, salt-okunur handoff önizlemesi.
