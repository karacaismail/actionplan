const DECISION_IDS = ["KGA-D06", "KGA-D07", "KGA-D08", "KGA-D09", "KGA-D10"];
const AUTHORITY_CHAIN = [
  "codex-master",
  "pm-successor-coordinator",
  "specialist-agents",
  "claude-workers-slaves",
];
const ADR_SNAPSHOT = [
  "ADR-E1:event-replay-projection|evidence-seal",
  "ADR-M1:migration-bridge|module-security-sandbox",
  "ADR-S1:object-storage-dam|surface-family",
  "ADR-X1:execution-contract-matrix|execution-context-envelope",
  "ADR-A5/ADR-0022:archetype-storage|variant-fieldtype-extension|duplicate-storage-identity",
];

export function relationDirectionConflicts(nodes) {
  const edges = [];
  for (const node of nodes) {
    const blocked = new Set(node.blocks ?? []);
    for (const targetId of node.dependsOn ?? [])
      if (blocked.has(targetId)) edges.push({ nodeId: node.id, targetId });
  }
  return {
    affectedNodeCount: new Set(edges.map((edge) => edge.nodeId)).size,
    edgeCount: edges.length,
    kernelNodeCount: new Set(
      edges.filter((edge) => edge.nodeId.startsWith("k-")).map((edge) => edge.nodeId),
    ).size,
    kernelEdgeCount: edges.filter((edge) => edge.nodeId.startsWith("k-")).length,
  };
}

export function readinessCandidates(nodes) {
  return {
    doneNodes: nodes.filter((node) => node.status === "done").length,
    developmentNodes: nodes.filter((node) => node.phase === "development").length,
  };
}

export function validateKernelGovernance({ nodes, queue, report }) {
  const errors = [];
  const kernel = nodes.filter((node) => node.id.startsWith("k-"));
  const relations = relationDirectionConflicts(nodes);
  const reportedRelations = report.structuralFindings.relationDirectionConflicts;
  if (
    JSON.stringify(relations) !==
    JSON.stringify({
      affectedNodeCount: reportedRelations.affectedNodeCount,
      edgeCount: reportedRelations.edgeCount,
      kernelNodeCount: reportedRelations.kernelNodeCount,
      kernelEdgeCount: reportedRelations.kernelEdgeCount,
    })
  )
    errors.push("relation conflict count drift");

  const candidates = readinessCandidates(nodes);
  const reportedCandidates = report.structuralFindings.readinessCandidates;
  if (
    candidates.doneNodes !== reportedCandidates.doneNodes ||
    candidates.developmentNodes !== reportedCandidates.developmentNodes
  )
    errors.push("readiness candidate count drift");
  if (
    candidates.doneNodes === 0 &&
    candidates.developmentNodes === 0 &&
    reportedCandidates.result !== "NO_CANDIDATES"
  )
    errors.push("zero candidates must remain NO_CANDIDATES");
  if (reportedCandidates.readyClaimAllowed !== false)
    errors.push("NO_CANDIDATES cannot be a ready claim");

  const foundation = queue.items.filter((item) => /^PR-\d{2}$/.test(item.id));
  const actionable = foundation.filter((item) => item.status === "next-actionable");
  if (actionable.length !== 1 || actionable[0]?.id !== "PR-01")
    errors.push("base queue must keep PR-01 as the only actionable item");
  if (
    report.structuralFindings.queuePersistenceOrder.baseQueueChanged !== false ||
    report.structuralFindings.queuePersistenceOrder.currentNextActionable !== "PR-01"
  )
    errors.push("gap addendum cannot reorder the base queue");

  const ids = new Set(nodes.map((node) => node.id));
  const ghosts = report.structuralFindings.ghostWbsClaims;
  if (ghosts.missingNodeIds.length !== 13 || ghosts.missingNodeIds.some((id) => ids.has(id)))
    errors.push("ghost WBS snapshot drift");
  if (ghosts.nodeCreationAllowed !== false) errors.push("gap audit cannot create WBS nodes");
  const adrSnapshot = report.structuralFindings.adrCollisions.map(
    (item) => `${item.id}:${item.topics.join("|")}`,
  );
  if (
    JSON.stringify(adrSnapshot) !== JSON.stringify(ADR_SNAPSHOT) ||
    report.structuralFindings.adrCollisions.some((item) => item.status !== "ambiguous")
  )
    errors.push("ADR collision snapshot drift");
  if (report.structuralFindings.tenancyPhysicalStrategy.physicalStrategy !== null)
    errors.push("tenancy physical strategy requires human decision");
  if (
    JSON.stringify(report.authority.chain) !== JSON.stringify(AUTHORITY_CHAIN) ||
    report.authority.finalAuthority !== "codex" ||
    report.authority.runtimeExecutor !== "human-developer-only"
  )
    errors.push("authority chain drift");
  if (
    JSON.stringify(report.decisions.map((decision) => decision.id)) !==
      JSON.stringify(DECISION_IDS) ||
    report.decisions.some((decision) => decision.status !== "pending")
  )
    errors.push("decision inventory drift");
  if (
    report.decisions.some(
      (decision) =>
        decision.decisionOwner !== "user-admin" ||
        decision.coordinator !== "project-manager" ||
        decision.deliveryAuthority !== "codex",
    )
  )
    errors.push("decision authority drift");

  const evidenceCount = kernel.reduce((sum, node) => sum + (node.evidence ?? []).length, 0);
  const kernelSp = kernel.reduce((sum, node) => sum + Number(node.effort?.estimate ?? 0), 0);
  if (
    report.sourceSnapshot.nodeCount !== nodes.length ||
    report.sourceSnapshot.kernelNodeCount !== kernel.length ||
    report.sourceSnapshot.kernelSp !== kernelSp ||
    report.sourceSnapshot.kernelRuntimeEvidenceCount !== evidenceCount
  )
    errors.push("kernel snapshot drift");
  const unresolved =
    errors.length > 0 || report.decisions.some((decision) => decision.status === "pending");
  if (unresolved && report.finalDecision.codeStartAllowed !== false)
    errors.push("unresolved blockers cannot allow code start");
  if (
    ["kernelReady", "sdkReady", "appBuildable"].some((key) => report.finalDecision[key] !== false)
  )
    errors.push("runtime readiness cannot be claimed");
  if (report.finalDecision.verdict !== "NO-GO" || report.finalDecision.nextActionable !== "PR-01")
    errors.push("runtime verdict must remain NO-GO");
  return errors;
}
