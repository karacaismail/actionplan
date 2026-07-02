import fs from "node:fs";
import path from "node:path";
import { AUDIT_WEIGHTS, auditNode, domainTokens, scoreDimension } from "@/engine/audit";
import type { Dimension, TaskNode } from "@/schemas";
import { describe, expect, it } from "vitest";

const tokens = domainTokens({
  id: "s-crm",
  title: "CRM",
  summary: "lead skorlama görüşme zekâsı",
  tags: ["crm"],
});

const goldenDim: Dimension = {
  key: "featureDefs",
  title: "Özellik Tanımları",
  status: "filled",
  items: [
    "Lead skorlama bileşeni p95 gecikmeyi 200ms altında tutar ve skor katkı dökümü gösterir",
    "CRM 360 görünümü hesap/iletişim/etkinlik varlıklarını tek ekranda birleştirir",
    "Görüşme zekâsı e-posta ve çağrı etkinliklerini zaman çizelgesinde özetler",
  ],
  notes: "Lead skorlama ayırt edici AI yeteneğidir.",
  prompt:
    '"Özellik Tanımları" boyutunu bu görev için üret. Bağlam: s-crm CRM. Çıktı: 3-5 madde. Kapsa: net işlevsel kapsam, girdi/çıktı sözleşmesi, durum makinesi.',
  provenance: "human",
};

const genericDim: Dimension = {
  key: "security",
  title: "Güvenlik",
  status: "filled",
  items: ["Best practice uygulanır", "TODO", "Gerekli optimizasyon yapılır"],
  notes: "",
  prompt: "",
  provenance: "template",
};

const skeletonDim: Dimension = {
  key: "wcag",
  title: "WCAG",
  status: "skeleton",
  items: [],
  notes: "",
  prompt: "",
  provenance: "template",
};

describe("audit skorlama", () => {
  it("ağırlıklar 1'e toplanır", () => {
    expect(
      AUDIT_WEIGHTS.concreteness + AUDIT_WEIGHTS.completeness + AUDIT_WEIGHTS.applicability,
    ).toBeCloseTo(1, 5);
  });

  it("iskelet boyut 0 alır", () => {
    const s = scoreDimension(skeletonDim, tokens);
    expect(s.score).toBe(0);
    expect(s.flags).toContain("skeleton");
  });

  it("golden boyut yüksek skor (≥2.3) alır", () => {
    const s = scoreDimension(goldenDim, tokens);
    expect(s.score).toBeGreaterThanOrEqual(2.3);
    expect(s.concreteness).toBeGreaterThanOrEqual(2.5);
  });

  it("generic boyut düşük somutluk (<1.5) alır ve generic bayrağı taşır", () => {
    const s = scoreDimension(genericDim, tokens);
    expect(s.concreteness).toBeLessThan(1.5);
    expect(s.flags).toContain("generic");
  });

  it("gerçek düğüm (s-crm) ≥2.0; backfill sonrası 17 kart, köken mixed (human+swarm)", () => {
    const p = path.resolve(process.cwd(), "src/data/generated/nodes/s-crm.json");
    const node = JSON.parse(fs.readFileSync(p, "utf8")) as TaskNode;
    const a = auditNode(node);
    // Tur 3 backfill: 14 human karta 3 swarm day-2 kartı eklendi → rollup "mixed".
    expect(a.provenance).toBe("mixed");
    expect(a.score).toBeGreaterThanOrEqual(2.0);
    expect(a.filled).toBe(17);
  });
});

describe("audit N/A politikası (17-boyut genişlemesi)", () => {
  const base = {
    id: "x-na",
    title: "x",
    tags: [],
    summary: "",
    source: undefined,
  } as unknown as TaskNode;

  const filledObservability: Dimension = {
    ...goldenDim,
    key: "observability",
    title: "Gözlemlenebilirlik & Operasyon",
  };

  it("applies=false işaretli boyut denetim paydasına girmez", () => {
    const node = {
      ...base,
      level: "feature",
      dimensions: { observability: filledObservability },
      applicability: { observability: { applies: false, reason: "UI-only düğüm" } },
    } as unknown as TaskNode;
    const a = auditNode(node);
    expect(a.dimensions.map((d) => d.key)).not.toContain("observability");
    expect(a.filled).toBe(0);
  });

  it("work_unit/micro_step seviyesinde dataLifecycle+observability varsayılan N/A", () => {
    const node = {
      ...base,
      level: "micro_step",
      dimensions: { observability: filledObservability },
      applicability: {},
    } as unknown as TaskNode;
    const a = auditNode(node);
    expect(a.dimensions.map((d) => d.key)).not.toContain("observability");
  });

  it("risk izi taşıyan atomda (webhook/PII/migration) varsayılan N/A DEVRE DIŞI", () => {
    for (const riskTag of ["webhook", "pii", "migration"]) {
      const node = {
        ...base,
        level: "micro_step",
        tags: [riskTag],
        dimensions: { observability: filledObservability },
        applicability: {},
      } as unknown as TaskNode;
      const a = auditNode(node);
      expect(a.dimensions.map((d) => d.key)).toContain("observability");
    }
  });

  it("riskli atomda bile açık applies=false (insan kararı) kazanır", () => {
    const node = {
      ...base,
      level: "micro_step",
      tags: ["webhook"],
      dimensions: { observability: filledObservability },
      applicability: { observability: { applies: false, reason: "salt-okunur proxy" } },
    } as unknown as TaskNode;
    const a = auditNode(node);
    expect(a.dimensions.map((d) => d.key)).not.toContain("observability");
  });

  it("varsayılan N/A, açık applies=true ile geri açılır", () => {
    const node = {
      ...base,
      level: "micro_step",
      dimensions: { observability: filledObservability },
      applicability: { observability: { applies: true, reason: "" } },
    } as unknown as TaskNode;
    const a = auditNode(node);
    expect(a.dimensions.map((d) => d.key)).toContain("observability");
  });

  it("üst seviyede (module) yeni boyutlar varsayılan olarak uygulanır", () => {
    const node = {
      ...base,
      level: "module",
      dimensions: { observability: filledObservability },
      applicability: {},
    } as unknown as TaskNode;
    const a = auditNode(node);
    expect(a.dimensions.map((d) => d.key)).toContain("observability");
  });
});
