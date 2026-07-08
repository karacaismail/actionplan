# Doc-Maintainer Boundary Gap Report — 2026-07-08

Durum: Uygulandı
Kapsam: actionplan dokümantasyon sistemi

---

## Soru

actionplan, başka bir projenin yol haritası ve geliştirici handoff dokümantasyonu olduğuna göre, bu repo üzerinde çalışan Codex/doc-maintainer'ın dokümanlardaki yönergeleri uygulayıp hedef projeyi geliştirmesine yol açabilecek bir belirsizlik kalıyor mu?

## Bulgular

| Bulgu | Risk | Uygulanan düzeltme |
|---|---|---|
| `AGENTS.md` actionplan'ın platform kodu yazmadığını söylüyordu, fakat doc-maintainer rolünü ayrı ve kalıcı bir sınır olarak adlandırmıyordu | Codex'in "devam et" talimatını doküman geliştirme yerine implementation izni gibi yorumlaması | `AGENTS.md` içine "Kalıcı Rol Sınırı — Dokümantasyon Bakımı" bölümü eklendi |
| `developer-guide.md` Claude Code / Agent Prompt akışını anlatıyordu, ancak actionplan doc-maintainer ile implementation coding ajanını ayrı aktörler olarak yeterince ayırmıyordu | Vibecoding rehberi, Codex/actionplan için de kod üretim görevi gibi okunabilirdi | Rehbere "Dokümantasyon bakım ajanı" rolü ve FAQ sınırı eklendi |
| `task-export-contract.md` Agent Prompt'u kod ajanı sözleşmesi olarak tanımlıyordu, fakat artifact'i üreten/düzenleyen doc-maintainer'ın onu uygulamayacağını açık yazmıyordu | Export sözleşmesi, actionplan tarafında kod çalıştırma izni gibi yorumlanabilirdi | "Aktör Sınırı" bölümü eklendi |
| `implementation-workspace-manifest.md` ayrı checkout'u tarif ediyordu, fakat doc-maintainer'ın o checkout'a yazmayacağını açık bağlamıyordu | Workspace manifesti, Codex'in implementation repo'ya geçmesi için izin gibi okunabilirdi | Manifestin amaç bölümüne doc-maintainer için "yönlendirme sözleşmesi, uygulama izni değil" hükmü eklendi |
| Docs dizininde bu sınırın tek kanonik sayfası yoktu | Benzer ifadeler zamanla farklı sayfalarda yeniden drift edebilirdi | `doc-maintainer-operating-boundary.md` kanonik sözleşme olarak eklendi ve dizine bağlandı |

## Sonuç

Geliştiricinin başlamasına engel olan rol belirsizliği giderildi. Güncel yorum:

- actionplan, hedef proje/platform codebase'i değildir.
- Codex/actionplan doc-maintainer yalnız dokümantasyon, sözleşme, gap raporu, export ve handoff içeriğini yeterli hale getirir.
- Kernel → SDK → app-core → app module → app assembly geliştirme işi geliştirici veya onun yönettiği implementation coding ajanı tarafından ayrı implementation repo/branch'inde yapılır.
- "Devam et" komutu actionplan bağlamında dokümantasyon yeterliliğini sürdürmek anlamına gelir; ürün kodu yazma izni değildir.

Kalan risk P2 seviyesindedir: tarihsel gap raporlarında eski "Claude'a yapıştır" promptları bulunabilir. Bunlar tarihsel rapor olarak etiketlidir; güncel yorum için `doc-maintainer-operating-boundary.md`, `developer-guide.md`, `task-export-contract.md` ve `implementation-workspace-manifest.md` esas alınır.
