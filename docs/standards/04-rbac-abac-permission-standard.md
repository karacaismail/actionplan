# 04 — RBAC / ABAC / Permission Standardı (Yetkilendirme Yüzeyi)

Sürüm: 1.0 — 2026-07-01
Aile (`family`): engineering · Öncelik: P0 (RBAC/AuthZ) + P1 (ABAC/ReBAC)
Makine kontratı: RBAC/ABAC/ReBAC yetki *kararı* ayrı bir standart JSON değildir; tek doğruluk kaynağı PDP primitifidir — `docs/pdp-policy-contract.md` (`k-policy-pdp`). Bu anlatı, yetki-yüzeyinin (route guard, `@RequirePermission`, permission-aware rendering) PDP'ye *nasıl bağlandığını* anlatır; policy engine'i yeniden yazmaz.
Referans (mevcut kaynaklar): `docs/enterprise-dod.md §2.2` (RBAC/ABAC DoD), `src/schemas/task.ts` `dimensions.security` (RBAC/ReBAC/ABAC deklaratif alan), `docs/standards/03-authn-authz-iam-standard.md` (kimlik girdisi), WBS 13.5 `s-iam`.
Stack: FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL (BE); Vite + React + TanStack (FE). YASAK: Next.js, Supabase, Prisma.

---

## 1. Amaç ve En Kritik Ayrım — Karar PDP'de, Uygulama Burada

Bu standart yetkilendirmenin *yüzeyini* (nerede sorulur, nasıl uygulanır, nasıl render edilir) tanımlar; yetki *kararını* (`allow/deny`) **vermez**. Karar tek merkezden, PDP primitifinden (`docs/pdp-policy-contract.md`) gelir. Bu ayrım normatiftir ve ihlali anti-pattern'dir (§9): route guard, API dependency ve frontend hiçbir yerde kendi başına "bu kullanıcı yetkili mi?" hesaplamaz — hepsi PDP'ye sorar (`evaluate` / `evaluate_batch`).

RBAC (rol-bazlı), ABAC (öznitelik-bazlı) ve ReBAC (ilişki-bazlı) üç ayrı yetki *modeli* değil, PDP'nin tek hybrid değerlendirme modelinde birleşen üç *girdi eksenidir* (`pdp-policy-contract §4`). Bu doküman bu üç ekseni yüzey seviyesinde (role group tanımı, attribute beslemesi, ilişki grafiği) hangi disiplinle beslediğimizi tanımlar; kararın kendisini PDP çözer.

## 2. RBAC — Rol ve Rol Grubu Disiplini

RBAC ekseni, aktörün rolünü ve rol gruplarını yönetir; bu roller PDP `target_actor` seçicisine girdi olur.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| rbac-role-as-data | Roller ve rol→izin ilişkisi veri olarak (`roles`, `role_permissions` tablosu) saklanır, koda gömülmez. Yeni rol eklemek kod değişikliği gerektirmez. | must | integration (rol çözümü doğru izin seti) |
| rbac-role-group | Roller hiyerarşik gruplanabilir (role group / rol devralma); bir grup üyesi grubun izinlerini devralır. Devralma grafiği döngüsüzdür (DAG). | should | unit (devralma + döngü yok) |
| rbac-least-privilege | Varsayılan hiçbir izin yoktur (default-deny, PDP §7); rol açıkça izin vermedikçe eylem reddedilir. Geniş "superadmin bypass" yerine açık izinler tanımlanır. | must | integration (izinsiz rol → deny) |
| rbac-tenant-scoped-role | Rol atamaları tenant-scoped'tur; bir tenant'taki rol başka tenant'ta geçerli değildir. Rol Party'ye (`k-party` `party_role`) bağlanır. | must | integration (çapraz-tenant rol → deny) |

## 3. ABAC — Öznitelik-Bazlı Koşullar

