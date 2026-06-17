import type { EcaAction, EcaCondition, EcaRule } from "@/schemas";

export interface EcaFireResult {
  fired: boolean;
  action?: EcaAction;
  requiresApproval?: boolean;
  reason?: string;
}

/** Tek koşulu bağlam (ctx) üzerinde değerlendirir. */
function check(cond: EcaCondition, ctx: Record<string, unknown>): boolean {
  const actual = ctx[cond.field];
  const v = cond.value;
  switch (cond.op) {
    case "eq":
      return actual === v;
    case "neq":
      return actual !== v;
    case "gt":
      return typeof actual === "number" && typeof v === "number" && actual > v;
    case "lt":
      return typeof actual === "number" && typeof v === "number" && actual < v;
    case "gte":
      return typeof actual === "number" && typeof v === "number" && actual >= v;
    case "lte":
      return typeof actual === "number" && typeof v === "number" && actual <= v;
    case "in":
      return Array.isArray(v) && v.map(String).includes(String(actual));
    case "contains":
      return typeof actual === "string" && typeof v === "string" && actual.includes(v);
    default:
      return false;
  }
}

/**
 * Bir ECA kuralını gerçek bir olayda DEĞERLENDİRİR — motor çalıştırır (mock değil).
 * Olay eşleşir + tüm `when` koşulları sağlanırsa `then` aksiyonunu döndürür.
 * `maxChainDepth` ile sonsuz tetik zinciri kırılır (kullanıcı kuralı: maks 6).
 */
export function evaluateEca(
  rule: EcaRule,
  event: string,
  ctx: Record<string, unknown>,
  chainDepth = 0,
): EcaFireResult {
  if (chainDepth >= rule.maxChainDepth) {
    return { fired: false, reason: `maxChainDepth (${rule.maxChainDepth}) aşıldı` };
  }
  if (rule.event !== event) return { fired: false, reason: "olay eşleşmedi" };
  const pass = rule.when.every((c) => check(c, ctx));
  if (!pass) return { fired: false, reason: "koşul sağlanmadı" };
  return { fired: true, action: rule.then, requiresApproval: rule.requiresApproval };
}

/** Bir düğümün tüm kurallarını bir olaya karşı değerlendirir; tetiklenenleri döndürür. */
export function runEca(
  rules: EcaRule[],
  event: string,
  ctx: Record<string, unknown>,
): EcaFireResult[] {
  return rules.map((r) => evaluateEca(r, event, ctx)).filter((r) => r.fired);
}
