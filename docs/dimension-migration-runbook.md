# Boyut/Standart Migration Runbook — Lazy Migration ve Güvenli Alan Yazımı

**Sürüm:** 1.0 · **Tarih:** 2026-06-29
**Durum:** Kanonik, bağlayıcı. ADR-0027 §3 (geriye uyumlu default'lu şema) ve `src/schemas/task.ts` (`.strict()` + safeParse) türevidir.
**Kapsam:** ADR-0027 ile gelen üç düğüm alanı — `standardRefs`, `applicability`, `waivers` — ve bunların `src/data/generated/nodes/*.json` (445 düğüm) üzerinde güvenli yazımı.

---

## Önsöz — Neden "Runbook" ve Neden "Migration Yok"

ADR-0027 üç yeni alan getirdi: `standardRefs` (14 referans), `applicability` (boyut→{applies, reason}) ve `waivers[]`. Klasik bir veritabanı dünyasında 445 satıra yeni kolon eklemek bir migration script'i, bir backfill ve bir rollback planı gerektirirdi. Burada gerektirmiyor. Bu runbook iki şeyi netleştirir: (1) neden bu alanlar 445 düğüm dosyasına DOKUNMADAN devreye girdi (lazy migration); (2) bir geliştirici veya AI ajan gerçekten bir değer SET ettiğinde adım adım nasıl, hangi dosyaya, hangi doğrulamayla yazacağı.

Temel ilke: **dosya yalnızca bir değer SET edildiğinde yazılır.** Hiçbir toplu dönüştürme yoktur. 445 düğümün 430'u bu alanları dosyasında hiç taşımayabilir ve yine de geçerlidir; çünkü Zod şeması okuma anında varsayılanları doldurur.

---

## 1. Lazy Migration Nedir — Default'lu Alan Neden Dosya Migration'ı Gerektirmez

`TaskNodeSchema` (`src/schemas/task.ts`) `.strict()` ile tanımlıdır ama ADR-0027 alanlarının hepsi default'ludur:

```ts
standardRefs: StandardRefsSchema.default({}),      // 14 ref, her biri default ""
applicability: z.record(DimensionKeySchema, ApplicabilitySchema).default({}),
waivers: z.array(WaiverSchema).default([]),
```

`StandardRefsSchema` içindeki 14 alanın her biri `z.string().default("")`tir; `ApplicabilitySchema` `{ applies: default true, reason: default "" }`tir. Sonuç:

- Bir düğüm JSON'unda `standardRefs` anahtarı HİÇ yoksa, `safeParse` onu `{}` olarak doldurur ve içindeki 14 ref boş string olur. Düğüm geçerli parse olur.
- Aynısı `applicability` ({}) ve `waivers` ([]) için geçerlidir.
- Yani 445 düğüm, dosyaları hiç değiştirilmeden, runtime'da tam bir TaskNode'a tamamlanır. ADR-0027 §3'ün ifadesiyle: "default'lar safeParse'ta dolar; 445 düğüm dosyaya dokunmadan parse olur."

Bu yüzden bir toplu migration script'i YOK; olması da yanlış olurdu (445 dosyaya gereksiz diff, gereksiz git gürültüsü, gereksiz çakışma riski).

Karşılaştırma — eski (yanlış) vs. lazy (doğru):

| Klasik kolon-ekleme | Lazy migration (ADR-0027) |
|---|---|
| 445 satıra ALTER + backfill script | Script yok; default şemada |
| Tüm satırlar yeniden yazılır (büyük diff) | Yalnız değer SET edilen dosya yazılır |
| Rollback = ters backfill | Rollback = SET edilen alanı sil (default'a döner) |
| Backfill hatası = yarım veri | Yarım veri imkânsız; eksik = default |

---

## 2. Bir Değer SET Ederken — Adım Adım Yazım Prosedürü

Aşağıdaki prosedür `standardRefs`, `applicability` veya `waivers`'a İLK kez (veya yeni) bir değer eklerken izlenir. Hedef daima tek dosyadır: `src/data/generated/nodes/<düğüm-id>.json`.

### Adım 0 — Doğru dosyayı ve alanı belirle

- Düğüm dosyası: `src/data/generated/nodes/<id>.json`. `<id>` düğümün `id` alanıdır (küçük-harf kebab-case).
- Hangi alan? `standardRefs` (bir standarda bağla), `applicability` (bir boyutu N/A yap), `waivers` (bir standarttan sapmayı kaydet). Üçü farklı amaçtır — standards-applicability-matrix.md §4.3'teki ayrımı uygula.

### Adım 1 — Standart referansı SET etme (`standardRefs.<key>`)

1. Hedef standardın id'sini bul: `src/data/standards/<id>.json` dosya adının `.json`'suz hali (ör. `coding-standards`). techProfileRef için id `src/data/tech-profiles.json` içindeki bir profil id'sidir.
2. Doğru anahtarı seç (`StandardRefsSchema`'dan): ör. `coding-standards` → `codingStandardRef`; `data-api-contract` → `dataApiContractRef`. Anahtar↔dosya eşlemesi için standards-applicability-matrix.md §2 tablosuna bak.
3. Düğüm JSON'una yaz:

```json
"standardRefs": {
  "codingStandardRef": "coding-standards",
  "architectureRef": "architecture"
}
```

Yalnız SET ettiğin anahtarları yazman yeterli; yazmadığın 12 anahtar runtime'da boş string'e tamamlanır. Çözülemeyen bir id yazarsan (`"coding-standart"` gibi yazım hatası) `check-standards-coverage` kırmızı olur.

### Adım 2 — Boyut N/A işaretleme (`applicability[dimKey]`)

1. Boyut anahtarının `DIMENSION_KEYS` içinde geçerli olduğunu doğrula (ör. `wcag`, `mobileApps`).
2. `applies: false` ve somut bir `reason` yaz (gerekçesiz N/A `check-dimension-applicability` ile kırmızı olur):

```json
"applicability": {
  "wcag": { "applies": false, "reason": "Saf-backend doğrulayıcı; görünür DOM yüzeyi yok. A11y üst frontend-ui düğümünde kanıtlanır." }
}
```

Uygulanır boyutları (applies=true) yazmana gerek yok; varsayılan zaten uygulanırdır. Yalnız N/A kararını kaydet. Gerekçe yazımı için standards-applicability-matrix.md §4'e bak.

### Adım 3 — Waiver SET etme (`waivers[]`)

Z (zorunlu) bir standarttan bilinçli sapma gerekiyorsa N/A değil waiver kullanılır. `check-waivers` her alanı zorlar:

```json
"waivers": [
  {
    "id": "wv-customer-ui-axe-2026q3",
    "scope": "designSystemRef",
    "reason": "Geçici: legacy bileşen design-system token'larına henüz taşınmadı; Q3'te taşınacak.",
    "approvedBy": "admin",
    "date": "2026-06-29",
    "expires": "2026-09-30"
  }
]
```

Kurallar: `id`/`scope`/`reason` boş olamaz (şema); `approvedBy` ve `date` zorunlu; `expires` varsa `YYYY-MM-DD` formatında ve GEÇMİŞTE olmamalı (süresi dolmuş waiver kırmızı). `scope` bir `standardRefs` anahtarı, bir boyut anahtarı veya serbest kapsam olabilir.

### Adım 4 — Doğrula (yazımdan sonra ZORUNLU)

Sırayla çalıştır; hepsi yeşil olmadan değişiklik tamam sayılmaz:

```bash
npx tsc --noEmit                                    # şema/tip bütünlüğü
npx vitest run                                      # birim + dataIntegrity testleri
node tools/agents/check-standards-coverage.mjs      # standardRefs çözülürlüğü
node tools/agents/check-dimension-applicability.mjs  # N/A gerekçe disiplini
node tools/agents/check-waivers.mjs                 # waiver yaşam döngüsü
```

- `tsc --noEmit`: SET ettiğin değer şema tipine uyuyor mu (yanlış anahtar adı, yanlış tip burada yakalanır).
- `vitest run`: düğüm dosyası hâlâ geçerli safeParse oluyor mu; `tests/dataIntegrity.test.ts` invariantları korunuyor mu.
- `check-standards-coverage`: yazdığın her ref bir standarda/tech-profile'a çözülüyor mu (dangling yok).
- `check-dimension-applicability`: her `applies=false` gerekçeli mi; anahtar geçerli boyut mu.
- `check-waivers`: waiver alanları tam ve süresi geçerli mi.

Bu beş kapı, standards-applicability-matrix.md §6'da tablolanan BLOKLAYICI kapılarla aynıdır ve `deploy.yml` içinde CI'da da çalışır.

---

## 3. 445 Düğüm Güvenlik Kuralı — `.strict()` + safeParse

Lazy migration'ı güvenli kılan iki mekanizma vardır; ikisi de `src/schemas/task.ts`'dedir.

### 3.1 `.strict()` — bilinmeyen alan düğümü düşürür

`TaskNodeSchema` `.object({...}).strict()` ile kapatılmıştır. Bunun anlamı: şemada TANIMLI olmayan bir anahtar düğüm JSON'unda bulunursa parse BAŞARISIZ olur. Bu kasıtlıdır:

- Yazım hatası koruması: `standartRefs` (yanlış yazım) yazarsan `.strict()` reddeder; sessizce yok sayılmaz.
- Şema kayması koruması: kimse şema dışı bir "özel alan" sokup veriyi kirletemez.
- Sonuç: SET ettiğin alan adı MUTLAKA `StandardRefsSchema`/`ApplicabilitySchema`/`WaiverSchema`'daki adla birebir aynı olmalı. Aksi halde düğüm düşer (parse hatası) ve `vitest`/`tsc` kırmızı olur.

Pratik uyarı: `.strict()` nedeniyle bir düğüme "deneme" alanı eklemek YASAKtır. Yeni bir alan gerekiyorsa önce şema (`src/schemas/task.ts`) genişletilir (ADR + PR), sonra düğüme yazılır.

### 3.2 safeParse — eksik alan default'a tamamlanır, hata fırlatmaz

Yükleme `safeParse` ile yapılır. Eksik (tanımlı ama yokmuş) alanlar default'a tamamlanır; bu yüzden 445 düğümün hiçbiri "alan yok" diye düşmez. `.strict()` ile birlikte oluşan denge nettir:

| Durum | Sonuç |
|---|---|
| Alan tanımlı + yok | Default ile doldurulur (lazy migration çalışır) |
| Alan tanımlı + SET edilmiş + geçerli | Olduğu gibi okunur |
| Alan tanımlı + SET edilmiş + yanlış tip | safeParse başarısız → tsc/vitest kırmızı |
| Alan TANIMSIZ (şemada yok) | `.strict()` reddeder → düğüm düşer |

Bu tablo lazy migration'ın neden hem güvenli hem geri-uyumlu olduğunun özüdür: eksiklik affedilir (default), kirlilik affedilmez (`.strict()`).

---

## 4. Toplu İşlem GEREKMEZ — Anti-Pattern Uyarıları

- **445 dosyayı topluca "migrate etmeye" çalışmak yanlıştır.** ADR-0027 §6 bunu açık "unknown-unknown" tehlikesi sayar ("445 node migration tehlikesi → default'lu lazy migration"). Tüm dosyalara boş `standardRefs: {}` yazmak gereksiz 445-dosyalık diff üretir ve hiçbir değer katmaz (zaten default).
- **Uygulanır boyutları (`applies: true`) tek tek yazmak yanlıştır.** Varsayılan zaten uygulanırdır; yalnız N/A (applies=false) kararı kaydedilir. Her boyutu her düğüme yazmak ADR-0027'nin kaçınmak istediği "jenerik dolgu"dur.
- **Boş ref'leri doldurmak için sahte standart uydurmak yanlıştır.** Bir düğümde standart gerçekten uygulanmıyorsa ref boş bırakılır (lazy); olmayan bir standardı uydurursan `check-standards-coverage` kırmızı olur.

---

## 5. Geri-Alma (Rollback)

Lazy migration'da geri-alma trivialdir çünkü her alan default'ludur:

1. **Tek alan geri-alma:** SET ettiğin anahtarı düğüm JSON'undan SİL. Şema onu default'a (`""` / `applies:true` / `[]`) tamamlar; düğüm yine geçerli kalır. Hiçbir backfill gerekmez.
2. **Boş bırakmaya dönmek:** `standardRefs` içindeki son anahtarı sildiysen `standardRefs` objesini tamamen kaldırabilirsin; runtime `{}` ile tamamlar.
3. **Waiver geri-alma:** ilgili waiver objesini `waivers[]` dizisinden çıkar. Dizi boşalırsa `waivers` anahtarını da kaldırabilirsin.
4. **Doğrula:** Adım 4'teki beş kapıyı tekrar çalıştır. Geri-alma sonrası hepsi yeşil olmalı (boş/eksik alan default'la zaten geçerli).

Rollback'in lazy migration'da neden risksiz olduğu §1'deki karşılaştırma tablosunda özetlenmiştir: eksik = default olduğu için bir alanı silmek veriyi bozmaz, yalnız varsayılana döndürür.

---

## Çelişki Bildirimi

Bu runbook ADR-0027 §3 ve `src/schemas/task.ts`'in türevidir. Şema değişirse (yeni standardRefs anahtarı, yeni boyut anahtarı veya alan default'unun değişmesi) runbook yeniden hizalanmalıdır. Doğrulama komutları ve düğüm dizini yolu (`src/data/generated/nodes`) CI kapılarının (tools/agents/check-*.mjs) gerçek davranışıyla birebir tutulmalıdır.

*Son güncelleme: 2026-06-29. Bir sonraki güncelleme yalnızca ADR-0027 alan setinin veya safeParse/.strict() davranışının değişmesiyle yapılmalıdır.*
