#!/usr/bin/env node
/**
 * check-pr-size-ci (ADR-0027 / short-code `short-pr-size`) — GitHub `pull_request` OLAY ADAPTÖRÜ
 * (P3a). Bu dosya ÖLÇMEZ, KARAR VERMEZ ve hiçbir eşiği/bandı/sınıf-kanıt sözlüğünü kopyalamaz:
 * tek işi, GitHub'ın yazdığı olay dosyasını kabul edilmiş `check-pr-size` kapısının argv'sine
 * ÇEVİRİP `runCheck`'i çağırmaktır. Rapor, çıkış kodu ve zarf o kapının sözleşmesidir.
 *
 * GÜVENİLMEZ GİRDİ: yolu GitHub verse de olay dosyasının İÇERİĞİ PR'ı açanın yazdığı veridir. Dosya
 * dar okunur (bağ izlenmez, düzenli dosya ve boyut tavanı aranır), katı UTF-8 ve katı JSON
 * kapısından geçer, yapısı DAR doğrulanır. Başlık ve gövde HİÇ OKUNMAZ; yalnız iki ad alanı taşıyan
 * etiketler argv'yi etkiler. argv yalnız BELLEKTE bir DİZİdir: hiçbir komut METNİ kurulmaz, hiçbir
 * alt süreç/kabuk/ağ/token/Git çağrısı yoktur ve workflow ifade genişletmesi (PR denetimindeki
 * metnin adıma gömülmesi) hiçbir yola giremez.
 *
 * KAPSAM DÜRÜST: bu paket workflow'a BAĞLI DEĞİLdir (P3b). Kapının `ciEnforced` alanı `false`,
 * kanonik durumu `implemented-not-wired` kalır; hiçbir merge burada bloklanmaz.
 *
 * FAIL-CLOSED: eksik ortam, okunamayan/düzensiz/boş/tavanı aşan dosya, geçersiz UTF-8/JSON, bozuk
 * olay yapısı, geçersiz commit kimliği, bozuk etiket şekli ve çakışan sınıf etiketi KARAR YERİNE
 * kapının kendi adlandırılmış iç zarfını üretir. Tanılamaya YALNIZ kapalı kümedeki kararlı bir
 * neden kimliği yazılır: yol, PR metni, ham JSON, etiket içeriği, istisna ve yığın ASLA sızmaz.
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { READ_FAULT, readBoundedFile, writeAllSync } from "../lib/pr-size-core.mjs";
import { ERROR_KIND } from "../lib/pr-size-decision.mjs";
import { internalEnvelope, runCheck } from "./check-pr-size.mjs";

export const EVENT_PATH_ENV = "GITHUB_EVENT_PATH";
/**
 * UYGULAMA GÜVENLİK FRENİ — politika eşiği DEĞİLdir ve bütçeyle ilgisi YOKTUR. Yalnız adaptörün
 * sınırsız bir dosyayı belleğe almasını engeller; bant/sınıf tavanları kanonik alanda yaşar.
 */
export const MAX_EVENT_BYTES = 1024 * 1024;
export const CLASS_NAMESPACE = "pr-size:class:";
export const EVIDENCE_NAMESPACE = "pr-size:evidence:";
/**
 * Etiketsiz PR'ın düştüğü TEK kimlik. Bu bir SÖZLÜK değildir: adaptör hangi sınıfların geçerli
 * olduğunu bilmez, bilmemelidir de. Kanonik alan bu kimliği kaldırırsa çeviri sessizce geçmez;
 * motor `class-unknown` ile fail-closed kapanır — yani geçerlilik yine TEK sahibindedir.
 */
export const DEFAULT_CLASS = "production";
/** Kanıt listesinin AYIRICISI adaptörün KENDİ kodlamasıdır; kimlik sözlüğüyle ilgisi yoktur. */
const EVIDENCE_SEPARATOR = ",";
/** Tam, küçük harfli commit kimliği: ref adı, kısaltma ve checkout durumu ölçüme giremez. */
const COMMIT_ID = /^[0-9a-f]{40}$/;

