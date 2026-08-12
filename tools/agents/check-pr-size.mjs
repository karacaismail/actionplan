#!/usr/bin/env node
/**
 * check-pr-size (ADR-0027 / short-code `short-pr-size`) — SÜREÇ yüzeyi (P2A-2c + P2B1b + P2B2b).
 *
 * ÖLÇÜM, KARAR ve TOPLAMA burada DEĞİLdir: `pr-size-core.mjs` teli okur,
 * `pr-size-decision.mjs` kanonik `changePackageBudget` alanından kararı üretir,
 * `pr-size-git-range.mjs` iki commit arasındaki teli, `pr-size-git-working-tree.mjs` ise HEAD'e
 * göre çalışma ağacının telini güvenle toplar. Burada yalnız SÜREÇ vardır — argv dilbilgisi, TEK
 * kaynak kuralı, fixture'ın güvenli okunması, kanonik alanın ve depo kökünün yüklenmesi, tek JSON
 * raporu ve çıkış kodu eşlemesi. Bu dosyada ikinci bir eşik/bant/sınıf/kanıt kopyası YOKTUR,
 * ikinci bir git argv mantığı KURULMAZ ve hiçbir alt süreç doğrudan çağrılmaz.
 *
 * KAPSAM DÜRÜST: kapı P3b'de bu deponun ZORUNLU `build` işine bağlandı ve gerçekten bloklar; süreç
 * yine stdin'e yaslanmaz. Raporun `inputMode`, `collectsGitRange`, `collectsWorkingTree` ve
 * `ciEnforced` alanları bunu makine-okunur biçimde söyler. İkisi ayrı cinstendir: toplama beyanı
 * provenansın VARLIĞIDIR, `ciEnforced` ise bu DEPODAKİ kurulum gerçeğidir — çağrı biçimine göre
 * değişmez ve tek bir koşunun bloklandığını değil, kapının bağlı olduğunu söyler.
 *
 * FAIL-CLOSED: bozuk argv, karışık/eksik girdi kaynağı, güvensiz/okunamayan/boş fixture,
 * toplanamayan aralık ya da ağaç, güvenilmez kanonik alan ve süreç-içi hata KARAR YERİNE
 * adlandırılmış bir rapor ve kendine ait bir çıkış kodu üretir. stdout HER yolda yalnız tam
 * JSON'dur; insan satırı stderr'e gider ve raporu kirletemez.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { READ_FAULT, readBoundedFile, writeAllSync } from "../lib/pr-size-core.mjs";
import { DECISION, ERROR_KIND, decide } from "../lib/pr-size-decision.mjs";
import { collectRange } from "../lib/pr-size-git-range.mjs";
import { collectWorkingTree } from "../lib/pr-size-git-working-tree.mjs";

export const CLI_SCHEMA = "pr-size-check/1";
/** CI'a bağlanma da GERİYE UYUMLUdur: alan/şema biçimi sabit, yalnız MINOR hane yükselir. */
export const CLI_VERSION = "1.3.0";
export const INPUT_MODE = "numstat-z-file";
export const RANGE_MODE = "git-range";
export const WORKING_TREE_MODE = "working-tree";
/** Süreç-içi hata sınıfı motorda YOKTUR: fırlayan hata ve sinyal bu yüzeyin sorumluluğudur. */
export const INTERNAL = "internal-error";
export const CANONICAL_STANDARD = "src/data/standards/short-code.json";
/**
 * UYGULAMA GÜVENLİK FRENİ — politika eşiği DEĞİLdir ve bütçeyle ilgisi yoktur. Yalnız süreçin
 * sınırsız bir dosyayı belleğe almasını engeller; bant/sınıf tavanları kanonik alanda yaşar.
 */
