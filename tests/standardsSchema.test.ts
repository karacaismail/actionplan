import {
  DIMENSION_FAMILY,
  DIMENSION_KEYS,
  StandardRefsSchema,
  TaskNodeSchema,
  WaiverSchema,
} from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * ST-1 (ADR-0027) — Mühendislik standardı bağının şema temeli.
 * Düğüm tek-kaynak sözleşmelere REFERANS verir (standardRefs); boyut uygulanabilirliği
 * (applicability) ve waiver yaşam döngüsü eklenir. Hepsi GERİYE UYUMLU default'lu:
 * eski 438 düğüm dosya migration'ı OLMADAN parse olur (lazy migration).
 */
const base = { id: "x-node", level: "atom", title: "x", slug: "x" } as const;

describe("ST-1 — standardRefs / applicability / waivers şema temeli", () => {
  it("eski düğüm (yeni alanlar yok) hâlâ parse olur — lazy migration", () => {
    const n = TaskNodeSchema.parse(base);
    expect(n.standardRefs.techProfileRef).toBe("");
    expect(n.applicability).toEqual({});
    expect(n.waivers).toEqual([]);
  });

  it("standardRefs 15 default'lu sözleşme anahtarını taşır, hepsi default ''", () => {
    const r = StandardRefsSchema.parse({});
    // 15 çekirdek anahtar default'ludur; yeni anahtarlar OPSİYONEL (default'suz),
    // set edilmediğinde parse çıktısında yer almaz (geriye uyumlu).
    expect(Object.keys(r).length).toBe(15);
    expect(r.designSystemRef).toBe("");
    expect(r.shortCodeRef).toBe("");
    expect(r.codingStandardRef).toBe("");
  });

  it("yeni opsiyonel ref anahtarları set edilebilir (additive, geriye uyumlu)", () => {
    const r = StandardRefsSchema.parse({
      authzRef: "authz-rbac-abac",
      mfaRef: "mfa",
      g11nRef: "g11n",
      a11yRef: "a11y",
      c13nRef: "c13n",
    });
    expect(r.authzRef).toBe("authz-rbac-abac");
    expect(r.mfaRef).toBe("mfa");
    expect(r.g11nRef).toBe("g11n");
    // set edilmeyen yeni anahtar undefined (default'suz optional)
    expect(r.ssoRef).toBeUndefined();
  });

  it("applicability: applies=false + gerekçe taşıyabilir", () => {
    const n = TaskNodeSchema.parse({
      ...base,
      applicability: { wcag: { applies: false, reason: "saf-backend atom; UI yok" } },
    });
    expect(n.applicability.wcag?.applies).toBe(false);
    expect(n.applicability.wcag?.reason).toContain("backend");
  });

  it("waiver zorunlu alanlar (id/scope/reason)", () => {
    expect(() => WaiverSchema.parse({ id: "", scope: "wcag", reason: "x" })).toThrow();
    const w = WaiverSchema.parse({ id: "wv-1", scope: "designSystemRef", reason: "pilot hız" });
    expect(w.approvedBy).toBe("");
    expect(w.expires).toBe("");
  });

  it("DIMENSION_FAMILY 14 boyutun tümünü bir aileye atar (ontoloji)", () => {
    for (const k of DIMENSION_KEYS) expect(DIMENSION_FAMILY[k]).toBeTruthy();
    expect(new Set(Object.values(DIMENSION_FAMILY)).size).toBeGreaterThanOrEqual(4);
  });

  it("strict korunur: bilinmeyen alan reddedilir", () => {
    expect(() => TaskNodeSchema.parse({ ...base, bogusField: 1 })).toThrow();
  });
});
