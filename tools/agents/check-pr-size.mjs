#!/usr/bin/env node
/**
 * check-pr-size (ADR-0027 / short-code `short-pr-size`) — SÜREÇ yüzeyi (P2A-2c + P2B1b + P2B2b).
 * ÖLÇÜM/KARAR/TOPLAMA burada DEĞİLdir; onları içe aktarılan saf motorlar ve kabul edilmiş
 * toplayıcılar üstlenir. Burada yalnız SÜREÇ vardır: argv dilbilgisi, TEK kaynak kuralı, fixture'ın
 * güvenli okunması, kanonik alanın ve depo kökünün yüklenmesi, tek JSON raporu ve çıkış kodu
 * eşlemesi. İkinci eşik/bant/sınıf/kanıt kopyası, ikinci git argv'si ve alt süreç YOKTUR. Üç
 * kaynak da ölçülür; kapı stdin'e yaslanmaz ve KENDİLİĞİNDEN CI zorlaması İDDİA ETMEZ:
 * `ciEnforced` ÇAĞRIYA ÖZGÜdür, argv'den DEĞİL yalnız `runCheck` bağlamından gelir ve doğrudan
 * kabuk çağrısı onu üretemez. FAIL-CLOSED: bozuk argv, karışık veya eksik kaynak,
 * güvensiz/okunamayan/boş fixture, toplanamayan aralık/ağaç, güvenilmez kanonik alan ve süreç-içi
 * hata KARAR YERİNE adlandırılmış rapor + çıkış kodu üretir; stdout tam JSON, insan satırı stderr.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { writeAllSync } from "../lib/pr-size-core.mjs";
import { DECISION, ERROR_KIND, decide } from "../lib/pr-size-decision.mjs";
import { collectRange } from "../lib/pr-size-git-range.mjs";
import { SOURCE as TREE_SOURCE, collectWorkingTree } from "../lib/pr-size-git-working-tree.mjs";

export const CLI_SCHEMA = "pr-size-check/1";
export const CLI_VERSION = "1.3.0";
export const INPUT_MODE = "numstat-z-file";
export const RANGE_MODE = "git-range";
/** Kaynağın ADI ikinci kez tanımlanmaz: kabul edilmiş toplayıcının kendi sabitinden türer. */
export const WORKING_TREE_MODE = TREE_SOURCE;
/** Süreç-içi hata sınıfı motorda YOKTUR: fırlayan hata ve sinyal bu yüzeyin sorumluluğudur. */
export const INTERNAL = "internal-error";
export const CANONICAL_STANDARD = "src/data/standards/short-code.json";
/** UYGULAMA GÜVENLİK FRENİ, politika eşiği DEĞİL: sınırsız dosyayı belleğe almayı önler.
 *  Bant/sınıf tavanları yalnız kanonik alanda yaşar. */
export const MAX_FIXTURE_BYTES = 4 * 1024 * 1024;
/** UYGULAMA KAYNAK FRENİ (çalışma ağacı toplamasının uçtan uca tavanı), politika eşiği DEĞİL:
 *  İHRAÇ EDİLMEZ, kanonik alanda yaşamaz, sayısı ne rapora ne tanılamaya girer; yalnız kapının
 *  süresiz asılı kalmasını önler. */
const TOTAL_DEADLINE_MS = 30_000;

/** Kararlı çıkış eşlemesi: sözlük motorun kararı/hata sınıfından türer, ikinci kez adlandırılmaz. */
// biome-ignore format: the exit-code map stays a single readable table
export const EXIT_CODE = Object.freeze({
  [DECISION.accepted]: 0, [DECISION.rejected]: 1, [DECISION.split]: 2,
  [ERROR_KIND.caller]: 64, [ERROR_KIND.input]: 65, [INTERNAL]: 70, [ERROR_KIND.config]: 78,
});