export const MAX_FIXTURE_BYTES = 4 * 1024 * 1024;
/**
 * UYGULAMA KAYNAK TAVANI — politika eşiği DEĞİLdir, bütçe bandı/sınıfı ile ilgisi YOKTUR ve bu
 * yüzden kanonik alana, karar raporuna ve zarf metadata'sına KOPYALANMAZ. Yalnız çalışma ağacı
 * toplamasının uçtan uca ne kadar sürebileceğini üstten kapatır; sabit MODÜL-ÖZELdir ve ihraç
 * EDİLMEZ, çünkü yüzeye çıkan her sayı ikinci bir sözleşme gibi okunur. Değerin kendisi değil,
 * "sınırlı bir bütçe geçiriliyor" davranışı sözleşmedir.
 */
const WORKING_TREE_TOTAL_TIMEOUT_MS = 30_000;

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
const BASE_FLAG = "--base";
const HEAD_FLAG = "--head";
const CLASS_FLAG = "--class";
const EVIDENCE_FLAG = "--evidence";
const TREE_FLAG = "--working-tree";
/** Ağaç kaynağı AÇIK bildirilir ve dilbilgisi DAR'dır: birebir bu değer dışında hiçbir şey geçmez. */
const TREE_ON = "true";
const KNOWN_FLAGS = Object.fromEntries(
  [INPUT_FLAG, BASE_FLAG, HEAD_FLAG, CLASS_FLAG, EVIDENCE_FLAG, TREE_FLAG].map((flag) => [
    flag,
    true,
  ]),
);
const CANONICAL_URL = new URL(`../../${CANONICAL_STANDARD}`, import.meta.url);
/**
 * Depo kökü ÇAĞIRANIN cwd'sinden DEĞİL, kanonik alanla aynı biçimde bu modülün KENDİ konumundan
 * çözülür: kapı nereden ve hangi takma adla çağrılırsa çağrılsın aynı depoyu ölçer, cwd raporu
 * değiştiremez. Yolun kendisi rapora hiç girmez; provenans yalnız toplayıcının çözdüğü commit'tir.
 */
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url)).replace(/\/+$/, "") || "/";
const fault = (id, kind, detail) => ({ ok: false, error: { id, kind, detail } });
const caller = (id, detail) => fault(id, ERROR_KIND.caller, detail);

/**
 * Dar dilbilgisi: yalnız `--ad=değer`. Çıplak bayrak, boş değer, tekrar, bilinmeyen bayrak ve
 * konumsal argüman REDdir. TANILAMAYA YALNIZ BAYRAK ADI yazılır: değer bir yol/sır taşıyabilir.
 * Bayrak adı `Object.hasOwn` ile aranır; `in` prototip zincirini de görüp uydurma bir bayrağı
 * geçirebilirdi. Kanıt kimliğinin kendisi (bilinmezlik/tekrar) kanonik sözlüğün işidir: motora
 * devredilir, burada ikinci kez tanımlanmaz.
 *
 * TEK KAYNAK KURALI: girdi ya deterministik fixture'dır, ya `--base`+`--head` aralığıdır, ya da
 * `--working-tree=true` ile bildirilen çalışma ağacıdır. Karışık (birden çok kaynak) ve EKSİK
 * (yalnız bir aralık ucu) çağrı sessiz bir varsayılana düşmez; hepsi kendi adıyla REDdir — aksi
 * halde çağıran ölçtüğünü sandığından başka bir şeyi ölçerdi. Ağaç bayrağı bir KAYNAK bildirimidir,
 * eksik bir aralık ucunu TAMAMLAMAZ.
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
  // Değer dilbilgisi token'ın KENDİ sözleşmesidir; `boş değer` gibi sınıf kapısından da öncedir.
  // Reddedilen değer YANKILANMAZ: çağıran oraya bir yol ya da sır yazmış olabilir.
  const tree = seen.has(TREE_FLAG);
  if (tree && seen.get(TREE_FLAG) !== TREE_ON)
    return caller("working-tree-value-invalid", `yalnız ${TREE_FLAG}=${TREE_ON} kabul edilir`);
  if (!seen.has(CLASS_FLAG)) return caller("flag-missing", `zorunlu bayrak yok: ${CLASS_FLAG}`);
  const ends = [BASE_FLAG, HEAD_FLAG].filter((flag) => seen.has(flag));
  const fixture = seen.has(INPUT_FLAG);
  const sources = [fixture, tree, ends.length > 0].filter(Boolean).length;
  if (sources > 1)
    return caller(
      "source-mixed",
      `tek kaynak: ${INPUT_FLAG} / ${BASE_FLAG}+${HEAD_FLAG} / ${TREE_FLAG}`,
    );
  if (sources === 0)
    return caller(
      "source-missing",
      `kaynak yok: ${INPUT_FLAG}, ${BASE_FLAG}+${HEAD_FLAG} ya da ${TREE_FLAG}`,
    );
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
 * Bayt kabulünün MEKANİĞİ burada değildir: bağ izlememe, düzenli dosya şartı, tavan, boş RED, tam
 * sınırlı okuma ve `fstat` tekrarı çekirdeğin paylaşılan primitifinin sözleşmesidir. Bu yüzey ona
 * yalnız KENDİ tavanını verir ve genel sonucu KENDİ kelime dağarcığına çevirir: kimlik, sınıf ve
 * tanılama cümlesi burada kalır, ikinci bir okuyucu KURULMAZ. Tanılama içerik TAŞIMAZ, yolu
 * yankılamaz; yalnız tavan aşımında ölçüyü açıklayan iki sayı görünür.
 */
