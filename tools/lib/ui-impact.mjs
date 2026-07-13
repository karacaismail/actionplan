/**
 * ui-impact — UI etki sınıflandırıcısı + uiDelivery kural aynası + conformance kapı motoru.
 * Kaynak yönerge: docs/storybook-master-component-integration-directive.md §2/§3/§12/§13.
 * Şema tarafı: src/schemas/ui-delivery.ts (zod). Fark bulunursa şema kazanır, bu ayna düzeltilir
 * (dimension-semantics/score.mjs "birebir ayna" deseni). Kapı + vitest aynı modülü import eder.
 *
 * Kapsam sınırı: bu sınıflandırıcı İÇERİK/WBS sinyallerini (§2.2) inceler. Codebase sinyalleri
 * (§2.1 — *.tsx/*.scss/story dosyaları) implementation reposunun storybook-ci kapısındadır;
 * iki sınıflandırma çelişirse yüksek etki kazanır ve insan review'u ister (§2.3).
 *
 * v3 (SB-ROOT — docs/storybook-root-integration-gap-report.md §3/§8/§9): uiArtifactRole
 * türetimi ("UI hakkında konuşan" != "UI üreten"), gate adaylık daraltması +
 * MIGRATION_INCOMPLETE sonucu, ratchet bütünlük kilidi ve Master Component registry FK'sı.
 */
import { createHash } from "node:crypto";

/** Öncelik sırası: yüksek kazanır (§2.3). */
export const UI_IMPACT_ORDER = ["none", "indirect", "direct", "master-component", "surface"];

const MASTER_STORY_STATES = [
  "default",
  "hover",
  "focus-visible",
  "disabled",
  "loading",
  "empty",
  "error",
];

const GENERIC_UI_REASON =
  /^(n\/?a|yok|gerek(siz| yok)|uygulanmaz|backend( işi)?|frontend değil|geçersiz|-+)\.?$/i;

/** İçerik sinyal desenleri (§2.2). Kelime sınırlı; Türkçe ek yanlış-pozitifini azaltır. */
const SIGNAL_PATTERNS = {
  surface: [/\bsurface\b/i, /kullanıcı yolculuğu/i, /composition story/i, /yüzey kompozisyon/i],
  "master-component": [
    /master component/i,
    /component[- ]library/i,
    /\bortak (bileşen|component)/i,
    /design token/i,
    /tema token/i,
    /token seti/i,
  ],
  direct: [
    /\bekran(ı|ında|a)?\b/i,
    /\bgörünüm(ü|ünde)?\b/i,
    /\btablo\b/i,
    /\btable\b/i,
    /\bgrid\b/i,
    /\bboard\b/i,
    /\bdashboard\b/i,
    /\bpanel(i|de)?\b/i,
    /\bwizard\b/i,
    /\bbuton\b/i,
    /\bbutton\b/i,
    /\bwidget\b/i,
    /\bstorybook\b/i,
    /\bfrontend\b/i,
    /\bUI\b/,
    /\bdialog\b/i,
    /\bchart\b/i,
    /boş[- ]durum/i,
    /empty[- ]state/i,
    /\bnavigasyon\b/i,
    /\bnavigation\b/i,
    /\bform ekranı\b/i,
    /\bsayfa(sı)?\b/i,
  ],
  indirect: [
    /hata kodu/i,
    /error (schema|message|sözleşme)/i,
    /hata (sözleşme|mesaj)/i,
    /field mapping/i,
    /permission (projection|state)/i,
    /\benum\b/i,
    /\bi18n\b/i,
    /\blocale\b/i,
    /\bRTL\b/,
    /kullanıcı mesaj/i,
    /api sözleşme/i,
    /surfaceProjection/i,
    /validation (message|mesaj)/i,
  ],
};

function nodeText(node) {
  return [
    node.title ?? "",
    node.summary ?? "",
    (node.tags ?? []).join(" "),
    (node.deliverables ?? []).join(" "),
    (node.acceptanceCriteria ?? []).join(" "),
  ].join("\n");
}

