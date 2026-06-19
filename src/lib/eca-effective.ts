import { type EcaFireResult, evaluateEca } from "@/engine";
import type { EcaAction, EcaRule, EcaRulesetPackage } from "@/schemas";

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

/* ----------------------------------------------------------------------------
 * Çok-adımlı zincir simülasyonu (faz-2) — bir eylemin ürettiği takip olayını izler.
 * ECA şemasında eylem açıkça olay yaymadığı için AÇIK, belgelenmiş bir eylem→olay eşlemesi kullanılır
 * (deterministik). Zincir maxChainDepth (kullanıcı kuralı: 6) ile kırılır. SALT-OKUNUR; veri değişmez.
 * Sınır: bağlam (ctx) zincir boyunca sabittir (alan değişimi simüle edilmez).
 * -------------------------------------------------------------------------- */

/** Bir eylemin tetiklediği takip olayı (yoksa terminal eylem). */
export function actionEmits(action: EcaAction): string | undefined {
  if (action.type === "create-task") return "task.created";
  if (action.type === "set-field") return action.params?.field === "status" ? "task.status.changed" : "task.field.changed";
  return undefined; // notify, audit-log, deny, retry, require-approval → terminal
}

export interface ChainStep {
  depth: number;
  event: string;
  rule: EffectiveRule;
  action: EcaAction;
  emits?: string;
  requiresApproval: boolean;
}

export interface ChainResult {
  steps: ChainStep[];
  /** maxChainDepth'e ulaşıldı mı? (sonsuz tetik koruması devreye girdi) */
  depthLimitHit: boolean;
}

/** Bir başlangıç olayından zinciri izler; tetiklenen adımları sırayla döndürür (depth ≤ maxDepth). */
export function simulateChain(
  rules: EffectiveRule[],
  initialEvent: string,
  ctx: Record<string, unknown>,
  maxDepth = 6,
): ChainResult {
  const steps: ChainStep[] = [];
  let depthLimitHit = false;
  const queue: Array<{ event: string; depth: number }> = [{ event: initialEvent, depth: 0 }];
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    const { event, depth } = item;
    if (depth >= maxDepth) {
      depthLimitHit = true;
      continue;
    }
    for (const r of rules) {
      const res = evaluateEca(r, event, ctx, depth);
      if (!res.fired) continue;
      const emits = actionEmits(r.then);
      steps.push({ depth, event, rule: r, action: r.then, emits, requiresApproval: r.requiresApproval });
      if (emits) queue.push({ event: emits, depth: depth + 1 });
    }
  }
  return { steps, depthLimitHit };
}
