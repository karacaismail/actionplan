import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// P2A-2b: change-package SAF KARAR motoru. Ölçüm çekirdekte (tests/prSizeCore.test.ts)
// kanıtlandı; burada kanıtlanan tek şey KARARın kanonik `changePackageBudget` alanından TÜREDİĞİ
// ve bozuk girdinin karara DÖNÜŞMEDİĞİdir. Hiçbir eşik ya da bant kimliği bu dosyada ikinci kez
// yazılmaz: sınırlar kanonikten hesaplanır, böylece test de motor da tek kaynağa bağlı kalır.
// KAPSAM DÜRÜST: motor süreç değildir — argv, dosya/fixture, stdout ve çıkış kodu P2A-2c'nin,
// gerçek Git aralığı P2B'nin, CI bağlantısı P3'ün işidir ve bu paket hiçbirini İDDİA ETMEZ.
const ROOT = process.cwd();
const ENGINE = "tools/lib/pr-size-decision.mjs";
const SELF = "tests/prSizeDecision.test.ts";
const CANONICAL = "src/data/standards/short-code.json";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");

/** Kanonik kalıtım bayrağının adı da tek yerde yazılır; testte ikinci bir kimlik kopyası yok. */
const FLAG = "includesLowerBandRequirements";
type Band = { id: string; maxNet: number; requires: string[]; [FLAG]: boolean };
type ClassEntry = { id: string; maxNet: number; ceilingKind: string };
// biome-ignore lint/suspicious/noExplicitAny: kanonik JSON burada bilinçli olarak ham okunur.
const budget: any = JSON.parse(read(CANONICAL)).changePackageBudget;
const BANDS = budget.bands as Band[];
const [LOW, MID, TOP] = BANDS;
const CLASSES = budget.classes as ClassEntry[];
// Sınıflar KİMLİKLE değil, tavanlarının hangi banttan türediğiyle seçilir (ikinci kopya yok).
const TIGHT_CLASS = CLASSES.find((c) => c.maxNet === LOW.maxNet) as ClassEntry;
const WIDE_CLASS = CLASSES.find((c) => c.maxNet === MID.maxNet) as ClassEntry;
const CHURN = budget.churnGuard as { netCreditFloor: number; requires: string[] };
const GROSS_MAX = (BANDS.find((b) => b.id === budget.churnGuard.grossMaxFromBand) as Band).maxNet;
// Fren KAPSAMI ayrı bir kanonik alandır: brüt tavanla aynı bant olmak zorunda değildir.
const SCOPE_BAND = budget.churnGuard.appliesWhenNetAtOrBelowBand as string;
const SCOPE_MAX = (BANDS.find((b) => b.id === SCOPE_BAND) as Band).maxNet;
// Muafiyet kanıtının kimliği ELLE yazılmaz; en üst bandın son koşulu kanonikten okunur.
const TOP_ONLY_REQ = TOP.requires[TOP.requires.length - 1];

// biome-ignore lint/suspicious/noExplicitAny: yayınlanan saf JavaScript motorun .d.ts'i yok.
const engine: any = await import(pathToFileURL(path.join(ROOT, ENGINE)).href);
const DECISION = engine.DECISION as Record<string, string>;
const KIND = engine.ERROR_KIND as Record<string, string>;

/** `git diff --numstat -z` teli: sıradan kayıt tek NUL, rename kaydı boş yol + eski + yeni. */
const zRow = (a: string | number, d: string | number, file: string) => `${a}\t${d}\t${file}\0`;
const zRename = (a: number, d: number, from: string, to: string) =>
  `${a}\t${d}\t\0${from}\0${to}\0`;
const GOVERNED = "src/pkg/change.ts";
/** Bütçeye giren tek satırla istenen neti üretir; sınırlar kanonikten türetilir. */
const wireForNet = (net: number, deletions = 0) => zRow(net + deletions, deletions, GOVERNED);
/** Brüt = net + 2×silme; verilen brüte ulaşan en küçük churn payı ARİTMETİKLE türetilir. */
const churnFor = (gross: number, net: number) => Math.ceil((gross - net) / 2);
/** Brüt TAM `gross`; net fren kapsamının İÇİNDE ve tabanın ÜSTÜNDE kalır (vakumlu durum yok). */
const wireAtGross = (gross: number) => {
  const deletions = churnFor(gross, SCOPE_MAX);
  return wireForNet(gross - 2 * deletions, deletions);
};

