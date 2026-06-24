import { AppHeader } from "@/components/app-header";
import { AdminNav } from "@/components/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-surface">
      <AppHeader title="แอดมิน" subtitle="จัดการระบบคิว" showLogout />
      <main className="page-main space-y-6">
        <AdminNav />
        {children}
      </main>
    </div>
  );
}
