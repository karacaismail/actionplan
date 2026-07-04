# k-kms — Sır / Anahtar Yönetimi Primitifi (TASLAK — kilitlenmeyi bekliyor)

Durum: taslak iskelet. Doldurulacak. CI'a bağlı değil. İnsan onayı gerekir.
Gerekçe: `k-provider-adapter-directive.md:73` ve `marketplace-module-security-directive.md` "secret_ref, asla satır-içi" değişmezini bir KMS primitifine dayandırır; ama böyle bir primitif (yönerge + WBS düğümü) bugün YOKTUR. Bu boşluk e-posta, CRM, PIM, HRMS payroll, Ecommerce PSP dahil kimlik-bilgisi kullanan her ürünü etkiler (P0, bkz. gap-2026-07-02-01-kernel §4 G-K1).

## 1. Amaç / Kapsam / Non-goals

- Amaç: tüm app'lerin sırları (API anahtarı, DB parolası, imza anahtarı, OAuth secret) tek bir referans (secret_ref) üzerinden çözmesini; sırların koda/JSON'a asla gömülmemesini sağlamak.
- Kapsam: sır saklama, çözme (resolve), rotation (döndürme), envelope encryption, tenant-başına kapsam, erişim denetimi (PDP ile).
- Non-goals: TLS sertifikası yaşam döngüsü (ayrı); iş verisi şifreleme (bu, alan-seviyesi c13n/güvenlik işi); HSM donanımı sağlama (opsiyonel arka uç).

## 2. Nedir / ne yapar / ne yapmaz

- Nedir: sır kasası soyutlaması (backend: Vault/`age`/cloud-KMS ardında; tek port/adapter).
- Ne yapar: `secret_ref` → gerçek gizli değer çözümü (yalnız çalışma-zamanında, bellek içi); rotation; erişim audit'i.
- Ne yapmaz: gizli değeri log'a/response'a yazmaz; AI-ajanına ham sır vermez; tenant sınırını aşan çözüme izin vermez.

## 3. Sözleşme şekli (backend — SQLAlchemy 2.0 / FastAPI)

TODO: `secret_binding` tablosu (id, tenant_id, ref, backend, version, rotation_policy, created_at). `SecretPort` arayüzü: `resolve(ref) -> SecretValue`, `rotate(ref)`, `revoke(ref)`. RLS: tenant_id zorunlu. Sır değeri tabloda TUTULMAZ; yalnız backend'te.

## 4. WBS / bağımlılık

TODO: `k-kms` düğümü (level=module, parent=app-kernel). `dependsOn`: k-provider-adapter, k-policy-pdp. `blocks`: e-posta, PSP, imza, provider-adapter primitifleri.

## 5. Multi-tenant / AI guardrail

- Tenant: her secret_ref tenant-scoped; çapraz-tenant çözüm fail-closed.
- AI: AI-ajanı secret_ref görebilir, gizli değeri GÖREMEZ. AI sır tanımını değiştiremez (draft-only + insan onayı).

## 6. Test stratejisi (test-önce)

TODO negatif testler: (a) satır-içi sır tespiti (gitleaks + `check-secrets`); (b) çapraz-tenant çözüm reddi; (c) rotation sonrası eski sürümün geçersizliği; (d) log/response'ta sır sızıntısı taraması.

## 7. Kabul kriterleri / DoD

TODO: 5 boyut dolu; negatif testler geçer; `check-secrets` kapısı yeşil; rotation runbook var; insan onayı (kilit).
