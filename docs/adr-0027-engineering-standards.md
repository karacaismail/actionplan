# ADR-0027 — Mühendislik Standardı İşletim Katmanı: Sözleşme + Referans + Uygulanabilirlik + Kapı

Statü: kabul · ADR-0026'yı (tech-profiles) **genelleştirir**. Kaynak: ChatGPT Codex gap-analizi + iç unknown-unknowns analizi (boyut ontolojisi, "sözleşme-değil-içerik", per-node applicability, CI kapısı, çapraz-repo).

## 1. Sorun (doğrulanmış)

14 üretim boyutunun 13'ü **çalışma-zamanı/ürün/operasyon** ekseninde; "**hangi mühendislik standardıyla üretilecek?**" ekseni (coding standards, SOLID, kısa-kod, design-system, UI/UX, data/API, state, quality-gate, observability, release, AI-governance) neredeyse boş. Dört yapısal boşluk: (a) boyut **ontolojisi yok** (düz liste → güvenlik 2, optimizasyon 3 karta yayılmış; disiplin 0); (b) standartlar **içerik** olarak düğüme yazılırsa **drift+çelişki** üretir (Faz 4'te bir düğüm "Tailwind", diğeri "SCSS" diyordu); (c) **per-node uygulanabilirlik yok** → her boyut her düğüme doldurulup jenerik çöp üretiyor; (d) standart **CI kapısı değilse sahte güven**.

## 2. Karar — "kart ekle" değil, işletim katmanı kur

- **Standart = tek-kaynak sözleşme, düğüm REFERANS verir.** 12+ yeni serbest-metin boyut kartı EKLENMEZ (UI şişer + drift). Bunun yerine her standart `src/data/standards/<ad>.json` tek-kaynak sözleşmedir; düğüm `standardRefs.<ad>Ref` ile bağlanır. tech-profiles deseninin (ADR-0026) genelleştirilmesi.
- **Üç grup (ChatGPT modeli):** (1) mevcut 14 boyut = **Product/Runtime**; (2) yeni sözleşmeler = **Engineering Standards** (referans, boyut değil); (3) **Governance & Evidence** = applicability + waivers + evidence.
- **Boyut ailesi ontolojisi:** 14 boyut altı aileye atanır (`functional / runtime-quality / engineering / operations / automation / verification`) → UI gruplama + örtüşme/boşluk görünür.
- **Per-node applicability:** `applicability[dimKey] = {applies, reason}`; `applies=false` ise gerekçe zorunlu (CI kapısı zorlar). Uygulanmayan boyut "N/A" gösterilir, jenerik doldurulmaz.
- **Waiver yaşam döngüsü:** standarttan sapma `waivers[]` ile gerekçeli + onaylı + süreli kaydedilir; gerekçesiz/süresiz waiver geçersiz (CI kapısı).

## 3. Şema (ADR-0027 alanları — hepsi geriye uyumlu default'lu)

`TaskNodeSchema` (`.strict()`) eklenenler: `standardRefs` (14 ref, default ""), `applicability` (record, default {}), `waivers` (array, default []). **Migration GEREKMEZ:** default'lar `safeParse`'ta dolar; 438 düğüm dosyaya dokunmadan parse olur (**lazy migration** — dosya yalnız değer atanınca yazılır). `evidence[]`/`traceability`/`acceptanceCriteria` ZATEN var; çoğaltılmaz, genişletilir.

## 4. P0 standart sözleşmeleri (ST-2)

techProfile (var) · architecture · coding-standards · short-code · design-system · ui-components · ux-interaction · data-api-contract · state-management · quality-gates · observability · release-versioning · ai-governance. Her biri: Zod şema + katalog JSON + conformance test.

## 5. CI kapıları (ST-3, hepsi BLOKLAYICI)

check-standards-coverage (her ref çözülür) · check-dimension-applicability (applies=false ⇒ gerekçe) · check-waivers (gerekçe+onay+süre) · check-short-code (PR/karmaşıklık bütçesi) · check-dependency-policy (allowlist/lisans/lockfile) · check-ui-standards · check-agent-prompt-contract. `deploy.yml`'e eklenir.

## 6. Unknown-unknowns

Standart yazılı ama uygulanmıyorsa ölü metin (→ CI kapısı zorunlu) · 438 node migration tehlikesi (→ default'lu lazy migration) · applicability yoksa jenerik dolgu (→ N/A alanı) · çapraz-repo senkron (platform/actionplan/projector aynı sözleşmeyi okumalı → check çapraz tarar) · design standardı ölçülemezse anlamsız (→ token + conformance) · AI çıktısı eval'siz ölçülemez (→ ai-governance eval seti) · waiver yaşam döngüsü yoksa kalıcı bypass (→ süreli waiver).

## 7. Non-goals

Mevcut 14 boyutu silmek/yeniden adlandırmak. Standartları serbest-metin boyut kartı yapmak. ADR-0026'yı geçersiz kılmak (genelleştirir). platform/projector'a kod yazmak (actionplan plan+sözleşme katmanıdır).
