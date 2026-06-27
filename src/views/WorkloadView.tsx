import { Card, Icon } from "@/components/ui/primitives";
import people from "@/data/people.json";
import { type AllocationStatus, workloadByAssignee } from "@/engine";
import { t } from "@/lib/strings";
import { PeopleArraySchema } from "@/schemas";
import { useTaskStore } from "@/store/taskStore";
import { Suspense, lazy, useMemo } from "react";

const EChart = lazy(() =>
  import("@/components/charts/EChart").then((m) => ({ default: m.EChart })),
);

const STATUS_COLOR: Record<AllocationStatus, string> = {
  over: "#ef4444",
  ok: "#22c55e",
  under: "#38bdf8",
  unknown: "#64748b",
};

export function WorkloadView() {
  const nodes = useTaskStore((s) => s.nodes);
  const ppl = useMemo(() => PeopleArraySchema.parse(people), []);
  const loads = useMemo(() => workloadByAssignee(nodes, ppl), [nodes, ppl]);
  const nameOf = (id: string) => ppl.find((p) => p.id === id)?.name ?? id;
  const statusLabel: Record<AllocationStatus, string> = {
    over: t.workload.over,
    ok: t.workload.ok,
    under: t.workload.under,
    unknown: t.workload.unknown,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: nameOf yalnızca sabit ppl'i okur; grafik sadece loads değişince yeniden kurulmalı
  const option = useMemo(
    () => ({
      grid: { left: 8, right: 16, top: 24, bottom: 60, containLabel: true },
      tooltip: { trigger: "axis" },
      legend: { top: 0, textStyle: { color: "#94a3b8" } },
      xAxis: {
        type: "category",
        data: loads.map((l) => nameOf(l.assignee)),
        axisLabel: { color: "#94a3b8", interval: 0, rotate: 30 },
      },
      yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
      series: [
        {
          type: "bar",
          name: t.workload.daysUnit,
          barMaxWidth: 36,
          data: loads.map((l) => ({
            value: Math.round(l.days * 10) / 10,
            itemStyle: { color: STATUS_COLOR[l.status] },
          })),
        },
        {
          type: "line",
          name: t.workload.capacity,
          data: loads.map((l) => l.capacity),
          itemStyle: { color: "#a78bfa" },
        },
      ],
    }),
    [loads],
  );

  const over = loads.filter((l) => l.status === "over").length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium">{t.workload.title}</h1>
        <p className="text-base text-muted-foreground">{t.workload.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon="ph-users" label={t.workload.colPerson} value={String(loads.length)} />
        <Stat icon="ph-warning-circle" label={t.workload.over} value={String(over)} />
        <Stat
          icon="ph-clock"
          label={t.workload.daysUnit}
          value={String(Math.round(loads.reduce((a, l) => a + l.days, 0)))}
        />
      </div>

      <Card className="p-4">
        {loads.length === 0 ? (
          <p className="py-6 text-center text-base text-muted-foreground">{t.workload.empty}</p>
        ) : (
          <Suspense fallback={<div className="h-[320px]" aria-hidden="true" />}>
            <EChart option={option} ariaLabel={t.workload.chartAria} height={320} />
          </Suspense>
        )}
      </Card>

      <Card className="p-0">
        <section className="overflow-x-auto" aria-label={t.workload.title}>
          <table className="w-full border-collapse text-base">
            <caption className="sr-only">{t.workload.title}</caption>
            <thead>
              <tr className="border-border border-b">
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  {t.workload.colPerson}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {t.workload.colDays}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {t.workload.colCapacity}
                </th>
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  {t.workload.colStatus}
                </th>
              </tr>
            </thead>
            <tbody>
              {loads.map((l) => (
                <tr key={l.assignee} className="border-border border-b">
                  <td className="px-3 py-2">{nameOf(l.assignee)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {Math.round(l.days * 10) / 10}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.capacity}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: STATUS_COLOR[l.status] }}
                        aria-hidden="true"
                      />
                      {statusLabel[l.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
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
