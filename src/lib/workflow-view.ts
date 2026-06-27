import workflowCatalogJson from "@/data/surface/workflow-catalog.json";
import type { WorkflowContract } from "@/schemas";

/**
 * workflow-view — Surface/Workflow kataloğunu (Küme D) panelde GÖRSELLEŞTİRMEK için okuyan saf mantık.
 * Salt-okunur: durum makinesini değiştirmez; yalnız durumları/geçişleri sunmak için yardımcılar verir.
 */

const WORKFLOWS = workflowCatalogJson as unknown as WorkflowContract[];

type Transition = WorkflowContract["transitions"][number];

/** Katalogdaki tüm workflow sözleşmeleri. */
export function allWorkflows(): WorkflowContract[] {
  return WORKFLOWS;
}

/** Bir düğüme (ArcheType id) bağlı workflow'lar (archetypeRef eşleşmesi). */
export function workflowsForNode(
  nodeId: string,
  catalog: WorkflowContract[] = WORKFLOWS,
): WorkflowContract[] {
  return catalog.filter((w) => w.archetypeRef === nodeId);
}

/** Bir durumdan çıkan geçişler. */
export function outgoing(wf: WorkflowContract, state: string): Transition[] {
  return wf.transitions.filter((t) => t.from === state);
}

/** Durum terminal mi? */
export function isTerminal(wf: WorkflowContract, state: string): boolean {
  return wf.terminalStates.includes(state);
}
