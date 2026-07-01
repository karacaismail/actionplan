# ADR-A3 — Mode-Profile: İş Modeli Runtime Bileşim Primitifi

**Durum:** Kilitli — 2026-07-01 (insan onayı: ismail)

## Bağlam

Bir tenant'ın iş modeli (B2C / B2B / C2C / D2C / B4B) çoğu üründe koda gömülü davranışlarla temsil edilir: `if b2b else` dalları, ayrı kod yolları, elle açılıp kapatılan modüller. Bu yaklaşım üç sorun doğurur. Birincisi, iş modeli değişimi bir kod dağıtımı gerektirir; oysa aynı tenant zamanla B2C'den B2B'ye geçebilmelidir. İkincisi, "tek tık serbest anahtar" ile mod değiştirmek, canlı sipariş ve faturaları bozma riski taşır — validasyon ve geri-alma (rollback) olmadan felaket üretir. Üçüncüsü, iş modeli çoğunlukla Editions (paketleme varyantı) ile karıştırılır; oysa Editions ticari bir ambalajdır, iş modeli ise runtime davranış bileşimidir. `plan-00 §4` (C6) beş primitifin kodda olmadığını; `plan-03 §3.3` ise Mode-Profile'ın iş modelini "aktif capability seti + fiyat/checkout/vergi/permission kararları" olarak modellemesi ve kontrollü geçiş (preview→validate→publish→rollback) sağlaması gerektiğini işaretler. Bu ADR, iş modelini veri-güdümlü, geri-alınabilir bir runtime bileşimi yapar.

## Karar

- **Mode-Profile primitifi tanımlanır.** İş modeli, aktif capability seti (ADR-A2) + fiyat/checkout/vergi/permission kararlarının *runtime bileşimi* olarak modellenir.
- **Kontrollü geçiş zorunludur:** `preview (dry-run) → validate → publish → rollback`. Geçiş capability bayraklarını değiştirir, **veriyi yıkmaz**.
- **Canlı-veri korunumu invariant'tır.** Mod geçişi canlı sipariş/fatura sayısını değiştiremez; bu bir test-zorunlu invariant'tır (geçiş öncesi = sonrası).
- **Sözleşme şekli (alanlar):**
  - `mode_profile`: `id`, `tenant_id`, `channel`, `model` (b2c | b2b | c2c | d2c | b4b | hybrid), `active_capabilities[]`, `pricing_policy_ref`, `checkout_policy_ref`, `tax_policy_ref`, `version`.
  - `mode_transition`: `from_profile`, `to_profile`, `dry_run_report`, `missing_fields[]`, `approved_by`, `applied_at`, `rollback_of`.
- **WBS yerleşimi:** Kernel primitifi. Yeni düğüm `k-mode`, seviye `module`, altında archetype. Bağımlılık (`dependsOn`): `k-capability`, `k-party`, `k-policy-pdp`.
- **Bağlama:** Runtime endpoint'leri (`/runtime/tenant-capabilities`, `/runtime/navigation`, `/runtime/forms/*`) mode'dan türer; surface config-driven okur — kodda `if b2b else` yasaktır.
- **AI guardrail:** AI mod geçişi öneremez/uygulayamaz publish için (`autonomy: none`); en fazla dry-run önerisi (`autonomy: draft`). İnsan onayı geçişin *içindedir*.

## Gerekçe

İş modelini runtime bileşimi yapmak, aynı tenant'ın kod dağıtımı olmadan B2C↔B2B geçebilmesini sağlar; bu `plan-01 §2` "her app sıfırdan mod modeli yazmaz" ilkesini karşılar. `preview→validate→publish→rollback` zinciri, "tek tık serbest anahtar"ın felaket riskini alır: dry-run eksik alanları raporlar, insan onaylar, publish uygular, gerekirse rollback önceki moda döner. Canlı-veri korunumunu invariant yapmak, en kritik riski (canlı sipariş/fatura bozulması) test kapısına bağlar — bayrak değil, ihlal edilemez kural. Runtime endpoint'lerinin mode'dan türemesi, surface'ta binlerce koşullu dalı ortadan kaldırır ve iş modeli değişiminin tek kaynaktan yayılmasını sağlar.

## Sonuçlar

Olumlu:
- Aynı tenant, kod dağıtımı olmadan iş modeli değiştirebilir; geçiş denetlenebilir ve geri-alınabilir.
- Canlı veri geçiş sırasında korunur; en yüksek risk test kapısıyla kapatılır.
- Surface config-driven olur; `if b2b else` dalları ortadan kalkar.

Olumsuz:
- Canlı sipariş/fatura varken geçiş, transaction + outbox + idempotency (scale-invariant) gerektirir; bu ek karmaşıklıktır (plan-01 D2 riski).
- Versiyonlu config ve rollback testi olmadan mod-anahtarı çalıştırılamaz; DoD bunu zorunlu kılar.
- Fiyat görünürlüğü PDP'ye bağlı olduğundan, PDP yavaşsa PLP (ürün liste) yavaşlar; karar-cache gerekir.

## Değerlendirilen alternatifler

- **Koda gömülü iş modeli (`if b2b else`).** Reddedildi: her değişim kod dağıtımı; surface koşullu dallarla şişer.
- **Editions/paketleme varyantı olarak modellemek.** Reddedildi: Editions ticari ambalajdır; runtime davranış bileşimi değildir.
- **Tek-tık serbest mod anahtarı (validasyon/rollback yok).** Reddedildi: canlı sipariş/fatura bütünlüğünü bozar; felaket üretir.
- **Mod geçişini manuel migration olarak yapmak.** Reddedildi: tekrarlanabilir, denetlenebilir, geri-alınabilir değildir; canlı-veri korunumunu garanti edemez.

## İlgili ADR / doküman

- `plan-03-yeni-yonergeler §3.3` (Mode-Profile yönergesi — içerik kaynağı)
- `plan-00-kontrol-sentez §4` (C6, C5 scale-invariant), `plan-01 D2` (Commerce B2C→B2B dikey dilimi)
- `core-contract-pack` v2 (Mode sözleşme taslağı)
- ADR-A2 (Capability — aktif set girdisi), ADR-A1 (Party — şirket cari hesabı), ADR-P1 (PDP — fiyat görünürlüğü kararı), `scale-invariant-directive` (geçişte outbox+idempotency)
- Sözleşme dokümanı: `mode-profile-contract.md` (üretilecek)
