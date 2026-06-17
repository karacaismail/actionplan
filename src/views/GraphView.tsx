import { Button, Card, Icon, StatusBadge } from "@/components/ui/primitives";
import { downloadFile, getDescendants } from "@/engine";
import { STATUS_LABEL, hslVar, levelVar } from "@/lib/format";
import { t } from "@/lib/strings";
import { LEVEL_META, type TaskNode } from "@/schemas";
import { useTaskStore } from "@/store/taskStore";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";
import { useMemo, useState } from "react";

/* ----------------------------------------------------------------------------
 * Sabitler — düğüm ölçüsü ve ELK yerleşim ayarları
 * -------------------------------------------------------------------------- */
const NODE_W = 240;
const NODE_H = 92;
const elk = new ELK();

/** Düğüm verisinin React Flow `data` alanı için tip. */
type GraphNodeData = {
  task: TaskNode;
  color: string;
};
type GraphNode = Node<GraphNodeData, "task">;

/* ----------------------------------------------------------------------------
 * Özel düğüm — seviye renkli kenarlık, WBS kodu + başlık + durum rozeti
 * -------------------------------------------------------------------------- */
function TaskFlowNode({ data }: NodeProps<GraphNode>) {
  const { task, color } = data;
  const levelTr = LEVEL_META[task.level].tr;
  return (
    <Link
      to="/task/$taskId"
      params={{ taskId: task.id }}
      className="block rounded-lg border-2 bg-card p-3 text-card-foreground no-underline shadow-sm transition-colors hover:bg-secondary"
      style={{
        width: NODE_W,
        minHeight: NODE_H,
        borderColor: color,
        boxShadow: task.criticalPath ? "0 0 0 2px hsl(38 92% 62%)" : undefined,
      }}
      aria-label={`${task.wbsCode} ${task.title}`}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, border: "none" }} />
      <div className="flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
        <span className="font-mono text-base text-muted-foreground">{task.wbsCode || "—"}</span>
        <span className="ml-auto text-base text-muted-foreground">{levelTr}</span>
      </div>
      <div className="mt-1 line-clamp-2 text-base font-medium leading-tight">{task.title}</div>
      <div className="mt-2">
        <StatusBadge status={task.status} />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: color, border: "none" }}
      />
    </Link>
  );
}

const nodeTypes: NodeTypes = { task: TaskFlowNode };

/* ----------------------------------------------------------------------------
 * ELK yerleşimi — düğüm/kenarları layered (DOWN) düzene oturtur
 * -------------------------------------------------------------------------- */
type LaidOut = { nodes: GraphNode[]; edges: Edge[]; width: number; height: number };

async function layoutGraph(subtree: TaskNode[], appId: string): Promise<LaidOut> {
  const inSubtree = new Set(subtree.map((n) => n.id));

  // Kenarlar: hiyerarşi (parent→child, düz) + bağımlılık (dependsOn, kesikli+animated)
  const edges: Edge[] = [];
  for (const n of subtree) {
    if (n.parentId && inSubtree.has(n.parentId) && n.id !== appId) {
      edges.push({
        id: `h-${n.parentId}-${n.id}`,
        source: n.parentId,
        target: n.id,
        type: "smoothstep",
        style: { stroke: hslVar("--border"), strokeWidth: 1.5 },
      });
    }
    for (const dep of n.dependsOn) {
      if (!inSubtree.has(dep)) continue;
      edges.push({
        id: `d-${dep}-${n.id}`,
        source: dep,
        target: n.id,
        type: "smoothstep",
        animated: true,
        style: { stroke: hslVar("--status-blocked"), strokeWidth: 1.5, strokeDasharray: "6 4" },
      });
    }
  }

  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.layered.spacing.nodeNodeBetweenLayers": "72",
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.edgeNodeBetweenLayers": "32",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
    },
    children: subtree.map((n) => ({ id: n.id, width: NODE_W, height: NODE_H })),
    edges: edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  };

  const res = await elk.layout(elkGraph);

  const byId = new Map(subtree.map((n) => [n.id, n]));
  const nodes: GraphNode[] = (res.children ?? []).map((c) => {
    const task = byId.get(c.id)!;
    return {
      id: c.id,
      type: "task",
      position: { x: c.x ?? 0, y: c.y ?? 0 },
      data: { task, color: hslVar(levelVar(task.level)) },
    };
  });

  return { nodes, edges, width: res.width ?? 0, height: res.height ?? 0 };
}

