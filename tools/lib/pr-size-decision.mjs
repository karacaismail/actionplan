/**
 * pr-size-decision (ADR-0027 / short-code `short-pr-size`) — change-package KARAR motoru (P2A-2b).
 *
 * ÖLÇÜM burada DEĞİLdir: `pr-size-core.mjs` saf çekirdeği teli okur, yol yazılışını doğrular ve
 * muhasebeyi kapatır. Burada yalnız KARAR vardır ve kararın HER sayısı ile HER kuralı (bant
 * kalıtım bayrağı dâhil) çağıranın verdiği kanonik `changePackageBudget` alanından okunur; bu
 * dosyada ikinci bir eşik/bant/kural kopyası YOKTUR — eşik ya da bayrak kayarsa karar da kayar,
 * motor kanonik alanı izler, ezberlemez.
 *
 * SÜREÇ DEĞİLDİR: argv, dosya/fixture okuma, stdout ve çıkış kodu burada YOKTUR (P2A-2c),
 * gerçek Git aralığı toplanmaz (P2B) ve hiçbir CI adımına bağlı DEĞİLdir (P3). Motor tek bir saf
 * fonksiyondur; hata SINIFINI adlandırır, çıkış kodunu ise onu saran süreç yüzeyi eşler.
 *
 * DÜRÜSTLÜK: ölçemediğini ölçtüm demez. Bozuk çerçeve, güvensiz yol, ölçülemeyen ikili satır,
 * bozuk kategori sözleşmesi ve kanonik sapma; karar YERİNE adlandırılmış hata döndürür ve
 * `measurement` alanı hiç oluşmaz — kısmi ölçüm bir bant kararına dönüşemez.
 *
 * SINIF TAVANI: bandın YERİNE geçmez. Merdiven her sınıf için aynı eşiklerle işler; sınıf yalnız
 * paketin normal tavanını sınıflandırır. Tavan aşımı ayrı bulgu olarak RAPORLANIR, kararı bandın
 * kanıt kümesi verir — aksi halde geniş tavanlı sınıf, bandın kanıtını atlamanın yolu olurdu.
 */
import { inCategory, measure } from "./pr-size-core.mjs";

export const REPORT_SCHEMA = "pr-size-decision/1";
export const DECISION = { accepted: "ACCEPTED", rejected: "REJECTED", split: "SPLIT_REQUIRED" };
/** Hata SINIFI sözleşmedir; çıkış kodu eşlemesi süreç yüzeyinin (P2A-2c) işidir. */
export const ERROR_KIND = {
  caller: "caller-input",
  input: "measurement-input",
  config: "canonical-config",
};

const uniq = (list) => [...new Set(list)];
const dup = (list) => uniq(list).length !== list.length;
const sorted = (list) => [...list].sort();
const quote = (value) => JSON.stringify(String(value));
const idList = (l) => Array.isArray(l) && l.every((id) => typeof id === "string" && id !== "");
const refuse = (id, kind, detail) => ({
  schema: REPORT_SCHEMA,
  ok: false,
  decision: null,
  error: { id, kind, detail },
});

const utf8 = new TextDecoder("utf-8", { fatal: true });
/**
 * SINIR TİP KAPISI: çekirdek `String(text)` çağırır, yani bir nesne "[object Object]" olarak
 * ÖLÇÜLÜRDÜ ve bozuk bir bayt dizisi yolu sessizce değiştirirdi. Yalnız gerçek string ve katı
 * UTF-8 çözülen Buffer geçer; gerisi ölçülmez.
 */
export const asNumstatZ = (value) => {
  if (typeof value === "string") return value;
  if (!Buffer.isBuffer(value)) return null;
  try {
    return utf8.decode(value);
  } catch {
    return null;
  }
};

/**
 * Kanonik sapma denetimi. Motor eşiği ezberlemediği için config'in KENDİSİ tutarlı olmak
 * zorundadır: merdiven artmıyorsa, split eşiği en üst tavan değilse, sınıf tavanı merdivenden
 * TÜREMİYORsa ya da churn freni olmayan bir banda işaret ediyorsa karar üretmek yanlış bir
 * güvence olurdu. Kategori sözleşmesini çekirdek ayrıca kendi hata kimliğiyle doğrular.
 */
