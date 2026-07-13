import { Badge, Card, Icon } from "@/components/ui/primitives";
import {
  type EffectiveDirectiveApplication,
  effectiveDirectiveApplications,
} from "@/engine/effectiveDirectives";
import type { NodeIndex } from "@/engine/resolve";
import type { TaskNode } from "@/schemas";
import { docsLink, visibleTaskContent } from "./TaskContractPanel";

const PROTECTED_LEVELS = new Set(["app", "module"]);

function SourceLink({ source }: { source: string }) {
  const link = docsLink(source);
  if (!link) return <span>{source}</span>;
  return (
    <a className="break-all text-primary underline" href={link.href}>
      {source}
    </a>
  );
}

function ApplicationCard({ application }: { application: EffectiveDirectiveApplication }) {
  return (
    <details className="rounded-md border border-border p-3">
      <summary className="cursor-pointer font-medium">
        <span className="mr-2">{application.ruleId}</span>
        <Badge className="text-muted-foreground">{application.mode}</Badge>
      </summary>
      <div className="mt-2 flex flex-col gap-2 text-base">
        <p>
          <span className="font-medium text-muted-foreground">Kaynak: </span>
          <SourceLink source={application.source} />
        </p>
        <p>{visibleTaskContent(application.item)}</p>
        <p>
          <span className="font-medium text-muted-foreground">Yürütme sahibi: </span>
          <a className="text-primary underline" href={`./${application.ownerNodeId}`}>
            {application.ownerNodeId}
          </a>
        </p>
        <div>
          <p className="mb-1 font-medium text-muted-foreground">Görev promptu</p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-secondary p-2 text-base">
            {visibleTaskContent(application.prompt)}
          </pre>
        </div>
      </div>
    </details>
  );
}

export function EffectiveDirectivePanel({ node, index }: { node: TaskNode; index: NodeIndex }) {
  if (!PROTECTED_LEVELS.has(node.level)) return null;
  const applications = effectiveDirectiveApplications(node, index);
  if (applications.length === 0) return null;

  return (
    <Card data-testid="effective-directive-panel" className="flex flex-col gap-3 p-4">
      <div>
        <h2 className="flex items-center gap-2 font-medium">
          <Icon name="ph-tree-structure" className="text-primary" /> Etkin JSON Yönergeleri
        </h2>
        <p className="mt-1 text-base text-muted-foreground">
          Bu korunan {node.level} sayfası, alt yürütme görevlerinin JSON içeriğini salt-okunur
          olarak toplar. Uygulama ayrıntısı ve prompt kaynak task JSON'unda yaşar.
        </p>
      </div>
      <Badge className="self-start text-primary">{applications.length} kaynak uygulaması</Badge>
      <div className="grid grid-cols-1 gap-2">
        {applications.map((application) => (
          <ApplicationCard
            key={`${application.ruleId}:${application.source}:${application.ownerNodeId}`}
            application={application}
          />
        ))}
      </div>
    </Card>
  );
}
