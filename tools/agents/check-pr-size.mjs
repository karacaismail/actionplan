#!/usr/bin/env node
/**
 * check-pr-size (ADR-0027 / short-code `short-pr-size`) — change-package SÜREÇ yüzeyi (P2A-2c).
 *
 * ÖLÇÜM ve KARAR burada DEĞİLdir: `pr-size-core.mjs` teli okur, `pr-size-decision.mjs` kanonik
 * `changePackageBudget` alanından kararı üretir. Burada yalnız SÜREÇ vardır — argv dilbilgisi,
 * fixture'ın güvenli okunması, kanonik alanın yüklenmesi, tek JSON raporu ve çıkış kodu eşlemesi.
 * Bu dosyada ikinci bir eşik/bant/sınıf/kanıt kopyası YOKTUR; hepsi kanonik alandan gelir.
 *
 * KAPSAM DÜRÜST: gerçek aralık/çalışma-ağacı toplama P2B'nin, CI'a bağlanma P3'ün işidir. Bu yüzey
 * yalnız deterministik `--numstat-z-input` dosyasını kabul eder, hiçbir alt süreç/kabuk çağırmaz,
 * stdin'e yaslanmaz ve hiçbir kapıyı bloklamaz; raporun `collectsGitRange`/`ciEnforced` alanları
 * bunu makine-okunur biçimde söyler.
 *
 * FAIL-CLOSED: bozuk argv, güvensiz/okunamayan/boş fixture, güvenilmez kanonik alan ve süreç-içi
 * hata KARAR YERİNE adlandırılmış bir rapor ve kendine ait bir çıkış kodu üretir. stdout HER yolda
 * yalnız tam JSON'dur; insan satırı stderr'e gider ve raporu kirletemez.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { writeAllSync } from "../lib/pr-size-core.mjs";
import { DECISION, ERROR_KIND, decide } from "../lib/pr-size-decision.mjs";

export const CLI_SCHEMA = "pr-size-check/1";
export const CLI_VERSION = "1.0.0";
export const INPUT_MODE = "numstat-z-file";
/** Süreç-içi hata sınıfı motorda YOKTUR: fırlayan hata ve sinyal bu yüzeyin sorumluluğudur. */
export const INTERNAL = "internal-error";
export const CANONICAL_STANDARD = "src/data/standards/short-code.json";
/**
 * UYGULAMA GÜVENLİK FRENİ — politika eşiği DEĞİLdir ve bütçeyle ilgisi yoktur. Yalnız süreçin
 * sınırsız bir dosyayı belleğe almasını engeller; bant/sınıf tavanları kanonik alanda yaşar.
 */
export const MAX_FIXTURE_BYTES = 4 * 1024 * 1024;

/** Kararlı çıkış eşlemesi: sözlük motorun kararı/hata sınıfından türer, ikinci kez adlandırılmaz. */
export const EXIT_CODE = Object.freeze({
  [DECISION.accepted]: 0,
  [DECISION.rejected]: 1,
  [DECISION.split]: 2,
  [ERROR_KIND.caller]: 64,
  [ERROR_KIND.input]: 65,
  [INTERNAL]: 70,
  [ERROR_KIND.config]: 78,
});

const INPUT_FLAG = "--numstat-z-input";
const CLASS_FLAG = "--class";
const EVIDENCE_FLAG = "--evidence";
const KNOWN_FLAGS = { [INPUT_FLAG]: true, [CLASS_FLAG]: true, [EVIDENCE_FLAG]: true };
const CANONICAL_URL = new URL(`../../${CANONICAL_STANDARD}`, import.meta.url);
const fault = (id, kind, detail) => ({ ok: false, error: { id, kind, detail } });
const caller = (id, detail) => fault(id, ERROR_KIND.caller, detail);

