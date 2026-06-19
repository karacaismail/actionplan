import { Button, Card, Icon, ProgressBar, StatusBadge } from "@/components/ui/primitives";
import { auditNode, filterNodes, groupNodes, isQueryError, parseQuery, sortNodes } from "@/engine";
import type { QueryAst, SortDir } from "@/engine";
import { PRIORITY_LABEL } from "@/lib/format";
import { t } from "@/lib/strings";
import { LEVEL_META, type TaskNode } from "@/schemas";
import { type SavedView, loadSavedViews, loadViewState, saveSavedViews, saveViewState } from "@/store/viewState";
import { useTaskStore } from "@/store/taskStore";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

const COLS = ["wbsCode", "title", "level", "status", "priority", "owner", "milestone", "progress", "effort", "score"] as const;
type Col = (typeof COLS)[number];
const PAGE = 50;
const CTRL =
  "tap-target rounded-md border border-border bg-background px-2 py-1 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const QUICK = [
  { label: "done", q: "status = done" },
  { label: "in-progress", q: "status = in-progress" },
  { label: "blocked", q: "status = blocked" },
  { label: "app", q: "level = app" },
  { label: "kritik", q: "criticalPath = true" },
];

export function TableView() {
  const nodes = useTaskStore((s) => s.nodes);
  const init = useRef(loadViewState());
  const [query, setQuery] = useState(init.current.query ?? "");
  const [debounced, setDebounced] = useState(query);
  const [sortField, setSortField] = useState<string>(init.current.sort?.[0]?.col ?? "wbsCode");
  const [sortDir, setSortDir] = useState<SortDir>(init.current.sort?.[0]?.dir ?? "asc");
  const [groupBy, setGroupBy] = useState<string>(init.current.group ?? "");
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<Set<Col>>(new Set());
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => loadSavedViews());
  const [viewName, setViewName] = useState("");
  const lastGood = useRef<QueryAst>({ kind: "true" });

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(id);
  }, [query]);
  useEffect(() => {
    saveViewState({ query: debounced, sort: [{ col: sortField, dir: sortDir }], group: groupBy || null });
  }, [debounced, sortField, sortDir, groupBy]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: sayfa filtre/sıra/grup değişince başa döner
  useEffect(() => setPage(0), [debounced, sortField, sortDir, groupBy]);

  const scoreMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) m.set(n.id, auditNode(n).score);
    return m;
  }, [nodes]);
  const scoreOf = (n: TaskNode) => scoreMap.get(n.id) ?? 0;

  const parsed = parseQuery(debounced);
  const queryError = isQueryError(parsed) ? parsed.error : null;
  if (!isQueryError(parsed)) lastGood.current = parsed;

  const sorted = useMemo(
    () => sortNodes(filterNodes(nodes, lastGood.current), sortField, sortDir, scoreOf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, debounced, sortField, sortDir],
  );
  const groups = groupBy ? groupNodes(sorted, groupBy) : null;
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE));
  const paged = groups ? null : sorted.slice(page * PAGE, page * PAGE + PAGE);
  const visibleCols = COLS.filter((c) => !hidden.has(c));

  const toggleSort = (col: string) => {
    if (sortField === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(col);
      setSortDir("asc");
    }
  };
  const ariaSort = (col: string): "ascending" | "descending" | "none" =>
    sortField === col ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  const saveView = () => {
    const v: SavedView = {
      id: `v-${Date.now()}`,
      name: viewName.trim() || debounced || t.table.title,
      query: debounced,
      columns: visibleCols,
      sort: [{ col: sortField, dir: sortDir }],
      group: groupBy || null,
      createdAt: new Date().toISOString(),
    };
    const next = [...savedViews, v];
    setSavedViews(next);
    saveSavedViews(next);
    setViewName("");
  };
  const applyView = (v: SavedView) => {
    setQuery(v.query);
    setDebounced(v.query);
    if (v.sort[0]) {
      setSortField(v.sort[0].col);
      setSortDir(v.sort[0].dir);
    }
    setGroupBy(v.group ?? "");
    setHidden(new Set(COLS.filter((c) => v.columns.length > 0 && !v.columns.includes(c))));
  };
  const deleteView = (id: string) => {
    const next = savedViews.filter((v) => v.id !== id);
    setSavedViews(next);
    saveSavedViews(next);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium">{t.table.title}</h1>
        <p className="text-base text-muted-foreground">{t.table.subtitle}</p>
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="tableFilter" className="text-base font-medium">
            {t.table.filterLabel}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="tableFilter"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.table.filterPlaceholder}
              className={`${CTRL} flex-1`}
              aria-invalid={queryError ? true : undefined}
              aria-describedby={queryError ? "filterErr" : undefined}
            />
            <Button variant="ghost" size="sm" onClick={() => setQuery("")} aria-label={t.table.clear}>
              <Icon name="ph-x" className="text-base" />
            </Button>
          </div>
          {queryError && (
            <p id="filterErr" role="alert" className="text-base text-[hsl(var(--status-blocked))]">
              {t.table.filterError}: {queryError}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base text-muted-foreground">{t.table.quickFilters}:</span>
          {QUICK.map((q) => (
            <Button key={q.label} variant="outline" size="sm" onClick={() => setQuery(q.q)}>
              {q.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="groupBy" className="text-base text-muted-foreground">
              {t.table.group}
            </label>
            <select id="groupBy" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className={CTRL}>
              <option value="">{t.table.noGroup}</option>
              {["level", "status", "milestone", "cluster", "owner", "priority"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="savedView" className="text-base text-muted-foreground">
              {t.table.savedViews}
            </label>
            <select
              id="savedView"
              className={CTRL}
              value=""
              onChange={(e) => {
                const v = savedViews.find((x) => x.id === e.target.value);
                if (v) applyView(v);
              }}
            >
              <option value="">—</option>
              {savedViews.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder={t.table.viewNamePlaceholder}
              className={`${CTRL} w-36`}
              aria-label={t.table.viewNamePlaceholder}
            />
            <Button variant="outline" size="sm" onClick={saveView}>
              <Icon name="ph-floppy-disk" className="text-base" />
              {t.table.saveView}
            </Button>
          </div>
          <span className="ml-auto text-base text-muted-foreground tabular-nums">
            {sorted.length} {t.table.rowsUnit}
          </span>
        </div>

        <details className="text-base">
          <summary className="tap-target cursor-pointer text-muted-foreground">{t.table.columns}</summary>
          <div className="mt-2 flex flex-wrap gap-3">
            {COLS.map((c) => (
              <label key={c} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!hidden.has(c)}
                  onChange={(e) =>
                    setHidden((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.delete(c);
                      else next.add(c);
                      return next;
                    })
                  }
                />
                {t.table.col[c]}
              </label>
            ))}
          </div>
        </details>
      </Card>

      <Card className="overflow-x-auto p-0">
        {sorted.length === 0 ? (
          <p className="p-6 text-center text-base text-muted-foreground">{t.table.empty}</p>
        ) : (
          <table className="w-full border-collapse text-base">
            <caption className="sr-only">{t.table.title}</caption>
            <thead>
              <tr className="border-border border-b">
                {visibleCols.map((c) => (
                  <th key={c} scope="col" aria-sort={ariaSort(c)} className="px-3 py-2 text-left font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort(c)}
                      className="tap-target inline-flex items-center gap-1 hover:underline"
                      aria-label={`${t.table.col[c]} — ${sortDir === "asc" ? t.table.sortDesc : t.table.sortAsc}`}
                    >
                      {t.table.col[c]}
                      {sortField === c && <Icon name={sortDir === "asc" ? "ph-caret-up" : "ph-caret-down"} className="text-sm" />}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            {groups
              ? groups.map((g) => (
                  <tbody key={g.key}>
                    <tr className="bg-secondary">
                      <th scope="colgroup" colSpan={visibleCols.length} className="px-3 py-1 text-left font-medium">
                        {g.key} <span className="text-muted-foreground tabular-nums">({g.nodes.length})</span>
                      </th>
                    </tr>
                    {g.nodes.map((n) => (
                      <Row key={n.id} n={n} cols={visibleCols} score={scoreOf(n)} />
                    ))}
                  </tbody>
                ))
              : (
                <tbody>
                  {paged?.map((n) => (
                    <Row key={n.id} n={n} cols={visibleCols} score={scoreOf(n)} />
                  ))}
                </tbody>
              )}
          </table>
        )}
      </Card>

      {!groups && pageCount > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label={t.table.pageLabel}>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <Icon name="ph-caret-left" className="text-base" /> {t.table.prev}
          </Button>
          <span className="text-base text-muted-foreground tabular-nums">
            {t.table.pageLabel} {page + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
          >
            {t.table.next} <Icon name="ph-caret-right" className="text-base" />
          </Button>
        </nav>
      )}
    </div>
  );
}

function Row({ n, cols, score }: { n: TaskNode; cols: readonly string[]; score: number }) {
  const bandColor = score >= 2.3 ? "#22c55e" : score >= 1.5 ? "#38bdf8" : "#ef4444";
  return (
    <tr className="border-border border-b hover:bg-secondary/50">
      {cols.map((c) => (
        <td key={c} className="px-3 py-2 align-middle">
          {c === "wbsCode" && <span className="font-mono text-muted-foreground">{n.wbsCode}</span>}
          {c === "title" && (
            <Link to="/task/$taskId" params={{ taskId: n.id }} className="hover:underline">
              {n.title}
            </Link>
          )}
          {c === "level" && LEVEL_META[n.level].tr}
          {c === "status" && <StatusBadge status={n.status} />}
          {c === "priority" && PRIORITY_LABEL[n.priority]}
          {c === "owner" && (n.owner ?? "—")}
          {c === "milestone" && <span className="truncate">{n.milestone ?? "—"}</span>}
          {c === "progress" && (
            <span className="flex items-center gap-2">
              <span className="w-10 tabular-nums">%{n.progress}</span>
              <span className="hidden w-16 sm:block">
                <ProgressBar value={n.progress} />
              </span>
            </span>
          )}
          {c === "effort" && <span className="tabular-nums">{n.effort.estimate}</span>}
          {c === "score" && (
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: bandColor }} aria-hidden="true" />
              <span className="tabular-nums">{score}</span>
            </span>
          )}
        </td>
      ))}
    </tr>
  );
}
