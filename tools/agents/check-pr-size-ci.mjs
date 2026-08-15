#!/usr/bin/env node
/**
 * check-pr-size-ci (ADR-0027 / short-code `short-pr-size`) — GitHub `pull_request` OLAY ADAPTÖRÜ.
 * ÖLÇÜM/KARAR/TOPLAMA burada DEĞİLdir; hepsi kabul edilmiş kapıdan İÇE AKTARILIR. Burada yalnız
 * OLAYIN kapıya çevrilmesi vardır: olay adı, olay dosyası, DEĞİŞMEZ base/head SHA'ları ve
 * etiketlerden çözülen sınıf/kanıt. Sınıf/bant/eşik/kanıt KİMLİĞİ ikinci kez YAZILMAZ, kanonikten
 * türer; `pr-size:class:` ve `pr-size:evidence:` yalnız bu yüzeyin SINIR SÖZDİZİMİdir. Kapı ÇAĞRIYA
 * ÖZGÜ `ciEnforced=true` ile koşar: argv bayrağı DEĞİLdir, yerel çağıran onu üretemez. FAIL-CLOSED:
 * eksik/desteklenmeyen olay, okunamayan/bozuk/eksik şekilli yük, birden çok sınıf etiketi ve
 * kanonikte olmayan kimlik KARAR YERİNE adlandırılmış rapor + çıkış kodu üretir; stdout tam JSON.
 * Bu adım PR'ın build check'ini kırar; birleştirmeyi durduran şey ise o build job'unu zorunlu kılan
 * ve ZATEN yürürlükte olan GitHub branch protection'dır. B13 o korumayı KURMAZ, kanonik olarak
 * doğrulanabilir kılar.
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { writeAllSync } from "../lib/pr-size-core.mjs";
import { ERROR_KIND } from "../lib/pr-size-decision.mjs";
import { CANONICAL_STANDARD, EXIT_CODE, INTERNAL, runCheck } from "./check-pr-size.mjs";

export const ADAPTER_SCHEMA = "pr-size-ci-adapter/1";
export const ADAPTER_VERSION = "1.0.0";
/** Bağlanan TEK olay; başka her olay adı kendi adıyla REDdir. */
export const EVENT_NAME = "pull_request";
export const CLASS_PREFIX = "pr-size:class:";
export const EVIDENCE_PREFIX = "pr-size:evidence:";
const NAME_VAR = "GITHUB_EVENT_NAME";
const PATH_VAR = "GITHUB_EVENT_PATH";
/** Aralık DEĞİŞMEZ olmalı: dal adı sonradan başka commit'e kayabilir, tam SHA kaymaz. */
const FULL_SHA = /^[0-9a-f]{40}$/;
/** UYGULAMA GÜVENLİK FRENİ, politika eşiği DEĞİL: sınırsız yükü belleğe almayı önler. */
const MAX_EVENT_BYTES = 8 * 1024 * 1024;
const CANONICAL_URL = new URL(`../../${CANONICAL_STANDARD}`, import.meta.url);
const fault = (id, kind, detail) => ({ ok: false, error: { id, kind, detail } });
const caller = (id, detail) => fault(id, ERROR_KIND.caller, detail);
const shaped = (detail) => fault("event-shape-invalid", ERROR_KIND.input, detail);
const badConfig = (detail) => fault("canonical-unusable", ERROR_KIND.config, detail);
const UNREADABLE = fault("event-unreadable", ERROR_KIND.input, "olay dosyası okunabilir değil");

/** Kanonik alan cwd'den DEĞİL, bu modülün KENDİ konumundan çözülür; kapı da aynısını yapar. */
const loadBudget = () => {
  let budget;
  try {
    budget = JSON.parse(fs.readFileSync(CANONICAL_URL, "utf8"))?.changePackageBudget;
  } catch {
    return badConfig("kanonik standart okunamadı veya geçerli JSON değil");
  }
  return budget && Array.isArray(budget.classes) && Array.isArray(budget.bands)
    ? { ok: true, budget }
    : badConfig("kanonik bütçe alanı beklenen biçimde değil");
};

/**
 * Olay dosyası FAIL-CLOSED okunur: `lstat` bağı İZLEMEZ, dizin/aygıt/FIFO ve boş dosya okuma
 * denenmeden REDdir, güvenlik freni aşılırsa dosya hiç okunmaz. Tanılama YOL YANKILAMAZ.
 */
const readEvent = (file) => {
  let text;
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.size === 0 || stat.size > MAX_EVENT_BYTES) return UNREADABLE;
    text = fs.readFileSync(file, "utf8");
  } catch {
    return UNREADABLE;
  }
  try {
    return { ok: true, payload: JSON.parse(text) };
  } catch {
    return fault("event-not-json", ERROR_KIND.input, "olay yükü geçerli JSON değil");
  }
};

/** Etiket listesi ya BÜTÜNÜYLE beklenen biçimdedir ya da hiç okunmaz; kısmi okuma YOKTUR. */
const labelNames = (raw) =>
  Array.isArray(raw) && raw.every((entry) => typeof entry?.name === "string")
    ? raw.map((entry) => entry.name)
    : null;
const tagged = (names, prefix) =>
  names.filter((name) => name.startsWith(prefix)).map((name) => name.slice(prefix.length));

