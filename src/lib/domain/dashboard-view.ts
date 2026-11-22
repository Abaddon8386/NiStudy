/** Số hiển thị ở trang chính, tính từ kết quả get_dashboard (FR-21, FR-22, FR-24). Hàm thuần. */
import { estimateMinutes, examCountdown, type ExamCountdown } from "./dashboard";

export interface DashboardData {
  dueCount: number;
  newDoneToday: number;
  newPerDay: number;
  reviewLimit: number;
  streak: number;
  totalDays: number;
  xpTotal: number;
  xpToday: number;
  medianSeconds: number | null;
  examDate: string | null;
  studiedToday: boolean;
  /** Cấp đang học (ô "Thi JLPT N_"); null khi RPC cũ chưa trả. */
  level: "N5" | "N4" | null;
  /** Ngày học trong 35 ngày gần nhất ("YYYY-MM-DD"); null khi RPC cũ chưa trả (ẩn lưới). */
  studyDays: string[] | null;
}

export interface DashboardView {
  /** Thẻ đến hạn sẽ ôn hôm nay (đã chặn theo giới hạn ôn mỗi ngày). */
  dueToday: number;
  /** Thẻ mới còn lại so với mục tiêu. */
  newRemaining: number;
  total: number;
  minutes: number;
  done: boolean;
  newProgress: { done: number; goal: number; pct: number };
  exam: ExamCountdown;
}

export function buildDashboardView(d: DashboardData, today: string): DashboardView {
  const dueToday = Math.max(0, Math.min(d.dueCount, d.reviewLimit));
  const newRemaining = Math.max(0, d.newPerDay - d.newDoneToday);
  const total = dueToday + newRemaining;
  const goal = d.newPerDay;
  return {
    dueToday,
    newRemaining,
    total,
    minutes: estimateMinutes(total, d.medianSeconds),
    done: total === 0,
    newProgress: {
      done: d.newDoneToday,
      goal,
      pct: goal > 0 ? Math.min(100, Math.round((d.newDoneToday / goal) * 100)) : 0,
    },
    exam: examCountdown(d.examDate, today),
  };
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

/** Chuyển JSON RPC (snake_case) sang kiểu có định nghĩa; null nếu không phải đối tượng. */
export function parseDashboard(raw: unknown): DashboardData | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.due_count !== "number" || typeof r.new_per_day !== "number") return null;
  return {
    dueCount: num(r.due_count),
    newDoneToday: num(r.new_done_today),
    newPerDay: num(r.new_per_day),
    reviewLimit: num(r.review_limit, 100),
    streak: num(r.streak),
    totalDays: num(r.total_days),
    xpTotal: num(r.xp_total),
    xpToday: num(r.xp_today),
    medianSeconds: typeof r.median_seconds_7d === "number" ? r.median_seconds_7d : null,
    examDate: typeof r.exam_date === "string" ? r.exam_date : null,
    studiedToday: r.studied_today === true,
    level: r.level === "N5" || r.level === "N4" ? r.level : null,
    studyDays: Array.isArray(r.study_days_35)
      ? r.study_days_35.filter((x): x is string => typeof x === "string" && ISO_DAY.test(x))
      : null,
  };
}

const DAY_MS = 86_400_000;
export const GRID_DAYS = 35;

export interface StudyCell {
  date: string;
  studied: boolean;
  today: boolean;
}

/**
 * Lưới dải ngày học (S-06): 35 ô từ cũ đến mới, ô cuối là hôm nay. Ô hôm nay lấy theo `studiedToday`
 * (khớp chuỗi ngày ở máy chủ). Cả `today` và phần tử `days` là "YYYY-MM-DD".
 */
export function studyGrid(
  days: readonly string[],
  today: string,
  studiedToday: boolean,
): { cells: StudyCell[]; studied: number } {
  const set = new Set(days);
  const t = Date.parse(`${today}T00:00:00Z`);
  const cells: StudyCell[] = [];
  for (let i = GRID_DAYS - 1; i >= 0; i--) {
    const date = new Date(t - i * DAY_MS).toISOString().slice(0, 10);
    const isToday = i === 0;
    cells.push({ date, today: isToday, studied: isToday ? studiedToday : set.has(date) });
  }
  return { cells, studied: cells.filter((c) => c.studied).length };
}

/** Dấu triện hôm nay "đóng" đúng một lần mỗi ngày: đã học hôm nay và chưa đóng cho ngày này. */
export function shouldStamp(studiedToday: boolean, today: string, lastStamped: string | null): boolean {
  return studiedToday && lastStamped !== today;
}
