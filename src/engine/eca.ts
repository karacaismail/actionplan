import type {
  AgentPolicy,
  EcaAction,
  EcaCondition,
  EcaRule,
  MigrationMode,
  WbsLevel,
} from "@/schemas";

export interface EcaFireResult {
  fired: boolean;
  action?: EcaAction;
  requiresApproval?: boolean;
  reason?: string;
}

export interface AgentActionRequest {
  actor: "ai" | "human" | "system";
  action:
    | "read"
    | "suggest"
    | "generate"
    | "update"
    | "publish"
    | "delete"
    | "migrate-data"
    | "change-ruleset";
  targetLevel: WbsLevel;
  environment?: "draft" | "staging" | "production";
  historyPreserved?: boolean;
  migrationMode?: MigrationMode;
  snapshotCreated?: boolean;
  rollbackReady?: boolean;
  compatibilityChecked?: boolean;
  rulesetBypassAttempt?: boolean;
}

export interface AgentPolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
}

const MUTATING_ACTIONS = new Set<AgentActionRequest["action"]>([
  "generate",
  "update",
  "publish",
  "delete",
  "migrate-data",
  "change-ruleset",
]);

function allow(reason: string, requiresApproval = false): AgentPolicyDecision {
  return { allowed: true, requiresApproval, reason };
}

function deny(reason: string): AgentPolicyDecision {
  return { allowed: false, requiresApproval: false, reason };
}

/**
 * AI yetki sınırı: AI sadece ArcheType taslağı/güncelleme önerisi üretebilir.
 * App/module üretimi veya güncellemesi, insan onaylı olsa bile AI yolu değildir.
 */
export function evaluateAgentPolicy(
  policy: AgentPolicy | undefined,
  request: AgentActionRequest,
): AgentPolicyDecision {
  if (request.actor !== "ai") return allow("AI dışı aktör; ECA AI sınırı uygulanmadı");
  if (!policy) return deny("agentPolicy yok; deny-by-default");
  if (!policy.killSwitch) return deny("agentPolicy killSwitch kapalı; AI aksiyonu durduruldu");
  if (!policy.rulesetBoundary.enforced || policy.rulesetBoundary.canOverride) {
    return deny("rulesetBoundary güvenli değil; AI aksiyonu durduruldu");
  }
  if (request.rulesetBypassAttempt || request.action === "change-ruleset") {
    return deny("AI ruleset dışına çıkamaz veya ruleset değiştiremez");
  }

  const isMutating = MUTATING_ACTIONS.has(request.action);
  if (!isMutating) return allow("salt-okuma/öneri aksiyonu");

  if (request.targetLevel === "app" || request.targetLevel === "module") {
    return deny("AI app/module üretemez veya güncelleyemez");
  }
  if (
    request.action === "publish" ||
    request.action === "delete" ||
    request.action === "migrate-data"
  ) {
    return deny("AI yayın, silme veya doğrudan veri migrasyonu yapamaz");
  }
  if (policy.forbiddenTargets.includes(request.targetLevel)) {
    return deny(`${request.targetLevel} seviyesi agentPolicy tarafından yasaklandı`);
  }
  if (request.targetLevel !== "archetype") {
    return deny("AI mutasyonu sadece archetype seviyesinde mümkündür");
  }
  if (!policy.allowedTargets.includes("archetype")) {
    return deny("agentPolicy archetype hedefini açıkça izinli göstermiyor");
  }

  const environment = request.environment ?? "draft";
  if (request.action === "generate") {
    if (environment === "production") return deny("AI prod üzerinde doğrudan ArcheType üretemez");
    return allow("AI ArcheType taslağı üretebilir", true);
  }

  if (request.action === "update") {
    if (environment !== "production")
      return allow("AI ArcheType taslak/staging güncelleme önerisi üretebilir", true);

    const dataPolicy = policy.prodDataPolicy;
    if (dataPolicy.preserveHistory && !request.historyPreserved) {
      return deny("prod ArcheType güncellemesi geçmiş veriyi korumuyor");
    }
    if (dataPolicy.requireSnapshot && !request.snapshotCreated) {
      return deny("prod ArcheType güncellemesi için immutable snapshot eksik");
    }
    if (dataPolicy.requireRollback && !request.rollbackReady) {
      return deny("prod ArcheType güncellemesi için rollback planı eksik");
    }
    if (dataPolicy.requireCompatibilityCheck && !request.compatibilityChecked) {
      return deny("prod ArcheType güncellemesi için geriye dönük uyumluluk kontrolü eksik");
    }
    if (!request.migrationMode || !dataPolicy.migrationModes.includes(request.migrationMode)) {
      return deny("prod ArcheType güncellemesi izinli migration modunda değil");
    }
    return allow("prod ArcheType güncellemesi geçmiş veri korumalı öneri olarak izinli", true);
  }

  return deny("AI aksiyonu izinli archetype üretim/güncelleme yoluna uymuyor");
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
