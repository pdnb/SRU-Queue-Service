# ระบบรันคิวให้บริการนักศึกษา

ระบบจัดการคิวบริการนักศึกษาแบบ full-stack ด้วย Next.js 15 รองรับ 4 หน้าจอหลัก:

- **Kiosk** (`/kiosk`) — นักศึกษาเลือกบริการ กรอกรหัสนักศึกษา ยืนยันชื่อจาก SIS แล้วรับเลขคิว
- **Staff** (`/staff`) — เจ้าหน้าที่เรียกคิวถัดไป อัปเดตสถานะ
- **Display** (`/display`) — จอ TV แสดงเลขคิวที่กำลังเรียก (ไม่แสดงข้อมูลส่วนตัว)
- **Admin** (`/admin`) — จัดการบริการ ช่องบริการ เจ้าหน้าที่ และรายงาน

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Prisma + SQLite (dev) / TiDB MySQL (production)
- Auth.js v5 (Credentials)
- Tailwind CSS + shadcn/ui
- Pusher (optional real-time, fallback polling)

## เริ่มต้นใช้งาน

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

เปิดเบราว์เซอร์:

| หน้า | URL |
|------|-----|
| หน้าแรก | http://localhost:3000 |
| รับคิว | http://localhost:3000/kiosk |
| เจ้าหน้าที่ | http://localhost:3000/staff |
| จอแสดงผล | http://localhost:3000/display |
| ติดตามคิว | http://localhost:3000/ticket/{id} |
| แอดมิน | http://localhost:3000/admin |

## บัญชีทดสอบ (หลัง seed)

| บทบาท | อีเมล | รหัสผ่าน |
|-------|-------|----------|
| Admin | admin@example.com | password123 |
| Staff (ทะเบียน) | staff1@example.com | password123 |
| Staff (การเงิน) | staff2@example.com | password123 |

## รหัสนักศึกษาจำลอง (SIS Mock)

เมื่อ `SIS_MOCK=true`:

- `64010001` — สมชาย ใจดี
- `64010002` — สมหญิง รักเรียน
- `64010003` — วิชัย เก่งมาก

## Environment Variables

ดูรายละเอียดใน [`.env.example`](.env.example)

| ตัวแปร | คำอธิบาย |
|--------|----------|
| `DATABASE_URL` | Connection string ของฐานข้อมูล |
| `AUTH_SECRET` | Secret สำหรับ Auth.js |
| `SIS_MOCK` | ใช้ข้อมูลนักศึกษาจำลอง (`true` สำหรับ dev) |
| `SIS_API_URL` | URL ของ SIS API (production) |
| `PUSHER_*` | ค่า Pusher สำหรับ real-time (ไม่บังคับ) |
| `NEXT_PUBLIC_APP_URL` | URL สาธารณะของแอป สำหรับ QR ติดตามคิว (production) |

## คำสั่ง

```bash
npm run dev        # รัน development server
npm run build      # build production
npm run test       # รัน unit tests
npm run db:migrate # รัน migration (SQLite ใน dev)
npm run db:seed    # seed ข้อมูลตัวอย่าง
```

## Production (TiDB)

ตั้ง `DATABASE_URL` เป็น connection string แบบ `mysql://` ชี้ไป TiDB แล้วรัน:

```bash
npm run db:migrate:deploy
npm run build
npm start
```

## Deploy บน Vercel

โปรเจกต์รองรับ deploy บน [Vercel](https://vercel.com) โดยใช้ TiDB/MySQL เป็นฐานข้อมูล (ไม่รองรับ SQLite บน serverless)

### 1. เตรียมฐานข้อมูล

สร้างฐานข้อมูล MySQL/TiDB แล้วเก็บ connection string แบบ `mysql://...`

### 2. Import โปรเจกต์เข้า Vercel

1. ไปที่ [vercel.com/new](https://vercel.com/new) แล้ว import repository นี้
2. Framework จะถูก detect เป็น **Next.js** อัตโนมัติ
3. Build Command ใช้ `npm run vercel-build` (รัน migration + build ให้อัตโนมัติ)

### 3. ตั้ง Environment Variables

ตั้งค่าใน Vercel Project → Settings → Environment Variables:

| ตัวแปร | ค่า | หมายเหตุ |
|--------|-----|----------|
| `DATABASE_URL` | `mysql://...` | บังคับ — TiDB/MySQL |
| `AUTH_SECRET` | สตริงสุ่มยาว ๆ | สร้างด้วย `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | สำหรับ QR ติดตามคิว |
| `SIS_MOCK` | `false` | production ใช้ SIS จริง |
| `SIS_API_URL` | URL ของ SIS | เมื่อ `SIS_MOCK=false` |
| `SIS_API_KEY` | API key | เมื่อ `SIS_MOCK=false` |
| `PUSHER_*` | ตาม Pusher dashboard | ไม่บังคับ |

### 4. Deploy

กด **Deploy** — Vercel จะรัน `prisma migrate deploy` ก่อน build ทุกครั้ง

### 5. Seed ข้อมูลครั้งแรก

หลัง deploy สำเร็จ รัน seed จากเครื่อง local โดยชี้ไปฐานข้อมูล production:

```bash
# ดึง env จาก Vercel (ต้องติดตั้ง Vercel CLI ก่อน: npm i -g vercel)
vercel env pull .env.production.local
# ตั้ง DATABASE_URL ใน .env.production.local แล้วรัน
npm run db:seed
```

### Deploy ด้วย CLI

```bash
npm i -g vercel
vercel login
vercel          # preview deploy
vercel --prod   # production deploy
```

### หมายเหตุ

- ทุก push ไป branch ที่เชื่อมกับ Vercel จะ trigger deploy อัตโนมัติ
- `auth.config.ts` ตั้ง `trustHost: true` แล้ว — ใช้งานบน Vercel domain ได้ทันที
- ถ้า migration ล้มเหลว ตรวจสอบว่า `DATABASE_URL` ถูกต้องและ database เปิดรับ connection จาก Vercel

## กฎธุรกิจหลัก

1. เลขคิวรีเซ็ตทุกวัน แยกตามบริการ (เช่น A001, B001)
2. ห้ามรับคิวซ้ำ — รหัสนักศึกษา + บริการเดิม + วันเดียวกัน ถ้ายังรอหรือถูกเรียกอยู่
3. จอ Display แสดงเฉพาะเลขคิว ไม่แสดงรหัส/ชื่อนักศึกษา
