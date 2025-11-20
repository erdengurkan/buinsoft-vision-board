# Database ve Task Sorunları Düzeltme Rehberi

## Tespit Edilen Sorunlar

### 1. Task Duplicate Sorunu (KRİTİK)
- **Sorun**: Frontend task'ları `updateProject` endpoint'i ile gönderiyordu
- **Sonuç**: Backend tüm task'ları silip yeniden oluşturuyordu (`deleteMany` + `create`)
- **Çözüm**: Frontend artık yeni task API endpoint'lerini kullanıyor

### 2. WorklogEntry Schema Uyumsuzluğu
- **Sorun**: Migration'da `date` ve `hours` var, schema'da `startedAt`, `stoppedAt`, `durationMs` var
- **Çözüm**: Yeni migration oluşturuldu

## Yapılması Gerekenler

### 1. Database Migration Uygula

```bash
cd server
npx prisma migrate dev --name fix_worklog_schema
```

VEYA manuel olarak:

```bash
cd server
# Migration dosyası zaten oluşturuldu: migrations/20251120000000_fix_worklog_schema/migration.sql
npx prisma migrate deploy
```

### 2. Prisma Client'ı Yeniden Generate Et

```bash
cd server
npx prisma generate
```

### 3. Backend'i Restart Et

```bash
# Docker kullanıyorsanız
docker compose restart app

# Veya manuel olarak
cd server
npm run build
# Sonra server'ı restart edin
```

### 4. Frontend'i Restart Et (Gerekirse)

```bash
# Frontend development server'ı restart edin
npm run dev
```

## Değişiklikler

### Frontend Değişiklikleri
- `ProjectDetail.tsx`: Task CRUD işlemleri artık `/api/tasks` endpoint'lerini kullanıyor
- `AppContext.tsx`: `updateProject` artık tasks array'ini göndermiyor

### Backend Değişiklikleri
- `projectController.ts`: Tasks handling deprecated olarak işaretlendi
- Yeni task controller ve endpoint'leri aktif

## Test Etme

1. Yeni task oluştur - duplicate olmamalı
2. Task güncelle - sadece o task güncellenmeli
3. Task sil - sadece o task silinmeli
4. Project güncelle - task'lar etkilenmemeli

## Notlar

- Eski task'lar veritabanında kalabilir (duplicate'ler)
- İsterseniz temizlik script'i çalıştırabiliriz
- WorklogEntry verileri migration sırasında kaybolabilir (eğer varsa)

