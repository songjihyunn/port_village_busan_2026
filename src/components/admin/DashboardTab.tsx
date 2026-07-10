"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TIMELINE_EVENTS, ZONES, FALLBACK_STAFF } from "@/lib/constants";
import { Users, AlertTriangle, TrendingUp, Clock, CheckCircle, Circle, Bell, Activity, GraduationCap } from "lucide-react";
import type { ZoneCongestion, Alert, ChecklistItem, Staff } from "@/types";

const CONGESTION_COLOR = {
  low: { bar: "bg-green-500", text: "text-green-400", badge: "bg-green-500/20 text-green-400 border-green-500/30", label: "원활" },
  medium: { bar: "bg-amber-400", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "보통" },
  high: { bar: "bg-orange-500", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "혼잡" },
  critical: { bar: "bg-red-500", text: "text-red-400", badge: "bg-red-500/20 text-red-400 border-red-500/30", label: "위험" },
};

// capacity 대비 현재 인원 비율로 혼잡도 레벨을 자동 계산합니다.
// (schema.sql의 update_congestion_level 트리거와 동일한 기준: 40%/70%/90%)
function calcLevel(count: number, capacity: number): "low" | "medium" | "high" | "critical" {
  const ratio = count / capacity;
  if (ratio >= 0.9) return "critical";
  if (ratio >= 0.7) return "high";
  if (ratio >= 0.4) return "medium";
  return "low";
}

// id 네이밍: F=FOOD존, M=플리마켓존, C=체험/콘텐츠, P=팝업존, FA=편의시설, E=출입구
const FALLBACK_COUNT_BY_ID: Record<string, number> = {
  F1: 320, C1: 750, F2: 280, M1: 150, FA1: 25, M2: 180, FA2: 10,
  F3: 30, FA3: 20, F4: 40, E1: 150, F5: 40, F6: 40, E2: 150, F7: 40, FA4: 20,
  P1: 200, C2: 60, FA5: 20, M3: 50, F8: 230, C3: 380, E3: 450,
};

const FALLBACK_ZONES: ZoneCongestion[] = ZONES.map((z) => {
  // 데모 데이터 실수로 capacity를 넘는 값이 들어와도 화면엔 100%로 표시되도록 방어
  const count = Math.min(FALLBACK_COUNT_BY_ID[z.id] ?? 0, z.capacity);
  return {
    id: `seed-${z.id}`,
    zone_id: z.id,
    zone_name: z.name,
    current_count: count,
    capacity: z.capacity,
    level: calcLevel(count, z.capacity),
    updated_at: new Date().toISOString(),
  };
});

const FALLBACK_ALERTS: Alert[] = [
  { id: "a1", type: "warning", zone_id: "C1", message: "수중광장(버블쇼) 혼잡도 높음 — 입장 속도 조절 필요", is_resolved: false, created_at: new Date().toISOString(), resolved_at: null },
  { id: "a2", type: "warning", zone_id: "C3", message: "포트게더링 혼잡도 높음 — 동선 분산 요청", is_resolved: false, created_at: new Date(Date.now() - 600000).toISOString(), resolved_at: null },
  { id: "a3", type: "info", zone_id: null, message: "오후 3시 메인 공연 시작 전 전원 대기 위치 확인", is_resolved: false, created_at: new Date(Date.now() - 1200000).toISOString(), resolved_at: null },
];

const FALLBACK_CHECKLIST: ChecklistItem[] = [
  { id: "c1", category: "게이트", task: "메인게이트 QR 스캐너 작동 확인", is_done: true, done_by: "김민준", done_at: null },
  { id: "c2", category: "게이트", task: "비상 대피 안내판 설치 완료", is_done: true, done_by: "이서연", done_at: null },
  { id: "c3", category: "게이트", task: "입장 통제 바리케이드 설치", is_done: false, done_by: null, done_at: null },
  { id: "c4", category: "F&B", task: "식품 냉장 온도 점검 완료", is_done: true, done_by: "최유진", done_at: null },
  { id: "c5", category: "안전", task: "AED 작동 상태 확인", is_done: false, done_by: null, done_at: null },
  { id: "c6", category: "안전", task: "소화기 위치 및 상태 확인", is_done: true, done_by: "백소영", done_at: null },
  { id: "c7", category: "무대", task: "음향·조명 장비 테스트 완료", is_done: false, done_by: null, done_at: null },
  { id: "c8", category: "통신", task: "무전기 배터리 충전 완료", is_done: true, done_by: "윤채원", done_at: null },
];

