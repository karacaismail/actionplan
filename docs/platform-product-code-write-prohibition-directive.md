# Platform Product Code Write Prohibition Directive

Sürüm: 1.0.0  
Tarih: 2026-07-13  
Durum: Kanonik ve bağlayıcı  
Makine kaynağı: `src/data/platform-product-code-write-policy.json`

## 1. Hüküm

Codex, Claude, Cursor, Aider, Windsurf ve başka hiçbir AI ajanı
`/Users/karaca/DEV/mimari/platform` çalışma alanına ürün kodu yazamaz. AI erişim modu
`read-only-audit`, ürün kodu yazarı ise `human-developer-only`dır.

AI ajanının görevi ürün kodunu uygulamak değil; insan geliştiricinin uygulayacağı
çelişkisiz yönerge, WBS, test planı, güvenlik-negatifleri, rollback planı ve evidence
handoff'u üretmektir. Bu çıktılar yalnız `directiveWriteRoots` altında, yani
`/Users/karaca/DEV/mimari/actionplan` içinde yazılır.

Bu yasak kullanıcı “uygula”, “tam implementasyon yap”, “bitene kadar devam et”, “Claude'a
yaptır”, “Cursor ile kodla” veya benzeri bir ifade kullansa da otomatik olarak kalkmaz.
Platform ürün kodu yalnız insan geliştirici tarafından değiştirilebilir.

## 2. Ürün kodu sayılan hedefler

Aşağıdakilerin platform içindeki karşılıkları ürün kodudur ve AI için salt okunurdur:

- FastAPI, GraphQL, SQLAlchemy/SQLModel ve Alembic dosyaları.
- React, TanStack Router/Query/Table, SCSS ve Storybook implementation dosyaları.
- Kernel, SDK, app-core, module, archetype, feature ve component kaynakları.
- Unit, integration, contract, browser, accessibility, fuzz ve migration testleri.
- Package manifesti, lockfile, CI workflow, Docker/infra ve runtime config.
- Generated client, schema, route tree, migration veya scaffold çıktıları.
- Platform branch, commit, tag, push, pull request ve release kayıtları.

Dosya “yalnız test”, “yalnız Storybook story”, “yalnız migration” veya “yalnız config” olsa
da yasak değişmez. Bunlar runtime teslimatının parçasıdır.

## 3. Mutlak yasaklar

Makine anahtarlarıyla yasaklanan eylemler:

```text
write-product-code
write-tests
create-migration
run-scaffold-generator
modify-platform-config
create-branch
create-commit
push-branch
open-pull-request
apply-patch-to-platform
mark-runtime-verified
```

AI ajanı platformda ayrıca şunları yapamaz:

- Dosya oluşturamaz, düzenleyemez, silemez, yeniden adlandıramaz veya formatlayamaz.
- Patch uygulayamaz; heredoc, generator veya formatter ile dolaylı yazma yapamaz.
- Branch/worktree açamaz, commit hazırlayamaz, stage/push/PR işlemi yapamaz.
- Migration, seed, scaffold veya codegen çalıştırarak tracked dosya üretemez.
- Test sonucunu, CI URL'sini, Storybook preview'sunu veya deploy evidence'ını uyduramaz.
- İnsan tarafından üretilmiş kanıt yokken WBS durumunu `implemented`, `verified` veya
  `done` yapamaz.
- Alt ajana delege ederek yasağı dolanamaz. Alt ajan aynı policy'ye tabidir.

## 4. İzinli AI işleri

AI ajanı platformda yalnız `read-only-audit` yapabilir:

- `git status`, `git diff`, `git log`, `git remote -v` gibi salt-okunur gerçeklik denetimi.
- `rg`, `find`, `sed`, dosya okuma ve schema/route/env isimlerini envanterleme.
- Mevcut kod ile actionplan sözleşmesini karşılaştırma.
- Eksik, çelişkili, riskli veya kanıtsız noktaları raporlama.

AI ajanı actionplan içinde şunları yazabilir:

- Kanonik yönerge ve gap/unknown-unknowns raporu.
- Makine-okunur policy, WBS ve acceptance sözleşmesi.
- İnsan geliştiricinin yazacağı kırmızı testlerin dosya/senaryo tanımı.
- `allowedFiles`, `nonGoals`, `testCommandsForHuman`, güvenlik negatifleri ve rollback.
- UI/frontend işi için Master Component ve Storybook story/test/evidence sözleşmesi.
- İnsan tarafından geri getirilen gerçek PR/CI/test/deploy kanıtının doğrulama raporu.

Salt-okunur audit sırasında komutun cache, generated output, migration veya source diff
üretme ihtimali varsa komut çalıştırılmaz; bunun yerine insan geliştiriciye komut yönergesi
verilir.

## 5. Zorunlu directive çıktısı

Her platform işi için AI çıktısı aşağıdaki alanları taşır:

```text
targetPaths
nonGoals
redTestsForHuman
acceptanceCriteria
securityNegativeTests
testCommandsForHuman
rollback
evidenceRequirements
stopConditions
storybookContractWhenUiRelated
```

