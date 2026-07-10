import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "스태프 교육 | 포트 빌리지 2026",
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B1628] max-w-md mx-auto relative">
      {children}
    </div>
  );
}
