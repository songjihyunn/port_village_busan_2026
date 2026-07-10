// ─── Staff Role Types ─────────────────────────────────────────────
export type StaffRole =
  | "entrance"   // 입장통제
  | "fnb"        // F&B
  | "market"     // 마켓
  | "popup"      // 팝업
  | "stage"      // 무대
  | "facility";  // 편의시설

export interface RoleConfig {
  id: StaffRole;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  zone: string;
}

// ─── Supabase DB Types ────────────────────────────────────────────
export interface Staff {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  zone: string;
  shift_start: string;  // "HH:MM"
  shift_end: string;
  is_trained: boolean;
  quiz_score: number | null;
  quiz_completed_at: string | null;
  created_at: string;
}

export interface QuizResult {
  id: string;
  staff_id: string;
  role: StaffRole;
  score: number;
  total: number;
  answers: QuizAnswer[];
  completed_at: string;
}

export interface QuizAnswer {
  question_id: number;
  selected: string | boolean;
  correct: boolean;
}

export interface ZoneCongestion {
  id: string;
  zone_id: string;
  zone_name: string;
  current_count: number;
  capacity: number;
  level: "low" | "medium" | "high" | "critical";
  updated_at: string;
}

export interface Alert {
  id: string;
  type: "emergency" | "warning" | "info";
  zone_id: string | null;
  message: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface TrainingNotification {
  id: string;
  staff_id: string;
  message: string;
  sent_at: string;
}

export interface ChecklistItem {
  id: string;
  category: string;
  task: string;
  is_done: boolean;
  done_by: string | null;
  done_at: string | null;
}

// ─── Quiz Types ───────────────────────────────────────────────────
export interface QuizQuestion {
  id: number;
  type: "ox" | "multiple";
  question: string;
  options?: string[];
  answer: string | boolean;
  explanation: string;
  scenario?: string;
}

// ─── Zone / Map Types ─────────────────────────────────────────────
export interface Zone {
  id: string;
  name: string;
  svgPath: string;
  color: string;
  center: { x: number; y: number };
  staffCount: number;
  capacity: number;
  role: StaffRole;
}

export interface Hotspot {
  id: string;
  zoneId: string;
  x: number;
  y: number;
  label: string;
  description: string;
  type: "info" | "warning" | "emergency";
  panoramaUrl?: string;
}

// ─── Timeline Event ───────────────────────────────────────────────
export interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  type: "setup" | "open" | "event" | "close";
}