// biome-ignore lint/suspicious/noExplicitAny: karar raporu makine sözleşmesidir, tipi motorda yaşar.
type Verdict = any;
const decide = (wire: unknown, klass: string, evidence: string[] = [], config = budget): Verdict =>
  engine.decide({ budget: config, numstatZ: wire, klass, evidence });
const blockerIds = (verdict: Verdict): string[] =>
  verdict.blockers.map((b: { id: string }) => b.id);
const findingIds = (verdict: Verdict): string[] =>
  verdict.findings.map((f: { id: string }) => f.id);
const clone = () => JSON.parse(JSON.stringify(budget));
const set = (target: unknown, patch: Record<string, unknown>) =>
  Object.assign(target as Record<string, unknown>, patch);

describe("pr-size karar motoru — bant merdiveni sınırları kanonikten türer", () => {
  it("her bandın alt/tam/üst sınırı doğru bandı seçer", () => {
    for (const [index, band] of BANDS.entries()) {
      const previous = index === 0 ? -1 : BANDS[index - 1].maxNet;
      for (const net of [band.maxNet - 1, band.maxNet]) {
        if (net <= previous) continue;
        const verdict = decide(wireForNet(net), WIDE_CLASS.id, band.requires);
        expect(verdict.band.id, `net ${net}`).toBe(band.id);
        expect(verdict.measurement.budgetNet).toBe(net);
        expect(blockerIds(verdict), `net ${net} bloklandı`).toEqual([]);
        expect(verdict.decision).toBe(DECISION.accepted);
      }
      const over = band.maxNet + 1;
      const next = BANDS[index + 1];
      const verdict = decide(wireForNet(over), WIDE_CLASS.id, next ? next.requires : []);
      if (next) {
        expect(verdict.band.id, `net ${over} bir üst banda geçmeli`).toBe(next.id);
        expect(verdict.decision).toBe(DECISION.accepted);
      } else {
        expect(verdict.band, "split'te bant seçilemez").toBeNull();
        expect(verdict.decision).toBe(DECISION.split);
        expect(blockerIds(verdict)).toContain("split-required");
      }
    }
  });

  it("en alt bant kanıtsız kabul eder; bir üstü kanıtsız asla kabul etmez", () => {
    expect(LOW.requires, "en alt bant kanıt istiyor").toEqual([]);
    const inside = decide(wireForNet(LOW.maxNet), TIGHT_CLASS.id);
    expect(inside.decision).toBe(DECISION.accepted);
    const outside = decide(wireForNet(LOW.maxNet + 1), WIDE_CLASS.id);
    expect(outside.band.id).toBe(MID.id);
    expect(blockerIds(outside)).toContain("evidence-missing");
    expect(outside.evidence.missing).toEqual([...MID.requires].sort());
  });

  it("split eşiği üstü paket hiçbir kanıt bileşimiyle kabul edilmez", () => {
    const beyond = budget.splitRequiredAboveNet + 1;
    for (const evidence of [[], TOP.requires, [...TOP.requires, ...MID.requires]]) {
      const verdict = decide(wireForNet(beyond), WIDE_CLASS.id, evidence);
      expect(verdict.decision, `kanıt: ${evidence.join(",")}`).toBe(DECISION.split);
      expect(verdict.measurement.splitRequiredAboveNet).toBe(budget.splitRequiredAboveNet);
    }
  });
});