export const validateBudget = (budget) => {
  const errors = [];
  const bands = Array.isArray(budget?.bands) ? budget.bands : [];
  const classes = Array.isArray(budget?.classes) ? budget.classes : [];
  const guard = budget?.churnGuard;
  const top = bands[bands.length - 1];
  const bandNamed = (id) => bands.find((band) => band?.id === id);
  if (!bands.length) errors.push("bant merdiveni yok");
  let previous = null;
  for (const band of bands) {
    const shaped =
      typeof band?.id === "string" &&
      band.id !== "" &&
      Number.isSafeInteger(band?.maxNet) &&
      band.maxNet >= 0 &&
      typeof band?.includesLowerBandRequirements === "boolean" &&
      idList(band?.requires);
    if (!shaped) errors.push(`bant tanımı geçersiz: ${quote(band?.id)}`);
    else {
      if (dup(band.requires)) errors.push(`${band.id}: kanıt kimliği tekrarlı`);
      if (previous !== null && band.maxNet <= previous)
        errors.push(`${band.id}: merdiven artmıyor`);
      previous = band.maxNet;
    }
  }
  if (dup(bands.map((band) => band?.id))) errors.push("bant kimliği tekrarlı");
  if (!top || budget?.splitRequiredAboveNet !== top.maxNet)
    errors.push("split eşiği en üst bant tavanı değil");
  if (!Number.isSafeInteger(budget?.maxChangedFiles) || budget.maxChangedFiles <= 0)
    errors.push("dosya sayısı tavanı geçersiz");
  const ceilings = new Set(bands.map((band) => band?.maxNet));
  if (!classes.length) errors.push("sınıf listesi yok");
  for (const entry of classes)
    if (typeof entry?.id !== "string" || entry.id === "") errors.push("sınıf kimliği geçersiz");
    else if (!ceilings.has(entry?.maxNet))
      errors.push(`${entry.id}: sınıf tavanı bant merdiveninden türemiyor`);
  if (dup(classes.map((entry) => entry?.id))) errors.push("sınıf kimliği tekrarlı");
  if (!Number.isSafeInteger(guard?.netCreditFloor) || guard.netCreditFloor < 0)
    errors.push("churn tabanı silmeye kredi yazıyor");
  // Taban en üst tavanı aşarsa HER paket taban yüzünden split'e düşerdi: ölçüm değil, config kusuru.
  else if (top?.maxNet >= 0 && guard.netCreditFloor > top.maxNet)
    errors.push("churn tabanı en üst bant tavanını aşıyor");
  if (!bandNamed(guard?.grossMaxFromBand)) errors.push("brüt tavan banttan türemiyor");
  if (!bandNamed(guard?.appliesWhenNetAtOrBelowBand)) errors.push("churn kapsam bandı çözülemiyor");
  if (!Array.isArray(guard?.requires) || !guard.requires.length)
    errors.push("churn kanıt listesi yok");
  else if (!idList(guard.requires) || dup(guard.requires))
    errors.push("churn kanıt kimliği geçersiz veya tekrarlı");
  return errors;
};

/** Kabul edilen kanıt sözlüğü de kanoniktir: bant koşulları + churn freninin istediği kanıtlar. */
const vocabulary = (budget) =>
  new Set([...budget.bands.flatMap((band) => band.requires), ...budget.churnGuard.requires]);

/**
 * Kalıtım da kanoniktir, motorda gömülü DEĞİLdir: bir bant `includesLowerBandRequirements`
 * derse ALTINDAKİ bandın ETKİN kümesini devralır, demezse zincir orada durur. Bugün kanonik
 * üç bandı da `false` tutar — yani devralma yoktur; motor bunu VARSAYMAZ, bayrağı okur.
 */
const bandRequires = (bands, band) => {
  const chain = [band.requires];
  for (let i = bands.indexOf(band); i > 0 && bands[i].includesLowerBandRequirements; i -= 1)
    chain.push(bands[i - 1].requires);
  return uniq(chain.flat());
};

/** Çağıranın beyanı ölçümden ÖNCE kapanır: bozuk şekil/bilinmeyen sınıf/kanıt ölçüm başlatmaz. */
const checkCaller = (budget, klass, declared) => {
  const fault = (id, detail) => ({ id, detail });
  // Beyanın ŞEKLİ de sözleşmedir: dizi olmayan kanıt sessizce boş kümeye düşmez.
  if (!Array.isArray(declared))
    return fault("evidence-not-array", `kanıt dizi değil: ${quote(typeof declared)}`);
  if (!budget.classes.some((entry) => entry.id === klass))
    return fault("class-unknown", `bilinmeyen sınıf: ${quote(klass)}`);
  if (dup(declared)) return fault("evidence-duplicate", `tekrarlı kanıt: ${declared.join(", ")}`);
  const known = vocabulary(budget);
  const strange = declared.filter((id) => !known.has(id));
  // Ayrıntı paketlenmez: kimlik ve metin ayrı alanlardır, ayırıcı taşıyan bir kanıt kimliği kesilmez.
  return strange.length
    ? fault("evidence-unknown", `kanonik olmayan kanıt: ${strange.join(", ")}`)
    : null;
};

/**
 * Tek deterministik karar. Bütçe `governed` kovasına uygulanır (ayrı raporlanan kategoriler
 * bütçeye girmez ama raporda adlarıyla kalır); bant merdiveni, churn freni, dosya tavanı ve
 * ölçülemeyen satır ayrı ayrı adlandırılır. `blockers` boş değilse KABUL YOKTUR.
 */
