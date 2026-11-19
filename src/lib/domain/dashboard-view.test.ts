import { describe, expect, it } from "vitest";
import { buildDashboardView, parseDashboard, type DashboardData } from "./dashboard-view";

const base: DashboardData = {
  dueCount: 24, newDoneToday: 6, newPerDay: 10, reviewLimit: 100, streak: 6, totalDays: 19,
  xpTotal: 300, xpToday: 6, medianSeconds: null, examDate: null, studiedToday: true,
};

describe("buildDashboardView", () => {
  it("cộng thẻ đến hạn và thẻ mới còn lại; mặc định 20 giây/thẻ", () => {
    const v = buildDashboardView(base, "2026-11-19");
    expect(v.total).toBe(28);
    expect(v.minutes).toBe(10); // 28 x 20 / 60 = 9,33 -> 10
    expect(v.newProgress).toEqual({ done: 6, goal: 10, pct: 60 });
    expect(v.done).toBe(false);
  });
  it("chặn thẻ đến hạn theo giới hạn ôn mỗi ngày", () => {
    expect(buildDashboardView({ ...base, dueCount: 250, reviewLimit: 100 }, "2026-11-19").dueToday).toBe(100);
  });
  it("thẻ mới vượt mục tiêu không âm; hết thẻ thì done", () => {
    const v = buildDashboardView({ ...base, dueCount: 0, newDoneToday: 12 }, "2026-11-19");
    expect(v.newRemaining).toBe(0);
    expect(v.done).toBe(true);
    expect(v.minutes).toBe(0);
    expect(v.newProgress.pct).toBe(100);
  });
  it("mục tiêu 0 không chia cho 0", () => {
    expect(buildDashboardView({ ...base, newPerDay: 0, newDoneToday: 0 }, "2026-11-19").newProgress.pct).toBe(0);
  });
  it("dùng trung vị khi có", () => {
    expect(buildDashboardView({ ...base, medianSeconds: 30 }, "2026-11-19").minutes).toBe(14);
  });
  it("đếm ngược ngày thi", () => {
    expect(buildDashboardView({ ...base, examDate: "2026-12-19" }, "2026-11-19").exam).toEqual({ kind: "days", days: 30 });
    expect(buildDashboardView({ ...base, examDate: "2026-11-19" }, "2026-11-19").exam).toEqual({ kind: "today" });
    expect(buildDashboardView({ ...base, examDate: "2026-11-01" }, "2026-11-19").exam).toEqual({ kind: "past" });
  });
});

describe("parseDashboard", () => {
  it("chuyển snake_case", () => {
    const d = parseDashboard({
      due_count: 3, new_done_today: 1, new_per_day: 10, review_limit: 100, streak: 2, total_days: 5,
      xp_total: 40, xp_today: 4, median_seconds_7d: 12.5, exam_date: "2026-12-06", studied_today: true,
    });
    expect(d).toMatchObject({ dueCount: 3, totalDays: 5, medianSeconds: 12.5, examDate: "2026-12-06", studiedToday: true });
  });
  it("từ chối dữ liệu hỏng", () => {
    expect(parseDashboard(null)).toBeNull();
    expect(parseDashboard({})).toBeNull();
  });
});
