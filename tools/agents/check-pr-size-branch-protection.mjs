#!/usr/bin/env node
/**
 * B13 — merge koruması UYGUNLUK doğrulayıcısı.
 *
 * NE YAPAR: kanonik `changePackageBudget.checker.mergeProtection` sözleşmesini kendisi okur ve
 * DIŞARIDAN verilen tek bir branch-protection anlık görüntüsünü (`--input=<yol>`) onunla
 * karşılaştırır. Her yolda stdout'a TAM BİR JSON nesnesi yazar; yalnız birebir eşleşmede 0 ile
 * kapanır.
 *
 * NE YAPMAZ: ağa çıkmaz, GitHub CLI çağırmaz, ortam değişkeninden politika türetmez, hiçbir canlı
 * ayarı okumaz veya değiştirmez. Canlı korumayı KURMAZ; hâlihazırda yürürlükte olan korumayı
 * karşılaştırılabilir kılar. Tam GitHub politika denkliği İDDİA EDİLMEZ: sözleşmede adı geçmeyen
 * alanlar yok sayılır, ama adı geçen her karar birebir aranır ve sapma fail-closed durur.
 *
 * Node yerleşikleri dışında bağımlılığı yoktur.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TOOL = "check-pr-size-branch-protection";
export const SCHEMA_VERSION = 1;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CANONICAL = "src/data/standards/short-code.json";
const FLAG = "--input=";

/** Hata sınıfı → çıkış kodu. Çağıran girdisi ile politika sapması AYRI kapanır. */
export const KIND = {
  caller: "caller-input",
  policy: "policy-mismatch",
  canonical: "canonical-unreadable",
};
export const EXIT = { match: 0, caller: 64, policy: 65, canonical: 70 };
const CODE_OF = { [KIND.caller]: EXIT.caller, [KIND.policy]: EXIT.policy };

/** Her reddin KENDİ kararlı kimliği vardır; jenerik tek hataya çökmek yasaktır. */
export const ERROR_ID = {
  inputFlagMissing: "input-flag-missing",
  inputFlagRepeated: "input-flag-repeated",
  argumentUnknown: "argument-unknown",
  inputUnreadable: "input-unreadable",
  inputNotJson: "input-not-json",
  snapshotShapeInvalid: "snapshot-shape-invalid",
  requiredCheckMissing: "required-check-missing",
  requiredCheckMismatch: "required-check-mismatch",
  strictDisabled: "strict-disabled",
  adminEnforcementDisabled: "admin-enforcement-disabled",
  pullRequestNotRequired: "pull-request-not-required",
  forcePushAllowed: "force-push-allowed",
  branchDeletionAllowed: "branch-deletion-allowed",
  conversationResolutionDisabled: "conversation-resolution-disabled",
};

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const fail = (kind, id, message) => ({ kind, id, message });

/* ---------------------------------- kanonik sözleşme ---------------------------------- */

export function loadContract(root = ROOT) {
  let raw;
  try {
    raw = fs.readFileSync(path.join(root, CANONICAL), "utf8");
  } catch {
    return { contract: null, error: fail(KIND.canonical, "canonical-unreadable", CANONICAL) };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { contract: null, error: fail(KIND.canonical, "canonical-not-json", CANONICAL) };
  }
  const contract = parsed?.changePackageBudget?.checker?.mergeProtection;
  if (!isObject(contract))
    return {
      contract: null,
      error: fail(KIND.canonical, "canonical-contract-missing", "mergeProtection tanımlı değil"),
    };
  return { contract, error: null };
}

/* ------------------------------------- argümanlar ------------------------------------- */

export function readArgs(argv) {
  const flags = argv.filter((arg) => arg.startsWith(FLAG));
  const others = argv.filter((arg) => !arg.startsWith(FLAG));
  if (others.length > 0)
    return { input: null, error: fail(KIND.caller, ERROR_ID.argumentUnknown, others[0]) };
  if (flags.length > 1)
    return { input: null, error: fail(KIND.caller, ERROR_ID.inputFlagRepeated, `${flags.length}`) };
  const value = flags.length === 1 ? flags[0].slice(FLAG.length) : "";
  if (value === "")
    return { input: null, error: fail(KIND.caller, ERROR_ID.inputFlagMissing, `${FLAG}<yol>`) };
  return { input: value, error: null };
}