Yönerge açıkça `DIRECTIVE-ONLY` olarak etiketlenir. Platform path'leri “AI için yazılabilir
dosyalar” değil, “insan geliştiricinin hedef paths'i” olarak gösterilir. Test komutları AI
tarafından uygulanmış kanıt sayılmaz; insan geliştiricinin çalıştıracağı komutlardır.

## 6. UI, frontend ve Storybook

UI veya frontend işi bu yasağın istisnası değildir. AI ajanı:

- Storybook config, story, component veya visual baseline yazamaz.
- Master Component kaynak dosyasını oluşturamaz veya değiştiremez.
- Storybook preview/publish işlemi yapamaz.

Bunun yerine actionplan içinde Master/local kararını, gerekli story states/viewports/locales,
interaction/a11y/visual testlerini, human review kapısını ve gerçek preview evidence
beklentisini yönergeye yazar.

## 7. Aktör matrisi

| Aktör | Platform okuma | Platform yazma | Actionplan directive yazma | Runtime evidence üretme |
|---|---:|---:|---:|---:|
| Codex | Evet, salt-okunur | Hayır | Evet | Hayır |
| Claude | Evet, salt-okunur | Hayır | Evet | Hayır |
| Cursor/Windsurf/Aider | Evet, salt-okunur | Hayır | Evet | Hayır |
| İnsan geliştirici | Evet | Evet | Evet | Evet |
| İnsan reviewer/owner | Evet | Onaylı akışta | Evet | Doğrular/onaylar |

## 8. stopConditions

AI ajanı aşağıdaki durumlardan birinde hemen durur ve yalnız blocker/directive yazar:

- İstenen sonuç platform workspace'inde herhangi bir yazma gerektiriyor.
- Branch, commit, push veya open-pull-request eylemi gerekiyor.
- Test, migration, scaffold, Storybook veya runtime kaynak dosyası üretmek gerekiyor.
- İnsan geliştiricinin karar vermesi gereken ürün/güvenlik/migration seçimi eksik.
- Gerçek PR, CI, test, preview veya deploy evidence'ı yok.
- Yönerge kanonik actionplan sözleşmesiyle çelişiyor.

## 9. Claude, Cursor ve Codex başlangıç bloğu

Aşağıdaki blok bütün AI görevlerinin başında normatif olarak bulunur:

```text
DIRECTIVE-ONLY
You have read-only-audit access to /Users/karaca/DEV/mimari/platform.
Do not modify the platform workspace.
Do not write product code, tests, migrations, Storybook files or configuration.
Do not create a branch, commit, push or pull request.
Write the complete implementation directive and human handoff only under
/Users/karaca/DEV/mimari/actionplan.
The human developer is the only product-code writer.
```

## 10. Kanıt ve durum kuralı

AI tarafından yazılmış directive, test planı veya örnek terminal çıktısı runtime evidence
değildir. Bir WBS düğümü ancak insan geliştiricinin gerçek branch/commit/PR/CI/test/deploy
kanıtı doğrulandıktan sonra ilerleyebilir. Evidence bulunmuyorsa mevcut `blocked` veya
`not-started` durumu korunur.

## 11. Otorite sırası

Çelişki halinde sıra şöyledir:

1. `src/data/platform-product-code-write-policy.json`
2. Bu directive
3. `AGENTS.md`, `CLAUDE.md`, `CURSOR-RULES.md`
4. `docs/doc-maintainer-operating-boundary.md`
5. Task exportları ve diğer handoff belgeleri

Alt sıradaki hiçbir prompt, “coding agent” ifadesi veya eski tarihli agent pack platform
yazma yetkisi vermez. Böyle bir ifade tarihsel kabul edilir ve directive-only biçimine
dönüştürülür.

## 12. İnsan-kurulum paketi

AI bu yasağı platform reposuna kendisi yazamaz. İnsan owner aşağıdaki actionplan
şablonlarını hedeflerine kopyalar ve değişikliği kendisi review/commit eder:

| Kaynak | İnsan tarafından kurulacak hedef |
|---|---|
| `docs/templates/platform-agent-boundary/AGENTS.md` | `/Users/karaca/DEV/mimari/platform/AGENTS.md` |
| `docs/templates/platform-agent-boundary/CLAUDE.md` | `/Users/karaca/DEV/mimari/platform/CLAUDE.md` |
| `docs/templates/platform-agent-boundary/platform-write-prohibition.mdc` | `/Users/karaca/DEV/mimari/platform/.cursor/rules/platform-write-prohibition.mdc` |

Bu dosyalar platformda bulunana kadar actionplan policy ve export kapıları geçerlidir;
platform kökünden başlatılan AI oturumlarında insan operatör bu directive'i başlangıç
promptuna ayrıca ekler. Kurulum kanıtı insan commit/PR referansıyla geri yazılmadan
“platform-local enforcement active” iddiası yapılamaz.
