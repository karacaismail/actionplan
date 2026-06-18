#!/usr/bin/env node
/** seed-egitim — Faz B19. egitim kümesi (6 vibecoding eğitim/rehber düğümü). */
import { D, apply } from "./seed-docs-lib.mjs";

const CONTENT = {
  "app-egitim": D("Eğitim Rehberi", "Egitim — üç kişilik 60+ ekibin vibecoding ile üretime geçişini anlatan rehber kümesi", {
    kap: "başlangıç rotası, faz haritası, prompt kütüphanesi ve yetkinlik modelini toplar",
    integ: "edu (kavram üniteleri) ve build (inşa sırası) kümeleriyle köprü kurar",
    ai: "AI rehber adımı/alıştırma önerir; öğrenme yolu kararını ekip verir",
    mu: "Eğitim app'i ekibin üretim-öncesi hazırlık sayfalarını toplar",
  }),
  "edu-baslangic-rotasi": D("Başlangıç Rotası", "Buradan Başla — Gün 1 İlk Çalışan Kanıt: ilk 90 dakikada doğru repo, tek küçük hedef, çalışan test, yerel ayağa kaldırma", {
    kap: "yeni başlayanın ilk 90 dakikasını adım adım çalışan kanıta götürür",
    code: "tek küçük hedef + çalışan test ilkesi; büyük kapsam değil ilk yeşil test",
    test: "ilk gün çıktısı: yerelde geçen en az bir test (kanıt)",
    dep: "yerel ayağa kaldırma + repo erişimi ilk gün doğrulanır",
    integ: "edu-faz-haritasi ve build-sequence ile sıralı ilerler",
    ai: "AI ilk görev için scaffold/test taslağı önerir; hedef seçimini ekip yapar",
    mu: "Başlangıç rotası ekibin Gün 1 somut çıktısını tanımlar",
  }),
  "edu-faz-haritasi": D("Faz Haritası", "Vibecoding × İnşa Sırası — Faz Haritası: hangi üniteyi bitirince hangi inşa fazında AI ile güvenle üretilebilir (u01–u25 ↔ Faz 0-7)", {
    kap: "eğitim ünitelerini inşa fazlarına eşler (önkoşul haritası)",
    code: "her faz için gerekli ünite önkoşulu bildirimsel listelenir",
    test: "bir faza geçiş için ilgili ünitelerin kanıt seviyesi karşılanmış mı kontrol edilir",
    integ: "edu üniteleri ve build fazları arasında bağ kurar",
    ai: "AI eksik önkoşul ünitesi uyarısı önerir; faz geçiş kararını ekip verir",
    mu: "Faz haritası öğrenme ile inşa sırasını senkronlar",
  }),
  "edu-prompt-kutuphanesi": D("Prompt Kütüphanesi", "Kopyala–Çalıştır Prompt Kütüphanesi: Claude/Cursor/Antigravity için başlangıç, test-önce üretim, bağımsız review ve CI düzeltme prompt'ları", {
    kap: "yeniden kullanılabilir prompt şablonlarını kategorilere ayırır",
    sec: "prompt'lar sır/anahtar içermez; bağlam güvenli verilir",
    code: "prompt'lar test-önce ve review-ayrı ilkesini kalıplaştırır",
    test: "her prompt beklenen çıktı türüyle (test/diff/review) etiketlenir",
    integ: "AGENTS/CLAUDE bağlam paketi (adr-0012) ile uyumlu",
    ai: "AI bu prompt'larla çalışır; üreten-onaylayamaz ilkesi gereği review ayrı prompt'la insanca yapılır",
    mu: "Prompt kütüphanesi vibecoding'in günlük çalışma aracıdır",
  }),
  "edu-waterfall-yol-haritasi": D("Waterfall Yol Haritası", "Waterfall ile Enterprise-Ready Yol Haritası: başla → ilerle → şelale fazlarıyla geliştir → her fazın bitiş kapısı", {
    kap: "fazlı (waterfall) ilerleme ve her fazın çıkış kapısını tanımlar",
    code: "faz çıkış kapısı somut kanıt (test/doküman/review) gerektirir",
    test: "her faz Bitti-Tanımı (DoD) ile kapanır",
    dep: "son faz CI→Pages/sunucu dağıtımı ile yayınlanır",
    integ: "build-sequence ve edu-faz-haritasi ile hizalı",
    ai: "AI faz kapısı kontrol listesi önerir; faz kapanış kararını ekip/insan verir",
    mu: "Waterfall yol haritası ekibin uçtan uca sürecini çerçeveler",
  }),
  "edu-yetkinlik-modeli": D("Yetkinlik Modeli", "Vibecoding Yetkinlik Modeli — Okumadan Üretim İşletimine: dört kanıt seviyesi, uygulamalı sınavlar, görev rotasyonu", {
    kap: "okuma→üretim→işletim boyunca dört kanıt seviyesini tanımlar",
    code: "her seviye uygulamalı bir sınav/çıktı ile kanıtlanır",
    test: "seviye atlama için somut kanıt (çalışan PR/test) zorunlu",
    integ: "iterasyon ritüeli (build) ve faz haritasıyla ilişkili",
    ai: "AI seviyeye uygun alıştırma önerir; seviye onayını insan verir",
    mu: "Yetkinlik modeli ekip üyesinin gelişimini ölçülebilir kılar",
  }),
};

apply("seed-egitim", CONTENT);
