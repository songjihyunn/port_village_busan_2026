"use client";

import { useState, useEffect } from "react";
import { ZONES, ROLE_CONFIGS } from "@/lib/constants";
import { Users, MapPin, AlertTriangle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { StaffRole } from "@/types";

const CORRECTED_PATHS: Record<string, { path: string; cx: number; cy: number }> = {
  F1:  { path: "M 18,46 L 238,46 L 238,189 L 18,189 Z",    cx: 128, cy: 100 },
  C1:  { path: "M 248,46 L 472,46 L 472,189 L 248,189 Z",   cx: 360, cy: 120 },
  F2:  { path: "M 482,46 L 702,46 L 702,189 L 482,189 Z",   cx: 592, cy: 100 },
  M1:  { path: "M 18,193 L 238,193 L 238,336 L 18,336 Z",   cx: 128, cy: 248 },
  FA1: { path: "M 248,193 L 472,193 L 472,336 L 248,336 Z", cx: 360, cy: 273 },
  M2:  { path: "M 482,193 L 702,193 L 702,336 L 482,336 Z", cx: 592, cy: 248 },
  FA2: { path: "M 730,40 L 890,40 L 890,340 L 730,340 Z",   cx: 810, cy: 190 },
  F3:  { path: "M 20,372 L 100,372 L 100,416 L 20,416 Z",   cx: 60,  cy: 394 },
  F4:  { path: "M 100,372 L 180,372 L 180,416 L 100,416 Z", cx: 140, cy: 394 },
  E1:  { path: "M 180,372 L 260,372 L 260,416 L 180,416 Z", cx: 220, cy: 394 },
  F5:  { path: "M 260,372 L 560,372 L 560,416 L 260,416 Z", cx: 410, cy: 394 },
  E2:  { path: "M 560,372 L 640,372 L 640,416 L 560,416 Z", cx: 600, cy: 394 },
  F6:  { path: "M 640,372 L 880,372 L 880,416 L 640,416 Z", cx: 760, cy: 394 },
  P1:  { path: "M 20,430 L 220,430 L 220,650 L 20,650 Z",   cx: 120, cy: 540 },
  C2:  { path: "M 230,430 L 370,430 L 370,650 L 230,650 Z", cx: 300, cy: 540 },
  FA5: { path: "M 380,475 L 470,475 L 470,605 L 380,605 Z", cx: 425, cy: 540 },
  M3:  { path: "M 480,430 L 610,430 L 610,650 L 480,650 Z", cx: 545, cy: 540 },
  F8:  { path: "M 620,430 L 740,430 L 740,650 L 620,650 Z", cx: 680, cy: 540 },
  C3:  { path: "M 750,430 L 815,430 L 815,650 L 750,650 Z", cx: 782, cy: 540 },
  E3:  { path: "M 825,430 L 865,430 L 865,650 L 825,650 Z", cx: 845, cy: 540 },
};

function calcLevel(count: number, capacity: number): "low" | "medium" | "high" | "critical" {
  const ratio = count / capacity;
  if (ratio >= 0.9) return "critical";
  if (ratio >= 0.7) return "high";
  if (ratio >= 0.4) return "medium";
  return "low";
}

const MOCK_COUNT_BY_ID: Record<string, number> = {
  F1: 320, C1: 750, F2: 280, M1: 150, FA1: 25, M2: 180, FA2: 10,
  F3: 30, F4: 40, E1: 150, F5: 40, E2: 150, F6: 40, F7: 40,
  P1: 200, C2: 60, FA5: 20, M3: 50, F8: 230, C3: 380, E3: 450,
};

const MOCK_ZONE_DATA: Record<string, { currentCount: number; level: "low" | "medium" | "high" | "critical" }> =
  Object.fromEntries(
    ZONES.map((z) => {
      const count = Math.min(MOCK_COUNT_BY_ID[z.id] ?? 0, z.capacity);
      return [z.id, { currentCount: count, level: calcLevel(count, z.capacity) }];
    })
  );

const POPUP_LABELS: Record<string, string> = {
  F1: "샤미헌 — 팝업존",
  F2: "MoGuMoGu — 팝업존",
  M1: "로컬스튜디오 — 팝업존",
  M2: "고봉민김밥인 — 팝업존",
};

const LEVEL_STROKE = {
  low: "#22c55e",
  medium: "#F4A72A",
  high: "#f97316",
  critical: "#ef4444",
};

type StaffMember = {
  id: string;
  name: string;
  shift_start: string;
  shift_end: string;
  is_trained: boolean;
  zone: string;
};

export default function MapTab() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [zoneStaff, setZoneStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const selectedZoneData   = selectedZone ? ZONES.find((z) => z.id === selectedZone) : null;
  const selectedMockData   = selectedZone ? MOCK_ZONE_DATA[selectedZone] : null;
  const selectedRoleConfig = selectedZoneData ? ROLE_CONFIGS.find((r) => r.id === selectedZoneData.role) : null;

  useEffect(() => {
    if (!selectedZone || !selectedZoneData) { setZoneStaff([]); return; }
    setStaffLoading(true);
    const supabase = createClient();
    supabase
      .from("staff")
      .select("id, name, shift_start, shift_end, is_trained, zone")
      .eq("zone", selectedZoneData.name)
      .order("shift_start")
      .then(({ data }) => {
        setZoneStaff(data ?? []);
        setStaffLoading(false);
      });
  }, [selectedZone]);

  return (
    <div className="flex h-full" style={{ height: "calc(100vh - 96px)" }}>
      <div className="flex-1 p-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-full flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">포트빌리지 부산 2026 행사장 배치도</h3>
              <p className="text-slate-500 text-xs">구역 클릭 → 상세 정보</p>
            </div>
            <div className="flex gap-3 text-xs">
              {[
                { color: "bg-blue-500",   label: "FOOD존" },
                { color: "bg-green-500",  label: "플리마켓존" },
                { color: "bg-orange-500", label: "체험/콘텐츠" },
                { color: "bg-yellow-400", label: "팝업존" },
                { color: "bg-[#534AB7]",  label: "출입구" },
                { color: "bg-purple-500", label: "편의시설" },
                { color: "bg-slate-400",  label: "휴게 공간" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${l.color} opacity-70`} />
                  <span className="text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div className="relative w-full h-full">
              <svg
                viewBox="0 0 900 680"
                className="absolute top-0 left-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <rect x="10" y="40" width="700" height="300" rx="8" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="6 4" />
                <text x="22" y="32" fill="#64748b" fontSize="13">실내 (수중 테마)</text>
                <rect x="10" y="360" width="880" height="300" rx="8" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="6 4" />
                <text x="22" y="352" fill="#64748b" fontSize="13">야외 구역</text>
                <rect x="20" y="372" width="860" height="44" rx="6" fill="none" stroke="#2B7FD4" strokeWidth="1" strokeDasharray="3 2" />

                {ZONES.map((zone) => {
                  const pathData  = CORRECTED_PATHS[zone.id];
                  const mockData  = MOCK_ZONE_DATA[zone.id];
                  if (!pathData || !mockData) return null;
                  const isSelected = selectedZone === zone.id;
                  const popupLabel = POPUP_LABELS[zone.id];

                  return (
                    <g
                      key={zone.id}
                      onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <path
                        d={pathData.path}
                        fill={zone.color + "33"}
                        stroke={isSelected ? "#F4A72A" : zone.color}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                      <text
                        x={pathData.cx}
                        y={popupLabel ? pathData.cy - 16 : pathData.cy - 6}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {zone.name}
                      </text>
                      <text
                        x={pathData.cx}
                        y={popupLabel ? pathData.cy + 2 : pathData.cy + 12}
                        textAnchor="middle"
                        fill={LEVEL_STROKE[mockData.level]}
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {mockData.currentCount}/{zone.capacity}
                      </text>
                      {popupLabel && (
                        <g>
                          <rect
                            x={pathData.cx - 78}
                            y={pathData.cy + 14}
                            width={156}
                            height={22}
                            rx={5}
                            fill="#F5D400"
                          />
                          <text
                            x={pathData.cx}
                            y={pathData.cy + 29}
                            textAnchor="middle"
                            fill="#5a4a00"
                            fontSize="9"
                            fontWeight="bold"
                          >
                            {popupLabel}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className={`border-l border-white/5 bg-[#07101d] flex-shrink-0 overflow-y-auto transition-all duration-300 ${
        selectedZone ? "w-80" : "w-0 overflow-hidden border-0"
      }`}>
        {selectedZone && selectedZoneData && selectedMockData && selectedRoleConfig && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{selectedZoneData.id} · {selectedZoneData.name}</h3>
              <button onClick={() => setSelectedZone(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {POPUP_LABELS[selectedZoneData.id] && (
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
                <p className="text-amber-300 text-xs font-medium">팝업존 입점: {POPUP_LABELS[selectedZoneData.id]}</p>
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-2">현재 혼잡도</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-black text-white">{selectedMockData.currentCount.toLocaleString()}</span>
                <span className="text-slate-500 text-sm mb-0.5">/ {selectedZoneData.capacity.toLocaleString()}명</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${
                    selectedMockData.level === "critical" ? "bg-red-500" :
                    selectedMockData.level === "high"     ? "bg-orange-500" :
                    selectedMockData.level === "medium"   ? "bg-amber-400" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(100, (selectedMockData.currentCount / selectedZoneData.capacity) * 100)}%` }}
                />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                selectedMockData.level === "critical" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                selectedMockData.level === "high"     ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                selectedMockData.level === "medium"   ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                "bg-green-500/20 text-green-400 border-green-500/30"
              }`}>
                {{ low: "원활", medium: "보통", high: "혼잡", critical: "위험" }[selectedMockData.level]}
              </span>
            </div>

            <div className={`rounded-xl p-4 border ${selectedRoleConfig.bgColor}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{selectedRoleConfig.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{selectedRoleConfig.label}</p>
                  <p className="text-slate-400 text-xs">{selectedRoleConfig.description}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-medium text-slate-300">
                  배치 스태프
                  {!staffLoading && zoneStaff.length > 0 && (
                    <span className="ml-1 text-slate-500">({zoneStaff.length}명)</span>
                  )}
                </p>
              </div>
              {staffLoading ? (
                <p className="text-slate-500 text-xs">불러오는 중...</p>
              ) : zoneStaff.length === 0 ? (
                <p className="text-slate-500 text-xs">이 구역에 배치된 스태프가 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {zoneStaff.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white flex-shrink-0 font-medium">
                        {s.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium">{s.name}</p>
                        <p className="text-[11px] text-slate-500">{s.shift_start}–{s.shift_end}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        s.is_trained
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {s.is_trained ? "완료" : "미완료"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedMockData.level === "critical" && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-red-400 text-xs font-bold">즉시 조치 필요</p>
                </div>
                <p className="text-red-300 text-xs">수용인원 95% 초과. 입장 통제를 실시하세요.</p>
                <button className="w-full mt-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium">
                  입장통제팀 호출
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-400 hover:text-white transition-colors">
                <MapPin className="w-3.5 h-3.5" />
                상세 보기
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-400/10 border border-amber-400/20 rounded-xl text-xs text-amber-400">
                알림 발송
              </button>
            </div>
          </div>
        )}

        {!selectedZone && (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">지도에서 구역을 선택하세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
