import { createHash } from "node:crypto";
import {
  MasterComponentRegistrySchema,
  TaskNodeSchema,
  UiArtifactRoleSchema,
  UiDeliverySchema,
} from "@/schemas";
import { describe, expect, it } from "vitest";
// Kapı + vitest aynı modülü kullanır (dimension-semantics deseni).
import {
  classifyUiImpact,
  deriveUiArtifactRole,
  evaluateUiDeliveryGate,
  validateUiDelivery,
  verifyBaselineIntegrity,
} from "../tools/lib/ui-impact.mjs";

/**
 * SB-ROOT (docs/storybook-root-integration-gap-report.md §3/§8/§9) —
 * kök-entegrasyon kapanışı, KOORDİNASYON SPEC v3:
 *
 *   A/P0.3  uiArtifactRole modeli — "UI hakkında konuşan" ile "UI üreten" ayrılır
 *   B/§3    classifier v3 + gold dataset — kelime geçirmek != UI üretmek
 *   C-D/P0.6 gate adaylık daraltması + MIGRATION_INCOMPLETE — sıfır sözleşmeli
 *            corpus hiçbir koşulda PASS vermez, warnings PASS'i aklayamaz
 *   E/P0.4  ratchet bütünlük guard'ı — baseline'a yeni ID eklemek delinemez olur
 *   F/P1.1-2 Master Component registry FK — serbest string referans biter
 *   G/P0.2  belge/JSON/Zod/gate alan paritesi
 *
 * Test-önce: bu dosya v3 implementasyonundan ÖNCE yazıldı. deriveUiArtifactRole,
 * verifyBaselineIntegrity, UiArtifactRoleSchema ve MasterComponentRegistrySchema
 * henüz mevcut değildir — dosyanın KIRMIZI koşması bilinçli ve istenen davranıştır
 * (kırmızı kanıtı ana oturum/CI kaydında).
 */

type UiRol = "produces-ui" | "changes-ui-contract" | "governs-ui" | "consumes-ui" | "no-ui";

/**
 * Kırmızı-faz tip köprüsü (SB-GOV deseni): v3 dönüş biçimleri ve yeni imzalar
 * implementasyondan önce tip bildirimlerinde yoktur; typecheck'i tek noktada
 * daraltmak için çağrılar/sonuçlar bu görünümlere cast edilir. v3 implementasyonu
 * tipleri sağlayınca köprü kaldırılabilir.
 */
type RolKarari = {
  role: UiRol;
  source: "declared" | "registry" | "heuristic";
  signals: unknown[];
};
type KapiSonucuV3 = {
  result: string;
  candidates: number;
  violations: string[];
  warnings: string[];
  reviewPending: string[];
  migration: { decided: number; undecided: number };
};
type ButunlukSonucu = { ok: boolean; problems: string[] };

const rolKarari = (x: unknown): RolKarari => x as RolKarari;
const butunluk = (x: unknown): ButunlukSonucu => x as ButunlukSonucu;
const rolluDugum = (x: unknown): { uiArtifactRole?: string } => x as { uiArtifactRole?: string };
const turet = deriveUiArtifactRole as unknown as (
  node: unknown,
  registry?: Record<string, string>,
) => unknown;
const kapiV3 = evaluateUiDeliveryGate as unknown as (
  nodes: unknown[],
  baseline?: unknown,
  opts?: unknown,
) => KapiSonucuV3;
const dogrulaV3 = validateUiDelivery as unknown as (
  node: unknown,
  registry?: { masterComponents: Set<string> },
) => string[];
const rolSemasi = UiArtifactRoleSchema as unknown as { parse: (x: unknown) => UiRol };
const registrySemasi = MasterComponentRegistrySchema as unknown as {
  parse: (x: unknown) => Record<string, unknown>;
};

const sha256Hex = (metin: string): string => createHash("sha256").update(metin).digest("hex");

const UI_ROLLERI = [
  "produces-ui",
  "changes-ui-contract",
  "governs-ui",
  "consumes-ui",
  "no-ui",
] as const;

