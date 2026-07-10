"use client";

import Link from "next/link";
import { Anchor, LayoutDashboard, Map, Users, GraduationCap, BookOpen, Bell } from "lucide-react";
import type { AdminTab } from "@/app/admin/page";

const TABS = [
  { id: "dashboard" as AdminTab, label: "대시보드", icon: LayoutDashboard },
  { id: "map" as AdminTab, label: "공간 도면", icon: Map },
  { id: "staff" as AdminTab, label: "스태프 배치", icon: Users },
  { id: "training" as AdminTab, label: "교육 현황", icon: GraduationCap },
  { id: "manual" as AdminTab, label: "운영 매뉴얼", icon: BookOpen },
];

interface Props {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export default function AdminNav({ activeTab, onTabChange }: Props) {
  return (
    <header className="bg-[#07101d] border-b border-white/5 flex-shrink-0">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
            <Anchor className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-white font-bold text-sm">포트 빌리지 2026</span>
            <span className="text-slate-500 text-xs ml-2">관리자 시스템</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← 홈
          </Link>
        </div>
      </div>

      <nav className="flex px-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === id
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
