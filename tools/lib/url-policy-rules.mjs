/**
 * url-policy-rules v2 — kanonik URL sözleşmesi (docs/url-policy.md) kural aynası.
 * Kapı (tools/agents/check-url-policy.mjs) ile vitest (tests/urlPolicyConsistency.test.ts)
 * bu modülü ortak kullanır (ui-impact / dimension-semantics "tek kural kaynağı" deseni).
 *
 * v2 false-green sertleştirmesi (CPO mutation talebi, 2026-07-12):
 * - Bütün-dosya muafiyeti (EXEMPT_FILES) KALDIRILDI; url-policy.md ve node.md dahil her
 *   .md taranır. Muafiyet scope'ludur ve reason zorunludur: inline-marker (yalnız
 *   INLINE_EXEMPT_MARKER taşıyan satır) veya section (yalnız bildirilen başlığın bölümü).
 * - REQUIRED_DECISIONS granular probe'lara ayrıldı: prefix ailesi üye-bazlı
 *   ("prefix-ailesi:lst_"), bounded-context sahiplik cümlesi + merkezi tablo yasağı hükmü
 *   ayrı ayrı, RouteDefinition/HostBinding/RouteProjection üçlüsü ayrı ayrı aranır.
 *
 * docs/url-policy.md reddiye hükmü (inline url-policy-exempt marker'lı satır) eski tilde
 * gramerini, eski `k-route-identity` adını, merkezi resource-identity tablosunu ve
 * node-id kanonik route önerisini tarihsel taslak ilan eder. FORBIDDEN_PATTERNS bu dört
 * sınıfın docs katmanına geri sızmasını, REQUIRED_DECISIONS ise kanonik kararların
 * belgeden silinmesini/driftlemesini yakalar.
 *
 * Desen sözleşmesi: g/y bayrağı YASAK (lastIndex durum sızıntısı yapar); desenler
 * kelime-sınırlı ve yanlış-pozitife dirençli tutulur (ör. /node_modules/ takılmaz).
 * Section ayrıştırması code-fence farkındadır: ``` / ~~~ blokları içindeki `#` satırları
 * başlık sayılmaz (node.md §0 içindeki kod yorumu bölümü erken bitiremez).
 */
import fs from "node:fs";
import path from "node:path";

/** Muafiyet marker'ı: bu stringi içeren satır, inline-marker muafiyeti kapsamında muaftır. */
export const INLINE_EXEMPT_MARKER = "url-policy-exempt";

/** Tarihsel taslağa geri dönüşü yakalayan yasak desenler. */
export const FORBIDDEN_PATTERNS = [
  {
    id: "eski-tilde-grameri",
    // Üç biçim: {slug}~{typedId} şablonu, düz "slug~typedId" anılması ve somut
    // "ahmet-kara~p_01K2M8X7" örneği (slug ~ tipli-id). Tilde öncesi kelime karakteri
    // şartı, "~%50" gibi yaklaşıklık tildelerini dışarıda tutar.
    pattern:
      /\{slug\}~\{typedId\}|\bslug~typedId\b|[A-Za-z0-9-]+~[a-z][a-z0-9]{0,7}_[A-Za-z0-9]{4,}/,
    reason:
      "Eski birleşik tilde grameri tarihsel taslaktır; kanonik gramer ayrı path segmentleridir: /{collection}/{typedId}/{slug} (docs/url-policy.md).",
  },
  {
    id: "eski-ad-k-route-identity",
    // Negatif lookbehind: kural kimliği "eski-ad-k-route-identity" dokümanlarda
    // meta-referans olarak anılabilsin; çıplak eski ad ise yakalansın.
    pattern: /(?<!eski-ad-)\bk-route-identity\b/,
    reason:
      "Eski ad tarihsel taslaktır; URL çekirdeğinin tek kanonik adı k-route-policy'dir (docs/url-policy.md).",
  },
  {
    id: "merkezi-resource-identity-tablosu",
    // Satır-içi negatif bağlam: yasağı YENİDEN İFADE EDEN satırlar (kanonik "YASAKTIR"
    // hükmü veya "kurma" negatif emri, ör. url-policy.md §0 ve §19/7) ihlal değildir;
    // tabloyu ÖNEREN satırlar yakalanır ("resource_identity tablosu ekleyelim" vb.).
    pattern: /^(?!.*(?:YASAKTIR|yasaktır|\bkurma\b)).*\bresource_identity\b/i,
    reason:
      "Merkezi resource-identity tablosu YASAKTIR; public ID üretimi ve sahipliği bounded context'tedir (docs/url-policy.md §3).",
  },
  {
    id: "node-id-kanonik-route",
    // /node/ + sayı; /node_modules/ veya /node/16bac3... gibi karma token takılmaz.
    pattern: /\/node\/\d+\b/,
    reason:
      "Drupal tarzı /node/{sayı} kanonik route reddedilmiştir; kanonik kimlik tipli publicId'dir (docs/url-policy.md, docs/node.md §7.1).",
  },
];

