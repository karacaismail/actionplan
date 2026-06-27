import { ExportImportBar } from "@/components/toolbar/ExportImportBar";
import { Button, Card, Icon } from "@/components/ui/primitives";
import { WbsTree } from "@/components/wbs-tree/WbsTree";
import { flattenTree } from "@/engine";
import { t } from "@/lib/strings";
import { useTaskStore } from "@/store/taskStore";
import { useMemo, useState } from "react";

export function WbsView() {
  const tree = useTaskStore((s) => s.tree);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");

  const allIds = useMemo(() => flattenTree(tree).map((n) => n.id), [tree]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // arama: eşleşen düğümlerin atalarını açık tut
  const filteredTree = useMemo(() => {
    if (!query.trim()) return tree;
    const q = query.toLocaleLowerCase("tr");
    const match = (title: string, code: string) =>
      title.toLocaleLowerCase("tr").includes(q) || code.includes(q);
    const filter = (nodes: typeof tree): typeof tree =>
      nodes
        .map((n) => {
          const kids = filter(n.children);
          if (match(n.title, n.wbsCode) || kids.length) return { ...n, children: kids };
          return null;
        })
        .filter(Boolean) as typeof tree;
    return filter(tree);
  }, [tree, query]);

  const expandedForView = useMemo(() => {
    if (!query.trim()) return expanded;
    return new Set(flattenTree(filteredTree).map((n) => n.id)); // aramada hepsi açık
  }, [query, expanded, filteredTree]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-medium">{t.nav.wbs}</h1>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={() => setExpanded(new Set(allIds))}>
            <Icon name="ph-arrows-out-line-vertical" /> {t.actions.expandAll}
          </Button>
          <Button size="sm" onClick={() => setExpanded(new Set())}>
            <Icon name="ph-arrows-in-line-vertical" /> {t.actions.collapseAll}
          </Button>
        </div>
      </div>

      <ExportImportBar />

      <label className="relative block">
        <Icon
          name="ph-magnifying-glass"
          className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${t.nav.search}… (başlık veya WBS kodu)`}
          className="tap-target w-full rounded-md border border-input bg-card py-2 pr-3 pl-9 text-base"
          aria-label={t.nav.search}
        />
      </label>

      <Card className="p-2">
        <WbsTree nodes={filteredTree} expanded={expandedForView} onToggle={toggle} />
      </Card>
    </div>
  );
}