// biome-ignore format: the fixture fault vocabulary stays compact for the shard budget
const FIXTURE_FAULT = Object.freeze({
  [READ_FAULT.notRegularFile]: () => ["fixture-not-regular-file", "fixture düzenli bir dosya değil"],
  [READ_FAULT.tooLarge]: (size) =>
    ["fixture-too-large", `fixture ${size} bayt > güvenlik tavanı ${MAX_FIXTURE_BYTES}`],
  [READ_FAULT.empty]: () => ["fixture-empty", "fixture boş: ölçülecek tel yok"],
  [READ_FAULT.unreadable]: () => ["fixture-unreadable", "fixture okunamadı"],
});
const readFixture = (file) => {
  const source = readBoundedFile(file, MAX_FIXTURE_BYTES);
  if (source.ok) return source;
  const [id, detail] = FIXTURE_FAULT[source.fault](source.size);
  return fault(id, ERROR_KIND.input, detail);
};

/** Fixture provenansı YOL DEĞİL, bayt sayısı + özettir; tel motora ham bayt olarak gider. */
const fixtureSource = (file) => {
  const source = readFixture(file);
  if (!source.ok) return source;
  const sha256 = crypto.createHash("sha256").update(source.bytes).digest("hex");
  return { ok: true, wire: source.bytes, fixture: { bytes: source.bytes.length, sha256 } };
};

/**
 * TOPLAMA burada DEĞİLdir: kabuk yasağı, sabit cwd, ortam allowlist'i, tek merge-base ve sızıntısız
 * hata sınıflandırması kabul edilmiş toplayıcının sözleşmesidir. Bu yüzey kökü KENDİ konumundan
 * verir, toplayıcının hatasını `range-` önekiyle ADLANDIRIR ve provenansı YALNIZ toplayıcının
 * çözdüğü commit'lerden kurar: çağıranın ref metni ve mutlak yol rapora hiç girmez.
 */
const rangeSource = ({ base, head }) => {
  const collected = collectRange({ repoRoot: REPO_ROOT, base, head });
  if (!collected.ok)
    return fault(`range-${collected.error.id}`, ERROR_KIND.input, collected.error.detail);
  const { base: from, head: to, mergeBase, byteLength, sha256 } = collected.metadata;
  const range = { base: from, head: to, mergeBase, bytes: byteLength, sha256 };
  return { ok: true, wire: collected.numstatZ, range };
};

