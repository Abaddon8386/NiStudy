import { describe, expect, it } from "vitest";
import { clamp01, passProgress, pinnedProgress } from "./scroll";

describe("tiến độ cuộn của cảnh", () => {
  it("clamp01 giữ trong [0, 1]", () => {
    expect([clamp01(-1), clamp01(0.4), clamp01(2)]).toEqual([0, 0.4, 1]);
  });

  it("pinnedProgress: 0 khi đỉnh chạm đỉnh màn, 1 khi đáy chạm đáy màn", () => {
    // Khối cao 3000, màn 1000: chạy được 2000px.
    expect(pinnedProgress(200, 3000, 1000)).toBe(0); // chưa tới
    expect(pinnedProgress(0, 3000, 1000)).toBe(0);
    expect(pinnedProgress(-1000, 3000, 1000)).toBe(0.5);
    expect(pinnedProgress(-2000, 3000, 1000)).toBe(1);
    expect(pinnedProgress(-5000, 3000, 1000)).toBe(1);
  });

  it("pinnedProgress: khối không cao hơn màn thì luôn 0 (không chia cho 0)", () => {
    expect(pinnedProgress(-100, 800, 1000)).toBe(0);
  });

  it("passProgress: 0 khi đỉnh ở 85% màn, 1 khi lên tới 25%", () => {
    expect(passProgress(850, 1000)).toBe(0);
    expect(passProgress(550, 1000)).toBeCloseTo(0.5);
    expect(passProgress(250, 1000)).toBe(1);
    expect(passProgress(-400, 1000)).toBe(1);
  });
});
