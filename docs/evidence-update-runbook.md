# Kanıt Güncelleme Runbook — evidence-update-runbook

Bu runbook, bir geliştirme görevi tamamlandıktan sonra kanıtın actionplan'a geri yazılması için izlenecek tek kanonik prosedürdür.
actionplan'daki "Done Evidence" kapısı, bu runbook tamamlanmadan bir görevi "done" saymaz.

---

## Ne Zaman Uygulanır

Bu runbook yalnızca şu iki koşul birlikte karşılandıktan sonra başlatılır:

1. PR main branch'e merge edildi.
2. Deploy doğrulandı: production URL'de kritik akış elle test edildi ve çalışıyor.

Merge sonrası ancak deploy öncesi bu runbook'u başlatma. Deploy doğrulanmadan yazılan kanıt, gerçeği yansıtmaz.

---

## Kim Yapar

Birincil sorumlu: görevi yürüten insan geliştirici.

AI ajan yardımı: AI ajan (Claude Code) kanıt taslağını hazırlayabilir ve JSON patch'i önerebilir. Ancak actionplan'a yazmadan önce insan geliştirici taslağı incelemelidir. AI ajan, insan onayı olmadan düğümü güncelleyemez.

---

## Ne Yazilir

actionplan'daki ilgili düğüm JSON'una aşağıdaki alanlar eklenir veya güncellenir.

### refs (Referanslar)

PR URL'si, merge commit hash'i ve CI çalıştırma ID'si buraya yazılır. Test sonuç raporunun URL'si varsa o da eklenir.

```json
"refs": {
  "pr": "https://github.com/<org>/<platform-repo>/pull/<pr-number>",
  "commit": "<merge-commit-sha-tam>",
  "ciRun": "https://github.com/<org>/<platform-repo>/actions/runs/<run-id>",
  "testReport": "https://github.com/<org>/<platform-repo>/actions/runs/<run-id>#artifacts"
}
```

### evidence (Kanıt)

CI kapılarının geçip geçmediği ve her acceptance criterion'un karşılanıp karşılanmadığı burada belgelenir. Rollback'in test edilip edilmediği de bu alana girer.

```json
"evidence": {
  "ciPassed": true,
  "acceptanceCriteria": {
    "AC-1": "gecti — test: tests/unit/test_customer_graphql.py::test_customer_list_returns_paginated",
    "AC-2": "gecti — test: tests/unit/test_customer_graphql.py::test_tenant_isolation_enforced",
    "AC-3": "gecti — test: tests/integration/test_customer_create.py::test_idempotency_key_dedup"
  },
  "rollbackTested": true,
  "rollbackNote": "Alembic downgrade head-1 calistirildi; tablo kaldirildi, veri kaybi gozlemlenmedi."
}
```

AC sayısı göreve göre değişir. Her AC için test dosyası ve fonksiyon adını yaz; "geçti" demek yeterli değildir.

### traceability (Izlenebilirlik)

Kodun platform monoreposundaki konumu, test komutu ve deploy hedefi buraya yazılır.

```json
"traceability": {
  "repoPath": "apps/customer/src/graphql/resolvers/customer_resolver.py",
  "testCommand": "pytest tests/unit/test_customer_graphql.py tests/integration/test_customer_create.py -v",
  "deployTarget": "https://karacaismail.github.io/actionplan/ (GitHub Pages, main branch)"
}
```

`repoPath`, platform monoreposundaki birincil uygulama dosyasını göstermelidir. Birden fazla dosya etkilendiyse en önemli olanı yaz; diğerlerini `evidence` notuna ekle.

### implementationStatus (Durum geçisi)

Görev, bu runbook tamamlanmadan "verified" sayılmaz.

```json
"implementationStatus": "verified"
```

Geçerli değerler ve sırası: `not-started` → `in-progress` → `implemented` → `verified`.
"implemented" durumu "kod merge edildi ama kanıt yazılmadı" anlamına gelir; kapı bu durumu "done" saymaz.
"verified" durumu yalnızca deploy doğrulama + kanıt yazma tamamlandıktan sonra kullanılır.

### schedule (Zamanlama gerceklesmeleri)

Planlanan tarihlerle gerçekleşen tarihleri karşılaştırmak için bu alanı güncelle.

```json
"schedule": {
  "actualStart": "2026-06-25",
  "actualEnd": "2026-06-29"
}
```

Tarih formatı ISO 8601 (YYYY-MM-DD). `actualEnd`, deploy doğrulamasının yapıldığı tarihtir; merge tarihi değil.

### Faz kapisi notlari (fazaGateNote)

Görev bir faz kapısının son adımıysa veya kapıya ilişkin gözlem varsa buraya yaz.

```json
"fazaGateNote": "Customer dikey dilimi MVP kapisi: platform-customer-model, -graphql, -ui, -seed hepsi verified; faz kapisi gozden gecirilmeye hazir."
```

Bu alan isteğe bağlıdır; faz kapısıyla ilgisi olmayan görevler için boş bırakılabilir.

---

## Nasil Yazilir

actionplan frontend-only bir uygulamadır; doğrudan bir API endpoint'i sunmaz. Kanıt güncellemesi şu şekilde yapılır:

1. actionplan reposunu yerel makinene klonla (veya mevcut klonda çalış).
2. `public/data/` dizinindeki ilgili düğüm JSON dosyasını bul (dosya adı genellikle düğüm ID'siyle eşleşir).
3. Yukarıdaki alanları JSON'a ekle veya güncelle. JSON sözdizimi hatasına dikkat et; bir validator kullan.
4. Bir feature branch ac: `docs/evidence-<task-id>`.
5. Commit ve PR ac. PR açıklamasına hangi düğümün güncellendiğini yaz.
6. CI kapıları yeşil olduğunda insan onayı al; main'e merge et.

Önemli kısıt: "GitHub'a Kaydet" özelliği (uygulamada mevcutsa) feature branch'e yazar; doğrudan main'e yazmaz. Main'e doğrudan push yasaktır.

Yedek yöntem (uygulama özelliği çalışmıyorsa): düğüm JSON'unu elle düzenle, yukarıdaki branch/PR sürecini izle.

---

## Ornek — Tam JSON Patch

Aşağıda `platform-customer-graphql` düğümü için hazırlanmış tam bir örnek yer almaktadır.

```json
{
  "id": "platform-customer-graphql",
  "refs": {
    "pr": "https://github.com/org/platform/pull/47",
    "commit": "a3f9c2d1b8e4f0123456789abcdef0123456789a",
    "ciRun": "https://github.com/org/platform/actions/runs/11234567890",
    "testReport": "https://github.com/org/platform/actions/runs/11234567890#artifacts"
  },
  "evidence": {
    "ciPassed": true,
    "acceptanceCriteria": {
      "AC-1": "gecti — CustomerList sorgusu tenant_id filtresi ile 200 ok ve dogru sayfalama doner; test: tests/unit/test_customer_graphql.py::test_customer_list_tenant_filter",
      "AC-2": "gecti — Farkli tenant_id ile istek FORBIDDEN hatasi alir; test: tests/unit/test_customer_graphql.py::test_customer_list_cross_tenant_forbidden",
      "AC-3": "gecti — createCustomer idempotency-key ile cift kayit olusturmuyor; test: tests/integration/test_customer_create.py::test_idempotency_key_dedup",
      "AC-4": "gecti — updateCustomer yalnizca degisen alanlari yazar, updatedAt damgasi guncellenir; test: tests/unit/test_customer_graphql.py::test_update_customer_partial_patch"
    },
    "rollbackTested": true,
    "rollbackNote": "Alembic downgrade head-1 calistirildi; customers tablosu kaldirildi. Re-upgrade sonrasi tum testler tekrar gecti."
  },
  "traceability": {
    "repoPath": "apps/customer/src/graphql/resolvers/customer_resolver.py",
    "testCommand": "pytest tests/unit/test_customer_graphql.py tests/integration/test_customer_create.py -v --tb=short",
    "deployTarget": "GitHub Pages — https://karacaismail.github.io/actionplan/ (main branch, otomatik deploy)"
  },
  "implementationStatus": "verified",
  "schedule": {
    "actualStart": "2026-06-25",
    "actualEnd": "2026-06-29"
  }
}
```

---

## Kontrol Listesi

Bu listeyi PR'dan önce tek tek isaretle.

- [ ] PR merge edildi ve main'dedir.
- [ ] GitHub Actions deploy workflow'u hatasiz tamamlandi.
- [ ] Production URL'de kritik akis elle test edildi; calisir durumda.
- [ ] refs alanina PR URL, commit SHA ve CI run ID yazildi.
- [ ] evidence altinda her AC icin test dosyasi ve fonksiyon adi belirtildi.
- [ ] rollbackTested: true; rollback adimi not edildi.
- [ ] traceability.repoPath, testCommand ve deployTarget doldu.
- [ ] implementationStatus: verified olarak guncellendi.
- [ ] schedule.actualStart ve schedule.actualEnd gercek tarihlerle doldu.
- [ ] Faz kapisi ilgiliyse fazaGateNote eklendi.
- [ ] Degisiklik feature branch uzerinde, main'e dogrudan push yapilmadi.
- [ ] CI kapilari (check-content, quality-lint, check-data-quality, check-execution-readiness) yesildir.
- [ ] Insan onaylanmis; feature branch main'e merge edilmistir.

---

## Sikca Yapilan Hatalar

**Hata: "implemented" durumunda birakma**
"implemented" yeterli değildir. Done Evidence kapısı "verified" ister. Deploy doğrulanmadan durumu "verified" yapma; yapılırsa gerçeği yansıtmaz.

**Hata: AC geçişini "geçti" yazıp test referansı vermemek**
"geçti" yazmak yeterli değil. Test dosyası ve fonksiyon adı olmadan kanıt doğrulanamaz. Her AC için tam test referansı zorunludur.

**Hata: rollbackTested: false bırakma**
Rollback test edilmeden görev verified sayılmaz. Alembic downgrade veya feature flag kapatma gibi rollback adımını her görev için test et.

**Hata: main'e doğrudan JSON güncellemesi push etme**
actionplan'da da branch/PR kuralı geçerlidir. Main'e doğrudan push yasaktır; feature branch ac, PR aç, CI temizle, onay al.
