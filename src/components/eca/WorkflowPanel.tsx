import { Badge, Card, CardContent, CardHeader, CardTitle, Icon } from "@/components/ui/primitives";
import { t } from "@/lib/strings";
import { isTerminal, workflowsForNode } from "@/lib/workflow-view";
import type { TaskNode } from "@/schemas";

/**
 * WorkflowPanel (Küme E faz-2) — düğüme bağlı iş akışlarının (Küme D workflow-catalog) durum makinesini
 * GÖRSELLEŞTİRİR (durumlar + geçişler + onay + bağlı ECA paketleri). Salt-okunur; akışı değiştirmez.
 * Tüm metin strings.json (t.workflow).
 */

const w = t.workflow;

export function WorkflowPanel({ node }: { node: TaskNode }) {
  const workflows = workflowsForNode(node.id);
  if (workflows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="ph-flow-arrow" />
          {w.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {workflows.map((wf) => (
          <div key={wf.id} className="flex flex-col gap-2">
            <p className="font-medium">{wf.name}</p>

            <div className="flex flex-wrap items-center gap-1">
              <span className="text-sm text-muted-foreground">{w.states}:</span>
              {wf.states.map((s) => (
                <Badge key={s} className={s === wf.initial ? "text-foreground" : "text-muted-foreground"}>
                  {s === wf.initial && <Icon name="ph-play-circle" className="text-xs" />}
                  {isTerminal(wf, s) && <Icon name="ph-flag-checkered" className="text-xs" />}
                  {s}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{w.transitions}:</span>
              {wf.transitions.map((tr, i) => (
                <div key={`${tr.from}-${tr.to}-${i}`} className="flex flex-wrap items-center gap-1 text-base">
                  <span>{tr.from}</span>
                  <Icon name="ph-arrow-right" className="text-xs" />
                  <span className="font-medium">{tr.to}</span>
                  <Badge className="text-muted-foreground">
                    <Icon name="ph-lightning" className="text-xs" />
                    {w.on}: {tr.on}
                  </Badge>
                  {tr.requiresApproval && (
                    <Badge className="text-foreground" color="hsl(var(--warning, 38 92% 50%))">
                      <Icon name="ph-shield-check" className="text-xs" />
                      {w.approval}
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {wf.rulesetRefs.length > 0 && (
              <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                <Icon name="ph-package" className="text-xs" />
                {w.rulesets}: {wf.rulesetRefs.join(", ")}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