/**
 * Dar dilbilgisi: yalnız `--ad=değer`. Çıplak bayrak, boş değer, tekrar, bilinmeyen bayrak ve
 * konumsal argüman REDdir. TANILAMAYA YALNIZ BAYRAK ADI yazılır: değer bir yol/sır taşıyabilir.
 * Bayrak adı `Object.hasOwn` ile aranır; `in` prototip zincirini de görüp uydurma bir bayrağı
 * geçirebilirdi. Kanıt kimliğinin kendisi (bilinmezlik/tekrar) kanonik sözlüğün işidir: motora
 * devredilir, burada ikinci kez tanımlanmaz.
 */
export const parseArgv = (argv) => {
  const seen = new Map();
  for (const token of argv) {
    if (!token.startsWith("--"))
      return caller("positional-argument", "konumsal argüman kabul edilmez");
    const split = token.indexOf("=");
    const name = split === -1 ? token : token.slice(0, split);
    if (!Object.hasOwn(KNOWN_FLAGS, name))
      return caller("flag-unknown", `bilinmeyen bayrak: ${name}`);
    if (split === -1) return caller("flag-missing-value", `değer verilmedi: ${name}`);
    if (seen.has(name)) return caller("flag-duplicate", `bayrak tekrarlı: ${name}`);
    const value = token.slice(split + 1);
    if (value === "") return caller("flag-empty-value", `boş değer: ${name}`);
    seen.set(name, value);
  }
  const missing = [INPUT_FLAG, CLASS_FLAG].filter((flag) => !seen.has(flag));
  if (missing.length) return caller("flag-missing", `zorunlu bayrak yok: ${missing.join(", ")}`);
  const raw = seen.get(EVIDENCE_FLAG);
  const evidence = raw === undefined ? [] : raw.split(",");
  if (evidence.some((id) => id === ""))
    return caller("evidence-empty-item", "kanıt listesinde boş kimlik var");
  return { ok: true, input: seen.get(INPUT_FLAG), klass: seen.get(CLASS_FLAG), evidence };
};

/**
 * Kanonik alan cwd'den DEĞİL, bu modülün kendi konumundan çözülür: kapı nereden çağrılırsa
 * çağrılsın aynı sözleşmeyi okur. Yapısal sapmayı motor kendi hata kimliğiyle adlandırır.
 */
const loadBudget = () => {
  const config = (id, detail) => fault(id, ERROR_KIND.config, detail);
  let text;
  try {
    text = fs.readFileSync(CANONICAL_URL, "utf8");
  } catch {
    return config("canonical-unreadable", "kanonik standart okunamadı");
  }
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    return config("canonical-not-json", "kanonik standart geçerli JSON değil");
  }
  const budget = doc?.changePackageBudget;
  if (!budget || typeof budget !== "object")
    return config("canonical-budget-missing", "changePackageBudget alanı yok");
  return { ok: true, budget };
};

/**
 * Fixture FAIL-CLOSED okunur. `lstat` bağı İZLEMEZ: sembolik bağ, dizin, aygıt ve FIFO daha okuma
 * denenmeden REDdir. Tip/boyut kontrolü açılan tanıtıcı üzerinde `fstat` ile TEKRARLANIR; aradaki
 * pencerede yol değiştirilirse ölçüm yine yapılmaz. Bayt dizisi olarak okunur — katı UTF-8 kapısı
 * motorun sözleşmesidir. Tanılama içerik TAŞIMAZ ve yolu yankılamaz.
 */
const readFixture = (file) => {
  const bad = (id, detail) => fault(id, ERROR_KIND.input, detail);
  const unreadable = () => bad("fixture-unreadable", "fixture okunamadı");
  const shaped = (stat) => {
    if (!stat.isFile()) return bad("fixture-not-regular-file", "fixture düzenli bir dosya değil");
    if (stat.size > MAX_FIXTURE_BYTES)
      return bad(
        "fixture-too-large",
        `fixture ${stat.size} bayt > güvenlik tavanı ${MAX_FIXTURE_BYTES}`,
      );
    return null;
  };
  let opened;
  try {
    const denied = shaped(fs.lstatSync(file));
    if (denied) return denied;
    opened = fs.openSync(file, "r");
  } catch {
    return unreadable();
  }
  try {
    const stat = fs.fstatSync(opened);
    const denied = shaped(stat);
    if (denied) return denied;
    if (stat.size === 0) return bad("fixture-empty", "fixture boş: ölçülecek tel yok");
    const bytes = Buffer.alloc(stat.size);
    let read = 0;
    while (read < bytes.length) {
      const chunk = fs.readSync(opened, bytes, read, bytes.length - read, read);
      if (chunk === 0) return unreadable();
      read += chunk;
    }
    return { ok: true, bytes };
  } catch {
    return unreadable();
  } finally {
    try {
      fs.closeSync(opened);
    } catch {
      /* kapatma hatası raporu değiştirmez */
    }
  }
};

