import { Card, Icon } from "@/components/ui/primitives";
import { coverageByStandard, dimensionsByFamily } from "@/engine";
import { t } from "@/lib/strings";
import { DIMENSION_META, type DimensionKey } from "@/schemas";
import { useTaskStore } from "@/store/taskStore";
import { useMemo } from "react";

export function StandardsView() {
  const nodes = useTaskStore((s) => s.nodes);
  const coverage = useMemo(() => coverageByStandard(nodes), [nodes]);
  const families = useMemo(() => dimensionsByFamily(), []);
  const famLabel = t.families as Record<string, string>;
  const stdFamLabel = t.standardFamilies as Record<string, string>;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium">{t.standards.title}</h1>
        <p className="text-base text-muted-foreground">{t.standards.subtitle}</p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-medium">{t.standards.familiesTitle}</h2>
        <div
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
          role="group"
          aria-label={t.standards.familyAria}
        >
          {families.map((g) => (
            <div key={g.family} className="rounded-md border border-border p-3">
              <div className="font-medium">{famLabel[g.family] ?? g.family}</div>
              <ul className="mt-2 flex flex-col gap-1 text-base text-muted-foreground">
                {g.keys.map((k) => (
                  <li key={k} className="flex items-center gap-2">
                    <Icon name={DIMENSION_META[k as DimensionKey].icon} className="text-primary" />
                    {DIMENSION_META[k as DimensionKey].tr}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-medium">{t.standards.coverageTitle}</h2>
        <div
          tabIndex={0}
          role="group"
          aria-label={t.standards.tableAria}
          className="overflow-x-auto"
        >
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 pr-3 font-medium">{t.standards.colStandard}</th>
                <th className="py-1 pr-3 font-medium">{t.standards.colFamily}</th>
                <th className="py-1 pr-3 font-medium tabular-nums">{t.standards.colRules}</th>
                <th className="py-1 font-medium tabular-nums">{t.standards.colRefs}</th>
              </tr>
            </thead>
            <tbody>
              {coverage.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="py-2 pr-3">{c.name}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {stdFamLabel[c.family] ?? c.family}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{c.rules}</td>
                  <td className="py-2 tabular-nums">{c.refCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
