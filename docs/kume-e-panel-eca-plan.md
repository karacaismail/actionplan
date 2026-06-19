# Küme E — Panel ECA Görünürlük + Simülasyon (Mimari Plan)

> Bu bir **mimari tanım** dokümanıdır; implementasyon kodu içermez. "Kod yaz" denildiğinde bu plana göre üretilir.
> UI burada **çizilmez, tanımlanır** (bileşen listesi, hiyerarşi, props/state, davranış, stil token'ları, erişilebilirlik).

## 1. Dört soru

**Bu nedir?** Panelde, bir görev/ArcheType sayfasında tanımlı ECA (Event-Condition-Action: olay-koşul-eylem) kurallarını ve bağlı kural paketlerini (Küme C) **görünür kılan** ve bir olayı **simüle eden** salt-okunur bir görünüm.

**Ne işe yarar?** Kullanıcı, "şu olay olursa hangi otomasyon kuralları tetiklenir, ne yapar, insan onayı gerekir mi?" sorusunu kod okumadan, panelde görür ve dener.

**Ne yapar?** (1) Düğümün `ecaRules`'unu ve bağlı ruleset paketlerini listeler; (2) seçilen bir olay + bağlam için `runEca` motorunu **kuru-çalıştırma (dry-run)** ile çağırır; (3) tetiklenecek kuralları, eylemlerini ve onay gereksinimini gösterir; (4) tetik zincirini (maks 6) ve `maxChainDepth` sınırını görselleştirir.

**Ne yapmaz?** Veriyi **değiştirmez** (mutate etmez). Gerçek eylem (görev oluştur, bildirim gönder, alan yaz) **çalıştırmaz** — yalnız "ne olurdu" gösterir. AI hiçbir kuralı kendiliğinden uygulamaz; kural paketlerini değiştiremez (system katmanı kilitli). Bu görünüm bir **teşhis/önizleme** aracıdır, bir yürütme motoru değil.

## 2. AI / aktör ayrımı (net)

- **Sistem ne yapar?** `runEca`/`evaluateEca` ile kuralları değerlendirir, tetiklenenleri döndürür (saf fonksiyon, yan etkisiz).
- **Kullanıcı ne yapar?** Olayı ve bağlam alanlarını seçer, "Simüle Et" düğmesine basar, sonucu okur.
- **Panel ne yapar?** Sonucu salt-okunur gösterir; gerçek eylemi tetiklemez.
- **AI ne yapar?** Bu görünümde AI **yoktur**; istenirse yalnızca "bu kural paketi şu sayfaya uygun olabilir" önerisi verebilir (öneri, karar değil). AI kural paketini değiştiremez.
- **İnsan onayı nerede?** Simülasyon onay gerektirmez (veri değişmez). Gerçek hayatta `requiresApproval=true` olan geçişler panelde **"insan onayı gerekir"** rozetiyle açıkça işaretlenir.

## 3. Test stratejisi (önce testler)

1. **Birim (motor zaten var):** `evaluateEca`/`runEca` için `tests/engine.test.ts` mevcut (4 test). Simülasyon bunları kullandığı için yeni motor testi gerekmez.
2. **Bileşen testleri (yeni, vitest + jsdom):**
   - `EcaRuleList` boş durumda "kural yok" gösterir; n kuralda n satır render eder.
   - `EcaSimulator` seçilen olay+bağlamda doğru tetiklenen kuralları listeler (motor sonucu ile birebir).
   - `requiresApproval=true` kural "insan onayı gerekir" rozetini gösterir.
   - Simülasyon **hiçbir store mutasyonu** yapmaz (spy ile doğrula: dispatch çağrılmaz).
   - `maxChainDepth` aşımı "zincir sınırı (6) aşıldı" mesajını gösterir.
3. **Erişilebilirlik (axe, e2e):** görünüm WCAG 2.2 AAA; klavyeyle olay seç → simüle et → sonuç oku; ekran okuyucu sonucu `aria-live` ile duyurur.
4. **Katalog kapıları (zaten var):** `check-ruleset.mjs` + `check-surface.mjs` paket/sözleşme bütünlüğünü korur.

## 4. Veri modeli (yeni şema YOK — mevcut sözleşmeler okunur)

- `node.ecaRules: EcaRule[]` — düğüm-başı inline kurallar (mevcut).
- `ruleset-catalog.json` (Küme C) — yeniden kullanılabilir paketler; düğümün bağlı paketleri `appliesTo.clusters` ile eşlenir.
- `workflow-catalog.json` (Küme D) — `rulesetRefs` ile paketlere bağlı durum makineleri; geçişlerin `requiresApproval` ve `on` olayları.
- Motor: `runEca(rules, event, ctx): EcaFireResult[]` ve `evaluateEca(rule, event, ctx)` (mevcut, gerçek).
- **Türetme:** Bir düğümün "etkili kural seti" = `node.ecaRules` + (cluster eşleşen paketlerin kuralları). Bu birleşim salt-okunur hesaplanır (yardımcı: `lib/eca-effective.ts` — yeni, saf fonksiyon).

## 5. Bileşen listesi

- `EcaPanel` — kapsayıcı; düğüm detay görünümüne bir sekme/bölüm olarak eklenir.
- `EcaRuleList` — etkili kuralları (inline + paket) listeler.
- `EcaRuleCard` — tek kural: olay, koşullar, eylem, `requiresApproval` rozeti, kaynak (inline/paket) rozeti, katman (system/platform/tenant) rozeti.
- `EcaSimulator` — olay seçici + bağlam alan editörü + "Simüle Et" düğmesi.
- `EcaSimulationResult` — tetiklenen kurallar, eylemleri, zincir derinliği, onay-gerekir uyarıları; "hiçbir kural tetiklenmedi" boş durumu.
- `RulesetPackageBadge` / `ApprovalBadge` / `LayerBadge` — küçük durum rozetleri (ui/ yeniden kullanımı).

## 6. Bileşen hiyerarşisi

```
EcaPanel
├─ EcaRuleList
│  └─ EcaRuleCard (× n)   → RulesetPackageBadge | LayerBadge | ApprovalBadge
└─ EcaSimulator
   ├─ (olay seçici + bağlam editörü)
   └─ EcaSimulationResult
      └─ (tetiklenen EcaRuleCard özetleri + zincir göstergesi)
```

## 7. Props / state tanımları (sözleşme — implementasyon değil)

```ts
interface EcaPanelProps { nodeId: string; }                 // store'dan düğümü çeker
interface EcaRuleListProps { rules: EffectiveRule[]; }       // salt-okunur
interface EcaRuleCardProps { rule: EffectiveRule; }
interface EcaSimulatorProps { rules: EffectiveRule[]; events: string[]; }
interface EcaSimulationResultProps { results: EcaFireResult[]; chainDepthHit: boolean; }

// Türetilmiş tip (lib/eca-effective.ts):
interface EffectiveRule extends EcaRule {
  source: "inline" | "package";
  packageId?: string;
  layer?: "system" | "platform" | "tenant";
}

// EcaSimulator yerel state (sadece UI; global store DEĞİL):
interface SimState { event: string; ctx: Record<string, string|number|boolean>; results: EcaFireResult[] | null; }
```

State kuralı: simülasyon state'i **bileşen-yerel** (`useState`); global store'a yazılmaz; kalıcılık yok (her açılışta temiz). Bu, "simülasyon veri değiştirmez" ilkesinin UI tarafı.

## 8. Davranış / etkileşim kuralları

- Panel açıldığında etkili kurallar `lib/eca-effective.ts` ile hesaplanıp listelenir (salt-okuma).
- Kullanıcı bir olay seçer (kuralların `event` değerlerinden türetilen liste) ve gerekirse bağlam alanlarını girer.
- "Simüle Et" → `runEca(effectiveRules, event, ctx)` çağrılır; sonuç `EcaSimulationResult`'a yazılır. **Store'a dokunulmaz.**
- Her tetiklenen kuralda eylem tipi + parametreleri + (varsa) "insan onayı gerekir" rozeti gösterilir.
- `maxChainDepth` aşılırsa "zincir sınırı (6) aşıldı — sonsuz tetik koruması" uyarısı.
- Boş durumlar: kural yoksa "Bu sayfada tanımlı ECA kuralı yok"; tetik yoksa "Bu olay hiçbir kuralı tetiklemez".

## 9. Stil parametreleri

- **İkonlar:** yalnız Phosphor (CDN). Örn. `ph-lightning` (olay), `ph-funnel` (koşul), `ph-play` (simüle), `ph-shield-check` (onay), `ph-lock` (system katman). Emoji YOK.
- **Tipografi:** Roboto; min ağırlık 300; min boyut 1rem (mevcut token sistemi).
- **Renk token'ları (mevcut tema):** rozetler için `--color-status-*` token'ları; system katman = uyarı tonu, tenant = nötr, platform = birincil. Sabit renk kodu yazılmaz, token kullanılır.
- **Spacing:** kart içi 8/12/16px ritmi (mevcut ölçek token'ları); kartlar arası 12px.
- **Tablo/liste:** minimalist; satır yüksekliği erişilebilir dokunma hedefi ≥44px.

## 10. Responsive davranış

- Geniş ekran: `EcaRuleList` solda, `EcaSimulator` sağda (split).
- Dar ekran (mobil): tek sütun yığılır (önce kurallar, sonra simülatör); bağlam editörü tam genişlik.
- Sonuç paneli mobilde simülatörün altına akar.

## 11. Erişilebilirlik (WCAG 2.2 AAA)

- Tüm etkileşim klavyeyle: olay seçici (`<select>`/listbox), "Simüle Et" düğmesi, sonuç gezinme.
- Simülasyon sonucu `aria-live="polite"` ile ekran okuyucuya duyurulur.
- Durum/rozet yalnız renkle değil **metinle** de ifade edilir (kontrast ≥7:1).
- Odak sırası mantıksal; sonuç güncellenince odak kaybolmaz.

## 12. Edge case'ler ve riskler

- **Kural çakışması:** aynı olayda birden çok kural tetiklenir → hepsi listelenir (sıralı), kullanıcı görür.
- **Eksik bağlam:** `when` koşulu olmayan alan referans ediyorsa → kural "koşul sağlanmadı" ile tetiklenmez; UI bunu "eksik bağlam" notuyla ayırt eder.
- **Zincir patlaması:** `then` başka olay üretirse → simülasyon **tek adım** gösterir (zincir otomatik ilerletilmez); `maxChainDepth` rozetiyle sınır hatırlatılır. (Çok-adım zincir simülasyonu sonraki faz.)
- **Paket-düğüm yanlış eşleşme:** `appliesTo` geniş ise alakasız paket görünebilir → kaynak/katman rozetiyle şeffaflık; filtre opsiyonu.
- **Performans:** kural sayısı düşük (düğüm başına ≤ ~10) → maliyet önemsiz; yine de `useMemo` ile etkili-kural hesabı önbeklenir.
- **Risk (yanlış güven):** kullanıcı simülasyonu "gerçek çalıştırma" sanabilir → her yerde "Önizleme / veri değişmez" etiketi zorunlu.

## 13. Uygulanacak adımlar (test-önce sıra)

1. `lib/eca-effective.ts` (saf fonksiyon) + birim testi: inline + paket kurallarını birleştir.
2. `EcaSimulationResult` + test (motor sonucunu render).
3. `EcaSimulator` + test (olay seç → runEca → sonuç; store mutasyonu YOK).
4. `EcaRuleCard`/`EcaRuleList` + test (rozetler, boş durum).
5. `EcaPanel` + düğüm detay görünümüne entegrasyon.
6. axe/e2e: klavye + aria-live + kontrast.
7. (İsteğe bağlı sonraki faz) çok-adım zincir simülasyonu ve workflow durum-makinesi görselleştirme (Küme D `wf-*`).

## 14. Kapsam dışı (bu faz)

- Gerçek eylem yürütme (yalnız önizleme).
- Çok-adım otomatik zincir simülasyonu.
- Kural/paket düzenleme UI'si (system katmanı zaten kilitli; düzenleme ayrı yetkili akış).
