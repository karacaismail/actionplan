import { EcaPanel } from "@/components/eca/EcaPanel";
import { WorkflowPanel } from "@/components/eca/WorkflowPanel";
import { Badge, Button, Card, Icon, StatusBadge } from "@/components/ui/primitives";
import { downloadFile, exportTask, getAncestors, nodeStandards } from "@/engine";
import { cn } from "@/lib/cn";
import { PRIORITY_LABEL, STATUS_LABEL, hslVar, levelLabel, levelVar } from "@/lib/format";
import { t } from "@/lib/strings";
import {
  DIMENSION_FAMILIES,
  DIMENSION_FAMILY,
  DIMENSION_KEYS,
  DIMENSION_META,
  PHASE_META,
  PRIORITY_LIST,
  type Priority,
  STATUS_LIST,
  type TaskNode,
  type TaskStatus,
  WATERFALL_PHASES,
  type WaterfallPhase,
} from "@/schemas";
import { taskStore, useTaskStore } from "@/store/taskStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "@tanstack/react-router";
import { Fragment } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const editSchema = z.object({
  status: z.enum(STATUS_LIST),
  priority: z.enum(PRIORITY_LIST),
  owner: z.string(),
  progress: z.coerce.number().min(0).max(100),
  phase: z.enum(WATERFALL_PHASES),
  effortEstimate: z.coerce.number().min(0),
});
type EditValues = z.infer<typeof editSchema>;

