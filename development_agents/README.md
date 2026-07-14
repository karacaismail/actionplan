# Development Agents Kataloğu

Bu klasör, geliştirme işini planlayan ve denetleyen roller için `DIRECTIVE-ONLY` yetenek sözleşmesidir; kanonik repo kuralları [AGENTS.md](../AGENTS.md) ve [platform yazma yasağı](../docs/platform-product-code-write-prohibition-directive.md) altındadır.

## Yetki hiyerarşisi
- Operasyonel sıra: **Codex → PM → uzman ajanlar → Claude workers/slaves**.
- **Codex = MASTER:** kapsamı, önceliği, worker görevini, rollback'i ve teslim onayını belirleyen nihai denetçidir.
- **PM = Codex sonrasındaki ardıl koordinasyon yetkilisi:** akışı, bağımlılıkları, riskleri ve evidence paketini koordine eder; Codex adına nihai karar vermez.
- Uzman ajanlar PM üzerinden Codex'e bağlıdır; yalnız açık, dar alt görevde danışmandır ve çıktıları doğrulanmamış ara üründür.
- **Claude = worker/slave:** yalnız Codex'in sınırlı review/implement göreviyle, `claude.ai / firstParty / max` doğrulanınca çalışır; PM/uzmanlar çağıramaz, koşul yoksa fail-closed durur.

## Çalışma protokolü
- Akış test-first ilerler: kırmızı beklenti, tek yazar uygulaması, yeşil doğrulama, bağımsız Codex denetimi.
- Aynı dosyada paralel yazım, kapsam genişletme ve kanıtsız “tamamlandı” beyanı yasaktır.
- Her görev allowed-files, non-goal, kabul ölçütü, test komutu, risk ve geri alma koşulu taşır.
- Her faz raporu “ne değişti / ne doğrulandı / ne kaldı” ve yeniden üretilebilir evidence içerir.

## Repo sınırı
- Bu katalog `actionplan` içindeki dokümantasyon ve handoff rollerini tanımlar; platform ürün kodu yazma yetkisi vermez.
- Platform audit'i salt okunurdur; ürün kodu, test ve migration yazarı `human-developer-only`dır.
- Nihai kapsam, öncelik, rollback ve teslim kararı yalnız Codex'tedir.
- Kullanıcı yetkiliyse Actionplan dokümantasyon Git/PR işlemleri yalnız Codex tarafından yürütülür; PM/uzmanlara devredilmez.
- Platform ürün-kodu Git/release/destructive-Git uygulaması `human-developer/operator-only`dır; Codex yalnız karar ve handoff üretir.

## Ortak handoff zarfı
Her uzman bağlamı, varsayımları, bulguları, dosya/satır veya test evidence'ını, riskleri, önerilen sırayı ve açık kararları PM üzerinden Codex'e verir. PM paketler; Codex gerçek repo ve deterministik kapılarla kabul eder veya reddeder.

## Profiller
PM: [project_manager](project_manager.md) · Ürün: [po](po.md) · Entegrasyon: [kernel_integrator](kernel_integrator.md) · Kalite: [qa_test](qa_test.md), [qasp](qasp.md), [rollback](rollback.md).

Uygulama denetimi: [frontend](frontend.md), [backend](backend.md), [uiux](uiux.md), [security](security.md), [wcag22aaa](wcag22aaa.md), [performance](performance.md), [swarm/k8s/shared-host](swarm_k8s_shared_host.md), [solid](solid.md), [ai_behavior](ai_behavior.md), [graphql_security](graphql_security.md), [i18n/l10n/g11](i18n_l10n_g11.md).
