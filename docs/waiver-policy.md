# Waiver Politikası — Standarttan Bilinçli Sapmanın Yaşam Döngüsü

Sürüm: 1.0 — 2026-06-29
Durum: Kanonik. `check-waivers` kapısının (ADR-0027) sözleşme ve davranış referansı.

---

## Önsöz — Waiver Neden Var

Mühendislik standartları (bkz. `docs/engineering-standards-index.md`) bağlayıcıdır; düğüm bunlara referans verir ve CI ihlalleri bloklar. Ancak gerçek dünyada bir standarttan **bilinçli, gerekçeli ve geçici** sapma gerekebilir: bir distribution izole sınırında hız için bir kuralı askıya almak, bir geçiş döneminde eski bir deseni tolere etmek gibi. Bu sapmanın sessizce yapılması "kalıcı bypass" üretir — standart yazılı kalır ama fiilen uygulanmaz.

Waiver bu boşluğu kapatır: sapma **kayıt altına alınır, onaylanır ve süreye bağlanır.** Süre alanı sayesinde waiver kendiliğinden geçersizleşir; kalıcı bir kaçış yolu oluşamaz. Gerekçesiz veya süresiz bir waiver, ADR-0027'nin açıkça reddettiği şeydir ve `check-waivers` kapısınca bloklanır.

Waiver kayıtları düğümde `waivers[]` dizisinde tutulur (`src/schemas/task.ts`, `WaiverSchema`). Bu alan default `[]`'dir; bu nedenle 445 düğüm dosyaya dokunulmadan parse olur (lazy migration) ve waiver yalnızca gerçekten bir sapma kaydedildiğinde dosyaya yazılır.

---

## 1. Yaşam Döngüsü

Bir waiver dört evreden geçer. Her evre bir sonrakinin ön koşuludur; atlanamaz.

| Evre | Ne olur | Sorumlu | Hangi alan dolar |
|---|---|---|---|
| Talep | Sapma ihtiyacı tanımlanır; kapsam ve gerekçe yazılır. Hangi standarttan/boyuttan neden sapıldığı net olmalıdır. | Düğüm sahibi (`owner`) | `id`, `scope`, `reason` |
| Onay | Yetkili sapmayı inceler ve onaylar. Onaysız waiver geçersizdir. | İnsan onaylayan | `approvedBy`, `date` |
| Süre | Sapmanın geçerlilik bitiş tarihi belirlenir. Süresiz waiver geçersizdir. | Onaylayan | `expires` |
| Bitiş | `expires` tarihi geçtiğinde waiver otomatik geçersizleşir; standart yeniden tam zorlanır. Sapma sürmeli ise yeni bir waiver talep edilir (uzatma kayıt altında kalsın diye). | Otomatik (CI) | — |

Bitiş evresi pasiftir: hiçbir alan değişmez, yalnızca `expires` tarihi geçince `check-waivers` o waiver'ı artık geçerli saymaz. Bu, "süreli waiver = kalıcı bypass'a karşı koruma" ilkesinin kalbidir.

---

## 2. Alan Sözleşmesi

`WaiverSchema` (src/schemas/task.ts) altı alan tanımlar. Aşağıdaki tablo her alanın kuralını verir.

| Alan | Tip | Zorunlu mu | Kural |
|---|---|---|---|
| `id` | string | Evet (min 1) | Waiver'ın benzersiz kimliği; düğüm içinde tekil |
| `scope` | string | Evet (min 1) | Sapmanın kapsamı: bir `standardRef` anahtarı, bir boyut anahtarı veya serbest kapsam ifadesi |
| `reason` | string | Evet (min 1) | Sapmanın gerekçesi; boş olamaz (gerekçesiz waiver reddedilir) |
| `approvedBy` | string | Kapı için evet | Onaylayan kişi/kimlik; `check-waivers` boş `approvedBy`'ı reddeder |
| `date` | string | Kapı için evet | Onay tarihi (ISO) |
| `expires` | string | Kapı için evet | Son geçerlilik tarihi (ISO). Şema default'u boş kabul eder ama **kapı süre ister**: boş = süresiz = reddedilir |

Şema seviyesinde yalnızca `id`, `scope`, `reason` katı zorunludur (`min(1)`); `approvedBy`, `date`, `expires` şemada default `""` taşır. Ancak `check-waivers` kapısı bu üçünü de **doldurulmuş** ve `expires`'ı **gelecek tarihli** olarak ister. Yani şema parse'ı geçen bir waiver, kapıyı geçmek için ek olarak onay + süre koşullarını karşılamak zorundadır.

`scope` örnekleri:

