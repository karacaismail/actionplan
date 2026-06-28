# Guvenlik Politikasi

Bu belge `karacaismail/actionplan` reposundaki guvenlik acigi bildirme surecini,
kapsami ve gizli/secret yonetim kurallarini tanimlar.

---

## Desteklenen surumler

| Surum | Durum |
|---|---|
| `main` branch (HEAD) | Aktif destek — yamalar bu sürüme uygulanir |
| Etiketli yayinlar (v0.x) | Yalnizca kritik yamalar; minor/patch yok |
| Eski dallar (feat/*, fix/*) | Destek yok; PR merge edilmeden kapanir |

Bu repo frontend-only, JSON-as-DB mimarisiyle calisir ve herkese acik GitHub Pages
uzerinde yayinlanir. Sunucu tarafi isleme, kimlik dogrulama veya veritabani yoktur.

---

## Kapsam ici guvenlik konulari

- Bagimlilik guclukleri (npm paket CVE'leri)
- GitHub Actions workflow'larinda gizli veri sizintisi riski
- CODEOWNERS veya branch protection bypass etme yontemi
- Kullanici tarayicisinda XSS / script enjeksiyonu (SPA icerik isleme)
- WCAG/erisebilirlik ihlallerini guvenlik acigi olarak bildirmek istiyorsaniz kabul edilir

## Kapsam disi

- GitHub altyapisinin kendisindeki guclukleri (GitHub'a bildirin)
- Statik varliklarin icerigine yonelik sosyal muhendislik

---

## Guvenlik acigi bildirme sureci

Guvenlik acigi bulursaniz LUTFEN kamuya acik bir issue ACMAYIN. Bunun yerine:

1. GitHub'in ozel guvenlik bildirimi araciyla gonderin:
   https://github.com/karacaismail/actionplan/security/advisories/new
2. Alternatif olarak dogrudan e-posta: karacai@yandex.com
   Konu satirina `[SECURITY] actionplan` yazin.

Bildiriminizde su bilgileri ekleyin:
- Acigi tetikleyen adimlarin aciklamasi
- Beklenen ve gercek davranis
- Etki degerlendirmesi (veri sizintisi mi, kod calistirma mi, vb.)
- Varsa kavram kanitı (PoC) veya ekran goruntusu

---

## Yanit sureci

| Adim | Hedef sure |
|---|---|
| Bildirimin alindiginin onaylanmasi | 3 is gunu |
| On degerlendirme (kapsam ici mi?) | 7 is gunu |
| Yama ve kamuya aciklama | Ciddiyete gore 14-30 gun |

Koordineli ifsa: Yama hazir olmadan once acigi kamuya aciklamamanizi rica ederiz.
Sureye uyulmamasi durumunda 30 gun sonra ifsa edilmesi kabul edilir.

---

## Gizli veri ve secret yonetimi

Bu repo'daki kesin kurallar:

- Token'lar, API anahtarlari, sifre veya kimlik bilgileri ASLA repo'ya konmaz.
  Commit tarihine bile girmemeli; git log temizlemek zordur.
- CI/CD'de kullanilan sirlar (GitHub Pages deploy token vb.) yalnizca
  GitHub Actions "Secrets" arabiriminde saklanir.
- `GITHUB_TOKEN` varsayilan olarak workflow'larda mevcuttur; ek izinler
  `permissions:` bloguyla sinirlandirilir (deploy.yml'de uygulanmaktadir).
- `.env` dosyalari `.gitignore`'a eklenmeli; ornekler `.env.example`
  seklinde sahte degerlerle teslim edilir.
- `BASE_PATH` gibi ortam degiskenleri gizli degildir ve deploy.yml'e acikca yazilabilir.

Yanlislikla bir secret push'lanirsa:
1. Hemen GitHub'dan "Revoke" et.
2. `git filter-repo` veya BFG ile tarihten temizle.
3. Yeni bir secret uret ve Actions Secrets'a ekle.

---

## Bu politikanin guncellemesi

Politika degisiklikleri `docs/` veya `SECURITY.md` dosyasini etkileyen PR uzerinden
gerceklesir; CODEOWNERS kurali geregi `@karacaismail` incelemesi zorunludur.