/**
 * Olay → kapı çağrısı. Sınıf etiketi YOKSA kanonik merdivenin İLK bandının kimliğini `ceilingKind`
 * olarak taşıyan sınıfa düşülür; kimlik burada sabit yazılmaz. Sınıf etiketi BİRDEN ÇOKSA sessizce
 * biri seçilmez. ETİKET DEĞERİ hiçbir tanılamada YANKILANMAZ; karar yalnız kapınındır.
 */
export const resolveInvocation = (env, budget) => {
  const name = env[NAME_VAR];
  if (!name) return caller("event-name-missing", `${NAME_VAR} tanımlı değil`);
  if (name !== EVENT_NAME) return caller("event-name-unsupported", `yalnız ${EVENT_NAME} bağlanır`);
  const file = env[PATH_VAR];
  if (!file) return caller("event-path-missing", `${PATH_VAR} tanımlı değil`);
  const event = readEvent(file);
  if (!event.ok) return event;
  const pull = event.payload?.[EVENT_NAME];
  if (!pull || typeof pull !== "object") return shaped(`olayda ${EVENT_NAME} nesnesi yok`);
  const base = pull.base?.sha;
  const head = pull.head?.sha;
  if (!FULL_SHA.test(String(base)) || !FULL_SHA.test(String(head)))
    return shaped("olayda değişmez base/head SHA alanları yok");
  const names = labelNames(pull.labels);
  if (names === null) return shaped("etiket listesi beklenen biçimde değil");
  const declared = tagged(names, CLASS_PREFIX);
  if (declared.length > 1)
    return caller("class-label-ambiguous", `tek sınıf etiketi beklenir; ${declared.length} var`);
  // BOŞ son ek de bir BEYANdır. `??` onu yutup kanonik sınıfa düşürürdü; varlığı uzunlukla
  // sorulur, böylece ÇAĞIRANIN hatası yapılandırma hatası gibi sınıflanmaz.
  const implicit = budget.classes.find((e) => e.ceilingKind === budget.bands[0]?.id)?.id;
  if (!declared.length && !implicit) return badConfig("kanonik alandan sınıf çözülemedi");
  const klass = declared.length ? declared[0] : implicit;
  if (!budget.classes.some((entry) => entry.id === klass))
    return caller("class-label-unknown", "sınıf etiketi kanonik sözlükte yok");
  const known = new Set([
    ...budget.bands.flatMap((band) => band.requires ?? []),
    ...(budget.churnGuard?.requires ?? []),
  ]);
  const evidence = tagged(names, EVIDENCE_PREFIX);
  return evidence.some((id) => !known.has(id))
    ? caller("evidence-label-unknown", "kanıt etiketi kanonik sözlükte yok")
    : { ok: true, base, head, klass, evidence };
};

/** Zarf minimaldir ve kapının raporunu DEĞİŞTİRMEDEN taşır; anahtar sırası sözleşmedir. */
// biome-ignore format: the machine-readable envelope contract stays compact for the shard budget
const envelope = ({ status, exitCode, error = null, check = null }) => ({
  schema: ADAPTER_SCHEMA, version: ADAPTER_VERSION, event: EVENT_NAME,
  status, exitCode, error, check,
});
const refuse = (error) =>
  envelope({ status: error.kind, exitCode: EXIT_CODE[error.kind] ?? EXIT_CODE[INTERNAL], error });
/** Sinyal ve fırlayan hata ADLANDIRILIR; sebep yalnız kod/ad olarak taşınır, mesaj yankılanmaz. */
export const internalEnvelope = (cause) =>
  refuse({ id: "adapter-internal-error", kind: INTERNAL, detail: `süreç durdu: ${cause}` });

/**
 * Tek deterministik geçiş: kanonik alan → olay → kapı. `ciEnforced` bir SEÇENEK olarak geçilir,
 * argv'den okunmaz: yerel/doğrudan çağıran onu üretemez ve kapı kendiliğinden CI iddia etmez.
 */
export const runAdapter = (env) => {
  const config = loadBudget();
  if (!config.ok) return refuse(config.error);
  const resolved = resolveInvocation(env, config.budget);
  if (!resolved.ok) return refuse(resolved.error);
  const { base, head, klass, evidence } = resolved;
  const argv = [`--base=${base}`, `--head=${head}`, `--class=${klass}`];
  if (evidence.length) argv.push(`--evidence=${evidence.join(",")}`);
  const check = runCheck(argv, { ciEnforced: true });
  return envelope({ status: check.status, exitCode: check.exitCode, check });
};

let emitted = false;
/** Rapor TAM ve TEK yazılır: `console.log` boruda asenkrondur ve raporu ortadan keserdi. */
const emit = (report) => {
  if (!emitted) {
    emitted = true;
    writeAllSync(1, `${JSON.stringify(report)}\n`);
  }
  process.exit(report.exitCode);
};
const main = () => {
  for (const signal of ["SIGHUP", "SIGINT", "SIGTERM"])
    process.on(signal, () => emit(internalEnvelope(signal)));
  try {
    emit(runAdapter(process.env));
  } catch (error) {
    emit(internalEnvelope(error?.code ?? error?.name ?? "unknown"));
  }
};

/** Yalnız DOĞRUDAN çağrıldığında koşar; içe aktarıldığında saf modül kalır. */
const invokedDirectly = () => {
  try {
    return fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
};
if (invokedDirectly()) main();
