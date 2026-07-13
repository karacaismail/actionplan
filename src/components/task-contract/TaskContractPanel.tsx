import { Badge, Card, Icon } from "@/components/ui/primitives";
import { t } from "@/lib/strings";
import { PHASE_META, type TaskNode, WATERFALL_PHASES } from "@/schemas";

const DOC_REF_PATTERN = /\bdocs\/[A-Za-z0-9._/-]+\.md/;
const DOC_APPLY_MARKER = /\[\/?DOC-APPLY:[^\]]+\]\s*/g;
const DOC_APPLY_REF_PREFIX = /^doc-apply:[^:]+:\s*/;

export function visibleTaskContent(value: string): string {
  return value.replace(DOC_APPLY_MARKER, "");
}

function visibleReferenceContext(value: string): string {
  return value.replace(DOC_APPLY_REF_PREFIX, "");
}

export function docsLink(
  ref: string,
  basePath = import.meta.env.BASE_URL || "/",
): { after: string; before: string; href: string; path: string } | null {
  const match = DOC_REF_PATTERN.exec(ref);
  if (!match) return null;
  const path = match[0];
  const before = ref.slice(0, match.index);
  const after = ref.slice(match.index + path.length);
  const fragment = after.match(/^(#[^\s,)]+)/)?.[1] ?? "";
  const slug = path.slice("docs/".length, -".md".length).replaceAll("/", "--");
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return { after, before, href: `${base}docs/${slug}${fragment}`, path };
}

function TextList({ items }: { items: string[] }) {
  if (items.length === 0)
    return <p className="text-base text-muted-foreground">{t.detail.noContent}</p>;
  return (
    <ul className="min-w-0 list-disc space-y-1 break-words pl-5 text-base">
      {items.map((item, index) => (
        <li key={`${index}:${item}`}>{visibleTaskContent(item)}</li>
      ))}
    </ul>
  );
}

function ContractSection({
  icon,
  items,
  title,
}: {
  icon: string;
  items: string[];
  title: string;
}) {
  return (
    <section className="rounded-md border border-border p-3">
      <h3 className="mb-2 flex items-center gap-2 font-medium">
        <Icon name={icon} className="text-primary" /> {title}
      </h3>
      <TextList items={items} />
    </section>
  );
}

function PhaseContracts({ node }: { node: TaskNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 font-medium">
        <Icon name="ph-steps" className="text-primary" /> {t.detail.phases}
      </h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {WATERFALL_PHASES.map((phase) => {
          const gate = node.phases[phase];
          const criteria = gate?.criteria ?? [];
          return (
            <div key={phase} className="rounded-md border border-border p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h4 className="font-medium">
                  {PHASE_META[phase].order}. {PHASE_META[phase].tr}
                </h4>
                <Badge className="ml-auto text-muted-foreground">{gate?.status ?? "pending"}</Badge>
              </div>
              <p className="mb-1 text-base font-medium text-muted-foreground">
                {t.detail.phaseCriteria}
              </p>
              <TextList items={criteria} />
              <p className="mt-2 text-base">
                <span className="font-medium text-muted-foreground">{t.detail.phaseNotes}: </span>
                <span>{visibleTaskContent(gate?.notes || t.detail.noContent)}</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RisksAndRollback({ node }: { node: TaskNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <section className="rounded-md border border-border p-3">
        <h3 className="mb-2 flex items-center gap-2 font-medium">
          <Icon name="ph-warning" className="text-primary" /> {t.detail.risks}
        </h3>
        {node.risks.length === 0 ? (
          <p className="text-base text-muted-foreground">{t.detail.noContent}</p>
        ) : (
          <ul className="space-y-3 text-base">
            {node.risks.map((risk, index) => (
              <li key={`${index}:${risk.id}`} className="min-w-0 rounded-md bg-secondary p-2">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{risk.id}</span>
                  <Badge className="text-muted-foreground">{risk.severity}</Badge>
                </div>
                <p className="break-words">{visibleTaskContent(risk.desc)}</p>
                <p className="mt-1">
                  <span className="font-medium text-muted-foreground">{t.detail.mitigation}: </span>
                  <span className="break-words">
                    {visibleTaskContent(risk.mitigation || t.detail.noContent)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-border p-3">
        <h3 className="mb-2 flex items-center gap-2 font-medium">
          <Icon name="ph-arrow-counter-clockwise" className="text-primary" /> {t.detail.rollback}
        </h3>
        <p className="break-words text-base">
          {visibleTaskContent(node.rollback || t.detail.noContent)}
        </p>
      </section>
    </div>
  );
}

function References({ refs }: { refs: string[] }) {
  if (refs.length === 0)
    return <p className="text-base text-muted-foreground">{t.detail.noContent}</p>;
  return (
    <ul className="min-w-0 list-disc space-y-1 break-words pl-5 text-base">
      {refs.map((ref, index) => {
        const docsRef = docsLink(ref);
        return (
          <li key={`${index}:${ref}`} className="min-w-0 break-all">
            {docsRef ? (
              <>
                {visibleReferenceContext(docsRef.before)}
                <a
                  className="tap-target inline-flex items-center break-all text-primary underline"
                  href={docsRef.href}
                >
                  {docsRef.path}
                </a>
                {docsRef.after}
              </>
            ) : (
              <span>{visibleTaskContent(ref)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function TaskContractPanel({ node }: { node: TaskNode }) {
  return (
    <Card data-testid="task-contract-panel" className="flex flex-col gap-4 p-4">
      <h2 className="flex items-center gap-2 font-medium">
        <Icon name="ph-clipboard-text" className="text-primary" /> {t.detail.taskContract}
      </h2>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <ContractSection
          icon="ph-package"
          items={node.deliverables}
          title={t.detail.deliverables}
        />
        <ContractSection
          icon="ph-check-circle"
          items={node.acceptanceCriteria}
          title={t.detail.acceptance}
        />
      </div>

      <PhaseContracts node={node} />
      <RisksAndRollback node={node} />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <ContractSection icon="ph-seal-check" items={node.evidence} title={t.detail.evidence} />
        <section className="rounded-md border border-border p-3">
          <h3 className="mb-2 flex items-center gap-2 font-medium">
            <Icon name="ph-link" className="text-primary" /> {t.detail.referencesTitle}
          </h3>
          <References refs={node.refs} />
        </section>
      </div>
    </Card>
  );
}
