import { Button, Card, Icon } from "@/components/ui/primitives";
import { STATUS_LABEL } from "@/lib/format";
import { t } from "@/lib/strings";
import { STATUS_LIST, type TaskNode, type TaskStatus } from "@/schemas";
import { taskStore, useTaskStore } from "@/store/taskStore";
import { Link } from "@tanstack/react-router";
import { Suspense, lazy, useMemo, useState } from "react";

const EChart = lazy(() => import("@/components/charts/EChart").then((m) => ({ default: m.EChart })));

const CTRL =
  "tap-target rounded-md border border-border bg-background px-2 py-1 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const EXEC_LEVELS = ["app", "module", "archetype"] as const;
const ALL = "__all";

export function ExecutionView() {
  const nodes = useTaskStore((s) => s.nodes);
  const overrides = useTaskStore((s) => s.overrides);
  const [milestone, setMilestone] = useState<string>(ALL);

  const milestones = useMemo(
    () => [...new Set(nodes.map((n) => n.milestone).filter((m): m is string => Boolean(m)))].sort(),
    [nodes],
  );

  const editable = useMemo(
    () => nodes.filter((n) => (EXEC_LEVELS as readonly string[]).includes(n.level)),
    [nodes],
  );
  const rows = useMemo(
    () => (milestone === ALL ? editable : editable.filter((n) => n.milestone === milestone)),
    [editable, milestone],
  );

  const totals = useMemo(() => {
    let effortDays = 0;
    let spent = 0;
    const asg = new Set<string>();
    const ms = new Set<string>();
    for (const n of nodes) {
      if (n.effort.unit === "d") {
        effortDays += n.effort.estimate;
        spent += n.effort.spent;
      }
      if (n.owner) asg.add(n.owner);
      if (n.milestone) ms.add(n.milestone);
    }
    return { effortDays, spent, assignees: asg.size, milestones: ms.size };
  }, [nodes]);

  const effortOption = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes)
      if (n.effort.unit === "d") m.set(n.milestone ?? "—", (m.get(n.milestone ?? "—") ?? 0) + n.effort.estimate);
    const data = [...m.entries()].filter(([, v]) => v > 0).sort((a, b) => a[1] - b[1]);
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      xAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
      yAxis: { type: "category", data: data.map((d) => d[0]), axisLabel: { color: "#94a3b8" } },
      series: [{ type: "bar", data: data.map((d) => d[1]), itemStyle: { color: "#38bdf8" }, barMaxWidth: 22 }],
    };
  }, [nodes]);

  const overrideCount = Object.keys(overrides).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium">{t.execution.title}</h1>
          <p className="text-base text-muted-foreground">{t.execution.subtitle}</p>
        </div>
        {overrideCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => taskStore.clearLocal()}>
            <Icon name="ph-arrow-counter-clockwise" className="text-base" />
            {t.execution.clearLocal} ({overrideCount})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon="ph-clock" label={t.execution.totalEffort} value={String(totals.effortDays)} />
        <Stat icon="ph-hourglass" label={t.execution.spent} value={String(totals.spent)} />
        <Stat icon="ph-users" label={t.execution.assignees} value={String(totals.assignees)} />
        <Stat icon="ph-flag" label={t.execution.milestones} value={String(totals.milestones)} />
      </div>

      <Card className="p-4">
        <h2 className="mb-2 font-medium">{t.execution.chartEffortByMilestone}</h2>
        <Suspense fallback={<div className="h-[280px]" aria-hidden="true" />}>
          <EChart option={effortOption} ariaLabel={t.execution.chartEffortByMilestone} />
        </Suspense>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label htmlFor="ms-filter" className="text-base text-muted-foreground">
            {t.execution.filterMilestone}
          </label>
          <select
            id="ms-filter"
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
            className={CTRL}
          >
            <option value={ALL}>{t.execution.allMilestones}</option>
            {milestones.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {overrideCount > 0 && <span className="text-base text-muted-foreground">· {t.execution.savedLocally}</span>}
        </div>

        {rows.length === 0 ? (
          <p className="py-6 text-center text-base text-muted-foreground">{t.execution.empty}</p>
        ) : (
          <div className="flex flex-col">{rows.map((n) => <EditRow key={n.id} n={n} />)}</div>
        )}
      </Card>
    </div>
  );
}

function EditRow({ n }: { n: TaskNode }) {
  const set = (patch: Partial<TaskNode>) => taskStore.updateNode(n.id, patch);
  return (
    <div className="grid grid-cols-1 gap-2 border-border border-b py-3 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <Link to="/task/$taskId" params={{ taskId: n.id }} className="truncate font-medium hover:underline">
          <span className="font-mono text-base text-muted-foreground">{n.wbsCode}</span> {n.title}
        </Link>
        <div className="truncate text-base text-muted-foreground">{n.milestone ?? "—"}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label={`${n.title} — ${t.execution.colStatus}`}
          value={n.status}
          onChange={(e) => set({ status: e.target.value as TaskStatus })}
          className={CTRL}
        >
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input
          aria-label={`${n.title} — ${t.execution.colOwner}`}
          value={n.owner ?? ""}
          onChange={(e) => set({ owner: e.target.value || null })}
          className={`${CTRL} w-24`}
        />
        <input
          type="number"
          min={0}
          aria-label={`${n.title} — ${t.execution.colEffort}`}
          value={n.effort.estimate}
          onChange={(e) => set({ effort: { ...n.effort, unit: "d", estimate: Math.max(0, Number(e.target.value) || 0) } })}
          className={`${CTRL} w-16`}
        />
        <input
          type="date"
          aria-label={`${n.title} — ${t.execution.colStart}`}
          value={n.schedule.start ?? ""}
          onChange={(e) => set({ schedule: { ...n.schedule, start: e.target.value || null } })}
          className={CTRL}
        />
        <input
          type="date"
          aria-label={`${n.title} — ${t.execution.colEnd}`}
          value={n.schedule.end ?? ""}
          onChange={(e) => set({ schedule: { ...n.schedule, end: e.target.value || null } })}
          className={CTRL}
        />
      </div>
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
