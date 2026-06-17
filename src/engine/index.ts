/**
 * Engine — JSON-as-DB veri setini yükleyen, doğrulayan, ağaçlayan ve
 * dışa/içe aktaran UI-bağımsız çekirdek. UI yalnız bu API'yi tüketir.
 */
export { buildTree, flattenTree } from "./buildTree";
export type { TreeNode, Rollup } from "./buildTree";
export { computeCriticalPath } from "./criticalPath";
export type { CriticalPath } from "./criticalPath";
export { evaluateEca, runEca } from "./eca";
export type { EcaFireResult } from "./eca";
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
