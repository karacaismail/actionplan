import { Badge, Card, Icon, ProgressBar, StatusBadge } from "@/components/ui/primitives";
import { ExportImportBar } from "@/components/toolbar/ExportImportBar";
import { cn } from "@/lib/cn";
import { PRIORITY_LABEL, STATUS_LABEL, hslVar, levelLabel, levelVar } from "@/lib/format";
import { t } from "@/lib/strings";
import {
  LEVEL_META,
  STATUS_LIST,
  WBS_LEVELS,
  type Priority,
  type TaskNode,
  type TaskStatus,
  type WbsLevel,
} from "@/schemas";
import { taskStore, useTaskStore } from "@/store/taskStore";
import { Link } from "@tanstack/react-router";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

type ViewMode = "kanban" | "table";

const PRIORITY_VAR: Record<Priority, string> = {
  low: "--status-backlog",
  medium: "--status-todo",
  high: "--status-review",
  critical: "--status-blocked",
};

/** Seviyeyi renkli nokta ile gösteren küçük işaret. */
function LevelDot({ level }: { level: WbsLevel }) {
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ background: hslVar(levelVar(level)) }}
      title={LEVEL_META[level].tr}
      aria-hidden="true"
    />
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const color = hslVar(PRIORITY_VAR[priority]);
  return <Badge color={color}>{PRIORITY_LABEL[priority]}</Badge>;
}

/* ---------------------------------------------------------------------------
 * KANBAN
 * ------------------------------------------------------------------------- */

