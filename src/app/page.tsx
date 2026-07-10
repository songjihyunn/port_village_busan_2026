"use client";

import Link from "next/link";
import { Anchor, Shield, LayoutDashboard, ChevronRight, Waves } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B1628] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute bottom-0 w-full opacity-10" viewBox="0 0 1440 320" fill="none">
          <path
            d="M0,160L48,165.3C96,171,192,181,288,186.7C384,192,480,192,576,181.3C672,171,768,149,864,154.7C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="#F4A72A"
          />
        </svg>
        <svg className="absolute bottom-0 w-full opacity-5" viewBox="0 0 1440 320" fill="none">
          <path
            d="M0,224L48,213.3C96,203,192,181,288,192C384,203,480,245,576,245.3C672,245,768,203,864,186.7C960,171,1056,181,1152,197.3C1248,213,1344,245,1392,261.3L1440,277L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="#2596b4"
          />
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-2xl w-full">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
            <Anchor className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Waves className="w-5 h-5 text-cyan-400" />
          <span className="text-cyan-400 text-sm font-medium tracking-widest uppercase">Port Village Busan</span>
          <Waves className="w-5 h-5 text-cyan-400" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          포트 빌리지 <span className="text-amber-400">2026</span>
        </h1>
        <p className="text-lg mb-12 text-slate-400">행사 스태프 통합 운영 시스템</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/staff" className="group">
            <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-white/5 p-6 text-left transition-all duration-300 hover:border-amber-400/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(244,167,42,0.15)]">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center mb-4 group-hover:bg-amber-400/20 transition-colors">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">스태프 교육</h2>
              <p className="text-slate-400 text-sm mb-4">역할별 업무 학습 · 공간 탐색 · 돌발상황 퀴즈</p>
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                <span>모바일 최적화</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="absolute top-4 right-4 text-2xl opacity-20">📱</div>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-white/5 p-6 text-left transition-all duration-300 hover:border-cyan-500/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(37,150,180,0.15)]">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <LayoutDashboard className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">관리자 운영</h2>
              <p className="text-slate-400 text-sm mb-4">실시간 대시보드 · 스태프 배치 · 교육 현황</p>
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                <span>웹 대시보드</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="absolute top-4 right-4 text-2xl opacity-20">🖥️</div>
            </div>
          </Link>
        </div>

        <p className="mt-8 text-slate-600 text-xs">
          Port Village Busan 2026 · Staff Management System v1.0
        </p>
      </div>
    </main>
  );
}