const INPUT_FLAG = "--numstat-z-input";
const BASE_FLAG = "--base";
const HEAD_FLAG = "--head";
const TREE_FLAG = "--working-tree";
const CLASS_FLAG = "--class";
const EVIDENCE_FLAG = "--evidence";
/** Çalışma ağacı bir AÇMA anahtarıdır: tek kabul edilen belirteç dışında her değer REDdir. */
const TREE_ON = "true";
const KNOWN_FLAGS = Object.fromEntries(
  [INPUT_FLAG, BASE_FLAG, HEAD_FLAG, TREE_FLAG, CLASS_FLAG, EVIDENCE_FLAG].map((f) => [f, true]),
);
const CANONICAL_URL = new URL(`../../${CANONICAL_STANDARD}`, import.meta.url);
/** Depo kökü ÇAĞIRANIN cwd'sinden DEĞİL, kanonik alanla aynı biçimde bu modülün KENDİ konumundan
 *  çözülür: kapı nereden çağrılırsa çağrılsın aynı depoyu ölçer. Yol rapora hiç girmez; provenans
 *  yalnız toplayıcının çözdüğü commit'tir. */
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url)).replace(/\/+$/, "") || "/";
const fault = (id, kind, detail) => ({ ok: false, error: { id, kind, detail } });
const caller = (id, detail) => fault(id, ERROR_KIND.caller, detail);

/**
 * Dar dilbilgisi: yalnız `--ad=değer`. Çıplak bayrak, boş değer, tekrar, bilinmeyen bayrak ve
 * konumsal argüman REDdir; TANILAMAYA YALNIZ BAYRAK ADI yazılır, çünkü değer yol/sır taşıyabilir.
 * Bayrak adı `Object.hasOwn` ile aranır: `in` prototip zincirini de görüp uydurma bir bayrağı
 * geçirebilirdi. Kanıt kimliği (bilinmezlik/tekrar) kanonik sözlüğün işidir, motora devredilir.
 * TEK KAYNAK KURALI: fixture, `--base`+`--head` aralığı ve çalışma ağacı ÜÇÜ BİRBİRİNİ DIŞLAR;
 * karışık, eksik (tek uç) ve hiç verilmemiş çağrı sessiz varsayılana düşmeden kendi adıyla REDdir —
 * aksi halde çağıran ölçtüğünü sandığından başkasını ölçerdi. Geçersiz açma değeri de kendi adıyla
 * durur ve DEĞER YANKILANMAZ.
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
  if (!seen.has(CLASS_FLAG)) return caller("flag-missing", `zorunlu bayrak yok: ${CLASS_FLAG}`);
  const tree = seen.has(TREE_FLAG);
  if (tree && seen.get(TREE_FLAG) !== TREE_ON)
    return caller("working-tree-value-invalid", `yalnız ${TREE_FLAG}=${TREE_ON} kabul edilir`);
  const ends = [BASE_FLAG, HEAD_FLAG].filter((flag) => seen.has(flag));
  const fixture = seen.has(INPUT_FLAG);
  const chosen = [fixture, tree, ends.length > 0].filter(Boolean).length;
  const names = `${INPUT_FLAG} | ${TREE_FLAG} | ${BASE_FLAG}+${HEAD_FLAG}`;
  if (chosen > 1) return caller("source-mixed", `tek kaynak seçilir: ${names}`);
  if (chosen === 0) return caller("source-missing", `kaynak yok: ${names}`);
  if (ends.length === 1)
    return caller("source-incomplete", `aralık eksik: ${BASE_FLAG} ve ${HEAD_FLAG} birlikte`);
  const raw = seen.get(EVIDENCE_FLAG);
  const evidence = raw === undefined ? [] : raw.split(",");
  if (evidence.some((id) => id === ""))
    return caller("evidence-empty-item", "kanıt listesinde boş kimlik var");
  // biome-ignore format: the resolved-source record stays compact for the shard budget
  return { ok: true, source: fixture ? INPUT_MODE : tree ? WORKING_TREE_MODE : RANGE_MODE,
    input: seen.get(INPUT_FLAG), base: seen.get(BASE_FLAG), head: seen.get(HEAD_FLAG),
    klass: seen.get(CLASS_FLAG), evidence };
};

/** Kanonik alan cwd'den DEĞİL, modülün kendi konumundan çözülür: kapı nereden çağrılırsa çağrılsın
 *  aynı sözleşmeyi okur. Yapısal sapmayı motor kendi hata kimliğiyle adlandırır. */
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

