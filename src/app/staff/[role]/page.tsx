"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Map, Navigation, BookOpen, ClipboardCheck, ChevronRight,
  Phone, AlertTriangle, Clock, CheckCircle
} from "lucide-react";
import { ROLE_CONFIGS, EMERGENCY_CONTACTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { StaffRole } from "@/types";
import { PanoramaViewer } from "@/components/PanoramaViewer";

type Tab = "map" | "route" | "learn" | "quiz";

type RouteItem = {
  id: string;
  display_order: number;
  name: string;
  note: string | null;
  route_steps: { display_order: number; step: string }[];
};

type RouteData = {
  title: string;
  description: string;
  route_items: RouteItem[];
};

const TASK_CARDS: Record<StaffRole, { time: string; tasks: string[]; caution?: string }[]> = {
  entrance: [
    { time: "07:00–08:30", tasks: ["게이트 시설 점검", "QR 스캐너 작동 테스트", "바리케이드 설치"], caution: "스캐너 오작동 시 즉시 기술팀(#107) 연락" },
    { time: "08:30–09:00", tasks: ["스태프 최종 배치 확인", "대기 구역 정리", "입장 안내판 설치"] },
    { time: "09:00–13:00", tasks: ["QR 티켓 확인 및 입장 처리", "인원 카운팅", "혼잡 시 통제선 운영"], caution: "수용인원 80% 초과 시 즉시 운영본부 보고" },
    { time: "13:00–17:00", tasks: ["피크타임 강화 통제", "추가 게이트 운영 협조", "재입장 관리"] },
    { time: "17:00–22:00", tasks: ["퇴장 인원 관리", "분실물 접수", "최종 인원 집계 보고"] },
  ],
  fnb: [
    { time: "07:00–08:30", tasks: ["식재료 냉장 온도 확인(5°C↓)", "POS 시스템 점검", "위생용품 비치"], caution: "냉장 온도 이상 시 즉시 시설팀(#103) 신고" },
    { time: "08:30–11:00", tasks: ["메뉴 진열 및 가격표 부착", "식품 알레르기 안내 게시", "오픈 준비"] },
    { time: "11:00–14:00", tasks: ["주문 접수 및 서빙", "식품 위생 관리", "재고 현황 파악"], caution: "점심 피크타임 — 대기줄 10명 초과 시 팀장 보고" },
    { time: "14:00–18:00", tasks: ["중간 재고 보충", "조리 구역 청소", "오후 메뉴 전환"] },
    { time: "18:00–22:00", tasks: ["저녁 피크타임 대응", "마감 재고 정리", "현금 정산 보고"] },
  ],
  market: [
    { time: "08:00–09:00", tasks: ["부스 셋업 및 상품 진열", "통로 확보 확인", "가격표·결제 단말기 점검"] },
    { time: "09:00–13:00", tasks: ["관람객 응대·상품 안내", "결제 처리", "진열 상태 유지"], caution: "미승인 품목 판매 요청 시 운영팀(#104) 확인 필수" },
    { time: "13:00–17:00", tasks: ["피크타임 재고 관리", "판매 현황 기록", "부스 정리"] },
    { time: "17:00–20:00", tasks: ["마감 전 재고 정리", "현금·카드 정산", "분실물 확인"] },
    { time: "20:00–", tasks: ["부스 철수 및 정리", "귀중품 금고 보관", "이상 없음 보고"] },
  ],
  popup: [
    { time: "09:00–10:00", tasks: ["브랜드 담당자 미팅", "팝업 장비 전원 점검", "체험 동선 확인"], caution: "전기 이상 시 즉시 시설팀(#103) 신고 후 운영 중단" },
    { time: "10:00–13:00", tasks: ["방문객 체험 안내", "대기줄 관리", "촬영 구역 안내"] },
    { time: "13:00–16:00", tasks: ["피크타임 혼잡 관리", "입장통제팀 협조", "체험 대기 시간 안내"] },
    { time: "16:00–20:00", tasks: ["오후 방문객 대응", "브랜드 홍보 지원", "시간별 참여 인원 기록"] },
    { time: "20:00–", tasks: ["팝업 종료 안내", "장비 전원 차단", "브랜드 담당자 철수 지원"] },
  ],
  stage: [
    { time: "07:00–09:00", tasks: ["무대 안전 펜스 점검", "음향·조명 테스트", "비상 대피로 확인"], caution: "장비 이상 즉시 기술팀(#107) 보고 — 독단 수리 금지" },
    { time: "09:00–15:00", tasks: ["무대 주변 구역 통제", "스탠딩 구역 안전 관리", "안전선 유지"] },
    { time: "15:00–17:00", tasks: ["1부 공연 관객 안내", "모쉬핏 안전 모니터링", "VIP 구역 관리"] },
    { time: "17:00–18:00", tasks: ["공연 간 구역 정리", "교대 스태프 인계", "음향 레벨 이상 확인"] },
    { time: "18:00–22:00", tasks: ["2부 공연·피날레 집중 대응", "압사 위험 모니터링", "비상 대응 대기"] },
  ],
  facility: [
    { time: "07:00–09:00", tasks: ["화장실 청소 및 소모품 확인", "AED·구급함 점검", "안내센터 오픈 준비"] },
    { time: "09:00–13:00", tasks: ["관람객 안내·길 안내", "분실물 접수 및 보관", "화장실 순환 청소"] },
    { time: "13:00–17:00", tasks: ["미아·노약자 지원", "의무실 운영", "편의시설 순찰"] },
    { time: "17:00–21:00", tasks: ["시설 파손 확인·신고", "퇴장 인원 안내", "잔류 관람객 확인"] },
    { time: "21:00–", tasks: ["최종 시설 점검", "분실물 마감 정리", "의무실 마감"] },
  ],
};

// ─── 공간탐색 탭용 구역 좌표 ──────────────────────────
const ADMIN_PATHS: Record<string, { path: string; cx: number; cy: number; name: string; color: string }> = {
  F1:  { path: "M 18,46 L 238,46 L 238,189 L 18,189 Z",    cx: 128, cy: 100, name: "동문 식당가",      color: "#3b82f6" },
  C1:  { path: "M 248,46 L 472,46 L 472,189 L 248,189 Z",   cx: 360, cy: 120, name: "버블쇼·수중광장", color: "#f97316" },
  F2:  { path: "M 482,46 L 702,46 L 702,189 L 482,189 Z",   cx: 592, cy: 100, name: "서문 식당가",      color: "#3b82f6" },
  M1:  { path: "M 18,193 L 238,193 L 238,336 L 18,336 Z",   cx: 128, cy: 248, name: "동문시장",        color: "#22c55e" },
  FA1: { path: "M 248,193 L 472,193 L 472,336 L 248,336 Z", cx: 360, cy: 273, name: "의무실·안내센터",  color: "#a855f7" },
  M2:  { path: "M 482,193 L 702,193 L 702,336 L 482,336 Z", cx: 592, cy: 248, name: "서문시장",        color: "#22c55e" },
  FA2: { path: "M 730,40 L 890,40 L 890,340 L 730,340 Z",   cx: 810, cy: 190, name: "파도비우소",      color: "#a855f7" },
  F3:  { path: "M 20,372 L 100,372 L 100,416 L 20,416 Z",   cx: 60,  cy: 394, name: "푸드트럭존",      color: "#3b82f6" },
  F4:  { path: "M 100,372 L 180,372 L 180,416 L 100,416 Z", cx: 140, cy: 394, name: "FOOD 부스 1",    color: "#3b82f6" },
  E1:  { path: "M 180,372 L 260,372 L 260,416 L 180,416 Z", cx: 220, cy: 394, name: "출입구(동문)",    color: "#534AB7" },
  F5:  { path: "M 260,372 L 560,372 L 560,416 L 260,416 Z", cx: 410, cy: 394, name: "FOOD 부스 2",    color: "#3b82f6" },
  E2:  { path: "M 560,372 L 640,372 L 640,416 L 560,416 Z", cx: 600, cy: 394, name: "출입구(서문)",    color: "#534AB7" },
  F6:  { path: "M 640,372 L 880,372 L 880,416 L 640,416 Z", cx: 760, cy: 394, name: "FOOD 부스 3",    color: "#3b82f6" },
  P1:  { path: "M 20,430 L 220,430 L 220,650 L 20,650 Z",   cx: 120, cy: 540, name: "BTS THE CITY",   color: "#eab308" },
  C2:  { path: "M 230,430 L 370,430 L 370,650 L 230,650 Z", cx: 300, cy: 540, name: "파도놀이터",      color: "#f97316" },
  FA5: { path: "M 380,475 L 470,475 L 470,605 L 380,605 Z", cx: 425, cy: 540, name: "항구마을우물",    color: "#a855f7" },
  M3:  { path: "M 480,430 L 610,430 L 610,650 L 480,650 Z", cx: 545, cy: 540, name: "파도마당",        color: "#22c55e" },
  F8:  { path: "M 620,430 L 740,430 L 740,650 L 620,650 Z", cx: 680, cy: 540, name: "부산고메셀렉션",  color: "#3b82f6" },
  C3:  { path: "M 750,430 L 815,430 L 815,650 L 750,650 Z", cx: 782, cy: 540, name: "포트게더링",      color: "#f97316" },
  E3:  { path: "M 825,430 L 865,430 L 865,650 L 825,650 Z", cx: 845, cy: 540, name: "입구",            color: "#534AB7" },
};

// ─── 동선 맵용 구역 좌표 ──────────────────────────────
const ZONE_PATHS: Record<string, { path: string; cx: number; cy: number; color: string; label: string }> = {
  F1:  { path: "M 18,46 L 238,46 L 238,189 L 18,189 Z",    cx: 128, cy: 118, color: "#3b82f6", label: "동문식당가" },
  C1:  { path: "M 248,46 L 472,46 L 472,189 L 248,189 Z",   cx: 360, cy: 118, color: "#f97316", label: "수중광장" },
  F2:  { path: "M 482,46 L 702,46 L 702,189 L 482,189 Z",   cx: 592, cy: 118, color: "#3b82f6", label: "서문식당가" },
  M1:  { path: "M 18,193 L 238,193 L 238,336 L 18,336 Z",   cx: 128, cy: 265, color: "#22c55e", label: "동문시장" },
  FA1: { path: "M 248,193 L 472,193 L 472,336 L 248,336 Z", cx: 360, cy: 265, color: "#a855f7", label: "의무실" },
  M2:  { path: "M 482,193 L 702,193 L 702,336 L 482,336 Z", cx: 592, cy: 265, color: "#22c55e", label: "서문시장" },
  FA2: { path: "M 730,40 L 890,40 L 890,340 L 730,340 Z",   cx: 810, cy: 190, color: "#a855f7", label: "파도비우소" },
  F3:  { path: "M 20,372 L 100,372 L 100,416 L 20,416 Z",   cx: 60,  cy: 394, color: "#3b82f6", label: "푸드트럭" },
  F4:  { path: "M 100,372 L 180,372 L 180,416 L 100,416 Z", cx: 140, cy: 394, color: "#3b82f6", label: "F부스1" },
  E1:  { path: "M 180,372 L 260,372 L 260,416 L 180,416 Z", cx: 220, cy: 394, color: "#534AB7", label: "E1" },
  F5:  { path: "M 260,372 L 560,372 L 560,416 L 260,416 Z", cx: 410, cy: 394, color: "#3b82f6", label: "F부스2" },
  E2:  { path: "M 560,372 L 640,372 L 640,416 L 560,416 Z", cx: 600, cy: 394, color: "#534AB7", label: "E2" },
  F6:  { path: "M 640,372 L 880,372 L 880,416 L 640,416 Z", cx: 760, cy: 394, color: "#3b82f6", label: "F부스3" },
  P1:  { path: "M 20,430 L 220,430 L 220,650 L 20,650 Z",   cx: 120, cy: 540, color: "#eab308", label: "BTS" },
  C2:  { path: "M 230,430 L 370,430 L 370,650 L 230,650 Z", cx: 300, cy: 540, color: "#f97316", label: "파도놀이터" },
  FA5: { path: "M 380,475 L 470,475 L 470,605 L 380,605 Z", cx: 425, cy: 540, color: "#a855f7", label: "우물" },
  M3:  { path: "M 480,430 L 610,430 L 610,650 L 480,650 Z", cx: 545, cy: 540, color: "#22c55e", label: "파도마당" },
  F8:  { path: "M 620,430 L 740,430 L 740,650 L 620,650 Z", cx: 680, cy: 540, color: "#3b82f6", label: "고메" },
  C3:  { path: "M 750,430 L 815,430 L 815,650 L 750,650 Z", cx: 782, cy: 540, color: "#f97316", label: "포트게더링" },
  E3:  { path: "M 825,430 L 865,430 L 865,650 L 825,650 Z", cx: 845, cy: 540, color: "#534AB7", label: "E3\n입구" },
};

// ─── 동선 레이어 타입 (Supabase fetch용) ──────────────
type RouteLayer = {
  id: string;
  label: string;
  color: string;
  zones: string[];
  paths: [number, number][][];
};

const HIGHLIGHT_ZONES_BY_ROLE: Record<StaffRole, string[]> = {
  entrance: ["E1", "E2", "E3"],
  fnb:      ["F1", "F2", "F3", "F4", "F5", "F6", "F8"],
  market:   ["M1", "M2"],
  popup:    ["P1"],
  stage:    ["C1", "C3"],
  facility: ["FA1", "FA2", "FA5"],
};

const ZONE_DESCRIPTIONS: Record<StaffRole, { id: string; name: string; desc: string }[]> = {
  entrance: [
    { id: "E1", name: "출입구(동문)", desc: "야외 구역 좌측 메인 게이트. QR 티켓 검사 및 입장 처리." },
    { id: "E2", name: "출입구(서문)", desc: "야외 구역 우측 게이트. 피크타임 추가 게이트 운영." },
    { id: "E3", name: "입구",         desc: "야외 최우측 입구. 퇴장 인원 관리 및 재입장 통제." },
  ],
  fnb: [
    { id: "F1", name: "동문 식당가",    desc: "실내 FOOD존. 샤미헌 팝업 입점." },
    { id: "F2", name: "서문 식당가",    desc: "실내 FOOD존. MoGuMoGu 팝업 입점." },
    { id: "F3", name: "푸드트럭존",    desc: "야외 FOOD부스 좌단. 식재료 하역 동선 인접." },
    { id: "F4", name: "FOOD 부스 1",  desc: "야외 FOOD부스." },
    { id: "F5", name: "FOOD 부스 2",  desc: "야외 FOOD부스." },
    { id: "F6", name: "FOOD 부스 3",  desc: "야외 FOOD부스." },
    { id: "F8", name: "부산고메셀렉션", desc: "야외 부산고메셀렉션 부스." },
  ],
  market: [
    { id: "M1", name: "동문시장", desc: "실내 플리마켓. 로컬스튜디오 팝업 입점." },
    { id: "M2", name: "서문시장", desc: "실내 플리마켓. 고봉민김밥인 팝업 입점." },
  ],
  popup: [
    { id: "P1", name: "BTS THE CITY", desc: "야외 팝업존 메인. 항구마을 테마." },
  ],
  stage: [
    { id: "C1", name: "버블쇼·수중광장", desc: "실내 메인 공연·체험 구역." },
    { id: "C3", name: "포트게더링",      desc: "야외 모임·공연 구역." },
  ],
  facility: [
    { id: "FA1", name: "의무실·안내센터", desc: "실내 편의시설 메인. AED·구급함 비치." },
    { id: "FA2", name: "파도비우소",      desc: "독립 화장실·수유실." },
    { id: "FA5", name: "항구마을 우물",   desc: "야외 포토존 겸 휴게 공간." },
  ],
};

// ─── 꺾인 경로 → SVG path d 속성 ────────────────
function buildPolylinePath(points: [number, number][]): string {
  if (points.length < 2) return "";
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
}

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.role as StaffRole;
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [isLearned, setIsLearned] = useState(false);
  const [isMapViewed, setIsMapViewed] = useState(false);
  const [isRouteViewed, setIsRouteViewed] = useState(false);

  const roleConfig = ROLE_CONFIGS.find((r) => r.id === roleId);

  useEffect(() => {
    if (!ROLE_CONFIGS.find((r) => r.id === roleId)) {
      router.push("/staff");
      return;
    }
    const saved = localStorage.getItem("pv2026_progress") || "{}";
    const data = JSON.parse(saved);
    const rp = data[roleId] || {};
    setIsLearned(!!rp.learned);
    setIsRouteViewed(!!rp.routeViewed);
    if (!rp.mapViewed) {
      data[roleId] = { ...rp, mapViewed: true };
      localStorage.setItem("pv2026_progress", JSON.stringify(data));
    }
    setIsMapViewed(true);
  }, [roleId, router]);

  const markProgress = (key: "routeViewed" | "learned") => {
    const saved = localStorage.getItem("pv2026_progress") || "{}";
    const data = JSON.parse(saved);
    data[roleId] = { ...data[roleId], [key]: true };
    localStorage.setItem("pv2026_progress", JSON.stringify(data));
  };

  const handleMarkRouteViewed = () => { markProgress("routeViewed"); setIsRouteViewed(true); };
  const handleMarkLearned     = () => { markProgress("learned");      setIsLearned(true);    };

  if (!roleConfig) return null;

  const tasks = TASK_CARDS[roleId] || [];

  const TABS = [
    { id: "map"   as Tab, label: "공간탐색", icon: Map,            done: isMapViewed   },
    { id: "route" as Tab, label: "동선",     icon: Navigation,     done: isRouteViewed },
    { id: "learn" as Tab, label: "업무학습", icon: BookOpen,       done: isLearned     },
    { id: "quiz"  as Tab, label: "퀴즈",     icon: ClipboardCheck, done: false         },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-[#0B1628]/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/staff" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">{roleConfig.icon}</span>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">{roleConfig.label}</h1>
              <p className="text-xs text-slate-500">{roleConfig.zone}</p>
            </div>
          </div>
          {isLearned && (
            <div className="ml-auto flex items-center gap-1 text-green-400 text-xs">
              <CheckCircle className="w-4 h-4" />
              <span>학습완료</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 mt-3">
          {TABS.map(({ id, label, icon: Icon, done }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-medium transition-all ${
                activeTab === id
                  ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                  : done
                  ? "text-green-400 hover:text-green-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3 h-3 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {activeTab === "map"   && <MapTab roleId={roleId} roleConfig={roleConfig} />}
        {activeTab === "route" && (
          <RouteTab roleId={roleId} isRouteViewed={isRouteViewed} onMarkRouteViewed={handleMarkRouteViewed} />
        )}
        {activeTab === "learn" && (
          <LearnTab roleId={roleId} tasks={tasks} isLearned={isLearned} onMarkLearned={handleMarkLearned} />
        )}
        {activeTab === "quiz" && (
          <div className="p-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-white font-bold text-lg mb-2">돌발상황 퀴즈</h3>
              <p className="text-slate-400 text-sm mb-6">7문항 · 실제 현장 상황 기반 · 합격 기준 5점 이상</p>
              {!isLearned && <p className="text-amber-400 text-xs mb-4">⚠️ 업무 학습을 먼저 완료해주세요</p>}
              <Link href={`/staff/${roleId}/quiz`}>
                <button
                  className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
                    isLearned ? "bg-amber-400 text-[#0B1628] hover:bg-amber-300" : "bg-white/10 text-slate-500 cursor-not-allowed"
                  }`}
                  disabled={!isLearned}
                >
                  퀴즈 시작하기
                  <ChevronRight className="inline w-5 h-5 ml-1" />
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── RouteTab ─────────────────────────────────────────
function RouteTab({ roleId, isRouteViewed, onMarkRouteViewed }: {
  roleId: StaffRole; isRouteViewed: boolean; onMarkRouteViewed: () => void;
}) {
  const [data, setData] = useState<RouteData | null>(null);
  const [layers, setLayers] = useState<RouteLayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLayerIdx, setActiveLayerIdx] = useState(0);

  const activeLayer = layers[activeLayerIdx] ?? null;
  const activeZones = new Set(activeLayer?.zones ?? []);

  useEffect(() => {
    setActiveLayerIdx(0);
    const supabase = createClient();
    const fetchAll = async () => {
      const { data: rd } = await supabase
        .from("route_data")
        .select("id, title, description")
        .eq("role", roleId)
        .single();

      if (!rd) { setLoading(false); return; }

      const { data: items } = await supabase
        .from("route_items")
        .select("id, display_order, name, note")
        .eq("route_data_id", rd.id)
        .order("display_order");

      if (!items) { setLoading(false); return; }

      const itemIds = items.map((i: any) => i.id);
      const { data: steps } = await supabase
        .from("route_steps")
        .select("route_item_id, display_order, step")
        .in("route_item_id", itemIds)
        .order("display_order");

      setData({
        title: rd.title,
        description: rd.description,
        route_items: items.map((item: any) => ({
          ...item,
          route_steps: (steps ?? [])
            .filter((s: any) => s.route_item_id === item.id)
            .sort((a: any, b: any) => a.display_order - b.display_order),
        })),
      });

      const { data: rps } = await supabase
        .from("route_paths")
        .select("id, display_order, label, color")
        .eq("role", roleId)
        .order("display_order");

      if (!rps || rps.length === 0) { setLoading(false); return; }

      const rpIds = rps.map((r: any) => r.id);

      const [{ data: zones }, { data: waypoints }] = await Promise.all([
        supabase
          .from("route_path_zones")
          .select("route_path_id, zone_id")
          .in("route_path_id", rpIds),
        supabase
          .from("route_path_waypoints")
          .select("route_path_id, path_index, display_order, x, y")
          .in("route_path_id", rpIds)
          .order("path_index")
          .order("display_order"),
      ]);

      const assembled: RouteLayer[] = rps.map((rp: any) => {
        const rpZones = (zones ?? [])
          .filter((z: any) => z.route_path_id === rp.id)
          .map((z: any) => z.zone_id);

        const rpWaypoints = (waypoints ?? []).filter((w: any) => w.route_path_id === rp.id);
        const pathMap: Record<number, [number, number][]> = {};
        rpWaypoints.forEach((w: any) => {
          if (!pathMap[w.path_index]) pathMap[w.path_index] = [];
          pathMap[w.path_index].push([w.x, w.y]);
        });
        const paths = Object.keys(pathMap)
          .sort((a, b) => Number(a) - Number(b))
          .map(k => pathMap[Number(k)]);

        return { id: rp.id, label: rp.label, color: rp.color, zones: rpZones, paths };
      });

      setLayers(assembled);
      setLoading(false);
    };
    fetchAll();
  }, [roleId]);

  if (loading) return (
    <div className="p-4 flex items-center justify-center h-40">
      <p className="text-slate-500 text-sm">동선 불러오는 중...</p>
    </div>
  );

  if (!data) return (
    <div className="p-4 flex items-center justify-center h-40">
      <p className="text-slate-500 text-sm">동선 데이터를 찾을 수 없습니다.</p>
    </div>
  );

  const activeItem = data.route_items[activeLayerIdx] ?? null;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="text-white font-bold text-sm mb-1">{data.title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed">{data.description}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-500 font-medium px-1">동선 선택</p>
        <div className="flex flex-wrap gap-2">
          {layers.map((layer, i) => (
            <button
              key={i}
              onClick={() => setActiveLayerIdx(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                activeLayerIdx === i
                  ? "text-white border-white/30"
                  : "text-slate-400 border-white/10 hover:text-slate-200"
              }`}
              style={activeLayerIdx === i
                ? { background: layer.color + "30", borderColor: layer.color + "80" }
                : {}}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: layer.color }} />
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#070f1f] rounded-2xl overflow-hidden border border-white/10">
        <svg
          viewBox="0 0 900 680"
          className="w-full"
          style={{ background: "linear-gradient(135deg, #070f1f 0%, #0d1d3a 100%)" }}
        >
          <defs>
            <marker id="rarrow" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
          </defs>

          <rect x="10" y="40" width="700" height="300" rx="8" fill="none"
            stroke="#334155" strokeWidth="1" strokeDasharray="6 4" />
          <text x="22" y="32" fill="#64748b" fontSize="11">실내 (수중 테마)</text>
          <rect x="10" y="360" width="880" height="300" rx="8" fill="none"
            stroke="#334155" strokeWidth="1" strokeDasharray="6 4" />
          <text x="22" y="352" fill="#64748b" fontSize="11">야외 구역</text>
          <rect x="20" y="372" width="860" height="44" rx="6" fill="none"
            stroke="#2B7FD4" strokeWidth="1" strokeDasharray="3 2" />

          {Object.entries(ZONE_PATHS).map(([id, zone]) => {
            const isActive = activeZones.has(id);
            const activeColor = activeLayer?.color ?? zone.color;
            const lines = zone.label.split("\n");
            const isBig = ["F1","C1","F2","M1","FA1","M2","FA2","P1","C2","M3","F8","C3"].includes(id);
            const labelSize = isBig ? (isActive ? "18" : "13") : (isActive ? "13" : "10");
            const lineH = isBig ? 22 : 15;
            const baseY = zone.cy - (lines.length > 1 ? lineH * 0.5 : 0);

            return (
              <g key={id}>
                <path
                  d={zone.path}
                  fill={isActive ? activeColor + "40" : "rgba(255,255,255,0.03)"}
                  stroke={isActive ? activeColor : "#1e293b"}
                  strokeWidth={isActive ? 2 : 1}
                  opacity={isActive ? 1 : 0.4}
                />
                {lines.map((line, i) => (
                  <text key={i}
                    x={zone.cx} y={baseY + i * lineH}
                    textAnchor="middle"
                    fill={isActive ? "white" : "#475569"}
                    fontSize={labelSize}
                    fontWeight={isActive ? "bold" : "normal"}
                    opacity={isActive ? 1 : 0.5}
                  >
                    {line}
                  </text>
                ))}
                <text
                  x={zone.cx} y={baseY + lines.length * lineH}
                  textAnchor="middle"
                  fill={isActive ? activeColor : "#334155"}
                  fontSize={isBig ? "13" : "10"}
                  opacity={isActive ? 0.9 : 0.3}
                >
                  {id}
                </text>
              </g>
            );
          })}

          {activeLayer?.paths.map((points, i) => {
            const d = buildPolylinePath(points as [number,number][]);
            if (!d) return null;
            return (
              <path key={i} d={d} fill="none"
                stroke={activeLayer.color}
                strokeWidth="4"
                strokeLinecap="square"
                strokeLinejoin="miter"
                opacity="0.85"
                markerEnd="url(#rarrow)"
              />
            );
          })}
        </svg>
      </div>

      {activeItem && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: (activeLayer?.color ?? "#fff") + "30",
                border: `1px solid ${activeLayer?.color ?? "#fff"}60`,
              }}
            >
              <span className="text-xs font-bold" style={{ color: activeLayer?.color ?? "white" }}>
                {activeLayerIdx + 1}
              </span>
            </div>
            <h4 className="text-white font-medium text-sm">{activeItem.name}</h4>
          </div>
          <div className="pl-2">
            {activeItem.route_steps.map((s, j, arr) => (
              <div key={j} className="flex items-start gap-2">
                <div className="flex flex-col items-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: (activeLayer?.color ?? "#fff") + "99" }} />
                  {j < arr.length - 1 && <div className="w-px h-5 bg-white/10 my-0.5" />}
                </div>
                <span className="text-slate-300 text-xs pb-2">{s.step}</span>
              </div>
            ))}
          </div>
          {activeItem.note && (
            <div className="mt-2 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs leading-relaxed">{activeItem.note}</p>
            </div>
          )}
        </div>
      )}

      <details className="group">
        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 px-1 list-none flex items-center gap-1 select-none">
          <span className="group-open:rotate-90 transition-transform inline-block">›</span>
          전체 동선 목록 보기
        </summary>
        <div className="mt-3 space-y-3">
          {data.route_items.map((item, i) => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: (layers[i]?.color ?? "#fff") + "30",
                    border: `1px solid ${layers[i]?.color ?? "#fff"}60`,
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: layers[i]?.color ?? "white" }}>{i + 1}</span>
                </div>
                <h4 className="text-white font-medium text-sm">{item.name}</h4>
              </div>
              <div className="pl-2">
                {item.route_steps.map((s, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                      {j < item.route_steps.length - 1 && <div className="w-px h-5 bg-white/10 my-0.5" />}
                    </div>
                    <span className="text-slate-300 text-xs pb-2">{s.step}</span>
                  </div>
                ))}
              </div>
              {item.note && (
                <div className="mt-2 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-xs leading-relaxed">{item.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </details>

      {!isRouteViewed ? (
        <button
          onClick={onMarkRouteViewed}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-[#0B1628] rounded-2xl font-bold text-base shadow-lg shadow-amber-500/25"
        >
          ✓ 동선 확인 완료
        </button>
      ) : (
        <div className="w-full py-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
          <p className="text-green-400 font-bold">✓ 동선 확인 완료!</p>
          <p className="text-slate-500 text-xs mt-1">업무학습 탭으로 이동하여 학습을 계속하세요</p>
        </div>
      )}
    </div>
  );
}

// ─── MapTab ───────────────────────────────────────────
function MapTab({ roleId, roleConfig }: { roleId: StaffRole; roleConfig: typeof ROLE_CONFIGS[0] }) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [showPanorama, setShowPanorama] = useState(false);
  const highlightIds = HIGHLIGHT_ZONES_BY_ROLE[roleId] || [];
  const zoneDescs    = ZONE_DESCRIPTIONS[roleId] || [];
  const selectedDesc = selectedZoneId ? zoneDescs.find((z) => z.id === selectedZoneId) : null;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
        <span className="text-2xl">{roleConfig.icon}</span>
        <div className="flex-1">
          <p className="text-white text-sm font-bold">{roleConfig.label} 담당 구역 도면</p>
          <p className="text-slate-400 text-xs mt-0.5">강조된 구역이 내 담당 구역입니다. 구역을 탭하면 설명을 볼 수 있습니다.</p>
        </div>
        <button
          onClick={() => setShowPanorama(!showPanorama)}
          className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-lg whitespace-nowrap"
        >
          {showPanorama ? "도면 보기" : "🔄 360° 뷰"}
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-3 border-b border-white/5">
          <p className="text-xs font-medium text-white">{showPanorama ? "360° 파노라마 뷰" : "포트빌리지 부산 2026 행사장 배치도"}</p>
          <p className="text-slate-500 text-xs mt-0.5">{showPanorama ? "구역 탭 후 해당 구역 사진 표시" : "담당 구역 탭 → 상세 정보"}</p>
        </div>
        {showPanorama ? (
          <div className="overflow-hidden p-3 space-y-4">
            <div>
              <div className="text-[11px] text-slate-400 mb-1 font-mono tracking-tight">OBJECT 3D VIEW</div>
              <LocalModelViewer zoneId={selectedZoneId ?? highlightIds[0]} />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-1 font-mono tracking-tight">REAL PANORAMA 360°</div>
              <PanoramaViewer zoneId={selectedZoneId ?? highlightIds[0]} height={200} />
            </div>
          </div>
        ) : (
          <div className="p-3">
            <svg
              viewBox="0 0 900 680"
              className="w-full"
              style={{ background: "linear-gradient(135deg, #070f1f 0%, #0d1d3a 100%)" }}
            >
              <rect x="10" y="40" width="700" height="300" rx="8" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="6 4" />
              <text x="22" y="32" fill="#64748b" fontSize="13">실내 (수중 테마)</text>
              <rect x="10" y="360" width="880" height="300" rx="8" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="6 4" />
              <text x="22" y="352" fill="#64748b" fontSize="13">야외 구역</text>
              <rect x="20" y="372" width="860" height="44" rx="6" fill="none" stroke="#2B7FD4" strokeWidth="1" strokeDasharray="3 2" />

              {Object.entries(ADMIN_PATHS).map(([id, zone]) => {
                const isHighlight = highlightIds.includes(id);
                const isSelected  = selectedZoneId === id;
                return (
                  <g key={id} onClick={() => isHighlight ? setSelectedZoneId(isSelected ? null : id) : undefined}
                    style={{ cursor: isHighlight ? "pointer" : "default" }}>
                    {isHighlight && <path d={zone.path} fill="none" stroke={zone.color} strokeWidth="6" opacity="0.25" />}
                    <path
                      d={zone.path}
                      fill={isHighlight ? (isSelected ? zone.color + "55" : zone.color + "30") : "rgba(255,255,255,0.03)"}
                      stroke={isSelected ? "#F4A72A" : (isHighlight ? zone.color : "#1e293b")}
                      strokeWidth={isSelected ? 3 : (isHighlight ? 2 : 1)}
                      opacity={isHighlight ? 1 : 0.4}
                    />
                    <text x={zone.cx} y={zone.cy - 6} textAnchor="middle"
                      fill={isHighlight ? "white" : "#475569"}
                      fontSize={isHighlight ? "13" : "11"}
                      fontWeight={isHighlight ? "bold" : "normal"}
                      opacity={isHighlight ? 1 : 0.6}>
                      {zone.name}
                    </text>
                    <text x={zone.cx} y={zone.cy + 14} textAnchor="middle"
                      fill={isHighlight ? "#fbbf24" : "#334155"}
                      fontSize="10"
                      fontWeight={isHighlight ? "bold" : "normal"}
                      opacity={isHighlight ? 1 : 0.5}>
                      {id}
                    </text>
                    {isHighlight && !isSelected && (
                      <circle cx={zone.cx} cy={zone.cy + 28} r="4" fill={zone.color} opacity="0.8" className="animate-pulse" />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {selectedDesc && (
        <div className="bg-[#534AB7]/10 border border-[#534AB7]/40 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl mt-0.5">🚧</span>
          <div>
            <p className="text-white font-bold text-sm">{selectedDesc.id} · {selectedDesc.name}</p>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed">{selectedDesc.desc}</p>
          </div>
          <button onClick={() => setSelectedZoneId(null)} className="ml-auto text-slate-500 hover:text-white text-lg leading-none">×</button>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-slate-500 font-medium px-1">내 담당 구역 ({highlightIds.length}개)</p>
        {zoneDescs.map((z) => (
          <button
            key={z.id}
            onClick={() => setSelectedZoneId(selectedZoneId === z.id ? null : z.id)}
            className={`w-full text-left flex items-center gap-3 rounded-xl p-3 border transition-all ${
              selectedZoneId === z.id ? "bg-amber-400/10 border-amber-400/30" : "bg-white/5 border-white/10 hover:bg-white/8"
            }`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: ADMIN_PATHS[z.id]?.color + "33", color: ADMIN_PATHS[z.id]?.color }}>
              {z.id}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{z.name}</p>
              <p className="text-slate-400 text-xs truncate mt-0.5">{z.desc}</p>
            </div>
            {selectedZoneId === z.id && <span className="text-amber-400 text-xs font-bold">선택됨</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm" style={{ background: "#534AB7", opacity: 0.7 }} />
          <span className="text-xs text-slate-400">강조: 내 담당 구역</span>
        </div>
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-slate-700" />
          <span className="text-xs text-slate-400">음영: 타 구역</span>
        </div>
      </div>
    </div>
  );
}

// ─── LearnTab ─────────────────────────────────────────
function LearnTab({ roleId, tasks, isLearned, onMarkLearned }: {
  roleId: StaffRole; tasks: typeof TASK_CARDS[StaffRole]; isLearned: boolean; onMarkLearned: () => void;
}) {
  const [expandedTime, setExpandedTime] = useState<string | null>(tasks[0]?.time ?? null);

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-slate-300">시간대별 업무</span>
        </div>
        {tasks.map((block) => (
          <div key={block.time} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <button onClick={() => setExpandedTime(expandedTime === block.time ? null : block.time)}
              className="w-full px-4 py-3 flex items-center justify-between">
              <span className="text-amber-400 font-mono text-sm font-bold">{block.time}</span>
              <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${expandedTime === block.time ? "rotate-90" : ""}`} />
            </button>
            {expandedTime === block.time && (
              <div className="px-4 pb-4 space-y-3">
                <ul className="space-y-2">
                  {block.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-amber-400 text-xs">{i + 1}</span>
                      </span>
                      <span className="text-slate-300 text-sm">{task}</span>
                    </li>
                  ))}
                </ul>
                {block.caution && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs">{block.caution}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-slate-300">비상 연락망</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {EMERGENCY_CONTACTS.map((contact) => (
            <div key={contact.role} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">{contact.role}</span>
              <a href={`tel:${contact.number}`} className={`text-sm font-bold font-mono ${contact.color}`}>{contact.number}</a>
            </div>
          ))}
        </div>
      </div>

      {!isLearned ? (
        <button onClick={onMarkLearned}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-[#0B1628] rounded-2xl font-bold text-base shadow-lg shadow-amber-500/25">
          ✓ 학습 완료 확인
        </button>
      ) : (
        <div className="w-full py-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
          <p className="text-green-400 font-bold">✓ 학습 완료!</p>
          <p className="text-slate-500 text-xs mt-1">퀴즈 탭으로 이동하여 퀴즈를 진행하세요</p>
        </div>
      )}
    </div>
  );
}

// ─── LocalModelViewer ────────────────────────────────
function LocalModelViewer({ zoneId }: { zoneId: string }) {
  const modelSrcMap: Record<string, string> = {
    F1: "/models/dongmun_food.glb",
    F2: "/models/seomun_food.glb",
    F3: "/models/food_truck.glb",
    F4: "/models/F1_food.glb",
    F5: "/models/F5_food.glb",
    F6: "/models/F6_food.glb",
    F8: "/models/F8_gome.glb",
    C1: "/models/wave_yard.glb",
    C3: "/models/port_gathering.glb",
    M1: "/models/dongmun_market.glb",
    M2: "/models/seomun_market.glb",
    E1: "/models/dongmun_entrance.glb",
    E2: "/models/seomun_entrance.glb",
    E3: "/models/입구 (2).glb",
    FA1: "/models/medical.glb",
    FA2: "/models/toilet.glb",
    FA5: "/models/항구마을.glb",
    P1: "/models/bts.glb",
  };
  const modelSrc = modelSrcMap[zoneId] || "/models/제목 없음.glb";

  useEffect(() => {
    // @ts-ignore
    import("@google/model-viewer").catch(() => {});
  }, []);

  return (
    <div className="relative w-full h-[240px] bg-gradient-to-b from-[#0d1d3a] to-[#070f1f] rounded-2xl overflow-hidden border border-white/10 shadow-inner group">
      {/* @ts-ignore */}
      <model-viewer
        src={modelSrc}
        alt={`${zoneId} 구역 3D 모델`}
        camera-controls
        touch-action="pan-y"
        shadow-intensity="1.5"
        shadow-softness="0.5"
        auto-rotate
        camera-orbit="0deg 30deg 5m"
        min-camera-orbit="auto 75deg auto"
        max-camera-orbit="auto 75deg auto"
        field-of-view="35deg"
        interaction-prompt="none"
        auto-rotate-delay="1000"
        rotation-per-second="30deg"
        style={{ width: "100%", height: "100%", backgroundColor: "#ffffff", outline: "none" }}
      >
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] text-amber-400 px-2.5 py-1 rounded-lg border border-amber-400/30 z-10 font-mono tracking-wider shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>3D_MESH: {zoneId}</span>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/60 backdrop-blur-sm text-[9px] text-slate-400 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-white/5 whitespace-nowrap">
          🖱️ 드래그하여 회전 / 휠로 확대·축소
        </div>
      {/* @ts-ignore */}
      </model-viewer>
    </div>
  );
}
