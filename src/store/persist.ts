import type { TaskNode } from "@/schemas";

/**
 * Browser-storage kalıcılık (frontend-only, tek mod hep-düzenlenebilir).
 * Yalnız moderatörün (scrum master) DÜZENLEDİĞİ düğümler "override" olarak
 * localStorage'da tutulur; taban veri (public/data/nodes.json) korunur.
 * Böylece tüm korpusu (~2MB) değil, sadece değişen düğümleri saklarız.
 */
const KEY = "actionplan:overrides:v1";

function storage(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadOverrides(): Record<string, TaskNode> {
  const s = storage();
  if (!s) return {};
  try {
    const raw = s.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, TaskNode>) : {};
  } catch {
    return {};
  }
}

export function saveOverrides(map: Record<string, TaskNode>): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(KEY, JSON.stringify(map));
    return true;
  } catch {
    // kota dolabilir; sessizce başarısız ol (export/import yedek yolu var)
    return false;
  }
}

export function clearOverrides(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(KEY);
  } catch {
    /* yoksay */
  }
}

export function hasOverrides(): boolean {
  return Object.keys(loadOverrides()).length > 0;
}

/** Taban düğümlerin üzerine yerel override'ları bindirir (id eşleşmesi). */
export function applyOverrides(base: TaskNode[], overrides: Record<string, TaskNode>): TaskNode[] {
  if (Object.keys(overrides).length === 0) return base;
  const seen = new Set<string>();
  const merged = base.map((n) => {
    seen.add(n.id);
    return overrides[n.id] ?? n;
  });
  for (const [id, n] of Object.entries(overrides)) if (!seen.has(id)) merged.push(n);
  return merged;
}
