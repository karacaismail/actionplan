/**
 * seed-docs-lib — doküman-tipi kümeler (genel/meta/egitim/landx/sus/build/edu/kararlar) için ortak yardımcı.
 * Bunlar özellik değil DOKÜMAN/KARAR/EĞİTİM sayfaları; 14 boyut "bu konunun X açısı" olarak doldurulur.
 * D(P, T, o): P = sayfaya-özel benzersiz önek (çapraz-tekrarı önler), T = başlık/konu, o = sayfaya-özel açılar.
 * Tüm maddeler P-önekli → benzersiz; her boyutta ≥1 sınır-dışı (allowlist-dışı) madde; yasak imza yok.
 */
export const ECA_BOUND = "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
export const AI_B1 = "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
export const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

const g = (v, d) => (v && String(v).trim() ? v : d);

export const D = (P, T, o = {}) => ({
  featureDefs: [
    `${P}: ${T}`,
    `${P} kapsamı: ${g(o.kap, "bu sayfanın tanımladığı konuyu ve sınırlarını açıklar")}`,
    `${P} bu eylem planında bir WBS görevi (sayfa) olarak izlenir`,
  ],
  security: [
    `${P} güvenlik açısı: ${g(o.sec, "ilgili veriye erişim tenant kapsamında ve rol bazlı tutulur")}`,
    `${P} hassas bilgi gerektiğinde maskelenir`,
    `${P} ilgili kararlar denetlenebilir biçimde kaydedilir`,
  ],
  codeOptimization: [
    `${P} yapısı: ${g(o.code, "tipli ve sürümlü sözleşmeyle ifade edilir")}`,
    `${P} tekrar eden mantık paylaşılan yardımcıya alınır`,
    `${P} okunabilir ve test edilebilir kalır`,
  ],
  securityOptimization: [
    `${P} en-az-ayrıcalık ilkesine uyar`,
    `${P} değişikliği sürümlü ve izlenir`,
    `${P} girdi sınırda doğrulanır`,
  ],
  performance: [
    `${P} performans açısı: ${g(o.perf, "ağır iş asenkron yapılır, sonuç uygun olduğunda önbelleğe alınır")}`,
    `${P} sık erişim indeksli/önbellekli tasarlanır`,
    `${P} büyük veride sayfalı işlenir`,
  ],
  mobileApps: [
    `${P} mobil açısı: ${g(o.mob, "dar ekranda tek sütun ve okunur kalır")}`,
    `${P} mobil istemci aynı sözleşmeyi tüketir`,
    `${P} bildirim/onay gerektiğinde push ile iletilir`,
  ],
  wcag: [
    `${P} erişilebilirlik: ${g(o.wcag, "WCAG 2.2 AAA hedeflenir, biçim ve durum metinle anlatılır")}`,
    `${P} durumu yalnız renkle değil metinle bildirilir (kontrast 7:1)`,
    `${P} klavye ve ekran okuyucu ile kullanılabilir`,
  ],
  deployment: [
    `${P} dağıtım açısı: ${g(o.dep, "sürümlü yayınlanır ve geri-alınabilir")}`,
    `${P} CI kapılarından geçtikten sonra yayınlanır`,
    `${P} shared hosting ortamında da çalışabilir`,
  ],
  eca: [
    ECA_BOUND,
    `${P} olayı: ${g(o.eca, "ilgili durum değiştiğinde bağlı akış tetiklenir")} (idempotent, zincir ≤6)`,
    `${P} bağımsız otomasyon tutmaz; üst kurala bağlanır`,
  ],
  aiAgents: [
    AI_B1,
    AI_B2,
    `${P} — ${g(o.ai, "AI özet/öneri/taslak üretebilir; kararı ve onayı ilgili insan verir")}`,
  ],
  testing: [
    `${P} doğrulama: ${g(o.test, "kabul kriterleri ve kenar durumları kontrol edilir")}`,
    `${P} ilgili senaryolar gözden geçirilir`,
    "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
  ],
  owasp: [
    `${P} OWASP açısı: ${g(o.owasp, "A01 erişim kontrolü ve A09 loglama dikkate alınır")}`,
    `${P} kritik işlem denetim izine yazılır`,
    `${P} girdi doğrulama ile enjeksiyon daraltılır`,
  ],
  integration: [
    `${P} ilişki: ${g(o.integ, "ilgili sayfa ve modüllerle tutarlı bağlanır")}`,
    `${P} tipli arayüzle bağlanır`,
    `${P} sözleşme değişimi geriye uyumlu yönetilir`,
  ],
  moduleUsage: [
    `${P} — ${g(o.mu, "bu doküman sayfası ilgili kümenin parçası olarak kullanılır")}`,
  ],
});