/**
 * İçerik sinyallerinden UI etkisi çıkarımı (§2/§2.2).
 * Dönüş: { impact, signals[] } — signals insan-okur teşhis içindir.
 */
export function classifyUiImpact(node) {
  const text = nodeText(node);
  const signals = [];

  for (const [impact, patterns] of Object.entries(SIGNAL_PATTERNS)) {
    for (const p of patterns) {
      const m = text.match(p);
      if (m) signals.push({ impact, match: m[0] });
    }
  }

  // standardRefs UI bağları (§2.2): tasarım/bileşen/UX ref'i dolu düğüm UI işi beyan etmiştir.
  const refs = node.standardRefs ?? {};
  for (const key of ["uiComponentRef", "designSystemRef", "uxStandardRef"]) {
    const v = refs[key];
    if (typeof v === "string" && v.trim() !== "")
      signals.push({ impact: "direct", match: `standardRefs.${key}` });
  }

  // Var olan uiDelivery beyanı (applies=true) kendisi bir sinyaldir.
  if (node.uiDelivery && node.uiDelivery.applies === true)
    signals.push({ impact: node.uiDelivery.impact, match: "uiDelivery.applies" });

  let impact = "none";
  for (const s of signals) {
    if (UI_IMPACT_ORDER.indexOf(s.impact) > UI_IMPACT_ORDER.indexOf(impact)) impact = s.impact;
  }
  return { impact, signals };
}

/**
 * Governs-işaret desenleri (SB-ROOT-2 / gap §3): yönetişim belgesi kimliği YALNIZ title/tags'te
 * aranır — summary'deki "sözleşme" changes-ui-contract içerik sinyalidir, governs işareti değil.
 */
const GOVERNS_MARKERS =
  /(adr|standar[dt]|yönerge|directive|sözleşme|contract|policy|plan|rapor|gap|denetim|eleştiri)/i;

/**
 * uiArtifactRole türetimi (SB-ROOT-2, classifier v3 — gap §3): kelime geçirmek != UI üretmek.
 * Öncelik: (1) düğümdeki beyan (source=declared), (2) roleRegistry açık kararı
 * (source=registry; ui-artifact-roles.json'un {nodeId: role} aynası), (3) heuristik
 * (source=heuristic): governs-işaretli VE UI-sinyalli düğüm governs-ui; impact=indirect →
 * changes-ui-contract; direct/master-component/surface → produces-ui; none → no-ui.
 * Dönüş: { role, source, signals } — signals classifyUiImpact teşhis çıktısıdır.
 */
export function deriveUiArtifactRole(node, roleRegistry) {
  const { impact, signals } = classifyUiImpact(node);

  const beyan = node.uiArtifactRole;
  if (typeof beyan === "string" && beyan !== "")
    return { role: beyan, source: "declared", signals };

  const kayit = roleRegistry?.[node.id];
  if (typeof kayit === "string" && kayit !== "")
    return { role: kayit, source: "registry", signals };

  let role = "no-ui";
  if (impact !== "none") {
    const kimlikMetni = `${node.title ?? ""}\n${(node.tags ?? []).join(" ")}`;
    if (GOVERNS_MARKERS.test(kimlikMetni)) role = "governs-ui";
    else if (impact === "indirect") role = "changes-ui-contract";
    else role = "produces-ui";
  }
  return { role, source: "heuristic", signals };
}

/**
 * Kapı sinyal etiketleri (SB-GOV §11): v2 governance ihlal mesajlarına gömülü makine-okunur
 * işaretler. evaluateUiDeliveryGate bu etiketleri violation + warning mesajlarından toplar.
 */
const GATE_SIGNAL_TAGS = [
  "BUDGET_EXCEEDED",
  "SECURITY_REVIEW_REQUIRED",
  "MANUAL_A11Y_REQUIRED",
  "OWNER_MISSING",
  "FIXTURE_DRIFT",
];

