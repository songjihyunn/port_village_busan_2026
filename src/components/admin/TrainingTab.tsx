"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_CONFIGS, FALLBACK_STAFF } from "@/lib/constants";
import { CheckCircle, XCircle, Send, Trophy, AlertTriangle, BarChart3 } from "lucide-react";
import type { Staff, StaffRole } from "@/types";


export default function TrainingTab() {
  const [staff, setStaff] = useState<Staff[]>(FALLBACK_STAFF);
  const [filter, setFilter] = useState<"all" | "trained" | "untrained">("all");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all");
  const [notifying, setNotifying] = useState<Set<string>>(new Set());
  const [notified, setNotified] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    supabase.from("staff").select("*").order("role").then(({ data }) => {
      if (data?.length) setStaff(data);
    });

    // Realtime subscription
    const channel = supabase.channel("training")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "staff" }, (payload) => {
        setStaff((prev) => prev.map((s) => s.id === (payload.new as Staff).id ? payload.new as Staff : s));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = staff.filter((s) => {
    const matchStatus = filter === "all" || (filter === "trained" ? s.is_trained : !s.is_trained);
    const matchRole = roleFilter === "all" || s.role === roleFilter;
    return matchStatus && matchRole;
  });

  const trained = staff.filter((s) => s.is_trained);
  const untrained = staff.filter((s) => !s.is_trained);
  const avgScore = trained.length > 0
    ? (trained.reduce((sum, s) => sum + (s.quiz_score || 0), 0) / trained.length).toFixed(1)
    : "—";

  const sendNotification = async (staffId: string, staffName: string) => {
    setNotifying((prev) => new Set(Array.from(prev).concat(staffId)));
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const supabase = createClient();
      await supabase.from("training_notifications").insert({
        staff_id: staffId,
        message: `[포트 빌리지 2026] ${staffName}님, 행사 참여 전 교육 이수가 필요합니다. 스태프 앱에서 교육을 완료해주세요.`,
      });
    } catch {}
    setNotifying((prev) => { const s = new Set(Array.from(prev)); s.delete(staffId); return s; });
    setNotified((prev) => new Set(Array.from(prev).concat(staffId)));
  };

  const sendBulkNotification = async () => {
    const untrainedStaff = staff.filter((s) => !s.is_trained);
    for (const s of untrainedStaff) {
      await sendNotification(s.id, s.name);
    }
  };

  const byRole = ROLE_CONFIGS.map((rc) => ({
    role: rc,
    staff: staff.filter((s) => s.role === rc.id),
    trained: staff.filter((s) => s.role === rc.id && s.is_trained).length,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "전체 스태프", value: staff.length, icon: "👥", color: "text-blue-400" },
          { label: "이수 완료", value: trained.length, icon: "✅", color: "text-green-400" },
          { label: "미이수", value: untrained.length, icon: "⚠️", color: "text-red-400" },
          { label: "평균 점수", value: `${avgScore}점`, icon: "📊", color: "text-amber-400" },
        ].map((item) => (
          <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
            <p className="text-xs text-slate-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Role-wise completion chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">역할별 교육 이수율</h3>
          </div>
          <button
            onClick={sendBulkNotification}
            className="flex items-center gap-1.5 text-xs bg-amber-400/10 border border-amber-400/20 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-400/20 transition-colors"
          >
            <Send className="w-3 h-3" />
            미이수 전체 알림
          </button>
        </div>
        <div className="space-y-3">
          {byRole.map(({ role, staff: roleStaff, trained: trainedCount }) => {
            const pct = roleStaff.length > 0 ? Math.round((trainedCount / roleStaff.length) * 100) : 0;
            return (
              <div key={role.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{role.icon}</span>
                    <span className="text-sm text-slate-300">{role.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{trainedCount}/{roleStaff.length}명 ({pct}%)</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      pct === 100 ? "bg-green-500" : pct >= 70 ? "bg-amber-400" : "bg-red-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {[
            { value: "all", label: "전체" },
            { value: "trained", label: "이수 완료" },
            { value: "untrained", label: "미이수" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.value
                  ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                  : "bg-white/5 text-slate-500 border border-white/10 hover:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as StaffRole | "all")}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">전체 역할</option>
          {ROLE_CONFIGS.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500">{filtered.length}명</span>
      </div>

      {/* Staff table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["이름", "역할", "구역", "이수 여부", "퀴즈 점수", "완료일", "알림"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((s) => {
              const roleConfig = ROLE_CONFIGS.find((r) => r.id === s.role);
              const isNotifying = notifying.has(s.id);
              const isNotified = notified.has(s.id);
              const completedDate = s.quiz_completed_at
                ? new Date(s.quiz_completed_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
                : "—";

              return (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${roleConfig?.bgColor || "bg-white/10"}`}>
                        {s.name[0]}
                      </div>
                      <span className="text-white text-sm font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400">{roleConfig?.icon} {roleConfig?.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-32 truncate">{s.zone}</td>
                  <td className="px-4 py-3">
                    {s.is_trained ? (
                      <div className="flex items-center gap-1.5 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">이수</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs">미이수</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.quiz_score !== null ? (
                      <div className="flex items-center gap-1">
                        <Trophy className={`w-3.5 h-3.5 ${s.quiz_score >= 5 ? "text-amber-400" : "text-red-400"}`} />
                        <span className={`text-sm font-bold ${s.quiz_score >= 5 ? "text-amber-400" : "text-red-400"}`}>
                          {s.quiz_score}/7
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{completedDate}</td>
                  <td className="px-4 py-3">
                    {!s.is_trained && (
                      <button
                        onClick={() => sendNotification(s.id, s.name)}
                        disabled={isNotifying || isNotified}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                          isNotified
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-amber-400/10 text-amber-400 border border-amber-400/20 hover:bg-amber-400/20"
                        }`}
                      >
                        {isNotifying ? (
                          <span className="animate-pulse">전송중…</span>
                        ) : isNotified ? (
                          <><CheckCircle className="w-3 h-3" />전송됨</>
                        ) : (
                          <><Send className="w-3 h-3" />알림</>
                        )}
                      </button>
                    )}
                    {s.is_trained && <span className="text-slate-700 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Untrained warning */}
      {untrained.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium text-sm">미이수 스태프 {untrained.length}명</p>
            <p className="text-red-300/70 text-xs mt-1">
              {untrained.map((s) => s.name).join(", ")} · 행사 전 교육 이수 필수
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