export function readSnapshot(inputPath) {
  let raw;
  try {
    const stat = fs.statSync(inputPath);
    if (!stat.isFile()) throw new Error("dosya değil");
    raw = fs.readFileSync(inputPath, "utf8");
  } catch {
    return { snapshot: null, error: fail(KIND.caller, ERROR_ID.inputUnreadable, "okunamadı") };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { snapshot: null, error: fail(KIND.caller, ERROR_ID.inputNotJson, "JSON çözülemedi") };
  }
  if (!isObject(parsed))
    return {
      snapshot: null,
      error: fail(KIND.caller, ERROR_ID.snapshotShapeInvalid, "kök bir nesne değil"),
    };
  return { snapshot: parsed, error: null };
}

/* -------------------------------------- eşleştirme ------------------------------------- */

/** Zorunlu check kimlikleri `contexts` ve/veya `checks` altında gelebilir; ikisi de toplanır. */
export function checkIdentities(snapshot) {
  const block = snapshot.required_status_checks;
  if (!isObject(block)) return { ids: [], strict: undefined, declared: false };
  const contexts = Array.isArray(block.contexts) ? block.contexts : [];
  const checks = Array.isArray(block.checks) ? block.checks : [];
  const ids = [
    ...contexts.filter((entry) => typeof entry === "string" && entry !== ""),
    ...checks
      .filter((entry) => isObject(entry) && typeof entry.context === "string")
      .map((entry) => entry.context)
      .filter((entry) => entry !== ""),
  ];
  return { ids: [...new Set(ids)], strict: block.strict, declared: true };
}

/** GitHub `{ enabled: bool }` sarmalayıcısı; eksik/yanlış tip beyan sayılmaz. */
const enabledOf = (value) =>
  isObject(value) && typeof value.enabled === "boolean" ? value.enabled : null;

export function comparePolicy(contract, snapshot) {
  const wanted = contract.requiredCheck;
  const { ids, strict, declared } = checkIdentities(snapshot);
  if (!declared || ids.length === 0)
    return fail(KIND.policy, ERROR_ID.requiredCheckMissing, "zorunlu check beyan edilmemiş");
  if (!ids.includes(wanted))
    return fail(KIND.policy, ERROR_ID.requiredCheckMismatch, `beklenen kimlik yok: ${wanted}`);
  if (strict !== contract.strict)
    return fail(KIND.policy, ERROR_ID.strictDisabled, "strict mod sözleşmeden sapıyor");
  if (enabledOf(snapshot.enforce_admins) !== contract.enforceAdmins)
    return fail(KIND.policy, ERROR_ID.adminEnforcementDisabled, "admin zorlaması sapıyor");
  if (isObject(snapshot.required_pull_request_reviews) !== contract.pullRequestRequired)
    return fail(KIND.policy, ERROR_ID.pullRequestNotRequired, "pull-request akışı beyan edilmemiş");
  if (enabledOf(snapshot.allow_force_pushes) !== contract.forcePushAllowed)
    return fail(KIND.policy, ERROR_ID.forcePushAllowed, "force-push kararı sapıyor");
  if (enabledOf(snapshot.allow_deletions) !== contract.deletionAllowed)
    return fail(KIND.policy, ERROR_ID.branchDeletionAllowed, "dal silme kararı sapıyor");
  if (
    enabledOf(snapshot.required_conversation_resolution) !== contract.requiredConversationResolution
  )
    return fail(KIND.policy, ERROR_ID.conversationResolutionDisabled, "konuşma çözümü sapıyor");
  return null;
}

/* ---------------------------------------- rapor ---------------------------------------- */

export function verify(argv, root = ROOT) {
  const loaded = loadContract(root);
  const contract = loaded.contract;
  const summary = contract
    ? {
        branch: contract.branch,
        requiredCheck: contract.requiredCheck,
        verifier: contract.verifier,
      }
    : null;
  const report = (input, error) => ({
    tool: TOOL,
    schemaVersion: SCHEMA_VERSION,
    networkCalls: 0,
    mutatesLivePolicy: false,
    contract: summary,
    input,
    matched: error === null,
    status: error === null ? "match" : error.kind,
    error,
    exitCode: error === null ? EXIT.match : (CODE_OF[error.kind] ?? EXIT.canonical),
  });
  if (loaded.error) return report(null, loaded.error);
  const args = readArgs(argv);
  if (args.error) return report(null, args.error);
  const read = readSnapshot(args.input);
  if (read.error) return report(args.input, read.error);
  return report(args.input, comparePolicy(contract, read.snapshot));
}

const invokedDirectly =
  process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const result = verify(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.exitCode);
}
