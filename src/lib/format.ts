import strings from "@/data/strings.json";
import type { Priority, TaskStatus, WbsLevel } from "@/schemas";
import { LEVEL_META } from "@/schemas";

// Etiketler tek kaynaktan: src/data/strings.json
export const STATUS_LABEL = strings.status as Record<TaskStatus, string>;

export const STATUS_VAR: Record<TaskStatus, string> = {
  backlog: "--status-backlog",
  todo: "--status-todo",
  "in-progress": "--status-progress",
  blocked: "--status-blocked",
  review: "--status-review",
  done: "--status-done",
};

export const PRIORITY_LABEL = strings.priority as Record<Priority, string>;

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
