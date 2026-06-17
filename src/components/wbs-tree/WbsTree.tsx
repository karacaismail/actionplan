import { Icon, ProgressBar, StatusBadge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { levelLabel, levelVar, hslVar } from "@/lib/format";
import type { TreeNode } from "@/engine";
import { Link } from "@tanstack/react-router";

interface Props {
  nodes: TreeNode[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  activeId?: string;
}

export function WbsTree({ nodes, expanded, onToggle, activeId }: Props) {
  return (
    <ul role="tree" aria-label="WBS ağacı" className="flex flex-col">
      {nodes.map((n) => (
        <WbsRow key={n.id} node={n} expanded={expanded} onToggle={onToggle} activeId={activeId} />
      ))}
    </ul>
  );
}

function WbsRow({ node, expanded, onToggle, activeId }: { node: TreeNode } & Omit<Props, "nodes">) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const color = hslVar(levelVar(node.level));

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isOpen : undefined}>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-secondary",
          activeId === node.id && "bg-secondary",
        )}
        style={{ paddingLeft: `${node.depth * 0.85 + 0.25}rem` }}
      >
        <button
          type="button"
          aria-label={hasChildren ? (isOpen ? "Kapat" : "Aç") : undefined}
          className={cn("grid size-6 place-items-center rounded", !hasChildren && "invisible")}
          onClick={() => onToggle(node.id)}
          tabIndex={hasChildren ? 0 : -1}
        >
          <Icon name={isOpen ? "ph-caret-down" : "ph-caret-right"} />
        </button>
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: color }}
          title={levelLabel(node.level)}
        />
        <Link
          to="/task/$taskId"
          params={{ taskId: node.id }}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <span className="shrink-0 font-mono text-base text-muted-foreground">{node.wbsCode}</span>
          <span className="truncate text-base">{node.title}</span>
        </Link>
        {node.criticalPath && (
          <Icon
            name="ph-lightning"
            className="shrink-0"
            style={{ color: "hsl(38 92% 62%)" }}
            title="Kritik yol"
          />
        )}
        <div className="hidden w-28 shrink-0 items-center gap-2 sm:flex">
          <ProgressBar value={node.rollup.progress} color={color} />
          <span className="w-9 text-right text-base text-muted-foreground tabular-nums">
            {node.rollup.progress}%
          </span>
        </div>
        <div className="hidden md:block">
          <StatusBadge status={node.rollup.status} />
        </div>
      </div>
      {hasChildren && isOpen && (
        <WbsTree
          nodes={node.children}
          expanded={expanded}
          onToggle={onToggle}
          activeId={activeId}
        />
      )}
    </li>
  );
}
