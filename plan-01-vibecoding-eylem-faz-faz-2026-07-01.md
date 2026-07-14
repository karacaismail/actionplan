# Dosya 1 — Vibecoding Faz-Faz Eylem Planı

> **ARCHIVED-HUMAN-HANDOFF:** Bu 2026-07-01 planı çalıştırılabilir model/ajan promptu
> değildir. Güncel sıra `Codex → PM → uzman ajanlar → Claude workers/slaves` biçimindedir.
> Platform erişimi `read-only-audit`, ürün uygulaması `human-developer-only`dır.

## 1. Güncel kullanım

Bu dosya yalnız portföy bağımlılık sırasını ve insan geliştirici teslim kapılarını koruyan
tarihsel bir yol haritasıdır. Codex kapsamı ve nihai kararı kilitler; PM ardıl koordinasyonu
yürütür; uzmanlar sınırlı inceleme üretir. Claude yalnız Codex'in doğrulanmış, dar
`claude_review` veya `claude_implement` çağrısında ara çıktı verebilir. Hiçbir worker
platform branch'i, commit'i, PR'ı veya merge'i yönetemez.

## 2. Değişmeyen teslim sırası

1. Kernel sözleşmeleri ve gerçek runtime kanıtı.
2. Kernel public sözleşmelerinden üretilen tipli SDK.
3. SDK üzerinden çalışan app-core.
4. App-core'a bağlanan app-module.
5. Kanıtlı modüllerin kompoze edildiği app.

Bir kapının dokümanı yeşil olsa bile gerçek implementation, test, migration ve CI kanıtı
yoksa sonraki kapı açılmaz. Actionplan planlama katmanıdır; platform ürünü burada
uygulanmaz.

## 3. İnsan geliştirici dalgaları

| Dalga | İnsan geliştirici hedefi | Giriş kapısı | Zorunlu kanıt |
|---|---|---|---|
| D0 | ADR ve sözleşme kilidi | Çelişki defteri açık | Onaylı ADR, kırmızı→yeşil sözleşme testi |
| D1 | Kernel primitifleri | D0 kararları kapalı | Migration, negatif tenant/authz testi, rollback |
| D2 | İlk dikey dilim | D1 public portları kanıtlı | API+UI E2E, audit, erişilebilirlik |
| D3 | Çapraz standartlar | D2 referans dilimi yeşil | Security, i18n, WCAG ve performans kapıları |
| D4 | Operasyon kası | D3 standardRefs çözülmüş | Restore drill, SLO, secret scan, incident runbook |
| D5+ | App portföyü | Kernel+SDK+app-core hazır | App DoD, regression, release ve rollback kanıtı |

Kernel ve ilk referans dilim seri ilerler. Bağımsız app çalışmaları ancak ortak public
sözleşmeler sürümlenip kanıtlandıktan sonra insan ekipler arasında bölünebilir.

## 4. Her dalganın test-first paketi

Her insan uygulama paketi şu sırayı taşır:

1. Amaç, allowed-files ve en az bir non-goal.
2. Önce davranışsal kırmızı test ve beklenen hata.
3. En küçük insan geliştirici implementation'ı.
4. Pozitif ve negatif testlerin yeşil sonucu.
5. Açılabilir PR/CI/test/migration veya ekran kanıtı.
6. Rollback tetikleyicisi ve geri dönüş komutu/runbook'u.

Kırmızı test görülmeden implementation green sayılmaz. Metin iddiası, placeholder URL,
yerel-only sonuç veya docs build'i runtime kanıtı değildir.

## 5. Yetki ve stop koşulları

- Codex MASTER ve tek nihai denetçidir.
- PM Codex sonrasındaki ardıl koordinatördür; fallback master değildir.
- Uzman ajanlar yalnız PM'ye alan bulgusu verir.
- Claude worker/slave kapsam genişletemez, alt görev devredemez ve Git işlemi yapamaz.
- Claude köprüsü `claude.ai / firstParty / max` doğrulamazsa fail-closed durur; API veya
  provider fallback yoktur.
- Platform dosyası yazımı gerekirse AI süreci durur ve paket insan geliştiriciye devredilir.

## 6. Kapanış

Bu arşiv yalnız sıra ve kanıt disiplinini korur. Güncel yürütme kaynakları
`AGENTS.md`, `docs/ai-governance-master.md`,
`docs/platform-product-code-write-prohibition-directive.md` ve ilgili
`docs/platform-*-agent-pack-2026-07-09.md` human-developer handoff'larıdır.