const base = { id: "kok-dugum", level: "component", title: "kok", slug: "kok" } as const;

const CEKIRDEK_STATES = [
  "default",
  "hover",
  "focus-visible",
  "disabled",
  "loading",
  "empty",
  "error",
] as const;

/**
 * Violation'sız, approved, tam produces-ui sözleşmesi: 7 state x 3 viewport x
 * 3 locale x 2 theme = 126 kombinasyon, bütçe 200 (U0 temiz); approved üçlüsü
 * reviewer + storybookUrl + ownerRef taşır (S14.6/U24 temiz); görsel evidence
 * boş olduğundan baselineGovernance üçlüsü tetiklenmez (U2 temiz).
 */
const tamUretimSozlesmesi = {
  impact: "master-component",
  applies: true,
  reason: "Ortak MoneyInput API'si değişiyor",
  componentKind: "master",
  masterComponentRefs: ["mc.money-input"],
  storyRefs: ["packages/ui/src/money-input/MoneyInput.stories.tsx"],
  requiredStoryStates: [...CEKIRDEK_STATES],
  requiredViewports: ["sm", "md", "lg"],
  requiredLocales: ["tr", "en", "pseudo"],
  requiredThemes: ["light", "dark"],
  interactionTestRefs: ["MoneyInput.interaction"],
  a11yTestRefs: ["MoneyInput.a11y"],
  visualEvidenceRefs: [],
  e2eRefs: [],
  storybookUrl: "https://storybook.example.com/main",
  reviewStatus: "approved",
  reviewer: "design-system-owner",
  coverageBudget: {
    maxStories: 200,
    justification: "Master tam matrisi 126 kombinasyon üretir; bütçe bilinçli genişletildi",
  },
  ownerRef: "team-payments",
} as const;

/** Heuristik governs örneği: ADR belgesi Storybook'tan söz eder ama UI ÜRETMEZ. */
const adrDugumu = {
  ...base,
  id: "adr-1",
  title: "ADR-0002 Storybook kararı",
  tags: ["adr"],
} as const;

/** Governs işareti taşımayan, düz produces-ui metinli üretim düğümü. */
const uretimDugumu = (id: string, ekstra: Record<string, unknown> = {}) => ({
  ...base,
  id,
  title: "Müşteri liste ekranı tablo kolonu ekle",
  summary: "Yeni form ekranı ve tablo görünümü",
  ...ekstra,
});

/** changes-ui-contract örneği: governs kelimesi TITLE/TAGS'te değil summary'dedir. */
const sozlesmeDegisimiDugumu = (id: string) => ({
  ...base,
  id,
  title: "Backend validator güncellemesi",
  summary: "Hata kodu sözleşmesi değişiyor; form field mapping güncellenecek.",
  tags: ["backend"],
});

