import { describe, expect, it } from "vitest";
import { estimateMinutes, examCountdown } from "./dashboard";

describe("estimateMinutes", () => {
  it("0 khi hàng đợi rỗng", () => {
    expect(estimateMinutes(0, 10)).toBe(0);
    expect(estimateMinutes(0, null)).toBe(0);
  });
  it("mặc định 20 giây khi chưa có trung vị", () => {
    expect(estimateMinutes(3, null)).toBe(1); // 60s
    expect(estimateMinutes(4, null)).toBe(2); // 80s
  });
  it("dùng trung vị và làm tròn lên", () => {
    expect(estimateMinutes(10, 7.5)).toBe(2); // 75s
    expect(estimateMinutes(1, 1)).toBe(1);
  });
});

describe("examCountdown", () => {
  const today = "2026-11-19";
  it("null khi chưa đặt", () => expect(examCountdown(null, today)).toBeNull());
  it("hôm nay thi", () => expect(examCountdown(today, today)).toEqual({ kind: "today" }));
  it("còn N ngày", () => {
    expect(examCountdown("2026-12-06", today)).toEqual({ kind: "days", days: 17 });
    expect(examCountdown("2026-11-20", today)).toEqual({ kind: "days", days: 1 });
  });
  it("đã qua", () => expect(examCountdown("2026-11-18", today)).toEqual({ kind: "past" }));
});
