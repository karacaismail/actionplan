# Denetim Raporu (audit)

Üretim: 2026-06-19 · Kaynak: `tools/audit.mjs` · Skorlama: `tools/lib/score.mjs` (uygulama ile ortak).

Her boyut 0-3: **somutluk+benzersizlik (0.45)**, **tamlık (0.25)**, **uygulanabilirlik (0.30)** ağırlıklı bileşik. Düğüm skoru = 14 boyutun ortalaması.

## Özet

- Toplam düğüm: **424** · skorlanan (en az 1 dolu boyut): **424**
- Ortalama düğüm skoru: **2.62 / 3**
- Güçlü (≥2.3): **401** (95%) · Orta (1.5-2.3): **23** (5%) · Zayıf (<1.5): **0** (0%) · Boş: **0**

### Köken dağılımı (provenance)

- swarm: 407
- human: 17

### Bayrak dağılımı (en sık kalite sorunları)

- `incomplete`: 395 düğümde
- `short-items`: 314 düğümde
- `generic`: 1 düğümde

## En zayıf 25 düğüm (öncelikli zenginleştirme)

| Skor | id | Başlık |
| ---: | --- | --- |
| 2.24 | `s-pim` | PIM |
| 2.25 | `app-build-x-stone` | Taş — Build & Dağıtım örnek kırılımı |
| 2.25 | `app-hr-x-stone` | Taş — İnsan Kaynakları örnek kırılımı |
| 2.25 | `cc-compliance-matrix` | Compliance Matrisi — KVKK, GDPR, CCPA, LGPD, PCI-DSS + Sanctions + DSAR |
| 2.25 | `s-pms` | PMS Stack |
| 2.26 | `s-cpq` | CPQ |
| 2.26 | `s-drive` | Drive + Collaboration Stack |
| 2.26 | `s-observability` | Observability |
| 2.27 | `app-data-intelligence-x-element` | Element — Veri & Zeka (AI-first) örnek kırılımı |
| 2.27 | `cc-obs` | Observability + Performance + DR |
| 2.27 | `s-i18n` | i18n / Localization |
| 2.27 | `s-lms` | LMS Stack |
| 2.27 | `scale-counter` | Hot Counter |
| 2.27 | `scale-workers` | Workers + Scheduler |
| 2.28 | `l1-workflow` | Workflow + ECA |
| 2.28 | `s-hrms` | HRMS Stack (TR) |
| 2.28 | `s-performance` | Performance & Competency |
| 2.29 | `app-data-intelligence-x-molecule` | Molekül — Veri & Zeka (AI-first) örnek kırılımı |
| 2.29 | `s-marketing` | Marketing + CRM Stack |
| 2.29 | `s-marketplace` | Marketplace Management |
| 2.29 | `s-payroll` | Payroll |
| 2.29 | `scale-streaming` | Streaming — Kafka, real-time aggregation |
| 2.29 | `scale-webhook` | Outbound Webhook — dış sisteme olay yollama |
| 2.3 | `app-finance-x-molecule` | Molekül — Finans & Muhasebe örnek kırılımı |
| 2.3 | `app-hr` | İnsan Kaynakları |

## Yorum

Güçlü banttaki düğümler (CRM, veri-zekâ, kernel) golden çıtayı temsil eder; zayıf bant
merkezî generator ile doldurulmuş ve benzersiz/somut içerikle zenginleştirilmeyi bekleyen
düğümlerdir. Kalite kapısı (`tools/quality-lint.mjs`) golden düğümlerin gerilemesini ve
yeni eklenen düğümlerin eşik altı kalmasını engeller.
