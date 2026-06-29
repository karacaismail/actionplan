# ADR — Geospatial Görselleştirme: deck.gl + MapLibre (ECharts iş grafikleri için)

Statü: kabul · Kapsam: core (paylaşılan UI SDK) + kernel (geo veri) + vertical (tüketici).
Bağlam: `scale-gis` (PostGIS backend) zaten var; `k-surface` (projeksiyon), `sus-lisans` (AGPL/MIT) ile hizalı.

## 1. Karar

- **ECharts kalır**: iş grafikleri (bar/line/pie/Gantt/ısı-matrisi), dashboard, rapor ve **şematik** harita (düşük hacim choropleth).
- **deck.gl girer**: gerçek **harita + büyük geo veri + etkileşim** (arsa/parsel poligonları, ilan yoğunluğu hexbin/heatmap, m²-fiyat choropleth, 10K-1M+ özellik, pan/zoom/pick). WebGL/GPU, basemap üstünde.
- **Sınır kuralı:** "koordinat + harita + hacim → deck.gl; iş grafiği/şematik → ECharts." ECharts'ın geo modülü ölçekli gerçek haritada kullanılmaz; deck.gl bar chart için kullanılmaz.
- **Basemap:** **MapLibre GL** (BSD-3) + açık tile (OpenFreeMap / kendi tile sunucun) = tam açık zincir. Mapbox/Google SDK = ticari → yalnız editions/commercial katmanı, community değil.

## 2. Katman yerleşimi

- **kernel / `scale-gis`** (backend): PostGIS `geography(Point/Polygon)` alan tipleri + uzamsal indeks (GiST) + uzamsal operatörler (bbox/radius/contains/knn) + üretilen API'de **GeoJSON ve MVT tile (ST_AsMVT)** çıktısı + tenant-kapsamlı uzamsal sorgu (RLS). Ham 100K poligon göndermek yok → **server-side MVT tiling + zoom-LOD + H3 agregasyon**.
- **core / `geo-map-surface`** (Apache, paylaşılan SDK): tek `GeoMapSurface` bileşeni = **deck.gl + MapLibre** sarmalayıcısı; tembel-yüklenen (lazy chunk), temalı, **erişilebilir-fallback'li**. ArcheType sözleşmesinin `linkedSurfaces`'ına eklenen `geo-map` projeksiyonunu (hangi alan harita alanı, hangi metrik renk/kümeleme) okur. Surface AYRI versiyonlanır.
- **vertical / `dist-realestate`** (sahibinden-benzeri): `GeoMapSurface` + `Parcel/Listing` ArcheType'ını besteler; deck.gl'i kendi yazmaz, core'dan tüketir.

## 3. Çelik kurallar (yönergeye işlenir)

- **WCAG 2.2 AAA fallback (zorunlu):** deck.gl canvas/WebGL → erişilemez. Her geo-map Surface, aynı verinin **tablo/liste eşdeğerini** ve "WebGL yok / reduce-data" yolunu SAĞLAMAK zorunda. Harita dekoratif değil; eşdeğer erişilebilir alternatif gates'tedir.
- **Performans:** MVT tile + bbox + zoom-LOD; client deck.gl tile/H3 agregasyonu render eder; ham özellik göndermez. p95 tile < 200ms hedefi.
- **Bundle:** deck.gl+MapLibre ağır (~yüz KB'ler) → mevcut lazy/manualChunks disiplini; yalnız o rotada/Surface'ta tembel-yüklenir, ana pakete girmez (ECharts/React Flow gibi).
- **Lisans:** deck.gl MIT, MapLibre BSD-3 → permissive core'a uyumlu (sus-lisans ile hizalı). Mapbox/Google basemap = editions/commercial.
- **Güvenlik:** uzamsal sorgular tenant-kapsamlı (RLS); koordinat PII'si (tam konum) yetki + maskeleme (yaklaşık konum/grid) ile; tile cache tenant-izole.
- **Test-önce:** uzamsal sorgu (testcontainers + PostGIS), GeoJSON/MVT kontrat testi, Surface a11y-fallback testi, tile-üretim testi.

## 4. WBS karşılığı (bu repoda)

- `scale-gis` (mevcut, zenginleştirildi): PostGIS tip+operatör+**MVT**+tenant uzamsal; deck.gl'in veri kaynağı.
- `geo-map-surface` (yeni, platform-horizontal): deck.gl+MapLibre Surface SDK + WCAG fallback.
- `dist-realestate` (yeni, aday/dikey): ikisini tüketen sahibinden-benzeri dağıtım.

## 5. Non-goals

- ECharts'ı kaldırmak (iş grafikleri onunla kalır).
- Proprietary basemap'i community katmanına koymak.
- WebGL haritayı erişilebilir alternatifsiz yayınlamak.
