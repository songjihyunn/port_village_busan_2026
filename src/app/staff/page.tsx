"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Anchor, ChevronRight } from "lucide-react";
import { ROLE_CONFIGS } from "@/lib/constants";
import type { StaffRole } from "@/types";

interface RoleProgress {
  mapViewed?: boolean;
  routeViewed?: boolean;
  learned?: boolean;
  quizPassed?: boolean;
}

const STEPS: { key: keyof RoleProgress; label: string }[] = [
  { key: "mapViewed", label: "공간탐색" },
  { key: "routeViewed", label: "동선" },
  { key: "learned", label: "업무" },
  { key: "quizPassed", label: "퀴즈" },
];

export default function StaffHomePage() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, RoleProgress>>({});
  const [selected, setSelected] = useState<StaffRole | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pv2026_progress");
    if (saved) setProgress(JSON.parse(saved));
  }, []);

  const selectedRole = ROLE_CONFIGS.find((r) => r.id === selected);
  const selectedProgress: RoleProgress = selected ? (progress[selected] || {}) : {};
  const stepsDone = STEPS.map((s) => !!selectedProgress[s.key]);
  const allDone = stepsDone.every(Boolean);
  const fiveSteps = [...stepsDone, allDone];
  const pct = Math.round((fiveSteps.filter(Boolean).length / 5) * 100);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
            <Anchor className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Port Village Busan</p>
            <h1 className="text-lg font-bold text-white">스태프 사전 교육</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 flex flex-col gap-4 bg-white">
        <p className="text-xs text-gray-400 uppercase tracking-wider">역할을 선택하세요</p>

        {/* 2×3 Role Grid */}
        <div className="grid grid-cols-2 gap-3">
          {ROLE_CONFIGS.map((role) => {
            const isSelected = selected === role.id;
            const rp: RoleProgress = progress[role.id] || {};
            const done = STEPS.every((s) => !!rp[s.key]);

            return (
              <button
                key={role.id}
                onClick={() =>
                  setSelected((prev) => (prev === role.id ? null : (role.id as StaffRole)))
                }
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? "bg-green-50 border-green-500 shadow-md shadow-green-100"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    isSelected ? "bg-green-100" : "bg-white"
                  }`}>
                    {role.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-sm text-gray-800">{role.label}</h3>
                      {done && <span className="text-[10px] text-green-500">✓</span>}
                    </div>
                    <p className="text-[10px] mt-0.5 leading-tight text-gray-500 truncate">
                      {role.zone}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 학습 진행률 — 선택 시 표시 */}
        {selected && selectedRole && (
          <div className="rounded-2xl border border-green-500 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{selectedRole.icon}</span>
              <p className="text-sm font-bold text-gray-800">{selectedRole.label} 학습 진행률</p>
              <p className="ml-auto text-lg font-black text-green-600">{pct}%</p>
            </div>

            <div className="flex gap-2">
              {["공간탐색", "동선", "업무", "퀴즈", "완료"].map((label, i) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full h-2 rounded-full ${
                    fiveSteps[i] ? "bg-green-500" : "bg-gray-200"
                  }`} />
                  <p className={`text-[9px] font-medium ${
                    fiveSteps[i] ? "text-green-600" : "text-gray-400"
                  }`}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 교육 시작 버튼 — 선택 시 표시 */}
        {selected && (
          <button
            onClick={() => router.push(`/staff/${selected}`)}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-colors"
          >
            <span>{selectedRole?.icon}</span>
            <span>{selectedRole?.label} 역할로 교육시작하기</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* 하단 공지 */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-amber-600">🚨 행사 당일 전까지 모든 역할 교육을 완료해주세요</p>
          <p className="text-xs text-gray-400 mt-1">2026년 행사 예정일 이전 이수 필수</p>
        </div>
      </main>
    </div>
  );
}
