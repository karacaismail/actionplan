# Katki Rehberi

Bu belge `karacaismail/actionplan` reposuna katki saglayacak herkese — insan veya AI destekli
is akisi — yol gosterir.

---

## Temel kural: AI main'e dogrudan push edemez

Bu repo'nun en onemli governance kuralı budur:

- Hicbir AI sistemi (GitHub Actions dahil) `main` branch'ine insan onayi olmadan dogrudan
  kod yazamaz veya push yapamaz.
- Guvenli akis kesinlikle soyledir:

```
AI kod onerir veya feature branch'e push eder
    --> PR acilir
        --> insan inceler, CI kapilari gectigi mi denetler
            --> insan merge eder
```

Branch protection bu kurali teknik olarak da zorlar: `main`'e dogrudan push reddedilir,
`force push` yasaktir, admin dahil kimse kurali atlayamaz.

---

## Branch akisi

```
main  <-- tek karali branch; sadece PR uzerinden degisir
  |
  +-- feat/<kisa-aciklama>   yeni ozellik veya iyilestirme
  +-- fix/<kisa-aciklama>    hata duzeltme
  +-- docs/<kisa-aciklama>   yalnizca dokumantasyon
  +-- ai/<kisa-aciklama>     AI tarafindan onerilen degisiklik (status:ai-suggested etiketi)
```

Kural ozeti:
1. `main`'den taze bir branch ac.
2. Degisikligi o branch'te yap; commit'le.
3. GitHub'da PR ac; PR sablon alanlarini doldur.
4. CI kapilari yesillenmeden merge yapma.
5. En az 1 insan onayindan sonra merge tiklayabilirsin.

---

## Test-once kurali

Kod gondermeden once asagidaki komutlarin tamamini lokal olarak calistir ve ciktilarini PR
sablon alanina yapistir. CI zaten aynisini calistiracak; lokal kirmizi ise CI de kirmizi olur.

```bash
npm run typecheck       # TypeScript derleyici hatasi sifir olmali
npm run lint            # Biome check; format/stil ihlali olmamali
npm test                # vitest run — tum birim testleri yesil
npm run test:content    # vitest (vitest.content.config.ts) — icerik testleri yesil
npm run test:e2e        # Playwright + axe-core — WCAG 2.2 ihlali yok
npm run build           # Vite build + spa404.mjs; dist/ uretilmeli
```

---

## CI kapilari — deploy.yml ile birebir eslesmektedir

Asagidaki 10 kapi `main`'e merge oncesi tamami yesil olmak zorundadir:

| Kapi adi (deploy.yml'daki adim) | Tetikleyen komut |
|---|---|
| Tip denetimi | `npm run typecheck` |
| Icerik kalite kapisi (node checker — 422 dugum) | `node tools/agents/check-content.mjs` |
| Icerik kalite kapisi (vitest — kanonik) | `npm run test:content` |
| ECA ruleset katalogu kapisi | `node tools/agents/check-ruleset.mjs` |
| Surface/Workflow katalogu kapisi | `node tools/agents/check-surface.mjs` |
| Kalite kapisi (audit — golden + koken) | `node tools/quality-lint.mjs` |
| Birim testleri | `npm test` |
| E2E + axe | `npm run test:e2e` |
| Uretim derlemesi | `npm run build` |
| Lint | `npm run lint` |

Herhangi biri kirmiziysa deploy durur ve merge engellenebilir.

---

## Veri ve sema degisiklikleri

`src/data/` ve `src/schemas/` ozel dikkat gerektirir:

- `src/data/` altindaki JSON dosyalari JSON-as-DB olarak kullanilir; el ile duzenleme
  icerik kalite kapisini kirabilecegindan degisiklikler mutlaka `check-content.mjs`,
  `check-ruleset.mjs` ve `check-surface.mjs` kapilariyla dogrulanmalidir.
- `src/schemas/` (Zod semalari) degistiriliyorsa tip denetimi ve birim testleri ozellikle
  dikkatli izlenmelidir.
- Her iki klasor de CODEOWNERS ile `@karacaismail` sahipligindedir; PR'da otomatik review
  istegi atanir.

---

## AI tarafindan onerilen degisiklikler

- AI tarafindan acilan veya onerilen issue'lar `status:ai-suggested` etiketiyle isaretlenir.
- AI feature branch'e commit yapabilir ve PR acabilir; ancak merge edemez.
- PR aciklamasindaki "AI-uretim notu" alaninin doldurulmasi zorunludur: AI neyi onerdi,
  insan hangi adimi denetledi?
- `status:ai-suggested` etiketi insan onay akisini gozlemlenebilir kilar; etiketi kaldirmak
  insan onayini belgelemek anlamina gelir.

---

## Commit mesaji konvansiyonu

```
<tip>(<kapsam>): <kisa aciklama>

[opsiyonel govde]

[opsiyonel dipnot — closes #N]
```

Tip ornekleri: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `chore`.

Kapsam ornekleri: `data`, `schema`, `engine`, `ui`, `tools`, `ci`.

---

## Bunu okuyunca sorularim var

Issue ac, `type:docs` etiketi kullan veya `docs/` altindaki ilgili dosyaya PR gonder.
