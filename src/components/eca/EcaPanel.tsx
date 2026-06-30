import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
} from "@/components/ui/primitives";
import rulesetCatalogJson from "@/data/eca/ruleset-catalog.json";
import {
  type ChainResult,
  type EffectiveRule,
  type SimOutcome,
  effectiveRules,
  firedOutcomes,
  ruleEvents,
  simulate,
  simulateChain,
} from "@/lib/eca-effective";
import { t } from "@/lib/strings";
import type { EcaRulesetPackage, TaskNode } from "@/schemas";
import { useMemo, useState } from "react";

/**
 * EcaPanel (Küme E) — düğümün etkili ECA kurallarını GÖRÜNÜR kılar ve bir olayı SALT-OKUNUR simüle eder.
 * Veri DEĞİŞTİRMEZ; yalnız "bu olay olursa ne tetiklenir" gösterir. AI hiçbir kuralı kendiliğinden uygulamaz.
 * Tüm UI metni strings.json (t.eca) — bileşende gömülü metin yok (proje kuralı).
 */

const CATALOG = rulesetCatalogJson as unknown as EcaRulesetPackage[];
const e = t.eca;
const ACTION_NAMES = e.actionNames as Record<string, string>;
const actionLabel = (type: string): string => ACTION_NAMES[type] ?? type;

const LAYER_LABEL: Record<string, string> = {
  system: e.layerSystem,
  platform: e.layerPlatform,
  tenant: e.layerTenant,
};

function LayerBadge({ layer }: { layer?: string }) {
  if (!layer) return null;
  return (
    <Badge className="text-muted-foreground">
      <Icon name={layer === "system" ? "ph-lock" : "ph-stack"} className="text-xs" />
      {LAYER_LABEL[layer] ?? layer}
    </Badge>
  );
}

function SourceBadge({ rule }: { rule: EffectiveRule }) {
  return (
    <Badge className="text-muted-foreground">
      <Icon name={rule.source === "inline" ? "ph-note-pencil" : "ph-package"} className="text-xs" />
      {rule.source === "inline"
        ? e.ruleInline
        : `${e.rulePkgPrefix} ${rule.packageName ?? rule.packageId}`}
    </Badge>
  );
}

function ApprovalBadge() {
  return (
    <Badge className="text-foreground" color="hsl(var(--warning, 38 92% 50%))">
      <Icon name="ph-shield-check" className="text-xs" />
      {e.approval}
    </Badge>
  );
}

function paramsSummary(params: Record<string, unknown>): string {
  const keys = Object.keys(params ?? {});
  if (keys.length === 0) return "";
  return keys.map((k) => `${k}=${String(params[k])}`).join(", ");
}

function EcaRuleCard({ rule }: { rule: EffectiveRule }) {
  const summary = paramsSummary(rule.then.params);
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 font-medium">
          <Icon name="ph-lightning" className="text-sm" />
          {rule.event}
        </span>
        <SourceBadge rule={rule} />
        <LayerBadge layer={rule.layer} />
        {rule.requiresApproval && <ApprovalBadge />}
      </div>
      {rule.when.length > 0 && (
        <p className="mt-2 flex items-center gap-1 text-base text-muted-foreground">
          <Icon name="ph-funnel" className="text-xs" />
          {`${e.condLabel} ${rule.when.map((c) => `${c.field} ${c.op} ${String(c.value)}`).join(` ${e.condAnd} `)}`}
        </p>
      )}
      <p className="mt-1 flex items-center gap-1 text-base">
        <Icon name="ph-arrow-right" className="text-xs" />
        {e.actionLabel} <span className="font-medium">{rule.then.type}</span>
        {summary && <span className="text-muted-foreground">({summary})</span>}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{`${e.chainLabel} ${rule.maxChainDepth} (${e.chainNote})`}</p>
    </div>
  );
}

function EcaRuleList({ rules }: { rules: EffectiveRule[] }) {
  if (rules.length === 0) {
    return <p className="text-muted-foreground">{e.emptyRules}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rules.map((r) => (
        <EcaRuleCard key={`${r.source}:${r.packageId ?? "inline"}:${r.id}`} rule={r} />
      ))}
    </div>
  );
}

