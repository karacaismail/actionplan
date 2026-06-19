import fs from "node:fs";
import path from "node:path";
import { auditNode as auditTs } from "@/engine/audit";
import type { TaskNode } from "@/schemas";
// JS ayna (offline rapor + lint) — TS kaynakla birebir aynı skoru üretmeli.
import { auditNode as auditJs } from "../tools/lib/score.mjs";
import { describe, expect, it } from "vitest";

const load = (id: string) =>
  JSON.parse(fs.readFileSync(path.resolve(process.cwd(), `src/data/generated/nodes/${id}.json`), "utf8")) as TaskNode;

describe("audit TS/JS parite (sapma yok)", () => {
  for (const id of ["s-crm", "app-customer-revenue"]) {
    it(`${id}: TS ve JS skorları aynı`, () => {
      const node = load(id);
      expect(auditJs(node)).toEqual(auditTs(node));
    });
  }
});
