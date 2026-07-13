import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// Rules v2 API — false-green sertleştirmesi (CPO mutation talebi, 2026-07-12):
// bütün-dosya muafiyeti KALDIRILDI; muafiyet scope'lu (inline-marker / section) + reason
// zorunlu; REQUIRED kararlar granular (prefix ailesi üye-bazlı, bounded-context iki-parçalı).
// Test-önce: bu dosya rules v2'den ÖNCE yazıldı; v1 implementasyonuyla KIRMIZI koşması
// bilinçlidir (mevcut kapının false-green olduğunun kanıtı). Yeşil, rules v2 teslimiyle gelir.
import * as rules from "../tools/lib/url-policy-rules.mjs";
import {
  EXEMPTIONS,
  FORBIDDEN_PATTERNS,
  INLINE_EXEMPT_MARKER,
  REQUIRED_DECISIONS,
  scanContentForViolations,
  scanDocsForViolations,
  scanSourceForViolations,
  verifyCanonicalDecisions,
  verifyCanonicalDecisionsContent,
} from "../tools/lib/url-policy-rules.mjs";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(DIRNAME, "../docs");
const URL_POLICY = path.join(DOCS, "url-policy.md");
const NODE_MD = path.join(DOCS, "node.md");
const README = path.join(DOCS, "README.md");
const SRC = path.resolve(DIRNAME, "../src");

const urlPolicyIcerik = () => fs.readFileSync(URL_POLICY, "utf8");
const nodeMdIcerik = () => fs.readFileSync(NODE_MD, "utf8");

const PREFIX_AILESI = [
  "p_",
  "usr_",
  "emp_",
  "org_",
  "co_",
  "inv_",
  "po_",
  "wo_",
  "prd_",
  "lst_",
  "rpt_",
] as const;

/** Code fence disindaki gercek Markdown basliklarini tam satir metniyle dondurur. */
function markdownBasliklari(icerik: string): string[] {
  const basliklar: string[] = [];
  let fenceKarakteri: "`" | "~" | null = null;
  for (const satir of icerik.split(/\r?\n/)) {
    const fence = satir.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      const karakter = fence[1][0] as "`" | "~";
      if (fenceKarakteri === null) fenceKarakteri = karakter;
      else if (fenceKarakteri === karakter) fenceKarakteri = null;
      continue;
    }
    if (fenceKarakteri === null && /^#{1,6}\s+\S/.test(satir)) basliklar.push(satir.trim());
  }
  return basliklar;
}

describe("URL-POLICY-1 kural seti bütünlüğü", () => {
  it("FORBIDDEN_PATTERNS dört yasak sınıfın id'lerini taşır", () => {
    const ids = FORBIDDEN_PATTERNS.map((p) => p.id);
    for (const beklenen of [
      "eski-tilde-grameri",
      "eski-ad-k-route-identity",
      "merkezi-resource-identity-tablosu",
      "node-id-kanonik-route",
    ])
      expect(ids, `yasak sınıf eksik: ${beklenen}`).toContain(beklenen);
    for (const p of FORBIDDEN_PATTERNS) {
      expect(p.pattern).toBeInstanceOf(RegExp);
      expect(p.reason.length).toBeGreaterThan(0);
    }
  });

  it("EXEMPT_FILES exportu KALDIRILDI — bütün-dosya muafiyeti yok", () => {
    expect((rules as Record<string, unknown>).EXEMPT_FILES).toBeUndefined();
  });

  it("EXEMPTIONS her kayıtta reason + kesin scope taşır; INLINE_EXEMPT_MARKER tanımlı", () => {
    expect(INLINE_EXEMPT_MARKER).toBe("url-policy-exempt");
    expect(EXEMPTIONS.length).toBeGreaterThan(0);
    for (const e of EXEMPTIONS) {
      expect(e.file.length).toBeGreaterThan(0);
      expect(e.reason.length, `${e.file}: muafiyet gerekçesiz olamaz`).toBeGreaterThan(0);
      expect(["inline-marker", "section"]).toContain(e.scope.kind);
      if (e.scope.kind === "section")
        expect((e.scope as { heading: string }).heading.length).toBeGreaterThan(0);
      expect(e.patternIds === "all" || Array.isArray(e.patternIds)).toBe(true);
    }
  });

  it("REQUIRED_DECISIONS zorunlu karar id'lerini taşır (granular yapı)", () => {
    const ids = REQUIRED_DECISIONS.map((d) => d.id);
    for (const beklenen of [
      "k-route-policy",
      "id-only-private-canonical",
      "public-grammar-ascii-slug",
      "ascii-first",
      "rfc-2119",
      "bounded-context-id-sahipligi",
      "route-definition-host-binding-projection",
      "prefix-ailesi",
    ])
      expect(ids, `zorunlu karar eksik: ${beklenen}`).toContain(beklenen);

    for (const karar of REQUIRED_DECISIONS) {
      expect(Array.isArray(karar.probes), `${karar.id}: probes dizisi zorunlu`).toBe(true);
      expect(karar.probes.length, `${karar.id}: en az bir granular probe zorunlu`).toBeGreaterThan(
        0,
      );
      for (const probe of karar.probes) {
        expect(probe.pattern, `${karar.id}: probe RegExp taşımıyor`).toBeInstanceOf(RegExp);
        expect(probe.missingId.length, `${karar.id}: probe missingId taşımıyor`).toBeGreaterThan(0);
      }
    }

    const prefixKarari = REQUIRED_DECISIONS.find((d) => d.id === "prefix-ailesi");
    expect(prefixKarari).toBeDefined();
    const prefixMissingIds = prefixKarari?.probes.map((probe) => probe.missingId) ?? [];
    for (const uye of PREFIX_AILESI)
      expect(prefixMissingIds, `prefix için granular probe eksik: ${uye}`).toContain(
        `prefix-ailesi:${uye}`,
      );

    const boundedContextKarari = REQUIRED_DECISIONS.find(
      (d) => d.id === "bounded-context-id-sahipligi",
    );
    expect(boundedContextKarari?.probes.length).toBeGreaterThanOrEqual(2);
  });
});