/** Mesaj listesinden benzersiz sinyal listesi türetir (sıra GATE_SIGNAL_TAGS ile sabit). */
function deriveGateSignals(messages) {
  return GATE_SIGNAL_TAGS.filter((tag) => messages.some((m) => m.includes(tag)));
}

/**
 * uiDelivery kural aynası (şema superRefine'ın JSON-düzey karşılığı) + aday-yokluk denetimi.
 * v1 kurallar (S14.x) + v2 governance kuralları (U0/U1/U2/U3/U4/U11/U12/U22/U24 —
 * docs/storybook-unknown-unknowns-gap-report.md §10). Dönüş: ihlal mesajları dizisi (boş = temiz).
 * registries (opsiyonel, SB-ROOT-5): { masterComponents: Set<string> } verilirse
 * masterComponentRefs FK denetlenir; verilmezse atlanır (tek-parametreli çağrı geriye uyumu).
 */
export function validateUiDelivery(node, registries) {
  const v = [];
  const id = node.id ?? "?";
  const d = node.uiDelivery;
  const classified = classifyUiImpact(node);

  if (!d) {
    if (classified.impact !== "none")
      v.push(
        `${id}: UI etkisi sınıflandı (impact=${classified.impact}; sinyal: ${classified.signals
          .slice(0, 3)
          .map((s) => s.match)
          .join(", ")}) ama uiDelivery sözleşmesi yok`,
      );
    return v; // uiDelivery'siz backend-only düğüm temiz geçer (§1.5/§8)
  }

  if (d.applies === false) {
    if (d.impact !== "none") v.push(`${id}: applies=false iken impact 'none' olmalı`);
    if (d.componentKind !== "none") v.push(`${id}: applies=false iken componentKind 'none' olmalı`);
    const reason = String(d.reason ?? "").trim();
    if (reason.length < 12 || GENERIC_UI_REASON.test(reason))
      v.push(`${id}: UI N/A gerekçesi somut olmalı; jenerik: "${reason}"`);
  }
  if (d.impact === "none" && d.applies === true)
    v.push(`${id}: impact=none iken applies=false olmalı`);

  if (d.applies && d.impact !== "none") {
    if ((d.storyRefs ?? []).length === 0 && (d.masterComponentRefs ?? []).length === 0)
      v.push(`${id}: UI etkili işte story veya masterComponent bağı zorunlu`);
  }

  if (d.impact === "master-component") {
    if (d.componentKind !== "master")
      v.push(`${id}: impact=master-component iken componentKind 'master' olmalı`);
    const states = d.requiredStoryStates ?? [];
    const missing = MASTER_STORY_STATES.filter((s) => !states.includes(s));
    if (missing.length > 0) v.push(`${id}: Master state matrisi eksik: ${missing.join(", ")}`);
  }

  if (d.impact === "surface") {
    if ((d.storyRefs ?? []).length === 0)
      v.push(`${id}: surface etkisinde composition story zorunlu`);
    if ((d.e2eRefs ?? []).length === 0) v.push(`${id}: surface etkisinde E2E ref zorunlu`);
  }

  if (d.reviewStatus === "approved") {
    if (!d.reviewer || String(d.reviewer).trim() === "")
      v.push(`${id}: approved review reviewer olmadan geçersiz`);
    if (!d.storybookUrl && (d.visualEvidenceRefs ?? []).length === 0)
      v.push(`${id}: approved review Storybook evidence olmadan geçersiz`);
  }

  for (const ref of d.storyRefs ?? []) {
    if (!String(ref).includes(".stories."))
      v.push(`${id}: story ref'i story dosyası olmalı (*.stories.*): "${ref}"`);
  }

  if (d.deprecation?.deprecated) {
    if (!String(d.deprecation.replacementRef ?? "").trim())
      v.push(`${id}: deprecated component replacementRef olmadan reddedilir`);
    if (!String(d.deprecation.migrationStoryRef ?? "").trim())
      v.push(`${id}: deprecated component migrationStoryRef olmadan reddedilir`);
  }

  // ── Master Component registry FK (SB-ROOT-5 / F-P1.1): serbest string referans biter.
  // registries.masterComponents verilmişse her masterComponentRef kayıtlı kimlik olmalıdır.
  const kayitliMasterlar = registries?.masterComponents;
  if (kayitliMasterlar) {
    for (const ref of d.masterComponentRefs ?? []) {
      if (!kayitliMasterlar.has(ref))
        v.push(`${id}: kayıtsız master component referansı "${ref}" — registry kaydı yok (F/P1.1)`);
    }
  }

  // ── v2 governance aynası (SB-GOV; gap-report §10) — yalnız applies=true sözleşmede işler.
  // AYNA KURALI: şema (src/schemas/ui-delivery.ts) her kuralı KOŞULSUZ denetler (default
  // bütçe 40 dahil); ayna da aynıdır — fark bulunursa şema kazanır. Geriye uyum fixture
  // tasarımıyla sağlanır: v1-biçimli küçük sözleşmeler (az state, tek locale) default
  // bütçenin içinde kalır; büyük matris bütçe beyanı + gerekçe ister (U0'ın amacı).
  if (d.applies === true) {
    const riskClass = d.riskClass ?? "medium";
    const yuksekRisk = riskClass === "critical" || riskClass === "high";

    // U0 — kapsam bütçesi: state x viewport x locale x theme kombinasyonu bütçeyi aşamaz
    // (beyansız sözleşmede default 40 uygulanır — şema ile birebir).
    {
      const kombinasyon =
        (d.requiredStoryStates ?? []).length *
        Math.max(1, (d.requiredViewports ?? []).length) *
        Math.max(1, (d.requiredLocales ?? []).length) *
        Math.max(1, (d.requiredThemes ?? []).length);
      const maxStories = d.coverageBudget?.maxStories ?? 40;
      if (kombinasyon > maxStories)
        v.push(
          `${id}: kapsam bütçesi aşıldı (BUDGET_EXCEEDED): ${kombinasyon} story kombinasyonu > coverageBudget.maxStories=${maxStories} (U0)`,
        );
    }

    // U1 — fixture drift beyanı: critical/high işte fingerprint referansı zorunlu.
    if (yuksekRisk && !String(d.fixtureContract?.fingerprintRef ?? "").trim())
      v.push(
        `${id}: ${riskClass} riskte fixtureContract.fingerprintRef beyanı zorunlu (FIXTURE_DRIFT, U1)`,
      );

    // U2 — baseline governance: approved + görsel evidence üçlü kayıt ister;
    // baseline onaycısı review'u yapandan ayrı olmalı (owner/design-reviewer ayrılığı).
    if ((d.visualEvidenceRefs ?? []).length > 0 && d.reviewStatus === "approved") {
      for (const alan of ["approvedBy", "reason", "taskRef"]) {
        if (!String(d.baselineGovernance?.[alan] ?? "").trim())
          v.push(
            `${id}: approved + görsel evidence baselineGovernance.${alan} kaydı olmadan geçersiz (U2)`,
          );
      }
      const approvedBy = String(d.baselineGovernance?.approvedBy ?? "").trim();
      if (approvedBy && approvedBy === String(d.reviewer ?? "").trim())
        v.push(
          `${id}: baselineGovernance.approvedBy reviewer ile aynı olamaz — owner/design-reviewer ayrılığı (U2)`,
        );
    }

    // U3 — güvenlik bağı: critical/high işte permission story'nin backend authz karşılığı zorunlu.
    if (
      yuksekRisk &&
      (d.securityLinkage?.permissionStoryRefs ?? []).length > 0 &&
      (d.securityLinkage?.backendAuthzTestRefs ?? []).length === 0
    )
      v.push(
        `${id}: güvenlik incelemesi eksik (SECURITY_REVIEW_REQUIRED): ${riskClass} riskte permission story'ye karşılık securityLinkage.backendAuthzTestRefs boş (U3)`,
      );

    // U4/U27 — PII: fixture'da gerçek veri her risk sınıfında reddedilir.
    if (d.fixtureContract?.containsRealData === true)
      v.push(
        `${id}: fixtureContract.containsRealData=true — fixture'da gerçek veri reddedilir (U4/U27)`,
      );

    // U11 — manuel a11y: critical/high manuel review ister; critical ayrıca otomatik a11y testi ister.
    if (yuksekRisk && !String(d.manualA11yReviewRef ?? "").trim())
      v.push(
        `${id}: manuel erişilebilirlik incelemesi eksik (MANUAL_A11Y_REQUIRED): ${riskClass} riskte manualA11yReviewRef zorunlu (U11)`,
      );
    if (riskClass === "critical" && (d.a11yTestRefs ?? []).length === 0)
      v.push(`${id}: critical riskte a11yTestRefs boş olamaz (U11)`);

    // U12 — performans profili: veri-yoğun + critical/high işte profil referansı zorunlu.
    if (d.dataDense === true && yuksekRisk && !String(d.performanceProfileRef ?? "").trim())
      v.push(`${id}: dataDense + ${riskClass} riskte performanceProfileRef zorunlu (U12)`);

    // U22 — break-glass: kullanım ancak audit + remediation kaydıyla meşrudur.
    if (
      d.breakGlass?.used === true &&
      (!String(d.breakGlass?.auditRef ?? "").trim() ||
        !String(d.breakGlass?.remediationTaskRef ?? "").trim())
    )
      v.push(
        `${id}: breakGlass.used=true auditRef ve remediationTaskRef kaydı olmadan reddedilir (U22)`,
      );

    // U24 — owner kaydı: approved sözleşme sahipsiz olamaz (koşulsuz — şema ile birebir).
    if (d.reviewStatus === "approved" && !String(d.ownerRef ?? "").trim())
      v.push(
        `${id}: sahip kaydı eksik (OWNER_MISSING): approved sözleşmede ownerRef zorunlu (U24)`,
      );
  }

  return v;
}

