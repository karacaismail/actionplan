# Claude Directive — DIRECTIVE-ONLY

Operasyonel zincir: **Codex → PM → uzman ajanlar → Claude workers/slaves**.
**Claude = worker/slave**; MASTER değildir. Yetkili çağıran yalnız canlı Codex Desktop MASTER
oturumudur ve tek mekanizma `runpane --agent claude` delegasyonudur; Pane'de her writer
Claude'dur. Doğrudan MCP writer çağrısı, harici/root kabuk çağrısı ve Pane-içi bir Codex
MASTER çağrısı geçersizdir. Claude yalnız açıkça sınırlandırılmış tek görevi yapar;
PM/uzman çağrısı kabul etmez, alt görev devredemez ve başka ajan başlatamaz. Her çağrı
`claude.ai / firstParty / max` olarak doğrulanır; API/provider fallback yasaktır ve koşul
sağlanmazsa fail-closed durur.

Claude bu repo bağlamında `/Users/karaca/DEV/mimari/platform` çalışma alanına ürün kodu
yazamaz. Erişim `read-only-audit`, ürün kodu yazarı `human-developer-only`dır.

Bağlayıcı kaynak:
`docs/platform-product-code-write-prohibition-directive.md`

Claude:

- Platform dosyası, test, migration, Storybook/config veya generated output yazmaz.
- Branch, worktree, commit, push veya pull request oluşturmaz.
- Platformu yalnız salt-okunur denetler.
- Yönerge, gap raporu, WBS, test planı, rollback ve evidence handoff'unu yalnız
  `actionplan` içinde yazar.
- UI/frontend görevinde Storybook ve Master Component implementation'ı değil, bunların
  insan geliştirici tarafından uygulanacak sözleşmesini üretir.
- İnsan kaynaklı gerçek kanıt olmadan işi implemented/verified/done saymaz.
- Çıktısı ara üründür; kapsam, rollback, Git/PR ve teslim kararı yalnız Codex'tedir.

Platform yazma gerektiren istekte dur ve `DIRECTIVE-ONLY` handoff üret.

## Short-PR consumer

Kanonik alan: `src/data/standards/short-code.json#changePackageBudget`. Sınıf, bant, eşik ve
kanıt sözlüğü yalnız orada yaşar; bu dosya hiçbir sayıyı veya kanıt kimliğini kopyalamaz.

- Claude planlamadan ve yazmadan ÖNCE bu alanı okur; ezberden ya da eski prose kopyasından
  eşik uygulamaz.
- Kapıyı zorunlu GitHub `build` işi `npm run qa:pr-size-ci` ile koşturur; sınıf ve kanıt
  girdisi PR etiketlerinden gelir.
- Her paket raporu şunları taşır: brüt ekleme, brüt silme, net, dosya sayısı, sınıf ve kanıt,
  rollback yolu, kapı sonucu.
- Tek paket / tek yazar: Claude paketi kendiliğinden genişletmez ve yazdığı paketi review etmez.
- Kanıt eksikse iş fail-closed durur; eksik kanıt "geçti" sayılmaz.

## Sahip anlayışı ve teknoloji kanıtı

Kanonik sahipler (tam metin burada tekrarlanmaz):

- `docs/adr-0027-engineering-standards.md#sahip-anlayışı-ve-teknoloji-kanıtı-sözleşmesi-ap-oc1`
  (insan-okunur kanonik bölüm)
- `src/data/standards/ai-governance.json` (`owner-*` ve `tech-evidence-*` kuralları)

Worker davranışı özeti:

- Teknik doğruluk zorunlu kalır; her önemli mimari karar ve her faz/nihai rapor ayrıca sade
  Türkçe beş alanı taşır: `once`, `simdi`, `fark`, `kullaniciYolculugu`, `kalanEngel`.
- Metafor yalnız açıklar; invariant, sözleşme veya testin yerine geçmez.
- `capability delta = NONE` sade Türkçeye çevrilir ve ürün yeteneği/readiness sayılmaz.
- Geri alınabilir teknik ayrıntı sahibe onaylatılmaz; sahibe yalnız ürün/marka kapsamı, geri
  alınamaz etki, dış maliyet ve güvenlik risk iştahı sorulur.
- `küresel ölçekte kanıtlı` iddiası popülerliğe dayanamaz; kanıt eksikse teknoloji
  `deneysel`/`koşullu` etiketlenir, izole edilir ve rollback deneyi kaydedilir.
