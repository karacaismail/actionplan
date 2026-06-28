import fs from "node:fs";
import path from "node:path";
import { DIMENSION_KEYS, type TaskNode } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * contentQuality kapısı (Faz A2) — İçerik kalite sözleşmesinin (docs/icerik-kalite-sozlesmesi.md)
 * makine karşılığı. Bir boyutun maddeleri ŞABLON (kalıp) mı yoksa DERİN (sayfaya-özel) mi ölçer.
 *
 * Küme B TAMAM: 422/422 düğümün 5908 boyutu derinleştirildi (swarm/human), bu test artık YEŞİL.
 * Faz F2 TAMAM: kapı CI'da bloklayıcıdır (deploy.yml: önce node checker `tools/agents/check-content.mjs`,
 * sonra bu kanonik vitest testi `npm run test:content`). Bir düğüm şablona geri dönerse deploy durur.
 */

const NODES = path.resolve(process.cwd(), "src/data/generated/nodes");

const loadNodes = (): TaskNode[] =>
  fs
    .readdirSync(NODES)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")) as TaskNode);

/** gen-items.mjs kalıp imzaları — sözleşme Bölüm 4 ile birebir. */
const FORBIDDEN_MARKERS = [
  "net işlevsel sınır",
  "yaşam döngüsü + durum makinesi",
  "Girdi/çıktı sözleşmesi ve hata yolları",
  "ölü kod elemesi + kod bölme",
  "Döngüsel karmaşıklık eşiği + lint kapısı",
  "secret rotasyonu + en az ayrıcalık",
  "bileşik indeks + imleç sayfalama",
  "N+1 önleme + önbellek",
  "p95 gecikme hedefi ve ölçüm",
  "dokunma hedefi ≥44px",
  "label↔input + ARIA hata mesajı",
  "klavye gezinme + kontrast ≥7:1",
  "Görünür odak sırası + ekran okuyucu denetimi",
  "Docker Swarm + sağlık kontrolü",
  "HPA + liveness/readiness probe",
  "AI-destekli senaryo + testing-loop",
  "autonomous QA + golden fixture",
  "Güvenlik olay loglaması + denetim izi",
];

/** Üniform olmaları KASITLI olan zorunlu güvenlik-sınır satırları — sözleşme Bölüm 5. */
const ALLOWED_BOUNDARY = [
  "AI app/module",
  "ruleset override",
  "sub_prompt güvenilmez",
  "ArcheType taslağı",
  "Test döngüsü:", // standart QA-döngü direktifi (testing-loop maks 6) — bilinçli üniform
];

const isAllowed = (item: string) => ALLOWED_BOUNDARY.some((b) => item.includes(b));

const filledDims = (n: TaskNode) =>
  DIMENSION_KEYS.map((k) => [k, n.dimensions?.[k]] as const).filter(
    ([, d]) => d && d.status !== "skeleton" && d.items.length > 0,
  );

describe("contentQuality kapısı (A2) — başlangıçta KIRMIZI beklenir", () => {
  const nodes = loadNodes();

  it("hiçbir dolu boyutta yasak şablon imzası yok (sınır satırları hariç)", () => {
    const violations: string[] = [];
    for (const n of nodes) {
      for (const [key, dim] of filledDims(n)) {
        for (const item of dim!.items) {
          if (isAllowed(item)) continue;
          const hit = FORBIDDEN_MARKERS.find((m) => item.includes(m));
          if (hit) violations.push(`${n.id}.${key}: "${hit}"`);
        }
      }
    }
    // Kırmızıyken okunur kalsın: ilk 30 ihlal + toplam sayı.
    if (violations.length) {
      console.error(
        `Şablon ihlali (toplam ${violations.length}):\n${violations.slice(0, 30).join("\n")}`,
      );
    }
    expect(violations).toEqual([]);
  });

  it("her dolu boyutta en az 1 sınır-dışı (sayfaya-özel) madde var", () => {
    // Kalibrasyon (altın düğümlerle): dolu boyut yalnız zorunlu güvenlik-sınır satırından oluşamaz;
    // en az 1 sayfaya-özel (allowlist dışı) madde taşımalı. Şablon imzası + çapraz-tekrar kapıları
    // asıl kalıp tespitini yapar; bu kontrol "yalnız sınır satırı dolgusu"nu yakalar.
    const violations: string[] = [];
    for (const n of nodes) {
      for (const [key, dim] of filledDims(n)) {
        const hasSubstantive = dim!.items.some((it) => !isAllowed(it));
        if (!hasSubstantive) violations.push(`${n.id}.${key}`);
      }
    }
    if (violations.length) {
      console.error(
        `Sınır-dışı içerik ihlali (toplam ${violations.length}):\n${violations.slice(0, 30).join("\n")}`,
      );
    }
    expect(violations).toEqual([]);
  });

  it("biçim: dolu boyutlarda 2-5 madde (moduleUsage min 1)", () => {
    // 2-5 kalibrasyonu altın düğümlere göre; moduleUsage app/yaprak seviyelerde meşru olarak 1 olabilir.
    const violations: string[] = [];
    for (const n of nodes) {
      for (const [key, dim] of filledDims(n)) {
        const len = dim!.items.length;
        const minLen = key === "moduleUsage" ? 1 : 2;
        if (len < minLen || len > 5) violations.push(`${n.id}.${key}: ${len} madde`);
      }
    }
    if (violations.length) {
      console.error(
        `Biçim ihlali (toplam ${violations.length}):\n${violations.slice(0, 30).join("\n")}`,
      );
    }
    expect(violations).toEqual([]);
  });

  it("aynı madde çok sayıda düğümde birebir tekrar etmiyor (sınır satırları hariç)", () => {
    const counts = new Map<string, number>();
    for (const n of nodes) {
      for (const [, dim] of filledDims(n)) {
        for (const item of dim!.items) {
          if (isAllowed(item)) continue;
          counts.set(item, (counts.get(item) ?? 0) + 1);
        }
      }
    }
    const THRESHOLD = 5; // 5+ düğümde birebir aynı madde = şablon
    const repeated = Array.from(counts.entries())
      .filter(([, c]) => c >= THRESHOLD)
      .map(([item, c]) => `${c}× "${item.slice(0, 60)}"`);
    if (repeated.length) {
      console.error(
        `Tekrar eden madde (toplam ${repeated.length}):\n${repeated.slice(0, 30).join("\n")}`,
      );
    }
    expect(repeated).toEqual([]);
  });
});
