import { Button, Card } from "@/components/ui/primitives";
import { effortBurnup, milestoneProgress, phaseGateProgress, statusCumulative } from "@/engine";
import { STATUS_LABEL } from "@/lib/format";
import { t } from "@/lib/strings";
import { PHASE_META, type WaterfallPhase } from "@/schemas";
import { useTaskStore } from "@/store/taskStore";
import { Suspense, lazy, useMemo, useState } from "react";

const EChart = lazy(() =>
  import("@/components/charts/EChart").then((m) => ({ default: m.EChart })),
);

type Tab = "milestone" | "phase" | "effort" | "status";

export function ReportsView() {
  const nodes = useTaskStore((s) => s.nodes);
  const [tab, setTab] = useState<Tab>("milestone");

  const ms = useMemo(() => milestoneProgress(nodes), [nodes]);
  const ph = useMemo(() => phaseGateProgress(nodes), [nodes]);
  const eff = useMemo(() => effortBurnup(nodes), [nodes]);
  const st = useMemo(() => statusCumulative(nodes), [nodes]);

  const option = useMemo(() => {
    const axisColor = { color: "#94a3b8" };
    if (tab === "milestone") {
      return {
        grid: { left: 8, right: 16, top: 16, bottom: 60, containLabel: true },
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category",
          data: ms.map((m) => m.milestone),
          axisLabel: { ...axisColor, interval: 0, rotate: 30 },
        },
        yAxis: { type: "value", max: 100, axisLabel: axisColor },
        series: [
          {
            type: "bar",
            barMaxWidth: 36,
            data: ms.map((m) => ({ value: m.progress, itemStyle: { color: "#38bdf8" } })),
          },
        ],
      };
    }
    if (tab === "phase") {
      return {
        grid: { left: 8, right: 16, top: 24, bottom: 50, containLabel: true },
        tooltip: { trigger: "axis" },
        legend: { top: 0, textStyle: axisColor },
        xAxis: {
          type: "category",
          data: ph.map((p) => PHASE_META[p.phase as WaterfallPhase]?.tr ?? p.phase),
          axisLabel: { ...axisColor, interval: 0, rotate: 30 },
        },
        yAxis: { type: "value", axisLabel: axisColor },
        series: [
          {
            type: "bar",
            name: t.reports.total,
            data: ph.map((p) => p.total),
            itemStyle: { color: "#64748b" },
            barMaxWidth: 22,
          },
          {
            type: "bar",
            name: t.reports.passed,
            data: ph.map((p) => p.passed),
            itemStyle: { color: "#22c55e" },
            barMaxWidth: 22,
          },
        ],
      };
    }
    if (tab === "effort") {
      return {
        grid: { left: 8, right: 16, top: 16, bottom: 24, containLabel: true },
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category",
          data: [t.reports.planned, t.reports.spent],
          axisLabel: axisColor,
        },
        yAxis: { type: "value", axisLabel: axisColor },
        series: [
          {
            type: "bar",
            barMaxWidth: 80,
            data: [
              { value: eff.plannedDays, itemStyle: { color: "#38bdf8" } },
              { value: eff.spentDays, itemStyle: { color: "#a78bfa" } },
            ],
          },
        ],
      };
    }
    return {
      tooltip: { trigger: "item" },
      legend: { bottom: 0, textStyle: axisColor },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          data: st
            .filter((s) => s.count > 0)
            .map((s) => ({
              name: STATUS_LABEL[s.status as keyof typeof STATUS_LABEL] ?? s.status,
              value: s.count,
            })),
          label: { color: "#cbd5e1" },
        },
      ],
    };
  }, [tab, ms, ph, eff, st]);

  const TABS: [Tab, string][] = [
    ["milestone", t.reports.tabMilestone],
    ["phase", t.reports.tabPhase],
    ["effort", t.reports.tabEffort],
    ["status", t.reports.tabStatus],
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium">{t.reports.title}</h1>
        <p className="text-base text-muted-foreground">{t.reports.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([key, label]) => (
          <Button
            key={key}
            variant={tab === key ? "primary" : "ghost"}
            size="sm"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card className="p-4">
        <Suspense fallback={<div className="h-[320px]" aria-hidden="true" />}>
          <EChart option={option} ariaLabel={t.reports.chartAria} height={320} />
        </Suspense>
      </Card>
    </div>
  );
}