describe("URL-POLICY-2 mutation testleri — kapı bu mutasyonlarda KIRMIZI olmalı", () => {
  it("M1 — url-policy.md içine aktif /node/123 kararı eklenirse ihlal üretir", () => {
    const mutated = `${urlPolicyIcerik()}\n\nKanonik route: /node/123 kullanılır.\n`;
    const v = scanContentForViolations(mutated, "url-policy.md");
    expect(v.some((x) => x.patternId === "node-id-kanonik-route")).toBe(true);
  });

  it("M2 — url-policy.md içine slug~typedId canonical kararı eklenirse ihlal üretir", () => {
    const mutated = `${urlPolicyIcerik()}\n\ncanonical: /hrms/people/ahmet-kara~p_01K2M8X7 desenini kullan.\n`;
    const v = scanContentForViolations(mutated, "url-policy.md");
    expect(v.some((x) => x.patternId === "eski-tilde-grameri")).toBe(true);
  });

  it("M2-kontrol — mutasyonsuz url-policy.md temizdir (reddiye satırı scope'lu muaf)", () => {
    expect(scanContentForViolations(urlPolicyIcerik(), "url-policy.md")).toEqual([]);
  });

  it("M3 — prefix ailesinden lst_ (veya po_) silinirse verifyCanonicalDecisions kırmızı", () => {
    const icerik = urlPolicyIcerik();
    const lstSiz = icerik
      .split("\n")
      .filter((l) => !/\blst_/.test(l))
      .join("\n");
    expect(verifyCanonicalDecisionsContent(lstSiz).missing).toContain("prefix-ailesi:lst_");

    const poSuz = icerik
      .split("\n")
      .filter((l) => !/\bpo_/.test(l))
      .join("\n");
    expect(verifyCanonicalDecisionsContent(poSuz).missing).toContain("prefix-ailesi:po_");
  });

  it("M4 — public grammar'daki {asciiSlug} başka segmentle değiştirilirse kırmızı", () => {
    const mutated = urlPolicyIcerik().replaceAll("{asciiSlug}", "{serbestSlug}");
    const sonuc = verifyCanonicalDecisionsContent(mutated);
    expect(sonuc.ok).toBe(false);
    expect(sonuc.missing).toContain("public-grammar-ascii-slug");
  });

  it("M5a — merkezi resource_identity tablosu YASAKTIR hükmü silinirse kırmızı", () => {
    const yasaksiz = urlPolicyIcerik()
      .split("\n")
      .filter((l) => !l.includes("YASAKTIR"))
      .join("\n");
    expect(verifyCanonicalDecisionsContent(yasaksiz).missing).toContain(
      "bounded-context-id-sahipligi",
    );
  });

  it("M5b — bounded-context public ID sahiplik cümlesi silinirse kırmızı", () => {
    const sahipsiz = urlPolicyIcerik()
      .split("\n")
      .filter((l) => !l.includes("bounded context'lerinde üretir"))
      .join("\n");
    expect(verifyCanonicalDecisionsContent(sahipsiz).missing).toContain(
      "bounded-context-id-sahipligi",
    );
  });

  it("M6 — node.md'de tarihsel bölümler DIŞINA /node/42 önerisi eklenirse kırmızı; mevcut hali temiz", () => {
    // Kontrol: gerçek node.md temiz (tarihsel /node/ örnekleri section-scope muafiyetinde)
    expect(scanContentForViolations(nodeMdIcerik(), "node.md")).toEqual([]);
    // Mutasyon: muaf olmayan YENİ bölüme aktif öneri
    const mutated = `${nodeMdIcerik()}\n\n## 15. Yeni öneri\n\nKanonik route /node/42 olsun.\n`;
    const v = scanContentForViolations(mutated, "node.md");
    expect(v.some((x) => x.patternId === "node-id-kanonik-route")).toBe(true);
  });
});

