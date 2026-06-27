import { STATUS_LIST, type TaskNode, WATERFALL_PHASES } from "@/schemas";

/**
 * Reports — SAF (UI-bağımsız) raporlama agregatları. Tüm fonksiyonlar
 * yan-etkisiz; girdi düğüm dizisini değiştirmez. Faz 5 (Raporlar) çekirdeği.
 */

/* ----------------------------------------------------------------------------
 * Milestone ilerlemesi
 * -------------------------------------------------------------------------- */
export interface MilestoneProgress {
  milestone: string;
  total: number;
  done: number;
  /** Gruptaki node.progress ortalaması (0-100, yuvarlanmış). */
  progress: number;
}

/** Milestone'a göre grupla (null → "—"); milestone adına göre sıralı döner. */
export function milestoneProgress(nodes: TaskNode[]): MilestoneProgress[] {
  const groups = new Map<string, TaskNode[]>();
  for (const n of nodes) {
    const key = n.milestone ?? "—";
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = [];
      groups.set(key, bucket);
    }
    bucket.push(n);
  }

  const out: MilestoneProgress[] = [];
  for (const [milestone, items] of groups) {
    const total = items.length;
    const done = items.filter((n) => n.status === "done").length;
    const sum = items.reduce((acc, n) => acc + n.progress, 0);
    const progress = total === 0 ? 0 : Math.round(sum / total);
    out.push({ milestone, total, done, progress });
  }
  out.sort((a, b) => a.milestone.localeCompare(b.milestone));
  return out;
}

/* ----------------------------------------------------------------------------
 * Faz kapısı (gate) ilerlemesi
 * -------------------------------------------------------------------------- */
export interface PhaseGate {
  phase: string;
  passed: number;
  total: number;
}

/**
 * Her WATERFALL_PHASES için: total = ilgili fazı tanımlı düğüm sayısı,
 * passed = o fazı geçmiş (passed===true) düğüm sayısı.
 */
export function phaseGateProgress(nodes: TaskNode[]): PhaseGate[] {
  return WATERFALL_PHASES.map((phase) => {
    let total = 0;
    let passed = 0;
    for (const n of nodes) {
      const gate = n.phases[phase];
      if (gate === undefined) continue;
      total += 1;
      if (gate.passed === true) passed += 1;
    }
    return { phase, passed, total };
  });
}

/* ----------------------------------------------------------------------------
 * Efor burn-up (adam-gün)
 * -------------------------------------------------------------------------- */
export interface Burnup {
  plannedDays: number;
  spentDays: number;
}

/** Yalnız unit==="d" düğümlerde estimate (planlanan) ve spent (harcanan) toplamı. */
export function effortBurnup(nodes: TaskNode[]): Burnup {
  let plannedDays = 0;
  let spentDays = 0;
  for (const n of nodes) {
    if (n.effort.unit === "d") {
      plannedDays += n.effort.estimate;
      spentDays += n.effort.spent;
    }
  }
  return { plannedDays, spentDays };
}

/* ----------------------------------------------------------------------------
 * Durum kümülatifi
 * -------------------------------------------------------------------------- */
/** STATUS_LIST sırasını koruyarak her durumun düğüm sayısını döner. */
export function statusCumulative(nodes: TaskNode[]): { status: string; count: number }[] {
  return STATUS_LIST.map((status) => ({
    status,
    count: nodes.filter((n) => n.status === status).length,
  }));
}