/** Fixture FAIL-CLOSED okunur. `lstat` bağı İZLEMEZ: sembolik bağ, dizin, aygıt ve FIFO okuma
 *  denenmeden REDdir; tip/boyut açılan tanıtıcıda `fstat` ile TEKRAR bakılır, yani aradaki
 *  pencerede yol değişirse ölçüm yapılmaz. Ham bayt okunur (katı UTF-8 motorun kapısıdır);
 *  tanılama içerik TAŞIMAZ ve yolu yankılamaz. */
const readFixture = (file) => {
  const bad = (id, detail) => fault(id, ERROR_KIND.input, detail);
  const unreadable = () => bad("fixture-unreadable", "fixture okunamadı");
  const shaped = (stat) => {
    if (!stat.isFile()) return bad("fixture-not-regular-file", "fixture düzenli bir dosya değil");
    if (stat.size > MAX_FIXTURE_BYTES)
      return bad("fixture-too-large", `fixture ${stat.size} bayt > tavan ${MAX_FIXTURE_BYTES}`);
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

/** Fixture provenansı YOL DEĞİL, bayt sayısı + özettir; tel motora ham bayt olarak gider. */
const fixtureSource = (file) => {
  const source = readFixture(file);
  if (!source.ok) return source;
  const sha256 = crypto.createHash("sha256").update(source.bytes).digest("hex");
  return { ok: true, wire: source.bytes, fixture: { bytes: source.bytes.length, sha256 } };
};

/** TOPLAMA burada DEĞİLdir: kabuk yasağı, sabit cwd, ortam allowlist'i, tek merge-base ve
 *  sızıntısız hata sınıflandırması kabul edilmiş toplayıcınındır. Bu yüzey kökü KENDİ konumundan
 *  verir, hatayı `range-` önekiyle ADLANDIRIR ve provenansı YALNIZ toplayıcının çözdüğü
 *  commit'lerden kurar: çağıranın ref metni ve mutlak yol rapora hiç girmez. */
const rangeSource = ({ base, head }) => {
  const collected = collectRange({ repoRoot: REPO_ROOT, base, head });
  if (!collected.ok)
    return fault(`range-${collected.error.id}`, ERROR_KIND.input, collected.error.detail);
  const { base: from, head: to, mergeBase, byteLength, sha256 } = collected.metadata;
  const range = { base: from, head: to, mergeBase, bytes: byteLength, sha256 };
  return { ok: true, wire: collected.numstatZ, range };
};

/** Süre bütçesi kimlikleri ZATEN bu ad alanında doğar (`working-tree-deadline-exceeded` gibi); kör
 *  önek kimliği ÇİFTLER ve çağıran tanıyamaz. Önek bu yüzden tam BİR kez uygulanır. */
const treeId = (id) => (id.startsWith(`${WORKING_TREE_MODE}-`) ? id : `${WORKING_TREE_MODE}-${id}`);

/** ÇALIŞMA AĞACI da burada TOPLANMAZ: git argv'si, kabuk yasağı, izlenmeyen dosya sınırı, süre ve
 *  çerçeve güvenliği kabul edilmiş toplayıcınındır. Bu yüzey yalnız kökü KENDİ konumundan ve
 *  SONLU-POZİTİF özel süre bütçesini verir, hatayı ad alanında ADLANDIRIR, provenansı toplayıcının
 *  çözdüğü HEAD'den kurar; toplayıcının EK alanları rapora GEÇMEZ. */
const treeSource = () => {
  const collected = collectWorkingTree({ repoRoot: REPO_ROOT, totalTimeoutMs: TOTAL_DEADLINE_MS });
  if (!collected.ok)
    return fault(treeId(collected.error.id), ERROR_KIND.input, collected.error.detail);
  const { head, byteLength, sha256 } = collected.metadata;
  return { ok: true, wire: collected.numstatZ, workingTree: { head, bytes: byteLength, sha256 } };
};

/** Zarf minimaldir, saf karar raporunu DEĞİŞTİRMEDEN taşır ve anahtar sırası sözleşmedir.
 *  `collectsGitRange`/`collectsWorkingTree`/`ciEnforced` İDDİA değil provenansın ve ÇAĞRININ
 *  gerçeğidir; varsayılanları yanlıştır. Süre bütçesinin sayısı hiçbir alanda geçmez. */
// biome-ignore format: the machine-readable envelope contract stays compact for the shard budget
const envelope = ({ mode = null, status, fixture = null, range = null, workingTree = null,
  error = null, decisionReport = null, ciEnforced = false }) => ({
  schema: CLI_SCHEMA, version: CLI_VERSION, inputMode: mode,
  canonicalStandard: CANONICAL_STANDARD, collectsGitRange: range !== null,
  collectsWorkingTree: workingTree !== null, ciEnforced,
  status, exitCode: EXIT_CODE[status] ?? EXIT_CODE[INTERNAL],
  fixture, range, workingTree, error, decisionReport,
});

/** Sinyal ve fırlayan hata ADLANDIRILIR; sebep yalnız kod/ad olarak taşınır, mesaj yankılanmaz. */
export const internalEnvelope = (cause) => {
  const detail = `süreç adlandırılmış nedenle durdu: ${cause}`;
  return envelope({
    status: INTERNAL,
    error: { id: "process-internal-error", kind: INTERNAL, detail },
  });
};

/** Tek deterministik geçiş: argv → kanonik alan → tek kaynak (fixture/aralık/çalışma ağacı) → saf
 *  karar → zarf. `inputMode` çözülen kaynağı SÖYLER, argv okunamadıysa hiçbir mod İDDİA EDİLMEZ ve
 *  toplama provenansı yalnız karar üretilen yolda taşınır. */
const SOURCES = { [RANGE_MODE]: rangeSource, [WORKING_TREE_MODE]: treeSource };
export const runCheck = (argv, context = {}) => {
  /** Bağlam ÇAĞIRANIN kimliğidir, argv'nin değil: yalnız birebir `true` CI zorlaması sayılır. */
  const wrap = (fields) => envelope({ ...fields, ciEnforced: context?.ciEnforced === true });
  const parsed = parseArgv(argv);
  if (!parsed.ok) return wrap({ status: parsed.error.kind, error: parsed.error });
  const { source: mode, klass, evidence } = parsed;
  const config = loadBudget();
  if (!config.ok) return wrap({ mode, status: config.error.kind, error: config.error });
  const collect = SOURCES[mode];
  const source = collect ? collect(parsed) : fixtureSource(parsed.input);
  if (!source.ok) return wrap({ mode, status: source.error.kind, error: source.error });
  const report = decide({ budget: config.budget, numstatZ: source.wire, klass, evidence });
  return wrap({
    mode,
    status: report.ok ? report.decision : report.error.kind,
    fixture: source.fixture,
    range: report.ok ? source.range : null,
    workingTree: report.ok ? source.workingTree : null,
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

/** Yalnız DOĞRUDAN çağrıldığında koşar; içe aktarıldığında saf modül kalır. Karşılaştırma GERÇEK
 *  yoldadır: ESM yükleyicisi realpath'e çözer, argv ise sembolik bağ taşıyabilir (macOS `/var` →
 *  `/private/var`) ve düz URL karşılaştırması hiç çalışmayan bir kapı üretirdi. */
const invokedDirectly = () => {
  try {
    return fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
};
if (invokedDirectly()) main();
