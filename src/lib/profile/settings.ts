import { createClient } from "@/lib/supabase/client";

export type Level = "N5" | "N4";

export const NEW_PER_DAY_MIN = 5;
export const NEW_PER_DAY_MAX = 30;
export const NEW_PER_DAY_DEFAULT = 10;
export const REVIEW_LIMIT_MIN = 50;
export const REVIEW_LIMIT_MAX = 500;
export const REVIEW_LIMIT_DEFAULT = 100;

export interface ProfileSettings {
  level: Level;
  knowsKana: boolean;
  newPerDay: number;
  reviewLimit: number;
  /** YYYY-MM-DD hoặc null. */
  examDate: string | null;
  /** ISO UTC hoặc null (chưa hoàn tất khởi đầu). */
  onboardedAt: string | null;
}

export type SettingsPatch = Partial<ProfileSettings>;
export type SettingsErrors = Partial<Record<"newPerDay" | "reviewLimit" | "examDate", string>>;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isRealDate(s: string): boolean {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/** Ngày lịch trên thiết bị (YYYY-MM-DD), dùng làm `today` cho validateSettings. */
export function localDateString(now: Date = new Date()): string {
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(now.getFullYear(), 4)}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** Chuỗi nhập -> số; rỗng hoặc không phải số thập phân thường thì NaN. */
export function parseNumberInput(text: string): number {
  const t = text.trim();
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

function outOfRange(v: unknown, min: number, max: number): boolean {
  return typeof v !== "number" || !Number.isInteger(v) || v < min || v > max;
}

/**
 * Kiểm các trường có mặt trong `partial`. Ngày thi: null (xóa) luôn hợp lệ; chuỗi phải là ngày thật
 * và không trước `today` (FR-07).
 */
export function validateSettings(partial: SettingsPatch, today: string): SettingsErrors {
  const errors: SettingsErrors = {};
  if ("newPerDay" in partial && outOfRange(partial.newPerDay, NEW_PER_DAY_MIN, NEW_PER_DAY_MAX)) {
    errors.newPerDay = `Mục tiêu thẻ mới phải từ ${NEW_PER_DAY_MIN} đến ${NEW_PER_DAY_MAX}.`;
  }
  if ("reviewLimit" in partial && outOfRange(partial.reviewLimit, REVIEW_LIMIT_MIN, REVIEW_LIMIT_MAX)) {
    errors.reviewLimit = `Giới hạn ôn phải từ ${REVIEW_LIMIT_MIN} đến ${REVIEW_LIMIT_MAX}.`;
  }
  if ("examDate" in partial && partial.examDate !== null && partial.examDate !== undefined) {
    if (!isRealDate(partial.examDate)) errors.examDate = "Ngày thi không hợp lệ.";
    else if (partial.examDate < today) errors.examDate = "Ngày thi phải từ hôm nay trở đi.";
  }
  return errors;
}

const SELECT_COLUMNS = "level, knows_kana, new_per_day, review_limit, exam_date, onboarded_at";

/** Chỉ các cột client được UPDATE (khớp grant trong migration). */
export function toRow(patch: SettingsPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.level !== undefined) row.level = patch.level;
  if (patch.knowsKana !== undefined) row.knows_kana = patch.knowsKana;
  if (patch.newPerDay !== undefined) row.new_per_day = patch.newPerDay;
  if (patch.reviewLimit !== undefined) row.review_limit = patch.reviewLimit;
  if (patch.examDate !== undefined) row.exam_date = patch.examDate;
  if (patch.onboardedAt !== undefined) row.onboarded_at = patch.onboardedAt;
  return row;
}

interface ProfileRow {
  level: Level;
  knows_kana: boolean;
  new_per_day: number;
  review_limit: number;
  exam_date: string | null;
  onboarded_at: string | null;
}

export function fromRow(r: ProfileRow): ProfileSettings {
  return {
    level: r.level,
    knowsKana: r.knows_kana,
    newPerDay: r.new_per_day,
    reviewLimit: r.review_limit,
    examDate: r.exam_date,
    onboardedAt: r.onboarded_at,
  };
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** Đọc profile của người đăng nhập hiện tại (phiên cục bộ, RLS vẫn là hàng rào thật). */
export async function fetchProfile(): Promise<Result<{ email: string; profile: ProfileSettings }>> {
  try {
    const supabase = createClient();
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return { ok: false, error: "no-session" };
    const { data, error } = await supabase
      .from("profiles")
      .select(SELECT_COLUMNS)
      .eq("user_id", s.session.user.id)
      .maybeSingle();
    if (error || !data) return { ok: false, error: error?.message ?? "no-profile" };
    return { ok: true, data: { email: s.session.user.email ?? "", profile: fromRow(data as ProfileRow) } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

/** Ghi các cột được phép của profile mình. */
export async function updateProfile(patch: SettingsPatch): Promise<Result<null>> {
  try {
    const supabase = createClient();
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return { ok: false, error: "no-session" };
    const { data, error } = await supabase
      .from("profiles")
      .update(toRow(patch))
      .eq("user_id", s.session.user.id)
      .select("user_id");
    if (error) return { ok: false, error: error.message };
    // RLS lọc mất dòng thì update không báo lỗi mà trả 0 dòng: coi là chưa lưu.
    if (!data || data.length === 0) return { ok: false, error: "no-row-updated" };
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}
