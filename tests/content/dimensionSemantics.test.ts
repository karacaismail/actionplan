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
 * Semantik boyut sözleşmesi (tur 3) — must + anyOf yapısı:
 * her boyutta MUST kavramlarının TÜMÜ + anyOf ailesinden EN AZ 1 kavram zorunlu.
 * "2 herhangi kavram" (tur 2) yeterli değildi; SLO'suz observability geçebiliyordu.
 * Boş/iskelet boyut zorlanmaz (lazy migration).
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

describe("semantik kural sözleşmesi — must + anyOf (fixture)", () => {
  it("observability: SLO + metrik (must) + runbook (anyOf) geçer", () => {
    const d = dim("observability", [
      "Sipariş akışı için SLO hedefi p95 < 400ms; error-budget %1",
      "RED metrikleri (rate/error/duration) tanımlı",
      "Arıza runbook'u: belirti → teşhis → müdahale",
    ]);
    expect(evaluateDimensionSemantics("observability", d).ok).toBe(true);
  });

  it("observability: metrik'siz içerik KALIR (must ihlali) — SLO+runbook yetmez", () => {
    const d = dim("observability", [
      "SLO hedefi p95 < 400ms; error-budget %1",
      "Arıza runbook'u hazır; alarm kurulu",
    ]);
    const r = evaluateDimensionSemantics("observability", d);
    expect(r.ok).toBe(false);
    expect(r.missing.some((m: string) => m.startsWith("must:"))).toBe(true);
  });

  it("dataLifecycle: retention + PII (must) + DSAR (anyOf) geçer; PII'siz kalır", () => {
    expect(
      evaluateDimensionSemantics(
        "dataLifecycle",
        dim("dataLifecycle", [
          "İletişim kayıtları (kişisel veri) retention: 24 ay",
          "Süre dolumunda anonimleştirme; DSAR talebi 30 günde yanıtlanır",
        ]),
      ).ok,
    ).toBe(true);
    const r = evaluateDimensionSemantics(
      "dataLifecycle",
      dim("dataLifecycle", ["Kayıtlar retention takvimiyle silinir", "Aylık backup + restore"]),
    );
    expect(r.ok).toBe(false);
    expect(r.missing.some((m: string) => m.startsWith("must:"))).toBe(true);
  });

  it("reliability: failure mode + idempotency (must) + retry (anyOf) geçer; failure-mode'suz kalır", () => {
    expect(
      evaluateDimensionSemantics(
        "reliability",
        dim("reliability", [
          "Failure mode listesi: bağımlılık kesintisi, kuyruk taşması",
          "Yazma uçları idempotency anahtarı taşır; retry 3 deneme + backoff",
        ]),
      ).ok,
    ).toBe(true);
    const r = evaluateDimensionSemantics(
      "reliability",
      dim("reliability", ["Idempotency anahtarı var", "Retry + backoff uygulanır"]),
    );
    expect(r.ok).toBe(false);
  });

  it("anyOf tamamen boşsa kalır (must'lar tam olsa bile)", () => {
    const r = evaluateDimensionSemantics(
      "observability",
      dim("observability", ["SLO p99 hedefi tanımlı", "Metrik seti (RED) toplanıyor"]),
    );
    expect(r.ok).toBe(false);
    expect(r.missing.some((m: string) => m.startsWith("anyOf:"))).toBe(true);
  });

  it("kural seti dışındaki anahtara karışmaz (bilinmeyen boyut serbest)", () => {
    expect(evaluateDimensionSemantics("bilinmeyenBoyut", dim("bilinmeyenBoyut", ["x"])).ok).toBe(
      true,
    );
  });

  it("kural seti 17 boyutun TAMAMINI kapsar; her kuralda ≥1 must + ≥2 anyOf", () => {
    const ALL17 = [
      "featureDefs",
      "security",
      "codeOptimization",
      "securityOptimization",
      "performance",
      "mobileApps",
      "wcag",
      "deployment",
      "eca",
      "aiAgents",
      "testing",
      "owasp",
      "integration",
      "moduleUsage",
      "dataLifecycle",
      "observability",
      "reliability",
    ];
    expect([...SEMANTIC_KEYS].sort()).toEqual([...ALL17].sort());
    for (const k of SEMANTIC_KEYS) {
      const rule = SEMANTIC_RULES[k as keyof typeof SEMANTIC_RULES];
      expect(Object.keys(rule.must).length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(rule.anyOf).length).toBeGreaterThanOrEqual(2);
      expect(["fail", "warn"]).toContain(rule.enforce);
    }
  });

  it("day-2 üçlüsü FAIL modunda; miras 14 WARN-ratchet modunda (kademeli devreye alma)", () => {
    for (const k of ["dataLifecycle", "observability", "reliability"])
      expect(SEMANTIC_RULES[k as keyof typeof SEMANTIC_RULES].enforce).toBe("fail");
    for (const k of ["featureDefs", "security", "testing", "wcag"])
      expect(SEMANTIC_RULES[k as keyof typeof SEMANTIC_RULES].enforce).toBe("warn");
  });

  it("miras boyut kuralları anlamlı: ölçüsüz performance içeriği kavram bulamaz", () => {
    const r = evaluateDimensionSemantics(
      "performance",
      dim("performance", ["Sistem hızlı çalışır", "Optimizasyon yapılır"]),
    );
    expect(r.ok).toBe(false);
    const good = evaluateDimensionSemantics(
      "performance",
      dim("performance", [
        "Liste ucu keyset pagination; p95 300ms hedefi",
        "Bileşik indeks + önbellek",
      ]),
    );
    expect(good.ok).toBe(true);
  });

  it("güvenlik kuralı: erişim/tenant'sız içerik kalır, RLS+audit geçer", () => {
    expect(
      evaluateDimensionSemantics("security", dim("security", ["Önlemler alınır", "Dikkat edilir"]))
        .ok,
    ).toBe(false);
    expect(
      evaluateDimensionSemantics(
        "security",
        dim("security", [
          "Tenant-scoped RLS izolasyonu",
          "Değişmez audit kanıtı + deny-by-default",
        ]),
      ).ok,
    ).toBe(true);
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