/* ----------------------------------------------------------------------------
 * SVG / PNG dışa aktarım — ELK pozisyonlarından elle SVG kurar
 * -------------------------------------------------------------------------- */
const SVG_PAD = 32;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Verilen yerleşimden bağımsız (CSS değişkensiz) bir SVG dizgisi üretir. */
function buildSvg(laid: LaidOut, title: string): string {
  const w = laid.width + SVG_PAD * 2;
  const h = laid.height + SVG_PAD * 2 + 28;
  const pos = new Map(laid.nodes.map((n) => [n.id, n]));

  // Sabit renkler (export bağımsız olmalı — canlı CSS değişkenleri kullanılmaz)
  const stroke = "#3a4252";
  const depStroke = "#ef5350";
  const bg = "#0f1420";
  const cardBg = "#171c28";
  const text = "#fafafa";
  const muted = "#aab3c5";
  const levelHex: Record<string, string> = {
    app: "#3bc0f0",
    module: "#33d9b2",
    archetype: "#b08cf0",
    stone: "#f0b03b",
    molecule: "#ef7fc0",
    element: "#5fd97f",
    atom: "#bfbfbf",
  };

  const lines: string[] = [];
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Roboto, system-ui, sans-serif">`,
  );
  lines.push(`<rect width="${w}" height="${h}" fill="${bg}"/>`);
  lines.push(
    `<text x="${SVG_PAD}" y="22" fill="${text}" font-size="15" font-weight="600">${escapeXml(title)}</text>`,
  );
  const gx = SVG_PAD;
  const gy = SVG_PAD + 28;

  // Kenarlar (düğümlerin altına çizilir)
  for (const e of laid.edges) {
    const s = pos.get(e.source);
    const tgt = pos.get(e.target);
    if (!s || !tgt) continue;
    const x1 = gx + s.position.x + NODE_W / 2;
    const y1 = gy + s.position.y + NODE_H;
    const x2 = gx + tgt.position.x + NODE_W / 2;
    const y2 = gy + tgt.position.y;
    const midY = (y1 + y2) / 2;
    const isDep = e.id.startsWith("d-");
    const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    lines.push(
      `<path d="${d}" fill="none" stroke="${isDep ? depStroke : stroke}" stroke-width="1.5"${
        isDep ? ' stroke-dasharray="6 4"' : ""
      }/>`,
    );
  }

  // Düğümler
  for (const n of laid.nodes) {
    const x = gx + n.position.x;
    const y = gy + n.position.y;
    const c = levelHex[n.data.task.level] ?? muted;
    const task = n.data.task;
    const tTitle = task.title.length > 52 ? `${task.title.slice(0, 49)}…` : task.title;
    lines.push(
      `<rect x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="10" fill="${cardBg}" stroke="${c}" stroke-width="2"/>`,
    );
    lines.push(`<circle cx="${x + 16}" cy="${y + 18}" r="4" fill="${c}"/>`);
    lines.push(
      `<text x="${x + 28}" y="${y + 22}" fill="${muted}" font-size="12" font-family="monospace">${escapeXml(task.wbsCode || "—")}</text>`,
    );
    lines.push(
      `<text x="${x + NODE_W - 12}" y="${y + 22}" fill="${muted}" font-size="12" text-anchor="end">${escapeXml(LEVEL_META[task.level].tr)}</text>`,
    );
    lines.push(
      `<text x="${x + 14}" y="${y + 46}" fill="${text}" font-size="13" font-weight="500">${escapeXml(tTitle)}</text>`,
    );
    lines.push(
      `<text x="${x + 14}" y="${y + 72}" fill="${muted}" font-size="12">${escapeXml(STATUS_LABEL[task.status])}</text>`,
    );
  }

  lines.push("</svg>");
  return lines.join("");
}

function exportSvg(laid: LaidOut, title: string, fileBase: string) {
  const svg = buildSvg(laid, title);
  downloadFile(`${fileBase}.svg`, svg, "image/svg+xml");
}

