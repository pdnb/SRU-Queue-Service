import { Monitor, Settings, Tv, UserCheck } from "lucide-react";
import { PortalCard } from "@/components/portal-card";
import { APP_NAME, APP_TAGLINE, ORGANIZATION } from "@/lib/branding";

export default function HomePage() {
  return (
    <div className="page-surface">
      <header className="border-b bg-brand text-brand-foreground">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:py-16">
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {APP_NAME}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            {APP_TAGLINE} — เลือกหน้าจอที่ต้องการใช้งาน
          </p>
        </div>
      </header>

      <main className="page-main max-w-5xl py-10 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          <PortalCard
            href="/kiosk"
            title="รับคิว (Kiosk)"
            description="สำหรับนักศึกษาเลือกบริการ กรอกรหัส และรับเลขคิว"
            icon={Monitor}
            accent="cta"
          />
          <PortalCard
            href="/display"
            title="จอแสดงผล (Display)"
            description="จอ TV แสดงเลขคิวที่กำลังเรียก ไม่แสดงข้อมูลส่วนตัว"
            icon={Tv}
            accent="brand"
          />
          <PortalCard
            href="/staff"
            title="เจ้าหน้าที่ (Staff)"
            description="เรียกคิวถัดไป อัปเดตสถานะ และจัดการคิวประจำเคาน์เตอร์"
            icon={UserCheck}
            accent="brand"
          />
          <PortalCard
            href="/admin"
            title="แอดมิน (Admin)"
            description="จัดการบริการ เคาน์เตอร์ เจ้าหน้าที่ และดูรายงาน"
            icon={Settings}
            accent="muted"
          />
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        {APP_NAME} · {ORGANIZATION}
      </footer>
    </div>
  );
}
