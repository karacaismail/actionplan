# Denetim Raporu (audit)

Üretim: 2026-06-29 · Kaynak: `tools/audit.mjs` · Skorlama: `tools/lib/score.mjs` (uygulama ile ortak).

Her boyut 0-3: **somutluk+benzersizlik (0.45)**, **tamlık (0.25)**, **uygulanabilirlik (0.30)** ağırlıklı bileşik. Düğüm skoru = 14 boyutun ortalaması.

## Özet

- Toplam düğüm: **438** · skorlanan (en az 1 dolu boyut): **438**
- Ortalama düğüm skoru: **2.67 / 3**
- Güçlü (≥2.3): **438** (100%) · Orta (1.5-2.3): **0** (0%) · Zayıf (<1.5): **0** (0%) · Boş: **0**

### Köken dağılımı (provenance)

- swarm: 421
- human: 17

### Bayrak dağılımı (en sık kalite sorunları)

- `incomplete`: 372 düğümde
- `short-items`: 291 düğümde
- `generic`: 2 düğümde

## En zayıf 25 düğüm (öncelikli zenginleştirme)

| Skor | id | Başlık |
| ---: | --- | --- |
| 2.3 | `app-finance-x-molecule` | Molekül — Finans & Muhasebe örnek kırılımı |
| 2.3 | `app-hr` | İnsan Kaynakları |
| 2.3 | `cc-i18n-standards` | i18n Teknik Standartları — BCP 47, CLDR, ICU, RTL |
| 2.3 | `s-clm` | Contract Management (CLM) |
| 2.3 | `s-conversational` | Conversational Commerce / Chatbot |
| 2.3 | `s-iam` | Identity & Access (IAM) |
| 2.3 | `s-membership` | Membership / Association |
| 2.3 | `s-wms` | Warehouse Management (WMS) |
| 2.31 | `s-doc-matching` | Document Classification & Matching |
| 2.31 | `scale-timeseries` | Time-Series — IoT, metrik, sensör verisi |
| 2.32 | `fe-mobile` | Frontend — Capacitor Mobile + KYC/KYB |
| 2.32 | `s-demand-planning` | Demand Planning / S&OP |
| 2.32 | `s-dms` | Document Management (DMS) |
| 2.32 | `s-rpa` | Hibrit / Tarayıcı Tabanlı RPA-lite |
| 2.33 | `app-finance-x-element` | Element — Finans & Muhasebe örnek kırılımı |
| 2.33 | `cc-i18n-deep` | i18n Derinleştirme — pluralization, RTL, lokal format |
| 2.33 | `cc-notification-consent` | Bildirim & Consent — Transactional vs Marketing, SMS Regülasyon |
| 2.33 | `cc-resolver-ops` | Resolver Operasyonel Sertleştirme — Migration, Cache, Failure, Governance |
| 2.33 | `l1-search` | Search (Hybrid: BM25 + Vector) |
| 2.33 | `s-fixed-assets` | Fixed Assets / Amortization |
| 2.33 | `s-fsm` | Field Service |
| 2.33 | `s-ipaas` | Integration Hub (iPaaS) |
| 2.33 | `s-studio` | Low-code Studio |
| 2.33 | `s-subscription-analytics` | Subscription Analytics |
| 2.34 | `app-platform-horizontal` | Platform & Yatay |

## Yorum

Güçlü banttaki düğümler (CRM, veri-zekâ, kernel) golden çıtayı temsil eder; zayıf bant
merkezî generator ile doldurulmuş ve benzersiz/somut içerikle zenginleştirilmeyi bekleyen
düğümlerdir. Kalite kapısı (`tools/quality-lint.mjs`) golden düğümlerin gerilemesini ve
yeni eklenen düğümlerin eşik altı kalmasını engeller.