describe("pr-size karar motoru — kanıt sözleşmesi TAM küme olarak aranır", () => {
  it("orta bant TAM kanonik koşul kümesini ister; eksik küme reddedilir", () => {
    const full = decide(wireForNet(MID.maxNet), WIDE_CLASS.id, MID.requires);
    expect(full.evidence.required).toEqual([...MID.requires].sort());
    expect(full.decision).toBe(DECISION.accepted);
    for (const missing of MID.requires) {
      const partial = MID.requires.filter((id) => id !== missing);
      const verdict = decide(wireForNet(MID.maxNet), WIDE_CLASS.id, partial);
      expect(verdict.evidence.missing, `eksik: ${missing}`).toEqual([missing]);
      expect(blockerIds(verdict)).toContain("evidence-missing");
      expect(verdict.decision).toBe(DECISION.rejected);
    }
  });

  it("orta bantta üst bandın muafiyet kanıtı YASAKtır (istenmesi de sunulması da)", () => {
    const verdict = decide(wireForNet(MID.maxNet), WIDE_CLASS.id, [...MID.requires, TOP_ONLY_REQ]);
    expect(verdict.evidence.required, "muafiyet bu banda sızdı").not.toContain(TOP_ONLY_REQ);
    expect(verdict.evidence.notRequired).toEqual([TOP_ONLY_REQ]);
    expect(blockerIds(verdict)).toContain("evidence-not-required");
    expect(verdict.decision).toBe(DECISION.rejected);
  });

  it("en üst bant kendi TAM üçlüsünü ister; muafiyet kanıtı orada ZORUNLUdur", () => {
    expect(TOP.requires, "üst bant muafiyet kanıtı taşımıyor").toContain(TOP_ONLY_REQ);
    const accepted = decide(wireForNet(TOP.maxNet), WIDE_CLASS.id, TOP.requires);
    expect(accepted.decision).toBe(DECISION.accepted);
    // Alt bandın koşulları KENDİLİĞİNDEN devralınmaz; devralınsaydı yedi koşul da aranırdı.
    expect(accepted.evidence.required).toEqual([...TOP.requires].sort());
    for (const id of MID.requires) expect(accepted.evidence.required).not.toContain(id);
    const withoutWaiver = TOP.requires.filter((id) => id !== TOP_ONLY_REQ);
    const rejected = decide(wireForNet(TOP.maxNet), WIDE_CLASS.id, withoutWaiver);
    expect(rejected.evidence.missing).toEqual([TOP_ONLY_REQ]);
    expect(rejected.decision).toBe(DECISION.rejected);
  });

  it("kalıtım bayrağı OKUNUR: açık banda alt bandın koşulları eklenir, kapalıda eklenmez", () => {
    const inheriting = clone();
    inheriting.bands[2][FLAG] = true;
    const union = [...new Set([...TOP.requires, ...MID.requires])].sort();
    const wire = wireForNet(TOP.maxNet);
    const full = decide(wire, WIDE_CLASS.id, [...TOP.requires, ...MID.requires], inheriting);
    expect(full.evidence.required, "kalıtım bayrağı okunmadı").toEqual(union);
    expect([...full.band.requires].sort(), "rapor bandın etkin kümesini göstermedi").toEqual(union);
    expect(full.decision).toBe(DECISION.accepted);
    const partial = decide(wire, WIDE_CLASS.id, TOP.requires, inheriting);
    expect(partial.evidence.missing).toEqual([...MID.requires].sort());
    expect(partial.decision).toBe(DECISION.rejected);
    // Kanonik bugün kalıtımı KAPALI tutar; aynı paket kanonik bütçede alt bandı istemez.
    expect(BANDS.map((b) => b[FLAG])).toEqual(BANDS.map(() => false));
    expect(decide(wire, WIDE_CLASS.id, TOP.requires).decision).toBe(DECISION.accepted);
  });

  it("kanonik olmayan ve tekrarlı kanıt kimliği ÖLÇÜM YAPILMADAN durdurulur", () => {
    const unknown = decide(wireForNet(MID.maxNet), WIDE_CLASS.id, [...MID.requires, "uydurma"]);
    expect(unknown.error.id).toBe("evidence-unknown");
    expect(unknown.error.kind).toBe(KIND.caller);
    expect(unknown, "reddedilen çağrı ölçüm raporu üretti").not.toHaveProperty("measurement");
    const twice = decide(wireForNet(1), TIGHT_CLASS.id, [MID.requires[0], MID.requires[0]]);
    expect(twice.error.id).toBe("evidence-duplicate");
    expect(twice.error.kind).toBe(KIND.caller);
    // Kanıt sözlüğü de kanoniktir: bant koşulları + churn freninin istediği kimlikler.
    const churnOnly = decide(wireForNet(1), TIGHT_CLASS.id, CHURN.requires);
    expect(churnOnly.ok, "churn kanıtı sözlükte yok sayıldı").toBe(true);
  });

  it("kanıt beyanının ŞEKLİ de kapıdır; hata ayrıntısı ayırıcıda kesilmez", () => {
    // Tek string bir kanıt "boş küme" sayılsaydı eksik-kanıt gibi görünür, şekil hatası kaybolurdu.
    for (const shape of [null, MID.requires[0], { length: 1 }]) {
      const verdict = decide(wireForNet(1), TIGHT_CLASS.id, shape as unknown as string[]);
      expect(verdict.error.id, `geçti: ${String(shape)}`).toBe("evidence-not-array");
      expect(verdict.error.kind).toBe(KIND.caller);
      expect(verdict, "şekil hatası ölçüm raporu üretti").not.toHaveProperty("measurement");
    }
    const piped = decide(wireForNet(1), TIGHT_CLASS.id, [`${MID.requires[0]}|${TOP_ONLY_REQ}`]);
    expect(piped.error.id).toBe("evidence-unknown");
    expect(piped.error.detail, "ayrıntı ayırıcıda kesildi").toContain(TOP_ONLY_REQ);
  });
});

