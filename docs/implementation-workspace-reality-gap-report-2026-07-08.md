# Implementation Workspace Reality Gap Report

Tarih: 2026-07-08
Kapsam: actionplan dokümantasyonu, implementation workspace manifesti, eski repo gerçeklik raporu
Durum: Uygulandı

---

## Soru

actionplan dokümanlarında `platform` aynı anda hem WBS kümesi hem ayrı implementation workspace gibi geçiyor. Bu, geliştiricinin "kod nerede yazılacak?" sorusunu çelişkili hale getiriyor mu?

---

## Bulgular

| Bulgu | Risk | Düzeltme |
|---|---|---|
| `repo-reality-audit.md` tarihsel olarak "ayrı platform reposu yoktur" diyordu | Güncel manifesti okuyan geliştirici ile eski audit'i okuyan geliştirici farklı sonuca varabilirdi | Rapor tarihsel snapshot olarak işaretlendi; güncel otorite `implementation-workspace-manifest.md` + `src/data/workspace-manifest.json` olarak yazıldı |
| actionplan içinde `app-platform-horizontal` WBS kümesi var | Bu küme implementation checkout'u sanılabilirdi | Kümenin yalnız plan/sözleşme katmanı olduğu netleştirildi |
| `/Users/karaca/DEV/mimari/platform` yerel checkout'u var | Eski audit "platform yok" hükmüyle çelişiyordu | Checkout'un varlığı, branch'i ve remote durumu dokümana geçirildi |
| Manifest `defaultBranch: main` diyordu | Gerçek checkout branch'i `master`; export/ajan branch temeli yanlış varsayılabilirdi | `implementation-workspace-manifest.md` ve `src/data/workspace-manifest.json` `master` olarak güncellendi |

---

## Güncel Gerçek

- actionplan bir plan, sözleşme ve geliştirici handoff reposudur; platform/kernel/SDK/app kodu yazmaz.
- `app-platform-horizontal` actionplan içindeki WBS kümesidir.
- `/Users/karaca/DEV/mimari/platform` ayrı yerel implementation checkout'udur.
- Bu checkout 2026-07-08 salt-okunur doğrulamada `master` branch'inde görünmüştür.
- `git remote -v` boş döndüğü için actionplan exportları repo URL'si uydurmaz.
- Geliştirici veya implementation ajan operatörü gerçek kod işine ancak ilgili görevde code-start koşulları sağlandığında geçer.

---

## Code-Start Kararı

Bu düzeltme tek başına hiçbir görevi `GO` yapmaz. Bir görev için hâlâ şu koşullar gerekir:

1. Waterfall fazı code-start'a uygun olmalı.
2. `traceability.repoPath` dolu olmalı.
3. `traceability.testCommand` dolu olmalı.
4. Kernel -> SDK -> app-core -> app module -> app teslim sırası ihlal edilmemeli.
5. Evidence geri-yazma yolu belli olmalı.

Bu koşullar yoksa çıktı `NO-GO` kalır; yapılacak iş eksik dokümantasyon/handoff patch'idir.

---

## Sonuç

Platform gerçekliği artık çelişkisizdir: actionplan'daki platform WBS kümesi plan katmanıdır; yerel platform checkout'u implementation katmanıdır; branch `master`, remote yoktur. Codex/actionplan doc-maintainer bu bilgiyi yalnız dokümantasyon ve handoff yeterliliği için kullanır, implementation checkout'unda kod yazmaz.