ABAC ekseni, kararı özniteliklerle (aktör/kaynak/ortam attribute) koşullandırır; bu öznitelikler PDP `condition` değerlendiricisine beslenir.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| abac-attribute-feed | Aktör (departman, kıdem), kaynak (sahip, sınıflandırma, tenant) ve ortam (zaman, IP-aralığı) öznitelikleri request-context'e toplanır ve PDP'ye girdi verilir. Öznitelik toplama yüzeyin işi; koşul değerlendirmesi PDP'nin. | should | integration (attribute değişimi kararı değiştirir) |
| abac-structured-condition | ABAC koşulları yapısal ifadedir (attr/op/value), serbest kod/eval değildir. Koşul PDP `policy.condition` alanında yaşar; yüzey yalnız gerekli attribute'ları sağlar. | must | review (yapısal koşul, eval yok) |
| abac-resource-attribute | Kaynak öznitelikleri (ör. `owner_id`, `classification`) karar anında değerlendirilir; sahiplik/sınıflandırma değişince yetki sonucu değişir. | should | integration (owner değişimi → karar değişir) |

## 4. ReBAC — İlişki-Bazlı Yetki

ReBAC ekseni, kaynağa yetkiyi aktör-kaynak ilişkisinden türetir; ilişki grafiği PDP'ye girdi olur.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| rebac-relation-graph | Yetki, aktör ile kaynak arasındaki ilişkiden (owner/member/manager-of) türetilebilir; ilişki grafiği (`party_relation` + kaynak-ilişki) PDP'ye girdi verilir. İlişki değerlendirmesi PDP'nin. | should | integration (ilişki → yetki) |
| rebac-transitive-bound | Geçişli ilişki (ör. "yöneticinin yöneticisi") derinlik-sınırlıdır; sınırsız geçiş yasaktır (performans + doğruluk). Sınır config'ten okunur. | may | unit (derinlik sınırı) |

## 5. Yetki Uygulama Yüzeyi — Route Guard ve `@RequirePermission`

