"use client";

import { useState } from "react";
import { BookOpen, AlertTriangle, ChevronDown, ChevronUp, Zap, Shield, Phone } from "lucide-react";
import { EMERGENCY_CONTACTS } from "@/lib/constants";

interface ScenarioCard {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  severity: "critical" | "high" | "medium" | "low";
  steps: string[];
  contacts: string[];
}

const SCENARIOS: ScenarioCard[] = [
  {
    id: "fire",
    category: "안전",
    title: "화재 발생",
    description: "행사장 내 화재 감지 또는 연기 발생 시",
    icon: "🔥",
    severity: "critical",
    steps: [
      "119 즉시 신고",
      "가까운 소화기로 초기 진화 시도 (탈출 경로 확보 후)",
      "무전기로 운영본부(#100)에 즉시 보고",
      "관람객을 지정 대피 경로로 신속히 안내",
      "무대·F&B 가스·전기 즉시 차단",
      "전원 대피 완료 확인 후 인원 집계",
    ],
    contacts: ["#100 운영본부", "#101 경비팀", "119 소방"],
  },
  {
    id: "medical",
    category: "의료",
    title: "관람객 의료 응급",
    description: "심정지·실신·열사병·알레르기 쇼크 등",
    icon: "🚑",
    severity: "critical",
    steps: [
      "119 즉시 신고 (의식 여부 확인 후)",
      "의료팀(#106) 무전 호출",
      "AED 위치 확인 및 가져오기 지시",
      "의식 없을 경우 즉시 CPR 시작",
      "주변 관람객 정리 및 공간 확보",
      "구급대 도착까지 지속 처치",
    ],
    contacts: ["#106 의료팀", "119 구급"],
  },
  {
    id: "crush",
    category: "안전",
    title: "압사·군중 붕괴 위험",
    description: "특정 구역 과밀집으로 압사 위험 감지 시",
    icon: "🚨",
    severity: "critical",
    steps: [
      "즉시 무대 진행 중단 요청 (무대팀/운영본부)",
      "음향 시스템으로 관람객 분산 안내",
      "해당 구역 모든 게이트 개방",
      "경비팀·입장통제팀 즉시 출동 요청",
      "119 신고 및 의료팀 대기 요청",
      "SNS·방송으로 해당 구역 진입 차단 공지",
    ],
    contacts: ["#100 운영본부", "#101 경비팀", "#105 입장통제팀", "119"],
  },
  {
    id: "theft",
    category: "보안",
    title: "도난·분실 신고",
    description: "관람객 소지품 도난 또는 분실물 신고",
    icon: "🔍",
    severity: "medium",
    steps: [
      "신고 내용 상세 청취 및 기록",
      "보안팀(#102)에 즉시 신고",
      "용의자 목격 정보 수집 (외모·복장·방향)",
      "CCTV 위치 안내 및 경찰 신고 안내",
      "분실물은 안내센터(F구역)로 안내",
      "경찰 신고 필요 시 지원",
    ],
    contacts: ["#102 보안팀", "#108 방송팀"],
  },
  {
    id: "weather",
    category: "기상",
    title: "악천후·강풍",
    description: "갑작스러운 폭우·강풍·번개 발생 시",
    icon: "⛈️",
    severity: "high",
    steps: [
      "운영본부(#100)에 기상 상황 즉시 보고",
      "야외 구역 스태프 실내 대피 유도 준비",
      "천막·구조물 고정 상태 긴급 점검",
      "운영본부 지시에 따라 운영 중단 여부 결정",
      "관람객에게 기상 악화 안내 및 대피 유도",
      "뇌우 시 금속 구조물·야외 공연 즉시 중단",
    ],
    contacts: ["#100 운영본부", "#103 시설팀"],
  },
  {
    id: "power",
    category: "시설",
    title: "정전·전력 차단",
    description: "행사장 내 전력 공급 중단 시",
    icon: "⚡",
    severity: "high",
    steps: [
      "시설팀(#103)에 즉시 신고",
      "비상 조명 작동 확인",
      "어두운 구역 관람객 침착 유도",
      "무대·F&B 전기 장비 안전 점검",
      "발전기 가동 여부 운영본부 확인",
      "복구까지 해당 구역 운영 중단",
    ],
    contacts: ["#100 운영본부", "#103 시설팀"],
  },
  {
    id: "missing_child",
    category: "안전",
    title: "미아 발생",
    description: "보호자 없는 아동 발견 또는 미아 신고",
    icon: "👶",
    severity: "medium",
    steps: [
      "아동을 안내센터(F구역)로 안내 또는 이동",
      "방송팀(#108)에 미아 방송 요청",
      "아동의 이름·복장·보호자 정보 파악",
      "경비팀(#101)에 공유",
      "아동이 안정될 때까지 곁에 있기",
      "보호자 확인 후 신원 확인 절차 진행",
    ],
    contacts: ["#101 경비팀", "#108 방송팀"],
  },
  {
    id: "violence",
    category: "보안",
    title: "폭력·난동 행위",
    description: "관람객 간 폭력·심한 난동 발생 시",
    icon: "⚠️",
    severity: "high",
    steps: [
      "절대 단독 개입하지 않기",
      "경비팀(#101)·보안팀(#102) 즉시 호출",
      "주변 관람객 안전 구역으로 이동 유도",
      "상황 지속 시 경찰(112) 신고",
      "목격자 확보 및 증언 기록",
      "피해자 의료 지원 연결",
    ],
    contacts: ["#101 경비팀", "#102 보안팀", "112 경찰"],
  },
];

