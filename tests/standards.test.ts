import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { StandardContractSchema, StandardRefsSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * ST-2 (ADR-0027) — Mühendislik standardı katalogları kapısı.
 * src/data/standards/*.json'un tamamı TEK paylaşılan StandardContractSchema'ya uyar;
 * id = dosya adı; ≥3 kural; id'ler benzersiz. P0 dalgası ≥12 standart.
 */
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/data/standards");
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")) : [];

describe("mühendislik standardı katalogları", () => {
  it("P0 dalgası: en az 12 standart sözleşmesi var", () => {
    expect(files.length).toBeGreaterThanOrEqual(12);
  });

  it.each(files)("%s — şemaya uyar, id=dosya adı, ≥3 kural", (f) => {
    const data = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
    const parsed = StandardContractSchema.parse(data);
    expect(parsed.id).toBe(f.replace(/\.json$/, ""));
    expect(parsed.rules.length).toBeGreaterThanOrEqual(3);
  });

  it("id'ler benzersiz", () => {
    const ids = files.map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")).id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/**
 * Yeni standart ref anahtarları — check-standards-coverage'ın kanonik id eşlemesiyle
 * hizalı: her mapped anahtar gerçek bir src/data/standards/<id>.json'a çözülmelidir.
 * (Bu blok, ref anahtarı ↔ standart dosyası kopması olursa KIRMIZI verir.)
 */
describe("yeni standart ref anahtarları — kanonik id çözümü", () => {
  const standardIds = new Set(files.map((f) => f.replace(/\.json$/, "")));
  // check-standards-coverage.mjs REF_KEY_TO_STANDARD ile birebir aynı olmalı.
  const REF_KEY_TO_STANDARD: Record<string, string> = {
    g11nRef: "g11n",
    a11yRef: "a11y",
    ssoRef: "sso",
    oidcRef: "oidc",
    mfaRef: "mfa",
    authzRef: "authz-rbac-abac",
    c13nRef: "c13n",
    c12nRef: "c12n",
    i18nRef: "i18n-standards",
  };

  it.each(Object.entries(REF_KEY_TO_STANDARD))(
    "%s → kanonik standart dosyasına çözülür",
    (key, canonicalId) => {
      // 1) Şema yeni anahtarı kabul eder ve değeri korur.
      const refs = StandardRefsSchema.parse({ [key]: canonicalId });
      expect((refs as Record<string, string>)[key]).toBe(canonicalId);
      // 2) Kanonik id gerçek bir standart dosyasına çözülür (dangling değil).
      expect(standardIds.has(canonicalId)).toBe(true);
    },
  );

  it("ödünç düğüm: yeni refler kanonik id'lerle set edilebilir ve tümü çözülür", () => {
    const refs = StandardRefsSchema.parse({
      authzRef: "authz-rbac-abac",
      mfaRef: "mfa",
      g11nRef: "g11n",
      a11yRef: "a11y",
      ssoRef: "sso",
      oidcRef: "oidc",
      c12nRef: "c12n",
      c13nRef: "c13n",
    });
    for (const [k, v] of Object.entries(refs)) {
      // Boş ref (lazy) serbesttir; yalnız set edilmiş mapped anahtarlar çözülmeli.
      if (v && k in REF_KEY_TO_STANDARD) expect(standardIds.has(v as string)).toBe(true);
    }
  });
});
