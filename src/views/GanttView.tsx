import { Button, Card, Icon } from "@/components/ui/primitives";
import { dayspan, diffBaseline, toGanttBars } from "@/engine";
import { t } from "@/lib/strings";
import { taskStore, useTaskStore } from "@/store/taskStore";
import { Link } from "@tanstack/react-router";
import { Suspense, lazy, useMemo, useState } from "react";

const EChart = lazy(() =>
  import("@/components/charts/EChart").then((m) => ({ default: m.EChart })),
);

export function GanttView() {
  const nodes = useTaskStore((s) => s.nodes);
  const [scope, setScope] = useState("");

  const milestones = useMemo(
    () => [...new Set(nodes.map((n) => n.milestone).filter((m): m is string => Boolean(m)))].sort(),
    [nodes],
  );
  const bars = useMemo(
    () => toGanttBars(nodes, scope ? { milestone: scope } : undefined),
    [nodes, scope],
  );
  const minDay = useMemo(
    () => (bars.length ? bars.reduce((m, b) => (b.start < m ? b.start : m), bars[0].start) : null),
    [bars],
  );

  const option = useMemo(() => {
    if (!bars.length || !minDay) return {};
    return {
      grid: { left: 8, right: 16, top: 16, bottom: 28, containLabel: true },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "value",
        name: t.gantt.dayAxis,
        nameTextStyle: { color: "#94a3b8" },
        axisLabel: { color: "#94a3b8" },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: bars.map((b) => b.title),
        axisLabel: { color: "#94a3b8" },
      },
      series: [
        {
          type: "bar",
          stack: "g",
          silent: true,
          itemStyle: { color: "transparent" },
          data: bars.map((b) => dayspan(minDay, b.start)),
        },
        {
          type: "bar",
          stack: "g",
          barMaxWidth: 18,
          data: bars.map((b) => ({
            value: Math.max(1, dayspan(b.start, b.end)),
            itemStyle: { color: b.criticalPath ? "#ef4444" : "#38bdf8" },
          })),
        },
      ],
    };
  }, [bars, minDay]);

  const slips = useMemo(() => {
    const out: { id: string; title: string; slip: number }[] = [];
    for (const b of bars) {
      const n = nodes.find((x) => x.id === b.id);
      const d = n ? diffBaseline(n) : null;
      if (d && d.slipDays !== 0) out.push({ id: b.id, title: b.title, slip: d.slipDays });
    }
    return out;
  }, [bars, nodes]);

  const dateless = nodes.length - toGanttBars(nodes).length;

  const freeze = () => {
    for (const b of bars) {
      const n = nodes.find((x) => x.id === b.id);
      if (n)
        taskStore.updateNode(n.id, {
          schedule: { ...n.schedule, baselineStart: n.schedule.start, baselineEnd: n.schedule.end },
        });
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium">{t.gantt.title}</h1>
          <p className="text-base text-muted-foreground">{t.gantt.subtitle}</p>
        </div>
        {bars.length > 0 && (
          <Button variant="outline" size="sm" onClick={freeze}>
            <Icon name="ph-camera" className="text-base" />
            {t.gantt.freeze}
          </Button>
        )}
      </div>

      <Card className="flex flex-wrap items-center gap-2 p-3">
        <label htmlFor="ganttScope" className="text-base text-muted-foreground">
          {t.gantt.scope}
        </label>
        <select
          id="ganttScope"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="tap-target rounded-md border border-border bg-background px-2 py-1 text-base text-foreground"
        >
          <option value="">{t.gantt.all}</option>
          {milestones.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="ml-auto text-base text-muted-foreground tabular-nums">
          {dateless} {t.gantt.unplanned}
        </span>
      </Card>

      <Card className="p-4">
        {bars.length === 0 ? (
          <p className="py-6 text-center text-base text-muted-foreground">{t.gantt.empty}</p>
        ) : (
          <Suspense fallback={<div className="h-[360px]" aria-hidden="true" />}>
            <EChart
              option={option}
              ariaLabel={t.gantt.chartAria}
              height={Math.max(240, bars.length * 28 + 60)}
            />
          </Suspense>
        )}
      </Card>

      {slips.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 font-medium">
            {t.gantt.planBar} → {t.gantt.frozen}
          </h2>
          <ul className="flex flex-col divide-y divide-border">
            {slips.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2">
                <span
                  className="w-16 shrink-0 text-right font-mono tabular-nums"
                  style={{ color: s.slip > 0 ? "#ef4444" : "#22c55e" }}
                >
                  {s.slip > 0 ? `+${s.slip}` : s.slip}
                </span>
                <span className="text-base text-muted-foreground">{t.gantt.slipUnit}</span>
                <Link
                  to="/task/$taskId"
                  params={{ taskId: s.id }}
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
