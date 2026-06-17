# Agent Swarm — per-node bespoke içerik üretimi (yerel)

Bu paket, 363 görev düğümünün 14 boyutunu **her düğüme özgü** içerikle dolduran ajan
swarm'ını **kendi makinende** (Claude Code ile) çalıştırır.

## Neden yerel?
Cowork sandbox'ında alt-ajanlar ~150 saniyede socket-drop ediyor (8 ve 2 eşzamanlıda da
denendi, yazımlar diske inmeden düşüyor). Bu yüzden swarm, socket limiti olmayan **yerel
Claude Code** üzerinde koşulmalı. Mimari `generator + overlay` desenine sadıktır: merkezî
generator zaten %100 baseline doldurdu; bu swarm o baseline'ı per-node özgünleştirir.

## Gerekler
- Yerelde `claude` (Claude Code) kurulu ve giriş yapılmış.
- Repo klonlu, bu dizinde (`tools/agents/`) çalışıyorsun.
- `node tools/reindex.mjs` çalışır (zero-dep).

## Çalıştırma
```bash
# Önce kuru deneme (komutları görür, hiçbir şey değiştirmez):
node tools/agents/run-swarm.mjs --dry-run

# Öncelik 1 cluster'lar (kernel, scale, layer1, crosscut, sus, layer0):
node tools/agents/run-swarm.mjs --priority=1 --concurrency=4

# Belirli cluster'lar:
node tools/agents/run-swarm.mjs kernel scale

# Hepsi:
node tools/agents/run-swarm.mjs --concurrency=6
```

Her ajan **yalnızca kendi cluster'ının** `src/data/generated/nodes/*.json` dosyalarını
düzenler (izole → çakışma yok). Tüm ajanlar bitince script otomatik `reindex` çalıştırır.

## Güvenlik & izolasyon
- Ajanlara `--permission-mode acceptEdits` + `Read/Edit/Write/Bash` verilir. Tam otonomi
  isteniyorsa `claude` çağrısına `--dangerously-skip-permissions` ekleyebilirsin (run-swarm
  içindeki `claudeArgs`).
- Şema korunur: prompt, 14 boyut + 7 faz anahtarlarını ve kimlik/hiyerarşi alanlarını
  değiştirmemeyi şart koşar.

## Doğrulama (test-önce kapıları)
Swarm bitince **mutlaka** çalıştır:
```bash
npm run typecheck && npm test && npm run build
```
`npm test` içindeki `dataIntegrity` testi 363 düğümü Zod şemasına karşı doğrular; bozuk
üretim varsa kırmızı verir. Yeşilse commit + push → CI Pages'e deploy eder.

## Loglar
Her cluster'ın çıktısı `tools/agents/logs/<cluster>.log`, gönderilen prompt
`tools/agents/logs/<cluster>.prompt.md` altında.

## Dosyalar
- `shards.json` — cluster → düğüm sayısı + öncelik.
- `prompt-template.md` — per-cluster bespoke prompt (`{{CLUSTER}}` / `{{CLUSTER_TR}}`).
- `run-swarm.mjs` — paralel runner (concurrency, dry-run, reindex).
