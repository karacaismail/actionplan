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
const GHOST_WBS_SNAPSHOT =
  "archetype-agreement|archetype-document-composition|k-evidence|k-event-projection|k-exec-context|k-kms|k-legal-hold-retention|k-migration-bridge|k-module-security|k-obligation|k-provider-adapter|k-signature|privacy-retention-matrix";
const GOVERNANCE_ARTIFACTS = {
  adrCollisionSourceBindings: "reports/kernel-adr-collision-source-bindings-2026-07-15.json",
  ghostWbsDirectiveBindings: "reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json",
  tenancyAuthorityInventory: "reports/kernel-tenancy-authority-inventory-2026-07-15.json",
};

function authorityDrift(artifact) {
  return (
    artifact.decision?.decisionOwner !== "user-admin" ||
    artifact.decision?.coordinator !== "project-manager" ||
    artifact.decision?.finalAuthority !== "codex" ||
    artifact.authorityBoundary?.runtimeExecutor !== "human-developer-only"
  );
}

function validateAdrLedger(adr) {
  const errors = [];
  if (adr.decisionId !== "KGA-D08" || adr.decision?.status !== "pending")
    errors.push("ADR ledger decision drift");
  if (adr.approvalRefAllowed !== false) errors.push("ADR approval ref requires human decision");
  const identity = adr.identityMutationAllowed ?? {};
  if (
    [identity.renumber, identity.alias, identity.supersession].some((allowed) => allowed !== false)
  )
    errors.push("ADR identity mutation requires human decision");
  const selected = (adr.collisions ?? []).some(
    (collision) => collision.status !== "ambiguous" || collision.canonicalTopic !== null,
  );
  if (adr.collisionsStatus !== "ambiguous" || selected)
    errors.push("ADR canonical topic requires human decision");
  return errors;
}

function validateGhostLedger(ghost) {
  const errors = [];
  if (
    ghost.decisionId !== "KGA-D09" ||
    ghost.decision?.status !== "pending" ||
    ghost.bindingsStatus !== "candidate-unselected"
  )
    errors.push("ghost ledger decision drift");
  if ((ghost.bindings ?? []).some((b) => b.selected !== false))
    errors.push("ghost binding cannot select a canonical node");
  if (ghost.nodeCreationAllowed !== false)
    errors.push("ghost binding ledger cannot create WBS nodes");
  return errors;
}

function validateTenancyLedger(tenancy) {
  const errors = [];
  const t = tenancy.tenancy ?? {};
  if (tenancy.decisionId !== "KGA-D10" || tenancy.decision?.status !== "pending")
    errors.push("tenancy ledger decision drift");
  if (t.physicalStrategy !== null || t.threshold !== null)
    errors.push("tenancy inventory cannot select a topology");
  if (t.mandatoryRls !== true) errors.push("tenancy inventory cannot weaken mandatory RLS");
  if (t.invalidAuthority?.isTenancyAuthority !== false) errors.push("tenancy authority drift");
  return errors;
}

function validateArtifactBoundaries(ledgers) {
  const errors = [];
  if (ledgers.some((artifact) => artifact.authorityBoundary?.codeStartAllowed !== false))
    errors.push("governance artifact cannot allow code start");
  const claimsReadiness = ledgers.some(
    (artifact) =>
      artifact.authorityBoundary?.kernelReady !== false ||
      artifact.authorityBoundary?.sdkReady !== false ||
      artifact.authorityBoundary?.appBuildable !== false ||
      artifact.authorityBoundary?.verdict !== "NO-GO",
  );
  if (claimsReadiness) errors.push("governance artifact cannot claim readiness");
  return errors;
}

function validateGovernanceArtifacts(artifacts) {
  const ledgers = [artifacts?.adrCollisions, artifacts?.ghostBindings, artifacts?.tenancyAuthority];
  if (ledgers.some((artifact) => !artifact)) return ["governance artifacts missing"];
  const [adr, ghost, tenancy] = ledgers;
  const errors = [];
  if (ledgers.some(authorityDrift)) errors.push("governance artifact authority drift");
  errors.push(...validateAdrLedger(adr));
  errors.push(...validateGhostLedger(ghost));
  errors.push(...validateTenancyLedger(tenancy));
  errors.push(...validateArtifactBoundaries(ledgers));
  return errors;
}

export function relationDirectionConflicts(nodes) {
  const edges = [];
  for (const node of nodes) {
    const blocked = new Set(node.blocks ?? []);
    for (const targetId of node.dependsOn ?? [])
      if (blocked.has(targetId)) edges.push({ nodeId: node.id, targetId });
  }
  const kernelEdges = edges.filter((edge) => edge.nodeId.startsWith("k-"));
  return {
    affectedNodeCount: new Set(edges.map((edge) => edge.nodeId)).size,
    edgeCount: edges.length,
    kernelNodeCount: new Set(kernelEdges.map((edge) => edge.nodeId)).size,
    kernelEdgeCount: kernelEdges.length,
    kernelNodeIds: [...new Set(kernelEdges.map((edge) => edge.nodeId))].sort(),
  };
}

export function readinessCandidates(nodes) {
  return {
    doneNodes: nodes.filter((node) => node.status === "done").length,
    developmentNodes: nodes.filter((node) => node.phase === "development").length,
  };
}

export function validateKernelGovernance({ nodes, queue, report, artifacts }) {
  const errors = [];
  const reportedArtifacts = report.governanceArtifacts ?? {};
  if (
    Object.keys(reportedArtifacts).length !== Object.keys(GOVERNANCE_ARTIFACTS).length ||
    Object.entries(GOVERNANCE_ARTIFACTS).some(([key, value]) => reportedArtifacts[key] !== value)
  )
    errors.push("governance artifact ref drift");
  errors.push(...validateGovernanceArtifacts(artifacts));
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
      kernelNodeIds: reportedRelations.kernelNodeIds,
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
  const ghostIdsMatch =
    ghosts.missingNodeIds.length === 13 && ghosts.missingNodeIds.join("|") === GHOST_WBS_SNAPSHOT;
  if (!ghostIdsMatch || ghosts.missingNodeIds.some((id) => ids.has(id)))
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