describe("pr-size karar motoru — sınıf tavanı merdivenin YERİNE geçmez", () => {
  it("bilinmeyen sınıf fail-closed durdurur", () => {
    const verdict = decide(wireForNet(1), "uydurma-sınıf");
    expect(verdict.error.id).toBe("class-unknown");
    expect(verdict.error.kind).toBe(KIND.caller);
    expect(verdict.decision).toBeNull();
  });

  it("geniş tavanlı sınıf, kendi tavanı içinde bile bandın kanıtını atlayamaz", () => {
    const bare = decide(wireForNet(WIDE_CLASS.maxNet), WIDE_CLASS.id);
    expect(bare.changeClass.exceeded, "sınıf tavanı içinde").toBe(false);
    expect(bare.band.id, "sınıf tavanı bandı ezdi").toBe(MID.id);
    expect(blockerIds(bare), "sınıf tavanı kanıt merdivenini kısalttı").toContain(
      "evidence-missing",
    );
    expect(bare.decision).toBe(DECISION.rejected);
  });

  it("sınıf tavanı AŞILDIĞINDA ayrı raporlanır; kararı bandın kanıtı verir", () => {
    const net = TIGHT_CLASS.maxNet + 1;
    const verdict = decide(wireForNet(net), TIGHT_CLASS.id, MID.requires);
    expect(verdict.changeClass).toEqual({
      id: TIGHT_CLASS.id,
      maxNet: TIGHT_CLASS.maxNet,
      ceilingKind: TIGHT_CLASS.ceilingKind,
      exceeded: true,
    });
    expect(findingIds(verdict), "aşılan sınıf tavanı sessiz kaldı").toContain(
      "class-ceiling-exceeded",
    );
    expect(verdict.decision).toBe(DECISION.accepted);
    expect(decide(wireForNet(net), TIGHT_CLASS.id).decision, "kanıtsız aşım kabul edildi").toBe(
      DECISION.rejected,
    );
  });
});

