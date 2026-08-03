# User/Admin Decision Intake — 2026-08-03

- Tarih: 2026-08-03
- Durum: DIRECTIVE-ONLY; karar kaydı, uygulama değil
- Yetki: `USER_ADMIN_DIRECT`
- Yetki zinciri başı (kayıt anında): `AUTHORITY-SUPERSESSION-04` (seq 4)
- Kapsam: `GOVERNANCE_DECISION_ONLY`; `NO_RUNTIME_START`; `NO_PLATFORM_WRITE`
- Git executor: Codex
- Nihai karar mercii: Codex

Bu belge üç açık insan kararının User/Admin cevabını kaydeder. Hiçbir kararı
uygulamaz, hiçbir ledger satırını `applied` yapmaz, hiçbir kuyruğu, düğümü, kenarı
veya ADR kimliğini değiştirmez. Uygulama, kapsam kilidi, test ve Git teslimi Codex'tedir.

## Kapsam dışı (tüm kararlar için ortak)

- Runtime, platform veya kernel ürün kodu yazılmaz.
- `release`, `deploy`, `sdkReady`, `appBuildable` kapalı kalır.
- `RUNTIME_IMPLEMENTATION_START` bu belgeyle açılmaz.
- Mühürlü EPOCH-01..04 kayıtları, GATE-01 approval intake'i ve historical approval
  digest'i değişmez.
- `platformProductWriter` `human-developer-only` kalır.

---

## D06 — Queue Amendment

```
TOKEN: D06_QUEUE=INSERT_EARLY_DB_ITEM_AFTER_PR01
```

**Seçim.** Base kuyruğa PR-01'den hemen sonra yeni bir erken DB zemini kalemi eklenir.

**Kapsam.** Şema + `tenant_id` + zorunlu FORCE RLS (deny-by-default) + tek başlangıç
migration'ı + transaction sınırı. PR-02 kalıcı izolasyon kanıtı, PR-04 outbox ve PR-06
audit iddiaları bu kalemin üzerinde koşar. PR-07 doğrulanmış kalıcı öncülleri devralır.

**PR-08.** Yerinde kalır; tam Alembic policy, migration stratejisi ve rollback drill
sahibi olarak devam eder. Yeni kalem PR-08'in yerine geçmez, kapsamını devralmaz.

**Üretilecek kayıt.** `queuePatch` artık `null` değildir; `amendmentCreated=true`;
`baseSequenceLength` 11 → 12; `nextActionable` PR-01 olarak kalır.

**Kapsam dışı.** Şema, RLS policy veya migration yazılmaz. Bu bir sıralama kararıdır,
uygulama değil. Executor `human-developer-only` kalır. KGA-D10 tenancy enforcement
deferral'ı bu kalemle deşarj olmaz; yalnız hangi kuyruk kaleminin taşıyacağı netleşir.

---

## D08 — ADR Identity Resolution

```
TOKEN: D08_IDENTITY=CANONICAL_TOPIC_PLUS_RENUMBER
```

**Seçim.** Beş çakışan kimliğin her birinde bir konu kanonik kalır; ikinci (ADR-A5/0022
için üçüncü) konu boş bir `ADR-00XX` numarasına taşınır. Karantina kalkar.

**Kapsam.** `ADR-E1`, `ADR-M1`, `ADR-S1`, `ADR-X1`, `ADR-A5/ADR-0022`. Her kimlik tam
olarak tek konuya düşer; `machineConsumerUnblocked` `true` olur.

**Yöntem.** Kanonik konu, mevcut tüketici referans sayısı yüksek olan konudur; düşük olan
taşınır. Beraberlik hâlinde Codex gerekçesini yazıp seçer. 11 source binding ve 9 tüketici
referansı güncellenir. Taşınan her konu için supersession değil, yeni kimlik kaydı açılır.

**Kapsam dışı.** Harfli ADR şeması bütün olarak göç ettirilmez; yalnız çakışan beş kimlik
çözülür. Çakışmayan hiçbir ADR numarası değişmez.

---

## KGA-G05 — Unowned Kernel Directives

```
TOKEN: G05=REMAIN_OPEN_P0_DELIBERATE
```

**Seçim.** Açık bırakılır. Yedi directive sahipsiz kalmaya devam eder:

| Aday kimlik | Directive |
|---|---|
| `k-kms` | `docs/k-kms-directive.md` |
| `k-evidence-seal` | `docs/k-evidence-seal-directive.md` |
| `k-legal-hold` | `docs/k-legal-hold-retention-directive.md` |
| `k-migration-bridge` | `docs/k-migration-bridge-directive.md` |
| `k-obligation` | `docs/k-obligation-commitment-directive.md` |
| `k-provider-adapter` | `docs/k-provider-adapter-directive.md` |
| `k-signature-trust` | `docs/k-signature-trust-directive.md` |

**Durum.** KGA-G05 P0 open gap olarak kalır. Bu bilinçli bir User/Admin kararıdır,
çözülmemiş bir eksik değildir ve öyle raporlanmaz.

**Codex'e bağlayıcı.** Bu kalem yeniden karar kuyruğuna sokulmaz; yeni aday owner kimliği
önerilmez, düğüm yaratılmaz, mevcut modüle eşlenmez. KGA-D04 reddi yürürlüktedir. Sonraki
turlarda "G05 hâlâ açık" gerekçesiyle tekrar gündeme getirilmez.

**Kapsam dışı.** Yedi directive belgesi düzenlenmez; dangling referansları açık kalır ve
residual evidence olarak kayıtta durur.

---

## Önerilen uygulama sırası

1. **Öncelik 0 — kernel readiness artefaktının restamp'i.** `metaframer-kernel`
   içindeki `planning/kernel-ai-development-readiness.json` hâlâ `readinessStatus: BLOCKED`,
   `verdict: NO-GO`, `codeStartAllowed: false` taşıyor ve `promotionSelfHashRecorded: false`.
   `kernel-epoch-04-activation-2026-08-02.json` durumu bu yüzden
   `approved-activation-pending-verification`. İki repo şu anda çelişkili verdict taşıyor;
   D06 ve D08 bu kapanmadan uygulanırsa doğrulanmamış bir GO tabanına oturur.
2. **D06** — kuyruk değişikliği; runtime sırasını doğrudan etkileyen tek karar.
3. **D08** — ADR kimlik çözümü; makine tüketicilerini açar.
4. Kalan governance kalemleri: KGA-G04 kenar onarımı (8 kernel + 38 kernel-dışı),
   KGA-D02 kenar uygulaması deferral'ının kapatılması, KGA-D03 `capability-registry-contract`
   re-scope, KGA-D09 dangling referans envanteri, KGA-G02 doc-ref yerleşimleri,
   KGA-D10 tenancy enforcement bağlanması.
5. **EPOCH-05** — en son.

## Yetki istisnası kaydı

Bu dosya Codex tarafından değil, Claude worker tarafından yazılmış ve
`claude/kernel-development-plan-report-l83jyo` branch'ine push edilmiştir.
`AGENTS.md` §4.4 Git mutasyonunu yalnız Codex'e bırakır; bu tek seferlik istisna
User/Admin'in bu oturumdaki açık yetkisiyle yapılmıştır ve yalnız bu belgeyi kapsar.
Kanonik dosyalara, ledger'lara, raporlara, testlere ve `main` branch'ine dokunulmamıştır.
Belgenin kararlarını uygulama ve teslim yetkisi Codex'tedir.
