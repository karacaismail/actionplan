import type { TaskNode } from "@/schemas";
import { exportDeveloperBrief } from "./exportDataBrief";
import { exportAgentPrompt, exportVobecoderCard } from "./exportDataPrompts";
import { taskFilename } from "./exportDataShared";
import { exportEvidencePatch, exportTask } from "./exportDataStructured";

export { exportDeveloperBrief } from "./exportDataBrief";
export { exportAgentPrompt, exportVobecoderCard } from "./exportDataPrompts";
export { PAGES_BASE } from "./exportDataShared";
export {
  CSV_COLUMNS,
  downloadFile,
  exportCSV,
  exportEvidencePatch,
  exportJSON,
  exportTask,
} from "./exportDataStructured";

export type TaskArtifactMode =
  | "raw-json"
  | "developer-brief"
  | "agent-prompt"
  | "evidence-patch"
  | "vobecoder-card";

export function exportTaskArtifact(
  node: TaskNode,
  mode: TaskArtifactMode,
  index?: Map<string, TaskNode>,
): { filename: string; content: string; mime: string } {
  switch (mode) {
    case "developer-brief":
      return {
        filename: taskFilename(node, "developer-brief", "md"),
        content: exportDeveloperBrief(node, index),
        mime: "text/markdown",
      };
    case "agent-prompt":
      return {
        filename: taskFilename(node, "agent-prompt", "md"),
        content: exportAgentPrompt(node, index),
        mime: "text/markdown",
      };
    case "evidence-patch":
      return {
        filename: taskFilename(node, "evidence-patch", "json"),
        content: exportEvidencePatch(node),
        mime: "application/json",
      };
    case "vobecoder-card":
      return {
        filename: taskFilename(node, "vobecoder-card", "md"),
        content: exportVobecoderCard(node, index),
        mime: "text/markdown",
      };
    case "raw-json":
      return {
        filename: taskFilename(node, "raw", "json"),
        content: exportTask(node, index),
        mime: "application/json",
      };
  }
}
