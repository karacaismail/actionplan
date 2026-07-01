# Dosya 7 — Kapsama Sonucu + GitHub Pages Handoff

**Tarih:** 2026-07-01 · **Kapsam:** "Numeronym + PIM-v2, kernel/archetype/surface yönergelerinde var mı?" sorusunun cevabı + GitHub Pages'i güncellemek için çalıştırman gereken komutlar.

---

## 1. Sorunun cevabı — kümenin karşılıkları yönergelerde var mı?

Kısa cevap: **artık var, doğru katmanlara yerleştirildi ve eksikler kapatıldı.** Tablodan önce sade özet: bu tur bir kapsama matrisi çıkarıp boşlukları yeni yönergelerle doldurdum.

**Numeronym standartları** (`docs/kapsama-matrisi-kernel-archetype-surface-2026-07-01.md`): başlangıçta 25 VAR / 32 KISMİ / 6 EKSİK. Eksiklerin hepsi kapatıldı. Hangi standart hangi katmanda yaşıyor, üç eşleme dokümanında net:
- `docs/kernel-numeronym-eslemesi.md` — o11y, AuthN/AuthZ/PDP, i14y, scale/edge, capability, mode-profile → kernel primitifleri.
- `docs/archetype-numeronym-eslemesi.md` — i18n-alan, c13n/n6n, computation, provenance → ArcheType sözleşmesi.
- `docs/surface-numeronym-eslemesi.md` — a11y, i18n/RTL, p13n, c12n → Surface alanları.

**PIM-v2 özellikleri** (`docs/pim-product-archetype-referans.md`, `docs/pim-ozellik-yonerge-kapsama.md`): 41 özellikten **40'ı** mevcut + yeni yönergelerle ifade edilebilir. Tek gerçek boşluk #26 (fuzzy/phonetic/ML dedup) idi; onu da `k-mdm` yönergesi adresliyor. PIM'in en çok zorladığı 4 şey — varyant/attribute-family, EAV, ağaç ilişki, taksonomi — tam da bu turda doldurulan archetype boşluklarıydı.

---

## 2. Bu turda üretilenler — üç katmanın boşlukları kapatıldı

Sade özet: kernel'de 4, archetype'ta 4, surface'te 2 yeni yönerge + eşleme/kapsama dokümanları + 22 WBS düğümü.

- **KERNEL:** `k-storage-dam-directive` (DAM/S3), `k-worker-taskqueue-directive` (Celery/ARQ), `k-search-directive` (FTS/OpenSearch), `k-mdm-provenance-directive` (golden-record/survivorship) + WBS düğümleri.
- **ARCHETYPE:** `archetype-variant-attribute-family-directive`, `archetype-eav-directive`, `archetype-tree-relation-directive` (elestiri-01 §3.3 boşluğu), `archetype-taxonomy-directive` (ETIM/UNSPSC/GS1).
- **SURFACE:** `surface-tree-metadataform-addendum` (ağaç gezgini + metadata-form + completeness badge).
- **22 yeni WBS düğümü** (k-storage/worker/search/mdm/party/actor/capability/mode/computation/policy-pdp/… + scale-*) — zenginleştirildi, reponun tüm kalite kapılarından geçiyor, sitede WBS ağacında görünecek.

---

## 3. GitHub Pages — yerel CI YEŞİL, push senin

Reponun tüm CI dizisini yerelde çalıştırıp doğruladım: **typecheck, lint (biome), 16 konformans kapısı, quality-lint, check-content, test:content, vitest (30 test), ve vite build — hepsi YEŞİL.** (Yerelde build yalnız `dist/` temizliğinde EPERM verdi; bu bu sandbox'ın silme-engeli, senin Mac'inde ve CI'da olmaz — taze dizine build `✓ 19.34s`'de derlendi.)

Git'i ben yapamıyorum: bu sandbox `.git` kilidini ve dosya silmeyi engelliyor, ayrıca canlı `main` senin yetkin. Aşağıdaki komutları **kendi terminalinde** çalıştır:

```bash
cd ~/DEV/mimari/actionplan
rm -f .git/index.lock                                   # takılı git kilidini kaldır
rm -f tools/tmp-*.mjs tools/_tmp_*.json && rm -rf .vite-verify   # ajan geçici artıkları
git add -A
git commit -m "feat(kernel/archetype/surface): PIM-v2 + numeronym kapsama; 4 kernel primitifi (storage/worker/search/mdm) + 4 archetype yonergesi (variant/EAV/tree/taxonomy) + 2 surface addendum + 13 standart JSON + 3 CI kapisi + 22 WBS dugumu; AGENTS.md Prisma->SQLAlchemy; 6 ADR kilitli"
git push
```

Push'tan sonra GitHub Actions `deploy.yml`'i çalıştırır (typecheck → lint → 20 kapı → test → build → Pages deploy). Yaklaşık 2-3 dakikada `karacaismail.github.io/actionplan` güncellenir; 467 düğüm + yeni yönergeler yayında olur.

**Opsiyonel — push öncesi kendi doğrulaman:** `npm run typecheck && npm run lint && npm test && npm run build` (hepsi yeşil dönmeli).

---

## 4. Önemli notlar

- **gen:items geri alındı:** Süreç içinde bir araç (`gen:items`) yanlışlıkla 430 izli düğümü değiştirdi; hepsini `git show HEAD` ile satır satır geri aldım. Bu yüzden commit yalnız **kasıtlı** değişiklikleri içerir (22 izli dosya + ~134 yeni dosya) — çelişki/kirlilik yok.
- **AGENTS.md + 6 ADR:** Senin onayınla düzeltildi (Prisma→SQLAlchemy; ADR'ler "Kilitli"). Bunlar da commit'te.
- **Local == remote:** Yukarıdaki commit + push sonrası yerel çalışma ağacın ile GitHub Pages kaynağı eşitlenir.
