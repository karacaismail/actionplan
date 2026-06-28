## Amac

Bu PR neyi degistiriyor ve neden gerekli?

## Degisiklik tipi (birden fazla isaretlenebilir)

- [ ] Hata duzeltme (bug fix)
- [ ] Yeni ozellik (feature)
- [ ] Veri guncellemesi (src/data/ veya docs/)
- [ ] Sema guncellemesi (src/schemas/)
- [ ] Arac/script (tools/)
- [ ] Yapilandirma / CI (*.config.*, .github/)
- [ ] Dokumantasyon
- [ ] Refactor (davranis degismez)

## Test kanitlari

Lokal olarak ne calistirdin ve sonuclari neler?

```
npm run typecheck
npm run lint
npm test
npm run test:content
npm run test:e2e
```

(Ciktiyi buraya yapistir veya "CI yesildir" yaz.)

## CI kapisi kontrol listesi

Bu liste deploy.yml'daki gercek kapi adlariyla bire-bir eslesmektedir.

- [ ] `Tip denetimi` yesil (`npm run typecheck`)
- [ ] `Lint` yesil (`npm run lint` — Biome)
- [ ] `Icerik kalite kapisi (node checker — 422 dugum)` yesil (`node tools/agents/check-content.mjs`)
- [ ] `Icerik kalite kapisi (vitest — kanonik)` yesil (`npm run test:content`)
- [ ] `ECA ruleset katalogu kapisi` yesil (`node tools/agents/check-ruleset.mjs`)
- [ ] `Surface/Workflow katalogu kapisi` yesil (`node tools/agents/check-surface.mjs`)
- [ ] `Kalite kapisi (audit — golden + koken)` yesil (`node tools/quality-lint.mjs`)
- [ ] `Birim testleri` yesil (`npm test`)
- [ ] `E2E + axe` yesil (`npm run test:e2e` — Playwright + axe WCAG 2.2)
- [ ] `Uretim derlemesi` yesil (`npm run build` — Vite + spa404.mjs)

## Risk ve geri alma plani

Bu degisiklik hangi riski tasiyor? Bozulursa nasil geri alinir?

## Ekran goruntusu / link (opsiyonel)

UI degisikliklerinde once/sonra gorsel ekle.

## AI-uretim notu (varsa)

Bu degisiklik AI tarafindan onerildi mi? Insan hangi adimi denetledi?
