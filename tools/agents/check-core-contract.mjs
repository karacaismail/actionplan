#!/usr/bin/env node
/**
 * check-core-contract (core-contract-pack §2 — BLOKLAYICI). Kernel sözleşme paketinin (§2 Kernel
 * Sözleşmeleri) beş ZORUNLU primitifinin — tenant / authz / audit / observability / module-sdk —
 * sözleşme-referanslarının VARLIĞINI doğrular. Her primitif için: (1) §2.x başlık çıpası,
 * (2) arayüz imzası (kanonik backend paket import yolu, ör. `backend/platform_tenancy`),
 * (3) uygulama-tüketimi çıpası ("Uygulama tüketimi" ya da eşdeğer arayüz beyanı) beklenir.
 * Bir primitif sözleşmesi eksik/kopmuşsa (dokümanda beyan yoksa) exit 1 — böylece dokümanların
 * adını andığı ama tanımlamadığı sözleşme drift'i (C7 bulgusu) bloklanır.
 *
 * False-positive'den kaçınma: yalnızca §2'de KANONİK olarak tanımlı beş primitif zorlanır; ek
 * sözleşmeler (event-bus, eca, registry vb.) serbesttir. Paket iyi-biçimli/eksiksizse exit 0.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const v = [];
const fail = (m) => v.push(m);

const packPath = path.join(ROOT, "docs", "core-contract-pack.md");
if (!fs.existsSync(packPath)) {
  console.log("core-contract — sözleşme paketi: YOK.");
  console.log("\nSONUÇ: KIRMIZI — 1 ihlal");
  console.log("  - docs/core-contract-pack.md yok (§2 kernel sözleşme kaynağı eksik)");
  process.exit(1);
}
const pack = fs.readFileSync(packPath, "utf8");

// §2 Kernel Sözleşmeleri bölümü bulunmalı (primitiflerin ait olduğu bölüm çıpası).
if (!/^##\s*2\.\s+Kernel Sözleşmeleri/m.test(pack))
  fail("§2 (Kernel Sözleşmeleri) bölüm başlığı bulunamadı");

/**
 * Beş kernel primitifi. Her biri için sözleşme-referansı = başlık çıpası + arayüz imzası
 * (kanonik backend paket yolu). İmza, "adı geçiyor ama tanımlı değil" durumunu eler.
 */
const PRIMITIVES = [
  {
    key: "tenant",
    heading: /###\s*2\.1\s+Tenant Context/,
    sig: /backend\/platform_tenancy/,
    api: /require_tenant/,
  },
  {
    key: "authz",
    heading: /###\s*2\.2\s+Identity\s*\/\s*AuthZ/,
    sig: /backend\/platform_authn_authz/,
    api: /RequirePermission/,
  },
  {
    key: "audit",
    heading: /###\s*2\.5\s+Audit Log/,
    sig: /backend\/platform_audit/,
    api: /AuditLogger/,
  },
  {
    key: "observability",
    heading: /###\s*2\.9\s+Observability/,
    sig: /backend\/platform_observability/,
    api: /get_logger/,
  },
  {
    key: "module-sdk",
    heading: /###\s*2\.10\s+Module SDK/,
    sig: /backend\/platform_sdk/,
    api: /class\s+AppModule/,
  },
];

let present = 0;
for (const p of PRIMITIVES) {
  const hasHeading = p.heading.test(pack);
  const hasSig = p.sig.test(pack);
  const hasApi = p.api.test(pack);
  if (hasHeading && hasSig && hasApi) {
    present++;
    continue;
  }
  if (!hasHeading) fail(`${p.key}: §2 başlık çıpası eksik (${p.heading.source})`);
  if (!hasSig) fail(`${p.key}: arayüz imzası (backend paket yolu) eksik (${p.sig.source})`);
  if (!hasApi) fail(`${p.key}: sözleşme API referansı eksik (${p.api.source})`);
}

console.log(
  `core-contract — §2 kernel primitifi: ${present}/${PRIMITIVES.length} sözleşme-referansı tam (tenant/authz/audit/observability/module-sdk).`,
);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓ (kernel sözleşme paketi eksiksiz)");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
