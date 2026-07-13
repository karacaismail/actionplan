/** Canonical uiArtifactRole vocabulary shared by the registry gate and its tests. */
export const UI_ARTIFACT_ROLES = Object.freeze([
  "produces-ui",
  "changes-ui-contract",
  "governs-ui",
  "consumes-ui",
  "no-ui",
]);

const UI_ARTIFACT_ROLE_SET = new Set(UI_ARTIFACT_ROLES);
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Accept only a canonical YYYY-MM-DD string that represents a real UTC calendar day. */
export function isStrictIsoDateOnly(value) {
  if (typeof value !== "string" || !ISO_DATE_ONLY.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * Validate ui-artifact-roles records independently from filesystem I/O.
 * `knownNodeIds` is the canonical generated WBS node-id set used for the external FK.
 */
export function validateUiArtifactRoleRecords(records, knownNodeIds) {
  const violations = [];
  const seenNodeIds = new Set();
  const known = knownNodeIds instanceof Set ? knownNodeIds : new Set(knownNodeIds ?? []);

  if (!Array.isArray(records)) return ["ui-artifact-roles.json: records dizisi zorunlu"];

  for (const [index, record] of records.entries()) {
    const location = `ui-artifact-roles.json[${index}]`;
    const nodeId = record?.nodeId;

    if (typeof nodeId !== "string" || nodeId.trim() === "") {
      violations.push(`${location}: nodeId zorunlu`);
    } else {
      if (seenNodeIds.has(nodeId)) violations.push(`${location}: duplicate nodeId: ${nodeId}`);
      seenNodeIds.add(nodeId);
      if (!known.has(nodeId))
        violations.push(`${location}: nodeId FK kırık — WBS düğümü yok: ${nodeId}`);
    }

    if (!UI_ARTIFACT_ROLE_SET.has(record?.role)) {
      violations.push(
        `${location}: geçersiz role ${JSON.stringify(record?.role)} (izinli: ${UI_ARTIFACT_ROLES.join(", ")})`,
      );
    }
    if (typeof record?.reason !== "string" || record.reason.trim() === "") {
      violations.push(`${location}: reason zorunlu`);
    }
    if (typeof record?.decidedBy !== "string" || record.decidedBy.trim() === "") {
      violations.push(`${location}: decidedBy zorunlu`);
    }
    if (!isStrictIsoDateOnly(record?.decidedAt)) {
      violations.push(`${location}: decidedAt gerçek YYYY-MM-DD tarihi olmalı`);
    }
  }

  return violations;
}