describe("pr-size karar motoru — churn, brüt, dosya sayısı ve ölçülemeyen satır", () => {
  it("anlamsız silme bütçeye KREDİ yazmaz; ölçülen net ayrıca raporlanır", () => {
    const verdict = decide(zRow(10, 500, GOVERNED), TIGHT_CLASS.id, CHURN.requires);
    expect(verdict.measurement.measuredNet).toBe(-490);
    expect(verdict.measurement.budgetNet).toBe(CHURN.netCreditFloor);
    expect(verdict.measurement.grossDeletions).toBe(500);
    expect(findingIds(verdict)).toContain("net-credit-clamped");
  });

  it("küçük net + büyük brüt churn frenini tetikler ve kanonik kanıtını ister", () => {
    const wire = zRow(GROSS_MAX, GROSS_MAX, GOVERNED);
    const bare = decide(wire, TIGHT_CLASS.id);
    expect(bare.measurement.budgetNet, "net küçük görünüyor").toBe(CHURN.netCreditFloor);
    expect(bare.churnGuard).toMatchObject({ applies: true, tripped: true, grossMax: GROSS_MAX });
    expect(blockerIds(bare)).toContain("churn-gross-exceeded");
    expect(bare.evidence.required).toEqual([...CHURN.requires].sort());
    expect(bare.decision).toBe(DECISION.rejected);
    const reviewed = decide(wire, TIGHT_CLASS.id, CHURN.requires);
    expect(blockerIds(reviewed), "kanonik kanıt freni kapatmalı").toEqual([]);
    expect(findingIds(reviewed), "fren kaydı raporda kalmalı").toContain("churn-gross-exceeded");
    expect(reviewed.decision).toBe(DECISION.accepted);
  });

  it("brüt tavan İKİ YANLI sabitlenir: fren UYGULANIRKEN tam tavan tetiklemez, bir fazlası tetikler", () => {
    // Sınır ancak fren kapsamı AÇIKKEN sınırdır: `applies` false olsaydı `tripped` false olurdu
    // ve tavan hiç ölçülmemiş olurdu. Her iki durumda da kapsam açık, tek değişen brüt.
    const atCap = decide(wireAtGross(GROSS_MAX), TIGHT_CLASS.id);
    expect(atCap.measurement.gross, "brüt tam tavana oturmadı").toBe(GROSS_MAX);
    expect(atCap.churnGuard.applies, "durum vakumlu: fren zaten kapsam dışı").toBe(true);
    expect(atCap.churnGuard.tripped, "tavanın kendisi tetikledi").toBe(false);
    expect(blockerIds(atCap), "tetiklenmemiş fren blokladı").toEqual([]);
    expect(atCap.decision).toBe(DECISION.accepted);

    const overCap = decide(wireAtGross(GROSS_MAX + 1), TIGHT_CLASS.id);
    expect(overCap.measurement.gross, "brüt tavanın bir fazlasına oturmadı").toBe(GROSS_MAX + 1);
    expect(overCap.churnGuard.applies, "fren kapsam dışına düştü").toBe(true);
    expect(overCap.churnGuard.tripped, "bir fazlası tetiklemedi").toBe(true);
    expect(blockerIds(overCap)).toContain("churn-gross-exceeded");
  });

  it("fren KAPSAMI kendi kanonik bandından türer: taban da brüt bandı da değildir", () => {
    // Kapsam içi ama taban ÜSTÜ: kapsam `netCreditFloor`a çökmüş olsaydı fren hiç uygulanmazdı.
    const inside = decide(wireAtGross(GROSS_MAX + 1), TIGHT_CLASS.id, CHURN.requires);
    const net = inside.measurement.budgetNet;
    expect(net, "kapsam tabana çöktü").toBeGreaterThan(CHURN.netCreditFloor);
    expect(net, "kapsam bandı aşıldı").toBeLessThanOrEqual(SCOPE_MAX);
    expect(inside.churnGuard).toMatchObject({ applies: true, tripped: true });
    expect(inside.decision).toBe(DECISION.accepted);

    // Kapsamın bir üstü: brüt tavan aşılsa bile fren HİÇ uygulanmaz; kapsam brüt bandı olsaydı ederdi.
    const over = SCOPE_MAX + 1;
    const wire = wireForNet(over, churnFor(GROSS_MAX + 1, over));
    const above = decide(wire, WIDE_CLASS.id, MID.requires);
    expect(above.measurement.budgetNet).toBe(over);
    expect(above.measurement.gross, "brüt tavanı aşmadı").toBeGreaterThan(GROSS_MAX);
    expect(above.churnGuard.applies, "kapsam bandı brüt bandına kaydı").toBe(false);
    expect(above.churnGuard.tripped).toBe(false);
    expect(blockerIds(above), "kapsam dışında fren blokladı").toEqual([]);
  });

  it("fren tetiklenmemişken churn kanıtı istenmez", () => {
    const verdict = decide(wireForNet(1), TIGHT_CLASS.id, CHURN.requires);
    expect(verdict.churnGuard.tripped).toBe(false);
    expect(verdict.evidence.notRequired).toEqual([...CHURN.requires].sort());
    expect(blockerIds(verdict)).toContain("evidence-not-required");
  });

  it("dosya sayısı tavanı aşımı ayrı bir blokerdir", () => {
    const count = budget.maxChangedFiles + 1;
    const wire = Array.from({ length: count }, (_, i) => zRow(1, 0, `src/pkg/f${i}.ts`)).join("");
    const verdict = decide(wire, TIGHT_CLASS.id);
    expect(verdict.measurement.governedFiles).toBe(count);
    expect(verdict.measurement.maxChangedFiles).toBe(budget.maxChangedFiles);
    expect(blockerIds(verdict)).toEqual(["max-changed-files-exceeded"]);
    // Tavanın kendisi ihlal değildir; sessiz bir off-by-one bütçeyi bir dosya genişletirdi.
    const atCap = wire.slice(0, wire.lastIndexOf("\0", wire.length - 2) + 1);
    expect(blockerIds(decide(atCap, TIGHT_CLASS.id))).toEqual([]);
  });

  it("ölçülemeyen ikili satır 0 sayılmaz; bütçedeyse kabul yolunu kapatır", () => {
    const governedBinary = decide(zRow("-", "-", "public/logo.png"), TIGHT_CLASS.id);
    expect(governedBinary.binaryFiles).toEqual(["public/logo.png"]);
    expect(governedBinary.governedBinaryFiles).toEqual(["public/logo.png"]);
    expect(blockerIds(governedBinary)).toContain("binary-row-unmeasurable");
    expect(governedBinary.decision).toBe(DECISION.rejected);
    // Ayrı raporlanan kutudaki ikili satır bütçeyi ölçülemez yapmaz; yine de ADIYLA görünür.
    const reported = decide(zRow("-", "-", "public/data/seed.bin"), TIGHT_CLASS.id);
    expect(reported.binaryFiles).toEqual(["public/data/seed.bin"]);
    expect(reported.governedBinaryFiles).toEqual([]);
    expect(reported.decision).toBe(DECISION.accepted);
  });
});

