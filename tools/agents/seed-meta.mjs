#!/usr/bin/env node
/** seed-meta — Faz B19. meta kümesi (4 doküman düğümü: genel bakış/felsefe/tahta). */
import { D, apply } from "./seed-docs-lib.mjs";

const CONTENT = {
  "app-meta": D(
    "Meta",
    "Meta & Genel Bakış — projenin üst seviye haritası, felsefesi ve yönetici özetini toplayan başlık",
    {
      kap: "yönetici özeti, felsefe ve tahta görünümü gibi yön veren sayfaları barındırır",
      integ: "tüm kümelerin üstünde durur; build/kararlar/edu kümelerine yön verir",
      ai: "AI üst-seviye tutarlılık/eksik özeti önerir; yön kararını insan verir",
      mu: "Meta app'i projenin pusulası niteliğindeki sayfaları toplar",
    },
  ),
  overview: D(
    "Yönetici Özeti",
    "Yönetici özeti — 70+ ürünlük, 9 kategorili Super-ERP / AI-first SaaS framework'ünün master haritası",
    {
      kap: "ürün ailelerini, katmanları (Layer 0-2) ve hedef SaaS clone'larını tek sayfada özetler",
      code: "harita generated katalog verisinden türetilir; elle güncellenmez",
      perf: "büyük harita bölümlenmiş ve lazy çizilir",
      test: "haritadaki ürün/kategori sayıları gerçek düğüm sayımıyla tutarlı mı doğrulanır",
      integ: "app kataloğu, stack/edition haritası ve rakip haritasıyla hizalı",
      ai: "AI kapsam/kategori boşluğu özeti önerir; ürün yol haritası kararını insan verir",
      mu: "Yönetici özeti paydaşa platformun bütününü tek bakışta verir",
    },
  ),
  philosophy: D(
    "Felsefe",
    "Felsefe ve ana prensipler — projenin uyduğu temel kurallar ve bu kararların gerekçesi",
    {
      kap: "test-önce, sözleşme-kararlılığı, AI-sınırı ve sürdürülebilirlik ilkelerini açıklar",
      sec: "güvenlik ilkesi: AI insan onayı olmadan main'e yazamaz; üreten onaylayamaz",
      code: "ilkeler somut kapılara bağlanır (test/tip/lint/a11y); slogan değil mekanizma",
      test: "her ilke bir doğrulanabilir kapıya karşılık gelir mi denetlenir",
      integ: "kararlar (ADR) ve sürdürülebilirlik (sus) kümeleriyle doğrudan ilişkili",
      ai: "AI ilkelere aykırı deseni işaretler; ilke değişikliği kararını insan verir",
      owasp: "güvenli-varsayılan (deny-by-default) ve en-az-ayrıcalık temel ilke",
      mu: "Felsefe sayfası tüm teknik kararların değer çerçevesini verir",
    },
  ),
  board: D(
    "Tahta",
    "Tahta — yeniden yapılandırılmış 5 küme iskeletinin tam doldurulması; her küme ve neyin neden eklendiği",
    {
      kap: "WBS tahtasının küme/sütun yapısını ve her kümenin gerekçesini belgeler",
      code: "tahta düğüm verisinden türetilir; kanban/waterfall görünümü aynı veriyi kullanır",
      perf: "çok kartlı tahta sanal-kaydırma ile akıcı kalır",
      mob: "tahta mobilde tek sütun/yığılmış kart olarak görüntülenir",
      test: "her kümenin beklenen düğüm sayısı gerçekle tutarlı mı doğrulanır",
      integ: "dogfooding-kanban ve build sırası sayfalarıyla ilişkili",
      ai: "AI küme dengesizliği/eksik sütun önerir; tahta yapısı kararını insan verir",
      mu: "Tahta sayfası WBS'in görsel düzenini ve gerekçesini sağlar",
    },
  ),
};

apply("seed-meta", CONTENT);