/**
 * Conformance kapı motoru v3 (§12/§13 ratchet + SB-ROOT-3 kök-entegrasyon kapanışı).
 * Adaylık uiArtifactRole üzerinden daraltılır: yalnız produces-ui / changes-ui-contract
 * uiDelivery sözleşmesine zorlanır — "UI hakkında konuşan" (governs-ui/consumes-ui) aday değildir.
 * Sonuç önceliği: FAIL > REVIEW_REQUIRED > MIGRATION_INCOMPLETE > PASS > NO_CANDIDATES.
 *  - FAIL: baseline dışı ihlal (kararsız düğümler gerçek ihlali gizleyemez).
 *  - REVIEW_REQUIRED: tam-sözleşmeli adayda insan kabulü bekleyen in-review.
 *  - MIGRATION_INCOMPLETE: legacy warning>0 VEYA açık-karar borçlusu (undecided)>0 —
 *    susturulmuş baseline ve kararsız corpus hiçbir koşulda PASS'e aklanamaz.
 *  - PASS: en az bir temiz aday + 0 warning + 0 undecided.
 *  - NO_CANDIDATES: aday yok VE undecided===0.
 * migration sayacı: decided = açık karar taşıyan düğümler (beyanlı uiArtifactRole VEYA
 * uiDelivery VEYA registry kaydı); undecided = açık karar taşımayan UI-SİNYALLİ düğümler.
 * Heuristik no-ui (sıfır UI sinyali) düğüm karar borcu doğurmaz: sıfır-UI backend corpus'u
 * NO_CANDIDATES kalır (S14.9 geriye uyumu); sinyalsiz düğümün açık kararı migration
 * dalgalarında ui-artifact-roles.json'a yazılır.
 * opts.roleRegistry: {nodeId: rol} açık karar haritası; opts.masterComponents: Set<masterId>
 * — verilirse FK denetimi validateUiDelivery'ye geçirilir.
 */