describe("pr-size karar motoru — ayrı raporlanan kategoriler ve yol yazılışı", () => {
  it("generated/lock/mekanik kutuları bütçeden ayrı ve adlarıyla raporlanır", () => {
    const wire = [
      zRow(7, 0, "src/data/generated/nodes/a.json"),
      zRow(5, 0, "package-lock.json"),
      zRow(3, 0, "tools/platform-content/x.json"),
      zRow(9, 0, "dist/bundle.js"),
      zRow(1, 0, GOVERNED),
    ].join("");
    const verdict = decide(wire, TIGHT_CLASS.id);
    const byId = Object.fromEntries(verdict.categories.map((c: { id: string }) => [c.id, c]));
    expect(Object.keys(byId)).toEqual(budget.separatelyReported.map((c: { id: string }) => c.id));
    expect(byId.generated.grossAdditions).toBe(16);
    expect(byId.lockfile.grossAdditions).toBe(5);
    expect(byId["mechanical-projection"].grossAdditions).toBe(3);
    expect(verdict.measurement.grossAdditions, "kategori bütçeye sızdı").toBe(1);
    expect(verdict.totals.grossAdditions, "toplam muhasebe kapanmadı").toBe(25);
    // Ayrı raporlanan kutuya düşen KAYNAK KODU sessizce yutulmaz; adıyla görünür kalır.
    expect(byId.generated.sourceCodeFiles).toEqual(["dist/bundle.js"]);
    expect(findingIds(verdict)).toContain("source-code-in-reported-category");
  });

  it("ad içindeki TAB, satırsonu, Unicode ve ` => ` LİTERAL kalır; kategoriye kaçmaz", () => {
    const literal = ["x => dist/bundle.js", "src/a\tb.ts", "src/satır\nsonu.ts", "src/ç ğ 日本.ts"];
    const verdict = decide(literal.map((file) => zRow("-", "-", file)).join(""), TIGHT_CLASS.id);
    expect(verdict.governedBinaryFiles, "yol yazılışı değişti").toEqual(literal);
    expect(verdict.measurement.governedFiles, "satırsonu kaydı böldü").toBe(literal.length);
    for (const category of verdict.categories)
      expect(category.files, `${category.id}: kategoriye kaçtı`).toBe(0);
    // Rename tek dosyadır: kaynak yol ikinci kez sayılmaz.
    const renamed = decide(zRename(3, 1, "src/pkg/a.ts", "src/pkg/b.ts"), TIGHT_CLASS.id);
    expect(renamed.measurement.governedFiles).toBe(1);
    expect(renamed.measurement.measuredNet).toBe(2);
  });
});

describe("pr-size karar motoru — bozuk girdi karara dönüşmez", () => {
  it("bozuk NUL çerçevesi KISMİ ölçüm sızdırmaz", () => {
    const broken: Array<[string, string]> = [
      ["kapanmamış", `1\t0\t${GOVERNED}`],
      ["kesik rename", `1\t0\t\0${GOVERNED}\0`],
      ["rename boş yol", "1\t0\t\0\0src/b.ts\0"],
      ["fazladan çerçeve", `${zRow(1, 0, GOVERNED)}\0`],
      ["alan eksik", "1\t0\0"],
      ["gövde yok", `${GOVERNED}\0`],
      ["geçersiz sayı", zRow("0x10", 0, GOVERNED)],
    ];
    for (const [label, wire] of broken) {
      const verdict = decide(wire, TIGHT_CLASS.id);
      expect(verdict.error.id, label).toBe("measurement-input-invalid");
      expect(verdict.error.kind).toBe(KIND.input);
      expect(verdict, `${label}: kısmi ölçüm sızdı`).not.toHaveProperty("measurement");
      expect(JSON.stringify(verdict), `${label}: karar üretildi`).not.toMatch(/SPLIT|ACCEPTED/);
    }
    const unsafe = decide(zRow(9, 0, "../../etc/passwd"), TIGHT_CLASS.id);
    expect(unsafe.error.id).toBe("path-unsafe");
    expect(unsafe.error.kind).toBe(KIND.input);
  });

  it("string/Buffer olmayan girdi sınırda tip kapısına takılır", () => {
    // Çekirdek `String(x)` çağırır: nesne "[object Object]" diye ÖLÇÜLÜRDÜ; sınır bunu keser.
    for (const value of [{}, [zRow(1, 0, GOVERNED)], 5, null, undefined, new Uint8Array([0x31])]) {
      expect(engine.asNumstatZ(value), `geçmemeliydi: ${String(value)}`).toBeNull();
      const verdict = decide(value, TIGHT_CLASS.id);
      expect(verdict.error.id).toBe("numstat-z-not-bytes");
      expect(verdict.error.kind).toBe(KIND.input);
    }
    const wire = zRow(1, 0, GOVERNED);
    expect(engine.asNumstatZ(wire)).toBe(wire);
    expect(engine.asNumstatZ(Buffer.from(wire)), "Buffer teli reddedildi").toBe(wire);
    // UTF-8 olmayan bayt dizisi yolu sessizce değiştirmez; ölçülmez.
    expect(engine.asNumstatZ(Buffer.from([0x31, 0x09, 0x30, 0x09, 0xff, 0xfe, 0x00]))).toBeNull();
    expect(decide(Buffer.from(wire), TIGHT_CLASS.id).decision).toBe(DECISION.accepted);
  });
});