// ─────────────────────────────────────────────────────────────────────────────
// SPEC A — uiArtifactRole şema modeli
// ─────────────────────────────────────────────────────────────────────────────
describe("SB-ROOT-1 uiArtifactRole", () => {
  it("UiArtifactRoleSchema beş kanonik rolü kabul eder; sözlük dışı değeri reddeder", () => {
    for (const rol of UI_ROLLERI) {
      expect(rolSemasi.parse(rol)).toBe(rol);
    }
    for (const bozuk of ["ui-uretir", "produces_ui", "governs", ""]) {
      expect(() => rolSemasi.parse(bozuk)).toThrow();
    }
  });

  it("TaskNode uiArtifactRole beyanı taşır; geçersiz değer reddedilir; alan verilmezse undefined (lazy)", () => {
    for (const rol of UI_ROLLERI) {
      const beyanli = rolluDugum(TaskNodeSchema.parse({ ...base, uiArtifactRole: rol }));
      expect(beyanli.uiArtifactRole).toBe(rol);
    }
    expect(() =>
      TaskNodeSchema.parse({ ...base, uiArtifactRole: "ui-hakkinda-konusur" }),
    ).toThrow();
    // lazy migration: alan verilmemiş eski düğüm hâlâ parse olur, rol undefined kalır
    expect(rolluDugum(TaskNodeSchema.parse(base)).uiArtifactRole).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SPEC B — deriveUiArtifactRole classifier v3 + gold dataset
// ─────────────────────────────────────────────────────────────────────────────
describe("SB-ROOT-2 classifier gold dataset", () => {
  const GOLD_DATASET = [
    {
      ad: "a: ADR belgesi Storybook dese bile governs-ui olur, UI üreticisi sayılmaz",
      dugum: adrDugumu,
      beklenenRol: "governs-ui",
      beklenenKaynak: "heuristic",
    },
    {
      ad: "b: müşteri liste ekranı tablo kolonu produces-ui olur",
      dugum: { ...base, id: "gold-b-tablo", title: "Müşteri liste ekranı tablo kolonu ekle" },
      beklenenRol: "produces-ui",
      beklenenKaynak: "heuristic",
    },
    {
      ad: "c: hata kodu sözleşmesi + form field mapping changes-ui-contract olur",
      dugum: sozlesmeDegisimiDugumu("gold-c-kontrat"),
      beklenenRol: "changes-ui-contract",
      beklenenKaynak: "heuristic",
    },
    {
      ad: "d: append-only audit index migration no-ui olur",
      dugum: {
        ...base,
        id: "gold-d-arka",
        title: "Audit index migration",
        summary: "Append-only audit index migration; API shape değişmez.",
        tags: ["backend", "migration"],
      },
      beklenenRol: "no-ui",
      beklenenKaynak: "heuristic",
    },
    {
      ad: "e: standart etiketli UI bileşen standardı governs-ui olur",
      dugum: { ...base, id: "gold-e-standart", title: "UI bileşen standardı", tags: ["standart"] },
      beklenenRol: "governs-ui",
      beklenenKaynak: "heuristic",
    },
    {
      ad: "f: beyanlı consumes-ui heuristik produces sinyalini ezer (declared kazanır)",
      dugum: {
        ...base,
        id: "gold-f-beyan",
        title: "Müşteri liste ekranı tablo kolonu ekle",
        uiArtifactRole: "consumes-ui",
      },
      beklenenRol: "consumes-ui",
      beklenenKaynak: "declared",
    },
    {
      ad: "g: registry kaydı heuristik ne derse desin kazanır",
      dugum: { ...base, id: "gold-g-kayit", title: "Müşteri liste ekranı tablo kolonu ekle" },
      registry: { "gold-g-kayit": "no-ui" },
      beklenenRol: "no-ui",
      beklenenKaynak: "registry",
    },
    {
      ad: "h: dashboard surface kompozisyonu produces-ui olur",
      dugum: {
        ...base,
        id: "gold-h-surface",
        title: "Dashboard surface kompozisyonu",
        summary: "Dashboard surface kompozisyonu yeniden düzenlenir.",
        tags: ["surface"],
      },
      beklenenRol: "produces-ui",
      beklenenKaynak: "heuristic",
    },
  ] as const;

  for (const ornek of GOLD_DATASET) {
    it(`GOLD ${ornek.ad}`, () => {
      const registry = (ornek as { registry?: Record<string, string> }).registry;
      const karar = rolKarari(turet(ornek.dugum, registry));
      expect(karar.role).toBe(ornek.beklenenRol);
      expect(karar.source).toBe(ornek.beklenenKaynak);
      expect(Array.isArray(karar.signals)).toBe(true);
    });
  }

  it("öncelik sırası — beyan registry'yi, registry heuristiği ezer", () => {
    const cakismali = {
      ...base,
      id: "oncelik-1",
      title: "Müşteri liste ekranı tablo kolonu ekle",
      uiArtifactRole: "consumes-ui",
    };
    const beyanKazanir = rolKarari(turet(cakismali, { "oncelik-1": "no-ui" }));
    expect(beyanKazanir.role).toBe("consumes-ui");
    expect(beyanKazanir.source).toBe("declared");

    const kayitli = { ...base, id: "oncelik-2", title: "Müşteri liste ekranı tablo kolonu ekle" };
    const registryKazanir = rolKarari(turet(kayitli, { "oncelik-2": "governs-ui" }));
    expect(registryKazanir.role).toBe("governs-ui");
    expect(registryKazanir.source).toBe("registry");
  });

  it("heuristik classifyUiImpact zeminiyle hizalıdır — indirect→changes, none→no-ui", () => {
    expect(classifyUiImpact(sozlesmeDegisimiDugumu("hiza-indirect")).impact).toBe("indirect");
    expect(
      classifyUiImpact({
        ...base,
        id: "hiza-none",
        title: "Audit index migration",
        summary: "Append-only audit index migration; API shape değişmez.",
        tags: ["backend", "migration"],
      }).impact,
    ).toBe("none");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SPEC C + D — gate v3: adaylık daraltması ve MIGRATION_INCOMPLETE sonucu
// ─────────────────────────────────────────────────────────────────────────────
describe("SB-ROOT-3 gate adaylık + MIGRATION_INCOMPLETE", () => {
  it("governs/consumes/no-ui aday değildir — ADR Storybook dese bile aday sayılmaz", () => {
    const r = kapiV3(
      [
        adrDugumu,
        {
          ...base,
          id: "tuketici-1",
          title: "Müşteri liste ekranı tablo kolonu ekle",
          uiArtifactRole: "consumes-ui",
        },
        {
          ...base,
          id: "arka-1",
          title: "Audit index migration",
          summary: "Append-only audit index migration; API shape değişmez.",
          tags: ["backend"],
        },
      ],
      { allowedWarnings: [] },
    );
    expect(r.candidates).toBe(0);
    expect(r.violations).toEqual([]);
    // adr-1 ve arka-1 açık karar taşımaz → dürüst sonuç MIGRATION_INCOMPLETE'tir, FAIL/PASS değil
    expect(r.result).toBe("MIGRATION_INCOMPLETE");
  });

  it("produces-ui ve changes-ui-contract adaydır; baseline dışı sözleşmesiz aday FAIL verir", () => {
    const uretim = kapiV3([uretimDugumu("aday-uretim")], { allowedWarnings: [] });
    expect(uretim.candidates).toBe(1);
    expect(uretim.result).toBe("FAIL");

    const kontrat = kapiV3([sozlesmeDegisimiDugumu("aday-kontrat")], { allowedWarnings: [] });
    expect(kontrat.candidates).toBe(1);
    expect(kontrat.result).toBe("FAIL");
  });

  it("FAIL önceliklidir — kararsız düğümler gerçek ihlali gizleyemez", () => {
    const r = kapiV3([uretimDugumu("kirik-1"), adrDugumu], { allowedWarnings: [] });
    expect(r.result).toBe("FAIL");
  });

  it("kararsız corpus asla PASS vermez — produces tam sözleşmeli olsa bile MIGRATION_INCOMPLETE", () => {
    const r = kapiV3([adrDugumu, uretimDugumu("uretim-tam", { uiDelivery: tamUretimSozlesmesi })], {
      allowedWarnings: [],
    });
    expect(r.violations).toEqual([]);
    // PASS DEĞİL: adr-1 beyansız/registry'siz/uiDelivery'siz → açık-kararsız
    expect(r.result).toBe("MIGRATION_INCOMPLETE");
    expect(r.migration).toMatchObject({ decided: 1, undecided: 1 });
  });

  it("warnings PASS'i aklayamaz — legacy baseline'lı corpus MIGRATION_INCOMPLETE verir", () => {
    // Düğüm beyanla açık-kararlıdır; tek engel legacy warning'dir → warnings>0 dalını izole eder.
    const r = kapiV3([uretimDugumu("legacy-1", { uiArtifactRole: "produces-ui" })], {
      allowedWarnings: ["legacy-1"],
    });
    expect(r.violations).toEqual([]);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.result).toBe("MIGRATION_INCOMPLETE");
  });

  it("in-review kararsızlıktan önce gelir — REVIEW_REQUIRED döner", () => {
    const r = kapiV3(
      [
        uretimDugumu("uretim-rev", {
          uiDelivery: { ...tamUretimSozlesmesi, reviewStatus: "in-review" },
        }),
        adrDugumu,
      ],
      { allowedWarnings: [] },
    );
    expect(r.result).toBe("REVIEW_REQUIRED");
  });

  it("tüm düğümler açık kararlı + sıfır warning → PASS; migration sayacı bunu kanıtlar", () => {
    const r = kapiV3(
      [
        { ...adrDugumu, uiArtifactRole: "governs-ui" },
        uretimDugumu("uretim-pass", {
          uiArtifactRole: "produces-ui",
          uiDelivery: tamUretimSozlesmesi,
        }),
      ],
      { allowedWarnings: [] },
    );
    expect(r.result).toBe("PASS");
    expect(r.candidates).toBe(1);
    expect(r.migration).toMatchObject({ decided: 2, undecided: 0 });
  });

  it("registry kaydı açık karar sayılır — aynı corpus opts.roleRegistry ile PASS'e döner", () => {
    const corpus = [adrDugumu, uretimDugumu("uretim-reg", { uiDelivery: tamUretimSozlesmesi })];
    expect(kapiV3(corpus, { allowedWarnings: [] }).result).toBe("MIGRATION_INCOMPLETE");

    const r = kapiV3(
      corpus,
      { allowedWarnings: [] },
      { roleRegistry: { [adrDugumu.id]: "governs-ui" } },
    );
    expect(r.result).toBe("PASS");
    expect(r.migration).toMatchObject({ decided: 2, undecided: 0 });
  });

  it("hiç düğüm yoksa NO_CANDIDATES döner", () => {
    const r = kapiV3([], { allowedWarnings: [] });
    expect(r.result).toBe("NO_CANDIDATES");
    expect(r.candidates).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SPEC E — ratchet bütünlük guard'ı (baseline bypass'ı teknik olarak kapatır)
// ─────────────────────────────────────────────────────────────────────────────
describe("SB-ROOT-4 ratchet guard", () => {
  const kokIhlaller = ["legacy-1", "legacy-2", "legacy-3"];
  const temizTaban = {
    originChecksum: sha256Hex(JSON.stringify(kokIhlaller)),
    originAllowedWarnings: [...kokIhlaller],
    allowedWarnings: ["legacy-1", "legacy-3"],
    owner: "migration-sahibi",
    deadline: "2026-09-01",
    wave: 1,
  };

  it("temiz taban — alt-küme + doğru checksum ok verir (azalma serbest)", () => {
    const azalmis = butunluk(verifyBaselineIntegrity(temizTaban));
    expect(azalmis.ok).toBe(true);
    expect(azalmis.problems).toEqual([]);
    // eşit küme de alt-kümedir: henüz azalmamış taban da temizdir
    const esit = butunluk(
      verifyBaselineIntegrity({ ...temizTaban, allowedWarnings: [...kokIhlaller] }),
    );
    expect(esit.ok).toBe(true);
  });

  it("yeni id eklenmiş taban RATCHET_TAMPERED problemiyle reddedilir", () => {
    const kurcalanmis = butunluk(
      verifyBaselineIntegrity({
        ...temizTaban,
        allowedWarnings: [...kokIhlaller, "yeni-ihlal-99"],
      }),
    );
    expect(kurcalanmis.ok).toBe(false);
    const metin = kurcalanmis.problems.join("\n");
    expect(metin).toMatch(/RATCHET_TAMPERED/);
    expect(metin).toMatch(/yeni-ihlal-99/);
  });

  it("checksum bozuk taban reddedilir — origin listesi oynanamaz", () => {
    const bozukChecksum = butunluk(
      verifyBaselineIntegrity({
        ...temizTaban,
        originChecksum: sha256Hex(JSON.stringify(["oynanmis-kok"])),
      }),
    );
    expect(bozukChecksum.ok).toBe(false);
    expect(bozukChecksum.problems.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SPEC F + G — Master Component registry FK ve belge-şema alan paritesi
// ─────────────────────────────────────────────────────────────────────────────
describe("SB-ROOT-5 registry FK + parite", () => {
  const masterKayit = {
    id: "mc.money-input",
    owner: "team-payments",
    package: "@ui/money-input",
    source: "packages/ui/src/money-input/MoneyInput.tsx",
    version: "1.4.0",
    maturity: "stable",
  };

  const fkDugumu = (id: string, refs: string[]) =>
    uretimDugumu(id, { uiDelivery: { ...tamUretimSozlesmesi, masterComponentRefs: refs } });

  it("MasterComponentRegistrySchema kimlik alanlı kaydı parse eder; boş id reddedilir", () => {
    const parsed = registrySemasi.parse(masterKayit);
    expect(parsed.id).toBe("mc.money-input");
    expect(parsed.owner).toBe("team-payments");
    expect(parsed.package).toBe("@ui/money-input");
    expect(parsed.source).toBe("packages/ui/src/money-input/MoneyInput.tsx");
    expect(parsed.version).toBe("1.4.0");
    expect(parsed.maturity).toBe("stable");
    expect(() => registrySemasi.parse({ ...masterKayit, id: "" })).toThrow();
  });

  it("FK — registry set'inde olmayan masterComponentRef 'kayıtsız master component' ihlali üretir", () => {
    const ihlaller = dogrulaV3(fkDugumu("fk-hayalet", ["mc.money-input", "mc.hayalet-input"]), {
      masterComponents: new Set(["mc.money-input"]),
    });
    const metin = ihlaller.join("\n");
    expect(metin).toMatch(/kayıtsız master component/);
    expect(metin).toMatch(/mc\.hayalet-input/);
    // kayıtlı referanslar aynı registry ile temiz geçer
    expect(
      dogrulaV3(fkDugumu("fk-temiz", ["mc.money-input"]), {
        masterComponents: new Set(["mc.money-input"]),
      }),
    ).toEqual([]);
  });

  it("GERİYE UYUM — registry parametresi verilmezse FK denetimi atlanır", () => {
    // Mevcut tek-parametreli çağrılar kırılmaz: hayalet ref registry'siz ihlal üretmez.
    expect(dogrulaV3(fkDugumu("fk-uyum", ["mc.money-input", "mc.hayalet-input"]))).toEqual([]);
  });

  it("belge-şema paritesi — ilan edilen governance alanlarının tamamı parse çıktısında tanımlıdır", () => {
    const PARITE_ALANLARI = [
      "riskClass",
      "dataDense",
      "ownerRef",
      "coverageBudget",
      "fixtureContract",
      "securityLinkage",
      "baselineGovernance",
      "manualA11yReviewRef",
      "performanceProfileRef",
      "breakGlass",
    ] as const;
    const tamGovernanceSozlesmesi = {
      ...tamUretimSozlesmesi,
      riskClass: "medium",
      dataDense: false,
      fixtureContract: {
        fingerprintRef: "fixtures/money-input.fingerprint.json",
        sanitized: true,
        containsRealData: false,
      },
      securityLinkage: { permissionStoryRefs: [], backendAuthzTestRefs: [] },
      baselineGovernance: { approvedBy: "", reason: "", taskRef: "" },
      manualA11yReviewRef: "docs/reviews/money-input-manuel-a11y.md",
      performanceProfileRef: "",
      breakGlass: { used: false, auditRef: "", remediationTaskRef: "" },
    };
    const parsed = UiDeliverySchema.parse(tamGovernanceSozlesmesi) as unknown as Record<
      string,
      unknown
    >;
    for (const alan of PARITE_ALANLARI) {
      expect(
        parsed[alan],
        `${alan} şema çıktısında tanımsız — belge/şema paritesi kırık`,
      ).toBeDefined();
    }
  });
});