/** xdim — x-kırılım düğümleri için (atom/element/molecule/stone): tüm maddeler P-önekli benzersiz. */
export const xdim = (P, what) => ({
  featureDefs: [`${P}: ${what}`, `${P} üst başlığın alt-detayı; tek sorumluluk`, `${P} örnek dal — granülerlikteki yerini gösterir`],
  security: [`${P} üst kümenin tenant izolasyonuna uyar`, `${P} hassas veri sınırda korunur`, `${P} kişisel veri üst katmanda maskelenir`],
  codeOptimization: [`${P} saf/idempotent tasarlanır`, `${P} üst seviyeyle tipli arayüz`, `${P} tekrar eden mantık paylaşılan yardımcıya`],
  securityOptimization: [`${P} en az ayrıcalıkla çalışır`, `${P} girdi normalizasyonu ile enjeksiyon daraltılır`, `${P} değişikliği sürümlü`],
  performance: [`${P} çıktısı önbelleklenebilir`, `${P} tembel başlatılır`, `${P} küçük serileştirilebilir çıktı`],
  mobileApps: [`${P} UI'si varsa mobilde tek sütun`, `${P} bağımsız çalışabilir`, `${P} dar ekranda okunur`],
  wcag: [`${P} etkileşimi klavye erişimli ve adlandırılmış`, `${P} durumu metinle bildirilir (kontrast 7:1)`, `${P} hata mesajı ilişkilendirilmiş`],
  deployment: [`${P} üst başlıkla dağıtılır`, `${P} üst yetenekle ölçeklenir`, `${P} shared hosting'de istemci-içi çalışabilir`],
  eca: [ECA_BOUND, `${P} girdisi geçersiz → sınırda reddet + üst akışa hata (idempotent, zincir ≤6)`, `${P} bağımsız otomasyon tutmaz; üst kurala bağlanır`],
  aiAgents: [AI_B1, AI_B2, `${P} tarifini AI önerebilir; kararı insan verir`],
  testing: [`${P} için birim + üst sözleşme entegrasyon testi`, `${P} sınır/erişilebilirlik mikro-yolculuğu`, "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır"],
  owasp: [`${P}: A03 girdi sınırda doğrulanır`, `${P}: A04 en-az-ayrıcalık tasarım`, `${P}: kabul/red izlenir`],
  integration: [`${P} üst başlığa tipli arayüzle bağlanır`, `${P} sözleşmeyi tüketir`, `${P} çıktısı üst akışta kullanılır`],
  moduleUsage: [`${P} bağımsız sunulmaz; üst başlık içinde kullanılır`],
});

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "generated", "nodes");

/** apply — CONTENT'i diske uygular (status=filled, provenance=swarm). */
export function apply(label, CONTENT) {
  let applied = 0, skipped = 0;
  for (const [id, dims] of Object.entries(CONTENT)) {
    const fp = path.join(NODES, `${id}.json`);
    if (!fs.existsSync(fp)) { console.warn(`[${label}] atlandı (dosya yok): ${id}`); skipped++; continue; }
    const n = JSON.parse(fs.readFileSync(fp, "utf8"));
    for (const [k, items] of Object.entries(dims)) {
      if (!n.dimensions?.[k]) continue;
      n.dimensions[k].items = items;
      n.dimensions[k].status = "filled";
      n.dimensions[k].provenance = "swarm";
    }
    fs.writeFileSync(fp, `${JSON.stringify(n, null, 2)}\n`);
    applied++;
  }
  console.log(`[${label}] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`);
}
