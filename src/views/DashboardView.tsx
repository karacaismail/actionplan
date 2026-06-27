import { Card, Icon, ProgressBar } from "@/components/ui/primitives";
import { STATUS_LABEL } from "@/lib/format";
import { t } from "@/lib/strings";
import { LEVEL_META, type WbsLevel } from "@/schemas";
import { useTaskStore } from "@/store/taskStore";
import { Link } from "@tanstack/react-router";
import { Suspense, lazy, useMemo } from "react";

// ECharts'i tembel yükle → echarts (~1MB) başlangıç paketinden çıkar.
const EChart = lazy(() =>
  import("@/components/charts/EChart").then((m) => ({ default: m.EChart })),
);

function ChartFallback() {
  return (
    <div className="grid h-[280px] place-items-center text-base text-muted-foreground">
      {t.dashboard.chartLoading}
    </div>
  );
}

const LEVEL_COLOR = ["#38bdf8", "#2dd4bf", "#a78bfa", "#fbbf24", "#f472b6", "#4ade80", "#cbd5e1"];
const STATUS_COLOR: Record<string, string> = {
  done: "#22c55e",
  "in-progress": "#38bdf8",
  blocked: "#ef4444",
  review: "#a78bfa",
  todo: "#94a3b8",
  backlog: "#64748b",
};

export function DashboardView() {
  const meta = useTaskStore((s) => s.meta);
  const tree = useTaskStore((s) => s.tree);
  const criticalCount = useTaskStore((s) => s.criticalPath.size);

  const overall = useMemo(() => {
    if (!tree.length) return 0;
    const sum = tree.reduce((acc, r) => acc + r.rollup.progress, 0);
    return Math.round(sum / tree.length);
  }, [tree]);

  const statusOption = useMemo(
    () => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0, textStyle: { color: "#94a3b8" } },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          data: Object.entries(meta.counts.byStatus).map(([k, v]) => ({
            name: STATUS_LABEL[k as keyof typeof STATUS_LABEL] ?? k,
            value: v,
            itemStyle: { color: STATUS_COLOR[k] ?? "#64748b" },
          })),
          label: { color: "#cbd5e1" },
        },
      ],
    }),
    [meta],
  );

  const levelOption = useMemo(() => {
    const entries = (Object.keys(LEVEL_META) as WbsLevel[])
      .map((lvl) => ({ lvl, count: meta.counts.byLevel[lvl] ?? 0 }))
      .filter((e) => e.count > 0);
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: "category",
        data: entries.map((e) => LEVEL_META[e.lvl].tr),
        axisLabel: { color: "#94a3b8" },
      },
      yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
      series: [
        {
          type: "bar",
          data: entries.map((e, i) => ({
            value: e.count,
            itemStyle: { color: LEVEL_COLOR[i % LEVEL_COLOR.length] },
          })),
          barMaxWidth: 48,
        },
      ],
    };
  }, [meta]);

  const apps = useMemo(() => tree.filter((n) => n.level === "app"), [tree]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <h1 className="text-xl font-medium">{t.nav.dashboard}</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon="ph-list-checks" label={t.dashboard.total} value={String(meta.counts.total)} />
        <Stat icon="ph-mountains" label={t.dashboard.apps} value={String(apps.length)} />
        <Stat icon="ph-lightning" label={t.dashboard.critical} value={String(criticalCount)} />
        <Stat icon="ph-gauge" label={t.dashboard.progress} value={`%${overall}`} />
      </div>

      <Card className="p-4">
        <p className="mb-2 text-base text-muted-foreground">{t.dashboard.progress}</p>
        <ProgressBar value={overall} />
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 font-medium">{t.dashboard.byStatus}</h2>
          <Suspense fallback={<ChartFallback />}>
            <EChart option={statusOption} ariaLabel={t.dashboard.chartStatus} />
          </Suspense>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 font-medium">{t.dashboard.byLevel}</h2>
          <Suspense fallback={<ChartFallback />}>
            <EChart option={levelOption} ariaLabel={t.dashboard.chartLevel} />
          </Suspense>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-medium">{t.dashboard.apps}</h2>
        <ul className="flex flex-col divide-y divide-border">
          {apps.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2">
              <Icon name={a.icon} className="text-primary text-xl" />
              <Link
                to="/task/$taskId"
                params={{ taskId: a.id }}
                className="min-w-0 flex-1 truncate hover:underline"
              >
                <span className="font-mono text-base text-muted-foreground">{a.wbsCode}</span>{" "}
                {a.title}
              </Link>
              <span className="text-base text-muted-foreground">
                {a.rollup.total} {t.detail.subTaskUnit}
              </span>
              <div className="w-24">
                <ProgressBar value={a.rollup.progress} />
              </div>
            </li>
          ))}
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