export function evaluateUiDeliveryGate(nodes, baseline = { allowedWarnings: [] }, opts = {}) {
  const allowed = new Set(baseline?.allowedWarnings ?? []);
  const { roleRegistry, masterComponents } = opts;
  const registries = masterComponents ? { masterComponents } : undefined;

  const violations = [];
  const warnings = [];
  const reviewPending = [];
  let candidates = 0;
  let decided = 0;
  let undecided = 0;

  for (const n of nodes) {
    const karar = deriveUiArtifactRole(n, roleRegistry);
    const acikKarar = karar.source !== "heuristic" || n.uiDelivery != null;
    if (acikKarar) decided += 1;
    else if (karar.role !== "no-ui") undecided += 1;

    if (karar.role !== "produces-ui" && karar.role !== "changes-ui-contract") continue;
    candidates += 1;

    // An explicit/registry role is authoritative even when lexical impact is none. Do not allow a
    // declared producer or contract-changer to bypass uiDelivery merely because its prose is
    // generated or intentionally terse.
    let viols;
    if (n.uiDelivery == null) {
      viols = [`${n.id}: uiArtifactRole=${karar.role} ama uiDelivery sözleşmesi yok`];
    } else if (n.uiDelivery.applies !== true || n.uiDelivery.impact === "none") {
      viols = [
        `${n.id}: uiArtifactRole=${karar.role} için uiDelivery applies=true ve impact!=none olmalı`,
      ];
    } else {
      viols = validateUiDelivery(n, registries);
    }
    if (viols.length > 0) {
      if (allowed.has(n.id)) warnings.push(...viols.map((m) => `[legacy] ${m}`));
      else violations.push(...viols);
      continue;
    }
    if (n.uiDelivery?.reviewStatus === "in-review") reviewPending.push(n.id);
  }

  let result;
  if (violations.length > 0) result = "FAIL";
  else if (reviewPending.length > 0) result = "REVIEW_REQUIRED";
  else if (warnings.length > 0 || undecided > 0) result = "MIGRATION_INCOMPLETE";
  else if (candidates > 0) result = "PASS";
  else result = "NO_CANDIDATES";

  return {
    result,
    candidates,
    violations,
    warnings,
    reviewPending,
    migration: { decided, undecided },
    signals: deriveGateSignals([...violations, ...warnings]),
  };
}

