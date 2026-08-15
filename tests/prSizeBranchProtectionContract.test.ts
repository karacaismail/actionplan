import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { StandardContractSchema } from "@/schemas";
import { afterAll, describe, expect, it } from "vitest";

/**
 * B13 — MERGE KORUMASI SÖZLEŞMESİ (RED).
 *
 * CANLI GERÇEK (bu RED'in başlangıç noktasında ZATEN böyleydi): `main` üzerinde branch protection
 * MEVCUTtur ve `build` status check'ini ZORUNLU kılar; strict mod, admin zorlaması, pull-request
 * akışı ve konuşma çözümü açıktır, force-push ve dal silme kapalıdır. Yani bozuk bir PR bugün
 * ZATEN bloklanır; bu dosya "merge koruması yok" İDDİA ETMEZ.
 *
 * GERÇEK B13 BOŞLUĞU bir uygulama boşluğu değil, KANONİK/MAKİNE-OKUNUR uygunluk ve kanıt
 * DRIFT'iydi: kanonik metin boşluğu hâlâ "AÇIK" diye ilan ediyordu ve depoda canlı politikayı
 * temsil edip onunla KARŞILAŞTIRAN deterministik bir sözleşme veya doğrulayıcı yoktu. Bu dosya
 * o drift'i yanlışlanabilir kılar ve MİNİMAL tasarımı bağlar:
 * `changePackageBudget.checker.mergeProtection` alanı, `--input` ile verilen GitHub
 * branch-protection JSON anlık görüntüsünü kanoniğe karşı FAIL-CLOSED doğrulayan yerel bir
 * doğrulayıcı, ve kanonik metnin kapanmış boşluğu artık "AÇIK" diye ilan EDEMEMESİ.
 *
 * KAPSAM DÜRÜST: burada hiçbir canlı GitHub ayarı okunmaz veya değiştirilmez; doğrulayıcı ağ
 * ÇAĞIRMAZ, kendisine verilen anlık görüntüyü doğrular. Kapının yeşile dönmesi canlı korumayı
 * KURMAZ — onu makine tarafından denetlenebilir hale getirir — ve ürün/runtime hazırlığı
 * DEĞİLDİR. Eşik, bant, sınıf ve kanıt kimlikleri bu dosyada İKİNCİ KEZ yazılmaz; gerekli her
 * kimlik ya kanonikten ya da gerçek iş akışı dosyasından türetilir.
 */
// biome-ignore lint/suspicious/noExplicitAny: kanonik JSON ve doğrulayıcı raporu burada ham okunur.
type Any = any;

const ROOT = process.cwd();
const SELF = "tests/prSizeBranchProtectionContract.test.ts";
const CANONICAL = "src/data/standards/short-code.json";
const WORKFLOW = ".github/workflows/deploy.yml";
/** B12 olay adaptörü: zorunlu check kimliğinin hangi JOB'a ait olduğunu bu adım gösterir. */
const ADAPTER = "tools/agents/check-pr-size-ci.mjs";
/** B13'ün planlanan doğrulayıcısı; ağ değil, `--input` anlık görüntüsü okur. */
const VERIFIER = "tools/agents/check-pr-size-branch-protection.mjs";

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const canonical = JSON.parse(read(CANONICAL)) as Any;
const budget = canonical.changePackageBudget as Any;
const checker = budget.checker as Any;
const contract = (checker.mergeProtection ?? {}) as Any;

/* ---------- Repo gerçeği: zorunlu check kimliği iş akışından TÜRETİLİR ---------- */