/** Kapalı neden kümesi: rapora yalnız BU kimliklerden biri yazılır, hiçbir değer yankılanmaz. */
export const FAULT = Object.freeze({
  envMissing: "event-path-missing",
  unreadable: "event-unreadable",
  notRegularFile: "event-not-regular-file",
  tooLarge: "event-too-large",
  empty: "event-empty",
  notUtf8: "event-not-utf8",
  notJson: "event-not-json",
  shapeInvalid: "event-shape-invalid",
  baseShaInvalid: "event-base-sha-invalid",
  headShaInvalid: "event-head-sha-invalid",
  labelsInvalid: "event-labels-invalid",
  classConflict: "event-class-label-conflict",
  evidenceSeparator: "event-evidence-label-separator",
});

const fault = (cause) => ({ ok: false, cause });
const record = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const commitOf = (side) => (record(side) ? side.sha : undefined);
const suffixes = (names, namespace) =>
  names.filter((name) => name.startsWith(namespace)).map((name) => name.slice(namespace.length));

/**
 * SAF ÇEVİRİ: olay nesnesi → argv DİZİSİ. Hiçbir yan etki, hiçbir komut metni, hiçbir kabuk yoktur.
 * Başlık, gövde, yazar, ref adı ve numara OKUNMAZ; ölçümün iki ucu yalnız DEĞİŞMEZ commit
 * kimlikleridir. Etiketlerden yalnız iki ad alanı geçer: sınıf ad alanı ya hiç yoktur (varsayılana
 * düşer) ya da TEK olmalıdır — iki farklı/aynı etiket sessizce birini seçmez, çakışma olarak
 * kapanır. Kanıt son ekleri DETERMİNİSTİK sıralanır ve OLDUĞU GİBİ geçirilir: bilinmezlik, tekrar
 * ve boşluk motorun kendi sözleşmesidir, burada ikinci kez tanımlanmaz.
 */
export const deriveArgv = (event) => {
  if (!record(event)) return fault(FAULT.shapeInvalid);
  const request = event.pull_request;
  if (!record(request)) return fault(FAULT.shapeInvalid);
  const base = commitOf(request.base);
  if (typeof base !== "string" || !COMMIT_ID.test(base)) return fault(FAULT.baseShaInvalid);
  const head = commitOf(request.head);
  if (typeof head !== "string" || !COMMIT_ID.test(head)) return fault(FAULT.headShaInvalid);
  if (!Array.isArray(request.labels)) return fault(FAULT.labelsInvalid);
  const names = [];
  for (const item of request.labels) {
    if (!record(item) || typeof item.name !== "string") return fault(FAULT.labelsInvalid);
    names.push(item.name);
  }
  const klasses = suffixes(names, CLASS_NAMESPACE);
  if (klasses.length > 1) return fault(FAULT.classConflict);
  const evidence = suffixes(names, EVIDENCE_NAMESPACE).sort();
  // Ayırıcı taşıyan son ek TEK etiketten birden çok kimlik doğururdu: kendi kodlamamızı savunuruz.
  if (evidence.some((id) => id.includes(EVIDENCE_SEPARATOR))) return fault(FAULT.evidenceSeparator);
  const argv = [`--base=${base}`, `--head=${head}`, `--class=${klasses[0] ?? DEFAULT_CLASS}`];
  if (evidence.length > 0) argv.push(`--evidence=${evidence.join(EVIDENCE_SEPARATOR)}`);
  return { ok: true, argv };
};

/**
 * Olay dosyası FAIL-CLOSED okunur ve ASLA yazılmaz; bayt kabulünün MEKANİĞİ (bağ izlememe, düzenli
 * dosya şartı, tavan, boş RED, tam sınırlı okuma, `fstat` tekrarı) çekirdeğin paylaşılan
 * primitifindedir ve burada İKİNCİ kez yazılmaz. Adaptör ona yalnız KENDİ tavanını verir ve genel
 * sonucu KENDİ kapalı neden kümesine çevirir; boyut dâhil hiçbir değer rapora geçmez.
 */
const EVENT_FAULT = Object.freeze({
  [READ_FAULT.notRegularFile]: FAULT.notRegularFile,
  [READ_FAULT.tooLarge]: FAULT.tooLarge,
  [READ_FAULT.empty]: FAULT.empty,
  [READ_FAULT.unreadable]: FAULT.unreadable,
});
const readEvent = (file) => {
  const source = readBoundedFile(file, MAX_EVENT_BYTES);
  return source.ok ? source : fault(EVENT_FAULT[source.fault]);
};

