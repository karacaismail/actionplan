# Denetim Raporu (audit)

Üretim: 2026-07-08 · Kaynak: `tools/audit.mjs` · Skorlama: `tools/lib/score.mjs` (uygulama ile ortak).

Her boyut 0-3: **somutluk+benzersizlik (0.45)**, **tamlık (0.25)**, **uygulanabilirlik (0.30)** ağırlıklı bileşik. Düğüm skoru = uygulanabilir 17 üretim boyutunun ortalaması.

## Özet

- Toplam düğüm: **467** · skorlanan (en az 1 dolu boyut): **467**
- Ortalama düğüm skoru: **2.92 / 3**
- Güçlü (≥2.3): **467** (100%) · Orta (1.5-2.3): **0** (0%) · Zayıf (<1.5): **0** (0%) · Boş: **0**

### Köken dağılımı (provenance)

- swarm: 402
- mixed: 60
- human: 5

### Bayrak dağılımı (en sık kalite sorunları)

- `duplicate-items`: 37 düğümde
- `short-items`: 30 düğümde

## En zayıf 25 düğüm (öncelikli zenginleştirme)

| Skor | id | Başlık |
| ---: | --- | --- |
| 2.8 | `app-backend` | Backend |
| 2.83 | `app-build-x-kum` | Kum — Build & Dağıtım örnek kırılımı |
| 2.83 | `app-layer1` | Layer 1 — In-tree Modüller |
| 2.85 | `app-data-intelligence-x-tas` | Taş — Veri & Zeka (AI-first) örnek kırılımı |
| 2.85 | `app-frontend` | Frontend |
| 2.85 | `atomic-types` | Faz 0 — Atomik Tipler |
| 2.85 | `s-pos` | Point of Sale |
| 2.86 | `app-customer-revenue` | Müşteri & Gelir |
| 2.86 | `app-finance-x-tas` | Taş — Finans & Muhasebe örnek kırılımı |
| 2.86 | `app-supply-chain` | Tedarik Zinciri & Lojistik |
| 2.86 | `cc-security` | Security Model |
| 2.86 | `dist-realestate` | Emlak Ofisi Distribution |
| 2.86 | `l1-search` | Search (Hybrid: BM25 + Vector) |
| 2.86 | `s-ai-voice` | AI Voice Agent |
| 2.86 | `s-workforce` | Shift / Workforce Planning |
| 2.86 | `stack-editions` | Edition Kavramı — Stack Varyantları |
| 2.86 | `stack-messaging` | Mesajlaşma Ticareti Stack (WhatsApp) |
| 2.87 | `app-atomic` | Atomic |
| 2.87 | `app-hr` | İnsan Kaynakları |
| 2.87 | `app-sus-x-atom` | Atom — Platform Yetenekleri örnek kırılımı |
| 2.87 | `app-sus-x-molekul` | Molekül — Platform Yetenekleri örnek kırılımı |
| 2.87 | `app-sus` | Platform Yetenekleri |
| 2.87 | `app-vertical-x-molekul` | Molekül — Dikey / Sektörel örnek kırılımı |
| 2.87 | `cc-i18n-standards` | i18n Teknik Standartları — BCP 47, CLDR, ICU, RTL |
| 2.87 | `dx-api-gateway` | API Gateway + Developer Portal |

## Yorum

Güçlü banttaki düğümler (CRM, veri-zekâ, kernel) golden çıtayı temsil eder; zayıf bant
merkezî generator ile doldurulmuş ve benzersiz/somut içerikle zenginleştirilmeyi bekleyen
düğümlerdir. Kalite kapısı (`tools/quality-lint.mjs`) golden düğümlerin gerilemesini ve
yeni eklenen düğümlerin eşik altı kalmasını engeller.