- Bir standardRef anahtarı: `codingStandardRef`, `shortCodeRef`, `designSystemRef` (o standarttan sapma)
- Bir boyut anahtarı: `wcag`, `performance`, `owasp` (o üretim boyutu beklentisinden sapma)
- Serbest kapsam: `legacy-import-path`, `temporary-scss-exception` gibi açıklayıcı bir etiket

---

## 3. check-waivers Neyi Reddeder

`tools/agents/check-waivers.mjs` kapısı (bloklayıcı; `.github/workflows/deploy.yml`) bir waiver'ı aşağıdaki üç durumdan herhangi birinde geçersiz sayar ve build'i durdurur.

| Reddedilen durum | Neden reddedilir | Düzeltme |
|---|---|---|
| Gerekçesiz | `reason` boş — sapmanın niçin yapıldığı belirsiz; denetlenemez | `reason` alanına somut, doğrulanabilir gerekçe yaz |
| Süresiz | `expires` boş — sapma kalıcı bypass'a dönüşür; standart fiilen ölür | `expires` alanına gelecek bir ISO tarihi gir |
| Süresi dolmuş | `expires` tarihi geçmiş — sapma artık geçerli değil ama hâlâ kayıtta aktif gibi duruyor | Sapma sürüyorsa yeni bir waiver talep et; bitmiş ise kaydı kaldır ve standardı tam karşıla |

Ek olarak onaysız waiver (`approvedBy` boş) da geçersizdir: sapma insan onayı olmadan kayda alınamaz.

Reddetme mantığının özü: bir waiver yalnızca **gerekçeli + onaylı + henüz süresi dolmamış** ise geçerlidir. Bu üç koşuldan biri eksikse kapı bloklar. Böylece her sapma izlenebilir, sahipli ve geçicidir.

---

## 4. Örnek Geçerli Waiver Kaydı

Aşağıdaki JSON, bir düğümün `waivers[]` dizisine eklenmiş geçerli bir waiver kaydını gösterir. Üç zorunlu alan (`id`, `scope`, `reason`) dolu; onay (`approvedBy`, `date`) ve süre (`expires`) `check-waivers` koşullarını karşılar.

```json
{
  "waivers": [
    {
      "id": "wv-scss-utility-2026q3",
      "scope": "codingStandardRef",
      "reason": "Geçiş döneminde util-first SCSS modülü, coding-standards import-sırası kuralından muaf tutuluyor; refactor archetype/platform-token-migration düğümünde planlandı.",
      "approvedBy": "ismail.karaca",
      "date": "2026-06-29",
      "expires": "2026-09-30"
    }
  ]
}
```

Bu kayıt neden geçerlidir:

- `id` tekil ve kebab-case; düğüm içinde başka waiver ile çakışmaz.
- `scope` bir gerçek `standardRef` anahtarıdır (`codingStandardRef`); sapmanın hangi standardı hedeflediği nettir.
- `reason` somut ve doğrulanabilir; sapmanın gerekçesini ve nasıl kapatılacağını (refactor düğümü) belirtir — boş değildir.
- `approvedBy` dolu; insan onayı kayıtlıdır.
- `date` onay tarihidir (ISO).
- `expires` gelecek bir ISO tarihidir; bu tarihten sonra waiver otomatik geçersizleşir ve `codingStandardRef` standardı yeniden tam zorlanır.

Geçersiz olurdu eğer: `reason` boş olsaydı (gerekçesiz reddi), `expires` boş olsaydı (süresiz reddi), veya `expires` geçmiş bir tarih olsaydı (süresi dolmuş reddi).

---

## 5. İlgili Dokümanlar

| Doküman | Yol | İlişki |
|---|---|---|
| ADR-0027 | `docs/adr-0027-engineering-standards.md` | Waiver yaşam döngüsü kararının kaynağı |
| CI Kapı Kataloğu | `docs/ci-conformance-gates.md` | `check-waivers` kapısının kataloğdaki yeri |
| Mühendislik Standartları Dizini | `docs/engineering-standards-index.md` | Waiver'ın hangi standartlardan sapma olabileceği |
| Definition of Ready | `docs/ready-for-dev-gate.md` | `dependsOn` bağımlılık waiver'ı (ayrı, `notes` tabanlı) ile karşılaştırma |

Not: `docs/ready-for-dev-gate.md` içinde geçen "bağımlılık waiver"ı (`dependsOn` engelinin `notes`'a gerekçeyle kaydı) burada tanımlanan standart waiver'ından farklı bir mekanizmadır. Bu doküman yalnızca standarttan sapmayı kayıt altına alan `waivers[]` dizisini ve `check-waivers` kapısını kapsar.

Şema kaynağı: `src/schemas/task.ts` → `WaiverSchema`.
