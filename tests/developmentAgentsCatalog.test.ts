import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "development_agents");
const profiles = {
  ai_behavior: ["prompt injection", "rol ihlali", "tool"],
  backend: ["schema", "data flow", "server-side"],
  frontend: ["route", "component", "erişilebilirlik"],
  graphql_security: ["query derinliği", "overfetch", "erişim kontrolü"],
  i18n_l10n_g11: ["yerelleştirme", "terim", "tarih"],
  kernel_integrator: ["WBS", "kernel", "sızma"],
  performance: ["performans bütçesi", "bundle", "JSON"],
  po: ["ürün kapsamı", "task splitting", "öncelik"],
  project_manager: ["bağımlılık", "risk", "evidence"],
  qa_test: ["red", "regresyon", "e2e"],
  qasp: ["release gate", "acceptance criteria", "edge case"],
  rollback: ["geri alma", "rollback kriteri", "değişiklik paketi"],
  security: ["veri sızıntısı", "input validation", "content poisoning"],
  solid: ["SOLID", "sorumluluk", "bağımlılık yönü"],
  swarm_k8s_shared_host: ["shared host", "k8s", "izolasyon"],
  uiux: ["bilgi mimarisi", "okuma akışı", "etkileşim"],
  wcag22aaa: ["WCAG 2.2 AAA", "klavye", "kontrast"],
} as const;
const headings = [
  "Rol",
  "Misyon",
  "Girdiler",
  "Çıktılar",
  "Yetkinlikler ve kapılar",
  "Sınırlar",
  "Handoff",
];
const read = (file: string) => fs.readFileSync(path.join(DIR, file), "utf8");

describe("development agent profile catalog", () => {
  it("contains only the README and seventeen named role profiles", () => {
    const expected = ["README.md", ...Object.keys(profiles).map((name) => `${name}.md`)].sort();
    expect(fs.existsSync(DIR)).toBe(true);
    expect(fs.readdirSync(DIR).sort()).toEqual(expected);
  });

  it.each(Object.entries(profiles))(
    "%s has the shared contract and role-specific competencies",
    (name, terms) => {
      const content = read(`${name}.md`);
      for (const heading of headings) expect(content).toContain(`## ${heading}`);
      for (const term of terms)
        expect(content.toLocaleLowerCase("tr-TR")).toContain(term.toLocaleLowerCase("tr-TR"));
      expect(content).toContain("Codex");
      expect(content).toContain("human-developer-only");
    },
  );

  it("keeps Codex final authority above the subordinate project manager", () => {
    const readme = read("README.md");
    const pm = read("project_manager.md");
    const rollback = read("rollback.md");
    for (const token of [
      "Codex = MASTER",
      "PM = bağlı orkestra şefi",
      "test-first",
      "tek yazar",
      "human-developer-only",
    ])
      expect(readme).toContain(token);
    expect(pm).toContain("nihai kapsam, öncelik, rollback ve teslim kararları Codex'te kalır");
    expect(pm).toContain("commit/push/merge");
    expect(readme).toContain("Actionplan dokümantasyon Git/PR işlemleri");
    expect(readme).toContain("Platform ürün-kodu Git/release/destructive-Git uygulaması");
    expect(readme).toContain("human-developer/operator-only");
    expect(rollback).toContain("Nihai rollback kararını Codex verir");
    expect(rollback).toContain("human-developer/operator-only");
  });
});
