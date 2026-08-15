/**
 * pr-size-total-deadline (ADR-0027 / short-code `short-pr-size`) — çalışma ağacı toplayıcısının
 * UÇTAN UCA süre bütçesi. TEK SORUMLULUK: tek bir başlangıç okumasından türeyen TOPLAM son tarihi
 * tutmak ve her adımda kalan süreyi vermek. Ölçüm, karar, CLI ve kanonik bant burada YOKTUR.
 *
 * POLİTİKA DEĞİL SEÇENEK: bütçe değerini yalnız ÇAĞIRAN verir; bu modül hiçbir süre sabitini
 * dışa açmaz, dolayısıyla "toplam süre şu kadardır" diyen bir politika buradan ihraç EDİLEMEZ.
 *
 * FAIL-CLOSED: geçersiz bütçe girdisi, çağrılamayan/atan/sonlu-olmayan/GERİYE giden saat ve tükenen
 * bütçe KARAR YERİNE adlandırılmış hata döndürür; ham neden, yol ve saat DEĞERİ rapora TAŞINMAZ.
 */

/** Node yerleşik TEK YÖNLÜ saati; gerçek uyku, ağ ve dış bağımlılık YOKTUR. */
const monotonicMs = () => Number(process.hrtime.bigint() / 1000000n);

const stop = (id, detail) => ({ ok: false, error: { id, detail } });

/**
 * Tek saat okuması. Üç ayrı arıza AYRI adlandırılır: saat ATAR, sonlu SAYI vermez ya da GERİYE
 * gider. Geriye giden saat sessizce kabul edilseydi bütçe kendiliğinden UZAR ve fren kalkardı.
 */
const readClock = (clock, previous) => {
  let value;
  try {
    value = clock();
  } catch {
    return stop("working-tree-clock-failed", "enjekte saat değeri alınamadı");
  }
  if (typeof value !== "number" || !Number.isFinite(value))
    return stop("working-tree-clock-invalid", "saat sonlu bir sayı vermedi");
  if (previous !== undefined && value < previous)
    return stop("working-tree-clock-not-monotonic", "saat geriye gitti");
  return { ok: true, value };
};

/** Bütçe/saat DURDURMASI bir git arızası değildir; hiçbir adım onu kendi adına ÇEVİREMEZ. */
export const isBudgetStop = (result) =>
  !result.ok && /^working-tree-(deadline-exceeded|clock-)/.test(result.error.id);

/**
 * Bütçe ATLANIRSA `budget` null döner ve saat HİÇ okunmaz: bütçesiz çağrının eski davranışı,
 * seçenekleri ve üstverisi birebir korunur. Verilirse yalnız POZİTİF, GÜVENLİ tam sayı kabul
 * edilir ve son tarih TEK bir başlangıç okumasından türer — adım adım tazelenen bir hedef değil.
 */
export const createTotalBudget = ({ totalTimeoutMs, clock } = {}) => {
  if (totalTimeoutMs === undefined) return { ok: true, budget: null };
  if (!Number.isSafeInteger(totalTimeoutMs) || totalTimeoutMs <= 0)
    return stop("working-tree-total-timeout-invalid", "toplam süre bütçesi pozitif tam sayı değil");
  const read = clock === undefined ? monotonicMs : clock;
  if (typeof read !== "function")
    return stop("working-tree-clock-invalid", "saat çağrılabilir değil");
  const started = readClock(read);
  if (!started.ok) return started;
  let previous = started.value;
  const budget = {
    /** Kalan süreyi TAZELER; saat bozulduysa ya da bütçe bittiyse adlandırılmış hata verir. */
    remaining: () => {
      const now = readClock(read, previous);
      if (!now.ok) return now;
      previous = now.value;
      const left = totalTimeoutMs - (now.value - started.value);
      if (left > 0) return { ok: true, value: left };
      return stop("working-tree-deadline-exceeded", "toplam süre bütçesi tükendi");
    },
  };
  return { ok: true, budget };
};

/**
 * Bütçeli çağrı sarmalayıcısı. Her çağrıdan ÖNCE kalan süre tazelenir; süreç tavanı
 * `min(süreç-başına, kalan)` olur. Bütçe DAR taraf iken gelen süre aşımı tek bir süreç arızası
 * DEĞİL, toplam bütçenin tükenmesidir ve öyle adlandırılır; süreç-başına sınır gerçekten darsa
 * mevcut `git-timeout` kimliği KORUNUR.
 */
export const budgetedCaller = (budget, perProcessMs, call) => (args, allowed) => {
  const left = budget.remaining();
  if (!left.ok) return left;
  const capped = Math.min(perProcessMs, left.value);
  const result = call(args, allowed, capped);
  if (result.ok || result.error.id !== "git-timeout" || capped >= perProcessMs) return result;
  return stop("working-tree-deadline-exceeded", "toplam süre bütçesi tükendi");
};