const workflow = read(WORKFLOW);
/** Yorum bloğu tek satıra düzleştirilir: iddia satır sonunda kesilerek gizlenemesin. */
const flatten = (text: string) => text.replace(/^#\s?/gm, "").replace(/\s*\n\s*/g, " ");
const header = flatten(workflow.split("\nname:")[0]);
const jobsBlock = workflow.slice(workflow.search(/^jobs:$/m));
/** İki boşluk girintili anahtarlar JOB'dur; `- name:` satırları yalnızca ADIMdır. */
const jobChunks = jobsBlock.split(/\n(?=\s{2}[A-Za-z0-9][\w-]*:$)/m).slice(1);
const keyOf = (chunk: string) => (chunk.match(/^\s{2}([A-Za-z0-9][\w-]*):/) as RegExpMatchArray)[1];
const JOB_KEYS = jobChunks.map(keyOf);
const gateJobChunk = jobChunks.find((chunk) => chunk.includes(ADAPTER)) ?? "";
const GATE_JOB = gateJobChunk ? keyOf(gateJobChunk) : "";
const STEP_NAMES = [...workflow.matchAll(/^\s+- name:\s*(.+)$/gm)].map((m) => m[1].trim());
/** Korunan dal adı da iş akışının kendi `on:` tetikleyicisinden gelir, elle yazılmaz. */
const onBlock = workflow.slice(workflow.search(/^on:$/m)).split(/\n(?=[A-Za-z])/)[0] ?? "";
const TRIGGER_BRANCHES = [...onBlock.matchAll(/branches:\s*\[\s*([^\]]+?)\s*\]/g)].map((m) =>
  m[1].trim(),
);
const PROTECTED_BRANCH = [...new Set(TRIGGER_BRANCHES)][0] ?? "";

/* ---------- Doğrulayıcı: anlık görüntü içeri, adlandırılmış karar dışarı ---------- */

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "pr-size-protection-"));
afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }));
let seq = 0;
const fileWith = (body: string) => {
  seq += 1;
  const file = path.join(TMP, `${seq}-snapshot.json`);
  fs.writeFileSync(file, body);
  return file;
};

const REQUIRED_CHECK = (contract.requiredCheck as string) ?? GATE_JOB;
/** GitHub branch-protection yükünün gerçek şekli; değerler KANONİK sözleşmeden türetilir. */
const snapshot = (): Any => ({
  required_status_checks: {
    strict: contract.strict ?? true,
    contexts: [REQUIRED_CHECK],
    checks: [{ context: REQUIRED_CHECK, app_id: null }],
  },
  required_pull_request_reviews: { required_approving_review_count: 0 },
  enforce_admins: { enabled: contract.enforceAdmins ?? true },
  required_conversation_resolution: { enabled: contract.requiredConversationResolution ?? true },
  allow_force_pushes: { enabled: contract.forcePushAllowed ?? false },
  allow_deletions: { enabled: contract.deletionAllowed ?? false },
  required_linear_history: { enabled: false },
});
const edited = (patch: (s: Any) => void): Any => {
  const payload = snapshot();
  patch(payload);
  return payload;
};

