# Dosya 2 — Numeronym Standart İnsan Geliştirici Checklist'i

> **ARCHIVED-HUMAN-HANDOFF** — eski çalıştırılabilir prompt kataloğunun güvenli özeti.
> Yetki zinciri: `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM ardıl koordinasyon yetkilisidir. AI erişimi
> `read-only-audit`, platform yürütücüsü `human-developer-only`dır.

**Tarih:** 2026-07-01
**Statü:** Tarihsel sınıflandırma girdisi; model/provider komutu veya uygulama izni değildir.

Bu belge numeronym ve kısaltmaların repo taksonomisindeki yerini korur. Eski model promptları
çıkarılmıştır. Değişiklik gerektiğinde Codex kapsamı belirler, PM evidence zarfını koordine eder
ve insan geliştirici test-first uygular.

## 1. Sınıflandırma ilkesi

İş modeli, mühendislik standardı ve araç aynı sınıf değildir:

- i18n/a11y/o11y gibi kavramlar sistem standardı olabilir;
- B2B/B2C/C2C/B2G/M2M/S2S/D2D birer Mode-Profile/capability girdisidir;
- CRUD/REST/RPC/gRPC/SDK/CLI/TUI API stili veya araçtır;
- CMS/CRM/ERP/ETL/ELT/BI/OLAP/OLTP domain ya da ürün kavramıdır.

Yeni kayıtlar mevcut `family`, `severity`, WBS seviye/yüzey ve applicability şemasına uyar;
paralel taksonomi kurulmaz.

## 2. Tarihsel kapsama haritası

| Grup | 2026-07-01 gözlemi | Güncel doğrulama kaynağı |
|---|---|---|
| i18n, l10n, t9n | mevcut standardın parçası | `src/data/standards/i18n.json` ve ilgili CI kapısı |
| a11y | WCAG boyutu içinde | WCAG sözleşmesi, axe ve klavye testleri |
| o11y | observability ailesinde | metrics/log/trace sözleşmeleri |
| API, GraphQL, GUI | data/API/UI sözleşmelerinde | `standardRefs` ve tech profile kapıları |
| AuthN/AuthZ/RBAC/ABAC | security boyutunda | deny-by-default ve tenant negatif testleri |
| g11n, c12n, c13n, i14y, p13n | tarihsel gap adayı | kanonik JSON kaydı ve applicability kanıtı |
| n6n, d10n, v12n | tarihsel gap adayı | veri/deploy sözleşmeleri ve testler |
| SSO, MFA, E2EE, IaC | tarihsel gap adayı | security/deployment kanonik kaynakları |
| CDN, DNS, WAF, DDoS | kısmi/yatay kapsam | edge/security kaynakları |

Tablodaki "gap adayı" ifadesi bugün eksik olduğu anlamına gelmez. Güncel repo taraması,
makine-okunur standard kaydı ve test sonucu olmadan kapsam kararı verilmez.

## 3. İnsan geliştirici doğrulama checklist'i

### A. Sınıflandırma

- Her kavramın standart, capability, araç veya domain olduğunu açıkça işaretle.
- Mevcut standardı tekrar üretme; kanonik kaynağa referans ver.
- `family`, `severity`, applicability ve WBS kapsamını şemaya göre doğrula.
- B2B/B2C türlerini standard değil Mode-Profile/capability olarak tut.

### B. Repo denetimi

- Her iddiayı gerçek dosya, JSON kaydı veya test çıktısıyla destekle.
- Kanıt bulunamazsa `not found` yaz; tahminle green verme.
- Anlatı belgesi, JSON sözleşmesi, generated node ve live publication katmanlarını ayrı denetle.
- Var olan CI kapısının gerçekten workflow'da bloklayıcı olduğunu doğrula.

### C. Sözleşme değişikliği

- Önce kırmızı schema/coverage/applicability testi ekle.
- Kanonik standard JSON'unu ve yalnız gerekli referansları güncelle.
- Doküman metnini görev içeriğine kopyalama; `standardRefs` ile bağla.
- UI etkisinde Storybook, a11y, i18n ve tech-profile kapılarını birlikte değerlendir.
- Ürün/platform kodunu yalnız insan geliştirici implementation reposunda değiştirir.

### D. Doğrulama ve evidence

- typecheck, lint, standard coverage, applicability, waiver ve data-integrity kapılarını çalıştır.
- `gen:reindex` ve materyalizasyon ikinci koşumda byte-stable olmalı.
- PR URL, CI run URL, test logu, rollback ve manual review kanıtı olmadan `done` yazma.

## 4. Kabul ölçütleri

1. Aynı kavram iki farklı standard kaynağında kanonik sahiplik iddia etmez.
2. Standard olmayan araç/domain girdileri `standardRefs` alanına zorla sokulmaz.
3. Yeni standard id'si schema, registry, applicability ve en az bir negatif test tarafından tanınır.
4. Generated/public JSON, kanonik kaynakla semantik parity taşır.
5. Platform değişikliği AI tarafından yapılmaz; AI yalnız `read-only-audit` bulgusu verir.

## 5. Fail-closed sınırlar

- Bu dosya herhangi bir modele veya provider'a gönderilecek yürütme girdisi değildir.
- Claude yalnız Codex'in sınırlı worker çağrısında ara çıktı verir.
- PM, uzmanlar ve Claude branch, commit, PR, migration veya platform kodu yazamaz.
- Yetki veya kanıt belirsizse uygulama durur ve kapsam Codex tarafından daraltılır.
