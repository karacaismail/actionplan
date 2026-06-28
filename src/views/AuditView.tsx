import { Card, Icon } from "@/components/ui/primitives";
import { auditAll, summarize } from "@/engine";
import { t } from "@/lib/strings";
import { DIMENSION_META, type DimensionKey } from "@/schemas";
import { useTaskStore } from "@/store/taskStore";
import { Link } from "@tanstack/react-router";
import { Suspense, lazy, useMemo } from "react";

// ECharts tembel yüklenir (başlangıç paketinden çıkar).
const EChart = lazy(() =>
  import("@/components/charts/EChart").then((m) => ({ default: m.EChart })),
);

const BAND_COLOR = {
  strong: "#22c55e",
  ok: "#38bdf8",
  weak: "#ef4444",
  missing: "#64748b",
} as const;

function bandColor(score: number): string {
  return score >= 2.3 ? BAND_COLOR.strong : score >= 1.5 ? BAND_COLOR.ok : BAND_COLOR.weak;
}

export function AuditView() {
  const nodes = useTaskStore((s) => s.nodes);
  const { audits, summary } = useMemo(() => {
    const a = auditAll(nodes);
    return { audits: a, summary: summarize(a, 25) };
  }, [nodes]);

  const distOption = useMemo(
    () => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0, textStyle: { color: "#94a3b8" } },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          data: [
            {
              name: t.audit.strong,
              value: summary.bands.strong,
              itemStyle: { color: BAND_COLOR.strong },
            },
            { name: t.audit.ok, value: summary.bands.ok, itemStyle: { color: BAND_COLOR.ok } },
            {
              name: t.audit.weak,
              value: summary.bands.weak,
              itemStyle: { color: BAND_COLOR.weak },
            },
            {
              name: t.audit.missing,
              value: summary.bands.missing,
              itemStyle: { color: BAND_COLOR.missing },
            },
          ].filter((d) => d.value > 0),
          label: { color: "#cbd5e1" },
        },
      ],
    }),
    [summary],
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium">{t.audit.title}</h1>
        <p className="text-base text-muted-foreground">{t.audit.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon="ph-gauge" label={t.audit.avg} value={`${summary.avg} / 3`} />
        <Stat icon="ph-seal-check" label={t.audit.strong} value={String(summary.bands.strong)} />
        <Stat icon="ph-circle-half" label={t.audit.ok} value={String(summary.bands.ok)} />
        <Stat icon="ph-warning-circle" label={t.audit.weak} value={String(summary.bands.weak)} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 font-medium">{t.audit.distribution}</h2>
          <Suspense fallback={<div className="h-[280px]" aria-hidden="true" />}>
            <EChart option={distOption} ariaLabel={t.audit.distribution} />
          </Suspense>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 font-medium">{t.audit.byProvenance}</h2>
          <ul className="flex flex-col gap-2">
            {Object.entries(summary.byProvenance).map(([k, v]) => (
              <li
                key={k}
                className="flex items-center justify-between border-border border-b pb-2 text-base last:border-0"
              >
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium tabular-nums">{v}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-medium">{t.audit.weakest}</h2>
        <ul className="flex flex-col divide-y divide-border">
          {summary.weakest.map((w) => {
            const a = audits.find((x) => x.id === w.id);
            return (
              <li key={w.id} className="flex items-center gap-3 py-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: bandColor(w.score) }}
                  aria-hidden="true"
                />
                <span className="w-10 shrink-0 text-right font-mono tabular-nums">{w.score}</span>
                <Link
                  to="/task/$taskId"
                  params={{ taskId: w.id }}
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {w.title}
                </Link>
                {a?.weakest && (
                  <span className="hidden truncate text-base text-muted-foreground sm:inline">
                    {DIMENSION_META[a.weakest as DimensionKey].tr}
                  </span>
                )}
                {a && a.flags.length > 0 && (
                  <span className="hidden truncate text-base text-muted-foreground md:inline">
                    {a.flags.slice(0, 2).join(", ")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <Icon name={icon} className="text-2xl text-primary" />
      <div className="min-w-0">
        <p className="truncate text-base text-muted-foreground">{label}</p>
        <p className="text-xl font-medium tabular-nums">{value}</p>
      </div>
    </Card>
  );
}
