# WBS İlişki Alanları — Anlam Sözleşmesi

**Tarih:** 2026-06-28
**Amaç:** `parentId`, `dependsOn`, `blocks`, `related` alanlarının anlamlarını net ayırmak ve veri kapısıyla korumak. ChatGPT eksik-raporu §4.8'e yanıt: bu alanların karışması yanlış kapsam/kritik-yol sonucu üretebilir.

## Tanımlar

Bu nedir? Bir TaskNode'un başka düğümlerle dört farklı ilişki türü vardır. Her biri ayrı soruyu yanıtlar:

| Alan | Soru | Anlam | Yön |
|---|---|---|---|
| `parentId` | "Bu hangi düğümün altında?" | **Hiyerarşi** (WBS kırılımı). Tekil ebeveyn. app → module → archetype → ... → atom. | yukarı (tek) |
| `dependsOn` | "Bu başlamadan önce ne bitmeli?" | **Teknik/yürütme bağımlılığı.** A, B'ye bağlıysa B önce gelmeli. Kritik yolu bu belirler. | A → B (B önce) |
| `blocks` | "Bu hangi işleri bekletiyor?" | **Bloke etme.** A, C'yi blokluyorsa C, A bitene kadar başlayamaz. `dependsOn`'un tersidir (türetilir). | A → C (A önce) |
| `related` | "Bu neyle ilişkili ama bağımlı değil?" | **Bağlamsal ilişki.** Sıralama zorunluluğu YOK; yalnız gezinme/keşif için. | simetrik (gevşek) |

## Ne yapar / ne yapmaz

- `parentId` **sıralama belirlemez**; sadece ağaç yapısıdır. wbsCode bundan türetilir (`reindex`).
- `dependsOn` **kritik yolu ve yürütme sırasını** belirler; Gantt ve sıralama bunu kullanır. DAG olmalıdır (döngü yasak).
- `blocks` çoğunlukla `dependsOn`'dan **türetilir** (A, B'ye bağlıysa B "blocks A"). Elle de eklenebilir.
- `related` **karar üretmez**; raporlar/kritik-yol bunu bağımlılık sanmamalıdır.

## Veri kapısıyla koruma

`tools/agents/check-data-quality.mjs` (CI'da bloklayıcı) şunları zorlar:

- `dependsOn` / `blocks` / `related` içindeki her id **gerçek bir düğüme** işaret etmeli (dangling yok).
- `dependsOn` grafiği **çevrimsiz (DAG)** olmalı — döngü, sıralanamaz bağımlılık demektir.
- `parentId` null ya da gerçek bir düğüm olmalı.

Bu invariantlar `tests/dataIntegrity.test.ts` içinde de test edilir; yani hem CI kapısı hem `npm test` korur.

## Kullanım kuralı (özet)

Bir ilişki eklerken sor:

1. Bu bir **kırılım** mı? → `parentId`.
2. Bu, diğeri bitmeden **başlayamaz** mı? → `dependsOn` (sıralama/kritik yol).
3. Bu, başka işi **bekletiyor** mu? → `blocks` (genelde otomatik türetilir).
4. Sadece **ilgili** mi (sıra zorunlu değil)? → `related`.

Yanlış alan seçimi (ör. `related`'ı `dependsOn` sanmak) kritik yolu ve kapsam hesabını bozar; bu yüzden ayrım veri kapısıyla korunur.
