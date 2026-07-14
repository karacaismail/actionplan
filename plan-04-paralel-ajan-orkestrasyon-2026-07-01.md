# Dosya 4 — Paralel Çalışma ve Teslim Koordinasyonu

> **ARCHIVED-HUMAN-HANDOFF:** Eski doğrudan swarm/worktree yürütme modeli kaldırılmıştır.
> Güncel sıra `Codex → PM → uzman ajanlar → Claude workers/slaves`; platform erişimi
> `read-only-audit`, uygulama `human-developer-only`dır.

## 1. Yetki modeli

- Codex MASTER olarak kapsamı, allowed-files listesini, test kapılarını, rollback'i ve
  teslim kararını belirler.
- PM Codex sonrasındaki ardıl koordinatördür; bağımlılık, sıra, risk ve evidence ledger'ını
  yönetir ancak nihai karar vermez.
- Uzman ajanlar PM altında yalnız kendi alanlarında inceleme veya sınırlı ara çıktı üretir.
- Claude workers/slaves yalnız Codex tarafından dar görevle çağrılabilir; başka worker
  başlatamaz, Git işlemi yapamaz ve kapsamı genişletemez.
- Platform branch, worktree, commit, PR, merge ve release işlemleri yalnız insan
  geliştiricinin sorumluluğundadır.

## 2. Tek yazar ve izolasyon

PM çakışan dosyaları aynı shard'a koyar ve aynı anda tek yazar atar. Actionplan içindeki
izinli changeset'i yalnız açık Kullanıcı/Admin yetkisiyle Codex teslim edebilir. Platformda
insan geliştirici her iş paketini ayrı worktree/branch'te uygular; AI yalnız salt-okunur
kanıt denetimi yapar.

Paylaşılan JSON aggregate, generated view, SDK public surface veya migration dosyaları
paralel yazılmaz. Birleşim sırası predecessor kanıtına göre seridir.

## 3. Test-first teslim döngüsü

1. Codex kapsamı, non-goal'ı ve acceptance ölçütünü kilitler.
2. PM predecessor, owner, risk ve rollback kayıtlarını paketler.
3. QA önce kırmızı davranış testini tanımlar.
4. İnsan geliştirici platform implementation'ını yapar.
5. QA/QASP/security/performance/erişilebilirlik kapıları sonucu doğrular.
6. PM evidence paketini Codex'e taşır.
7. Codex Actionplan diff'ini ve deterministik kapıları denetleyip nihai kararı verir.

Docs green runtime green değildir. Gerçek PR, CI, test, deploy/smoke ve rollback kanıtı
olmadan hiçbir WBS kaydı implemented, verified veya done yapılamaz.

## 4. Otomasyon sınırı

Otomasyon yalnız bildirim, durum toplama ve kanıt bağlantısı taşıyabilir. Model/worker
çağıramaz, görev kapsamı seçemez, branch açamaz, commit/push/PR/merge yapamaz. Eski
`tools/agents/run-swarm.mjs` yalnız `--dry-run` handoff önizlemesi verir; doğrudan
yürütme ve boş shard seçimi fail-closed'dur.

Claude çağrısı yalnız Codex köprüsünde `claude.ai / firstParty / max` doğrulamasıyla
mümkündür. Anthropic API, Bedrock, Vertex, Foundry, token override veya provider fallback
yasaktır.

## 5. Rollback

- Her changeset tek amaçlı ve küçük tutulur.
- Kırmızı kapı, yetki sapması veya kanıtsız tamamlanma merge'i durdurur.
- Actionplan paketi bağımsız revert edilebilir olmalıdır.
- Platform geri dönüşünü insan geliştirici kendi migration/deploy runbook'uyla yapar.

Bu arşiv yürütme yetkisi vermez; güncel sözleşme `AGENTS.md` ve
`docs/ai-governance-master.md` içindedir.
