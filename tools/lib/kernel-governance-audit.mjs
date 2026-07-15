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
  if (report.structuralFindings.queuePersistenceOrder.baseQueueChanged !== false)
    errors.push("gap addendum cannot reorder the base queue");

  const ids = new Set(nodes.map((node) => node.id));
  const ghosts = report.structuralFindings.ghostWbsClaims;
  if (ghosts.missingNodeIds.some((id) => ids.has(id))) errors.push("ghost WBS inventory drift");
  if (ghosts.nodeCreationAllowed !== false) errors.push("gap audit cannot create WBS nodes");
  if (
    report.structuralFindings.adrCollisions.length !== 5 ||
    report.structuralFindings.adrCollisions.some((item) => item.status !== "ambiguous")
  )
    errors.push("ADR collision inventory must remain fail-closed");
  if (report.structuralFindings.tenancyPhysicalStrategy.physicalStrategy !== null)
    errors.push("tenancy physical strategy requires human decision");

  const evidenceCount = kernel.reduce((sum, node) => sum + (node.evidence ?? []).length, 0);
  if (kernel.length !== 41 || evidenceCount !== 0) errors.push("kernel snapshot drift");
  const unresolved =
    errors.length > 0 || report.decisions.some((decision) => decision.status === "pending");
  if (unresolved && report.finalDecision.codeStartAllowed !== false)
    errors.push("unresolved blockers cannot allow code start");
  if (
    ["kernelReady", "sdkReady", "appBuildable"].some((key) => report.finalDecision[key] !== false)
  )
    errors.push("runtime readiness cannot be claimed");
  return errors;
}
