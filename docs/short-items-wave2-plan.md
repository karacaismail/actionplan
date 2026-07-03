# Dalga 2 — short-items Rewrite Planı ve Sonucu (2026-07-03)

Taban (main 9cdac39): 1.106 short-items kartı / 1.349 kısa madde (<35 karakter).
Anatomi: 1.186 madde gerçekten zayıf (ölçüsüz), **163 madde bilinçli-kısa** (ölçü işareti + alan-jetonu taşıyor — ör. "p95 < 200ms"; bunlar da kartın bayrağını düşürmek için genişletildi ama zayıf sayılmadılar). Yoğunluk: boyutta integration 190 / performance 177 / securityOptimization 159 / mobileApps 130 / deployment 103; seviyede module 417 + archetype 368 + feature 346; kümede aday 135 / layer1 135 / crosscut 102. Top-120 zayıf node 933 kısa maddeyi barındırıyordu — bandın doğru hedef olduğunun kanıtı.

## Protokol (rewrite ≠ append)

Kısa madde SİLİNMEZ ve yeniden yazılmaz; eski metin birebir başta korunur, boyut-bazlı
ölçü/eşik/kanıt eki `—` ile eklenir: niyet korunur, madde ölçülü sözleşmeye döner.
Kart bayrağı ancak karttaki TÜM kısa maddeler ≥35 olursa düştüğünden araç kartı bütün
olarak işler. Yasak ifadeler + FORBIDDEN şablon imzaları + kart-içi tekrar + global
benzersizlik + semantik gerileme (geçen kart kalamaz) yazım ÖNCESİ engellenir.
Araç: `tools/agents/rewrite-short-items.mjs` (--dry-run/--apply/--nodes/--maxCards).
Eski→yeni tam eşleme: `reports/short-items-wave2-mapping.json` (id, boyut, eski, yeni, neden, eklenen ölçü).

## Uygulanan geçişler

1. band 160 node + zorunlu aileler, 400 kart / 514 madde → short 1.106→706, WARN 3.178→2.987
2. band 300, 200 kart / 250 madde → short 706→506, WARN → 2.900
3. band 360, 40 kart / 51 madde → short **466**, WARN **2.874**

Toplam: 99 node, 640 kart, **815 madde** rewrite edildi.

## Bilinçli bırakılanlar (dalga 3)

Kalan 466 short-items kartı: skor bandı dışındaki (görece güçlü) node'larda; ratchet
artışı engelliyor, azaltma dalga 3'te aynı protokolle. WARN 2.874 kalan kütle; missing-evidence 460 (kod reposu bağı); missing-ref 1.825.
