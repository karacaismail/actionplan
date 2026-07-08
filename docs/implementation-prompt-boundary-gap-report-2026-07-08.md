# Implementation Prompt Boundary Gap Report — 2026-07-08

Durum: Uygulandı
Kapsam: Claude/Cursor/vibecoding odaklı dokümantasyon

---

## Soru

Kanonik doc-maintainer sınırı eklendikten sonra, tarihsel veya operasyonel prompt dokümanlarında Codex/actionplan'ın hedef proje kodu yazacağı şeklinde yorumlanabilecek kalan ifade var mı?

## Bulgular

| Doküman | Risk | Düzeltme |
|---|---|---|
| `vibecoding-prompt-playbook.md` | "Claude/Cursor'a yapıştır" blokları actionplan doc-maintainer'ın doğrudan kod üretmesi gibi okunabilirdi | Playbook başına geliştirici/implementation operatörü kapsamı ve doc-maintainer yasağı eklendi |
| `work-unit-molecule-gap-claude-vibecoding-2026-07-02.md` | Tarihsel Claude prompt bölümleri, güncel handoff yerine doğrudan coding promptu gibi kullanılabilirdi | Üst metadata'ya tarihsel/implementation operatörü notu ve doc-maintainer sınırı eklendi |
| `micro-step-atom-gap-claude-vibecoding-2026-07-02.md` | Atom promptları, actionplan içinden kod yazma talimatı gibi okunabilirdi | Üst metadata'ya aynı sınır eklendi |
| `prompt-template-library.md` | 17 boyut prompt şablonları ile platform implementation promptları karışabilirdi | Şablonların düğüm içeriği/export artifact'i için olduğu, Codex'in platform kodu üretmeyeceği yazıldı |
| `claude-ai-archetype-eca-directive.md` | Claude/ECA yönergesi doğrudan backend kod üretim emri gibi okunabilirdi | Durum notu eklendi: actionplan ECA/agentPolicy sözleşmesi; implementation için geliştirici operatörü gerekir |
| `eylem-plani-derinlestirme-master.md` | Tarihsel swarm/ajan planı, güncel Codex rolüyle karışabilirdi | Doc-maintainer notu eklendi; planın platform implementation izni olmadığı netleştirildi |

## Güncel Yorum

Prompt veya playbook dokümanında "Claude", "Cursor", "kod üret", "test-önce geliştir" veya "platform reposunda çalış" ifadesi geçiyorsa aktör şudur:

- İnsan geliştirici veya implementation ajan operatörü.
- Ayrı implementation repo/branch'i.
- Developer Brief, Agent Prompt, Vobecoder Card ve workspace manifestiyle sınırlı çalışma.
- İnsan review + CI + evidence olmadan "done" yok.

Codex/actionplan doc-maintainer için aktör yorumu farklıdır:

- Promptu uygulamaz.
- Platform/kernel/SDK/app-core/module/app kodu yazmaz.
- Eksik, çelişkili veya yetersiz dokümantasyonu düzeltir.
- Güncel sınır için `doc-maintainer-operating-boundary.md` esas alınır.

## Sonuç

Kalan prompt kaynaklı rol karışıklığı kapatıldı. Tarihsel prompt raporları silinmedi; çünkü gap teşhisi olarak değerlidir. Ancak güncel okuyucu artık bu raporları implementation operatörü bağlamında ve doc-maintainer yasağıyla birlikte okur.
