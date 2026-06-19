# Denetim Raporu (audit)

Üretim: 2026-06-19 · Kaynak: `tools/audit.mjs` · Skorlama: `tools/lib/score.mjs` (uygulama ile ortak).

Her boyut 0-3: **somutluk+benzersizlik (0.45)**, **tamlık (0.25)**, **uygulanabilirlik (0.30)** ağırlıklı bileşik. Düğüm skoru = 14 boyutun ortalaması.

## Özet

- Toplam düğüm: **424** · skorlanan (en az 1 dolu boyut): **424**
- Ortalama düğüm skoru: **2.59 / 3**
- Güçlü (≥2.3): **385** (91%) · Orta (1.5-2.3): **39** (9%) · Zayıf (<1.5): **0** (0%) · Boş: **0**

### Köken dağılımı (provenance)

- swarm: 407
- human: 17

### Bayrak dağılımı (en sık kalite sorunları)

- `incomplete`: 411 düğümde
- `short-items`: 330 düğümde
- `generic`: 1 düğümde

## En zayıf 25 düğüm (öncelikli zenginleştirme)

| Skor | id | Başlık |
| ---: | --- | --- |
| 2.05 | `app-layer1-x-element` | Element — Layer 1 — In-tree Modüller örnek kırılımı |
| 2.06 | `app-crosscut-x-element` | Element — Cross-cutting örnek kırılımı |
| 2.11 | `s-cms` | CMS Stack |
| 2.14 | `s-social` | Social Stack |
| 2.15 | `app-layer1-x-molecule` | Molekül — Layer 1 — In-tree Modüller örnek kırılımı |
| 2.15 | `app-scale-x-molecule` | Molekül — Scale Primitifleri örnek kırılımı |
| 2.16 | `app-crosscut-x-molecule` | Molekül — Cross-cutting örnek kırılımı |
| 2.16 | `app-layer1-x-atom` | Atom — Layer 1 — In-tree Modüller örnek kırılımı |
| 2.18 | `app-scale-x-element` | Element — Scale Primitifleri örnek kırılımı |
| 2.19 | `s-survey` | Survey / Feedback |
| 2.21 | `app-crosscut-x-atom` | Atom — Cross-cutting örnek kırılımı |
| 2.21 | `app-scale-x-atom` | Atom — Scale Primitifleri örnek kırılımı |
| 2.22 | `s-community` | Community / Forum |
| 2.23 | `s-ats` | Recruitment / ATS |
| 2.23 | `s-bpm` | Workflow / BPM Engine |
| 2.23 | `s-quality` | Quality Management (QC/QA) |
| 2.24 | `s-pim` | PIM |
| 2.25 | `app-build-x-stone` | Taş — Build & Dağıtım örnek kırılımı |
| 2.25 | `app-hr-x-stone` | Taş — İnsan Kaynakları örnek kırılımı |
| 2.25 | `cc-compliance-matrix` | Compliance Matrisi — KVKK, GDPR, CCPA, LGPD, PCI-DSS + Sanctions + DSAR |
| 2.25 | `s-pms` | PMS Stack |
| 2.26 | `s-cpq` | CPQ |
| 2.26 | `s-drive` | Drive + Collaboration Stack |
| 2.26 | `s-observability` | Observability |
| 2.27 | `app-data-intelligence-x-element` | Element — Veri & Zeka (AI-first) örnek kırılımı |

## Yorum

Güçlü banttaki düğümler (CRM, veri-zekâ, kernel) golden çıtayı temsil eder; zayıf bant
merkezî generator ile doldurulmuş ve benzersiz/somut içerikle zenginleştirilmeyi bekleyen
düğümlerdir. Kalite kapısı (`tools/quality-lint.mjs`) golden düğümlerin gerilemesini ve
yeni eklenen düğümlerin eşik altı kalmasını engeller.