export const decide = ({ budget, numstatZ, klass, evidence = [] }) => {
  const drift = validateBudget(budget);
  if (drift.length) return refuse("canonical-drift", ERROR_KIND.config, drift.join("; "));
  const fault = checkCaller(budget, klass, evidence);
  if (fault) return refuse(fault.id, ERROR_KIND.caller, fault.detail);
  const declared = evidence.map(String);
  const text = asNumstatZ(numstatZ);
  if (text === null)
    return refuse("numstat-z-not-bytes", ERROR_KIND.input, "girdi string/Buffer değil");
  const measured = measure({ numstatZ: text, categories: budget.separatelyReported });
  if (!measured.ok) {
    const { id, detail } = measured.error;
    const kind = id === "category-config-invalid" ? ERROR_KIND.config : ERROR_KIND.input;
    return refuse(id, kind, detail);
  }

  const g = measured.governed;
  const changeClass = budget.classes.find((entry) => entry.id === klass);
  const floor = budget.churnGuard.netCreditFloor;
  const budgetNet = Math.max(g.measuredNet, floor);
  const band = budget.bands.find((entry) => budgetNet <= entry.maxNet) ?? null;
  const bandNamed = (id) => budget.bands.find((entry) => entry.id === id);
  const guardBand = bandNamed(budget.churnGuard.appliesWhenNetAtOrBelowBand);
  const grossBand = bandNamed(budget.churnGuard.grossMaxFromBand);
  const churnApplies = budgetNet <= guardBand.maxNet;
  const tripped = churnApplies && g.gross > grossBand.maxNet;
  const effective = band ? bandRequires(budget.bands, band) : [];
  const required = sorted(uniq([...effective, ...(tripped ? budget.churnGuard.requires : [])]));
  const missing = required.filter((id) => !declared.includes(id));
  const notRequired = sorted(declared.filter((id) => !required.includes(id)));
  const governedBinary = measured.binaryFiles.filter(
    (file) => !budget.separatelyReported.some((category) => inCategory(category, file)),
  );
  const reportedSource = measured.categories.flatMap((category) => category.sourceCodeFiles);
  const ceilingExceeded = budgetNet > changeClass.maxNet;

  const findings = [];
  const blockers = [];
  const note = (id, detail) => blockers.push({ id, detail });
  const record = (id, detail) => findings.push({ id, detail });
  if (!band)
    note("split-required", `bütçe neti ${budgetNet} > split eşiği ${budget.splitRequiredAboveNet}`);
  if (g.measuredNet < budgetNet)
    record("net-credit-clamped", `ölçülen net ${g.measuredNet}, bütçede taban ${floor} sayıldı`);
  if (tripped) {
    const detail = `brüt ${g.gross} > banttan türeyen brüt tavan ${grossBand.maxNet}`;
    record("churn-gross-exceeded", detail);
    // Fren kanonik kanıtıyla kapanır; kanıt yoksa küçük net büyük churn'ü ÖRTMEZ.
    if (budget.churnGuard.requires.some((id) => !declared.includes(id)))
      note("churn-gross-exceeded", detail);
  }
  if (missing.length) note("evidence-missing", `eksik kanıt: ${missing.join(", ")}`);
  if (notRequired.length)
    note("evidence-not-required", `bu bantta istenmeyen kanıt: ${notRequired.join(", ")}`);
  if (g.files > budget.maxChangedFiles)
    note("max-changed-files-exceeded", `${g.files} dosya > tavan ${budget.maxChangedFiles}`);
  if (governedBinary.length)
    note("binary-row-unmeasurable", `ölçülemeyen ikili satır: ${governedBinary.join(", ")}`);
  if (ceilingExceeded)
    record(
      "class-ceiling-exceeded",
      `bütçe neti ${budgetNet} > sınıf tavanı ${changeClass.maxNet}; kararı bandın kanıtı verir`,
    );
  if (reportedSource.length)
    record("source-code-in-reported-category", `ayrı kutuda kaynak: ${reportedSource.join(", ")}`);

  const decision = !band ? DECISION.split : blockers.length ? DECISION.rejected : DECISION.accepted;
  // biome-ignore format: the machine-readable report contract stays compact for the shard budget
  return {
    schema: REPORT_SCHEMA, ok: true, decision,
    band: band && { id: band.id, maxNet: band.maxNet, requires: [...effective] },
    changeClass: { id: changeClass.id, maxNet: changeClass.maxNet,
      ceilingKind: changeClass.ceilingKind, exceeded: ceilingExceeded },
    measurement: { grossAdditions: g.grossAdditions, grossDeletions: g.grossDeletions,
      gross: g.gross, measuredNet: g.measuredNet, budgetNet, netCreditFloor: floor,
      governedFiles: g.files, maxChangedFiles: budget.maxChangedFiles,
      splitRequiredAboveNet: budget.splitRequiredAboveNet },
    churnGuard: { applies: churnApplies, grossMax: grossBand.maxNet, tripped,
      requires: [...budget.churnGuard.requires] },
    evidence: { declared: sorted(declared), required, missing: sorted(missing), notRequired },
    categories: measured.categories.map((category) => ({ ...category })),
    totals: { ...measured.totals },
    binaryFiles: [...measured.binaryFiles], governedBinaryFiles: governedBinary,
    findings, blockers,
  };
};
