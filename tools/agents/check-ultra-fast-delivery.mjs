#!/usr/bin/env node
/**
 * check-ultra-fast-delivery (ULTRA_FAST_V1) — deterministik, salt-okunur doğrulayıcı. Ağa ve
 * Git'e ÇIKMAZ; yalnız çalışma ağacındaki dosyaları okur. Üç kanıt sınıfını tek çağrıda
 * kontrol eder: (1) sözleşme — `short-code.json#changePackageBudget.ultraFastV1` var ve pinlenmiş OWNER
 * değerlerini taşıyor, (2) işaretçi — `short-code.json` referansı ve tüm projeksiyon
 * dosyaları + rol profilleri gerçekten mevcut, (3) eski-rota yokluğu — AGENTS.md'de artık
 * geçersiz doğrudan-MCP/Codex-olarak-tek-yazar ifadeleri yok. Tüm kontroller GREEN ise
 * `ULTRA_FAST_DELIVERY_GREEN` yazıp 0 ile çıkar; ilk RED adlandırılmış hatayla 1 ile çıkar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rj = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const readText = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const failures = [];
const fail = (id, detail) => failures.push({ id, detail });

const SHORT_CODE_PATH = "src/data/standards/short-code.json";
const ULTRA_FAST_REF = `${SHORT_CODE_PATH}#changePackageBudget.ultraFastV1`;
const AGENTS_PATH = "AGENTS.md";

const POINTER_PROJECTION_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  "RULES.md",
  "docs/roadmap-pm-paritesi.md",
  ".claude/skills/ultra-fast-development/SKILL.md",
];
const AGENT_PROFILE_FILES = [
  ".claude/agents/ultra-fast-test-writer.md",
  ".claude/agents/ultra-fast-implementation-writer.md",
  ".claude/agents/ultra-fast-reviewer.md",
];
/** OWNER sözleşmesi burada TEKRARLANMIYOR ölçmek için: yalnız pinlenmiş anahtar/değer çiftleri. */
const PINNED = [
  ["testScoping.activeDefault.minScenarios", 3],
  ["testScoping.activeDefault.maxScenarios", 8],
  ["testScoping.activeDefault.maxTestFiles", 2],
  ["testScoping.nonBehavioral.minScenarios", 0],
  ["testScoping.nonBehavioral.maxScenarios", 2],
  ["testScoping.nonBehavioral.explicitRedAllowed", "N/A"],
  ["testScoping.namedRiskException.requiresNamedRisk", true],
  ["testScoping.namedRiskException.requiresBoundedLocalCeiling", true],
  ["testScoping.namedRiskException.requiresIndependentReview", true],
  ["checkpointCadence.checkpointMinutes", 20],
  ["checkpointCadence.maxCorrectionWaves", 1],
  ["qaDiscipline.unchangedSnapshotRerunAllowed", false],
  ["qaDiscipline.browserVerificationScope", "visible-ui-journey-change-only"],
  ["paneAdmission.admissionMode", "jit-exact-worktree"],
  ["paneAdmission.speculativeCreationAllowed", false],
  [
    "paneAdmission.concurrencyFormula",
    "min(guardianRecommended, dagReadyCount, sharedLockCapacity, 3)",
  ],
  ["paneAdmission.staticConcurrencyCeiling", 3],
  ["paneAdmission.gcTrigger", "event-driven"],
];
const TERMINAL_OUTCOMES = ["READY_FOR_CI", "CLEAN_SPLIT_OR_ROLLBACK", "BLOCKED_WITH_ONE_EVIDENCE"];
const QA_SEQUENCE = ["writer-local", "ci"];
const QA_ROLES = ["test", "implementation", "read-only-reviewer"];
const MASTER_DECIDES = ["reversible-technical", "worktree", "test-framework", "git", "pr", "ci"];
const OWNER_QUESTION_CATEGORIES = [
  "product-brand-scope",
  "irreversible-impact",
  "external-cost",
  "security-risk-appetite",
  "credentials",
  "genuinely-required-external-authority",
];
/** Artık geçersiz olan eski çağrı-rotası ifadeleri; AGENTS.md'de bulunmamalı. */
const STALE_ROUTING_PHRASES = [
  "Codex = MASTER:",
  "yalnız Codex'in açıkça sınırladığı `claude_review` veya `claude_implement`",
];
const REQUIRED_ROUTING_PHRASES = ["runpane --agent claude", "Codex Desktop MASTER"];
/** OWNER-supplied kanıt kaynakları; repo DIŞINDADIR, yalnız ad+hash eşleşmesi denetlenir. */
const EXPECTED_EVIDENCE_REPORTS = [
  {
    file: "claude_speeder_report.md",
    sha256: "dc9ec29684b493f19646451db72f2ea1263a4d2f06c7b4a0d94e8e21f0d9cbc5",
  },
  {
    file: "codex_speeder_report.md",
    sha256: "f7ee1d903c3febaf70935866663be28bb0078b67b0b30da56fc9242c49840be5",
  },
];
/** ULTRA_FAST bağlamında OWNER sayı/eşiklerinin işaretçi yüzeylerinde KOPYASI aranır (dar regex;
 *  yalnız "ultra fast" bağlam kelimesi görülen dosyalarda, kanonik JSON/schema/test/validator hariç
 *  taranır — bunlar false-positive üretmesin diye tarama kapsamına alınmaz). */