/**
 * Ratchet bütünlük kilidi (SB-ROOT-4 / E-P0.4): baseline'a yeni ID eklemek delinemez olur.
 * originAllowedWarnings ilk baseline'ın immutable kopyasıdır; originChecksum =
 * sha256(JSON.stringify(originAllowedWarnings)). allowedWarnings origin'in alt kümesi olmalıdır
 * (azalma serbest, ekleme RATCHET_TAMPERED). Eski biçim baseline'da (originChecksum yok)
 * ok=false + "origin kilidi eksik" problemi döner — kilit geçişi ana oturumda basılır.
 */
export function verifyBaselineIntegrity(baseline) {
  const problems = [];
  const b = baseline ?? {};

  if (typeof b.originChecksum !== "string" || b.originChecksum.trim() === "") {
    problems.push(
      "origin kilidi eksik: originChecksum/originAllowedWarnings alanları tanımsız — ratchet bütünlüğü doğrulanamaz",
    );
    return { ok: false, problems };
  }

  const origin = Array.isArray(b.originAllowedWarnings) ? b.originAllowedWarnings : [];
  const hesaplanan = createHash("sha256").update(JSON.stringify(origin)).digest("hex");
  if (hesaplanan !== b.originChecksum)
    problems.push(
      `originChecksum uyuşmuyor: origin listesi oynanmış görünüyor (hesaplanan ${hesaplanan}, kayıtlı ${b.originChecksum})`,
    );

  const originSet = new Set(origin);
  const eklenen = (b.allowedWarnings ?? []).filter((id) => !originSet.has(id));
  if (eklenen.length > 0)
    problems.push(
      `RATCHET_TAMPERED: allowedWarnings origin'in alt kümesi değil — sonradan eklenen id'ler: ${eklenen.join(", ")} (liste yalnız daralabilir)`,
    );

  return { ok: problems.length === 0, problems };
}