/** Zarf minimaldir ve saf karar raporunu DEĞİŞTİRMEDEN taşır; anahtar sırası sözleşmedir. */
const envelope = ({ status, fixture = null, error = null, decisionReport = null }) => ({
  schema: CLI_SCHEMA,
  version: CLI_VERSION,
  inputMode: INPUT_MODE,
  canonicalStandard: CANONICAL_STANDARD,
  collectsGitRange: false,
  ciEnforced: false,
  status,
  exitCode: EXIT_CODE[status] ?? EXIT_CODE[INTERNAL],
  fixture,
  error,
  decisionReport,
});

/** Sinyal ve fırlayan hata ADLANDIRILIR; sebep yalnız kod/ad olarak taşınır, mesaj yankılanmaz. */
export const internalEnvelope = (cause) =>
  envelope({
    status: INTERNAL,
    error: {
      id: "process-internal-error",
      kind: INTERNAL,
      detail: `süreç adlandırılmış nedenle durdu: ${cause}`,
    },
  });

/** Tek deterministik geçiş: argv → kanonik alan → fixture → saf karar → zarf. */
export const runCheck = (argv) => {
  const parsed = parseArgv(argv);
  if (!parsed.ok) return envelope({ status: parsed.error.kind, error: parsed.error });
  const config = loadBudget();
  if (!config.ok) return envelope({ status: config.error.kind, error: config.error });
  const source = readFixture(parsed.input);
  if (!source.ok) return envelope({ status: source.error.kind, error: source.error });
  const fixture = {
    bytes: source.bytes.length,
    sha256: crypto.createHash("sha256").update(source.bytes).digest("hex"),
  };
  const report = decide({
    budget: config.budget,
    numstatZ: source.bytes,
    klass: parsed.klass,
    evidence: parsed.evidence,
  });
  return envelope({
    status: report.ok ? report.decision : report.error.kind,
    fixture,
    error: report.ok ? null : { ...report.error },
    decisionReport: report,
  });
};

let emitted = false;
/** Rapor TAM ve TEK yazılır: `console.log` boruda asenkrondur ve büyük raporu ortadan keserdi. */
const emit = (report) => {
  if (!emitted) {
    emitted = true;
    writeAllSync(1, `${JSON.stringify(report)}\n`);
    try {
      writeAllSync(2, `pr-size: ${report.status} (exit ${report.exitCode})\n`);
    } catch {
      /* insan satırı raporu asla bozamaz */
    }
  }
  process.exit(report.exitCode);
};

const main = () => {
  for (const signal of ["SIGHUP", "SIGINT", "SIGTERM"])
    process.on(signal, () => emit(internalEnvelope(signal)));
  try {
    emit(runCheck(process.argv.slice(2)));
  } catch (error) {
    emit(internalEnvelope(error?.code ?? error?.name ?? "unknown"));
  }
};

/**
 * Yalnız DOĞRUDAN çağrıldığında koşar; içe aktarıldığında saf bir modül kalır. Karşılaştırma
 * GERÇEK yol üzerindedir: ESM yükleyicisi modülü realpath'e çözer, argv ise sembolik bağlı bir
 * yol taşıyabilir (macOS `/var` → `/private/var`) ve düz URL karşılaştırması sessizce hiç
 * çalışmayan bir kapı üretirdi.
 */
const invokedDirectly = () => {
  try {
    return fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
};
if (invokedDirectly()) main();