export default function DashboardTab() {
  const [zones, setZones] = useState<ZoneCongestion[]>(FALLBACK_ZONES);
  const [alerts, setAlerts] = useState<Alert[]>(FALLBACK_ALERTS);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(FALLBACK_CHECKLIST);
  const [staff, setStaff] = useState<Staff[]>(FALLBACK_STAFF);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Try to load from Supabase
    const loadData = async () => {
      try {
        const [zonesRes, alertsRes, checklistRes, staffRes] = await Promise.all([
          supabase.from("zone_congestion").select("*"),
          supabase.from("alerts").select("*").eq("is_resolved", false).order("created_at", { ascending: false }),
          supabase.from("checklist_items").select("*").order("display_order"),
          supabase.from("staff").select("*"),
        ]);
        if (zonesRes.data?.length) { setZones(zonesRes.data); setIsConnected(true); }
        if (alertsRes.data?.length) setAlerts(alertsRes.data);
        if (checklistRes.data?.length) setChecklist(checklistRes.data);
        if (staffRes.data?.length) setStaff(staffRes.data);
      } catch {}
    };

    loadData();

    // Realtime subscription
    const channel = supabase.channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "zone_congestion" }, (payload) => {
        setZones((prev) => prev.map((z) => z.zone_id === (payload.new as ZoneCongestion).zone_id ? payload.new as ZoneCongestion : z));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        setAlerts((prev) => [payload.new as Alert, ...prev]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setStaff((prev) => [...prev, payload.new as Staff]);
        } else if (payload.eventType === "UPDATE") {
          setStaff((prev) => prev.map((s) => s.id === (payload.new as Staff).id ? payload.new as Staff : s));
        } else if (payload.eventType === "DELETE") {
          setStaff((prev) => prev.filter((s) => s.id !== (payload.old as Staff).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalStaff = staff.length;
  const trainedStaff = staff.filter((s) => s.is_trained).length;
  const criticalZones = zones.filter((z) => z.level === "critical").length;
  const checklistDone = checklist.filter((c) => c.is_done).length;

  const resolveAlert = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleChecklist = async (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => c.id === id ? { ...c, is_done: !c.is_done, done_by: !c.is_done ? "관리자" : null } : c)
    );
    try {
      const item = checklist.find((c) => c.id === id);
      const supabase = createClient();
      await supabase.from("checklist_items").update({ is_done: !item?.is_done }).eq("id", id);
    } catch {}
  };

  const now = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentEvent = TIMELINE_EVENTS.find((e) => {
    const [h, m] = e.time.split(":").map(Number);
    return h * 60 <= now;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">실시간 운영 현황</h2>
          <p className="text-slate-500 text-sm">
            {currentTime.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })} ·{" "}
            {currentTime.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
          isConnected ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-slate-500 border-white/10 bg-white/5"
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-slate-600"}`} />
          {isConnected ? "Realtime 연결됨" : "데모 모드"}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "총 스태프", value: totalStaff, sub: `활성 ${totalStaff}명`, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "교육 이수", value: `${trainedStaff}/${totalStaff}`, sub: `미이수 ${totalStaff - trainedStaff}명`, icon: GraduationCap, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "위험 구역", value: criticalZones, sub: criticalZones > 0 ? "즉시 조치 필요" : "정상", icon: AlertTriangle, color: criticalZones > 0 ? "text-red-400" : "text-green-400", bg: criticalZones > 0 ? "bg-red-500/10" : "bg-green-500/10" },
          { label: "체크리스트", value: `${checklistDone}/${checklist.length}`, sub: `${Math.round((checklistDone / checklist.length) * 100)}% 완료`, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
            <p className="text-xs text-slate-600">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Congestion */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">구역별 혼잡도</h3>
            </div>
            <span className="text-xs text-slate-500">실시간 갱신</span>
          </div>

          <div className="space-y-3">
            {zones.map((zone) => {
              const pct = Math.min(100, Math.round((zone.current_count / zone.capacity) * 100));
              // ⚠️ zone.level이 알 수 없는 값일 경우를 대비해 항상 안전한 fallback 사용
              const cfg = CONGESTION_COLOR[zone.level] ?? CONGESTION_COLOR.low;
              return (
                <div key={zone.zone_id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{zone.zone_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${cfg.text}`}>
                      {zone.current_count.toLocaleString()} / {zone.capacity.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${cfg.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-right text-xs text-slate-600 mt-0.5">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-400" />
              <h3 className="font-bold text-white text-sm">알림</h3>
              {alerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">알림 없음</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`rounded-xl p-3 border text-xs ${
                  alert.type === "emergency" ? "bg-red-500/10 border-red-500/20" :
                  alert.type === "warning" ? "bg-amber-500/10 border-amber-500/20" :
                  "bg-blue-500/10 border-blue-500/20"
                }`}>
                  <div className="flex items-start gap-2">
                    <span>{alert.type === "emergency" ? "🚨" : alert.type === "warning" ? "⚠️" : "ℹ️"}</span>
                    <p className={`flex-1 leading-relaxed ${
                      alert.type === "emergency" ? "text-red-300" :
                      alert.type === "warning" ? "text-amber-300" : "text-blue-300"
                    }`}>{alert.message}</p>
                    <button onClick={() => resolveAlert(alert.id)} className="text-slate-600 hover:text-slate-400 ml-1 flex-shrink-0">×</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">운영 타임라인</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {TIMELINE_EVENTS.map((event, i) => {
              const [h, m] = event.time.split(":").map(Number);
              const eventMin = h * 60 + m;
              const isPast = eventMin < now;
              const isCurrent = currentEvent?.time === event.time;

              return (
                <div key={i} className={`flex gap-3 items-start p-2 rounded-xl transition-all ${isCurrent ? "bg-amber-400/10 border border-amber-400/20" : ""}`}>
                  <span className={`text-xs font-mono font-bold flex-shrink-0 mt-0.5 ${
                    isCurrent ? "text-amber-400" : isPast ? "text-slate-600" : "text-slate-400"
                  }`}>{event.time}</span>
                  <div>
                    <p className={`text-xs font-medium ${isCurrent ? "text-amber-300" : isPast ? "text-slate-600" : "text-slate-300"}`}>
                      {isCurrent && "▶ "}{event.title}
                    </p>
                    <p className="text-xs text-slate-600">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h3 className="font-bold text-white text-sm">운영 체크리스트</h3>
            </div>
            <span className="text-xs text-slate-500">{checklistDone}/{checklist.length}</span>
          </div>

          <div className="h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
            />
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto">
            {checklist.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleChecklist(item.id)}
                className="w-full flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                {item.is_done ? (
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-xs ${item.is_done ? "line-through text-slate-600" : "text-slate-300"}`}>
                    {item.task}
                  </p>
                  <p className="text-xs text-slate-600">{item.category}{item.done_by ? ` · ${item.done_by}` : ""}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
