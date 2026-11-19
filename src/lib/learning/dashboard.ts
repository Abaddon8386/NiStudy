import { createClient } from "@/lib/supabase/client";
import { dayEnd, studyDate } from "@/lib/domain/study-day";
import { parseDashboard, type DashboardData } from "@/lib/domain/dashboard-view";
import { deviceTimeZone } from "./api";

export type DashboardResult =
  | { ok: true; data: DashboardData; today: string }
  | { ok: false; error: string };

/** Gọi RPC get_dashboard với ngày học và mốc hết ngày theo múi giờ thiết bị (FR-21). */
export async function loadDashboard(now: Date = new Date()): Promise<DashboardResult> {
  try {
    const tz = deviceTimeZone();
    const today = studyDate(now, tz);
    const { data, error } = await createClient().rpc("get_dashboard", {
      p_study_date: today,
      p_day_end: dayEnd(now, tz).toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    const parsed = parseDashboard(data);
    if (!parsed) return { ok: false, error: "bad-dashboard" };
    return { ok: true, data: parsed, today };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}