Yüzey, PDP kararını FastAPI ve router katmanında *uygular* (PEP rolü); bu bölüm enforcement noktalarını tanımlar.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| authz-require-permission | Her korunması gereken endpoint `Depends(require(action, resource))` (yani `@RequirePermission`) taşır; bu dependency PDP'yi çağırır ve `deny` ise 403 döner. Korumasız yazma endpoint'i yasaktır. | must | integration (yetkisiz → 403) |
| authz-pep-not-pdp | Route guard/dependency yalnız *uygular* (PEP); karar mantığı içermez, PDP `evaluate` sonucunu 200/403'e çevirir. Guard içinde `if role ==` yazmak yasaktır. | must | review (guard karar üretmiyor) |
| authz-mutation-reverify | Her mutasyon (state değiştiren istek) yetkiyi backend'de yeniden doğrular; frontend'in gizlemesine güvenilmez. Salt-okuma da PDP'ye sorulur (görünürlük kararı). | must | e2e (UI gizli + API 403) |
| authz-deny-audit | `deny` kararları (ve kritik `allow`'lar) PDP `decision_log`'una yazılır; yetkisiz erişim denemesi izlenebilir (`obs-audit-events` ile hizalı). | must | audit (deny loglanır) |

## 6. Admin Permission Matrix

Admin yüzeyi, rol×eylem matrisini ve izin simülasyonunu insan-okur biçimde sunar; bu bölüm yönetim ekranını tanımlar.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| admin-permission-matrix | Yönetici için rol×kaynak×eylem matrisi görüntülenir; hangi rolün hangi eylemi yapabildiği PDP `evaluate_batch` ile çözülüp gösterilir (matris koda gömülmez, PDP'den türetilir). | should | integration (matris PDP'den türer) |
| admin-permission-sim | "Şu kullanıcı şu kaynakta şunu yapabilir mi?" simülasyonu yan-etkisizdir (PDP dry-run, `pdp-policy-contract §8`); üretim state'ini değiştirmez ve kararın hangi policy/katmandan geldiğini gösterir. | should | integration (simülasyon = gerçek karar, yan-etkisiz) |
| admin-role-edit-guarded | Rol/izin düzenleme yetkisi de PDP ile korunur (yetkiyi yönetme yetkisi); AI rol/policy değiştiremez (`pdp-policy-contract §10`, `autonomy: none`), yalnız draft önerir. | must | integration + review |

## 7. Permission-Aware Rendering (Frontend)

Frontend, aktörün yapamayacağı eylemi göstermez ama yetkiyi *hesaplamaz*; bu bölüm yansıtma disiplinini tanımlar.

| Kural ID | Kural (şu şekilde uygulanır) | severity | Doğrulama (check) |
|---|---|---|---|
| render-reflect-not-compute | UI, sayfa açılışında `evaluate_batch` ile toplu karar alır (N+1 önler), TanStack Query ile cache'ler ve butonu/alanı buna göre gizler/disabled yapar. Frontend token/rol'e bakıp yetki *hesaplamaz*, backend kararını *yansıtır*. | must | e2e (yetkisiz aksiyon UI'da yok) |
| render-not-security | Frontend gizleme güvenlik değildir — gizli aksiyon yine de API'da PEP tarafından reddedilir. Optimistic gizleme yalnız UX; enforcement backend'de. | must | e2e (UI gizli + API 403 birlikte) |
| render-ai-draft-badge | AI önerileri (varsa) "draft" rozetiyle ayrışır ve yürürlükte değildir; kullanıcı gerçek yetkiyi PDP'den görür. | may | review |

## 8. Test Stratejisi

Yetki yüzeyi beş test sınıfıyla doğrulanır; her sınıf PDP'ye doğru delegasyonu kanıtlar.

1. **RBAC çözümü:** Rol doğru izin setini verir; least-privilege ile izinsiz rol reddedilir; çapraz-tenant rol geçersizdir.
2. **ABAC/ReBAC:** Öznitelik/ilişki değişimi karar sonucunu değiştirir (PDP'ye doğru beslendiği kanıtlanır).
3. **PEP enforcement:** Yetkisiz istek 403; `@RequirePermission` olmayan yazma endpoint'i yok; guard karar üretmiyor (PDP çağırıyor).
4. **UI + API tutarlılığı:** Yetkisiz kullanıcı aksiyonu UI'da göremiyor VE API'da 403 alıyor (frontend gizleme = güvenlik değil, birlikte kanıt).
5. **Admin matris + simülasyon:** Matris PDP'den türer; simülasyon yan-etkisiz gerçek kararı verir; AI policy değiştiremez.

## 9. Anti-Patterns (Kaçınılacaklar)

- **Yüzeyde yetki hesaplamak:** Route guard/frontend'de `if role == admin` ile karar üretmek. → Karar PDP'de; yüzey `evaluate` sorar ve uygular.
- **Client-side yetki güvenlik sanmak:** Butonu gizleyip mutasyonu backend'de doğrulamamak. → PEP her mutasyonu PDP ile yeniden doğrular.
- **Policy engine'i yeniden yazmak:** Bu standartta RBAC/ABAC değerlendirme motoru kurmak. → Tek doğruluk kaynağı PDP; bu doküman yalnız yüzeyi bağlar.
- **Superadmin bypass:** Rol kontrolünü atlayan geniş kaçış. → default-deny + açık izinler.
- **Korumasız yazma endpoint'i:** `@RequirePermission` olmadan state değiştirmek. → Her yazma PEP'li.
- **Matrisi koda gömmek:** Rol×eylem matrisini statik yazmak. → Matris PDP `evaluate_batch`'ten türer.
- **AI'a policy yazdırmak:** AI önerisini otomatik yürürlüğe koymak. → `autonomy: none`, draft + insan onayı.

## 10. Definition of Done (DoD)

- RBAC (role group, least-privilege, tenant-scoped) + ABAC (attribute feed) + ReBAC (relation graph) yüzeyi PDP'ye doğru besleniyor; karar PDP'de.
- Her korunan endpoint `@RequirePermission` (`Depends(require(...))`) taşıyor; guard PEP-rolünde, karar üretmiyor.
- Permission-aware rendering `evaluate_batch` ile toplu çözülüyor; frontend gizleme + backend 403 birlikte kanıtlı.
- Admin permission matrix + yan-etkisiz simülasyon PDP'den türüyor; AI policy değiştiremiyor (`autonomy: none`).
- `deny` kararları `decision_log`'a yazılıyor (`obs-audit-events` hizalı).
- 5 test sınıfı yeşil; `check-standards-coverage` yeşil; anti-pattern review yeşil.

## 11. Requirement-ID Tablosu

İzlenebilirlik için her normatif gereksinim tekil ID taşır; test ve PR'lar bunları referanslar.

| ID | Requirement | Layer | Priority | TestType | AC (Acceptance Criteria) | Owner |
|---|---|---|---|---|---|---|
| PERM-R01 | Roller ve rol→izin veri olarak saklanır (koda gömülmez) | backend | P0 | integration | Yeni rol kodsuz eklenir; çözüm doğru | IAM ekibi |
| PERM-R02 | Role group / rol devralma DAG (döngüsüz) | backend | P1 | unit | Devralma doğru; döngü yakalanır | IAM ekibi |
| PERM-R03 | Least-privilege default-deny; superadmin bypass yok | backend | P0 | integration | İzinsiz rol → deny | IAM ekibi |
| PERM-R04 | Rol atamaları tenant-scoped | backend | P0 | integration | Çapraz-tenant rol geçersiz | IAM ekibi |
| PERM-R05 | ABAC attribute request-context'e toplanıp PDP'ye beslenir | backend | P1 | integration | Attribute değişimi kararı değiştirir | IAM ekibi |
| PERM-R06 | ABAC koşulu yapısal (attr/op/value), eval yok | backend | P1 | review | Serbest kod/eval yok | IAM ekibi |
| PERM-R07 | ReBAC ilişki grafiği PDP'ye girdi; geçiş derinlik-sınırlı | backend | P1 | integration | İlişki → yetki; derinlik sınırı | IAM ekibi |
| PERM-R08 | Her korunan endpoint `@RequirePermission` taşır → 403 | backend | P0 | integration | Yetkisiz istek 403 döner | IAM ekibi |
| PERM-R09 | Route guard PEP-rolünde; karar üretmez (PDP çağırır) | backend | P0 | review | Guard içinde karar mantığı yok | IAM ekibi |
| PERM-R10 | Her mutasyon backend'de yeniden doğrulanır | backend | P0 | e2e | UI gizli + API 403 birlikte | Fullstack ekibi |
| PERM-R11 | `deny` kararları decision_log'a yazılır | backend | P1 | audit | Yetkisiz deneme loglanır | IAM ekibi |
| PERM-R12 | Admin permission matrix PDP `evaluate_batch`'ten türer | fullstack | P1 | integration | Matris koda gömülü değil | IAM ekibi |
| PERM-R13 | İzin simülasyonu yan-etkisiz; gerçek kararla aynı | fullstack | P1 | integration | Simülasyon üretim state'ini değiştirmez | IAM ekibi |
| PERM-R14 | Permission-aware rendering backend kararını yansıtır (hesaplamaz) | frontend | P0 | e2e | Yetkisiz aksiyon UI'da yok | Frontend ekibi |
| PERM-R15 | Frontend gizleme güvenlik değil; API'da enforcement | frontend | P0 | e2e | Gizli aksiyon API'da 403 | Fullstack ekibi |
| PERM-R16 | RBAC/ABAC/ReBAC kararı PDP'ye delege; engine yeniden yazılmaz | backend | P0 | review | Yüzey PDP `evaluate` çağırır | IAM ekibi |
| PERM-R17 | AI policy/rol değiştiremez (`autonomy: none`), yalnız draft | backend | P0 | review | AI değişiklik denemesi reddedilir | IAM ekibi |
