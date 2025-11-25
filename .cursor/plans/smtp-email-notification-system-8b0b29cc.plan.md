<!-- 8b0b29cc-422b-489a-9218-f5e2ec23f93e 518c1d70-9fcf-43e5-b276-9c522c3eb829 -->
# PHASE 1: JWT Authentication + Temel Yetkilendirme

## Amaç

Mevcut localStorage tabanlı authentication'ı JWT token sistemine geçirmek ve temel rol kontrolünü eklemek. Bu phase mevcut sistemi bozmadan çalışır.

## Versiyon

1.4.0.0 (Phase 1)

## YAPILACAKLAR

### 1. Backend - JWT Implementasyonu

- `jsonwebtoken` ve `@types/jsonwebtoken` paketlerini `server/package.json`'a ekle
- `server/src/lib/jwt.ts` oluştur:
- `generateToken(userId, email, userRole, organizationId?)` fonksiyonu
- `verifyToken(token)` fonksiyonu
- `decodeToken(token)` fonksiyonu
- `.env` dosyasına `JWT_SECRET` ve `JWT_EXPIRES_IN` (örn: "7d") ekle
- `authController.ts` güncelle:
- Login'de JWT token oluştur ve döndür
- Token'da userId, email, userRole, organizationId (null) bilgilerini sakla
- Response'da hem user hem token döndür
- `server/src/middleware/auth.ts` oluştur:
- `authenticate` middleware: JWT token doğrulama (Authorization header'dan al)
- `authorize(roles[])` middleware: Rol bazlı yetkilendirme
- Request'e `req.user` objesi ekle (userId, email, userRole, organizationId)
- Token yoksa veya geçersizse 401 döndür

### 2. Frontend - JWT Token Yönetimi

- `src/lib/api.ts` oluştur: API request wrapper
- Tüm fetch çağrılarını buradan yap
- Authorization header'ı otomatik ekle (Bearer token)
- Token expire durumunda logout yap ve login'e yönlendir
- 401 response'da token'ı sil
- `AuthContext.tsx` güncelle:
- Token'ı localStorage'da sakla (key: "buinsoft_token")
- Login'de token'ı kaydet
- Logout'da token'ı sil
- Token'ı her request'te header'a ekle
- `Login.tsx` güncelle:
- Login response'ından token'ı al ve kaydet
- AuthContext'e token ile birlikte user bilgisini set et
- Tüm API çağrılarını `api.ts` üzerinden yap (fetch yerine)
- `api.get()`, `api.post()`, `api.patch()`, `api.delete()` metodları

### 3. Backend - Route Protection

- `routes/index.ts` güncelle:
- Login route hariç tüm route'lara `authenticate` middleware ekle
- Test route'ları için özel kontrol (opsiyonel)

### 4. User Model Güncelleme (Sadece userRole)

- Prisma schema'da User modelini güncelle:
- `userRole` default değerini kontrol et (zaten "User" var)
- SuperAdmin için: gerden@gofasthost.com email'ine sahip kullanıcıyı SuperAdmin yap (migration script ile)
- Migration oluştur ve çalıştır

### 5. Versiyon Güncellemeleri

- `package.json`: version "1.4.0.0"
- `server/package.json`: version "1.4.0.0"
- `src/config/version.ts`: "1.4.0.0"
- `vite.config.ts`: VITE_APP_VERSION "1.4.0.0"

### 6. Test Senaryoları

- Login yap, token al
- Token ile API çağrısı yap
- Token olmadan API çağrısı yap (401 beklenir)
- Geçersiz token ile API çağrısı yap (401 beklenir)
- Logout yap, token silinir

## Dosya Değişiklikleri

- `server/package.json` (GÜNCELLEME)
- `server/src/lib/jwt.ts` (YENİ)
- `server/src/middleware/auth.ts` (YENİ)
- `server/src/controllers/authController.ts` (GÜNCELLEME)
- `server/src/routes/index.ts` (GÜNCELLEME)
- `server/prisma/schema.prisma` (GÜNCELLEME - sadece SuperAdmin atama)
- `src/lib/api.ts` (YENİ)
- `src/contexts/AuthContext.tsx` (GÜNCELLEME)
- `src/pages/Login.tsx` (GÜNCELLEME)
- `package.json` (GÜNCELLEME)
- `src/config/version.ts` (GÜNCELLEME)
- `vite.config.ts` (GÜNCELLEME)

## Önemli Notlar

- Mevcut localStorage user bilgisi ile uyumluluk: Eski token yoksa login'e yönlendir
- Token süresi: 7 gün (ayarlanabilir)
- OrganizationId: Phase 1'de null olacak, Phase 2'de doldurulacak
- Geriye dönük uyumluluk: Eski localStorage user bilgisi varsa token'a çevir (opsiyonel)