type Run = { status: number | null; stdout: string; stderr: string; report: Any };
const runVerifier = (args: string[]): Run => {
  const done = spawnSync(process.execPath, [path.join(ROOT, VERIFIER), ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
  let report: Any = null;
  try {
    report = JSON.parse(done.stdout);
  } catch {
    report = null;
  }
  return { status: done.status, stdout: done.stdout, stderr: done.stderr, report };
};
const runWith = (payload: Any): Run =>
  runVerifier([`--input=${fileWith(JSON.stringify(payload))}`]);
/** Reddedilen her yol: JSON rapor + sıfırdan farklı çıkış + ADLANDIRILMIŞ hata kimliği. */
const refusedId = (result: Run, label: string): string => {
  expect(
    result.report,
    `${label}: fail-closed yolda JSON rapor yok | ${result.stderr}`,
  ).not.toBeNull();
  expect(result.status, `${label}: reddedilen anlık görüntü sıfırla kapandı`).not.toBe(0);
  const id = result.report?.error?.id;
  expect(typeof id === "string" && id.length > 0, `${label}: hata adsız | ${result.stdout}`).toBe(
    true,
  );
  return id as string;
};

describe("B13 — kanonik merge-protection sözleşmesi", () => {
  it("changePackageBudget.checker altında MAKİNE-OKUNUR bir sözleşme vardır", () => {
    expect(checker.mergeProtection, "merge-protection sözleşmesi kanonikte yok").toBeTypeOf(
      "object",
    );
    // Şema alanı tanımıyorsa zod onu sessizce atar veya strict RED verir; ikisi de burada yakalanır.
    const parsed = StandardContractSchema.parse(canonical) as Any;
    expect(
      parsed.changePackageBudget.checker.mergeProtection,
      "sözleşme şemadan geçmiyor veya strip ediliyor",
    ).toEqual(checker.mergeProtection);
  });

  it("sözleşme merge korumasının tam semantiğini taşır", () => {
    expect(contract.branch, "korunan dal iş akışı tetikleyicisinden sapıyor").toBe(
      PROTECTED_BRANCH,
    );
    expect(contract.requiredCheck, "zorunlu check kimliği iş akışı JOB'undan sapıyor").toBe(
      GATE_JOB,
    );
    const flags = {
      strict: contract.strict,
      enforceAdmins: contract.enforceAdmins,
      pullRequestRequired: contract.pullRequestRequired,
      forcePushAllowed: contract.forcePushAllowed,
      deletionAllowed: contract.deletionAllowed,
      requiredConversationResolution: contract.requiredConversationResolution,
    };
    expect(flags, "merge koruması yarım beyan edildi").toEqual({
      strict: true,
      enforceAdmins: true,
      pullRequestRequired: true,
      forcePushAllowed: false,
      deletionAllowed: false,
      requiredConversationResolution: true,
    });
  });

  it("zorunlu check bir JOB kimliğidir; adım adı zorunlu check sanılmaz", () => {
    expect(GATE_JOB, `bütçe adımını taşıyan JOB yok: ${ADAPTER}`).not.toBe("");
    expect(JOB_KEYS, "zorunlu check hiçbir JOB'a karşılık gelmiyor").toContain(
      contract.requiredCheck,
    );
    expect(STEP_NAMES, "adım adı zorunlu check kimliği sanıldı").not.toContain(
      contract.requiredCheck,
    );
    expect(gateJobChunk, "B12 bütçe adımı zorunlu check JOB'unun içinde değil").toContain(ADAPTER);
  });

  it("kanonik, iş akışı ve adaptör metni boşluğu artık 'AÇIK' diye ilan EDEMEZ", () => {
    // DRIFT: canlı koruma `build` check'ini ZATEN zorunlu kılıyor; yanlış olan depo METNİdir.
    // Türkçe noktasız `ı` JS'in /i katlamasıyla `I`ya EŞLEŞMEZ; iki yazım da açıkça aranır.
    // `açıkla*` / `açıkça` bir İDDİA değil bir anlatımdır; yalnız "AÇIK(tır)" beyanı yasaklanır.
    const openClaim = /(B13|branch protection|zorunlu check)[^.]*[Aa][ÇçCc][Iıİi][Kk](?!la|ça|ç)/;
    // REVIEW_RED bulgusu: DOĞRUDAN yüzey de denetlenir — adaptörün KENDİ kaynağı eskimiş
    // "B13 AÇIK" beyanını taşıyordu ve bu döngüde görünmüyordu. Artık üç yüzey birlikte sayılır.
    for (const [label, text] of [
      ["kanonik kapı notu", flatten(checker.note as string)],
      ["iş akışı başlığı", header],
      ["olay adaptörü kaynağı", flatten(read(ADAPTER))],
    ] as Array<[string, string]>)
      expect(text, `${label}: kapanmış boşluk hâlâ AÇIK ilan ediliyor`).not.toMatch(openClaim);
    // capability_delta=NONE dürüstlüğü: kapı yeşile dönse bile ürün/runtime hazırlığı DEĞİLDİR.
    const honesty = `${checker.note} ${contract.note ?? ""}`;
    expect(honesty, "ürün/runtime hazırlığı reddi düştü").toMatch(/ürün\/runtime hazırlığı/);
    expect(honesty, "yönetişim kapısı ürün hazırlığı gibi sunuluyor").toMatch(/sayılmaz/);
  });
});

describe("B13 — doğrulayıcı anlık görüntüyü kanoniğe karşı fail-closed denetler", () => {
  it("doğrulayıcı planlanan yolda vardır ve sözleşme onu adıyla gösterir", () => {
    expect(contract.verifier, "sözleşme doğrulayıcıyı adıyla göstermiyor").toBe(VERIFIER);
    expect(fs.existsSync(path.join(ROOT, VERIFIER)), `doğrulayıcı yok: ${VERIFIER}`).toBe(true);
  });

  it("kanoniğe UYAN anlık görüntü kabul edilir", () => {
    const result = runWith(snapshot());
    expect(result.report, `doğrulayıcı JSON rapor üretmedi | ${result.stderr}`).not.toBeNull();
    expect(result.status, `uyan anlık görüntü reddedildi | ${result.stdout}`).toBe(0);
    expect(result.report.error ?? null, "kabul yolunda hata raporlandı").toBeNull();
  });

  const rejects: Array<[string, () => Run]> = [
    ["girdi bayrağı yok", () => runVerifier([])],
    ["girdi dosyası okunamaz", () => runVerifier([`--input=${path.join(TMP, "yok.json")}`])],
    ["bozuk JSON", () => runVerifier([`--input=${fileWith("{ bozuk")}`])],
    [
      "zorunlu check eksik",
      () =>
        runWith(
          edited((s) => {
            s.required_status_checks.contexts = [];
            s.required_status_checks.checks = [];
          }),
        ),
    ],
    [
      "zorunlu check yanlış",
      () =>
        runWith(
          edited((s) => {
            s.required_status_checks.contexts = [`${REQUIRED_CHECK}-baska`];
            s.required_status_checks.checks = [{ context: `${REQUIRED_CHECK}-baska` }];
          }),
        ),
    ],
    [
      "strict kapalı",
      () =>
        runWith(
          edited((s) => {
            s.required_status_checks.strict = false;
          }),
        ),
    ],
    [
      "admin muafiyeti",
      () =>
        runWith(
          edited((s) => {
            s.enforce_admins.enabled = false;
          }),
        ),
    ],
    [
      "PR zorunluluğu yok",
      () =>
        runWith(
          edited((s) => {
            s.required_pull_request_reviews = null;
          }),
        ),
    ],
    [
      "force-push serbest",
      () =>
        runWith(
          edited((s) => {
            s.allow_force_pushes.enabled = true;
          }),
        ),
    ],
    [
      "dal silme serbest",
      () =>
        runWith(
          edited((s) => {
            s.allow_deletions.enabled = true;
          }),
        ),
    ],
    [
      "konuşma çözümü kapalı",
      () =>
        runWith(
          edited((s) => {
            s.required_conversation_resolution.enabled = false;
          }),
        ),
    ],
  ];

  it.each(rejects)("%s: karar YERİNE adlandırılmış hata gelir", (label, run) => {
    refusedId(run(), label);
  });

  it("her ihlal sınıfı KENDİ adıyla raporlanır; tek jenerik hataya çökmez", () => {
    const ids = rejects.map(([label, run]) => refusedId(run(), label));
    expect(new Set(ids).size, `ihlal sınıfları aynı ada çöktü: ${ids.join()}`).toBe(ids.length);
  });
});

describe("B13 — ikinci eşik/kimlik kopyası yasağı", () => {
  it("bu test ve doğrulayıcı kanonik sayı/kimlikleri yeniden yazmaz", () => {
    const numbers = new Set<number>([
      ...(budget.bands as Any[]).map((b) => b.maxNet as number),
      ...(budget.classes as Any[]).map((c) => c.maxNet as number),
      budget.splitRequiredAboveNet as number,
      budget.maxChangedFiles as number,
    ]);
    const names = [
      ...(budget.bands as Any[]).map((b) => b.id as string),
      ...(budget.classes as Any[]).map((c) => c.id as string),
      ...(budget.bands as Any[]).flatMap((b) => b.requires as string[]),
      ...(budget.churnGuard.requires as string[]),
    ];
    for (const file of [SELF, VERIFIER]) {
      expect(fs.existsSync(path.join(ROOT, file)), `denetlenecek dosya yok: ${file}`).toBe(true);
      const text = read(file);
      for (const value of numbers)
        expect(text, `${file}: eşik kopyası ${value}`).not.toMatch(new RegExp(`\\b${value}\\b`));
      for (const name of names)
        expect(text, `${file}: kimlik kopyası ${name}`).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
  });
});
