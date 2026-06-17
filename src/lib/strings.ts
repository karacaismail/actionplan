/**
 * TR arayüz metinleri — tek dil (Türkçe), ileride i18n için tek noktada toplandı.
 * UI bileşenleri sabit metin gömmek yerine buradan tüketir.
 */
export const t = {
  appTitle: "Eylem Planı",
  appSubtitle: "Stratejik WBS & Görev Yönetimi",
  skipToContent: "İçeriğe atla",
  nav: {
    dashboard: "Gösterge Paneli",
    wbs: "WBS Ağacı",
    board: "Pano & Tablo",
    graph: "Bağımlılık Grafiği",
    search: "Ara",
  },
  actions: {
    exportJSON: "JSON dışa aktar",
    exportCSV: "CSV dışa aktar",
    importFile: "İçe aktar",
    expandAll: "Tümünü aç",
    collapseAll: "Tümünü kapat",
    save: "Kaydet",
    cancel: "İptal",
    edit: "Düzenle",
    toggleTheme: "Tema değiştir",
    back: "Geri",
  },
  detail: {
    dimensions: "Üretim Boyutları (14)",
    phases: "Waterfall Fazları (7)",
    planning: "Planlama & İzleme",
    quality: "Kalite & Kabul",
    dependencies: "Bağımlılıklar & İlişkiler",
    deliverables: "Teslimatlar",
    acceptance: "Kabul Kriterleri (DoD)",
    risks: "Riskler",
    skeletonNotice: "Bu boyut henüz iskelet — içerik sonraki iterasyonda doldurulacak.",
    noContent: "İçerik yok.",
  },
  fields: {
    status: "Durum",
    priority: "Öncelik",
    owner: "Sahip",
    effort: "Efor",
    progress: "İlerleme",
    phase: "Faz",
    level: "Seviye",
    wbsCode: "WBS Kodu",
    tags: "Etiketler",
  },
  empty: {
    selectNode: "Soldan bir görev seçin.",
    noResults: "Sonuç yok.",
  },
  dashboard: {
    total: "Toplam Görev",
    byLevel: "Seviyeye Göre",
    byStatus: "Duruma Göre",
    progress: "Genel İlerleme",
    apps: "Uygulamalar (dağ)",
  },
} as const;