/**
 * Scope'lu muafiyet kayıtları. Bütün-dosya muafiyeti YOKTUR.
 * - inline-marker: yalnız INLINE_EXEMPT_MARKER içeren satırlar muaf (patternIds kapsamında).
 * - section: yalnız verilen başlığın bölümü muaf — başlık satırından, aynı veya daha üst
 *   seviyedeki bir sonraki başlığa kadar (### altında ## gelirse bölüm biter).
 * heading değeri dosyadaki TAM başlık metnidir; test hayalet-muafiyeti (dosyada olmayan
 * başlığı) reddeder. Yeni muafiyet bilinçli mimari karar + reason ister.
 */
export const EXEMPTIONS = [
  {
    file: "url-policy.md",
    scope: { kind: "inline-marker" },
    patternIds: "all",
    reason: "tarihsel reddiye satırı — eski kararlar alıntıdır",
  },
  {
    file: "node.md",
    scope: { kind: "section", heading: "## 0. Nihai karar" },
    patternIds: ["node-id-kanonik-route"],
    reason: "nihai karar bölümü yasak biçimi kod bloğunda red örneği olarak alıntılar",
  },
  {
    file: "node.md",
    scope: { kind: "section", heading: "### 5.1 `node` neden tehlikeli?" },
    patternIds: ["node-id-kanonik-route"],
    reason: "keyword risk analizi Drupal node route kalıbını tarihsel karşılaştırma olarak anar",
  },
  {
    file: "node.md",
    scope: { kind: "section", heading: "### 7.1 Neden `/node/1` değil?" },
    patternIds: ["node-id-kanonik-route"],
    reason: "reddin kendisi — başlık ve gövde reddedilen örneği alıntılayarak gerekçelendirir",
  },
  {
    file: "node.md",
    scope: { kind: "section", heading: "### 9.1 Terminoloji kapısı" },
    patternIds: ["node-id-kanonik-route"],
    reason: "terminoloji kapısı yasaklı route stringini denetim listesi girdisi olarak içerir",
  },
  {
    file: "node.md",
    scope: { kind: "section", heading: "## 10. LLM/vibe-coding bağlayıcı yönergesi" },
    patternIds: ["node-id-kanonik-route"],
    reason: "LLM yönergesi yasak kalıbı 'üretme' talimatının örneği olarak gösterir",
  },
  {
    file: "node.md",
    scope: { kind: "section", heading: "## 11. Ölümcül anti-patternler" },
    patternIds: ["node-id-kanonik-route"],
    reason: "anti-pattern listesi numeric public ID örneğini red gerekçesiyle gösterir",
  },
  {
    file: "node.md",
    scope: { kind: "section", heading: "## 12. Tamamlanma tanımı" },
    patternIds: ["node-id-kanonik-route"],
    reason: "tamamlanma ölçütü eski route biçiminin kanonik olmadığını hükme bağlar",
  },
];

/** Tipli public ID prefix ailesi — üye-bazlı probe üretimi için (docs/url-policy.md §3.2). */
const PREFIX_AILESI = [
  "p_",
  "usr_",
  "emp_",
  "org_",
  "co_",
  "inv_",
  "po_",
  "wo_",
  "prd_",
  "lst_",
  "rpt_",
];

/**
 * url-policy.md'de varlığı zorunlu kanonik kararlar (silme/drift kilidi).
 * Her karar bir veya daha çok probe taşır; probe başarısızlığı missingId üretir.
 * Granular yapı: prefix ailesi üye-bazlı missingId ("prefix-ailesi:lst_") verir;
 * bounded-context ve route-üçlüsü çok-probe'ludur ama tek karar id'si altında raporlanır.
 */
