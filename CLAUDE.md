# Claude Directive — DIRECTIVE-ONLY

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

Platform yazma gerektiren istekte dur ve `DIRECTIVE-ONLY` handoff üret.