function KanbanCard({ node }: { node: TaskNode }) {
  function onDragStart(e: React.DragEvent<HTMLElement>) {
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className="cursor-grab space-y-2 p-3 active:cursor-grabbing"
      aria-label={`${node.wbsCode} ${node.title}`}
    >
      <div className="flex items-center gap-2">
        <LevelDot level={node.level} />
        <span className="font-mono text-base text-muted-foreground">{node.wbsCode}</span>
      </div>
      <Link
        to="/task/$taskId"
        params={{ taskId: node.id }}
        className="block truncate font-medium text-foreground hover:underline"
        title={node.title}
      >
        {node.title}
      </Link>
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={node.priority} />
        {node.owner && (
          <span className="truncate text-base text-muted-foreground">
            <Icon name="ph-user" /> {node.owner}
          </span>
        )}
      </div>
      <ProgressBar value={node.progress} />
      <label className="flex items-center gap-2 text-base text-muted-foreground">
        <span className="sr-only">{t.fields.status} değiştir</span>
        <Icon name="ph-arrows-left-right" />
        <select
          value={node.status}
          onChange={(e) => taskStore.updateNode(node.id, { status: e.target.value as TaskStatus })}
          className="tap-target w-full rounded-md border border-border bg-card px-2 py-1 text-base"
          aria-label={`${node.title} ${t.a11y.statusSuffix}`}
        >
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}

function KanbanColumn({
  status,
  nodes,
  onDropNode,
}: {
  status: TaskStatus;
  nodes: TaskNode[];
  onDropNode: (id: string, status: TaskStatus) => void;
}) {
  const [over, setOver] = useState(false);

  return (
    <section
      className={cn(
        "flex min-w-[16rem] flex-1 flex-col rounded-lg border border-border bg-secondary/40 p-2",
        over && "border-primary",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDropNode(id, status);
      }}
      aria-label={STATUS_LABEL[status]}
    >
      <header className="flex items-center justify-between px-1 pb-2">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <span
            className="size-2.5 rounded-full"
            style={{ background: hslVar(`--status-${status === "in-progress" ? "progress" : status}`) }}
            aria-hidden="true"
          />
          {STATUS_LABEL[status]}
        </span>
        <Badge>{nodes.length}</Badge>
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {nodes.length === 0 ? (
          <p className="px-1 py-4 text-base text-muted-foreground">{t.empty.noResults}</p>
        ) : (
          nodes.map((n) => <KanbanCard key={n.id} node={n} />)
        )}
      </div>
    </section>
  );
}

function KanbanBoard({ nodes }: { nodes: TaskNode[] }) {
  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, TaskNode[]>();
    for (const s of STATUS_LIST) map.set(s, []);
    for (const n of nodes) map.get(n.status)?.push(n);
    return map;
  }, [nodes]);

  function onDropNode(id: string, status: TaskStatus) {
    taskStore.updateNode(id, { status });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2" role="list" aria-label={t.a11y.kanbanBoard}>
      {STATUS_LIST.map((s) => (
        <KanbanColumn key={s} status={s} nodes={byStatus.get(s) ?? []} onDropNode={onDropNode} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * TABLO (TanStack Table v8)
 * ------------------------------------------------------------------------- */

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <Icon name="ph-caret-up" className="text-muted-foreground" />;
  if (dir === "desc") return <Icon name="ph-caret-down" className="text-muted-foreground" />;
  return <Icon name="ph-caret-up-down" className="text-muted-foreground/50" />;
}

function TaskTable({ nodes }: { nodes: TaskNode[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "wbsCode", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<WbsLevel | "">("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");

  const columns = useMemo<ColumnDef<TaskNode>[]>(
    () => [
      {
        accessorKey: "wbsCode",
        header: t.fields.wbsCode,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-base text-muted-foreground">
            {row.original.wbsCode}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: t.fields.title,
        cell: ({ row }) => (
          <Link
            to="/task/$taskId"
            params={{ taskId: row.original.id }}
            className="flex items-center gap-2 hover:underline"
          >
            <LevelDot level={row.original.level} />
            <span className="min-w-[12rem] truncate font-medium text-foreground">
              {row.original.title}
            </span>
          </Link>
        ),
      },
      {
        accessorKey: "level",
        header: t.fields.level,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-base">{levelLabel(row.original.level)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: t.fields.status,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "priority",
        header: t.fields.priority,
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: "owner",
        header: t.fields.owner,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-base text-muted-foreground">
            {row.original.owner ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "progress",
        header: t.fields.progress,
        cell: ({ row }) => (
          <div className="flex min-w-[7rem] items-center gap-2">
            <ProgressBar value={row.original.progress} />
            <span className="w-9 shrink-0 text-right text-base text-muted-foreground">
              {row.original.progress}%
            </span>
          </div>
        ),
      },
      {
        accessorKey: "phase",
        header: t.fields.phase,
        cell: ({ row }) => <span className="whitespace-nowrap text-base">{row.original.phase}</span>,
      },
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      nodes.filter(
        (n) =>
          (levelFilter === "" || n.level === levelFilter) &&
          (statusFilter === "" || n.status === statusFilter),
      ),
    [nodes, levelFilter, statusFilter],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-[12rem] flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Icon name="ph-magnifying-glass" className="text-muted-foreground" />
          <span className="sr-only">{t.nav.search}</span>
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t.a11y.searchPlaceholder}
            className="w-full bg-transparent text-base outline-none"
            aria-label={t.a11y.searchTasks}
          />
        </label>
        <label className="flex items-center gap-2 text-base text-muted-foreground">
          <span className="sr-only">{t.fields.level} filtresi</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as WbsLevel | "")}
            className="tap-target rounded-md border border-border bg-card px-2 py-2 text-base text-foreground"
            aria-label={`${t.fields.level} filtresi`}
          >
            <option value="">{t.a11y.allLevels}</option>
            {WBS_LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {LEVEL_META[lv].tr}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-base text-muted-foreground">
          <span className="sr-only">{t.fields.status} filtresi</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "")}
            className="tap-target rounded-md border border-border bg-card px-2 py-2 text-base text-foreground"
            aria-label={`${t.fields.status} filtresi`}
          >
            <option value="">{t.a11y.allStatuses}</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-base">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-border border-b">
                {hg.headers.map((header) => {
                  const sortDir = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sortDir === "asc"
                          ? "ascending"
                          : sortDir === "desc"
                            ? "descending"
                            : "none"
                      }
                      className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="tap-target inline-flex items-center gap-1 hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon dir={sortDir} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
                  {t.empty.noResults}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-border/60 border-b last:border-0 hover:bg-secondary/40">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <p className="text-base text-muted-foreground" role="status">
        {table.getRowModel().rows.length} / {nodes.length} {t.a11y.taskUnit}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Görünüm kabuğu
 * ------------------------------------------------------------------------- */

export function BoardView() {
  const nodes = useTaskStore((s) => s.nodes);
  const [mode, setMode] = useState<ViewMode>("kanban");

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium">{t.nav.board}</h1>
        <ExportImportBar />
      </header>

      <div
        className="inline-flex rounded-md border border-border bg-card p-1"
        role="tablist"
        aria-label={t.a11y.viewSelect}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "kanban"}
          onClick={() => setMode("kanban")}
          className={cn(
            "tap-target inline-flex items-center gap-2 rounded px-4 py-2 text-base transition-colors",
            mode === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
          )}
        >
          <Icon name="ph-kanban" /> Kanban
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "table"}
          onClick={() => setMode("table")}
          className={cn(
            "tap-target inline-flex items-center gap-2 rounded px-4 py-2 text-base transition-colors",
            mode === "table" ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
          )}
        >
          <Icon name="ph-table" /> Tablo
        </button>
      </div>

      {mode === "kanban" ? <KanbanBoard nodes={nodes} /> : <TaskTable nodes={nodes} />}
    </div>
  );
}