/** Katı UTF-8 ve katı JSON: bozuk bayt ya da bozuk belge sessizce bir varsayılana düşmez. */
const decoder = new TextDecoder("utf-8", { fatal: true });
const parseEvent = (bytes) => {
  let text;
  try {
    text = decoder.decode(bytes);
  } catch {
    return fault(FAULT.notUtf8);
  }
  try {
    return { ok: true, event: JSON.parse(text) };
  } catch {
    return fault(FAULT.notJson);
  }
};

/** Örtme metni TEK ve KAPALIdır: hiçbir girdiyi yankılamaz, hiçbir değere göre değişmez. */
export const REDACTED_DETAIL = "çağıran girdisi reddedildi: ayrıntı raporlanmaz";
/**
 * SIZINTI FRENİ. Sınıf/kanıt kimliğinin GEÇERLİLİĞİ motorundur ve adaptör onu ön doğrulamaz; ama
 * motor reddederken tanılamasında reddettiği kimliği YANKILAR ve o kimlik PR'ı açanın yazdığı
 * etiket son ekidir — yani düşmanca/sır benzeri metin adaptörün stdout'una düşerdi. Burada YALNIZ
 * çağıran-girdisi ayrıntı yüzeyleri örtülür: şema, sürüm, durum, çıkış kodu, hata kimliği/sınıfı ve
 * karar raporunun kimliği DEĞİŞMEDEN kalır, yani hata çağıran hatası olarak kalır ve ikinci bir
 * karar/zarf uydurulmaz. Ölçüm-girdisi ve kanonik-config ayrıntıları (aralık, fixture, drift)
 * etiketten türeyemez, bu yüzden DOKUNULMAZ. Rapor YERİNDE değiştirilmez: kopya üretilir.
 */
const redactCallerDetail = (report) => {
  const decided = report.decisionReport;
  if (decided?.ok !== false || decided.error?.kind !== ERROR_KIND.caller) return report;
  const scrub = (error) => (error ? { ...error, detail: REDACTED_DETAIL } : error);
  return {
    ...report,
    error: scrub(report.error),
    decisionReport: { ...decided, error: scrub(decided.error) },
  };
};

/**
 * Tek deterministik geçiş: ortam → olay dosyası → katı JSON → saf çeviri → kabul edilmiş kapı.
 * Adaptör hatası kapının KENDİ iç zarfını kullanır; ikinci bir zarf/karar biçimi UYDURULMAZ.
 */
export const runAdapter = (env) => {
  const file = env?.[EVENT_PATH_ENV];
  if (typeof file !== "string" || file === "") return internalEnvelope(FAULT.envMissing);
  const source = readEvent(file);
  if (!source.ok) return internalEnvelope(source.cause);
  const parsed = parseEvent(source.bytes);
  if (!parsed.ok) return internalEnvelope(parsed.cause);
  const derived = deriveArgv(parsed.event);
  if (!derived.ok) return internalEnvelope(derived.cause);
  return redactCallerDetail(runCheck(derived.argv));
};

let emitted = false;
/**
 * Rapor TAM ve TEK yazılır. Boru erkenden kapanırsa (EPIPE) yazma başarısız olabilir; bayrak
 * yazmadan ÖNCE kalktığı için ikinci bir rapor hiçbir yolda üretilmez ve çıkış kodu korunur.
 */
const emit = (report) => {
  if (!emitted) {
    emitted = true;
    try {
      writeAllSync(1, `${JSON.stringify(report)}\n`);
    } catch {
      /* boru kapandıysa rapor İKİNCİ kez yazılmaz */
    }
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
    emit(runAdapter(process.env));
  } catch (error) {
    emit(internalEnvelope(error?.code ?? error?.name ?? "unknown"));
  }
};

/**
 * Yalnız DOĞRUDAN çağrıldığında koşar; içe aktarıldığında SAF bir modül kalır — ortam okunmaz,
 * çıktı verilmez, sinyal kapanı kurulmaz. Karşılaştırma GERÇEK yol üzerindedir: ESM yükleyicisi
 * modülü realpath'e çözer, argv ise sembolik bağlı bir yol taşıyabilir.
 */
const invokedDirectly = () => {
  try {
    return fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
};
if (invokedDirectly()) main();
