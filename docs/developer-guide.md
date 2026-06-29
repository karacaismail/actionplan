# Geliştirici Rehberi — actionplan

Bu rehber, actionplan'a bağlantı alan her geliştirici için tek kanonik başlangıç noktasıdır.
"Şimdi ne yapılır?" sorusunu adım adım yanıtlar.

---

## 1. Buradan Başla

actionplan, uygulama kodu içermeyen, frontend-only bir WBS (Work Breakdown Structure) planlayıcısıdır.
Görevi, "ne yapılacak"ın kaynak doğruluğunu ve kanıt deposunu tutmaktır.
Gerçek uygulama kodu burada değil, ayrı bir `platform` monoreposunda yaşar.
actionplan'daki her düğüm bir planlama nesnesidir; o düğüme karşılık gelen kodu platform monoreposunda yazarsın.

**Rolünü seç.** Hangi rolde olduğuna karar ver ve aşağıdaki ilgili bölüme git.

| Rol | Birincil odak |
|---|---|
| Platform geliştirici (core/altyapı) | Core Contract, platform fabrika, auth, DB katmanı |
| App-module geliştirici (dikey dilim) | Customer, OrderOps vb. uygulama modülleri |
| QA / Güvenlik inceleyici | Acceptance criteria doğrulama, CI kapı sonuçları, güvenlik sınırları |
| Product / PM | Mileston takibi, öncelik değerlendirmesi, faz kapısı onayı |
| AI ajan operatörü (Claude Code) | Developer Brief al, üret, PR aç; main'e doğrudan push etme |

Hangi rolde olursan ol, actionplan'ı tarayıcıda aç:
`https://karacaismail.github.io/actionplan/`

Derin link notu: /task/<id> URL'leri HTTP 404 kodu döndürür, ancak GitHub Pages'teki 404.html bir SPA olduğu için tarayıcıda doğru şekilde açılır. Crawler veya proxy araçlar bu linkleri kırık sayabilir. Güvenli başlangıç noktası daima köktür; uygulamadan Execution/Gantt/Tablo görünümüne geçerek istediğin göreve ulaş.

---

## 2. Görevini Bul

Rastgele bir WBS sayfasından başlama. Bağlamı anlamadan koda atlamak yanlış göreve çalışma riskini doğurur.

Doğru sıra şudur:

1. Execution veya Gantt görünümünü aç; aktif fazı gör.
2. Tablo görünümünde `implementationStatus: not-started` ve `readyForDev: true` filtresi uygula.
3. "Definition of Ready" kapısından geçmiş (ready-for-dev-gate yeşil) bir düğüm seç. Kapıdan geçmemiş görevi alma; eksik bilgiyle başlamak seni daha sonra engelleyecektir.
4. Düğümü aç, tüm alanları oku: `description`, `acceptanceCriteria`, `coreContractRef`, `traceability.repoPath`, `schedule`, `risks`.
5. Bir bağımlılık varsa (`dependencies` alanı) önce bağımlılığın tamamlandığını doğrula.

Kanonsel ilk dikey dilim Customer'dır: platform-customer-model, platform-customer-graphql, platform-customer-ui, platform-customer-seed sıralamasıyla ilerler. OrderOps ise build referans uygulamasıdır, canlı pilot değil; öğretici bir örnek olarak okunabilir.

---

## 3. Yürütme Döngüsü

Her görev için döngü aynıdır. Aktörler ve sorumluluklar netdir; atlanacak adım yoktur.

### Adım 1 — Hazır görevi al

Readiness kapısı yeşil olan bir görev seç (bkz. Adım 2). Görev JSON'unu indir ya da tarayıcıda aç; `coreContractRef` ve `acceptanceCriteria` alanlarını not al.

### Adım 2 — Developer Brief export

actionplan'daki "Developer Brief Export" özelliğini kullan. Bu export şunları içerir: görev açıklaması, acceptance criteria listesi, Core Contract referansı, test komutu şablonu, deploy hedefi, rollback talimatı. Brief'i düz metin veya JSON olarak çıkar.

### Adım 3 — AI ajana ver (Claude Code)

Brief'i platform monoreposunda Claude Code'a ver. Komut şablonu:

```
claude "Bu Developer Brief'e göre task/<task-id> için kod üret.
Core Contract: <coreContractRef>
Acceptance Criteria: <liste>
Kısıt: Test-önce çalış; her AC için önce kırmızı test, sonra geçer kod."
```

AI ajanı main'e doğrudan push etmez. Üretir, PR açar; karar insana aittir.

### Adım 4 — Test-önce kodla (Core Contract + AC odaklı)

Platform monoreposunda çalış. Her acceptance criterion için önce başarısız testi yaz, sonra geçer kodu üret. Bu ritüeli atlamak CI kapısında takılmanı sağlar.

Backend stack: FastAPI + Strawberry GraphQL + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL.
Frontend stack: React + Vite + TanStack Router + TanStack Query.
Bu stack'in dışına çıkma. Next.js ve Supabase yasaktır.

### Adım 5 — Uret / Eleştir / Islet ritueli (3'lu)

Her yeni modül veya kritik mantık bloğu için sırasıyla:

- Uret: AI ajanı kodu üretir; insan geliştiriciye sunar.
- Eleştir: insan geliştirici kodu okur, Core Contract ve güvenlik sınırlarıyla karşılaştırır, eksikleri listeler.
- Islet: AI ajanı eleştiriyi uygular; döngü, tüm AC'ler geçene kadar tekrar eder.

Bu ritüel, kalitesiz kodun PR'a ulaşmasını önler.

### Adım 6 — PR ac

Branch adı: `task/<task-id>-<slug>` (örnek: `task/PCT-042-customer-graphql-resolver`).

PR açıklaması zorunlu bölümler:

- Görev ID'si ve actionplan linki (kök + uygulama-içi navigasyon yolu)
- Acceptance Criteria eşleme tablosu (AC-1, AC-2 ... her biri "bu testfile:satir ile karşılandı" biçiminde)
- Risk ve rollback planı (tam olarak görev JSON'undaki `rollback` alanından kopyala)
- AI-üretim notu: hangi bölümlerin AI tarafından üretildiğini, insan incelemesinin kapsamını belirt

### Adım 7 — CI kapilari

Dört kapı yeşil olmalı: `check-content`, `quality-lint`, `check-data-quality`, `check-execution-readiness`.
Herhangi biri kırmızıysa merge edilmez. Kırmızı kapıyı geç; insan onayı beklemeden önce CI temiz olmalı.

### Adım 8 — Insan review ve merge

Bağımsız bir insan reviewcısı kodu inceler. AI ajanı review'u kendi kendine onaylayamaz. Onay sonrası insan main'e merge eder.

### Adım 9 — Deploy ve dogrulama

Merge sonrası deploy otomatik tetiklenir (GitHub Actions → GitHub Pages). Deploy tamamlandıktan sonra production URL'de kritik akışı manuel olarak doğrula.

### Adım 10 — Kaniti plana geri yaz

Deploy doğrulandıktan sonra actionplan'daki ilgili düğümü güncelle. Bu adım için evidence-update-runbook.md belgesini izle. Bu adımı atlamak görevin planlayıcıda "done" sayılmamasına yol açar.

---

## 4. Gun-1 — Ilk 90 Dakika

Platforma yeni katılan bir geliştirici için somut adımlar:

**0–15 dakika: Ortam hazırlığı**

```bash
# Platform monoreposunu klonla (platform repo URL'sini traceability.repoPath alanından al)
git clone <platform-monorepo-url>
cd platform

# Python ortamı (backend)
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Node ortamı (frontend)
cd apps/frontend && npm install

# Veritabanını kur (Docker ile)
docker compose up -d db
alembic upgrade head
```

**15–30 dakika: actionplan'da gorev sec**

actionplan'ı tarayıcıda aç: `https://karacaismail.github.io/actionplan/`
Tablo görünümünde `readyForDev: true` filtrele. Customer dikey diliminden en küçük tamamlanmamış görevi seç (genellikle platform-customer-model veya platform-customer-seed).
Görev JSON'unu oku; `acceptanceCriteria` listesini bir metin editörüne kopyala.

**30–60 dakika: Kirmizi test yaz**

Branch aç:
```bash
git checkout -b task/<task-id>-<slug>
```

Göreve karşılık gelen test dosyasını oluştur. Henüz kod yok, test kırmızı olmalı:
```bash
# Backend için
pytest tests/unit/test_<modül>.py -v
# Beklenen: FAILED (henüz kod yok)

# Frontend için
npm run test -- --run <ComponentAdi>.test.tsx
# Beklenen: FAILED
```

**60–90 dakika: Yesile getir, PR ac**

Minimum geçer kodu yaz; testleri yeşile getir. Fazla mühendislik yapma.
```bash
# Backend testleri yeşil mi?
pytest tests/unit/test_<modül>.py -v

# Frontend testleri yeşil mi?
npm run test -- --run <ComponentAdi>.test.tsx

# Commit
git add -A
git commit -m "task(<task-id>): <kisa aciklama> — AC-1,AC-2 gecti"
git push origin task/<task-id>-<slug>
```

PR aç; açıklama şablonunu doldur (bkz. Adım 6). CI kapılarını bekle.

---

## 5. Branch ve PR Kurallari

Branch adı formatı kesinlikle şudur: `task/<task-id>-<slug>`

Örnekler:
- `task/PCT-042-customer-graphql-resolver`
- `task/PCT-055-customer-ui-list-screen`
- `task/PCT-018-auth-rbac-permission-matrix`

Main'e doğrudan push yasaktır. Sadece CI kapıları yeşil + insan onayı sonrası merge edilir.

PR açıklamasında şu bilgiler zorunludur:

- Görev ID'si ve actionplan linki (kökten navigasyon ile ulaşma yolu)
- Acceptance Criteria tablosu: her AC için karşılık gelen test dosyası ve satır numarası
- Risk değerlendirmesi ve rollback talimatı (görev JSON'undan birebir)
- AI-üretim notu: AI'ın ürettiği bölümler ve insan inceleme kapsamı

---

## 6. Hangi Seviyede Kod Yazilir

actionplan'ın kendisinde kod değişikliği yapılmaz. actionplan yalnızca planlama verisini tutar.

Kod şu hiyerarşiye göre yazılır:

- Core katman (auth, DB, AppFactory, tenant izolasyonu): platform monoreposunun `core/` dizininde.
- Uygulama modülleri (Customer, OrderOps vb.): platform monoreposunun `apps/<app-slug>/` dizininde.
- Shared kütüphaneler (ortak tipler, schema araçları): platform monoreposunun `packages/` dizininde.

Hangi dosyanın nereye gittiği task-to-code-contract.md ve core-contract-pack.md belgelerinde tanımlanmıştır. Bu sözleşmeleri ihlal eden PR CI'da reddedilir.

---

## 7. Diger Belgelere Baglanti

Bu rehber, actionplan ekosisteminin genel bakışıdır. Ayrıntılar için:

| Belge | Amaç |
|---|---|
| `docs/task-to-code-contract.md` | Görev JSON alanı ile kod konumu / test türü eşlemesi |
| `docs/core-contract-pack.md` | Platform core katmanının mimari sözleşmesi |
| `docs/task-export-contract.md` | Developer Brief export JSON şeması |
| `docs/evidence-update-runbook.md` | PR merge sonrası kanıtı plana geri yazma ritüeli |
| `docs/ready-for-dev-gate.md` | Definition of Ready kapısı kriterleri |

---

## 8. Sikca Sorular

**actionplan'daki bir görevin kodunu bulamıyorum, nerede?**
Görev JSON'undaki `traceability.repoPath` alanına bak. Bu alan platform monoreposundaki yolu işaret eder.

**Bir kapı sürekli kırmızı; ne yapmalıyım?**
CI logunu oku, hangi kontrol başarısız olduğunu bul. `check-data-quality` genellikle eksik alan, `check-execution-readiness` genellikle eksik bağımlılık gösterir. Sorunu görev JSON'unda çöz, ardından tekrar dene.

**AI ajanı bir şeyi yanlış ürettiyse kim karar verir?**
İnsan geliştirici. AI ajanı öneri üretir, PR açar; karar her zaman insana aittir. "Eleştir" adımını geç, doğrulama satırlarını PR'a ekle.

**OrderOps'u canlı pilot olarak kullanabilir miyim?**
Hayır. OrderOps bir build referans uygulamasıdır; canlı pilot değildir. Öğretici referans örnek olarak incelenebilir.
