import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 운영 | 포트 빌리지 2026",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B1628]">
      {children}
    </div>
  );
}
