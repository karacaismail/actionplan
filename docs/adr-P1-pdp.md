# ADR-P1 — PDP (Policy Decision Point): Merkezî Yetki-Karar Primitifi

**Durum:** Kilitli — 2026-07-01 (insan onayı: ismail)

## Bağlam

Bugün yetki kararı ("bu aktör bu kaynakta bu eylemi yapabilir mi?") tek bir ArcheType'a gömülü `accessPolicy` alanıyla veriliyor. Bu yerleşim üç sorun doğurur. Birincisi, yetki kararı çapraz-kesen bir sorumluluktur — her modül aynı soruyu sorar; onu tek ArcheType'a gömmek, kararı modüle hapseder ve tutarsız yetki mantığına yol açar. İkincisi, yetki (authorization) ile uygulama (enforcement) karıştırılır: PDP karar verir, PEP (endpoint/guard) uygular; ikisi aynı yerde olursa karar denetlenemez ve yeniden kullanılamaz. Üçüncüsü, yetki sık sık ECA/ruleset (otomasyon) ile karıştırılır; oysa ECA "event→action" (bir şey olunca ne yapılsın) otomasyondur, PDP ise "can X do Y" yetkidir — iki farklı eksen. `plan-00 §4` (C6) beş primitifin kodda olmadığını; `plan-03 §3.5` ise PDP'nin merkezî, policy-as-data ve karar-loglu bir yetki-karar noktası olması, `accessPolicy`'nin ArcheType'tan çıkarılıp çapraz-kesen yapılması gerektiğini işaretler. Bu ADR, yetki kararını tek, denetlenebilir bir primitife taşır.

## Karar

- **PDP (Policy Decision Point) primitifi tanımlanır.** "Bu aktör bu kaynakta bu eylemi yapabilir mi?" sorusuna tek yerden karar veren bileşen; policy-as-data (kural = veri).
- **Karar sözleşmesi:** `actor + action + resource + context → allow/deny + gerekçe + karar-logu`. RBAC/ABAC/ReBAC tek modelde birleşir; izin-simülasyonu ("şu kullanıcı şunu yapabilir mi?") sağlanır.
- **`accessPolicy` ArcheType'tan çıkarılır.** Bugün ArcheType'a gömülü olan `accessPolicy` çıkarılıp çapraz-kesen PDP'ye taşınır.
- **PEP değildir.** PDP *karar verir*; PEP (Policy Enforcement Point — endpoint/guard) *uygular*. İkisi ayrılır.
- **ECA/ruleset değildir.** ECA otomasyondur (event→action); PDP yetkidir (can X do Y). Ruleset (`ruleset.ts`) ile ayrı katmandır.
- **Sözleşme şekli (alanlar):**
  - `policy`: `id`, `effect` (allow | deny), `target` (actor-selector, action, resource-type), `condition` (attribute/relation ifadesi), `priority`, `layer` (system | platform | tenant).
  - `decision_log`: `request` (actor/action/resource/context), `decision`, `matched_policy_id`, `trace_id`, `ts`. Tamper-evident (hash-zinciri, `plan-01 D4` audit ile aynı).
- **WBS yerleşimi:** Kernel primitifi. Yeni düğüm `k-policy-pdp`, seviye `module`, altında archetype. Bağımlılık (`dependsOn`): `k-party`, `k-capability`, `k-authz`.
- **Bağlama:** Her modül karar için PDP'ye sorar; Party (rol) + Capability (yetenek) girdidir.
- **AI guardrail:** AI PDP policy'sini override/disable/bypass edemez (`autonomy: none`); yalnız öneri draft'ı. Karar-logu değiştirilemez.

## Gerekçe

Yetki kararını merkezîleştirmek, her modülün aynı soruyu tutarlı biçimde sormasını ve tek yerden denetlenmesini sağlar; ArcheType'a gömülü `accessPolicy` bunu imkânsızlaştırıyordu. Policy-as-data, kuralların kod dağıtımı olmadan güncellenmesini ve izin-simülasyonuyla test edilmesini mümkün kılar. PDP/PEP ayrımı, kararın (yeniden kullanılabilir, denetlenebilir) uygulamadan (endpoint-özgü) bağımsız olmasını sağlar. ECA'dan ayrı tutmak, otomasyon ile yetkinin farklı yaşam döngülerini ve farklı guardrail'lerini korur — birleşirlerse bir otomasyon kuralı yanlışlıkla yetki açabilir. Tamper-evident karar-logu, her yetki kararının değiştirilemez biçimde izlenmesini sağlar (uyum ve olay incelemesi için). Layer (system/platform/tenant) ve priority, çakışan policy'lerin belirlenimci çözümünü verir.

## Sonuçlar

Olumlu:
- Yetki kararı tek yerden, tutarlı ve denetlenebilir; tüm modüller aynı PDP'ye sorar.
- Policy-as-data + izin-simülasyonu, kural değişimini kod dağıtımından ayırır ve test edilebilir kılar.
- Tamper-evident karar-logu, her kararı değiştirilemez biçimde izler.

Olumsuz:
- PDP her istekte çağrılırsa gecikme artar; karar-cache + policy versiyonlama gerekir (p95 bütçesi).
- `accessPolicy`'yi ArcheType'tan çıkarmak, mevcut gömülü kuralların PDP policy'lerine taşınmasını (migration) gerektirir.
- Default-deny disiplini, eksik policy durumunda erişimi kapatır; bu güvenli ama başlangıçta fazladan policy tanımı gerektirir.

## Değerlendirilen alternatifler

- **`accessPolicy`'yi ArcheType'a gömülü bırakmak.** Reddedildi: çapraz-kesen kararı modüle hapseder; tutarsız yetki üretir.
- **PDP ile PEP'i birleştirmek.** Reddedildi: karar uygulamaya karışır; yeniden kullanılamaz ve denetlenemez olur.
- **Yetkiyi ECA/ruleset motoruyla vermek.** Reddedildi: ECA otomasyondur; yetki değildir. Karıştırmak bir otomasyon kuralının yanlışlıkla yetki açması riskini doğurur.
- **Salt RBAC (rol→izin) ile yetinmek.** Reddedildi: ABAC (attribute) ve ReBAC (relation) gerektiren senaryoları (bağlama duyarlı erişim) kapsayamaz.

## İlgili ADR / doküman

- `plan-03-yeni-yonergeler §3.5` (PDP yönergesi — içerik kaynağı)
- `plan-00-kontrol-sentez §4` (C6), `plan-01 D1` (PDP en son entegre; diğer 4 primitif onu çağırır), `D4` (tamper-evident audit)
- `core-contract-pack` v2 (PDP sözleşme taslağı), `ruleset.ts` (ECA — ayrı katman)
- ADR-A1 (Party — rol girdisi), ADR-A2 (Capability — yetenek girdisi), ADR-A3 (Mode-Profile — fiyat görünürlüğü kararı PDP'ye sorar)
- Sözleşme dokümanı: `pdp-policy-contract.md` (üretilecek)