describe("URL-POLICY-3 gerçek repo taraması — iki dosya da taranır, muafiyet scope'lu", () => {
  it("docs katmanında ihlal yok (url-policy.md ve node.md DAHİL)", () => {
    const v = scanDocsForViolations(DOCS);
    expect(v, JSON.stringify(v, null, 1)).toEqual([]);
  });

  it("src JSON/TS/TSX katmanında eski veya reddedilmiş URL kararı yoktur", () => {
    const v = scanSourceForViolations(SRC);
    expect(v, JSON.stringify(v, null, 1)).toEqual([]);
  });
});

describe("URL-POLICY-4 kanonik kararların varlığı", () => {
  it("url-policy.md tüm zorunlu kararları taşır (prefix ailesi 11/11 dahil)", () => {
    const sonuc = verifyCanonicalDecisions(URL_POLICY);
    expect(sonuc.missing).toEqual([]);
    expect(sonuc.ok).toBe(true);
  });

  it("prefix ailesinin 11 üyesi belgede tek tek mevcut", () => {
    const icerik = urlPolicyIcerik();
    for (const uye of PREFIX_AILESI) expect(icerik, `prefix eksik: ${uye}`).toContain(uye);
  });
});

describe("URL-POLICY-5 çapraz hizalama", () => {
  it("node.md stub'ı url-policy.md ve k-route-policy'ye işaret eder", () => {
    const icerik = nodeMdIcerik();
    expect(icerik).toContain("url-policy.md");
    expect(icerik).toContain("k-route-policy");
  });

  it("docs/README.md url-policy kaydı içerir", () => {
    expect(fs.readFileSync(README, "utf8")).toContain("url-policy");
  });
});

describe("URL-POLICY-6 muafiyet disiplini", () => {
  it("section muafiyetlerinin her heading'i ilgili dosyada gerçekten vardır (hayalet muafiyet yasak)", () => {
    for (const e of EXEMPTIONS) {
      if (e.scope.kind !== "section") continue;
      const dosya = path.join(DOCS, e.file);
      expect(fs.existsSync(dosya), `muafiyet dosyası yok: ${e.file}`).toBe(true);
      const icerik = fs.readFileSync(dosya, "utf8");
      const heading = (e.scope as { heading: string }).heading;
      expect(
        markdownBasliklari(icerik),
        `${e.file}: code fence dışında gerçek başlık olmayan hayalet muafiyet "${heading}"`,
      ).toContain(heading);
    }
  });

  it("inline marker satır-bazlıdır: marker'lı satır muaf, marker'sız kopyası ihlal", () => {
    const markerli = `eski gramer alıntısı: slug~typedId <!-- ${INLINE_EXEMPT_MARKER}: tarihsel alıntı -->`;
    const markersiz = "eski gramer alıntısı: /x/ahmet-kara~p_01K2M8X7 kullan";
    expect(scanContentForViolations(markerli, "url-policy.md")).toEqual([]);
    const v = scanContentForViolations(markersiz, "url-policy.md");
    expect(v.some((x) => x.patternId === "eski-tilde-grameri")).toBe(true);
  });
});
