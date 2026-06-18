#!/usr/bin/env node
/** seed-genel — Faz B19. genel kümesi (2 doküman düğümü). */
import { D, apply } from "./seed-docs-lib.mjs";

const CONTENT = {
  "app-genel": D("Genel", "Genel — kümeye girmeyen yatay/denetim sayfalarının toplandığı genel başlık", {
    kap: "app→modül matrisi gibi tüm platformu kesen denetim görünümlerini barındırır",
    sec: "denetim görünümleri tüm tenant'ları değil yalnız yetkili kapsamı gösterir",
    integ: "app/modül kataloğu, kararlar ve build kümeleriyle çapraz bağlı",
    ai: "AI matris/tutarlılık raporu önerir; kapsam ve yayın kararını insan verir",
    mu: "Genel app'i platform-geneli denetim sayfalarını toplar",
  }),
  "app-modul-matrisi": D("App-Modül Matrisi", "App → Modül Matrisi — hangi app hangi modülü/ArcheType'ı Core veya Opsiyonel kullanır (tek denetlenebilir yüzey)", {
    kap: "her app satırı × her modül sütunu; hücre Core/Opsiyonel/yok değerini taşır",
    code: "matris generated katmandan türetilir; elle tutulmaz (tek doğruluk kaynağı)",
    sec: "matris yalnız yapı bilgisini gösterir, müşteri verisi içermez",
    perf: "büyük matris sayfalı/sanal-kaydırmalı gösterilir",
    test: "matristeki her Core ilişki gerçek bağımlılık grafiğiyle tutarlı mı doğrulanır",
    integ: "app kataloğu, modül kayıt defteri (k-mod-l) ve bağımlılık DAG'ı ile beslenir",
    ai: "AI eksik/çelişkili Core-Opsiyonel ilişkisi tespiti önerir; matris kararını mimari ekip verir",
    mu: "App-Modül Matrisi platformun kapsam denetimini tek yüzeyde sağlar",
  }),
};

apply("seed-genel", CONTENT);
