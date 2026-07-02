import fs from "node:fs";
import path from "node:path";
import type { TaskNode } from "@/schemas";
import { describe, expect, it } from "vitest";
// Kural kaynağı TEK: kapı (check-dimension-semantics.mjs) ile aynı modül — drift imkânsız.
import {
  SEMANTIC_KEYS,
  SEMANTIC_RULES,
  evaluateDimensionSemantics,
  nodeSemanticViolations,
} from "../../tools/lib/dimension-semantics.mjs";

/**
 * Semantik boyut sözleşmesi (tur 2) — "2-5 madde" biçim kapısının üstüne ANLAM kapısı:
 * dolu dataLifecycle retention'sız, dolu observability SLO'suz, dolu reliability
 * idempotency'siz olamaz. Boş/iskelet boyut zorlanmaz (lazy migration).
 */

const NODES = path.resolve(process.cwd(), "src/data/generated/nodes");

const dim = (key: string, items: string[]) => ({
  key,
  title: key,
  status: "filled",
  items,
  notes: "",
  prompt: "",
  provenance: "human",
});

describe("semantik kural sözleşmesi (fixture)", () => {
  it("kavram taşıyan observability içeriği geçer", () => {
    const d = dim("observability", [
      "Sipariş akışı için SLO hedefi p99 < 400ms; error-budget %1",
      "Webhook arızasında runbook: belirti → teşhis → müdahale",
    ]);
    expect(evaluateDimensionSemantics("observability", d).ok).toBe(true);
  });

  it("jenerik observability içeriği kalır (kavram yok)", () => {
    const d = dim("observability", ["İzleme yapılır", "Loglara bakılır ve raporlanır"]);
    const r = evaluateDimensionSemantics("observability", d);
    expect(r.ok).toBe(false);
    expect(r.missing).toContain("SLI/SLO/error-budget");
  });

  it("retention'sız dataLifecycle kalır, retention+DSAR geçer", () => {
    expect(
      evaluateDimensionSemantics(
        "dataLifecycle",
        dim("dataLifecycle", ["Veriler düzenli temizlenir", "Arşive taşınır"]),
      ).ok,
    ).toBe(false);
    expect(
      evaluateDimensionSemantics(
        "dataLifecycle",
        dim("dataLifecycle", [
          "İletişim kayıtları retention: 24 ay, sonra anonimleştirme (DSAR uyumlu)",
          "Aylık restore tatbikatı; migration append-only",
        ]),
      ).ok,
    ).toBe(true);
  });

  it("idempotency'siz reliability kalır", () => {
    const r = evaluateDimensionSemantics(
      "reliability",
      dim("reliability", ["Hatalar yakalanır", "Sistem sağlamdır ve loglanır"]),
    );
    expect(r.ok).toBe(false);
  });

  it("miras boyutlara karışmaz (security için kural yok)", () => {
    expect(evaluateDimensionSemantics("security", dim("security", ["x"])).ok).toBe(true);
  });

  it("kural seti 3 yeni boyutu kapsar, eşikler ≥2", () => {
    expect(SEMANTIC_KEYS.sort()).toEqual(["dataLifecycle", "observability", "reliability"]);
    for (const k of SEMANTIC_KEYS)
      expect(SEMANTIC_RULES[k as keyof typeof SEMANTIC_RULES].min).toBeGreaterThanOrEqual(2);
  });
});

describe("semantik kapı — üretilmiş veri seti (kapının vitest karşılığı)", () => {
  it("dolu yeni-boyut kartlarında ihlal yok", () => {
    const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
    const violations: string[] = [];
    for (const f of files) {
      const n = JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")) as TaskNode;
      violations.push(...nodeSemanticViolations(n));
    }
    if (violations.length)
      console.error(
        `Semantik ihlal (${violations.length}):\n${violations.slice(0, 30).join("\n")}`,
      );
    expect(violations).toEqual([]);
  });
});