const NUMBER_COPY_PATTERNS = [
  /\b20\s*(dakika|dk|minute|min)\b/i,
  /\b3\s*[–—-]\s*8\b/,
  /\b0\s*[–—-]\s*2\b/,
  /\b(en\s*fazla|en\s*çok|max(?:imum)?)\s*2\s*(test\s*)?dosya/i,
  /\b1\s*(düzeltme\s*dalgası|correction\s*wave)/i,
  /\bREADY_FOR_CI["'`]?\s*,\s*["'`]?CLEAN_SPLIT_OR_ROLLBACK["'`]?\s*,\s*["'`]?BLOCKED_WITH_ONE_EVIDENCE\b/,
  /\b(writer-local|yazar-yerel)\b[^.\n]{0,20}(→|->|sonra|then)[^.\n]{0,20}\bci\b/i,
  /\btam\s*olarak\s*bir\s*kez\b/i,
];
const NUMBER_COPY_SCOPE = [
  "CLAUDE.md",
  "src/data/standards/testing-strategy.json",
  ".claude/skills/ultra-fast-development/SKILL.md",
  ".claude/agents/ultra-fast-test-writer.md",
  ".claude/agents/ultra-fast-implementation-writer.md",
  ".claude/agents/ultra-fast-reviewer.md",
];

const getAt = (obj, dottedPath) =>
  dottedPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

const sameSet = (got, want) =>
  Array.isArray(got) && got.length === want.length && want.every((w) => got.includes(w));

