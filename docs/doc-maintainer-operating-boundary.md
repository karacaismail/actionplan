# Doc-Maintainer Operating Boundary

Sürüm: 1.0 - 2026-07-08
Durum: Kanonik / bağlayıcı

---

## Amaç

Bu doküman, actionplan reposunda çalışan Codex/doc-maintainer rolünün sınırını bağlayıcı olarak tanımlar. actionplan başka bir projenin enterprise-grade waterfall yol haritası, görev sözleşmeleri ve geliştirici handoff dokümantasyonudur. Bu repo hedef projenin implementation alanı değildir.

Kısa hüküm: Codex/actionplan **proje geliştirmez**; yetersiz dokümantasyonu geliştirici için yeterli hale getirir.

---

## Roller

| Rol | Ne yapar | Ne yapmaz |
|---|---|---|
| Codex/actionplan doc-maintainer | Dokümantasyon, sözleşme, gap raporu, export açıklaması, acceptance criteria, risk, rollback, referans ve handoff içeriğini iyileştirir | Platform, kernel, SDK, app-core, module veya app kodu yazmaz |
| İnsan geliştirici | actionplan görevini yorumlar, implementation reposunda branch açar, kod/test/PR üretir | actionplan dokümanını code-start kanıtı olmadan done saymaz |
| Implementation coding ajanı | Geliştiricinin verdiği Developer Brief veya Agent Prompt'u ayrı implementation repo/branch'inde uygular | Kendi çıktısını onaylamaz, main'e doğrudan push etmez, kapsam dışı dosyaya yazmaz |
| Product / PM | Kapsam, öncelik, faz kapısı ve kabul kararını verir | Eksik evidence ile işi tamamlanmış saymaz |

---

## Mutlak Yasaklar

Codex/actionplan doc-maintainer aşağıdaki işleri yapmaz:

- `platform`, `projector` veya başka implementation reposunda ürün kodu yazmak.
- Kernel, SDK, app-core, module veya app scaffold etmek.
- Alembic migration, SQLAlchemy model, Strawberry resolver, React surface, SDK generator veya test implementation üretmek.
- Dokümanlardaki Agent Prompt'u uygulayıp kod diff'i çıkarmak.
- `implementation-workspace-manifest.md` içindeki path'e geçip yazma işlemi yapmak.
- "Devam et" talimatını implementation izni olarak yorumlamak.

Bu yasaklar, dokümanların içinde "kodla", "Claude Code'a ver", "test-önce geliştir" gibi ifadeler geçse bile değişmez. O ifadeler implementation geliştiricisine veya onun yönettiği coding ajanına yöneliktir.

---

## İzinli İşler

Codex/actionplan doc-maintainer aşağıdaki işleri yapabilir:

- Eksik veya çelişkili dokümantasyonu düzeltmek.
- Geliştirici rehberi, task-to-code sözleşmesi, export sözleşmesi, ready-for-dev kapısı ve gap raporlarını hizalamak.
- Doğa metaforu terimlerini çelişkisiz tutmak: app=ada, module=dağ, archetype=kaya, feature=taş, component=kum, work_unit=molekül, micro_step=atom.
- Handoff için `repoPath`, `testCommand`, evidence, risk, rollback, acceptance criteria ve non-goal beklentilerini netleştirmek.
- Doküman sitesi, index ve rapor bağlantılarını güncellemek.
- Repo gerçekliğini doğrulamak için salt-okunur denetim yapmak.

actionplan repo tooling'i veya doküman viewer davranışı değiştirilecekse bu ayrı ve açık bir repo bakım talebi sayılır; ürün/platform implementation anlamına gelmez.

---

## "Devam Et" Yorum Kuralı

Kullanıcı actionplan bağlamında "devam et", "eksikleri tamamla", "bitene kadar sürdür" veya benzeri bir talimat verdiğinde, Codex/doc-maintainer bunu şu şekilde yorumlar:

1. Mevcut dokümantasyon sistemini tarar.
2. Geliştirici başlamasına engel olan eksik/çelişkili/gri alanları bulur.
3. Bu eksikleri dokümantasyon, sözleşme, rapor veya handoff metni olarak tamamlar.
4. Platform/product codebase'e geçip implementation yapmaz.

Bu yorum kuralı `developer-guide.md`, `task-export-contract.md`, `implementation-workspace-manifest.md`, `task-to-code-contract.md` ve tüm gap raporları için geçerlidir.

---

## Handoff Kuralı

actionplan'ın çıktısı geliştiriciye şu seviyede teslim edilir:

- Hangi WBS düğümü çalışılacak?
- Düğüm hangi doğa metaforu seviyesinde?
- Hangi waterfall fazı yürütülecek?
- Implementation gerekiyorsa hangi repo/path hedefleniyor?
- Hangi test veya kanıt işi bekleniyor?
- Hangi işler kapsam dışı?
- Hangi risk ve rollback bilgisi PR'a taşınacak?
- Hangi export artifact'i insan veya coding ajanı tarafından kullanılacak?

Bu bilgiler yeterliyse geliştirici veya implementation ajan operatörü ayrı repo/branch'te çalışabilir. Codex/actionplan'ın görevi burada biter; kod üretimi developer işidir.

---

## Çelişki Durumunda

Bu dokümanla çelişen ifade bulunduğunda yorum sırası şöyledir:

1. Bu dokümandaki doc-maintainer rol sınırı geçerlidir.
2. `AGENTS.md` aynı sınırı repo ajan sözleşmesi olarak uygular.
3. `developer-guide.md` ve export dokümanları geliştirici/implementation ajan akışını anlatır; Codex/actionplan için kod yazma izni sayılmaz.
4. Çelişkili ifade dokümantasyon düzeltme konusu yapılır.

Son karar: actionplan doc-maintainer, hedef projeyi geliştirmek için değil, hedef projeyi geliştirecek insan ve coding ajanlarına yeterli dokümantasyon sağlamak için çalışır.
