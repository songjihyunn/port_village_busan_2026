"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_CONFIGS, ZONES, FALLBACK_STAFF } from "@/lib/constants";
import { Phone, Search, Filter, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Staff, StaffRole } from "@/types";


export default function StaffTab() {
  const [staff, setStaff] = useState<Staff[]>(FALLBACK_STAFF);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all");
  const [shiftFilter, setShiftFilter] = useState<"all" | "am" | "pm">("all");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("staff").select("*").order("role").then(({ data }) => {
      if (data?.length) setStaff(data);
    });
  }, []);

  const filtered = staff.filter((s) => {
    const matchSearch = s.name.includes(search) || s.zone.includes(search) || s.phone.includes(search);
    const matchRole = roleFilter === "all" || s.role === roleFilter;
    const matchShift = shiftFilter === "all" ||
      (shiftFilter === "am" && parseInt(s.shift_start) < 15) ||
      (shiftFilter === "pm" && parseInt(s.shift_start) >= 15);
    return matchSearch && matchRole && matchShift;
  });

  const byZone = ZONES.map((zone) => ({
    zone,
    staff: filtered.filter((s) => s.role === zone.role),
  }));

  return (
    <div className="p-6 space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름·구역·연락처 검색"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-400/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as StaffRole | "all")}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none"
          >
            <option value="all">전체 역할</option>
            {ROLE_CONFIGS.map((r) => (
              <option key={r.id} value={r.id}>{r.icon} {r.label}</option>
            ))}
          </select>

          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value as "all" | "am" | "pm")}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none"
          >
            <option value="all">전체 교대</option>
            <option value="am">오전 (∼15:00)</option>
            <option value="pm">오후 (15:00∼)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="text-amber-400 font-bold">{filtered.length}</span>명 표시 중
        </div>
      </div>

      {/* Staff by zone */}
      <div className="space-y-4">
        {byZone.map(({ zone, staff: zoneStaff }) => {
          if (zoneStaff.length === 0) return null;
          const roleConfig = ROLE_CONFIGS.find((r) => r.id === zone.role);
          return (
            <div key={zone.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className={`px-5 py-3 border-b border-white/5 flex items-center justify-between ${roleConfig?.bgColor}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{roleConfig?.icon}</span>
                  <span className="font-bold text-white text-sm">{zone.id}구역 · {zone.name}</span>
                  <span className="text-xs text-slate-400">({roleConfig?.label})</span>
                </div>
                <span className="text-xs text-slate-400">{zoneStaff.length}명</span>
              </div>

              <div className="divide-y divide-white/5">
                {zoneStaff.map((s) => (
                  <StaffRow key={s.id} staff={s} roleConfig={roleConfig} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StaffRow({ staff, roleConfig }: { staff: Staff; roleConfig: typeof ROLE_CONFIGS[0] | undefined }) {
  const now = new Date();
  const [startH, startM] = staff.shift_start.split(":").map(Number);
  const [endH, endM] = staff.shift_end.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isOnShift = nowMin >= startH * 60 + startM && nowMin < endH * 60 + endM;

  return (
    <div className="px-5 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors">
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${roleConfig?.bgColor || "bg-white/10"}`}>
        {staff.name[0]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-white text-sm">{staff.name}</span>
          {isOnShift && (
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">근무중</span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">{staff.zone}</p>
      </div>

      {/* Shift */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
        <Clock className="w-3.5 h-3.5" />
        <span>{staff.shift_start}–{staff.shift_end}</span>
      </div>

      {/* Training status */}
      <div className="flex-shrink-0">
        {staff.is_trained ? (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{staff.quiz_score}/7</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-red-400">
            <XCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">미이수</span>
          </div>
        )}
      </div>

      {/* Phone */}
      <a
        href={`tel:${staff.phone}`}
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-green-400 hover:border-green-500/30 transition-colors"
      >
        <Phone className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