describe("pr-size karar motoru — kanonik config güvenilmezse karar üretilmez", () => {
  it("motor kanonik alanı İZLER: eşikler kaydırılırsa karar da kayar", () => {
    const shifted = clone();
    const step = 7;
    for (const band of shifted.bands) band.maxNet += step;
    for (const entry of shifted.classes) entry.maxNet += step;
    shifted.splitRequiredAboveNet += step;
    const net = LOW.maxNet + step;
    const inside = decide(wireForNet(net), TIGHT_CLASS.id, [], shifted);
    expect(inside.band.id, "motorda ikinci eşik kopyası var").toBe(LOW.id);
    expect(inside.decision).toBe(DECISION.accepted);
    expect(decide(wireForNet(net + 1), TIGHT_CLASS.id, [], shifted).band.id).toBe(MID.id);
    // Kanıt kimlikleri de kanoniktir: bant koşulu değişirse istenen kanıt da değişir.
    const renamed = clone();
    renamed.bands[1].requires = [CHURN.requires[0]];
    const verdict = decide(wireForNet(MID.maxNet), WIDE_CLASS.id, CHURN.requires, renamed);
    expect(verdict.decision, "kanıt kümesi motorda sabitlenmiş").toBe(DECISION.accepted);
  });

  it("kanonik sapma ölçüm/karar YERİNE adlandırılmış hata döndürür", () => {
    // biome-ignore lint/suspicious/noExplicitAny: mutasyonlar kanonik JSON kopyası üzerinde koşar.
    const mutations: Array<[string, (b: any) => unknown]> = [
      ["merdiven artmıyor", (b) => set(b.bands[2], { maxNet: b.bands[0].maxNet - 1 })],
      ["split eşiği kaydı", (b) => set(b, { splitRequiredAboveNet: b.splitRequiredAboveNet + 1 })],
      ["silmeye kredi", (b) => set(b.churnGuard, { netCreditFloor: -1000 })],
      ["brüt tavan bandı yok", (b) => set(b.churnGuard, { grossMaxFromBand: "uydurma" })],
      ["churn kapsam bandı yok", (b) => set(b.churnGuard, { appliesWhenNetAtOrBelowBand: "yok" })],
      ["churn kanıtı yok", (b) => set(b.churnGuard, { requires: [] })],
      ["sınıf tavanı türemiyor", (b) => set(b.classes[0], { maxNet: b.classes[0].maxNet + 1 })],
      ["bant kimliği tekrarlı", (b) => set(b.bands[1], { id: b.bands[0].id })],
      ["sınıf kimliği tekrarlı", (b) => set(b.classes[1], { id: b.classes[0].id })],
      ["dosya tavanı geçersiz", (b) => set(b, { maxChangedFiles: 0 })],
      ["kanıt tekrarlı", (b) => set(b.bands[1], { requires: [TOP_ONLY_REQ, TOP_ONLY_REQ] })],
      ["bant tavanı sayı değil", (b) => set(b.bands[0], { maxNet: "çok" })],
      ["bant listesi yok", (b) => set(b, { bands: [] })],
      ["sınıf listesi yok", (b) => set(b, { classes: [] })],
      ["kalıtım bayrağı boolean değil", (b) => set(b.bands[2], { [FLAG]: "evet" })],
      ["kalıtım bayrağı yok", (b) => set(b.bands[1], { [FLAG]: undefined })],
      ["churn kanıtı string değil", (b) => set(b.churnGuard, { requires: [{}] })],
      ["churn kanıtı boş kimlik", (b) => set(b.churnGuard, { requires: [""] })],
      ["churn kanıtı çift", (b) => set(b.churnGuard, { requires: [TOP_ONLY_REQ, TOP_ONLY_REQ] })],
      ["churn tabanı tavan üstü", (b) => set(b.churnGuard, { netCreditFloor: TOP.maxNet + 1 })],
    ];
    for (const [label, mutate] of mutations) {
      const config = clone();
      mutate(config);
      const verdict = decide(wireForNet(1), TIGHT_CLASS.id, [], config);
      expect(verdict.error.id, label).toBe("canonical-drift");
      expect(verdict.error.kind, label).toBe(KIND.config);
      expect(verdict.decision, `${label}: sapma karara dönüştü`).toBeNull();
      expect(verdict.error.detail, `${label}: sapma adlandırılmadı`).not.toBe("");
    }
    expect(decide(wireForNet(1), TIGHT_CLASS.id, [], clone()).ok, "klon reddedildi").toBe(true);
  });

  it("bozuk kategori sözleşmesi ölçüm YAPILMADAN config hatası verir", () => {
    const swallowed = clone();
    swallowed.separatelyReported[0].pathPrefixes.push("src/");
    const verdict = decide(zRow(900, 0, GOVERNED), TIGHT_CLASS.id, [], swallowed);
    expect(verdict.error.id).toBe("category-config-invalid");
    expect(verdict.error.kind).toBe(KIND.config);
    // Kaynak kodu TAM YOL olarak kategoriye gizlenemez; gizlenseydi bütçe dışına çıkardı.
    const hidden = clone();
    hidden.separatelyReported[0].paths.push(GOVERNED);
    expect(decide(zRow(900, 0, GOVERNED), TIGHT_CLASS.id, [], hidden).error.kind).toBe(KIND.config);
  });
});