const checkContract = () => {
  if (!exists(SHORT_CODE_PATH)) return fail("contract-missing", SHORT_CODE_PATH);
  const doc = rj(SHORT_CODE_PATH);
  const policy = doc.changePackageBudget?.ultraFastV1;
  if (!policy || typeof policy !== "object")
    return fail("contract-missing-key", "changePackageBudget.ultraFastV1");

  for (const [dottedPath, expected] of PINNED) {
    const got = getAt(policy, dottedPath);
    if (got !== expected)
      fail("pinned-value-drift", `${dottedPath} beklenen=${expected} bulunan=${got}`);
  }
  if (!sameSet(policy.checkpointCadence?.terminalOutcomes, TERMINAL_OUTCOMES))
    fail("terminal-outcomes-drift", JSON.stringify(policy.checkpointCadence?.terminalOutcomes));
  if (!sameSet(policy.qaDiscipline?.fullQaSequence, QA_SEQUENCE))
    fail("qa-sequence-drift", JSON.stringify(policy.qaDiscipline?.fullQaSequence));
  if (!sameSet(policy.qaDiscipline?.separateRoles, QA_ROLES))
    fail("qa-roles-drift", JSON.stringify(policy.qaDiscipline?.separateRoles));
  const master = policy.decisionAuthority?.masterDecidesWithoutAsking ?? [];
  if (!MASTER_DECIDES.every((m) => master.includes(m)))
    fail("master-decides-incomplete", JSON.stringify(master));
  const ownerCats = policy.decisionAuthority?.ownerQuestionCategories ?? [];
  if (!OWNER_QUESTION_CATEGORIES.every((c) => ownerCats.includes(c)))
    fail("owner-question-categories-incomplete", JSON.stringify(ownerCats));

  const evidenceHashes = policy.evidenceHashes ?? [];
  const evidenceReports = policy.evidenceReports ?? [];
  if (evidenceHashes.length !== 2) fail("evidence-hashes-count", String(evidenceHashes.length));
  if (evidenceReports.length !== 2) fail("evidence-reports-count", String(evidenceReports.length));
  /** OWNER-supplied kaynak adları (repo dışı); yalnız ad+hash EŞLEŞMESİ denetlenir, dosya OKUNMAZ. */
  for (const expected of EXPECTED_EVIDENCE_REPORTS) {
    const match = evidenceReports.find(
      (r) => r.file === expected.file && r.sha256 === expected.sha256,
    );
    if (!match) fail("evidence-report-name-hash-mismatch", `${expected.file}:${expected.sha256}`);
  }
  const reportHashes = new Set(evidenceReports.map((r) => r.sha256));
  for (const h of evidenceHashes)
    if (!reportHashes.has(h)) fail("evidence-hash-report-mismatch", h);

  return policy;
};

const checkPointer = () => {
  if (!exists(SHORT_CODE_PATH)) return fail("short-code-missing", SHORT_CODE_PATH);
  const shortCode = rj(SHORT_CODE_PATH);
  const ref = shortCode.changePackageBudget?.ultraFastPolicyRef;
  if (ref !== ULTRA_FAST_REF)
    fail("pointer-ref-drift", `beklenen=${ULTRA_FAST_REF} bulunan=${ref}`);

  for (const file of POINTER_PROJECTION_FILES)
    if (!exists(file)) fail("pointer-projection-missing", file);
  for (const file of AGENT_PROFILE_FILES) if (!exists(file)) fail("agent-profile-missing", file);
};

const checkStaleRoutingAbsence = () => {
  if (!exists(AGENTS_PATH)) return fail("agents-md-missing", AGENTS_PATH);
  const text = readText(AGENTS_PATH);
  for (const phrase of STALE_ROUTING_PHRASES)
    if (text.includes(phrase)) fail("stale-routing-phrase-present", phrase);
  for (const phrase of REQUIRED_ROUTING_PHRASES)
    if (!text.includes(phrase)) fail("required-routing-phrase-missing", phrase);
};

const checkNoNumberCopy = () => {
  for (const file of NUMBER_COPY_SCOPE) {
    if (!exists(file)) continue;
    const text = readText(file);
    for (const pattern of NUMBER_COPY_PATTERNS)
      if (pattern.test(text)) fail("pointer-surface-number-copy", `${file}: ${pattern}`);
  }
};

checkContract();
checkPointer();
checkStaleRoutingAbsence();
checkNoNumberCopy();

if (failures.length > 0) {
  for (const f of failures) process.stderr.write(`RED ${f.id}: ${f.detail}\n`);
  process.stderr.write(`ULTRA_FAST_DELIVERY_RED (${failures.length} bulgu)\n`);
  process.exit(1);
}
process.stdout.write("ULTRA_FAST_DELIVERY_GREEN\n");
process.exit(0);
