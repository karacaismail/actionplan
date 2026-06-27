/**
 * Engine — JSON-as-DB veri setini yükleyen, doğrulayan, ağaçlayan ve
 * dışa/içe aktaran UI-bağımsız çekirdek. UI yalnız bu API'yi tüketir.
 */
export { buildTree, flattenTree } from "./buildTree";
export type { TreeNode, Rollup } from "./buildTree";
export { computeCriticalPath } from "./criticalPath";
export type { CriticalPath } from "./criticalPath";
export { auditNode, auditAll, scoreDimension, summarize, domainTokens, AUDIT_WEIGHTS, GENERIC_MARKERS } from "./audit";
export type { NodeAudit, DimensionScore, AuditSummary } from "./audit";
export { rollupExecution, groupByMilestone } from "./execution";
export type { ExecutionRollup } from "./execution";
export { parseQuery, matchNode, filterNodes, isQueryError, QUERY_FIELDS, QUERY_OPS } from "./query";
export type { QueryAst, QueryError, QueryField, QueryOp, QueryValue } from "./query";
export { sortNodes, groupNodes, valueForSort, groupValue } from "./table";
export type { SortDir, ScoreOf } from "./table";
export { applyBulk, sanitizeBulkPatch, BULK_FIELDS } from "./bulk";
export type { BulkPatch } from "./bulk";
export { toGanttBars, diffBaseline, dayspan } from "./gantt";
export type { GanttBar, BaselineDiff } from "./gantt";
export { workloadByAssignee, allocationStatus } from "./workload";
export type { Load, AllocationStatus } from "./workload";
export { milestoneProgress, phaseGateProgress, effortBurnup, statusCumulative } from "./reports";
export type { MilestoneProgress, Burnup } from "./reports";
export { evaluateAgentPolicy, evaluateEca, runEca } from "./eca";
export type { AgentActionRequest, AgentPolicyDecision, EcaFireResult } from "./eca";
export { loadMeta, loadNodesAsync } from "./loadData";
export type { MetaBundle } from "./loadData";
export {
  indexById,
  getChildren,
  getAncestors,
  getDescendants,
  deriveBlocks,
} from "./resolve";
export type { NodeIndex } from "./resolve";
export { exportJSON, exportTask, exportCSV, downloadFile, CSV_COLUMNS } from "./exportData";
export { importJSON, importCSV, parseCSV } from "./importData";
export type { ImportResult } from "./importData";
export {
  saveToGitHub,
  buildCommitBody,
  toBase64,
  rememberToken,
  recallToken,
} from "./githubSave";
export type { GitHubTarget, SaveResult } from "./githubSave";
