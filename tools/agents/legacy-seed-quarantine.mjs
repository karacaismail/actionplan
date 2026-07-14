#!/usr/bin/env node
/**
 * legacy-seed-quarantine — Q1 paylaşılan legacy seed mutator ailesi için TEK, KOŞULSUZ guard.
 *
 * ARCHIVED-LEGACY-MUTATOR / FAIL-CLOSED. Bu modül import edildiğinde de doğrudan
 * çalıştırıldığında da kanonik veriye ASLA yazamaz: yüklenir yüklenmez markörleri stderr'e
 * yazar ve exit 2 verir. Env/argv override YOKTUR (koşulsuz). seed-docs-lib bu guard'ı
 * import ettiği için paylaşılan mutator tüketicileri (seed-build/edu/egitim/genel/kararlar/
 * landx/meta/sus) ESM değerlendirmesi sırasında bu guard'a ulaşır ve fail-closed olur.
 */
console.error(
  [
    "ARCHIVED-LEGACY-MUTATOR — FAIL-CLOSED",
    "Authority: Codex → PM → uzman ajanlar → Claude workers/slaves",
    "AI access: read-only-audit",
    "Executor: human-developer-only",
    "Paylaşılan legacy seed mutator ailesi kanonik düğüm yazamaz; kaynak-sahipli materializer ve gözden geçirilmiş migration kullanın.",
  ].join("\n"),
);
process.exit(2);