export function TaskDetailView() {
  const { taskId } = useParams({ strict: false }) as { taskId?: string };
  const node = useTaskStore((s) => (taskId ? s.index.get(taskId) : undefined));
  const index = useTaskStore((s) => s.index);

  if (!node) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-muted-foreground">{t.empty.selectNode}</p>
        <Link to="/wbs" className="text-primary underline">
          {t.nav.wbs}
        </Link>
      </div>
    );
  }

  const ancestors = getAncestors(index, node.id).slice(0, -1);
  const color = hslVar(levelVar(node.level));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      {/* Breadcrumb */}
      <nav
        aria-label={t.detail.location}
        className="flex flex-wrap items-center gap-1 text-base text-muted-foreground"
      >
        <Link to="/wbs" className="hover:text-foreground">
          {t.nav.wbs}
        </Link>
        {ancestors.map((a) => (
          <span key={a.id} className="flex items-center gap-1">
            <Icon name="ph-caret-right" className="text-xs" />
            <Link to="/task/$taskId" params={{ taskId: a.id }} className="hover:text-foreground">
              {a.title}
            </Link>
          </span>
        ))}
      </nav>

      {/* Başlık */}
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base text-muted-foreground">{node.wbsCode}</span>
            <Badge color={color}>
              <Icon name={node.icon} /> {levelLabel(node.level)}
            </Badge>
            <StatusBadge status={node.status} />
            {node.criticalPath && (
              <Badge color="hsl(38 92% 62%)">
                <Icon name="ph-lightning" /> {t.detail.criticalPath}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              aria-label={t.a11y.exportTaskAria}
              onClick={() =>
                downloadFile(
                  `${node.wbsCode || node.id}-${node.id}.json`,
                  exportTask(node, index),
                  "application/json",
                )
              }
            >
              <Icon name="ph-export" /> {t.actions.exportTask}
            </Button>
            <a
              href={`https://github.com/karacaismail/actionplan/issues/new?template=wbs-node.yml&title=${encodeURIComponent(
                `[${node.wbsCode || node.id}] ${node.title}`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="tap-target inline-flex items-center gap-1.5 rounded-md border border-border px-3 text-base hover:bg-secondary"
            >
              <Icon name="ph-github-logo" /> {t.actions.createIssue}
            </a>
          </div>
        </div>
        <h1 className="text-2xl font-medium">{node.title}</h1>
        {node.summary && <p className="text-muted-foreground">{node.summary}</p>}
        {node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {node.tags.map((tag) => (
              <Badge key={tag} className="text-muted-foreground">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <NextAction node={node} />
      <PlanningForm node={node} />
      <PhaseStepper node={node} />
      <Dimensions node={node} />
      <StandardsRefsPanel node={node} />
      <EcaPanel node={node} />
      <WorkflowPanel node={node} />
      <Relations node={node} />
      <Traceability node={node} />
    </div>
  );
}

function NextAction({ node }: { node: TaskNode }) {
  const na = t.nextAction;
  const rules = na.rules as Record<string, string>;
  const key =
    node.status === "done"
      ? "done"
      : node.level === "app"
        ? "app"
        : node.level === "module" && (node.phase === "requirements" || node.phase === "db-schema")
          ? "module"
          : node.phase;
  const guidance = rules[key] ?? rules[node.phase] ?? "";
  const coding = key === "development";
  const tr = node.traceability;
  const dorIncomplete = coding && (!tr?.repoPath?.length || !tr?.testCommand?.length);
  return (
    <Card className="border-primary/40 p-4">
      <h2 className="mb-2 flex items-center gap-2 font-medium">
        <Icon name="ph-compass" className="text-primary" /> {na.title}
      </h2>
      <p className="text-base">{guidance}</p>
      <div className="mt-2">
        <Badge color={coding ? "hsl(142 71% 45%)" : "hsl(38 92% 62%)"}>
          {coding ? na.codingYes : na.codingNo}
        </Badge>
      </div>
      {coding && (
        <div className="mt-2 flex flex-col gap-1 text-base text-muted-foreground">
          <p>
            {na.branchHint}: <span className="font-mono">task/{node.id}-...</span>
          </p>
          {tr?.repoPath?.length ? (
            <p>
              {na.repoHint}: {tr.repoPath.join(", ")}
            </p>
          ) : null}
          {tr?.testCommand?.length ? (
            <p>
              {na.testHint}: {tr.testCommand.join(", ")}
            </p>
          ) : null}
          {dorIncomplete && <p className="text-destructive">{na.dorMissing}</p>}
        </div>
      )}
      <Link
        to="/task/$taskId"
        params={{ taskId: "edu-baslangic-rotasi" }}
        className="mt-2 inline-block text-primary underline"
      >
        {na.guide}
      </Link>
    </Card>
  );
}

function PlanningForm({ node }: { node: TaskNode }) {
  const { register, handleSubmit, formState } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      status: node.status,
      priority: node.priority,
      owner: node.owner ?? "",
      progress: node.progress,
      phase: node.phase,
      effortEstimate: node.effort.estimate,
    },
  });

  const onSubmit = (v: EditValues) =>
    taskStore.updateNode(node.id, {
      status: v.status,
      priority: v.priority,
      owner: v.owner || null,
      progress: v.progress,
      phase: v.phase,
      effort: { ...node.effort, estimate: v.effortEstimate },
    });

  const field = "tap-target w-full rounded-md border border-input bg-card px-3 py-2 text-base";

  return (
    <Card className="p-4">
      <h2 className="mb-3 flex items-center gap-2 font-medium">
        <Icon name="ph-sliders" className="text-primary" /> {t.detail.planning}
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <label className="flex flex-col gap-1 text-base">
          {t.fields.status}
          <select className={field} {...register("status")}>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s as TaskStatus]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-base">
          {t.fields.priority}
          <select className={field} {...register("priority")}>
            {PRIORITY_LIST.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p as Priority]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-base">
          {t.fields.phase}
          <select className={field} {...register("phase")}>
            {WATERFALL_PHASES.map((p) => (
              <option key={p} value={p}>
                {PHASE_META[p as WaterfallPhase].order}. {PHASE_META[p as WaterfallPhase].tr}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-base">
          {t.fields.owner}
          <input className={field} {...register("owner")} placeholder="—" />
        </label>
        <label className="flex flex-col gap-1 text-base">
          {t.fields.progress} (%)
          <input className={field} type="number" min={0} max={100} {...register("progress")} />
        </label>
        <label className="flex flex-col gap-1 text-base">
          {t.fields.effort} (SP)
          <input className={field} type="number" min={0} {...register("effortEstimate")} />
        </label>
        <div className="sm:col-span-2 lg:col-span-3">
          <Button type="submit" variant="primary" size="sm" disabled={!formState.isDirty}>
            <Icon name="ph-check" /> {t.actions.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PhaseStepper({ node }: { node: TaskNode }) {
  const PHASE_COLOR: Record<string, string> = {
    pending: hslVar("--status-backlog"),
    active: hslVar("--status-progress"),
    passed: hslVar("--status-done"),
    failed: hslVar("--status-blocked"),
  };
  return (
    <Card className="p-4">
      <h2 className="mb-3 flex items-center gap-2 font-medium">
        <Icon name="ph-steps" className="text-primary" /> {t.detail.phases}
      </h2>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {WATERFALL_PHASES.map((p) => {
          const gate = node.phases[p];
          const status = gate?.status ?? "pending";
          return (
            <li
              key={p}
              className={cn(
                "flex flex-col gap-1 rounded-md border p-2",
                node.phase === p && "ring-2 ring-ring",
              )}
              style={{ borderColor: PHASE_COLOR[status] }}
            >
              <span className="text-base text-muted-foreground">{PHASE_META[p].order}</span>
              <span className="text-base font-medium leading-tight">{PHASE_META[p].tr}</span>
              <span className="text-xs" style={{ color: PHASE_COLOR[status] }}>
                {status}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function Dimensions({ node }: { node: TaskNode }) {
  const familyLabel = t.families as Record<string, string>;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 font-medium">
        <Icon name="ph-stack-plus" className="text-primary" /> {t.detail.dimensions}
      </h2>
      <div className="columns-1 gap-2 md:columns-2">
        {DIMENSION_FAMILIES.map((family) => {
          const keys = DIMENSION_KEYS.filter((k) => DIMENSION_FAMILY[k] === family);
          return (
            <Fragment key={family}>
              <h3 className="mt-1 mb-2 text-base font-medium text-muted-foreground [column-span:all]">
                {familyLabel[family] ?? family}
              </h3>
              {keys.map((key) => {
                const dim = node.dimensions[key];
                const meta = DIMENSION_META[key];
                const na = node.applicability?.[key]?.applies === false;
                const isSkeleton = !dim || dim.status === "skeleton" || dim.items.length === 0;
                return (
                  <Card key={key} className={cn("mb-2 break-inside-avoid p-3", na && "opacity-70")}>
                    <div className="flex items-center gap-2">
                      <Icon name={meta.icon} className="text-primary" />
                      <span className="font-medium">{meta.tr}</span>
                      {na ? (
                        <Badge className="ml-auto" color={hslVar("--muted-foreground")}>
                          {t.detail.notApplicable}
                        </Badge>
                      ) : !isSkeleton ? (
                        <Badge className="ml-auto text-primary" color={hslVar("--status-done")}>
                          {dim.items.length} {t.detail.itemsUnit}
                        </Badge>
                      ) : null}
                    </div>
                    {na ? (
                      <p className="mt-2 text-base text-muted-foreground">
                        {node.applicability[key]?.reason}
                      </p>
                    ) : isSkeleton ? (
                      <p className="mt-2 text-base text-muted-foreground">
                        <Icon name="ph-dots-three-outline" /> {t.detail.skeletonNotice}
                      </p>
                    ) : (
                      <ul className="mt-2 list-disc pl-5 text-base">
                        {dim.items.map((item, i) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: statik gosterim listesi
                          <li key={`${key}-${i}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {!na && dim?.notes && (
                      <p className="mt-1 text-base text-muted-foreground">{dim.notes}</p>
                    )}
                    {!na && dim?.prompt && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-base text-muted-foreground">
                          <Icon name="ph-sparkle" className="text-primary" /> {t.detail.aiPrompt}
                        </summary>
                        <div className="mt-1 flex items-start gap-2">
                          <pre className="flex-1 overflow-x-auto whitespace-pre-wrap rounded-md bg-secondary p-2 text-base">
                            {dim.prompt}
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={t.actions.copyPrompt}
                            onClick={() => navigator.clipboard?.writeText(dim.prompt)}
                          >
                            <Icon name="ph-copy" />
                          </Button>
                        </div>
                      </details>
                    )}
                  </Card>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}

function StandardsRefsPanel({ node }: { node: TaskNode }) {
  const refs = nodeStandards(node);
  const waivers = node.waivers ?? [];
  if (refs.length === 0 && waivers.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 font-medium">
        <Icon name="ph-shield-check" className="text-primary" /> {t.detail.standards}
      </h2>
      {refs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {refs.map((r) => (
            <Badge key={r.key} className="text-primary" color={hslVar("--primary")}>
              {r.name}
            </Badge>
          ))}
        </div>
      )}
      {waivers.length > 0 && (
        <Card className="p-3">
          <h3 className="mb-1 text-base font-medium text-muted-foreground">{t.detail.waivers}</h3>
          <ul className="flex flex-col gap-1 text-base">
            {waivers.map((w) => (
              <li key={w.id} className="flex items-start gap-2">
                <Icon name="ph-seal-warning" className="text-primary" />
                <span>
                  {w.scope}: {w.reason}
                  {w.expires ? ` (${w.expires})` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

function Traceability({ node }: { node: TaskNode }) {
  const tr = node.traceability;
  if (!tr) return null;
  const d = t.detail;
  const statusLabels = d.implStatusLabels as Record<string, string>;
  const statusLabel = statusLabels[tr.implementationStatus] ?? tr.implementationStatus;
  const lists: { label: string; values: string[] }[] = [
    { label: d.repoPath, values: tr.repoPath },
    { label: d.testCommand, values: tr.testCommand },
    { label: d.evidence, values: node.evidence },
  ].filter((r) => r.values.length > 0);
  const facts: { label: string; value: string | null }[] = [
    { label: d.deployTarget, value: tr.deployTarget },
    { label: d.tenantStrategy, value: tr.tenantStrategy },
    { label: d.auditLogRef, value: tr.auditLogRef },
  ].filter((f) => f.value);
  return (
    <Card className="p-4">
      <h2 className="mb-2 flex items-center gap-2 font-medium">
        <Icon name="ph-link" className="text-primary" /> {d.implementation}
      </h2>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-base text-muted-foreground">{d.implStatus}:</span>
        <Badge>{statusLabel}</Badge>
      </div>
      {facts.map((f) => (
        <p key={f.label} className="text-base">
          <span className="text-muted-foreground">{f.label}: </span>
          {f.value}
        </p>
      ))}
      {lists.map((r) => (
        <div key={r.label} className="mt-2">
          <p className="text-base text-muted-foreground">{r.label}</p>
          <ul className="list-disc pl-5 text-base">
            {r.values.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      ))}
    </Card>
  );
}

function Relations({ node }: { node: TaskNode }) {
  const index = useTaskStore((s) => s.index);
  const groups: { label: string; ids: string[] }[] = [
    { label: t.detail.dependsOn, ids: node.dependsOn },
    { label: t.detail.related, ids: node.related },
  ];
  const any = groups.some((g) => g.ids.length);
  if (!any) return null;
  return (
    <Card className="p-4">
      <h2 className="mb-2 flex items-center gap-2 font-medium">
        <Icon name="ph-share-network" className="text-primary" /> {t.detail.dependencies}
      </h2>
      {groups
        .filter((g) => g.ids.length)
        .map((g) => (
          <div key={g.label} className="mb-2">
            <p className="text-base text-muted-foreground">{g.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.ids.map((id) => {
                const target = index.get(id);
                return (
                  <Link key={id} to="/task/$taskId" params={{ taskId: id }}>
                    <Badge className="hover:bg-secondary">{target?.title ?? id}</Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
    </Card>
  );
}