const OPERATION_MANUALS = [
  {
    category: "입장 운영",
    items: [
      { title: "QR 티켓 스캔 매뉴얼", desc: "스캐너 앱 사용법 및 오류 대처" },
      { title: "재입장 관리 절차", desc: "재입장 스탬프 확인 및 처리 방법" },
      { title: "수용인원 모니터링", desc: "구역별 인원 집계 및 보고 방법" },
    ],
  },
  {
    category: "F&B 운영",
    items: [
      { title: "식품위생 체크리스트", desc: "냉장 온도·위생 점검 기준" },
      { title: "결제 시스템 장애 대응", desc: "POS 오류 시 현금 결제 전환 절차" },
      { title: "알레르기 안내 기준", desc: "주요 알레르기 항목 및 안내 방법" },
    ],
  },
  {
    category: "안전 관리",
    items: [
      { title: "AED 사용법", desc: "자동심장충격기 위치 및 사용 절차" },
      { title: "비상 대피 경로", desc: "구역별 대피 경로 및 집결지 안내" },
      { title: "소화기 사용법", desc: "소화기 종류별 사용 방법" },
    ],
  },
  {
    category: "커뮤니케이션",
    items: [
      { title: "무전기 사용 에티켓", desc: "무전 채널 배정 및 통화 방법" },
      { title: "관람객 응대 가이드", desc: "불만 처리 및 친절 응대 원칙" },
      { title: "미디어 응대 지침", desc: "언론·방송 촬영 요청 처리 방법" },
    ],
  },
];

const SEVERITY_CONFIG = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", badge: "bg-red-500/20 text-red-400 border-red-500/30", label: "긴급" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", badge: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "높음" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "보통" },
  low: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "낮음" },
};

export default function ManualTab() {
  const [activeSection, setActiveSection] = useState<"scenarios" | "manual">("scenarios");
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [expandedManual, setExpandedManual] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      {/* Section toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection("scenarios")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSection === "scenarios"
              ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
              : "bg-white/5 text-slate-500 border border-white/10"
          }`}
        >
          <Zap className="w-4 h-4" />
          돌발상황 시나리오
        </button>
        <button
          onClick={() => setActiveSection("manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSection === "manual"
              ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
              : "bg-white/5 text-slate-500 border border-white/10"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          운영 매뉴얼
        </button>
      </div>

      {activeSection === "scenarios" && (
        <div className="space-y-4">
          {/* Quick emergency contacts */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold text-red-400">즉시 연락처</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {[
                { role: "운영본부", num: "#100" },
                { role: "경비팀", num: "#101" },
                { role: "보안팀", num: "#102" },
                { role: "의료팀", num: "#106" },
                { role: "시설팀", num: "#103" },
              ].map((c) => (
                <div key={c.role} className="bg-red-500/10 rounded-xl p-2 text-center">
                  <p className="text-red-300 font-bold text-sm">{c.num}</p>
                  <p className="text-red-400/70 text-xs">{c.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {SCENARIOS.map((scenario) => {
              const cfg = SEVERITY_CONFIG[scenario.severity];
              const isExpanded = expandedScenario === scenario.id;

              return (
                <div key={scenario.id} className={`rounded-2xl border overflow-hidden ${cfg.bg} ${cfg.border}`}>
                  <button
                    onClick={() => setExpandedScenario(isExpanded ? null : scenario.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{scenario.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-bold text-sm">{scenario.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">{scenario.description}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className={`w-4 h-4 ${cfg.color} flex-shrink-0`} />
                      ) : (
                        <ChevronDown className={`w-4 h-4 ${cfg.color} flex-shrink-0`} />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-2">대응 순서</p>
                        <ol className="space-y-2">
                          {scenario.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                                {i + 1}
                              </span>
                              <span className="text-slate-300 text-xs leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-2">연락처</p>
                        <div className="flex flex-wrap gap-2">
                          {scenario.contacts.map((c) => (
                            <span key={c} className={`text-xs px-2 py-1 rounded-lg border font-mono ${cfg.badge}`}>{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === "manual" && (
        <div className="space-y-4">
          {OPERATION_MANUALS.map((section) => {
            const isExpanded = expandedManual === section.category;
            return (
              <div key={section.category} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedManual(isExpanded ? null : section.category)}
                  className="w-full px-5 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-bold text-sm">{section.category}</span>
                    <span className="text-slate-500 text-xs">{section.items.length}개 항목</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 space-y-2 border-t border-white/5 pt-3">
                    {section.items.map((item) => (
                      <div key={item.title} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer">
                        <p className="text-white text-sm font-medium mb-1">{item.title}</p>
                        <p className="text-slate-500 text-xs">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Emergency contacts full list */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">전체 비상 연락망</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {EMERGENCY_CONTACTS.map((c) => (
                <div key={c.role} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-slate-400 text-sm">{c.role}</span>
                  <span className={`font-mono font-bold ${c.color}`}>{c.number}</span>
                </div>
              ))}
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
                <span className="text-red-300 text-sm">119 소방</span>
                <span className="font-mono font-bold text-red-400">119</span>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between">
                <span className="text-blue-300 text-sm">112 경찰</span>
                <span className="font-mono font-bold text-blue-400">112</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