/**
 * TOPLAMA yine burada DEĞİLdir: kabuk yasağı, sabit cwd, ortam allowlist'i, mutasyonsuzluk ve
 * sızıntısız hata sınıflandırması kabul edilmiş çalışma ağacı toplayıcısının sözleşmesidir; kapı
 * onu ÇAĞIRIR, kopyalamaz. Bu yüzey üç şey ekler: kökü ÇAĞIRANIN cwd'sinden değil KENDİ konumundan
 * verir, uçtan uca SINIRLI bir süre bütçesi geçirir ve toplayıcının hatasını TEK bir ad alanına
 * yerleştirir. Önek yalnız TAŞIMAYAN kimliğe eklenir: toplayıcı kimliğini kendi zaten
 * adlandırdıysa `working-tree-working-tree-` gibi ikilenmiş bir kimlik üretilmez. Ayrıntı
 * toplayıcının kendi genel cümlesidir; yol, ref, ham stderr, istisna, süre ve bütçe taşımaz.
 */
const workingTreeSource = () => {
  const collected = collectWorkingTree({
    repoRoot: REPO_ROOT,
    totalTimeoutMs: WORKING_TREE_TOTAL_TIMEOUT_MS,
  });
  if (!collected.ok) {
    const { id, detail } = collected.error;
    const named = id.startsWith(`${WORKING_TREE_MODE}-`) ? id : `${WORKING_TREE_MODE}-${id}`;
    return fault(named, ERROR_KIND.input, detail);
  }
  // Provenans MİNİMAL ve deterministiktir; toplayıcının başka her alanı zarfa GEÇMEZ.
  const { head, byteLength, sha256 } = collected.metadata;
  return { ok: true, wire: collected.numstatZ, workingTree: { head, bytes: byteLength, sha256 } };
};

/**
 * Zarf minimaldir ve saf karar raporunu DEĞİŞTİRMEDEN taşır; anahtar sırası sözleşmedir.
 * `collectsGitRange` ve `collectsWorkingTree` ayrı bir İDDİA değil, provenansın VARLIĞIDIR: kaynak
 * gerçekten toplanıp karara dönüşmediyse alan da beyan da yoktur, yani kapı ölçmediğini ölçtüm
 * diyemez. `ciEnforced` ise KURULUM gerçeğidir: bu depoda kapı zorunlu `build` işinden çağrılır,
 * bu yüzden sabittir — ölçümden, çağrandan ve kaynaktan türetilemez.
 */
// biome-ignore format: the machine-readable envelope contract stays compact for the shard budget
const envelope = ({ mode = null, status, fixture = null, range = null, workingTree = null,
  error = null, decisionReport = null }) => ({
  schema: CLI_SCHEMA, version: CLI_VERSION, inputMode: mode,
  canonicalStandard: CANONICAL_STANDARD, collectsGitRange: range !== null,
  collectsWorkingTree: workingTree !== null, ciEnforced: true,
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

/** Çözülen kaynak TEK bir toplayıcıya bağlanır; ikinci bir varsayılan dal YOKTUR. */
const SOURCE_OF = {
  [RANGE_MODE]: rangeSource,
  [WORKING_TREE_MODE]: workingTreeSource,
  [INPUT_MODE]: (parsed) => fixtureSource(parsed.input),
};

/**
 * Tek deterministik geçiş: argv → kanonik alan → tek kaynak (fixture, aralık ya da çalışma ağacı)
 * → saf karar → zarf. `inputMode` çözülen kaynağı SÖYLER; argv daha okunamadıysa hiçbir mod İDDİA
 * EDİLMEZ. Toplama provenansı yalnız karar üretilen yolda taşınır: hata yolunda beyan yoktur.
 * Toplanan tel motora DEĞİŞTİRİLMEDEN gider — aynı bayt/sınıf/kanıt her kaynakta aynı kararı verir.
 */
export const runCheck = (argv) => {
  const parsed = parseArgv(argv);
  if (!parsed.ok) return envelope({ status: parsed.error.kind, error: parsed.error });
  const { source: mode, klass, evidence } = parsed;
  const config = loadBudget();
  if (!config.ok) return envelope({ mode, status: config.error.kind, error: config.error });
  const source = SOURCE_OF[mode](parsed);
  if (!source.ok) return envelope({ mode, status: source.error.kind, error: source.error });
  const report = decide({ budget: config.budget, numstatZ: source.wire, klass, evidence });
  return envelope({
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