function EcaSimulationResult({ outcomes }: { outcomes: SimOutcome[] }) {
  const fired = firedOutcomes(outcomes);
  return (
    <div aria-live="polite" className="mt-3">
      {fired.length === 0 ? (
        <p className="flex items-center gap-1 text-base text-muted-foreground">
          <Icon name="ph-info" className="text-sm" /> {e.noFire}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-base font-medium">{`${fired.length} ${e.firedSuffix}`}</p>
          {fired.map((o) => {
            const summary = paramsSummary(o.rule.then.params);
            const why = o.rule.when
              .map(
                (c) =>
                  `${c.field} ${c.op} ${Array.isArray(c.value) ? c.value.join("/") : String(c.value)}`,
              )
              .join(` ${e.condAnd} `);
            return (
              <div
                key={`${o.rule.source}:${o.rule.id}`}
                className="rounded-md border border-border p-2"
              >
                <span className="inline-flex flex-wrap items-center gap-1">
                  <Icon name="ph-check-circle" className="text-primary text-sm" />
                  <span className="font-medium">{actionLabel(o.rule.then.type)}</span>
                  {summary && <span className="text-muted-foreground">({summary})</span>}
                  {o.result.requiresApproval && (
                    <span className="ml-1">
                      <ApprovalBadge />
                    </span>
                  )}
                </span>
                {why && (
                  <p className="mt-1 flex items-center gap-1 text-base text-muted-foreground">
                    <Icon name="ph-funnel" className="text-xs" /> {e.whyLabel} {why}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function coerce(v: string): string | number | boolean {
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return v;
}

/** Bir koşul alanı için gerçekçi açılır-menü seçenekleri (kuralların koşul değerlerinden türetilir). */
function fieldOptionValues(eventRules: EffectiveRule[], field: string): string[] {
  const opts = new Set<string>();
  for (const r of eventRules)
    for (const c of r.when)
      if (c.field === field) {
        if (c.op === "in" && Array.isArray(c.value)) for (const v of c.value) opts.add(String(v));
        else opts.add(String(c.value));
      }
  if (opts.has("true") || opts.has("false")) {
    opts.add("true");
    opts.add("false");
  }
  return [...opts];
}

/** Bir kuralın koşullarını SAĞLAYAN (tetikleyen) ön-dolu senaryo bağlamı. */
function firingScenario(rule: EffectiveRule | undefined): Record<string, string> {
  const ctx: Record<string, string> = {};
  if (!rule) return ctx;
  for (const c of rule.when) {
    if (c.op === "in" && Array.isArray(c.value)) ctx[c.field] = String(c.value[0]);
    else ctx[c.field] = String(c.value);
  }
  return ctx;
}

function EcaChainResult({ chain }: { chain: ChainResult }) {
  if (chain.steps.length === 0) return <p className="mt-2 text-muted-foreground">{e.chainEmpty}</p>;
  return (
    <div aria-live="polite" className="mt-2 flex flex-col gap-1">
      <p className="flex items-center gap-1 text-base font-medium">
        <Icon name="ph-tree-structure" className="text-sm" />
        {e.chainTitle} <span className="text-sm text-muted-foreground">{e.ctxFixedNote}</span>
      </p>
      {chain.steps.map((s, i) => {
        const summary = paramsSummary(s.action.params);
        return (
          <div
            key={`${s.depth}:${s.rule.id}:${i}`}
            className="flex flex-wrap items-center gap-1 text-base"
            style={{ paddingInlineStart: `${s.depth * 16}px` }}
          >
            <Icon name="ph-arrow-bend-down-right" className="text-xs text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {e.stepLabel} {s.depth}
            </span>
            <span className="font-medium">{s.event}</span>
            <Icon name="ph-arrow-right" className="text-xs" />
            <span>{s.action.type}</span>
            {summary && <span className="text-muted-foreground">({summary})</span>}
            {s.requiresApproval && <ApprovalBadge />}
            {s.emits && (
              <span className="text-sm text-muted-foreground">
                {e.chainEmits} {s.emits}
              </span>
            )}
          </div>
        );
      })}
      {chain.depthLimitHit && (
        <p className="mt-1 flex items-center gap-1 text-base">
          <Icon name="ph-warning-circle" className="text-sm" />
          {e.chainDepthHit}
        </p>
      )}
    </div>
  );
}

export function EcaSimulator({ rules }: { rules: EffectiveRule[] }) {
  const events = useMemo(() => ruleEvents(rules), [rules]);
  const [event, setEvent] = useState(events[0] ?? "");
  const eventRules = useMemo(() => rules.filter((r) => r.event === event), [rules, event]);
  const fields = useMemo(
    () => Array.from(new Set(eventRules.flatMap((r) => r.when.map((c) => c.field)))),
    [eventRules],
  );
  const [ctx, setCtx] = useState<Record<string, string>>(() => firingScenario(eventRules[0]));
  const [showChain, setShowChain] = useState(false);

  const coerced = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const f of fields) if (ctx[f] !== undefined && ctx[f] !== "") out[f] = coerce(ctx[f]);
    return out;
  }, [ctx, fields]);
  const outcomes = useMemo(() => simulate(rules, event, coerced), [rules, event, coerced]);
  const chain = useMemo(
    () => (showChain ? simulateChain(rules, event, coerced, 6) : null),
    [showChain, rules, event, coerced],
  );

  if (events.length === 0) return null;

  // Olay değişince tetikleyen ön-dolu senaryoya sıfırla (boş input yok → her zaman anlamlı sonuç).
  const onEvent = (next: string) => {
    setEvent(next);
    setShowChain(false);
    setCtx(firingScenario(rules.filter((r) => r.event === next)[0]));
  };

  return (
    <div className="mt-4 rounded-md border border-dashed border-border p-3">
      <p className="mb-1 flex items-center gap-1 text-base font-medium">
        <Icon name="ph-flask" className="text-sm" />
        {e.simTitle}
        <Badge className="ml-1 text-muted-foreground">{e.simBadge}</Badge>
      </p>
      <p className="mb-2 text-base text-muted-foreground">{e.scenarioHint}</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-base">
          {e.eventLabel}
          <select
            aria-label={e.simEventAria}
            className="tap-target rounded-md border border-border bg-card px-2 py-1 text-base"
            value={event}
            onChange={(ev) => onEvent(ev.target.value)}
          >
            {events.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        </label>
        {fields.map((f) => (
          <label key={f} className="flex flex-col gap-1 text-base">
            {f}
            <select
              aria-label={`${e.ctxAriaPrefix} ${f}`}
              className="tap-target rounded-md border border-border bg-card px-2 py-1 text-base"
              value={ctx[f] ?? ""}
              onChange={(ev) => setCtx((p) => ({ ...p, [f]: ev.target.value }))}
            >
              {fieldOptionValues(eventRules, f).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        ))}
        <Button
          variant={showChain ? "primary" : "outline"}
          size="sm"
          onClick={() => setShowChain((v) => !v)}
        >
          <Icon name="ph-tree-structure" className="text-sm" />
          {showChain ? e.chainHide : e.chainButton}
        </Button>
      </div>
      {showChain && chain ? (
        <EcaChainResult chain={chain} />
      ) : (
        <EcaSimulationResult outcomes={outcomes} />
      )}
    </div>
  );
}

export function EcaPanel({ node }: { node: TaskNode }) {
  const rules = useMemo(() => effectiveRules(node, CATALOG), [node]);
  const inlineCount = rules.filter((r) => r.source === "inline").length;
  const packageCount = rules.length - inlineCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="ph-lightning" />
          {e.title}
        </CardTitle>
        <p className="text-base text-muted-foreground">
          {`${rules.length} ${e.effective} (${inlineCount} ${e.srcPage}, ${packageCount} ${e.srcPkg}). ${e.readonlyNote}`}
        </p>
      </CardHeader>
      <CardContent>
        <EcaRuleList rules={rules} />
        <EcaSimulator rules={rules} />
      </CardContent>
    </Card>
  );
}