describe("pr-size karar motoru — kararlı sözleşme ve ikinci eşik kopyası yokluğu", () => {
  it("aynı girdi aynı yapıyı üretir ve rapor anahtarları sabittir", () => {
    const first = decide(wireForNet(MID.maxNet), WIDE_CLASS.id, MID.requires);
    const second = decide(wireForNet(MID.maxNet), WIDE_CLASS.id, [...MID.requires].reverse());
    expect(JSON.stringify(second), "aynı girdi farklı rapor üretti").toBe(JSON.stringify(first));
    expect(Object.keys(first)).toEqual(
      // biome-ignore format: the machine-readable report contract stays one block for review
      ["schema", "ok", "decision", "band", "changeClass", "measurement", "churnGuard", "evidence",
        "categories", "totals", "binaryFiles", "governedBinaryFiles", "findings", "blockers"],
    );
    expect(Object.keys(decide(wireForNet(1), "uydurma-sınıf"))).toEqual([
      "schema",
      "ok",
      "decision",
      "error",
    ]);
    expect(first.schema).toBe(engine.REPORT_SCHEMA);
    expect(new Set(Object.values(DECISION)).size, "karar kimlikleri benzersiz değil").toBe(3);
    expect(new Set(Object.values(KIND)).size, "hata sınıfları benzersiz değil").toBe(3);
  });

  it("motor ne süreç sahiplenir ne kanonik eşik/bant kopyası taşır", () => {
    const source = read(ENGINE);
    // Süreç yüzeyi (argv, dosya, stdout, çıkış kodu) P2A-2c'nin işidir; motor SAF kalır.
    for (const owned of [/process\.exit/, /process\.argv/, /node:fs/, /writeAllSync/])
      expect(source, `motor süreç sahiplendi: ${owned}`).not.toMatch(owned);
    const numbers = new Set<number>([
      ...BANDS.map((b) => b.maxNet),
      ...CLASSES.map((c) => c.maxNet),
      budget.splitRequiredAboveNet,
      budget.maxChangedFiles,
    ]);
    for (const file of [ENGINE, SELF]) {
      const text = read(file);
      for (const value of numbers)
        expect(text, `${file}: eşik kopyası ${value}`).not.toMatch(new RegExp(`\\b${value}\\b`));
      for (const band of BANDS)
        expect(text, `${file}: bant kimliği ${band.id}`).not.toMatch(
          new RegExp(`\\b${band.id}\\b`),
        );
    }
  });

  it("kanonik kapı beyanı: kapı dosyası YAZILDI ama CI YOK, enforcement hâlâ YOK", () => {
    // Motor bir kapı değildir; kapı dosyasını P2A-2c yazdı, CI bağlantısını (P3) hâlâ kimse yazmadı.
    expect(budget.checker.status).toBe("implemented-not-wired");
    expect(budget.checker.blocks).toBe(false);
    expect(fs.existsSync(path.join(ROOT, budget.checker.path))).toBe(true);
  });
});
