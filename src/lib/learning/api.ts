import { createClient } from "@/lib/supabase/client";
import { dayEnd, studyDate } from "@/lib/domain/study-day";
import { buildSession, type SessionCard, type TodayQueue } from "@/lib/domain/queue";
import { SubmitError, type SubmitResult } from "@/lib/domain/review-outbox";
import type { ReviewPayload } from "@/lib/domain/review";
import { fetchProfile } from "@/lib/profile/settings";

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export type LoadResult = { ok: true; cards: SessionCard[] } | { ok: false; error: string };

/** Tải hàng đợi hôm nay (RPC get_today_queue) và dựng danh sách thẻ của phiên (FR-13, FR-16). */
export async function loadTodaySession(now: Date = new Date()): Promise<LoadResult> {
  try {
    const profile = await fetchProfile();
    if (!profile.ok) return { ok: false, error: profile.error };
    const tz = deviceTimeZone();
    const { data, error } = await createClient().rpc("get_today_queue", {
      p_study_date: studyDate(now, tz),
      p_day_end: dayEnd(now, tz).toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    const q = data as TodayQueue | null;
    if (!q || !Array.isArray(q.due) || !Array.isArray(q.new_candidates)) {
      return { ok: false, error: "bad-queue" };
    }
    const p = profile.data.profile;
    return {
      ok: true,
      cards: buildSession({
        due: q.due,
        newCandidates: q.new_candidates,
        newDoneToday: q.new_done_today ?? 0,
        newPerDay: p.newPerDay,
        knowsKana: p.knowsKana,
      }),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

/** Gửi một lô lượt ôn. Lỗi dữ liệu (mã 22xxx) là vĩnh viễn; còn lại (mạng, phiên hết hạn) thử lại được. */
export async function submitReviews(batch: ReviewPayload[]): Promise<SubmitResult[]> {
  const { data, error } = await createClient().rpc("submit_reviews", { p_reviews: batch });
  if (error) throw new SubmitError(error.message, /^22/.test(error.code ?? ""));
  return (data ?? []) as SubmitResult[];
}
