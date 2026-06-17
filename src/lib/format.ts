import type { Priority, TaskStatus, WbsLevel } from "@/schemas";
import { LEVEL_META } from "@/schemas";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Yapılacak",
  "in-progress": "Devam Ediyor",
  blocked: "Bloke",
  review: "İncelemede",
  done: "Tamam",
};

export const STATUS_VAR: Record<TaskStatus, string> = {
  backlog: "--status-backlog",
  todo: "--status-todo",
  "in-progress": "--status-progress",
  blocked: "--status-blocked",
  review: "--status-review",
  done: "--status-done",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

export function levelLabel(level: WbsLevel): string {
  return `${LEVEL_META[level].tr} · ${LEVEL_META[level].metaphor}`;
}

export function levelVar(level: WbsLevel): string {
  return `--level-${level}`;
}

/** HSL CSS değişkenini renk string'ine sarar. */
export function hslVar(varName: string): string {
  return `hsl(var(${varName}))`;
}
