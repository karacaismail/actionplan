/**
 * seed-docs-lib — ARCHIVED-LEGACY-MUTATOR / FAIL-CLOSED (Q1).
 *
 * Ortak doküman-seed yazıcısı (D/xdim içerik üreticileri + apply materializer + canonical dizine
 * fs yazımı) KALDIRILDI. Bu modül yüklendiği anda tek koşulsuz guard'ı import eder; import ya
 * da doğrudan çalıştırma exit 2 verir. Böylece paylaşılan mutator tüketicileri
 * (seed-build/edu/egitim/genel/kararlar/landx/meta/sus) kanonik veriye ASLA yazamaz.
 *
 * Aşağıdaki isimler (D, xdim, apply, ECA_BOUND, AI_B1, AI_B2) yalnız aktif tüketicilerin ESM
 * link aşamasını exit-2 guard'a ULAŞTIRMAK için inert (sealed) stub olarak durur — çağrılmaları
 * bile mümkün değildir, çünkü guard modül gövdesinden önce çalışır ve süreci sonlandırır.
 */
import "./legacy-seed-quarantine.mjs";

const sealed = (name) => () => {
  throw new Error(`ARCHIVED-LEGACY-MUTATOR: seed-docs-lib.${name} devre dışı (FAIL-CLOSED)`);
};

export const D = sealed("D");
export const xdim = sealed("xdim");
export const apply = sealed("apply");
export const ECA_BOUND = "ARCHIVED-LEGACY-MUTATOR";
export const AI_B1 = "ARCHIVED-LEGACY-MUTATOR";
export const AI_B2 = "ARCHIVED-LEGACY-MUTATOR";
