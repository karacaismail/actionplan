# RULES.md — Kısa İşaretçi İndeksi

Bu dosya kural METNİ taşımaz; yalnız kanonik makine sahiplerine işaret eder. Sayı/eşik
sürüklenmesini (drift) önlemek için burada hiçbir eşik KOPYALANMAZ — kaynağı oku.

| Konu | Kanonik sahip |
|---|---|
| Değişiklik paketi satır bütçesi (bant/sınıf/churn) | `src/data/standards/short-code.json#changePackageBudget` |
| Ultra hızlı teslim politikası (test bandı, checkpoint kadansı, QA sırası, Pane admisyonu, karar yetkisi) | `src/data/standards/short-code.json#changePackageBudget.ultraFastV1` |
| Test stratejisi (piramit, test-önce, coverage, factory, mutation) | `src/data/standards/testing-strategy.json` |
| Kalite kapıları (typecheck/lint/coverage/e2e/perf/build/security/DoD) | `src/data/standards/quality-gates.json` |
| Rol zinciri ve yazma yetkisi (Codex Desktop MASTER / Claude worker) | `AGENTS.md` §0, §0.1, §7 |
| Platform ürün kodu yazma yasağı | `docs/platform-product-code-write-prohibition-directive.md` |
| Standart referans deseni (`standardRefs`, kopyalama yasağı) | `AGENTS.md` §2, `docs/adr-0027-engineering-standards.md` |

Deterministik doğrulayıcı (ULTRA_FAST_V1 için): `node tools/agents/check-ultra-fast-delivery.mjs`
— sözleşmeyi, işaretçileri, kanıt hash'lerini ve eski-rota yokluğunu kontrol eder, ağa/Git'e
çıkmaz, GREEN/RED çıkış kodu verir.
