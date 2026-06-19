import type { TaskNode } from "@/schemas";

/**
 * Gantt motoru — SAF (UI-bağımsız) plan/baseline kıyas yardımcıları.
 *
 * Tek doğruluk kaynağı TaskNode.schedule'dır; bu modül yalnız okur, türetir
 * ve hiçbir yan etki üretmez (tip-temiz, any yok). UI katmanı (ReactFlow /
 * timeline) bu çıktıları doğrudan çizebilir.
 */

/** Timeline üzerinde tek bir çubuk (bar) — çizim için hazır düz veri. */
export interface GanttBar {
  id: string;
  title: string;
  start: string;
  end: string;
  criticalPath: boolean;
  milestone: string | null;
}

/**
 * Düğümleri Gantt çubuklarına çevirir.
 * - Yalnız `schedule.start` VE `schedule.end` dolu (null olmayan) düğümler dahildir.
 * - `opts.milestone` verilirse yalnız o milestone'a ait düğümler kalır.
 * - start/end olduğu gibi taşınır (normalize edilmez).
 */
export function toGanttBars(nodes: TaskNode[], opts?: { milestone?: string }): GanttBar[] {
  const wantMilestone = opts?.milestone;
  const bars: GanttBar[] = [];
  for (const n of nodes) {
    const { start, end } = n.schedule;
    if (start === null || end === null) continue;
    if (wantMilestone !== undefined && n.milestone !== wantMilestone) continue;
    bars.push({
      id: n.id,
      title: n.title,
      start,
      end,
      criticalPath: n.criticalPath,
      milestone: n.milestone,
    });
  }
  return bars;
}

/** ISO "YYYY-MM-DD" tarihini gün-bazlı UTC zaman damgasına çevirir; geçersizde null. */
function parseIsoDay(iso: string): number | null {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

const MS_PER_DAY = 86_400_000;

/**
 * İki ISO tarih arasındaki gün farkı (b - a), tam sayı olarak.
 * Geçersiz girdide (parse edilemeyen tarih) 0 döner.
 */
export function dayspan(a: string, b: string): number {
  const ta = parseIsoDay(a);
  const tb = parseIsoDay(b);
  if (ta === null || tb === null) return 0;
  return Math.round((tb - ta) / MS_PER_DAY);
}

/** Planlanan vs baseline kıyası — pozitif slip = baseline'a göre gecikme. */
export interface BaselineDiff {
  plannedDays: number;
  baselineDays: number;
  slipDays: number;
}

/**
 * Baseline (dondurulmuş plan) ile güncel planı kıyaslar.
 * `schedule.start,end` VE `baselineStart,baselineEnd` hepsi doluysa hesaplar;
 * biri bile eksikse (null) null döner.
 * - plannedDays = dayspan(start, end)
 * - baselineDays = dayspan(baselineStart, baselineEnd)
 * - slipDays = dayspan(baselineEnd, end)  (pozitif = bitiş gecikti)
 */
export function diffBaseline(node: TaskNode): BaselineDiff | null {
  const { start, end, baselineStart, baselineEnd } = node.schedule;
  if (start === null || end === null || baselineStart === null || baselineEnd === null) {
    return null;
  }
  return {
    plannedDays: dayspan(start, end),
    baselineDays: dayspan(baselineStart, baselineEnd),
    slipDays: dayspan(baselineEnd, end),
  };
}
