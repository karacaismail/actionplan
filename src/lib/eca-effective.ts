import { type EcaFireResult, evaluateEca } from "@/engine";
import type { EcaRule, EcaRulesetPackage } from "@/schemas";

/**
 * eca-effective — bir düğümün ETKİLİ ECA kural setini (inline + bağlı paket kuralları) hesaplar ve
 * bir olayı SALT-OKUNUR simüle eder. React'tan bağımsız saf mantık (Küme E tabanı).
 *
 * Ne yapar? Düğümün inline `ecaRules`'unu ve kümesine uyan ruleset paketlerinin (Küme C) kurallarını birleştirir;
 *   `simulate` ile verilen olay/bağlamda hangi kuralların tetikleneceğini gösterir.
 * Ne yapmaz? Veriyi DEĞİŞTİRMEZ; gerçek eylem çalıştırmaz; yalnız "ne olurdu" döndürür.
 */

export interface EffectiveRule extends EcaRule {
  /** Kural düğümün kendisinden mi yoksa bir paketten mi geliyor? */
  source: "inline" | "package";
  packageId?: string;
  packageName?: string;
  /** Paket katmanı (system kilitli / platform / tenant). */
  layer?: "system" | "platform" | "tenant";
}

/** Simülasyon sonucu: hangi kural + motorun verdiği sonuç (tetiklendi mi, eylem, onay). */
export interface SimOutcome {
  rule: EffectiveRule;
  result: EcaFireResult;
}

interface NodeLike {
  ecaRules?: EcaRule[];
  source?: { cluster?: string } | null;
}

/** Düğümün etkili kural seti = inline kurallar + kümesine uyan paket kuralları. */
export function effectiveRules(node: NodeLike, catalog: EcaRulesetPackage[]): EffectiveRule[] {
  const out: EffectiveRule[] = [];
  for (const r of node.ecaRules ?? []) out.push({ ...r, source: "inline" });
  const cluster = node.source?.cluster ?? "";
  for (const p of catalog) {
    const clusters = p.appliesTo?.clusters ?? [];
    const applies = clusters.length === 0 || (cluster !== "" && clusters.includes(cluster));
    if (!applies) continue;
    for (const r of p.rules) {
      out.push({ ...r, source: "package", packageId: p.id, packageName: p.name, layer: p.layer });
    }
  }
  return out;
}

/** Kuralların tetiklenebileceği benzersiz, sıralı olay listesi (simülatör seçici için). */
export function ruleEvents(rules: EffectiveRule[]): string[] {
  return Array.from(new Set(rules.map((r) => r.event))).sort();
}

/** Bir olayı SALT-OKUNUR değerlendirir; her kural için sonucu döndürür (mutasyon YOK). */
export function simulate(rules: EffectiveRule[], event: string, ctx: Record<string, unknown>): SimOutcome[] {
  return rules.map((rule) => ({ rule, result: evaluateEca(rule, event, ctx) }));
}

/** Yalnız tetiklenen sonuçlar. */
export function firedOutcomes(outcomes: SimOutcome[]): SimOutcome[] {
  return outcomes.filter((o) => o.result.fired);
}
