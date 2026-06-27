import type { Person, TaskNode } from "@/schemas";

/**
 * Workload / kapasite motoru (Faz 4) — UI-bağımsız SAF fonksiyonlar.
 *
 * Yalnız adam-gün (`effort.unit === "d"`) düğümleri sayılır; her düğümün eforu
 * atananlar arasında EŞİT bölünür. Kişi başına toplam gün, ilgili kişinin
 * günlük kapasitesiyle (people'daki `capacityPerDay`) kıyaslanıp tahsis durumu
 * (over/ok/under) belirlenir. Hiçbir global durum/I-O yok: test edilebilir, determinist.
 */

/** Bir atananın efor tahsis durumu. */
export type AllocationStatus = "over" | "ok" | "under" | "unknown";

/** Tek bir atanan için hesaplanmış yük satırı. */
export interface Load {
  /** Atanan kişi id'si (owner veya assignees öğesi). */
  assignee: string;
  /** Bu kişiye düşen toplam adam-gün. */
  days: number;
  /** Kişinin günlük kapasitesi (people'da yoksa 0). */
  capacity: number;
  /** days / capacity (capacity<=0 ise 0). */
  ratio: number;
  status: AllocationStatus;
}

/**
 * days/capacity oranına göre tahsis durumu.
 * capacity<=0 → "unknown"; oran >1.0 → "over"; <0.5 → "under"; arası "ok".
 */
export function allocationStatus(days: number, capacity: number): AllocationStatus {
  if (capacity <= 0) return "unknown";
  const ratio = days / capacity;
  if (ratio > 1.0) return "over";
  if (ratio < 0.5) return "under";
  return "ok";
}

/**
 * Bir düğümün eforunu üstlenen atanan kümesini çözer.
 * Öncelik: assignees doluysa onlar; değilse owner varsa [owner]; ikisi de yoksa boş (düğüm atlanır).
 */
function assigneesOf(node: TaskNode): string[] {
  if (node.assignees.length > 0) return node.assignees;
  if (node.owner) return [node.owner];
  return [];
}

/**
 * Atanan başına yük (adam-gün) ve kapasite tahsisini hesaplar.
 *
 * - Yalnız `effort.unit === "d"` düğümler sayılır.
 * - Her düğümün `effort.estimate` değeri atanan sayısına EŞİT bölünür ve her
 *   atanana eklenir (estimate / atananSayısı gün).
 * - capacity = people'daki eşleşen id'nin `capacityPerDay`'i (eşleşme yoksa 0).
 * - Sonuç, yükü olan veya people'da bulunan atananları içerir; `assignee`'ye göre
 *   (Türkçe collation) deterministik sıralanır.
 */
export function workloadByAssignee(nodes: TaskNode[], people: Person[]): Load[] {
  const capacityById = new Map<string, number>();
  for (const p of people) capacityById.set(p.id, p.capacityPerDay);

  const daysById = new Map<string, number>();
  // People'da olup hiç yük almayanlar da raporda görünmeli.
  for (const p of people) daysById.set(p.id, 0);

  for (const node of nodes) {
    if (node.effort.unit !== "d") continue;
    const assignees = assigneesOf(node);
    if (assignees.length === 0) continue;
    const share = node.effort.estimate / assignees.length;
    for (const a of assignees) {
      daysById.set(a, (daysById.get(a) ?? 0) + share);
    }
  }

  const loads: Load[] = [];
  for (const [assignee, days] of daysById) {
    const capacity = capacityById.get(assignee) ?? 0;
    const ratio = capacity > 0 ? days / capacity : 0;
    loads.push({ assignee, days, capacity, ratio, status: allocationStatus(days, capacity) });
  }

  loads.sort((a, b) => a.assignee.localeCompare(b.assignee, "tr"));
  return loads;
}
