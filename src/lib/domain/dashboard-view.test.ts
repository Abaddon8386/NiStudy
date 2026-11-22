import { describe, expect, it } from "vitest";
import { buildDashboardView, parseDashboard, shouldStamp, studyGrid, type DashboardData } from "./dashboard-view";

const base: DashboardData = {
  dueCount: 24, newDoneToday: 6, newPerDay: 10, reviewLimit: 100, streak: 6, totalDays: 19,
  xpTotal: 300, xpToday: 6, medianSeconds: null, examDate: null, studiedToday: true, level: "N5", studyDays: [],
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
  it("RPC cũ không có study_days_35/level: null (ẩn lưới)", () => {
    const d = parseDashboard({ due_count: 0, new_per_day: 10 });
    expect(d?.studyDays).toBeNull();
    expect(d?.level).toBeNull();
  });
  it("study_days_35 bỏ phần tử sai định dạng; level chỉ nhận N5/N4", () => {
    const d = parseDashboard({
      due_count: 0, new_per_day: 10, level: "N3", study_days_35: ["2026-11-01", 5, "1/11/2026", null, "2026-11-19"],
    });
    expect(d?.studyDays).toEqual(["2026-11-01", "2026-11-19"]);
    expect(d?.level).toBeNull();
    expect(parseDashboard({ due_count: 0, new_per_day: 10, level: "N4" })?.level).toBe("N4");
  });
  it("từ chối dữ liệu hỏng", () => {
    expect(parseDashboard(null)).toBeNull();
    expect(parseDashboard({})).toBeNull();
  });
});

describe("studyGrid", () => {
  it("35 ô từ cũ đến mới, ô cuối là hôm nay, đếm ngày đã học", () => {
    const g = studyGrid(["2026-10-16", "2026-11-10", "2026-11-19"], "2026-11-19", true);
    expect(g.cells).toHaveLength(35);
    expect(g.cells[0]).toEqual({ date: "2026-10-16", studied: true, today: false });
    expect(g.cells[34]).toEqual({ date: "2026-11-19", studied: true, today: true });
    expect(g.cells.filter((c) => c.today)).toHaveLength(1);
    expect(g.studied).toBe(3);
  });
  it("ngày ngoài cửa sổ không tính", () => {
    const g = studyGrid(["2026-10-15", "2026-11-20"], "2026-11-19", false);
    expect(g.studied).toBe(0);
  });
  it("hôm nay chưa học: ô cuối chưa đóng dù danh sách có hôm nay", () => {
    const g = studyGrid(["2026-11-19", "2026-11-18"], "2026-11-19", false);
    expect(g.cells[34]).toEqual({ date: "2026-11-19", studied: false, today: true });
    expect(g.studied).toBe(1);
  });
  it("qua biên tháng và năm", () => {
    const g = studyGrid(["2025-12-31", "2026-01-01", "2025-12-01"], "2026-01-02", true);
    expect(g.cells[0].date).toBe("2025-11-29");
    expect(g.cells[32]).toMatchObject({ date: "2025-12-31", studied: true });
    expect(g.cells[33]).toMatchObject({ date: "2026-01-01", studied: true });
    expect(g.cells[2]).toMatchObject({ date: "2025-12-01", studied: true });
    expect(g.studied).toBe(4);
  });
  it("tháng 2 năm nhuận", () => {
    const g = studyGrid(["2028-02-29"], "2028-03-01", false);
    expect(g.cells[33]).toMatchObject({ date: "2028-02-29", studied: true });
    expect(g.cells[34].date).toBe("2028-03-01");
  });
});

describe("shouldStamp", () => {
  it("đóng một lần mỗi ngày, chỉ khi đã học", () => {
    expect(shouldStamp(true, "2026-11-19", null)).toBe(true);
    expect(shouldStamp(true, "2026-11-19", "2026-11-18")).toBe(true);
    expect(shouldStamp(true, "2026-11-19", "2026-11-19")).toBe(false);
    expect(shouldStamp(false, "2026-11-19", null)).toBe(false);
  });
});