export const REQUIRED_DECISIONS = [
  {
    id: "k-route-policy",
    description: "URL çekirdeğinin tek kanonik adı k-route-policy'dir.",
    probes: [{ missingId: "k-route-policy", pattern: /\bk-route-policy\b/ }],
  },
  {
    id: "id-only-private-canonical",
    description: "Private PII detail canonical'ı ID-only'dir; kişi adı/slug/PII path'e girmez.",
    probes: [{ missingId: "id-only-private-canonical", pattern: /ID-only canonical/i }],
  },
  {
    id: "public-grammar-ascii-slug",
    description:
      "Public detail grameri {typedId}/{asciiSlug} literalini taşır (ayrı path segmentleri).",
    probes: [{ missingId: "public-grammar-ascii-slug", pattern: /\{typedId\}\/\{asciiSlug\}/ }],
  },
  {
    id: "ascii-first",
    description:
      "Public slug politikası site bazında ASCII-first'tür; Unicode alias tenant opt-in.",
    probes: [{ missingId: "ascii-first", pattern: /ASCII-first/i }],
  },
  {
    id: "rfc-2119",
    description: "MUST/SHOULD/MAY normatif dili RFC 2119 anlamında kullanılır.",
    probes: [{ missingId: "rfc-2119", pattern: /RFC ?2119/ }],
  },
  {
    id: "bounded-context-id-sahipligi",
    description:
      "public_id üretimi/sahipliği bounded context'tedir VE merkezi tablo yasağı hükmü durur; iki parçadan biri silinirse karar eksiktir.",
    probes: [
      {
        missingId: "bounded-context-id-sahipligi",
        pattern: /bounded context'lerinde üretir/,
      },
      {
        missingId: "bounded-context-id-sahipligi",
        pattern: /resource_identity[`"']? tablosunda birleştirmek YASAKTIR/,
      },
    ],
  },
  {
    id: "route-definition-host-binding-projection",
    description:
      "RouteDefinition + HostBinding + RouteProjection sözleşme üçlüsü tanımlıdır (üçü ayrı aranır).",
    probes: [
      { missingId: "route-definition-host-binding-projection", pattern: /\bRouteDefinition\b/ },
      { missingId: "route-definition-host-binding-projection", pattern: /\bHostBinding\b/ },
      { missingId: "route-definition-host-binding-projection", pattern: /\bRouteProjection\b/ },
    ],
  },
  {
    id: "prefix-ailesi",
    description:
      "Tipli public ID prefix ailesi (11 üye) ve global prefix registry tanımlıdır; üye silinmesi üye-bazlı missing üretir.",
    probes: [
      { missingId: "prefix-ailesi", pattern: /prefix ailesi/i },
      ...PREFIX_AILESI.map((uye) => ({
        missingId: `prefix-ailesi:${uye}`,
        pattern: new RegExp(`\\b${uye}`),
      })),
    ],
  },
];

/** Deseni durumsuz kopyalar (g/y bayrağı sızarsa lastIndex hatasına karşı savunma). */
function durumsuz(pattern) {
  return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ""));
}

/** docsDir altındaki tüm .md dosyalarını (recursive, sıralı) döner. */
export function collectMarkdownFiles(docsDir) {
  const dosyalar = [];
  const gez = (dizin) => {
    for (const girdi of fs.readdirSync(dizin, { withFileTypes: true })) {
      const tam = path.join(dizin, girdi.name);
      if (girdi.isDirectory()) gez(tam);
      else if (girdi.isFile() && girdi.name.endsWith(".md")) dosyalar.push(tam);
    }
  };
  if (fs.existsSync(docsDir)) gez(docsDir);
  return dosyalar.sort();
}

/**
 * Code-fence dışındaki markdown başlıklarını döner: [{index, level, text}].
 * ``` / ~~~ blokları içindeki `#` satırları başlık DEĞİLDİR (kod yorumu olabilir).
 */
function fenceDisiBasliklar(satirlar) {
  const basliklar = [];
  let fenceKarakteri = null;
  for (let i = 0; i < satirlar.length; i++) {
    const fence = satirlar[i].match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      const karakter = fence[1][0];
      if (fenceKarakteri === null) fenceKarakteri = karakter;
      else if (karakter === fenceKarakteri) fenceKarakteri = null;
      continue;
    }
    if (fenceKarakteri !== null) continue;
    const baslik = satirlar[i].match(/^(#{1,6})\s+\S/);
    if (baslik) basliklar.push({ index: i, level: baslik[1].length, text: satirlar[i].trim() });
  }
  return basliklar;
}

/**
 * heading ile TAM eşleşen her başlığın bölüm aralığını döner (0-tabanlı, uçlar dahil).
 * Bölüm başlık satırından başlar; aynı veya daha üst seviyedeki ilk başlıkta biter.
 */
function bolumAraliklari(satirlar, heading) {
  const basliklar = fenceDisiBasliklar(satirlar);
  const hedef = heading.trim();
  const araliklar = [];
  for (let b = 0; b < basliklar.length; b++) {
    if (basliklar[b].text !== hedef) continue;
    let son = satirlar.length - 1;
    for (let s = b + 1; s < basliklar.length; s++) {
      if (basliklar[s].level <= basliklar[b].level) {
        son = basliklar[s].index - 1;
        break;
      }
    }
    araliklar.push({ start: basliklar[b].index, end: son });
  }
  return araliklar;
}

/** Muafiyet verilen patternId'yi kapsıyor mu ("all" veya listede). */
function muafiyetKapsiyor(muafiyet, patternId) {
  return muafiyet.patternIds === "all" || muafiyet.patternIds.includes(patternId);
}

/**
 * İçeriği satır satır yasak desenlere karşı tarar; fileName için kayıtlı scope'lu
 * muafiyetleri uygular. fileName docs-göreli dosya adıdır (ör. "url-policy.md").
 * Dönüş: [{file, line, patternId, excerpt}] — line 1-tabanlı.
 */
export function scanContentForViolations(content, fileName) {
  const satirlar = content.split(/\r?\n/);
  const dosyaMuafiyetleri = EXEMPTIONS.filter((e) => e.file === fileName);
  const inlineMuafiyetleri = dosyaMuafiyetleri.filter((e) => e.scope.kind === "inline-marker");
  const bolumMuafiyetleri = dosyaMuafiyetleri
    .filter((e) => e.scope.kind === "section")
    .map((e) => ({ muafiyet: e, araliklar: bolumAraliklari(satirlar, e.scope.heading) }));
  const kurallar = FORBIDDEN_PATTERNS.map((kural) => ({
    ...kural,
    deneyici: durumsuz(kural.pattern),
  }));

  const ihlaller = [];
  for (let i = 0; i < satirlar.length; i++) {
    const satir = satirlar[i];
    const markerli = satir.includes(INLINE_EXEMPT_MARKER);
    for (const kural of kurallar) {
      if (!kural.deneyici.test(satir)) continue;
      if (markerli && inlineMuafiyetleri.some((e) => muafiyetKapsiyor(e, kural.id))) continue;
      const bolumMuaf = bolumMuafiyetleri.some(
        ({ muafiyet, araliklar }) =>
          muafiyetKapsiyor(muafiyet, kural.id) && araliklar.some((a) => i >= a.start && i <= a.end),
      );
      if (bolumMuaf) continue;
      ihlaller.push({
        file: fileName,
        line: i + 1,
        patternId: kural.id,
        excerpt: satir.trim().slice(0, 160),
      });
    }
  }
  return ihlaller;
}

/**
 * docs katmanını yasak desenlere karşı tarar (yalnız .md; url-policy.md ve node.md
 * DAHİL — bütün-dosya muafiyeti yoktur, muafiyet scanContentForViolations'ta scope'ludur).
 * Dönüş: [{file, line, patternId, excerpt}] — file docsDir'e göre görelidir.
 */
export function scanDocsForViolations(docsDir) {
  const ihlaller = [];
  for (const dosya of collectMarkdownFiles(docsDir)) {
    const goreli = path.relative(docsDir, dosya).split(path.sep).join("/");
    ihlaller.push(...scanContentForViolations(fs.readFileSync(dosya, "utf8"), goreli));
  }
  return ihlaller;
}

/** src altındaki JSON/TS/TSX politika yüzeylerini tarar; test fixture/tooling kapsam dışıdır. */
export function scanSourceForViolations(srcDir) {
  const ihlaller = [];
  const gez = (dizin) => {
    if (!fs.existsSync(dizin)) return;
    for (const girdi of fs.readdirSync(dizin, { withFileTypes: true })) {
      const tam = path.join(dizin, girdi.name);
      if (girdi.isDirectory()) gez(tam);
      else if (girdi.isFile() && /\.(?:json|ts|tsx)$/.test(girdi.name)) {
        const goreli = path.relative(srcDir, tam).split(path.sep).join("/");
        ihlaller.push(...scanContentForViolations(fs.readFileSync(tam, "utf8"), goreli));
      }
    }
  };
  gez(srcDir);
  return ihlaller;
}

/**
 * İçerikte zorunlu kanonik kararların probe'larını doğrular.
 * Dönüş: {ok, missing} — missing eksik probe missingId'leridir (tekilleştirilmiş;
 * prefix ailesi "prefix-ailesi:lst_" gibi üye-bazlı id verir).
 */
export function verifyCanonicalDecisionsContent(content) {
  const missing = [];
  for (const karar of REQUIRED_DECISIONS) {
    for (const probe of karar.probes) {
      if (durumsuz(probe.pattern).test(content)) continue;
      if (!missing.includes(probe.missingId)) missing.push(probe.missingId);
    }
  }
  return { ok: missing.length === 0, missing };
}

/**
 * Kanonik belgeyi okuyup verifyCanonicalDecisionsContent'e sarar.
 * Dosya yoksa tüm probe missingId'leri eksiktir.
 */
export function verifyCanonicalDecisions(urlPolicyPath) {
  if (!fs.existsSync(urlPolicyPath)) {
    const missing = [];
    for (const karar of REQUIRED_DECISIONS)
      for (const probe of karar.probes)
        if (!missing.includes(probe.missingId)) missing.push(probe.missingId);
    return { ok: false, missing };
  }
  return verifyCanonicalDecisionsContent(fs.readFileSync(urlPolicyPath, "utf8"));
}
