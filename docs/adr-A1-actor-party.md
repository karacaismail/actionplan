# ADR-A1 — Actor / Party: Polimorfik Aktör Primitifi

**Durum:** Kilitli — 2026-07-01 (insan onayı: ismail)

## Bağlam

Portföydeki uygulamalar bugün aynı kişi veya kurumu her modülde ayrı bir tablo olarak yeniden tanımlama eğilimindedir: Commerce "Customer" yazar, MRP "Supplier" yazar, HRMS "Employee" yazar. Oysa gerçek dünyada tek bir party (person ya da organization) bağlama göre birden çok rol taşır — aynı şirket bir kanalda alıcı (buyer), başka bir kanalda tedarikçi (supplier) olabilir; aynı kişi hem çalışan hem müşteri olabilir. Mevcut `l1-party` düğümü contact-yönetimi merkezliydi; kernel-seviyesi bir aktör modeli değildi. Rolün koda gömülü olması (örneğin ayrı tablolar ya da `if role == "buyer"` dalları) B2B/C2C mod geçişlerini, çok-taraflı ilişkileri ve rol geçmişi sorgularını imkânsızlaştırır. `plan-00 §4` (C6) beş primitifin kodda olmadığını; `plan-03 §3.1` ise Actor/Party'nin polimorfik ve kernel-seviyesi tanımlanması gerektiğini işaretler. Bu ADR, aktörü tek yerde tanımlayıp rolü *veri* yapan primitifi kilitler.

## Karar

- **Polimorfik Actor/Party kernel primitifi tanımlanır.** Bir party (person | organization) bir kez tanımlanır; buyer/seller/employee/supplier/agent rolleri *bağlam* (tenant/channel/app) filtresiyle çözülür. Rol koda gömülmez; rol veridir.
- **Sözleşme şekli (alanlar, kod değil):**
  - `party`: `id`, `type` (person | organization), `tenant_id`, çekirdek kimlik alanları, audit alanları.
  - `party_role`: `party_id`, `role` (buyer | seller | employee | supplier | agent | …), `context` (tenant/channel/app kapsamı), `valid_from`, `valid_to`, `status`. Temporal alanlar rol geçmişi içindir.
  - `party_relation`: `from_party`, `to_party`, `kind` (employs | owns | represents | …).
- **WBS yerleşimi:** Kernel primitifi (L0). `l1-party`'den **terfi** edilir: yeni düğüm `k-party`, seviye `module`, altında archetype. Bağımlılık (`dependsOn`): `k-schema`, `k-tenancy`.
- **ArcheType/Surface bağlama:** ArcheType'lar Customer/Supplier/Employee tablosu yazmaz; `party` + `party_role`'e referans verir. Surface aktörü role göre gösterir. PDP kararı party rolüne girdi olarak bakar.
- **AI guardrail:** AI party rol tanımı öneremez ve uygulayamaz doğrudan; `autonomy: draft` — insan onaylar.

## Gerekçe

Aktörü bir kez tanımlayıp rolü bağlamla çözmek, her uygulamanın sıfırdan kimlik modeli yazmasını önler ve `plan-01 §2` "kanıtlanmış primitifi tüket" ilkesini karşılar. Temporal `party_role`, rol geçmişini (kim ne zaman tedarikçiydi) denetlenebilir kılar — muhasebe ve uyum için gereklidir. Rolü veri yapmak, B2B↔B2C mod geçişini (ADR-A3) veri yıkmadan mümkün kılar; rol koda gömülü olsaydı her geçiş bir migration olurdu. Contact-yönetimini (`l1-party`) kernel aktöründen ayırmak, iki farklı sorumluluğun karışmasını engeller.

## Sonuçlar

Olumlu:
- Tek party tanımı; çok rol; her modül aynı aktöre referans verir.
- Rol geçmişi ve bağlam-çözümü denetlenebilir ve sorgulanabilir.
- Mod geçişi, capability ve PDP bu primitifi ortak girdi olarak kullanır.

Olumsuz:
- Polimorfizm çok esnek olursa sorgu performansı düşer; `party_role` indekslenmeli, sık sorgular materialize edilmeli (elestiri/plan-01 D1 riski).
- Contact-yönetiminden gelen mevcut veri, `k-party`'ye terfi sırasında taşınmalı (migration).
- Rol-bağlam matrisi karmaşıklaşırsa, bağlam kapsamı (tenant/channel/app) net kurallarla sınırlanmalı.

## Değerlendirilen alternatifler

- **Modül başına ayrı tablo (Customer/Supplier/Employee).** Reddedildi: aynı party tekrarlanır; çapraz-rol ve mod geçişi imkânsızlaşır.
- **Rolü enum sütunu olarak party'ye gömmek (tek rol).** Reddedildi: bir party'nin aynı anda çok rol taşımasını ve rol geçmişini engeller.
- **`l1-party` contact modelini kernel aktörü saymak.** Reddedildi: contact-yönetimi ile kernel-seviyesi aktör farklı sorumluluklardır.
- **Rolü tamamen PDP policy'sine devretmek.** Reddedildi: PDP yetki kararı verir; aktör kimliği ve rol verisi ayrı bir primitiftir (PDP ona *bakar*).

## İlgili ADR / doküman

- `plan-03-yeni-yonergeler §3.1` (Actor/Party yönergesi — içerik kaynağı)
- `plan-00-kontrol-sentez §4` (C6), `plan-01 §2, D1`
- `core-contract-pack` v2 (Actor sözleşme taslağı)
- ADR-A2 (Capability — party'ye entitlement bağlar), ADR-A3 (Mode-Profile — party'yi tüketir), ADR-P1 (PDP — party rolüne bakar)
- Sözleşme dokümanı: `actor-party-contract.md` (üretilecek)
