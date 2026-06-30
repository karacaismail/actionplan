# Denetim Raporu (audit)

Üretim: 2026-06-30 · Kaynak: `tools/audit.mjs` · Skorlama: `tools/lib/score.mjs` (uygulama ile ortak).

Her boyut 0-3: **somutluk+benzersizlik (0.45)**, **tamlık (0.25)**, **uygulanabilirlik (0.30)** ağırlıklı bileşik. Düğüm skoru = 14 boyutun ortalaması.

## Özet

- Toplam düğüm: **445** · skorlanan (en az 1 dolu boyut): **445**
- Ortalama düğüm skoru: **2.81 / 3**
- Güçlü (≥2.3): **445** (100%) · Orta (1.5-2.3): **0** (0%) · Zayıf (<1.5): **0** (0%) · Boş: **0**

### Köken dağılımı (provenance)

- swarm: 428
- human: 17

### Bayrak dağılımı (en sık kalite sorunları)

- `short-items`: 279 düğümde
- `generic`: 2 düğümde
- `skeleton`: 1 düğümde

## En zayıf 25 düğüm (öncelikli zenginleştirme)

| Skor | id | Başlık |
| ---: | --- | --- |
| 2.46 | `app-data-intelligence-x-atom` | Atom — Veri & Zeka (AI-first) örnek kırılımı |
| 2.49 | `app-finance-x-molecule` | Molekül — Finans & Muhasebe örnek kırılımı |
| 2.54 | `app-backend` | Backend |
| 2.56 | `app-layer1` | Layer 1 — In-tree Modüller |
| 2.57 | `app-frontend` | Frontend |
| 2.57 | `std-ci-gates` | 7 CI Conformance Kapisi (ST-3) |
| 2.58 | `app-data-intelligence-x-stone` | Taş — Veri & Zeka (AI-first) örnek kırılımı |
| 2.58 | `app-finance-x-atom` | Atom — Finans & Muhasebe örnek kırılımı |
| 2.59 | `be-v1-kapsam-disi` | v1 Teslim Profili — Tek Varsayılan ve Kapsam Dışı |
| 2.6 | `app-platform-horizontal` | Platform & Yatay |
| 2.61 | `app-hr` | İnsan Kaynakları |
| 2.62 | `app-finance-x-element` | Element — Finans & Muhasebe örnek kırılımı |
| 2.62 | `fe-cdn` | CDN Strategy — sınırın uçtaki dağıtım |
| 2.62 | `s-esg` | ESG / Sürdürülebilirlik Raporlama |
| 2.63 | `app-customer-revenue` | Müşteri & Gelir |
| 2.63 | `l1-sitemap` | Sitemap & Robots — Indexability Motoru |
| 2.63 | `l1-webhook-in` | Inbound Webhook — dış sistemden gelen olay alma |
| 2.64 | `app-content-collaboration` | İçerik & İşbirliği |
| 2.64 | `cc-jurisdiction-resolver` | Jurisdiction / Policy Resolver — 6-Eksen Orthogonal Model |
| 2.64 | `fe-deploy` | Frontend — Deploy + OTA + Store Rollout |
| 2.64 | `fe-mobile` | Frontend — Capacitor Mobile + KYC/KYB |
| 2.64 | `l1-misc` | i18n, Money, Realtime, Webhook, API Gateway, Calendar, Reporting |
| 2.64 | `l1-tagmanager` | Tag Manager — Etiket Konteyneri (server-side öncelikli) |
| 2.64 | `s-demand-planning` | Demand Planning / S&OP |
| 2.64 | `s-fsm` | Field Service |

## Yorum

Güçlü banttaki düğümler (CRM, veri-zekâ, kernel) golden çıtayı temsil eder; zayıf bant
merkezî generator ile doldurulmuş ve benzersiz/somut içerikle zenginleştirilmeyi bekleyen
düğümlerdir. Kalite kapısı (`tools/quality-lint.mjs`) golden düğümlerin gerilemesini ve
yeni eklenen düğümlerin eşik altı kalmasını engeller.
