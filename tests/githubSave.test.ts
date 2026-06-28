import { buildCommitBody, toBase64 } from "@/engine";
import { describe, expect, it } from "vitest";

describe("githubSave (PAT persistence, frontend-only)", () => {
  it("toBase64 UTF-8 güvenli (Türkçe karakter) round-trip", () => {
    const s = "Eylem Planı — çğıöşü ÇĞİÖŞÜ";
    const b64 = toBase64(s);
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    expect(new TextDecoder().decode(bytes)).toBe(s);
  });

  it("buildCommitBody: sha yoksa eklenmez, varsa eklenir", () => {
    const a = buildCommitBody("içerik", "mesaj", "main");
    expect(a).toMatchObject({ message: "mesaj", branch: "main" });
    expect("sha" in a).toBe(false);

    const b = buildCommitBody("içerik", "mesaj", "main", "abc123");
    expect(b.sha).toBe("abc123");
    expect(b.content).toBe(toBase64("içerik"));
  });
});