function exportPng(laid: LaidOut, title: string, fileBase: string) {
  const svg = buildSvg(laid, title);
  const w = laid.width + SVG_PAD * 2;
  const h = laid.height + SVG_PAD * 2 + 28;
  const scale = 2;
  const img = new Image();
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const burl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = burl;
      a.download = `${fileBase}.png`;
      a.click();
      URL.revokeObjectURL(burl);
    }, "image/png");
  };
  img.src = url;
}

/* ----------------------------------------------------------------------------
 * GraphView — uygulama seç, alt-ağacı ELK ile yerleştir, React Flow ile çiz
 * -------------------------------------------------------------------------- */
export function GraphView() {
  const nodes = useTaskStore((s) => s.nodes);

  const apps = useMemo(
    () =>
      nodes
        .filter((n) => n.level === "app")
        .sort((a, b) => a.wbsCode.localeCompare(b.wbsCode, "tr", { numeric: true })),
    [nodes],
  );

  const [selectedId, setSelectedId] = useState("");
  // Liste hazır olunca ilkini varsayılan say; seçili id geçersizse ilkine düş.
  const appId = apps.some((a) => a.id === selectedId) ? selectedId : (apps[0]?.id ?? "");

  const appNode = useMemo(() => apps.find((a) => a.id === appId), [apps, appId]);

  // Seçili uygulama + tüm alt soyları (TÜM set değil; yalnız bu alt-ağaç)
  const subtree = useMemo(() => {
    if (!appNode) return [] as TaskNode[];
    return [appNode, ...getDescendants(nodes, appNode.id)];
  }, [nodes, appNode]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["elk", appId, subtree.length],
    queryFn: () => layoutGraph(subtree, appId),
    enabled: subtree.length > 0,
  });

  const title = appNode ? `${appNode.wbsCode} · ${appNode.title}` : "";
  const fileBase = appNode ? `grafik-${appNode.id}` : "grafik";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-medium">{t.nav.graph}</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-base">
            <Icon name="ph-mountains" className="text-primary" aria-hidden="true" />
            <span className="sr-only">Uygulama seç</span>
            <select
              value={appId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="tap-target rounded-md border border-input bg-card px-3 py-2 text-base"
              aria-label="Uygulama seç"
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.wbsCode} · {a.title}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            onClick={() => data && exportSvg(data, title, fileBase)}
            disabled={!data || isFetching}
          >
            <Icon name="ph-file-svg" aria-hidden="true" /> SVG indir
          </Button>
          <Button
            size="sm"
            onClick={() => data && exportPng(data, title, fileBase)}
            disabled={!data || isFetching}
          >
            <Icon name="ph-image" aria-hidden="true" /> PNG indir
          </Button>
        </div>
      </div>

      {/* Açıklama: kenar tipleri */}
      <div className="flex flex-wrap items-center gap-4 text-base text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-6" style={{ background: hslVar("--border") }} /> Hiyerarşi
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="h-0.5 w-6"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, ${hslVar("--status-blocked")} 0 6px, transparent 6px 10px)`,
            }}
          />
          Bağımlılık (dependsOn)
        </span>
        <span className="ml-auto">{subtree.length} düğüm</span>
      </div>

      <Card className="relative h-[70dvh] min-h-[480px] overflow-hidden p-0">
        {isFetching && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-card/70 text-muted-foreground">
            <span className="inline-flex items-center gap-2 text-base">
              <Icon name="ph-spinner" className="animate-spin text-primary" aria-hidden="true" />
              Yerleşim hesaplanıyor…
            </span>
          </div>
        )}
        {isError && (
          <div className="absolute inset-0 z-10 grid place-items-center text-destructive">
            <span className="inline-flex items-center gap-2 text-base">
              <Icon name="ph-warning-circle" aria-hidden="true" /> Yerleşim hesaplanamadı.
            </span>
          </div>
        )}
        {data && data.nodes.length > 0 ? (
          <ReactFlow<GraphNode>
            nodes={data.nodes}
            edges={data.edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
          >
            <Background gap={20} color={hslVar("--border")} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => (n.data as GraphNodeData).color}
              maskColor="hsl(var(--background) / 0.6)"
              style={{ background: hslVar("--secondary") }}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        ) : (
          !isFetching &&
          !isError && (
            <div className="grid h-full place-items-center text-muted-foreground">
              <span className="text-base">Bu uygulamada gösterilecek alt düğüm yok.</span>
            </div>
          )
        )}
      </Card>
    </div>
  );
}
